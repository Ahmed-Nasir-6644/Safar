import { useState, useCallback } from 'react';
import { routesAPI } from '../utils/api';

/**
 * useRoutes hook - Aligned with reference backend contract
 * Response format: { success: boolean, message: string, data: ... }
 */
export const useRoutes = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [routeData, setRouteData] = useState(null);

    /**
     * Find route by stop names
     * Backend: POST /routes/find/by-name
     * Request: { startStopName, endStopName, maxRoutes }
     * Response: { success, message, data: { routes: [...], farePolicy: {...} } }
     */
    const findRoute = useCallback(async (startStopName, endStopName, maxRoutes = 6) => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 Finding route from', startStopName, 'to', endStopName);
            const response = await routesAPI.findRoute(startStopName, endStopName, maxRoutes);
            console.log('✅ Route response:', response);
            
            // Response structure: { success, message, data }
            if (!response.success) {
                throw new Error(response.message || 'Failed to find route');
            }
            
            setRouteData(response.data);
            return response.data;
        } catch (err) {
            console.error('❌ Error finding route:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Find route by stop IDs
     * Backend: POST /routes/find
     * Request: { startStopId, endStopId }
     * Response: { success, message, data }
     */
    const findRouteById = useCallback(async (startStopId, endStopId) => {
        setLoading(true);
        setError(null);
        try {
            console.log('� Finding route by ID from', startStopId, 'to', endStopId);
            const response = await routesAPI.findRouteById(startStopId, endStopId);
            console.log('✅ Route response:', response);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to find route');
            }
            
            setRouteData(response.data);
            return response.data;
        } catch (err) {
            console.error('❌ Error finding route:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get all stops
     * Backend: GET /routes/stops
     * Response: { success, message, data: [...stops] }
     */
    const getAllStops = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📍 Fetching all stops from API');
            const response = await routesAPI.getAllStops();
            console.log('✅ Raw API response:', response);

            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch stops');
            }

            // Response structure: { success, message, data: [...stops] }
            const stops = Array.isArray(response.data) ? response.data : [];
            console.log('✅ Returning stops array with length:', stops.length);
            return stops;
        } catch (err) {
            console.error('❌ Error fetching stops:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Search stops by name
     * Backend: GET /routes/search?query=...
     * Response: { success, message, data: [...stops] }
     */
    const searchStops = useCallback(async (query) => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔎 Searching stops:', query);
            const response = await routesAPI.searchStops(query);
            console.log('✅ Search results:', response);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to search stops');
            }
            
            return Array.isArray(response.data) ? response.data : [];
        } catch (err) {
            console.error('❌ Error searching stops:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Find nearby stops
     * Backend: POST /routes/nearby
     * Request: { stopId, radiusKm }
     * Response: { success, message, data: [...stops] }
     */
    const getNearbyStops = useCallback(async (stopId, radiusKm = 2) => {
        setLoading(true);
        setError(null);
        try {
            console.log('📍 Finding nearby stops:', { stopId, radiusKm });
            const response = await routesAPI.findNearbyStops(stopId, radiusKm);
            console.log('✅ Nearby stops:', response);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to find nearby stops');
            }
            
            return Array.isArray(response.data) ? response.data : [];
        } catch (err) {
            console.error('❌ Error finding nearby stops:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get graph statistics
     * Backend: GET /routes/stats
     * Response: { success, message, data: {...stats} }
     */
    const getStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📊 Fetching route statistics');
            const response = await routesAPI.getStats();
            console.log('✅ Stats loaded:', response);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch stats');
            }
            
            return response.data;
        } catch (err) {
            console.error('❌ Error fetching stats:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Initialize route graph
     * Backend: POST /routes/init
     * Response: { success, message, data: [...stopNames] }
     */
    const initGraph = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔄 Initializing route graph');
            const response = await routesAPI.initGraph();
            console.log('✅ Graph initialized:', response);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to initialize graph');
            }
            
            return response;
        } catch (err) {
            console.error('❌ Error initializing graph:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Initialize graph and get all stops (combined)
     * Backend: GET /routes/init-and-get-stops
     * Response: { success, message, data: [...stops] }
     */
    const initAndGetAllStops = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔄 Initializing graph and fetching all stops');
            const response = await routesAPI.initAndGetAllStops();
            console.log('✅ Init and get stops response:', response);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to initialize and fetch stops');
            }
            
            return Array.isArray(response.data) ? response.data : [];
        } catch (err) {
            console.error('❌ Error initializing and fetching stops:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get stop by name
     * Backend: GET /routes/stop/by-name?stopName=...
     * Response: { success, message, data: {...stop} }
     */
    const getStopByName = useCallback(async (stopName) => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 Finding stop by name:', stopName);
            const response = await routesAPI.getStopByName(stopName);
            console.log('✅ Stop found:', response);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to find stop');
            }
            
            return response.data;
        } catch (err) {
            console.error('❌ Error finding stop:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Rebuild graph
     * Backend: POST /routes/rebuild
     * Response: { success, message }
     */
    const rebuildGraph = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔄 Rebuilding route graph');
            const response = await routesAPI.rebuildGraph();
            console.log('✅ Graph rebuilt:', response);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to rebuild graph');
            }
            
            return response;
        } catch (err) {
            console.error('❌ Error rebuilding graph:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        routeData,
        loading,
        error,
        findRoute,
        findRouteById,
        getAllStops,
        searchStops,
        getNearbyStops,
        getStats,
        initGraph,
        initAndGetAllStops,
        getStopByName,
        rebuildGraph,
    };
};

export default useRoutes;
