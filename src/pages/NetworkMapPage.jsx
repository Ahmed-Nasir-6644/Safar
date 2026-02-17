import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Info, Bus, Train, Eye, EyeOff, Filter, Layers, Search, X, MapPin } from 'lucide-react';
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
            layer.bindPopup(`<b>${feature.properties.stop_name}</b>`);
        }
    };

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
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            
                            <ZoomHandler setCurrentZoom={setCurrentZoom} />
                            <MapController targetLocation={selectedStop} />
                            
                            {/* Render visible routes */}
                            {Object.keys(routes).map(routeName => {
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
                            
                            {/* Render stops when zoomed in */}
                            {stops && currentZoom >= ZOOM_THRESHOLD && (
                                <GeoJSON
                                    data={stops}
                                    pointToLayer={pointToLayer}
                                    onEachFeature={onEachStop}
                                />
                            )}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkMapPage;
