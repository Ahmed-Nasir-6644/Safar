import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
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

// Component to fit map bounds to a set of LatLng positions
const FitBoundsController = ({ positions }) => {
    const map = useMap();

    useEffect(() => {
        if (positions && positions.length > 1) {
            try {
                const bounds = L.latLngBounds(positions);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            } catch (e) {
                console.warn('FitBounds error:', e);
            }
        }
    }, [positions, map]);

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
        const id = (shapeId || '').toLowerCase();

        // Named color routes
        if (id.includes('red')) return '#EF4444';
        if (id.includes('blue')) return '#3B82F6';
        if (id.includes('green')) return '#10B981';
        if (id.includes('orange')) return '#F97316';

        // FR feeder routes — each gets a distinct color
        if (id.includes('fr_14') || id.includes('fr14')) return '#6366F1'; // indigo
        if (id.includes('fr_9') || id.includes('fr9')) return '#EF4444';  // red
        if (id.includes('fr_8c') || id.includes('fr8c')) return '#84CC16'; // lime
        if (id.includes('fr_8a') || id.includes('fr8a')) return '#10B981'; // emerald
        if (id.includes('fr_8') || id.includes('fr8')) return '#06B6D4';  // cyan
        if (id.includes('fr_7') || id.includes('fr7')) return '#F59E0B';  // amber
        if (id.includes('fr_6') || id.includes('fr6')) return '#0EA5E9';  // sky
        if (id.includes('fr_4') || id.includes('fr4')) return '#EC4899';  // pink
        if (id.includes('fr_3') || id.includes('fr3')) return '#8B5CF6';  // violet
        if (id.startsWith('fr')) return '#A78BFA';                         // any other FR

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

    // Handle route navigation from FindRoutesPage
    useEffect(() => {
        if (location.state?.routeToDisplay) {
            const route = location.state.routeToDisplay;
            setRoutingData(route);
            setRoutingMode(true);
            setIsDarkMode(true); // Switch to dark mode like normal routing

            // Support both old and new field names
            const pathStops = route.routeStops || route.path_stops || [];
            
            // Zoom to start point if available
            if (pathStops.length > 0) {
                const startPoint = pathStops[0];
                // Support both lat/lng and stop_lat/stop_lon field names
                const lat = startPoint.lat ?? startPoint.stop_lat;
                const lng = startPoint.lng ?? startPoint.stop_lon;
                if (lat !== undefined && lng !== undefined) {
                    setTargetLocation({ lat, lng });
                    setCurrentZoom(13);
                }
            }

            // Clear the state so it doesn't persist on refresh/navigation
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

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
                <div style="font-family:'Poppins',sans-serif; min-width:200px; padding:4px">
                    <div style="font-weight:700; color:#111827; margin-bottom:10px; font-size:14px; border-bottom:1px solid #e5e7eb; padding-bottom:8px; line-height:1.4">${stopName}</div>
                    ${!routingMode ? `
                        <button 
                            onclick="window.startRoutingFromStop('${stopName}', ${coords[1]}, ${coords[0]})"
                            style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:10px 16px; background:#f97316; color:white; border:none; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; font-family:'Poppins',sans-serif;"
                            onmouseover="this.style.background='#ea6c08'"
                            onmouseout="this.style.background='#f97316'"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                            Start Routing Here
                        </button>
                    ` : ''}
                </div>
            `;

            layer.bindPopup(popupContent, {
                className: 'custom-popup',
                maxWidth: 280,
                minWidth: 200
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
                {routingMode && routingData && (() => {
                    // Support both old and new field names from reference backend
                    const pathStops = routingData.routeStops || routingData.path_stops || [];
                    const totalDistance = routingData.totalDistance ?? routingData.total_distance ?? 0;
                    const totalTime = routingData.estimatedMinutes ?? routingData.total_time ?? 0;
                    const firstStop = pathStops[0] || {};
                    const lastStop = pathStops[pathStops.length - 1] || {};
                    
                    return (
                    <div className="mb-6 w-full max-w-[1600px] mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">

                            {/* Row 1: Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-2.5 bg-orange-100 rounded-xl shrink-0">
                                    <RouteIcon className="w-5 h-5 text-accent-orange" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900">Route Found!</h3>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 mt-0.5">
                                        <span>{typeof totalDistance === 'number' ? totalDistance.toFixed(2) : totalDistance} km</span>
                                        <span className="text-gray-300">•</span>
                                        <span>{totalTime} min</span>
                                        <span className="text-gray-300">•</span>
                                        <span>{pathStops.length} stops</span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Route visualizer + Clear button */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Route Visualizer */}
                                <div className="flex-grow flex flex-col sm:flex-row gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 items-start sm:items-center min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                                        <span className="font-medium text-gray-700 text-sm truncate">{firstStop.stop_name || 'Start'}</span>
                                    </div>
                                    <div className="hidden sm:block flex-grow border-t-2 border-dashed border-gray-300 self-center mx-2"></div>
                                    <div className="sm:hidden border-l-2 border-dashed border-gray-300 h-4 ml-2"></div>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Navigation className="w-4 h-4 text-red-600 shrink-0" />
                                        <span className="font-medium text-gray-700 text-sm truncate">{lastStop.stop_name || 'End'}</span>
                                    </div>
                                </div>

                                {/* Clear button */}
                                <button
                                    onClick={handleClearRouting}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors font-bold text-sm whitespace-nowrap shrink-0"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Clear Route
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })()}

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

                <div className="flex flex-col-reverse lg:flex-row gap-6 lg:h-[75vh] w-full max-w-[1600px] mx-auto px-4 mb-12">

                    {/* Sidebar Control Panel */}
                    <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4 lg:h-full overflow-hidden">
                        {routingMode && routingData ? (() => {
                            // Support both old and new field names
                            const segments = routingData.routeSegments || routingData.route_segments || [];
                            const pathStops = routingData.routeStops || routingData.path_stops || [];
                            const lastStop = pathStops[pathStops.length - 1] || {};
                            
                            return (
                            /* Route Instructions Panel */
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-full">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Navigation className="w-5 h-5 text-accent-orange" />
                                    Journey Steps
                                </h3>
                                <div className="space-y-4 overflow-y-auto flex-grow pr-2 pl-2">
                                    {segments.map((segment, index) => {
                                        const routeName = segment.routeName || segment.route_name;
                                        const segColor = segment.color || '#6B7280';
                                        const segStops = segment.stops || [];
                                        return (
                                        <div key={index} className="relative pl-8 pb-8 last:pb-0 border-l-2 border-gray-100 last:border-l-0 ml-2">
                                            <div
                                                className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: segColor }}
                                            ></div>
                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                <p className="text-xs text-gray-500 font-bold mb-1">STEP {index + 1}</p>
                                                <p className="font-bold text-gray-900 mb-1">
                                                    Take <span style={{ color: segColor }}>{routeName}</span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {segStops.length} stops • {Math.round(segStops.length * 2)} min approx
                                                </p>
                                            </div>
                                        </div>
                                        );
                                    })}

                                    {/* Destination Marker */}
                                    <div className="relative pl-6 pt-2">
                                        <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                                        <p className="font-bold text-gray-900">Arrive at {lastStop.stop_name || 'Destination'}</p>
                                    </div>
                                </div>
                            </div>
                            );
                        })() : (
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

                                <div className="space-y-3 max-h-[200px] lg:max-h-[400px] overflow-y-auto">
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
                    <div ref={mapContainerRef} className={`flex-grow bg-gray-100 rounded-3xl shadow-sm border border-gray-200 overflow-hidden relative h-[55vh] lg:h-full ${currentZoom < ZOOM_THRESHOLD ? 'hide-labels' : ''}`}>
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
                            {routingMode && routingData && (() => {
                                // Support both old and new field names
                                const segments = routingData.routeSegments || routingData.route_segments || [];
                                const pathStops = routingData.routeStops || routingData.path_stops || [];

                                // Build all journey positions for FitBounds
                                const allPositions = segments.flatMap(seg =>
                                    (seg.stops || []).map(s => [
                                        s.stop_lat ?? s.lat ?? 0,
                                        s.stop_lon ?? s.lng ?? 0
                                    ])
                                );

                                // Collect transfer points (alighting of seg N = boarding of seg N+1)
                                const transferPoints = segments.slice(0, -1).map(seg => {
                                    const stops = seg.stops || [];
                                    const last = stops[stops.length - 1];
                                    if (!last) return null;
                                    return {
                                        lat: last.stop_lat ?? last.lat,
                                        lon: last.stop_lon ?? last.lng,
                                        name: last.stop_name || seg.alightingStop || ''
                                    };
                                }).filter(Boolean);

                                // Start and end stops
                                const firstSeg = segments[0] || {};
                                const lastSeg = segments[segments.length - 1] || {};
                                const firstStops = firstSeg.stops || [];
                                const lastStops = lastSeg.stops || [];
                                const startStop = firstStops[0] || {};
                                const endStop = lastStops[lastStops.length - 1] || {};

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
                                        {/* Fit map to full journey extent */}
                                        {allPositions.length > 1 && (
                                            <FitBoundsController positions={allPositions} />
                                        )}

                                        {/* Draw each segment as a colored polyline */}
                                        {segments.map((segment, index) => {
                                            const segColor = getRouteColor(segment.routeId || segment.route_id || segment.routeName || '');
                                            const positions = (segment.stops || []).map(s => [
                                                s.stop_lat ?? s.lat ?? 0,
                                                s.stop_lon ?? s.lng ?? 0
                                            ]).filter(([lat, lon]) => lat !== 0 || lon !== 0);

                                            if (positions.length < 2) return null;

                                            return (
                                                <React.Fragment key={`segment-${index}`}>
                                                    {/* Glow / halo effect */}
                                                    <Polyline
                                                        positions={positions}
                                                        pathOptions={{
                                                            color: segColor,
                                                            weight: 12,
                                                            opacity: 0.25,
                                                            lineCap: 'round',
                                                            lineJoin: 'round'
                                                        }}
                                                    />
                                                    {/* Main segment line */}
                                                    <Polyline
                                                        positions={positions}
                                                        pathOptions={{
                                                            color: segColor,
                                                            weight: 5,
                                                            opacity: 0.95,
                                                            lineCap: 'round',
                                                            lineJoin: 'round'
                                                        }}
                                                    >
                                                        <Tooltip sticky direction="top" offset={[0, -4]} opacity={0.9}>
                                                            <span className="font-semibold text-xs">
                                                                🚌 {segment.routeName || segment.route_name || segment.routeId}
                                                            </span>
                                                            {segment.boardingStop && segment.alightingStop && (
                                                                <span className="block text-[10px] text-gray-600 mt-0.5">
                                                                    {segment.boardingStop} → {segment.alightingStop}
                                                                </span>
                                                            )}
                                                        </Tooltip>
                                                    </Polyline>

                                                    {/* Intermediate stop dots along the segment */}
                                                    {(segment.stops || []).slice(1, -1).map((stop, si) => {
                                                        const lat = stop.stop_lat ?? stop.lat;
                                                        const lon = stop.stop_lon ?? stop.lng;
                                                        if (!lat || !lon) return null;
                                                        return (
                                                            <CircleMarker
                                                                key={`seg-${index}-stop-${si}`}
                                                                center={[lat, lon]}
                                                                radius={3}
                                                                pathOptions={{
                                                                    color: segColor,
                                                                    fillColor: '#ffffff',
                                                                    fillOpacity: 1,
                                                                    weight: 2
                                                                }}
                                                            >
                                                                <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
                                                                    <span className="text-xs">{stop.stop_name || stop.name}</span>
                                                                </Tooltip>
                                                            </CircleMarker>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Transfer markers at segment junctions */}
                                        {transferPoints.map((pt, i) => (
                                            <CircleMarker
                                                key={`transfer-${i}`}
                                                center={[pt.lat, pt.lon]}
                                                radius={9}
                                                pathOptions={{
                                                    color: '#ffffff',
                                                    fillColor: '#F59E0B',
                                                    fillOpacity: 1,
                                                    weight: 3
                                                }}
                                            >
                                                <Popup className="custom-popup">
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-amber-600 uppercase mb-1">
                                                            🔄 Transfer Stop
                                                        </div>
                                                        <div className="text-sm font-semibold">{pt.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Board next bus here
                                                        </div>
                                                    </div>
                                                </Popup>
                                                <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
                                                    <span className="text-xs font-semibold">Transfer: {pt.name}</span>
                                                </Tooltip>
                                            </CircleMarker>
                                        ))}

                                        {/* START marker */}
                                        {(startStop.stop_lat ?? startStop.lat) !== undefined && (
                                            <Marker
                                                position={[startStop.stop_lat ?? startStop.lat, startStop.stop_lon ?? startStop.lng]}
                                                icon={startIcon}
                                                zIndexOffset={1000}
                                            >
                                                <Popup className="custom-popup" offset={[0, -10]}>
                                                    <div className="font-bold text-center">
                                                        <div className="text-xs text-green-600 uppercase mb-1">Start Journey</div>
                                                        {startStop.stop_name || startStop.name || firstSeg.boardingStop || 'Start'}
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}

                                        {/* END marker */}
                                        {(endStop.stop_lat ?? endStop.lat) !== undefined && (
                                            <Marker
                                                position={[endStop.stop_lat ?? endStop.lat, endStop.stop_lon ?? endStop.lng]}
                                                icon={endIcon}
                                                zIndexOffset={1000}
                                            >
                                                <Popup className="custom-popup" offset={[0, -10]}>
                                                    <div className="font-bold text-center">
                                                        <div className="text-xs text-red-600 uppercase mb-1">Destination</div>
                                                        {endStop.stop_name || endStop.name || lastSeg.alightingStop || 'End'}
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}
                                    </>
                                );
                            })()}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkMapPage;
