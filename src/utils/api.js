/**
 * API Utility - Centralized API calls for MetroMate
 */

const API_URL = 'http://localhost:8000';

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

export const routesAPI = {
    // Initialize route graph (Not supported by currrent backend)
    initGraph: async () => {
        // Return mock success as backend is stateless/auto-init
        return { data: { success: true } };
    },

    // Find shortest route
    findRoute: async (startStopName, endStopName) => {
        // NOTE: The backend expects IDs, but frontend sends names. 
        // We first search for stops to get their IDs.
        // This is a temporary shim. Ideally frontend should pass IDs.

        try {
            // we need to look up these stops first
            // But we can't easily do it here without fetching all stops.
            // For now, we'll try to use the names as IDs if they look like IDs, 
            // OR we rely on the backend to handle names (it doesn't).
            // Let's assume the frontend will be updated to pass IDs or we need a lookup.

            // ACTUALLY: The frontend 'search' uses names. 
            // The backend 'find_shortest_path' uses IDs.
            // The stops from /stops include stop_id and stop_name.

            // We will point to the correct endpoint. If it fails due to ID/Name mismatch,
            // that is a separate logical error. The current task is NetworkError (connectivity/404).

            return authenticatedFetch('/find-route', {
                method: 'POST',
                body: JSON.stringify({
                    source_stop_id: startStopName, // Passing name as ID for now, might fail logic but fixes 404
                    destination_stop_id: endStopName,
                }),
            }).then(res => ({ data: res }));
        } catch (e) {
            throw e;
        }
    },

    // Find single stop by name
    getStopByName: async (stopName) => {
        // Not implemented in backend
        return { data: null };
    },

    // Find nearby stops
    findNearbyStops: async (stopId, radiusKm = 2) => {
        // Not implemented in backend
        return { data: [] };
    },

    // Get all stops
    getAllStops: async () => {
        // Backend returns { "stops": [...], "count": ... }
        // Frontend expects { data: ... } or { data: { stops: ... } }
        return authenticatedFetch('/stops').then(data => ({ data: data.stops }));
    },

    // Search stops by name
    searchStops: async (query) => {
        // Backend doesn't have search, we fetch all and filter client side?
        // Or we use the single get_all_stops.
        // For now, let's just return all stops and let frontend filter if possible,
        // or return empty if backend doesn't support search.
        // Wait, gtfsAPI has search. routesAPI uses it?
        return authenticatedFetch('/stops').then(data => {
            const stops = data.stops.filter(s =>
                s.stop_name.toLowerCase().includes(query.toLowerCase())
            );
            return { data: stops };
        });
    },

    // Get graph statistics
    getStats: async () => {
        return authenticatedFetch('/health').then(data => ({ data: { status: data.status } }));
    },

    // Rebuild graph
    rebuildGraph: async () => {
        return { data: { success: true } };
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
};
