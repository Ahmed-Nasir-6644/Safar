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
    const searchRef = useRef(null);
    const ZOOM_THRESHOLD = 14;
    
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
        setShowDropdown(filtered.length > 0);
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
                <div class="font-sans">
                    <div class="font-bold text-gray-900 mb-2">${stopName}</div>
                    ${!routingMode ? `
                        <button 
                            onclick="window.startRoutingFromStop('${stopName}', ${coords[1]}, ${coords[0]})"
                            class="flex items-center gap-2 px-3 py-2 bg-accent-orange text-white rounded-lg hover:bg-orange-600 transition-colors w-full justify-center font-medium text-sm"
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
        <div className="pt-24 pb-12 px-4 min-h-screen bg-gray-50 flex flex-col font-sans">
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
                <div className="mb-6 relative" ref={searchRef}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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

                {/* ========== ROUTING UI OVERLAYS ========== */}
                
                {/* Source Search Overlay */}
                {showSourceSearch && routingDestination && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-32" onClick={() => setShowSourceSearch(false)}>
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
                    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
                            <div className="flex justify-center mb-4">
                                <Loader className="w-12 h-12 text-accent-orange animate-spin" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Finding Best Route...</h3>
                            <p className="text-gray-600">Calculating optimal path using Dijkstra's algorithm</p>
                        </div>
                    </div>
                )}
                
                {/* Clear Routing Button */}
                {routingMode && routingData && (
                    <div className="fixed bottom-8 right-8 z-40">
                        <button
                            onClick={handleClearRouting}
                            className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl hover:shadow-xl transition-all group"
                        >
                            <XCircle className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors" />
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Clear Route</p>
                                <p className="text-xs text-gray-500">Return to normal view</p>
                            </div>
                        </button>
                    </div>
                )}
                
                {/* Routing Info Panel */}
                {routingMode && routingData && (
                    <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl shadow-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <RouteIcon className="w-6 h-6" />
                                    <h3 className="text-xl font-bold">Route Found!</h3>
                                </div>
                                <button onClick={handleClearRouting} className="text-white hover:text-gray-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-white bg-opacity-20 rounded-xl p-3">
                                    <p className="text-xs opacity-90 mb-1">Distance</p>
                                    <p className="text-2xl font-bold">{routingData.total_distance} km</p>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-xl p-3">
                                    <p className="text-xs opacity-90 mb-1">Time</p>
                                    <p className="text-2xl font-bold">{routingData.total_time} min</p>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-xl p-3">
                                    <p className="text-xs opacity-90 mb-1">Stops</p>
                                    <p className="text-2xl font-bold">{routingData.path_stops.length}</p>
                                </div>
                            </div>
                            
                            <div className="bg-white bg-opacity-10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium">From: {routingData.path_stops[0].stop_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Navigation className="w-4 h-4" />
                                    <span className="text-sm font-medium">To: {routingData.path_stops[routingData.path_stops.length - 1].stop_name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Error Message */}
                {routingError && (
                    <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
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

                <div className="flex flex-col lg:flex-row gap-6 h-[600px] flex-grow">

                    {/* Sidebar Control Panel */}
                    <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4">
                        {/* Header Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
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

                        {/* Info Card */}
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
                    </div>

                    {/* Map Container */}
                    <div className={`flex-grow bg-gray-100 rounded-3xl shadow-sm border border-gray-200 overflow-hidden relative ${currentZoom < ZOOM_THRESHOLD ? 'hide-labels' : ''}`}>
                        <MapContainer
                            center={[33.6844, 73.0479]}
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                            ref={mapRef}
                        >
                            <TileLayerController isDarkMode={isDarkMode} />
                            <ZoomHandler setCurrentZoom={setCurrentZoom} />
                            <MapController targetLocation={selectedStop} />
                            
                            {/* Render normal routes when NOT in routing mode */}
                            {!routingMode && Object.keys(routes).map(routeName => {
                                const route = routes[routeName];
                                if (!route.visible) return null;
                                
                                return (
                                    <GeoJSON
                                        key={routeName}
                                        data={{
                                            type: 'FeatureCollection',
                                            features: route.features
                                        }}
                                        style={(feature) => routeStyle(feature, route.color)}
                                        onEachFeature={(feature, layer) => onEachRoute(feature, layer, routeName)}
                                    />
                                );
                            })}
                            
                            {/* Render normal stops when NOT in routing mode */}
                            {!routingMode && stops && currentZoom >= ZOOM_THRESHOLD && (
                                <GeoJSON
                                    data={stops}
                                    pointToLayer={pointToLayer}
                                    onEachFeature={onEachStop}
                                />
                            )}
                            
                            {/* Render ROUTING visualization when in routing mode */}
                            {routingMode && routingData && (
                                <>
                                    {/* Render route segments with colors */}
                                    {routingData.route_segments.map((segment, index) => (
                                        <GeoJSON
                                            key={`route-segment-${index}`}
                                            data={segment.geometry}
                                            style={{
                                                color: segment.color,
                                                weight: 6,
                                                opacity: 0.9,
                                                lineCap: 'round',
                                                lineJoin: 'round'
                                            }}
                                        />
                                    ))}
                                    
                                    {/* Render route stops as markers */}
                                    {routingData.path_stops.map((stop, index) => {
                                        const isStart = index === 0;
                                        const isEnd = index === routingData.path_stops.length - 1;
                                        
                                        const icon = L.divIcon({
                                            className: 'custom-marker',
                                            html: `
                                                <div class="flex items-center justify-center">
                                                    <div class="w-8 h-8 rounded-full ${
                                                        isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : 'bg-blue-500'
                                                    } border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
                                                        ${isStart ? 'A' : isEnd ? 'B' : index}
                                                    </div>
                                                </div>
                                            `,
                                            iconSize: [32, 32],
                                            iconAnchor: [16, 16]
                                        });
                                        
                                        return (
                                            <Marker
                                                key={`stop-${index}`}
                                                position={[stop.lat, stop.lng]}
                                                icon={icon}
                                            >
                                                <Popup>
                                                    <div className="font-sans">
                                                        <p className="font-bold text-gray-900">{stop.stop_name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {isStart ? 'Starting Point' : isEnd ? 'Destination' : `Stop ${index}`}
                                                        </p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
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
