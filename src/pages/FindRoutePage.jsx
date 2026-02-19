import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Mic, MapPin, Navigation, Clock } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { useLocation } from 'react-router-dom';
import useRoutes from '../hooks/useRoutes';

const FindRoutePage = () => {
    const { t } = useGlobalContext();
    const location = useLocation();
    const lastAutoSearchRef = useRef('');
    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);
    const { findRoute, getAllStops, loading, error } = useRoutes();
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [searchError, setSearchError] = useState('');
    const [allStops, setAllStops] = useState([]);
    const [filteredFromStops, setFilteredFromStops] = useState([]);
    const [filteredToStops, setFilteredToStops] = useState([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [stopsLoading, setStopsLoading] = useState(true);

    const getStopName = (stop) => stop?.stop_name || stop?.name || '';

    useEffect(() => {
        const loadStops = async () => {
            setStopsLoading(true);
            try {
                const stops = await getAllStops();
                const normalizedStops = Array.isArray(stops) ? stops : [];
                setAllStops(normalizedStops);
                setFilteredFromStops(normalizedStops.slice(0, 20));
                setFilteredToStops(normalizedStops.slice(0, 20));
            } catch {
                setAllStops([]);
                setFilteredFromStops([]);
                setFilteredToStops([]);
            } finally {
                setStopsLoading(false);
            }
        };

        loadStops();
    }, [getAllStops]);

    useEffect(() => {
        const query = source.trim().toLowerCase();
        if (!query) {
            setFilteredFromStops(allStops.slice(0, 20));
            return;
        }

        const filtered = allStops
            .filter((stop) => getStopName(stop).toLowerCase().includes(query))
            .slice(0, 20);
        setFilteredFromStops(filtered);
    }, [source, allStops]);

    useEffect(() => {
        const query = destination.trim().toLowerCase();
        if (!query) {
            setFilteredToStops(allStops.slice(0, 20));
            return;
        }

        const filtered = allStops
            .filter((stop) => getStopName(stop).toLowerCase().includes(query))
            .slice(0, 20);
        setFilteredToStops(filtered);
    }, [destination, allStops]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fromInputRef.current && !fromInputRef.current.contains(event.target)) {
                setShowFromDropdown(false);
            }
            if (toInputRef.current && !toInputRef.current.contains(event.target)) {
                setShowToDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const executeSearch = async (start = source, end = destination) => {
        const trimmedStart = (start || '').trim();
        const trimmedEnd = (end || '').trim();

        if (!trimmedStart || !trimmedEnd) {
            setSearchError('Please enter both starting point and destination.');
            return;
        }

        if (trimmedStart.toLowerCase() === trimmedEnd.toLowerCase()) {
            setSearchError('Starting point and destination must be different.');
            return;
        }

        try {
            setSearchError('');
            const routeResponse = await findRoute(trimmedStart, trimmedEnd);
            setResult(routeResponse);
            setSelectedRouteIndex(0);
        } catch (searchErr) {
            setResult(null);
            setSearchError(searchErr.message || 'Failed to find route.');
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        await executeSearch();
    };

    useEffect(() => {
        const from = location.state?.from;
        const to = location.state?.to;
        const autoSearch = location.state?.autoSearch;

        if (!from || !to) return;

        setSource(from);
        setDestination(to);

        if (autoSearch) {
            const searchKey = `${from}::${to}`;
            if (lastAutoSearchRef.current !== searchKey) {
                lastAutoSearchRef.current = searchKey;
                executeSearch(from, to);
            }
        }
    }, [location.state]);

    const routes = useMemo(() => {
        if (result?.routes && Array.isArray(result.routes)) return result.routes;
        if (result && typeof result === 'object') return [result];
        return [];
    }, [result]);

    const selectedRoute = routes[selectedRouteIndex] || null;

    const routeSteps = useMemo(() => {
        if (!selectedRoute) return [];

        if (Array.isArray(selectedRoute.routeSegments) && selectedRoute.routeSegments.length > 0) {
            return selectedRoute.routeSegments.flatMap((segment, index) => {
                const step = `Take ${segment.routeName || 'route'} from ${segment.boardingStop || 'start'} to ${segment.alightingStop || 'end'}`;
                if (index < selectedRoute.routeSegments.length - 1) {
                    return [step, 'Transfer to next route'];
                }
                return [step];
            });
        }

        if (Array.isArray(selectedRoute.routeStops) && selectedRoute.routeStops.length > 1) {
            const stops = selectedRoute.routeStops.map((stop) => stop.stop_name).filter(Boolean);
            if (stops.length > 1) {
                return [
                    `Start at ${stops[0]}`,
                    ...stops.slice(1, -1).map((stopName) => `Pass through ${stopName}`),
                    `Arrive at ${stops[stops.length - 1]}`,
                ];
            }
        }

        return [];
    }, [selectedRoute]);

    const durationLabel = selectedRoute
        ? `${Math.ceil(selectedRoute.estimatedMinutes || (selectedRoute.totalDistance ? selectedRoute.totalDistance * 2 : 0)) || 0} min`
        : 'N/A';

    const fareLabel = selectedRoute?.fare?.amount
        ? `${selectedRoute.fare.amount} ${selectedRoute.fare.currency || 'PKR'}`
        : 'N/A';

    const distanceLabel = Number.isFinite(selectedRoute?.totalDistance)
        ? `${selectedRoute.totalDistance.toFixed(1)} km`
        : 'N/A';

    const toggleVoice = () => {
        setIsListening(!isListening);
        if (!isListening) {
            setTimeout(() => {
                setIsListening(false);
                setSource("Central Station");
                setDestination("Airport");
            }, 2000);
        }
    };

    return (
        <div className="pt-24 pb-12 px-4 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">{t('findRouteTitle')}</h1>
                    <p className="text-gray-500">{t('findRouteSubtitle')}</p>
                </div>

                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="relative" ref={fromInputRef}>
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('startingPoint')}
                                value={source}
                                onFocus={() => setShowFromDropdown(true)}
                                onChange={(e) => {
                                    setSource(e.target.value);
                                    setShowFromDropdown(true);
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all placeholder:text-gray-400"
                            />

                            {showFromDropdown && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                    {stopsLoading ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Loading stops...</div>
                                    ) : filteredFromStops.length > 0 ? (
                                        filteredFromStops.map((stop, index) => {
                                            const stopName = getStopName(stop);
                                            return (
                                                <button
                                                    key={stop.stop_id || stop.id || `${stopName}-${index}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setSource(stopName);
                                                        setShowFromDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-accent-orange"
                                                >
                                                    {stopName}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500">No stops found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={toInputRef}>
                            <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('destination')}
                                value={destination}
                                onFocus={() => setShowToDropdown(true)}
                                onChange={(e) => {
                                    setDestination(e.target.value);
                                    setShowToDropdown(true);
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all placeholder:text-gray-400"
                            />

                            {showToDropdown && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                    {stopsLoading ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Loading stops...</div>
                                    ) : filteredToStops.length > 0 ? (
                                        filteredToStops.map((stop, index) => {
                                            const stopName = getStopName(stop);
                                            return (
                                                <button
                                                    key={stop.stop_id || stop.id || `${stopName}-${index}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setDestination(stopName);
                                                        setShowToDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-accent-orange"
                                                >
                                                    {stopName}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500">No stops found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={toggleVoice}
                                className={`flex-1 py-3 px-4 rounded-xl border font-medium flex items-center justify-center gap-2 transition-all ${isListening ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Mic className="w-5 h-5" />
                                <span>{isListening ? t('listening') : t('voiceSearch')}</span>
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 px-4 bg-accent-orange text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                <span>{loading ? 'Searching...' : t('searchRoute')}</span>
                            </button>
                        </div>
                    </form>

                    {(searchError || error) && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {searchError || error}
                        </div>
                    )}

                    {/* Dummy Audio Feedback */}
                    {isListening && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-500 italic text-center">
                            "Where would you like to go?"
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {selectedRoute && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 mb-20">
                        <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-accent-orange" />
                                <span className="font-bold">{durationLabel}</span>
                            </div>
                            <div className="text-xl font-bold text-accent-orange font-mono">{fareLabel}</div>
                        </div>

                        {routes.length > 1 && (
                            <div className="px-6 pt-4 flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                                {routes.map((_, index) => (
                                    <button
                                        key={`route-opt-${index}`}
                                        onClick={() => setSelectedRouteIndex(index)}
                                        className={`px-3 py-1 rounded-full text-sm border ${selectedRouteIndex === index ? 'bg-orange-100 text-accent-orange border-orange-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        Route {index + 1}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="p-0">
                            {/* Map Placeholder */}
                            <div className="h-48 bg-gray-200 w-full relative group">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                                    {t('mapVisualization')}
                                </div>
                                <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: 'url("https://via.placeholder.com/600x200")' }}></div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                    <h3 className="font-bold text-gray-900">{t('routeSteps')}</h3>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{t('distance')}: {distanceLabel}</span>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {routeSteps.map((step, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full bg-accent-orange"></div>
                                                {index !== routeSteps.length - 1 && (
                                                    <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                                                )}
                                            </div>
                                            <div className="text-gray-700 text-sm pb-2">
                                                {step}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Payment Section */}
                                <PaymentSection fare={fareLabel} t={t} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PaymentSection = ({ fare, t }) => {
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success

    const handlePayment = () => {
        setPaymentStatus('processing');
        setTimeout(() => {
            setPaymentStatus('success');
        }, 1500);
    };

    if (paymentStatus === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Navigation className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-1">{t('ticketBooked')}</h3>
                <p className="text-green-600 text-sm mb-4">{t('qrGenerated')}</p>
                <div className="bg-white p-4 rounded-lg inline-block shadow-sm border border-gray-200">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=MetroMateTicket" alt="Ticket QR" className="w-24 h-24" />
                </div>
                <button
                    onClick={() => setPaymentStatus('idle')}
                    className="block mt-4 text-sm text-green-700 hover:underline mx-auto"
                >
                    {t('bookAnother')}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                {t('payFare')} <span className="text-accent-orange">{fare}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'processing'}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
                >
                    <div className="w-8 h-8 bg-green-100 rounded-full mb-2 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                        <span className="font-bold text-xs">EP</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">EasyPaisa</span>
                </button>

                <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'processing'}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group"
                >
                    <div className="w-8 h-8 bg-red-100 rounded-full mb-2 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                        <span className="font-bold text-xs">JC</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">JazzCash</span>
                </button>

                <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'processing'}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-100 transition-all group"
                >
                    <div className="w-8 h-8 bg-gray-100 rounded-full mb-2 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{t('payAtStation')}</span>
                </button>
            </div>

            {paymentStatus === 'processing' && (
                <div className="mt-4 text-center text-sm text-gray-500 animate-pulse">
                    {t('processing')}
                </div>
            )}
        </div>
    );
};


export default FindRoutePage;
