import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRightLeft, Search, Loader2, ChevronDown } from 'lucide-react';
import useRoutes from '../hooks/useRoutes';

const RouteSearchSection = () => {
    const { findRoute, getAllStops, getStats, loading, error, routeData } = useRoutes();
    const [allStops, setAllStops] = useState([]);
    const [fromQuery, setFromQuery] = useState('');
    const [toQuery, setToQuery] = useState('');
    const [fromStopName, setFromStopName] = useState('');
    const [toStopName, setToStopName] = useState('');
    const [filteredFromStops, setFilteredFromStops] = useState([]);
    const [filteredToStops, setFilteredToStops] = useState([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [stats, setStats] = useState(null);
    const [searching, setSearching] = useState(false);
    const [stopsLoading, setStopsLoading] = useState(true);
    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);

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

    // Filter from stops
    useEffect(() => {
        if (fromQuery.length > 0) {
            const filtered = allStops.filter(stop =>
                stop.stop_name.toLowerCase().includes(fromQuery.toLowerCase())
            );
            setFilteredFromStops(filtered);
            setShowFromDropdown(true);
        } else {
            setFilteredFromStops([]);
        }
    }, [fromQuery, allStops]);

    // Filter to stops
    useEffect(() => {
        if (toQuery.length > 0) {
            const filtered = allStops.filter(stop =>
                stop.stop_name.toLowerCase().includes(toQuery.toLowerCase())
            );
            setFilteredToStops(filtered);
            setShowToDropdown(true);
        } else {
            setFilteredToStops([]);
        }
    }, [toQuery, allStops]);

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
        } catch (err) {
            console.error('Error finding route:', err);
        } finally {
            setSearching(false);
        }
    };

    const displayFromStops = fromQuery.length > 0 ? filteredFromStops : allStops;
    const displayToStops = toQuery.length > 0 ? filteredToStops : allStops;

    return (
        <section id="find-route" className="py-20 bg-gray-50 my-container">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                <div className="text-center mb-10">
                    <h2 className="text-[2rem] md:text-[2.5vw] font-bold text-gray-900 mb-4">
                        Find Your Best Route
                    </h2>
                    <p className="text-secondary-gray text-lg max-w-2xl mx-auto">
                        Enter your starting point and destination to get the fastest metro connection.
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
                                {stopsLoading ? (
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
                                {stopsLoading ? (
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

                {routeData && (
                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-900 mb-4">
                            ✅ Route Found!
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                            <div>
                                <p className="text-2xl font-bold text-green-600">{routeData.numberOfStops}</p>
                                <p className="text-sm text-green-700">Total Stops</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">{routeData.totalDistance?.toFixed(1)}km</p>
                                <p className="text-sm text-green-700">Distance</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">~{Math.ceil(routeData.totalDistance / 2)}</p>
                                <p className="text-sm text-green-700">Estimated Time (min)</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Route Path:</p>
                            <div className="flex flex-wrap gap-2">
                                {routeData.routeStops?.map((stop, index) => (
                                    <React.Fragment key={stop.stop_id}>
                                        <div className="px-3 py-1 bg-orange-100 rounded-full text-xs font-medium text-accent-orange">
                                            {stop.stop_name}
                                        </div>
                                        {index < routeData.routeStops.length - 1 && (
                                            <div className="self-center text-gray-400">→</div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
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
                    <div className="text-[2rem] font-bold text-gray-900">50k+</div>
                    <div className="text-sm text-secondary-gray uppercase tracking-wider font-medium">Daily Commuters</div>
                </div>
            </div>
        </section>
    );
};

export default RouteSearchSection;
