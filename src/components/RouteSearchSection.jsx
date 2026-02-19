import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRightLeft, Search, Loader2, ChevronDown, ChevronUp, Bus, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import useRoutes from '../hooks/useRoutes';

const RouteSearchSection = () => {
    const { findRoute, getAllStops, getStats, searchStops, loading, error, routeData } = useRoutes();
    const [allStops, setAllStops] = useState([]);
    const [fromQuery, setFromQuery] = useState('');
    const [toQuery, setToQuery] = useState('');
    const [fromStopName, setFromStopName] = useState('');
    const [toStopName, setToStopName] = useState('');
    const [filteredFromStops, setFilteredFromStops] = useState([]);
    const [filteredToStops, setFilteredToStops] = useState([]);
    const [searchingFrom, setSearchingFrom] = useState(false);
    const [searchingTo, setSearchingTo] = useState(false);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [stats, setStats] = useState(null);
    const [searching, setSearching] = useState(false);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [stopsLoading, setStopsLoading] = useState(true);
    const [expandedSegments, setExpandedSegments] = useState({});
    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);
    const navigate = useNavigate();
    const { t } = useGlobalContext();
    // Load all stops on component mount
    useEffect(() => {
        const loadInitialData = async () => {
            setStopsLoading(true);
            try {
                console.log('📍 Loading all stops...');
                const stops = await getAllStops();
                console.log('✅ Stops loaded - Raw response:', stops);
                console.log('✅ Stops type:', typeof stops);
                console.log('✅ Stops is array?', Array.isArray(stops));
                console.log('✅ Number of stops:', stops?.length || 0);
                
                // Handle both array and object responses
                let stopsArray = [];
                if (Array.isArray(stops)) {
                    stopsArray = stops;
                } else if (stops && typeof stops === 'object') {
                    // If it's an object, check for common property names
                    if (stops.stops && Array.isArray(stops.stops)) {
                        stopsArray = stops.stops;
                    } else if (Array.isArray(stops)) {
                        stopsArray = stops;
                    }
                }
                
                console.log('✅ Processed stops:', stopsArray);
                console.log('✅ First stop example:', stopsArray[0]);
                
                setAllStops(stopsArray);
                
                const statsData = await getStats();
                console.log('✅ Stats loaded:', statsData);
                setStats(statsData);
            } catch (err) {
                console.error('❌ Error loading stops:', err);
                console.error('❌ Error details:', err.message);
                console.error('❌ Error stack:', err.stack);
                setAllStops([]);
            } finally {
                setStopsLoading(false);
            }
        };
        loadInitialData();
    }, [getAllStops, getStats]);

    // Search from stops (backend)
    useEffect(() => {
        let active = true;
        const trimmedQuery = fromQuery.trim();

        if (!trimmedQuery) {
            setFilteredFromStops([]);
            setSearchingFrom(false);
            return undefined;
        }

        setSearchingFrom(true);
        setShowFromDropdown(true);

        const timeoutId = setTimeout(async () => {
            try {
                const results = await searchStops(trimmedQuery);

                let stopsArray = [];
                if (Array.isArray(results)) {
                    stopsArray = results;
                } else if (results && Array.isArray(results.stops)) {
                    stopsArray = results.stops;
                } else if (results && typeof results === 'object') {
                    stopsArray = results.data && Array.isArray(results.data) ? results.data : [];
                }

                if (active) {
                    setFilteredFromStops(stopsArray);
                }
            } catch (err) {
                console.error('Error searching from stops:', err);
                if (active) {
                    setFilteredFromStops([]);
                }
            } finally {
                if (active) {
                    setSearchingFrom(false);
                }
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, [fromQuery, searchStops]);

    // Search to stops (backend)
    useEffect(() => {
        let active = true;
        const trimmedQuery = toQuery.trim();

        if (!trimmedQuery) {
            setFilteredToStops([]);
            setSearchingTo(false);
            return undefined;
        }

        setSearchingTo(true);
        setShowToDropdown(true);

        const timeoutId = setTimeout(async () => {
            try {
                const results = await searchStops(trimmedQuery);

                let stopsArray = [];
                if (Array.isArray(results)) {
                    stopsArray = results;
                } else if (results && Array.isArray(results.stops)) {
                    stopsArray = results.stops;
                } else if (results && typeof results === 'object') {
                    stopsArray = results.data && Array.isArray(results.data) ? results.data : [];
                }

                if (active) {
                    setFilteredToStops(stopsArray);
                }
            } catch (err) {
                console.error('Error searching to stops:', err);
                if (active) {
                    setFilteredToStops([]);
                }
            } finally {
                if (active) {
                    setSearchingTo(false);
                }
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, [toQuery, searchStops]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (fromInputRef.current && !fromInputRef.current.contains(e.target)) {
                setShowFromDropdown(false);
            }
            if (toInputRef.current && !toInputRef.current.contains(e.target)) {
                setShowToDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFromSelect = (stop) => {
        setFromStopName(stop.stop_name);
        setFromQuery(stop.stop_name);
        setShowFromDropdown(false);
    };

    const handleToSelect = (stop) => {
        setToStopName(stop.stop_name);
        setToQuery(stop.stop_name);
        setShowToDropdown(false);
    };

    const handleSwap = () => {
        const tempQuery = fromQuery;
        const tempName = fromStopName;
        setFromQuery(toQuery);
        setFromStopName(toStopName);
        setToQuery(tempQuery);
        setToStopName(tempName);
    };

    const handleSearch = async () => {
        if (!fromStopName || !toStopName) {
            alert('Please select both starting point and destination');
            return;
        }

        if (fromStopName === toStopName) {
            alert('Starting point and destination must be different');
            return;
        }

        setSearching(true);
        try {
            await findRoute(fromStopName, toStopName);
            setSelectedRouteIndex(0);
        } catch (err) {
            console.error('Error finding route:', err);
        } finally {
            setSearching(false);
        }
    };

    const routes = routeData?.routes && Array.isArray(routeData.routes)
        ? routeData.routes
        : routeData
            ? [routeData]
            : [];

    const selectedRoute = routes[selectedRouteIndex] || null;

    const formatDistance = (distance) => {
        if (!Number.isFinite(distance)) {
            return 'N/A';
        }
        return `${distance.toFixed(1)} km`;
    };

    const formatTime = (minutes) => {
        if (!Number.isFinite(minutes)) {
            return 'N/A';
        }
        return `${Math.ceil(minutes)} min`;
    };

    const toggleSegment = (routeIndex, segmentIndex) => {
        const key = `${routeIndex}-${segmentIndex}`;
        setExpandedSegments(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const getRouteColor = (routeName) => {
        const colors = {
            'RED': 'bg-red-100 text-red-800 border-red-200',
            'BLUE': 'bg-blue-100 text-blue-800 border-blue-200',
            'GREEN': 'bg-green-100 text-green-800 border-green-200',
            'YELLOW': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'ORANGE': 'bg-orange-100 text-orange-800 border-orange-200',
            'PURPLE': 'bg-purple-100 text-purple-800 border-purple-200',
        };
        return colors[routeName?.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const displayFromStops = fromQuery.length > 0 ? filteredFromStops : allStops;
    const displayToStops = toQuery.length > 0 ? filteredToStops : allStops;

    return (
        <section id="find-route" className="py-20 bg-gray-50 my-container">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                <div className="text-center mb-10">
                    <h2 className="text-[2rem] md:text-[2.5vw] font-bold text-gray-900 mb-4">
                        {t('findBestRouteTitle')}
                    </h2>
                    <p className="text-secondary-gray text-lg max-w-2xl mx-auto">
                        {t('findBestRouteDesc')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-stretch max-w-4xl mx-auto bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    {/* From Input */}
                    <div className="flex-1 relative" ref={fromInputRef}>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="From (e.g. Central Station)"
                                value={fromQuery}
                                onChange={(e) => setFromQuery(e.target.value)}
                                onFocus={() => setShowFromDropdown(true)}
                                className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:border-accent-orange transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            />
                            {fromQuery && (
                                <button
                                    onClick={() => {
                                        setFromQuery('');
                                        setFromStopName('');
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* From Dropdown */}
                        {showFromDropdown && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-2xl max-h-72 overflow-y-auto z-20">
                                {stopsLoading || searchingFrom ? (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        Loading stops...
                                    </div>
                                ) : displayFromStops.length > 0 ? (
                                    <div className="py-2">
                                        {displayFromStops.map((stop) => (
                                            <button
                                                key={stop.stop_id}
                                                onClick={() => handleFromSelect(stop)}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors ${
                                                    fromStopName === stop.stop_name ? 'bg-orange-50 text-accent-orange font-semibold' : 'text-gray-900'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="w-4 h-4 text-accent-orange flex-shrink-0" />
                                                    <span>{stop.stop_name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No stops found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Swap Icon */}
                    <button
                        onClick={handleSwap}
                        className="flex-shrink-0 p-3 bg-white rounded-full border border-gray-200 shadow-sm text-gray-400 hover:text-accent-orange hover:border-accent-orange transition-all md:self-center"
                    >
                        <ArrowRightLeft className="w-5 h-5" />
                    </button>

                    {/* To Input */}
                    <div className="flex-1 relative" ref={toInputRef}>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="To (e.g. Airport Terminal)"
                                value={toQuery}
                                onChange={(e) => setToQuery(e.target.value)}
                                onFocus={() => setShowToDropdown(true)}
                                className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:border-accent-orange transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            />
                            {toQuery && (
                                <button
                                    onClick={() => {
                                        setToQuery('');
                                        setToStopName('');
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* To Dropdown */}
                        {showToDropdown && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-2xl max-h-72 overflow-y-auto z-20">
                                {stopsLoading || searchingTo ? (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        Loading stops...
                                    </div>
                                ) : displayToStops.length > 0 ? (
                                    <div className="py-2">
                                        {displayToStops.map((stop) => (
                                            <button
                                                key={stop.stop_id}
                                                onClick={() => handleToSelect(stop)}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors ${
                                                    toStopName === stop.stop_name ? 'bg-orange-50 text-accent-orange font-semibold' : 'text-gray-900'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="w-4 h-4 text-accent-orange flex-shrink-0" />
                                                    <span>{stop.stop_name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No stops found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={searching || loading || !fromStopName || !toStopName}
                        className="flex-shrink-0 px-8 py-4 bg-accent-orange text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[160px]"
                    >
                        {searching || loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                <span className="hidden sm:inline">Search</span>
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {routes.length > 0 && (
                    <div className="mt-8 space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            ✅ {routes.length} {routes.length === 1 ? 'Route' : 'Routes'} Found
                        </h3>

                        {/* Route Cards */}
                        <div className="grid grid-cols-1 gap-6">
                            {routes.map((route, routeIndex) => {
                                const isSelected = selectedRouteIndex === routeIndex;
                                const estimatedMinutes = route.estimatedMinutes || Math.ceil(route.totalDistance * 2);
                                const isDirect = route.transferCount === 0;
                                
                                return (
                                    <div
                                        key={`route-${routeIndex}`}
                                        className={`border-2 rounded-2xl overflow-hidden transition-all ${
                                            isSelected 
                                                ? 'border-accent-orange bg-white shadow-xl' 
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}
                                    >
                                        {/* Route Header - Clickable */}
                                        <button
                                            onClick={() => setSelectedRouteIndex(routeIndex)}
                                            className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl font-bold text-gray-900">
                                                        Route Option {routeIndex + 1}
                                                    </span>
                                                    {isDirect ? (
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full border border-green-300">
                                                            Direct Route
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full border border-yellow-300">
                                                            {route.transferCount} {route.transferCount === 1 ? 'Transfer' : 'Transfers'}
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronDown
                                                    className={`w-6 h-6 transition-transform ${
                                                        isSelected ? 'rotate-180 text-accent-orange' : 'text-gray-400'
                                                    }`}
                                                />
                                            </div>

                                            {/* Key Stats */}
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="text-center p-3 bg-white rounded-xl border border-gray-200">
                                                    <Clock className="w-5 h-5 mx-auto mb-1 text-accent-orange" />
                                                    <p className="text-2xl font-bold text-gray-900">{formatTime(estimatedMinutes)}</p>
                                                    <p className="text-xs text-gray-600 mt-1">Duration</p>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-xl border border-gray-200">
                                                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-accent-orange" />
                                                    <p className="text-2xl font-bold text-gray-900">{formatDistance(route.totalDistance)}</p>
                                                    <p className="text-xs text-gray-600 mt-1">Distance</p>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-xl border border-gray-200">
                                                    <span className="text-2xl mb-1 block">💰</span>
                                                    <p className="text-2xl font-bold text-accent-orange">
                                                        {route.fare?.amount || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">{route.fare?.currency || 'PKR'}</p>
                                                </div>
                                            </div>

                                            {/* Bus Lines Used */}
                                            {route.busSequence && route.busSequence.length > 0 && (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Bus className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-600">Bus Lines:</span>
                                                    {route.busSequence.map((bus, idx) => (
                                                        <React.Fragment key={`bus-${routeIndex}-${idx}`}>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getRouteColor(bus)}`}>
                                                                {bus}
                                                            </span>
                                                            {idx < route.busSequence.length - 1 && (
                                                                <span className="text-gray-400 font-bold">→</span>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            )}
                                        </button>

                                        {/* Expandable Route Details */}
                                        {isSelected && (
                                            <div className="border-t-2 border-gray-200 bg-white">
                                                <div className="p-6 space-y-6">
                                                    {/* Journey Instructions Header */}
                                                    <div className="mb-4">
                                                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                                                            Step-by-Step Journey
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            Follow these instructions to complete your journey
                                                        </p>
                                                    </div>

                                                    {/* Route Segments */}
                                                    {route.routeSegments && route.routeSegments.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {route.routeSegments.map((segment, segmentIndex) => {
                                                                const segmentKey = `${routeIndex}-${segmentIndex}`;
                                                                const isExpanded = expandedSegments[segmentKey];
                                                                
                                                                return (
                                                                    <div key={segmentKey} className="space-y-3">
                                                                        {/* Segment Card */}
                                                                        <div className={`border-2 rounded-xl overflow-hidden ${getRouteColor(segment.routeName)} border-opacity-50`}>
                                                                            {/* Segment Header */}
                                                                            <div className={`p-4 ${getRouteColor(segment.routeName)} bg-opacity-30`}>
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Bus className="w-5 h-5" />
                                                                                        <span className="text-lg font-bold">
                                                                                            {segment.routeName} Line
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="text-sm font-medium opacity-75">
                                                                                        ({segment.stopCount} stops, {formatDistance(segment.distance)})
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Boarding Info */}
                                                                            <div className="p-4 bg-green-50 border-b-2 border-green-200">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="mt-1">
                                                                                        <MapPin className="w-5 h-5 text-green-600" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-semibold text-green-700 mb-1">
                                                                                            📍 Board at:
                                                                                        </p>
                                                                                        <p className="text-xl font-bold text-green-900">
                                                                                            {segment.boardingStop}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Collapsible Stops List */}
                                                                            <div className="p-4 bg-white">
                                                                                <button
                                                                                    onClick={() => toggleSegment(routeIndex, segmentIndex)}
                                                                                    className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                                                >
                                                                                    <span className="text-sm font-semibold text-gray-700">
                                                                                        {isExpanded ? 'Hide' : 'Show'} all {segment.stopCount} stops
                                                                                    </span>
                                                                                    {isExpanded ? (
                                                                                        <ChevronUp className="w-4 h-4 text-gray-600" />
                                                                                    ) : (
                                                                                        <ChevronDown className="w-4 h-4 text-gray-600" />
                                                                                    )}
                                                                                </button>

                                                                                {/* Expanded Stops */}
                                                                                {isExpanded && segment.stops && (
                                                                                    <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-300">
                                                                                        {segment.stops.map((stop, stopIndex) => (
                                                                                            <div key={stop.stop_id} className="flex items-center gap-3 py-1">
                                                                                                {stopIndex === 0 ? (
                                                                                                    <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" title="Starting point"></span>
                                                                                                ) : stopIndex === segment.stops.length - 1 ? (
                                                                                                    <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" title="End of segment"></span>
                                                                                                ) : (
                                                                                                    <span className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white flex-shrink-0"></span>
                                                                                                )}
                                                                                                <span className="text-sm text-gray-700">
                                                                                                    {stop.stop_name}
                                                                                                    {stopIndex === 0 && (
                                                                                                        <span className="ml-2 text-xs text-green-600 font-semibold">(Start)</span>
                                                                                                    )}
                                                                                                    {stopIndex === segment.stops.length - 1 && (
                                                                                                        <span className="ml-2 text-xs text-red-600 font-semibold">(End)</span>
                                                                                                    )}
                                                                                                </span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Alighting Info */}
                                                                            <div className="p-4 bg-red-50 border-t-2 border-red-200">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="mt-1">
                                                                                        <MapPin className="w-5 h-5 text-red-600" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-semibold text-red-700 mb-1">
                                                                                            🛑 Get off at:
                                                                                        </p>
                                                                                        <p className="text-xl font-bold text-red-900">
                                                                                            {segment.alightingStop}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Transfer Indicator */}
                                                                        {segmentIndex < route.routeSegments.length - 1 && (
                                                                            <div className="flex items-center justify-center py-3">
                                                                                <div className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full shadow-lg border-2 border-orange-600 flex items-center gap-2">
                                                                                    <span className="text-lg font-bold">→</span>
                                                                                    <span className="font-bold">
                                                                                        Transfer to {route.routeSegments[segmentIndex + 1].routeName} Line
                                                                                    </span>
                                                                                    <span className="text-lg font-bold">→</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        /* Fallback: Old format without segments */
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <p className="text-sm font-semibold text-gray-700 mb-3">Route Path:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {route.routeStops?.map((stop, index) => (
                                                                    <React.Fragment key={stop.stop_id}>
                                                                        <div className="px-3 py-1 bg-orange-100 rounded-full text-xs font-medium text-accent-orange border border-orange-200">
                                                                            {stop.stop_name}
                                                                        </div>
                                                                        {index < route.routeStops.length - 1 && (
                                                                            <div className="self-center text-gray-400 font-bold">→</div>
                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Fare Breakdown */}
                                                    {route.fare?.fareDetails && route.fare.fareDetails.length > 0 && (
                                                        <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                                                            <h5 className="text-sm font-bold text-gray-900 mb-3">💰 Fare Breakdown</h5>
                                                            <div className="space-y-2">
                                                                {route.fare.fareDetails.map((fareItem, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                                        <span className={`px-2 py-1 rounded font-semibold ${getRouteColor(fareItem.route)}`}>
                                                                            {fareItem.route}
                                                                        </span>
                                                                        <span className="font-bold text-gray-900">
                                                                            {fareItem.fare} {route.fare.currency}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                <div className="pt-2 mt-2 border-t-2 border-orange-300 flex items-center justify-between">
                                                                    <span className="font-bold text-gray-900">Total Fare:</span>
                                                                    <span className="text-xl font-bold text-accent-orange">
                                                                        {route.fare.amount} {route.fare.currency}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center flex-wrap gap-8 md:gap-16 mt-12 text-center">
                <div>
                    <div className="text-[2rem] font-bold text-gray-900">
                        {stats?.totalStops || allStops.length || '250+'}
                    </div>
                    <div className="text-sm text-secondary-gray uppercase tracking-wider font-medium">Stations</div>
                </div>
                <div>
                    <div className="text-[2rem] font-bold text-gray-900">
                        {stats?.totalConnections || '4'}
                    </div>
                    <div className="text-sm text-secondary-gray uppercase tracking-wider font-medium">Active Lines</div>
                </div>
                <div>
                    <div className="text-[2rem] font-bold text-gray-900">{t('commutersCount')}</div>
                    <div className="text-sm text-secondary-gray uppercase tracking-wider font-medium">{t('commutersLabel')}</div>
                </div>
            </div>
        </section>
    );
};

export default RouteSearchSection;
