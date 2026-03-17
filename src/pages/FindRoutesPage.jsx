import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { MapPin, ArrowRightLeft, Search, Loader2, Map, Mic, Clock, Navigation, AlertCircle, CheckCircle2, ArrowUpDown, Star, Repeat2, Bus, Train, ArrowRight, X, Banknote, ChevronRight, ListOrdered, Volume2, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { routesAPI } from '../utils/api';
import PaymentFlow from '../components/PaymentFlow';
import VoiceSearchModal from '../components/VoiceSearchModal';
import TimelineDisplay from '../components/TimelineDisplay';
import { handleAuthError } from '../utils/auth';
import { PYTHON_API_URL } from '../config/apiConfig';

const FindRoutesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useGlobalContext();

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
    const [sortBy, setSortBy] = useState('recommended');
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);
    const [modalRoute, setModalRoute] = useState(null); // route object for detail modal

    // ---- Voice search modal state ----
    const [showVoiceModal, setShowVoiceModal] = useState(false);

    // ---- Speaker / dictation state ----
    const [dictatingRoutes, setDictatingRoutes] = useState({});
    const [speakingRoutes, setSpeakingRoutes] = useState({});
    const [dictationErrors, setDictationErrors] = useState({});
    const intentionalStopRef = useRef({});

    // ---- Favourite state ----
    const [favoriteRoutes, setFavoriteRoutes] = useState({});
    const [savingFavoriteRoutes, setSavingFavoriteRoutes] = useState({});
    const [favoriteMessage, setFavoriteMessage] = useState('');
    const [favoriteError, setFavoriteError] = useState('');

    // Track if we need to auto-search from history
    const [needsAutoSearch, setNeedsAutoSearch] = useState(false);

    // Handle auto-search from history page
    useEffect(() => {
        if (location.state?.autoSearch && location.state?.from && location.state?.to) {
            const { from, to } = location.state;
            
            // Set the queries and find the stops
            setFromQuery(from);
            setToQuery(to);
            
            // Find stops in allStops array when available
            if (allStops.length > 0) {
                const fromStopMatch = allStops.find(stop => 
                    stop.stop_name.toLowerCase() === from.toLowerCase() ||
                    stop.stop_name.toLowerCase().includes(from.toLowerCase())
                );
                const toStopMatch = allStops.find(stop => 
                    stop.stop_name.toLowerCase() === to.toLowerCase() ||
                    stop.stop_name.toLowerCase().includes(to.toLowerCase())
                );
                
                if (fromStopMatch && toStopMatch) {
                    setFromStop(fromStopMatch);
                    setToStop(toStopMatch);
                    setNeedsAutoSearch(true);
                    setLoading(false);
                }
            }
        }
    }, [location.state, allStops, navigate]);

    // Load all stops on mount using the aligned API
    useEffect(() => {
        const loadStops = async () => {
            try {
                const response = await routesAPI.getAllStops();
                // Response: { success, message, data: [...stops] }
                if (response.success && Array.isArray(response.data)) {
                    setAllStops(response.data);
                } else {
                    console.error('Unexpected stops response:', response);
                    setAllStops([]);
                }
            } catch (err) {
                console.error('Failed to load stops:', err);
                // Handle authentication errors
                if (!handleAuthError(err, navigate)) {
                    setAllStops([]);
                }
            }
        };
        loadStops();
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
            // Use the aligned API - find by name
            const response = await routesAPI.findRoute(fromStop.stop_name, toStop.stop_name, 6);
            
            // Response: { success, message, data: { routes: [...], farePolicy: {...} } }
            if (!response.success) {
                throw new Error(response.message || 'Failed to find route');
            }
            
            const routeData = response.data;
            const routeList = routeData.routes && routeData.routes.length > 0
                ? routeData.routes
                : [];
            
            setRoutes(routeList);
            setSortBy('recommended');
            setSelectedRouteIndex(null);

            // Save search to history after successful route search
            try {
                await routesAPI.saveSearchHistory({
                    startingPoint: fromStop.stop_name,
                    destination: toStop.stop_name,
                    startStopId: fromStop.stop_id,
                    endStopId: toStop.stop_id,
                    searchType: 'by-name'
                });
            } catch (historyError) {
                // Handle authentication errors for history saving
                if (!handleAuthError(historyError, navigate)) {
                    // Silently fail for history saving - don't break the main search flow
                    console.warn('Failed to save search history:', historyError);
                }
            }
        } catch (err) {
            // Handle authentication errors
            if (!handleAuthError(err, navigate)) {
                setError(err.message);
            }
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

    // ---- Voice search ----
    const openVoiceModal  = () => setShowVoiceModal(true);
    const closeVoiceModal = () => setShowVoiceModal(false);

    // Called by VoiceSearchModal when backend returns a valid prediction
    const handleVoiceRouteFound = ({ source, destination }) => {
        const sourceStop = allStops.find(s => s.stop_name.toLowerCase() === source.toLowerCase())
            || allStops.find(s => s.stop_name.toLowerCase().includes(source.toLowerCase()));
        const destStop = allStops.find(s => s.stop_name.toLowerCase() === destination.toLowerCase())
            || allStops.find(s => s.stop_name.toLowerCase().includes(destination.toLowerCase()));

        setFromQuery(source);
        setToQuery(destination);
        setFromStop(sourceStop || { stop_name: source, stop_id: null });
        setToStop(destStop   || { stop_name: destination, stop_id: null });

        triggerVoiceSearchRef.current = true;
    };

    // Auto-trigger search after voice fills both stops
    const triggerVoiceSearchRef = useRef(false);
    useEffect(() => {
        if (triggerVoiceSearchRef.current && fromStop && toStop) {
            triggerVoiceSearchRef.current = false;
            handleSearch();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromStop, toStop]);

    // Auto-trigger search from history page
    useEffect(() => {
        if (needsAutoSearch && fromStop && toStop) {
            setNeedsAutoSearch(false);
            handleSearch();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsAutoSearch, fromStop, toStop]);

    const handleShowOnMap = (route) => {
        navigate('/network-map', { state: { routeToDisplay: route } });
    };

    // ---- Favourite helpers ----
    const getRouteFavoriteKey = (route) => {
        const sequence = Array.isArray(route?.busSequence) ? route.busSequence.join('-') : 'no-bus';
        const from = route?.routeSegments?.[0]?.boardingStop || route?.routeStops?.[0]?.stop_name || 'unknown-from';
        const to = route?.routeSegments?.[route?.routeSegments?.length - 1]?.alightingStop
            || route?.routeStops?.[route?.routeStops?.length - 1]?.stop_name || 'unknown-to';
        const routeDistance = getRouteTotalDistance(route);
        const distance = Number.isFinite(routeDistance) ? routeDistance.toFixed(2) : 'na';
        return `${from}::${to}::${sequence}::${distance}`;
    };

    const toggleFavoriteRoute = async (route) => {
        const key = getRouteFavoriteKey(route);
        const isAlreadyFavorite = !!favoriteRoutes[key];
        if (isAlreadyFavorite) {
            setFavoriteRoutes(prev => ({ ...prev, [key]: false }));
            setFavoriteError('');
            setFavoriteMessage('Route removed from favourites.');
            return;
        }
        const fallbackFrom = route?.routeSegments?.[0]?.boardingStop
            || route?.routeStops?.[0]?.stop_name || fromQuery;
        const fallbackTo = route?.routeSegments?.[route?.routeSegments?.length - 1]?.alightingStop
            || route?.routeStops?.[route?.routeStops?.length - 1]?.stop_name || toQuery;
        try {
            setSavingFavoriteRoutes(prev => ({ ...prev, [key]: true }));
            setFavoriteMessage('');
            setFavoriteError('');
            await routesAPI.saveFavoriteRoute({
                startingPoint: fallbackFrom,
                destination: fallbackTo,
                tripName: `${fallbackFrom} to ${fallbackTo}`,
                routeData: route,
            });
            setFavoriteRoutes(prev => ({ ...prev, [key]: true }));
            setFavoriteMessage('Route added to favourites successfully.');
        } catch (err) {
            // Handle authentication errors
            if (!handleAuthError(err, navigate)) {
                setFavoriteError(err.message || 'Failed to save favourite route.');
            }
        } finally {
            setSavingFavoriteRoutes(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    // ---- Speaker / dictation helpers ----
    const handleDictateRoute = async (route, routeIndex) => {
        if (dictatingRoutes[routeIndex]) return;
        setDictationErrors(prev => { const n = { ...prev }; delete n[routeIndex]; return n; });
        setDictatingRoutes(prev => ({ ...prev, [routeIndex]: true }));
        try {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            const response = await fetch(`${PYTHON_API_URL}/dictate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ocr_result: JSON.stringify(route, null, 2) }),
            });
            const data = await response.json();
            if (data.success && data.prediction) {
                if ('speechSynthesis' in window) {
                    let summaryText = '';
                    try {
                        const parsed = typeof data.prediction === 'string'
                            ? JSON.parse(data.prediction)
                            : data.prediction;
                        summaryText = parsed?.summary || '';
                    } catch {
                        summaryText = '';
                    }
                    const utterance = new SpeechSynthesisUtterance(summaryText);
                    utterance.lang = 'en-US';
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    utterance.onstart = () => setSpeakingRoutes(prev => ({ ...prev, [routeIndex]: true }));
                    utterance.onend = () => {
                        setSpeakingRoutes(prev => { const n = { ...prev }; delete n[routeIndex]; return n; });
                        if (intentionalStopRef.current[routeIndex]) delete intentionalStopRef.current[routeIndex];
                    };
                    utterance.onerror = (event) => {
                        if (!intentionalStopRef.current[routeIndex]) {
                            setDictationErrors(prev => ({ ...prev, [routeIndex]: 'Speech synthesis failed' }));
                        }
                        setSpeakingRoutes(prev => { const n = { ...prev }; delete n[routeIndex]; return n; });
                        if (intentionalStopRef.current[routeIndex]) delete intentionalStopRef.current[routeIndex];
                    };
                    window.speechSynthesis.speak(utterance);
                } else {
                    setDictationErrors(prev => ({ ...prev, [routeIndex]: 'Text-to-speech not supported in your browser' }));
                }
            } else {
                setDictationErrors(prev => ({ ...prev, [routeIndex]: data.error || 'Failed to generate speech text' }));
            }
        } catch (error) {
            console.error('Error dictating route:', error);
            // Handle authentication errors first
            if (!handleAuthError(error, navigate)) {
                setDictationErrors(prev => ({ ...prev, [routeIndex]: 'Network error: Could not connect to dictation service' }));
            }
        } finally {
            setDictatingRoutes(prev => { const n = { ...prev }; delete n[routeIndex]; return n; });
        }
    };

    const handleStopSpeech = (routeIndex) => {
        intentionalStopRef.current[routeIndex] = true;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setSpeakingRoutes(prev => { const n = { ...prev }; delete n[routeIndex]; return n; });
        setTimeout(() => { if (intentionalStopRef.current[routeIndex]) delete intentionalStopRef.current[routeIndex]; }, 100);
    };
    const formatTime = (mins) => {
        if (!mins && mins !== 0) return 'N/A';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m} min`;
    };

    const formatDistance = (km) => {
        if (!km && km !== 0) return 'N/A';
        return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`;
    };

    const parseDurationTextToMinutes = (value) => {
        if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
        if (typeof value !== 'string') return null;
        const hoursMatch = value.match(/(\d+(?:\.\d+)?)\s*(h|hr|hour)/i);
        const minsMatch = value.match(/(\d+(?:\.\d+)?)\s*(m|min|minute)/i);
        if (hoursMatch || minsMatch) {
            const hours = hoursMatch ? Number.parseFloat(hoursMatch[1]) : 0;
            const mins = minsMatch ? Number.parseFloat(minsMatch[1]) : 0;
            return Math.max(0, Math.round(hours * 60 + mins));
        }
        const plain = Number.parseFloat(value);
        return Number.isFinite(plain) ? Math.max(0, Math.round(plain)) : null;
    };

    const parseFareTextToPkr = (value) => {
        if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
        if (typeof value !== 'string') return null;
        const match = value.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
        if (!match) return null;
        const numeric = Number.parseFloat(match[1]);
        return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : null;
    };

    const getRouteTotalTime = (route) => {
        return route?.durationMinutes
            ?? route?.estimatedMinutes
            ?? route?.total_time
            ?? parseDurationTextToMinutes(route?.duration)
            ?? null;
    };

    const getRouteTotalDistance = (route) => {
        if (Number.isFinite(route?.distance)) return route.distance;
        if (Number.isFinite(route?.totalDistance)) return route.totalDistance;
        if (Number.isFinite(route?.total_distance)) return route.total_distance;
        const segments = route?.routeSegments || route?.route_segments || [];
        if (segments.length > 0) {
            const sum = segments.reduce((acc, seg) => acc + (Number.parseFloat(seg?.distance) || 0), 0);
            return Number.isFinite(sum) ? sum : null;
        }
        return null;
    };

    const getRouteTotalStops = (route) => {
        if (Number.isFinite(route?.totalStops)) return route.totalStops;
        const explicitStops = route?.routeStops || route?.path_stops || [];
        if (explicitStops.length > 0) return explicitStops.length;
        const segments = route?.routeSegments || route?.route_segments || [];
        if (segments.length > 0) {
            return segments.reduce((acc, seg) => acc + (Number.parseInt(seg?.stopCount, 10) || (seg?.stops || []).length || 0), 0);
        }
        return 0;
    };

    const getRouteTransfers = (route) => {
        if (Number.isFinite(route?.transfers)) return Math.max(0, Math.round(route.transfers));
        if (Number.isFinite(route?.transferCount)) return Math.max(0, Math.round(route.transferCount));
        const segments = route?.routeSegments || route?.route_segments || [];
        return Math.max(0, segments.length - 1);
    };

    const getRouteFareAmount = (route, fallbackDistanceKm) => {
        if (Number.isFinite(route?.farePkr)) return route.farePkr;
        if (Number.isFinite(route?.fare_pkr)) return route.fare_pkr;
        if (Number.isFinite(route?.fare?.amount)) return route.fare.amount;
        const parsed = parseFareTextToPkr(route?.fare);
        if (parsed !== null) return parsed;
        return estimateFare(fallbackDistanceKm);
    };

    const getRouteFareLabel = (route, fallbackDistanceKm) => {
        if (typeof route?.fare === 'string' && route.fare.trim().length > 0) return route.fare;
        const amount = getRouteFareAmount(route, fallbackDistanceKm);
        return Number.isFinite(amount) ? `Rs. ${amount}` : 'N/A';
    };

    // Fare estimate: Rs.30 base + Rs.8/km, rounded to nearest 5
    const estimateFare = (km) => {
        if (!km && km !== 0) return null;
        const raw = 30 + km * 8;
        return Math.ceil(raw / 5) * 5;
    };

    const getRouteLabel = (index) => {
        if (index === 0) return { label: 'Recommended', colorClass: 'bg-green-100 text-green-700 border-green-200' };
        if (index === 1) return { label: 'Alternative', colorClass: 'bg-blue-100 text-blue-700 border-blue-200' };
        return { label: `Option ${index + 1}`, colorClass: 'bg-gray-100 text-gray-600 border-gray-200' };
    };

    const getTransportIcon = (routeName) => {
        const n = (routeName || '').toLowerCase();
        if (n.includes('orange line') || n.includes('train') || n.includes('metro line')) return Train;
        return Bus;
    };

    const getSegmentAccent = (routeName) => {
        const n = (routeName || '').toLowerCase();
        if (n.includes('red')) return { bg: 'bg-red-500', light: 'bg-red-50 text-red-700 border-red-200' };
        if (n.includes('blue')) return { bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 border-blue-200' };
        if (n.includes('green')) return { bg: 'bg-green-500', light: 'bg-green-50 text-green-700 border-green-200' };
        if (n.includes('orange')) return { bg: 'bg-orange-500', light: 'bg-orange-50 text-orange-700 border-orange-200' };
        if (n.includes('metro')) return { bg: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 border-purple-200' };
        return { bg: 'bg-gray-400', light: 'bg-gray-50 text-gray-700 border-gray-200' };
    };

    // Sort routes - updated to use new field names from reference backend
    const sortedRoutes = [...routes].sort((a, b) => {
        if (sortBy === 'time') return (getRouteTotalTime(a) || 0) - (getRouteTotalTime(b) || 0);
        if (sortBy === 'stops') return getRouteTotalStops(a) - getRouteTotalStops(b);
        if (sortBy === 'transfers') return getRouteTransfers(a) - getRouteTransfers(b);
        return 0;
    });

    const SORT_TABS = [
        { key: 'recommended', label: 'Recommended', Icon: Star },
        { key: 'time', label: 'Fastest', Icon: Clock },
        { key: 'stops', label: 'Fewest Stops', Icon: Bus },
        { key: 'transfers', label: 'Fewest Transfers', Icon: Repeat2 },
    ];

    // ---- Detail Modal - Updated for reference backend field names ----
    const DetailModal = ({ route, onClose }) => {
        if (!route) return null;
        // Support both old and new field names for compatibility
        const segments = route.routeSegments || route.route_segments || [];
        const stops = route.routeStops || route.path_stops || [];
        const totalTime = getRouteTotalTime(route);
        const totalDist = getRouteTotalDistance(route);
        const totalStops = getRouteTotalStops(route);
        const totalTransfers = getRouteTransfers(route);
        const fareLabel = getRouteFareLabel(route, totalDist);

        return ReactDOM.createPortal(
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            >
                {/* Sheet panel — slides up from bottom on all screen sizes */}
                <div
                    style={{ backgroundColor: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '680px', maxHeight: '92dvh', overflowY: 'hidden', overflowX: 'hidden', fontFamily: 'Poppins, sans-serif', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Drag handle */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px', flexShrink: 0 }}>
                        <div style={{ width: 36, height: 4, borderRadius: 99, backgroundColor: '#e5e7eb' }} />
                    </div>

                    {/* Header */}
                    <div style={{ padding: '10px 16px 10px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Route Details</p>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {fromStop?.stop_name || stops[0]?.stop_name || 'Start'} → {toStop?.stop_name || stops[stops.length - 1]?.stop_name || 'End'}
                            </h3>
                        </div>
                        <button onClick={onClose} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={16} color="#6b7280" />
                        </button>
                    </div>

                    {/* Stats — 2-column grid (always, scales up naturally on wider screens) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                        {[
                            { Icon: Clock, label: 'Duration', value: formatTime(totalTime), color: '#f97316' },
                            { Icon: Repeat2, label: 'Transfers', value: totalTransfers, color: '#3b82f6' },
                            { Icon: Bus, label: 'Stops', value: totalStops, color: '#6b7280' },
                            { Icon: Banknote, label: 'Est. Fare', value: fareLabel, color: '#10b981' },
                        ].map(({ Icon, label, value, color }, idx) => (
                            <div key={label} style={{
                                padding: '12px 10px',
                                textAlign: 'center',
                                borderRight: idx % 2 === 0 ? '1px solid #f3f4f6' : 'none',
                                borderBottom: idx < 2 ? '1px solid #f3f4f6' : 'none',
                            }}>
                                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px' }}>
                                    <Icon size={15} color={color} />
                                </div>
                                <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 2px', fontWeight: 500 }}>{label}</p>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Scrollable body — segments + stop list */}
                    <div style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, padding: '16px' }}>
                        {/* Real-time Timeline Display */}
                        {route?.timeline && (
                            <div style={{ marginBottom: '24px' }}>
                                <TimelineDisplay route={route} />
                            </div>
                        )}

                        {segments.length > 0 ? segments.map((seg, si) => {
                            // Support both old and new field names
                            const routeName = seg.routeName || seg.route_name;
                            const TransIcon = getTransportIcon(routeName);
                            const segStops = seg.stops || [];
                            return (
                                <div key={si} style={{ marginBottom: si < segments.length - 1 ? 20 : 0 }}>
                                    {/* Segment header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <TransIcon size={15} color="#374151" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{routeName || 'Route'}</p>
                                            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{segStops.length} stops on this segment</p>
                                        </div>
                                        {si < segments.length - 1 && (
                                            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>Transfer</span>
                                        )}
                                    </div>

                                    {/* Stop list */}
                                    {segStops.length > 0 && (
                                        <div style={{ paddingLeft: 16, borderLeft: '2px solid #e5e7eb' }}>
                                            {segStops.map((stop, i) => {
                                                const isFirst = i === 0;
                                                const isLast = i === segStops.length - 1;
                                                return (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < segStops.length - 1 ? 10 : 0 }}>
                                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: isFirst ? '#22c55e' : isLast ? '#ef4444' : '#d1d5db', border: '2px solid #fff', outline: `2px solid ${isFirst ? '#22c55e' : isLast ? '#ef4444' : '#d1d5db'}`, flexShrink: 0, marginLeft: -5 }} />
                                                        <span style={{ fontSize: 13, color: isFirst || isLast ? '#111827' : '#6b7280', fontWeight: isFirst || isLast ? 600 : 400, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                                                            {stop.stop_name || stop}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            stops.length > 0 && (
                                <div style={{ paddingLeft: 16, borderLeft: '2px solid #e5e7eb' }}>
                                    {stops.map((stop, i) => {
                                        const isFirst = i === 0;
                                        const isLast = i === stops.length - 1;
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < stops.length - 1 ? 10 : 0 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isFirst ? '#22c55e' : isLast ? '#ef4444' : '#d1d5db', border: '2px solid #fff', outline: `2px solid ${isFirst ? '#22c55e' : isLast ? '#ef4444' : '#d1d5db'}`, flexShrink: 0, marginLeft: -5 }} />
                                                <span style={{ fontSize: 13, color: isFirst || isLast ? '#111827' : '#6b7280', fontWeight: isFirst || isLast ? 600 : 400, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                                                    {stop.stop_name || stop}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}
                    </div>

                    {/* Footer — buttons always visible, stacked on very small screens */}
                    <div style={{ padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))', borderTop: '1px solid #f3f4f6', display: 'flex', flexWrap: 'wrap', gap: 10, flexShrink: 0, backgroundColor: '#fff' }}>
                        <button
                            onClick={() => { onClose(); handleShowOnMap(route); }}
                            style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 12px', borderRadius: 14, background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: 14, border: '1px solid #bfdbfe', cursor: 'pointer' }}
                        >
                            <Map size={17} /> View on Map
                        </button>
                        <button
                            onClick={onClose}
                            style={{ flex: '1 1 80px', padding: '13px 20px', borderRadius: 14, background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };


    return (
        <div className="pt-24 pb-16 min-h-screen bg-gray-50 overflow-x-hidden">
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
                            <div className="relative">
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
                            {showFromDropdown && filteredFromStops.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
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
                            <div className="relative">
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
                            {showToDropdown && filteredToStops.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
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
                        {/* Search & Voice buttons */}
                        <div className="flex w-full md:w-auto gap-2">
                            <button
                                onClick={openVoiceModal}
                                className="p-3.5 bg-white text-accent-orange font-bold rounded-xl shadow-lg border-2 border-accent-orange hover:bg-orange-50 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                                title="Voice Route Search"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSearch}
                                disabled={loading || !fromStop || !toStop}
                                className="flex-1 md:flex-none px-8 py-3.5 bg-accent-orange text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-2 justify-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                <span>Search</span>
                            </button>
                        </div>
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
                        <div className="space-y-5">

                            {/* Sort tabs */}
                            <div className="flex items-center gap-2 flex-wrap bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                                <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Sort by</span>
                                {SORT_TABS.map(({ key, label, Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setSortBy(key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${sortBy === key
                                            ? 'bg-accent-orange text-white border-accent-orange shadow-sm'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-accent-orange hover:text-accent-orange'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {label}
                                    </button>
                                ))}
                                <span className="ml-auto text-xs text-gray-400 font-medium">{routes.length} option{routes.length > 1 ? 's' : ''}</span>
                            </div>

                            {sortedRoutes.map((route, index) => {
                                const originalIndex = routes.indexOf(route);
                                const { label, colorClass } = getRouteLabel(originalIndex);
                                // Support both old and new field names for compatibility
                                const segments = route.routeSegments || route.route_segments || [];
                                const stops = route.routeStops || route.path_stops || [];
                                const totalTime = getRouteTotalTime(route);
                                const totalDist = getRouteTotalDistance(route);
                                const totalStops = getRouteTotalStops(route);
                                const totalTransfers = getRouteTransfers(route);
                                const isSelected = selectedRouteIndex === index;
                                const isDirect = segments.length <= 1;
                                const fareLabel = getRouteFareLabel(route, totalDist);
                                const firstSegmentName = segments.length > 0 ? (segments[0].routeName || segments[0].route_name) : null;
                                const accent = firstSegmentName ? getSegmentAccent(firstSegmentName) : { bg: 'bg-gray-300', light: 'bg-gray-50 text-gray-600 border-gray-200' };

                                // Favourite + speaker state for this card
                                const favoriteKey = getRouteFavoriteKey(route);
                                const isFavorite = !!favoriteRoutes[favoriteKey];
                                const isSavingFavorite = !!savingFavoriteRoutes[favoriteKey];

                                return (
                                    <div
                                        key={index}
                                        onClick={() => setModalRoute(route)}
                                        className={`bg-white rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer hover:shadow-xl ${isSelected
                                            ? 'border-accent-orange shadow-xl shadow-orange-100'
                                            : 'border-gray-100 shadow-sm hover:border-gray-200'
                                            }`}
                                    >
                                        {/* Top accent bar */}
                                        <div className={`h-1.5 w-full ${isSelected ? 'bg-accent-orange' : accent.bg}`} />

                                        <div className="p-6 md:p-7">
                                            {/* Top row */}
                                            <div className="flex items-start justify-between gap-4 mb-5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${colorClass}`}>{label}</span>
                                                    {isDirect && (
                                                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">Direct</span>
                                                    )}
                                                    {isSelected && (
                                                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-accent-orange border border-orange-200 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Favourite button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavoriteRoute(route);
                                                        }}
                                                        disabled={isSavingFavorite}
                                                        className={`p-2 rounded-full transition-all ${
                                                            isFavorite
                                                                ? 'bg-pink-50 text-pink-600 hover:bg-pink-100 hover:scale-110'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-110'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                                                    >
                                                        {isSavingFavorite ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                                        )}
                                                    </button>

                                                    {/* Speaker button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (speakingRoutes[index]) {
                                                                handleStopSpeech(index);
                                                            } else {
                                                                handleDictateRoute(route, index);
                                                            }
                                                        }}
                                                        disabled={dictatingRoutes[index]}
                                                        className={`p-2 rounded-full transition-all ${
                                                            dictatingRoutes[index]
                                                                ? 'bg-orange-100 text-accent-orange cursor-not-allowed'
                                                                : speakingRoutes[index]
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110'
                                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110'
                                                        }`}
                                                        title={speakingRoutes[index] ? 'Stop speaking' : 'Listen to route instructions'}
                                                    >
                                                        {dictatingRoutes[index] ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : speakingRoutes[index] ? (
                                                            <X className="w-5 h-5" />
                                                        ) : (
                                                            <Volume2 className="w-5 h-5" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleShowOnMap(route); }}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors text-xs border border-blue-100"
                                                    >
                                                        <Map className="w-3.5 h-3.5" />View Map
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedRouteIndex(isSelected ? null : index); }}
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${isSelected
                                                            ? 'bg-accent-orange text-white border-accent-orange'
                                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-accent-orange hover:text-accent-orange'
                                                            }`}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {isSelected ? 'Selected' : 'Select'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Stats row - updated to use new field names */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                                {[
                                                    { Icon: Clock, label: 'Duration', value: formatTime(totalTime), iconBg: 'bg-orange-50', iconColor: 'text-accent-orange' },
                                                    { Icon: Repeat2, label: 'Transfers', value: totalTransfers, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
                                                    { Icon: Bus, label: 'Stops', value: totalStops, iconBg: 'bg-gray-100', iconColor: 'text-gray-500' },
                                                    { Icon: Banknote, label: 'Est. Fare', value: fareLabel, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
                                                ].map(({ Icon, label, value, iconBg, iconColor }) => (
                                                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100`}>
                                                        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                                                            <Icon className={`w-4 h-4 ${iconColor}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 leading-none mb-1">{label}</p>
                                                            <p className="text-sm font-bold text-gray-800 leading-none">{value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Journey flow strip - updated to use new field names */}
                                            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 flex items-center flex-wrap gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                                                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[90px] sm:max-w-[140px]">
                                                        {fromStop?.stop_name || stops[0]?.stop_name || 'Start'}
                                                    </span>
                                                </div>
                                                {segments.length > 0 ? segments.map((seg, i) => {
                                                    const segRouteName = seg.routeName || seg.route_name;
                                                    const TransIcon = getTransportIcon(segRouteName);
                                                    const segAccent = getSegmentAccent(segRouteName);
                                                    return (
                                                        <React.Fragment key={i}>
                                                            <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${segAccent.light}`}>
                                                                <TransIcon className="w-3.5 h-3.5 shrink-0" />
                                                                <span>{segRouteName || 'Route'}</span>
                                                                {seg.stops?.length > 0 && <span className="opacity-60 font-normal">· {seg.stops.length} stops</span>}
                                                            </div>
                                                            {i < segments.length - 1 && (
                                                                <span className="text-xs text-gray-500 font-medium px-1 shrink-0">transfer</span>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                }) : (
                                                    <React.Fragment>
                                                        <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <span className="text-xs text-gray-500 italic">Direct</span>
                                                    </React.Fragment>
                                                )}
                                                <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                                                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[90px] sm:max-w-[140px]">
                                                        {toStop?.stop_name || stops[stops.length - 1]?.stop_name || 'End'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Tap hint */}
                                            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                                                <ChevronRight className="w-3 h-3" /> Tap card to view full stop details
                                            </p>

                                            {/* Dictation error for this card */}
                                            {dictationErrors[index] && (
                                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                                    {dictationErrors[index]}
                                                </p>
                                            )}

                                            {/* Payment flow — shown when this card is selected */}
                                            {isSelected && (
                                                <div
                                                    className="mt-5"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="border-t border-gray-100 pt-5">
                                                        <PaymentFlow
                                                            fare={fareLabel}
                                                            routeData={route}
                                                            fromStop={fromStop?.stop_name || ''}
                                                            toStop={toStop?.stop_name || ''}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Favourite feedback messages */}
                    {favoriteError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {favoriteError}
                        </div>
                    )}
                    {favoriteMessage && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            {favoriteMessage}
                        </div>
                    )}
                </div>
            </div>
            {modalRoute && <DetailModal route={modalRoute} onClose={() => setModalRoute(null)} />}

            {/* ---- Voice Route Search Modal ---- */}
            <VoiceSearchModal
                isOpen={showVoiceModal}
                onClose={closeVoiceModal}
                onRouteFound={handleVoiceRouteFound}
            />
        </div>
    );
};

export default FindRoutesPage;
