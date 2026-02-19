import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRightLeft, Search, Loader2, Map, Mic, Clock, Navigation, AlertCircle, CheckCircle2, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';

const API_URL = 'http://localhost:8000';

const FindRoutesPage = () => {
    const [allStops, setAllStops] = useState([]);
    const [fromQuery, setFromQuery] = useState('');
    const [toQuery, setToQuery] = useState('');
    const [fromStop, setFromStop] = useState(null);
    const [toStop, setToStop] = useState(null);
    const [filteredFromStops, setFilteredFromStops] = useState([]);
    const [filteredToStops, setFilteredToStops] = useState([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    const [routes, setRoutes] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState(null); // 'from' | 'to'
    const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'time' | 'stops' | 'transfers'
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);

    const navigate = useNavigate();
    const { t } = useGlobalContext();

    // Load all stops on mount
    useEffect(() => {
        fetch(`${API_URL}/stops`)
            .then(r => r.json())
            .then(data => setAllStops(data.stops || []))
            .catch(err => console.error('Failed to load stops:', err));
    }, []);

    // Filter from stops
    useEffect(() => {
        if (!fromQuery.trim()) { setFilteredFromStops([]); return; }
        const q = fromQuery.toLowerCase();
        setFilteredFromStops(allStops.filter(s => s.stop_name.toLowerCase().includes(q)).slice(0, 8));
    }, [fromQuery, allStops]);

    // Filter to stops
    useEffect(() => {
        if (!toQuery.trim()) { setFilteredToStops([]); return; }
        const q = toQuery.toLowerCase();
        setFilteredToStops(allStops.filter(s => s.stop_name.toLowerCase().includes(q)).slice(0, 8));
    }, [toQuery, allStops]);

    const handleSearch = async () => {
        if (!fromStop || !toStop) return;
        setLoading(true);
        setError(null);
        setHasSearched(true);
        setRoutes([]);
        try {
            const res = await fetch(`${API_URL}/find-route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_stop_id: fromStop.stop_id,
                    destination_stop_id: toStop.stop_id,
                }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Error ${res.status}`);
            }
            const data = await res.json();
            const routeList = data.routes && data.routes.length > 0
                ? data.routes
                : (data.path_stops ? [data] : []);
            setRoutes(routeList);
            setSortBy('recommended');
            setSelectedRouteIndex(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = () => {
        const tmpStop = fromStop;
        const tmpQuery = fromQuery;
        setFromStop(toStop);
        setFromQuery(toQuery);
        setToStop(tmpStop);
        setToQuery(tmpQuery);
        setRoutes([]);
        setHasSearched(false);
    };

    const handleVoiceSearch = (field) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        setIsListening(true);
        setActiveVoiceField(field);
        recognition.start();
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (field === 'from') {
                setFromQuery(transcript);
                setFromStop(null);
                setShowFromDropdown(true);
            } else {
                setToQuery(transcript);
                setToStop(null);
                setShowToDropdown(true);
            }
        };
        recognition.onend = () => { setIsListening(false); setActiveVoiceField(null); };
        recognition.onerror = () => { setIsListening(false); setActiveVoiceField(null); };
    };

    const handleShowOnMap = (route) => {
        navigate('/network-map', { state: { routeToDisplay: route } });
    };

    const formatTime = (mins) => {
        if (!Number.isFinite(mins)) return 'N/A';
        if (mins < 60) return `${Math.ceil(mins)} min`;
        return `${Math.floor(mins / 60)}h ${Math.ceil(mins % 60)}m`;
    };

    const formatDistance = (km) => {
        if (!Number.isFinite(km)) return 'N/A';
        return `${km.toFixed(1)} km`;
    };

    const getRouteLabel = (index) => {
        if (index === 0) return { label: 'Recommended', colorClass: 'bg-green-100 text-green-700 border-green-200' };
        if (index === 1) return { label: 'Alternative', colorClass: 'bg-blue-100 text-blue-700 border-blue-200' };
        return { label: `Option ${index + 1}`, colorClass: 'bg-gray-100 text-gray-600 border-gray-200' };
    };

    const getSegmentColor = (routeName) => {
        const n = (routeName || '').toLowerCase();
        if (n.includes('red')) return 'bg-red-100 text-red-700';
        if (n.includes('blue')) return 'bg-blue-100 text-blue-700';
        if (n.includes('green')) return 'bg-green-100 text-green-700';
        if (n.includes('orange')) return 'bg-orange-100 text-orange-700';
        if (n.includes('metro')) return 'bg-purple-100 text-purple-700';
        return 'bg-gray-100 text-gray-700';
    };

    // Sort routes by selected criteria (original index = recommended order)
    const sortedRoutes = [...routes].sort((a, b) => {
        if (sortBy === 'time') return (a.total_time || 0) - (b.total_time || 0);
        if (sortBy === 'stops') return ((a.path_stops || []).length) - ((b.path_stops || []).length);
        if (sortBy === 'transfers') return ((a.route_segments || []).length) - ((b.route_segments || []).length);
        return 0; // 'recommended' — keep original backend order
    });

    const SORT_TABS = [
        { key: 'recommended', label: '⭐ Recommended' },
        { key: 'time', label: '⏱ Fastest' },
        { key: 'stops', label: '🚏 Fewest Stops' },
        { key: 'transfers', label: '🔄 Fewest Transfers' },
    ];

    return (
        <div className="pt-24 pb-16 min-h-screen bg-gray-50">
            <div className="my-container">

                {/* Page Title */}
                <div className="text-center mb-10">
                    <h1 className="text-[2rem] md:text-[2.5vw] font-bold text-gray-900 mb-2">Find Routes</h1>
                    <p className="text-secondary-gray text-lg">Discover the best way to get there</p>
                </div>

                {/* Search Card — original style */}
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 mb-10 max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-end">

                        {/* FROM Input */}
                        <div className="flex-1 w-full relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">From</label>
                            <div className="relative flex items-center gap-2">
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={fromQuery}
                                        onChange={e => { setFromQuery(e.target.value); setFromStop(null); setShowFromDropdown(true); }}
                                        onFocus={() => setShowFromDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowFromDropdown(false), 150)}
                                        placeholder="Starting Point"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:border-accent-orange transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleVoiceSearch('from')}
                                    className={`p-3 rounded-xl border transition-all ${activeVoiceField === 'from' && isListening ? 'bg-accent-orange text-white border-accent-orange animate-pulse' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-accent-orange hover:border-accent-orange'}`}
                                    title="Voice search"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            </div>
                            {showFromDropdown && filteredFromStops.length > 0 && (
                                <div className="absolute top-full left-0 right-12 z-30 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
                                    {filteredFromStops.map(stop => (
                                        <button
                                            key={stop.stop_id}
                                            onMouseDown={() => { setFromStop(stop); setFromQuery(stop.stop_name); setShowFromDropdown(false); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-orange-50 flex items-center gap-2 text-sm"
                                        >
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{stop.stop_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Swap */}
                        <button
                            onClick={handleSwap}
                            className="flex-shrink-0 p-3 rounded-xl bg-gray-100 hover:bg-orange-100 hover:text-accent-orange text-gray-500 transition-all mb-px hidden md:flex items-center justify-center"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                        </button>

                        {/* TO Input */}
                        <div className="flex-1 w-full relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">To</label>
                            <div className="relative flex items-center gap-2">
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={toQuery}
                                        onChange={e => { setToQuery(e.target.value); setToStop(null); setShowToDropdown(true); }}
                                        onFocus={() => setShowToDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowToDropdown(false), 150)}
                                        placeholder="Destination"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:border-accent-orange transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleVoiceSearch('to')}
                                    className={`p-3 rounded-xl border transition-all ${activeVoiceField === 'to' && isListening ? 'bg-accent-orange text-white border-accent-orange animate-pulse' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-accent-orange hover:border-accent-orange'}`}
                                    title="Voice search"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            </div>
                            {showToDropdown && filteredToStops.length > 0 && (
                                <div className="absolute top-full left-0 right-12 z-30 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
                                    {filteredToStops.map(stop => (
                                        <button
                                            key={stop.stop_id}
                                            onMouseDown={() => { setToStop(stop); setToQuery(stop.stop_name); setShowToDropdown(false); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-orange-50 flex items-center gap-2 text-sm"
                                        >
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{stop.stop_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            disabled={loading || !fromStop || !toStop}
                            className="w-full md:w-auto px-8 py-3.5 bg-accent-orange text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-2 justify-center"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            <span>Search</span>
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-w-4xl mx-auto">
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No results */}
                    {hasSearched && !loading && routes.length === 0 && !error && (
                        <div className="text-center py-16 text-gray-400">
                            <Navigation className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="text-lg font-medium">No routes found</p>
                            <p className="text-sm mt-1">Try different stops or check that the backend is running</p>
                        </div>
                    )}

                    {/* Route Cards */}
                    {routes.length > 0 && !loading && (
                        <div className="space-y-4">

                            {/* Sort tabs */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
                                {SORT_TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setSortBy(tab.key)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${sortBy === tab.key
                                                ? 'bg-accent-orange text-white border-accent-orange shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-accent-orange hover:text-accent-orange'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                                <span className="ml-auto text-xs text-gray-400">{routes.length} option{routes.length > 1 ? 's' : ''}</span>
                            </div>

                            {sortedRoutes.map((route, index) => {
                                const originalIndex = routes.indexOf(route);
                                const { label, colorClass } = getRouteLabel(originalIndex);
                                const segments = route.route_segments || [];
                                const stops = route.path_stops || [];
                                const isSelected = selectedRouteIndex === index;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedRouteIndex(isSelected ? null : index)}
                                        className={`bg-white rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${isSelected
                                                ? 'border-accent-orange shadow-lg shadow-orange-100'
                                                : originalIndex === 0 && sortBy === 'recommended'
                                                    ? 'border-green-200 shadow-sm'
                                                    : 'border-gray-200'
                                            }`}
                                    >
                                        {/* Header row */}
                                        <div className="p-5 border-b border-gray-100">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colorClass}`}>
                                                            {label}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-accent-orange border border-orange-200 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary-gray">
                                                        <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                                                            <Clock className="w-4 h-4 text-accent-orange" />
                                                            {formatTime(route.total_time)}
                                                        </span>
                                                        <span className="text-gray-300">·</span>
                                                        <span>{formatDistance(route.total_distance)}</span>
                                                        <span className="text-gray-300">·</span>
                                                        <span>{stops.length} stops</span>
                                                        {segments.length > 1 && (
                                                            <>
                                                                <span className="text-gray-300">·</span>
                                                                <span>{segments.length - 1} transfer{segments.length > 2 ? 's' : ''}</span>
                                                            </>
                                                        )}
                                                        {segments.length <= 1 && (
                                                            <>
                                                                <span className="text-gray-300">·</span>
                                                                <span className="text-green-600 font-medium">Direct</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedRouteIndex(isSelected ? null : index); }}
                                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${isSelected
                                                                ? 'bg-accent-orange text-white border-accent-orange'
                                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-accent-orange hover:text-accent-orange'
                                                            }`}
                                                    >
                                                        {isSelected ? '✓ Selected' : 'Select'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleShowOnMap(route); }}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-colors text-sm border border-blue-100"
                                                    >
                                                        <Map className="w-4 h-4" />
                                                        Map
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Route segments path */}
                                        <div className="px-5 py-4">
                                            <div className="flex items-center flex-wrap gap-2 text-sm">
                                                <span className="font-semibold text-gray-800 max-w-[140px] truncate">
                                                    {fromStop?.stop_name || stops[0]?.stop_name || 'Start'}
                                                </span>
                                                <span className="text-gray-400">→</span>

                                                {segments.length > 0 ? segments.map((seg, i) => (
                                                    <React.Fragment key={i}>
                                                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${getSegmentColor(seg.route_name)}`}>
                                                            {seg.route_name || 'Route'}
                                                            {seg.stops?.length ? ` (${seg.stops.length} stops)` : ''}
                                                        </span>
                                                        {i < segments.length - 1 && (
                                                            <span className="text-xs text-gray-400 font-medium">transfer →</span>
                                                        )}
                                                    </React.Fragment>
                                                )) : (
                                                    <span className="text-gray-400 italic text-xs">Direct</span>
                                                )}

                                                <span className="text-gray-400">→</span>
                                                <span className="font-semibold text-gray-800 max-w-[140px] truncate">
                                                    {toStop?.stop_name || stops[stops.length - 1]?.stop_name || 'End'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FindRoutesPage;
