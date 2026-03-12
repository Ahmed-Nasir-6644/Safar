import React, { useEffect, useState } from 'react';
import { Heart, Calendar, MapPin, X, Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { routesAPI } from '../utils/api';

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

const FavoriteRoutesPage = () => {
    const { t } = useGlobalContext();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFavorite, setSelectedFavorite] = useState(null);

    const selectedRouteData = selectedFavorite?.routeData || null;
    const routeSegments = Array.isArray(selectedRouteData?.routeSegments) ? selectedRouteData.routeSegments : [];
    const busSequence = Array.isArray(selectedRouteData?.busSequence) ? selectedRouteData.busSequence : [];

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                setIsLoading(true);
                setError('');
                const response = await routesAPI.getFavoriteRoutes();
                const items = Array.isArray(response?.data) ? response.data : [];
                setFavorites(items);
            } catch (fetchError) {
                // Handle authentication errors
                if (!handleAuthError(fetchError, navigate)) {
                    setError(fetchError.message || 'Failed to load favorite routes.');
                    setFavorites([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    return (
        <div className="pt-24 pb-12 px-4 min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{t('favoriteRoutes')}</h1>
                    <span className="px-3 py-1 bg-orange-100 text-accent-orange rounded-full text-sm font-medium">
                        {favorites.length} {t('favorites')}
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
                            <p className="text-gray-500 font-medium">Loading favorite routes...</p>
                        </div>
                    ) : favorites.length > 0 ? (
                        favorites.map((favorite) => (
                            <button
                                key={favorite._id}
                                type="button"
                                onClick={() => setSelectedFavorite(favorite)}
                                className="w-full text-left bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Heart className="w-4 h-4 text-pink-500 fill-current" />
                                            <p className="text-sm font-medium text-gray-600">{favorite.tripName || `${favorite.startingPoint} → ${favorite.destination}`}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                                <div className="w-0.5 h-6 bg-gray-100"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-accent-orange"></div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="font-medium text-gray-900">{favorite.startingPoint || '-'}</p>
                                                <p className="font-medium text-gray-900">{favorite.destination || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 min-w-[140px]">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{favorite.createdAt ? new Date(favorite.createdAt).toLocaleDateString() : '-'}</span>
                                        </div>
                                        <div className="text-xs font-medium text-gray-500 bg-pink-50 px-2 py-1 rounded-md">
                                            Tap to view details
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">{t('noFavorites')}</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedFavorite && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">{selectedFavorite.tripName || t('favoriteRoutes')}</h2>
                            <button
                                type="button"
                                onClick={() => setSelectedFavorite(null)}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto min-h-0">
                            <div className="flex items-center gap-3">
                                <Heart className="w-4 h-4 text-pink-500 fill-current" />
                                <p className="text-sm font-medium text-gray-600">
                                    {selectedFavorite.startingPoint} → {selectedFavorite.destination}
                                </p>
                            </div>

                            {busSequence.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Bus Lines</p>
                                    <div className="flex flex-wrap gap-2">
                                        {busSequence.map((bus, index) => (
                                            <span key={`${bus}-${index}`} className="px-3 py-1 rounded-full text-xs font-bold border border-gray-200 bg-gray-50 text-gray-700">
                                                {bus}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {routeSegments.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Route Segments</p>
                                    <div className="space-y-3">
                                        {routeSegments.map((segment, index) => (
                                            <div key={`${segment.routeName || 'segment'}-${index}`} className="p-3 border border-gray-200 rounded-xl bg-gray-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bus className="w-4 h-4 text-accent-orange" />
                                                    <p className="text-sm font-bold text-gray-900">{segment.routeName || 'Route'}</p>
                                                </div>
                                                <p className="text-sm text-gray-700">From: {segment.boardingStop || '-'}</p>
                                                <p className="text-sm text-gray-700">To: {segment.alightingStop || '-'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {routeSegments.length === 0 && (
                                <p className="text-sm text-gray-500">No detailed segment data available for this favorite route.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FavoriteRoutesPage;
