import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Info, Bus, Train, Eye, EyeOff, Filter, Layers, Search, X, MapPin, Navigation, Loader, XCircle, Clock, Route as RouteIcon } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { useLocation } from 'react-router-dom';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle zoom-based visibility
const ZoomHandler = ({ setCurrentZoom }) => {
    const map = useMap();

    useEffect(() => {
        const handleZoom = () => {
            setCurrentZoom(map.getZoom());
        };

        map.on('zoomend', handleZoom);
        setCurrentZoom(map.getZoom());

        return () => {
            map.off('zoomend', handleZoom);
        };
    }, [map, setCurrentZoom]);

    return null;
};

// Component to handle map fly-to actions
const MapController = ({ targetLocation }) => {
    const map = useMap();

    useEffect(() => {
        if (targetLocation) {
            map.flyTo(
                [targetLocation.lat, targetLocation.lng],
                17,
                {
                    duration: 1.5,
                    easeLinearity: 0.25
                }
            );
        }
    }, [targetLocation, map]);

    return null;
};

// Component to handle tile layer changes (dark mode)
const TileLayerController = ({ isDarkMode }) => {
    const map = useMap();

    useEffect(() => {
        // Remove all existing tile layers
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });

        // Add appropriate tile layer
        const tileUrl = isDarkMode
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        const attribution = isDarkMode
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

        L.tileLayer(tileUrl, {
            attribution: attribution,
            maxZoom: 19
        }).addTo(map);
    }, [isDarkMode, map]);

    return null;
};

const NetworkMapPage = () => {
    const { t } = useGlobalContext();
    const location = useLocation();
    const [routes, setRoutes] = useState({});
    const [stops, setStops] = useState(null);
    const [stopsList, setStopsList] = useState([]);
    const [routesList, setRoutesList] = useState([]);
    const [currentZoom, setCurrentZoom] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStops, setFilteredStops] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedStop, setSelectedStop] = useState(null);
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const searchRef = useRef(null);
    const ZOOM_THRESHOLD = 14;
    const [targetLocation, setTargetLocation] = useState(null);

    // ========== ROUTING STATE ==========
    const [routingMode, setRoutingMode] = useState(false);
    const [routingDestination, setRoutingDestination] = useState(null);
    const [showSourceSearch, setShowSourceSearch] = useState(false);
    const [sourceSearchQuery, setSourceSearchQuery] = useState('');
    const [filteredSourceStops, setFilteredSourceStops] = useState([]);
    const [routingLoading, setRoutingLoading] = useState(false);
    const [routingData, setRoutingData] = useState(null);
    const [routingError, setRoutingError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const sourceSearchRef = useRef(null);

    // Helper function to extract base route name
    const getBaseRouteName = (shapeId) => {
        let parts = shapeId.split('_');

        if (parts[parts.length - 1].toLowerCase().startsWith('t')) {
            parts.pop();
        }

        if (!isNaN(parts[parts.length - 1])) {
            parts.pop();
        }

        return parts.join(' ').toUpperCase();
    };

    // Helper function to determine route color
    const getRouteColor = (shapeId) => {
        let id = shapeId.toLowerCase();

        if (id.includes('red')) return '#EF4444';
        else if (id.includes('orange')) return '#F97316';
        else if (id.includes('blue')) return '#3B82F6';
        else if (id.includes('green')) return '#10B981';

        return '#F97316'; // Default to orange
    };

    // Load GeoJSON data
    useEffect(() => {
        // Load routes
        fetch('/routes.geojson')
            .then(response => response.json())
            .then(data => {
                const routeGroups = {};

                data.features.forEach(feature => {
                    const routeName = getBaseRouteName(feature.properties.shape_id);
                    const color = getRouteColor(feature.properties.shape_id);

                    if (!routeGroups[routeName]) {
                        routeGroups[routeName] = {
                            name: routeName,
                            color: color,
                            features: [],
                            visible: true
                        };
                    }

                    routeGroups[routeName].features.push(feature);
                });

                setRoutes(routeGroups);
                setRoutesList(Object.keys(routeGroups).sort());
            })
            .catch(err => {
                console.error("Could not load routes:", err);
                // Set empty routes on error
                setRoutes({});
                setRoutesList([]);
            });

        // Load stops
        fetch('/stops.geojson')
            .then(response => response.json())
            .then(data => {
                setStops(data);

                // Extract stops list for search
                const stopsArray = data.features.map(feature => ({
                    name: feature.properties.stop_name,
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0]
                }));
                setStopsList(stopsArray);

                // Check for URL parameters to zoom to a specific stop
                const params = new URLSearchParams(location.search);
                const stopName = params.get('stop');
                const lat = parseFloat(params.get('lat'));
                const lng = parseFloat(params.get('lng'));

                if (stopName && !isNaN(lat) && !isNaN(lng)) {
                    // Set the selected stop from URL params
                    setSelectedStop({ name: stopName, lat, lng });
                    setSearchQuery(stopName);
                }
            })
            .catch(err => {
                console.error("Could not load stops:", err);
            });
    }, [location.search]);

    // Search functionality
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredStops([]);
            setShowDropdown(false);
            return;
        }

        const filtered = stopsList.filter(stop =>
            stop.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredStops(filtered);
    }, [searchQuery, stopsList]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleStopSelect = (stop) => {
        setSelectedStop(stop);
        setSearchQuery(stop.name);
        setShowDropdown(false);
        setTargetLocation({ lat: stop.lat, lng: stop.lng });

        // On mobile, scroll to map when a stop is selected
        if (window.innerWidth < 1024 && mapContainerRef.current) {
            mapContainerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setFilteredStops([]);
        setShowDropdown(false);
        setSelectedStop(null);
    };

    const toggleRoute = (routeName) => {
        setRoutes(prev => ({
            ...prev,
            [routeName]: {
                ...prev[routeName],
                visible: !prev[routeName].visible
            }
        }));
    };

    const toggleAll = (state) => {
        setRoutes(prev => {
            const updated = {};
            Object.keys(prev).forEach(key => {
                updated[key] = { ...prev[key], visible: state };
            });
            return updated;
        });
    };

    const allVisible = Object.values(routes).every(r => r.visible);
    const visibleCount = Object.values(routes).filter(r => r.visible).length;

    // ========== ROUTING FUNCTIONS ==========

    const handleStartRouting = (stop) => {
        setRoutingDestination(stop);
        setRoutingMode(true);
        setShowSourceSearch(true);
        setIsDarkMode(false);  // Start in light mode
    };

    const handleSourceSearch = (query) => {
        setSourceSearchQuery(query);
        if (query.trim() === '') {
            setFilteredSourceStops([]);
            return;
        }

        const filtered = stopsList.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase()) &&
            s.name !== routingDestination.name  // Exclude destination
        );
        setFilteredSourceStops(filtered);
    };

    const handleSourceSelect = async (sourceStop) => {
        setShowSourceSearch(false);
        setSourceSearchQuery('');
        setFilteredSourceStops([]);
        setRoutingLoading(true);
        setRoutingError(null);

        try {
            // Call routing API
            const response = await fetch('http://localhost:8000/find-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source_stop_id: findStopIdByName(sourceStop.name),
                    destination_stop_id: findStopIdByName(routingDestination.name)
                })
            });

            if (!response.ok) {
                throw new Error('Route not found');
            }

            const data = await response.json();

            if (data.success) {
                setRoutingData(data);
                setIsDarkMode(true);  // Switch to dark mode
                setCurrentZoom(13);   // Zoom out to see full route
            } else {
                setRoutingError(data.error || 'Failed to find route');
            }
        } catch (error) {
            console.error('Routing error:', error);
            setRoutingError('Failed to connect to routing service. Make sure the backend is running on port 8000.');
        } finally {
            setRoutingLoading(false);
        }
    };

    const handleClearRouting = () => {
        setRoutingMode(false);
        setRoutingDestination(null);
        setRoutingData(null);
        setRoutingError(null);
        setShowSourceSearch(false);
        setSourceSearchQuery('');
        setFilteredSourceStops([]);
        setIsDarkMode(false);
        setRoutingLoading(false);
    };

    const findStopIdByName = (stopName) => {
        const stop = stopsList.find(s => s.name === stopName);
        if (!stop) {
            // Find in GeoJSON
            const feature = stops.features.find(f => f.properties.stop_name === stopName);
            return feature ? feature.properties.stop_id : null;
        }

        // Find in original GeoJSON data
        const feature = stops.features.find(f =>
            f.properties.stop_name === stopName ||
            (f.geometry.coordinates[1] === stop.lat && f.geometry.coordinates[0] === stop.lng)
        );

        return feature ? feature.properties.stop_id : null;
    };

    // Style function for routes
    const routeStyle = (feature, routeColor) => {
        return {
            color: routeColor,
            weight: 5,
            opacity: 0.8
        };
    };

    // Point to layer function for stops
    const pointToLayer = (feature, latlng) => {
        return L.circleMarker(latlng, {
            radius: 4,
            fillColor: "#ffffff",
            color: "#333",
            weight: 2,
            opacity: 1,
            fillOpacity: 1
        });
    };

    // On each feature function for routes (adds labels)
    const onEachRoute = (feature, layer, routeName) => {
        layer.bindTooltip(routeName, {
            permanent: true,
            direction: 'center',
            className: 'route-label'
        });
    };

    // On each feature function for stops
    const onEachStop = (feature, layer) => {
        if (feature.properties && feature.properties.stop_name) {
            const stopName = feature.properties.stop_name;
            const coords = feature.geometry.coordinates;

            const popupContent = `
                <div class="font-sans min-w-[160px] p-1">
                    <div class="font-bold text-gray-900 mb-3 text-base border-b pb-2">${stopName}</div>
                    ${!routingMode ? `
                        <button 
                            onclick="window.startRoutingFromStop('${stopName}', ${coords[1]}, ${coords[0]})"
                            class="flex items-center gap-2 px-4 py-2.5 bg-accent-orange text-white rounded-xl hover:bg-orange-600 transition-colors w-full justify-center font-bold text-sm shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 16 16 12 12 8"></polyline>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            Start Routing Here
                        </button>
                    ` : ''}
                </div>
            `;

            layer.bindPopup(popupContent, {
                className: 'custom-popup'
            });
        }
    };

    // Global function for popup button
    useEffect(() => {
        window.startRoutingFromStop = (stopName, lat, lng) => {
            handleStartRouting({ name: stopName, lat, lng });
        };

        return () => {
            delete window.startRoutingFromStop;
        };
    }, [routingMode]);

    return (
        <div className="pt-24 pb-0 min-h-screen bg-gray-50 flex flex-col font-sans">
            <style>{`
                .leaflet-container {
                    font-family: 'Poppins', sans-serif;
                }
                .route-label {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    font-weight: 900;
                    font-size: 14px;
                    text-shadow: 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff;
                }
                .hide-labels .route-label {
                    display: none !important;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 12px;
                    font-family: 'Poppins', sans-serif;
                }
                .leaflet-popup-content {
                    margin: 10px 14px;
                }
                .custom-popup .leaflet-popup-content-wrapper {
                    padding: 0;
                }
            `}</style>

            <div className="my-container flex-grow flex flex-col">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Map className="w-8 h-8 text-accent-orange" />
                        {t('mapTitle')}
                    </h1>
                    <p className="text-gray-500">{t('mapSubtitle')}</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6" ref={searchRef}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value.trim()) setShowDropdown(true);
                            }}
                            onFocus={() => searchQuery && setShowDropdown(true)}
                            placeholder="Search for stops or stations..."
                            className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-accent-orange transition-colors text-gray-900 placeholder-gray-400 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showDropdown && filteredStops.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
                            {filteredStops.map((stop, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleStopSelect(stop)}
                                    className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                >
                                    <MapPin className="w-4 h-4 text-accent-orange flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="font-medium text-gray-900">{stop.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results Message */}
                    {showDropdown && searchQuery && filteredStops.length === 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 text-center">
                            <p className="text-gray-500">No stops found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>

                {/* ========== STATIC ROUTING INFO PANEL ========== */}
                {routingMode && routingData && (
                    <div className="mb-6 w-full max-w-[1600px] mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

                            {/* Row 1: Header (Route Found + Stats) */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <RouteIcon className="w-6 h-6 text-accent-orange" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Route Found!</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>{routingData.total_distance} km</span>
                                        <span>•</span>
                                        <span>{routingData.total_time} min</span>
                                        <span>•</span>
                                        <span>{routingData.path_stops.length} stops</span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Gray Box + Clear Button */}
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Route Visualizer (Gray Box) */}
                                <div className="flex-grow flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 items-center">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-gray-700">{routingData.path_stops[0].stop_name}</span>
                                    </div>
                                    <div className="hidden md:block flex-grow border-t-2 border-dashed border-gray-300 self-center mx-4"></div>
                                    <div className="md:hidden h-4 border-l-2 border-dashed border-gray-300 ml-2"></div>
                                    <div className="flex items-center gap-2">
                                        <Navigation className="w-5 h-5 text-red-600" />
                                        <span className="font-medium text-gray-700">{routingData.path_stops[routingData.path_stops.length - 1].stop_name}</span>
                                    </div>
                                </div>

                                {/* Clear Button */}
                                <button
                                    onClick={handleClearRouting}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors font-bold whitespace-nowrap"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Clear Route
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Source Search Overlay */}
                {showSourceSearch && routingDestination && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-start justify-center pt-32" onClick={() => setShowSourceSearch(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()} ref={sourceSearchRef}>
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">Select Starting Stop</h3>
                                    <button
                                        onClick={() => {
                                            setShowSourceSearch(false);
                                            setSourceSearchQuery('');
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <Navigation className="w-5 h-5 text-accent-orange" />
                                        <div>
                                            <p className="text-sm text-gray-600">Destination</p>
                                            <p className="font-bold text-gray-900">{routingDestination.name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={sourceSearchQuery}
                                        onChange={(e) => handleSourceSearch(e.target.value)}
                                        placeholder="Search for your starting stop..."
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-accent-orange transition-colors text-gray-900 placeholder-gray-400"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {filteredSourceStops.length > 0 ? (
                                    filteredSourceStops.map((stop, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSourceSelect(stop)}
                                            className="w-full px-6 py-4 text-left hover:bg-orange-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                        >
                                            <MapPin className="w-5 h-5 text-accent-orange flex-shrink-0" />
                                            <div className="flex-grow">
                                                <p className="font-medium text-gray-900">{stop.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                                                </p>
                                            </div>
                                            <Navigation className="w-4 h-4 text-gray-400" />
                                        </button>
                                    ))
                                ) : sourceSearchQuery ? (
                                    <div className="px-6 py-12 text-center text-gray-500">
                                        No stops found matching "{sourceSearchQuery}"
                                    </div>
                                ) : (
                                    <div className="px-6 py-12 text-center text-gray-500">
                                        Start typing to search for a stop...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {routingLoading && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
                            <div className="flex justify-center mb-4">
                                <Loader className="w-12 h-12 text-accent-orange animate-spin" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Finding Best Route...</h3>
                            <p className="text-gray-600">Calculating optimal path using Dijkstra's algorithm</p>
                        </div>
                    </div>
                )}





                {/* Error Message */}
                {routingError && (
                    <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-2xl px-4">
                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-xl p-6">
                            <div className="flex items-start gap-4">
                                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-red-900 mb-2">Routing Error</h3>
                                    <p className="text-red-700">{routingError}</p>
                                </div>
                                <button
                                    onClick={() => setRoutingError(null)}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6 h-[75vh] w-full max-w-[1600px] mx-auto px-4 mb-12">

                    {/* Sidebar Control Panel */}
                    <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4 h-full overflow-hidden">
                        {routingMode && routingData ? (
                            /* Route Instructions Panel */
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-full">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Navigation className="w-5 h-5 text-accent-orange" />
                                    Journey Steps
                                </h3>
                                <div className="space-y-4 overflow-y-auto flex-grow pr-2 pl-2">
                                    {routingData.route_segments.map((segment, index) => (
                                        <div key={index} className="relative pl-8 pb-8 last:pb-0 border-l-2 border-gray-100 last:border-l-0 ml-2">
                                            <div
                                                className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: segment.color }}
                                            ></div>
                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                <p className="text-xs text-gray-500 font-bold mb-1">STEP {index + 1}</p>
                                                <p className="font-bold text-gray-900 mb-1">
                                                    Take <span style={{ color: segment.color }}>{segment.route_name}</span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {segment.stops.length} stops • {Math.round(segment.stops.length * 2)} min approx
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Destination Marker */}
                                    <div className="relative pl-6 pt-2">
                                        <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                                        <p className="font-bold text-gray-900">Arrive at {routingData.path_stops[routingData.path_stops.length - 1].stop_name}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Active Routes Panel */
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-full bg-accent-orange/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-accent-orange font-bold text-lg">
                                        <Layers className="w-5 h-5" />
                                        <span>{t('activeRoutes') || 'Available Services'}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                        {visibleCount} {t('visible') || 'visible'}
                                    </span>
                                </div>

                                <div className="flex gap-2 mb-6">
                                    <button
                                        onClick={() => toggleAll(true)}
                                        className="flex-1 py-3 px-4 rounded-xl bg-accent-orange text-white shadow-lg shadow-orange-500/30 transition-all font-semibold hover:bg-orange-600"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            Show All
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => toggleAll(false)}
                                        className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all font-semibold"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <EyeOff className="w-4 h-4" />
                                            Hide All
                                        </span>
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {routesList.map((routeName) => {
                                        const route = routes[routeName];
                                        return (
                                            <div
                                                key={routeName}
                                                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${route.visible
                                                    ? 'bg-white border-orange-100 shadow-sm'
                                                    : 'bg-gray-50 border-transparent opacity-60'
                                                    }`}
                                                onClick={() => toggleRoute(routeName)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-3 h-3 rounded-full shadow-sm"
                                                            style={{ backgroundColor: route.color }}
                                                        ></div>
                                                        <span className={`font-bold text-sm ${route.visible ? 'text-gray-800' : 'text-gray-500'}`}>
                                                            {routeName}
                                                        </span>
                                                    </div>
                                                    {route.visible ? (
                                                        <Eye className="w-4 h-4 text-accent-orange" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {routesList.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <Bus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No routes data available</p>
                                            <p className="text-xs mt-1">Please ensure routes.geojson is in the public folder</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Info Card */}
                        {!routingMode && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-accent-orange" />
                                    {t('legend') || 'Map Legend'}
                                </h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-white border-2 border-gray-400"></span>
                                        <span>Bus/Train Stop</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-1 rounded-full bg-accent-orange"></span>
                                        <span>Transit Route</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-500">
                                            💡 Zoom in to see stops and route labels
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map Container */}
                    <div ref={mapContainerRef} className={`flex-grow bg-gray-100 rounded-3xl shadow-sm border border-gray-200 overflow-hidden relative ${currentZoom < ZOOM_THRESHOLD ? 'hide-labels' : ''}`}>
                        <MapContainer
                            center={[33.6844, 73.0479]}
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            whenCreated={mapInstance => { mapRef.current = mapInstance; }}
                            className="z-0"
                        >
                            <ZoomHandler setCurrentZoom={setCurrentZoom} />
                            <MapController targetLocation={targetLocation} />
                            <TileLayerController isDarkMode={isDarkMode} />

                            {/* OVERVIEW MODE: Show all routes and stops */}
                            {!routingMode && (
                                <>
                                    {routesList.map(routeName => {
                                        const route = routes[routeName];
                                        if (!route.visible) return null;

                                        return route.features.map((feature, index) => (
                                            <GeoJSON
                                                key={`${routeName}-${index}`}
                                                data={feature}
                                                style={() => routeStyle(feature, route.color)}
                                                onEachFeature={(feature, layer) => onEachRoute(feature, layer, routeName)}
                                            />
                                        ));
                                    })}

                                    {stops && (
                                        <GeoJSON
                                            data={stops}
                                            pointToLayer={pointToLayer}
                                            onEachFeature={onEachStop}
                                        />
                                    )}
                                </>
                            )}

                            {/* ROUTING MODE: Show specific path and segments */}
                            {routingMode && routingData && (
                                <>
                                    {/* 1. Base Route Line (Thick, colorful segments) */}
                                    {/* 1. Base Route Line (Thick, colorful segments) */}
                                    {routingData.route_segments.map((segment, index) => (
                                        <React.Fragment key={`segment-${index}`}>
                                            {/* Glow effect */}
                                            <GeoJSON
                                                data={segment.geometry}
                                                style={{
                                                    color: segment.color,
                                                    weight: 8,
                                                    opacity: 0.4,
                                                    lineCap: 'round'
                                                }}
                                            />
                                            {/* Main line */}
                                            <GeoJSON
                                                data={segment.geometry}
                                                style={{
                                                    color: segment.color,
                                                    weight: 5,
                                                    opacity: 1,
                                                    lineCap: 'round'
                                                }}
                                            />
                                        </React.Fragment>
                                    ))}

                                    {/* 2. Start and End Markers */}
                                    {(() => {
                                        const startStop = routingData.path_stops[0];
                                        const endStop = routingData.path_stops[routingData.path_stops.length - 1];

                                        const startIcon = L.divIcon({
                                            className: 'custom-marker-start',
                                            html: `
                                                <div class="relative">
                                                    <div class="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-md absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping opacity-75"></div>
                                                    <div class="w-8 h-8 rounded-full bg-green-600 border-4 border-white shadow-xl flex items-center justify-center text-white relative z-10">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                    </div>
                                                    <div class="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap border border-gray-100 text-green-700 z-20">START</div>
                                                </div>
                                            `,
                                            iconSize: [40, 40],
                                            iconAnchor: [20, 20]
                                        });

                                        const endIcon = L.divIcon({
                                            className: 'custom-marker-end',
                                            html: `
                                                <div class="relative">
                                                    <div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping opacity-75"></div>
                                                    <div class="w-8 h-8 rounded-full bg-red-600 border-4 border-white shadow-xl flex items-center justify-center text-white relative z-10">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                                    </div>
                                                    <div class="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap border border-gray-100 text-red-700 z-20">END</div>
                                                </div>
                                            `,
                                            iconSize: [40, 40],
                                            iconAnchor: [20, 20]
                                        });

                                        return (
                                            <>
                                                <Marker position={[startStop.lat, startStop.lng]} icon={startIcon}>
                                                    <Popup className="custom-popup" offset={[0, -10]}>
                                                        <div className="font-bold text-center">
                                                            <div className="text-xs text-green-600 uppercase mb-1">Start Journey</div>
                                                            {startStop.stop_name}
                                                        </div>
                                                    </Popup>
                                                </Marker>

                                                <Marker position={[endStop.lat, endStop.lng]} icon={endIcon}>
                                                    <Popup className="custom-popup" offset={[0, -10]}>
                                                        <div className="font-bold text-center">
                                                            <div className="text-xs text-red-600 uppercase mb-1">Destination</div>
                                                            {endStop.stop_name}
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkMapPage;
