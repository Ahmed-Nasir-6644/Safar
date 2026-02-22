/**
 * API Utility - Centralized API calls for MetroMate
 * Aligned with reference backend contract (Safar-Backend)
 */

const API_URL = 'http://localhost:5000';

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('accessToken');
};

// Helper function for authenticated requests
const authenticatedFetch = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
};

// ==================== GTFS Routes ====================

export const gtfsAPI = {
    // Load GTFS data into cache
    loadData: async () => {
        return authenticatedFetch('/gtfs/load', { method: 'POST' });
    },

    // Get all GTFS data
    getAllData: async () => {
        return authenticatedFetch('/gtfs/all');
    },

    // Get GTFS statistics
    getStats: async () => {
        return authenticatedFetch('/gtfs/stats');
    },

    // Get specific data type (agency, stops, routes, trips, etc.)
    getDataType: async (dataType) => {
        return authenticatedFetch(`/gtfs/${dataType}`);
    },

    // Search stops by name
    searchStops: async (query) => {
        return authenticatedFetch(`/gtfs/search/stops?query=${encodeURIComponent(query)}`);
    },

    // Get routes for a specific stop
    getRoutesForStop: async (stopId) => {
        return authenticatedFetch(`/gtfs/routes/stop/${stopId}`);
    },

    // Export all data to JSON
    exportData: async () => {
        return authenticatedFetch('/gtfs/export', { method: 'POST' });
    },
};

// ==================== Route Finder Routes ====================
// Aligned with reference backend contract (routeFinderRoutes.js / routeFinderController.js)

export const routesAPI = {
    // Initialize route graph
    initGraph: async () => {
        return authenticatedFetch('/routes/init', { method: 'POST' });
    },

    // Initialize graph and get all stops (combined endpoint)
    initAndGetAllStops: async () => {
        return authenticatedFetch('/routes/init-and-get-stops');
    },

    // Find shortest route by stop names
    findRoute: async (startStopName, endStopName, maxRoutes = 6) => {
        return authenticatedFetch('/routes/find/by-name', {
            method: 'POST',
            body: JSON.stringify({
                startStopName,
                endStopName,
                maxRoutes,
            }),
        });
    },

    // Find route by stop IDs
    findRouteById: async (startStopId, endStopId) => {
        return authenticatedFetch('/routes/find', {
            method: 'POST',
            body: JSON.stringify({
                startStopId,
                endStopId,
            }),
        });
    },

    // Find single stop by name
    getStopByName: async (stopName) => {
        return authenticatedFetch(`/routes/stop/by-name?stopName=${encodeURIComponent(stopName)}`);
    },

    // Find nearby stops
    findNearbyStops: async (stopId, radiusKm = 2) => {
        return authenticatedFetch('/routes/nearby', {
            method: 'POST',
            body: JSON.stringify({
                stopId,
                radiusKm,
            }),
        });
    },

    // Get all stops
    getAllStops: async () => {
        return authenticatedFetch('/routes/stops');
    },

    // Search stops by name
    searchStops: async (query) => {
        return authenticatedFetch(`/routes/search?query=${encodeURIComponent(query)}`);
    },

    // Get current user's route search history
    getSearchHistory: async () => {
        return authenticatedFetch('/routes/search-history');
    },

    // Save selected route as favorite for current user
    saveFavoriteRoute: async (favoriteRouteData) => {
        return authenticatedFetch('/routes/favorite', {
            method: 'POST',
            body: JSON.stringify(favoriteRouteData),
        });
    },

    // Get current user's saved favorite routes
    getFavoriteRoutes: async () => {
        return authenticatedFetch('/routes/favorite');
    },

    // Get graph statistics
    getStats: async () => {
        return authenticatedFetch('/routes/stats');
    },

    // Rebuild graph
    rebuildGraph: async () => {
        return authenticatedFetch('/routes/rebuild', { method: 'POST' });
    },
};

// ==================== Booking / Payment ====================

export const bookingAPI = {
    /**
     * Book a ticket.
     * Payload: { paymentMethod, fromStop, toStop, fare, routeData }
     * Response: { success, message, data: { ticketNumber, fare, payment: { method, status, qrCodeImage?, qrPayload? } } }
     */
    bookTicket: async (payload) => {
        return authenticatedFetch('/booking/book', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    /**
     * Get booking status by ticket number.
     */
    getBookingStatus: async (ticketNumber) => {
        return authenticatedFetch(`/booking/status/${encodeURIComponent(ticketNumber)}`);
    },
};

// ==================== User Routes (Protected) ====================

export const usersAPI = {
    // Create new user
    createUser: async (userData) => {
        return authenticatedFetch('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    // Get all users
    getAllUsers: async () => {
        return authenticatedFetch('/users');
    },

    // Get user by ID
    getUserById: async (userId) => {
        return authenticatedFetch(`/users/${userId}`);
    },

    // Update user
    updateUser: async (userId, userData) => {
        return authenticatedFetch(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    // Delete user
    deleteUser: async (userId) => {
        return authenticatedFetch(`/users/${userId}`, { method: 'DELETE' });
    },
};

export default {
    gtfsAPI,
    routesAPI,
    usersAPI,
    bookingAPI,
};
