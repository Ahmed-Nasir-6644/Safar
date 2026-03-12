import React, { useEffect, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { routesAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

// Helper function to handle authentication errors
const handleAuthError = async (error, navigate) => {
    let is403 = false;
    
    // Check different types of 403 errors
    if (error?.response?.status === 403) {
        is403 = true;
    } else if (error?.status === 403) {
        is403 = true;
    } else if (typeof error === 'object' && error.success === false && 
               error.message === 'Invalid or expired access token') {
        is403 = true;
    } else if (error?.message && error.message.includes('403')) {
        is403 = true;
    } else if (error instanceof Response && error.status === 403) {
        is403 = true;
    }
    
    if (is403) {
        // Clear any stored auth tokens
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        
        // Redirect to login page
        navigate('/login', { 
            replace: true,
            state: { message: 'Your session has expired. Please log in again.' }
        });
        return true; // Indicates that auth error was handled
    }
    return false; // Not an auth error
};

const HistoryPage = () => {
    const { t } = useGlobalContext();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const normalizeHistoryItems = (payload) => {
        const rawItems = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
                ? payload.data
                : [];

        return rawItems.map((item, index) => {
            const createdAt = item?.createdAt || item?.updatedAt;
            const dateLabel = createdAt
                ? new Date(createdAt).toLocaleDateString()
                : '-';

            return {
                id: item?._id || `${item?.startingPoint || 'trip'}-${item?.destination || 'item'}-${index}`,
                from: item?.startingPoint || '-',
                to: item?.destination || '-',
                date: dateLabel,
                fare: item?.fare || item?.estimatedFare || '-',
            };
        });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                setError('');
                const response = await routesAPI.getSearchHistory();
                setHistory(normalizeHistoryItems(response));
            } catch (fetchError) {
                // Handle authentication errors
                if (!handleAuthError(fetchError, navigate)) {
                    setError(fetchError.message || 'Failed to load trip history.');
                    setHistory([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return (
        <div className="pt-24 pb-12 px-4 min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{t('tripHistory')}</h1>
                    <span className="px-3 py-1 bg-orange-100 text-accent-orange rounded-full text-sm font-medium">
                        {history.length} {t('trips')}
                    </span>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-500 font-medium">Loading trip history...</p>
                        </div>
                    ) : (
                        history.length > 0 ? (
                        history.map((trip) => (
                            <button
                                key={trip.id}
                                type="button"
                                onClick={() => navigate('/find-routes', {
                                    state: {
                                        from: trip.from,
                                        to: trip.to,
                                        autoSearch: true,
                                    },
                                })}
                                className="w-full text-left bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                                <div className="w-0.5 h-6 bg-gray-100"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-accent-orange"></div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="font-medium text-gray-900">{trip.from}</p>
                                                <p className="font-medium text-gray-900">{trip.to}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 min-w-[120px]">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{trip.date}</span>
                                        </div>
                                        <div className="text-lg font-bold text-accent-orange font-mono">
                                            {trip.fare}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">{t('noTrips')}</p>
                        </div>
                    )
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
