import { useState, useCallback } from 'react';
import { routesAPI } from '../utils/api';

export const useRoutes = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [routeData, setRouteData] = useState(null);

    const findRoute = useCallback(async (startStopId, endStopId) => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 Finding route from', startStopId, 'to', endStopId);
            const data = await routesAPI.findRoute(startStopId, endStopId);
            console.log('✅ Route found:', data);
            setRouteData(data.data);
            return data.data;
        } catch (err) {
            console.error('❌ Error finding route:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAllStops = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📍 Fetching all stops from API');
            const data = await routesAPI.getAllStops();
            console.log('✅ Raw API response:', data);
            console.log('✅ data.data:', data.data);
            console.log('✅ data.data type:', typeof data.data);
            console.log('✅ data.data is array?', Array.isArray(data.data));

            if (data.data && data.data.length > 0) {
                console.log('✅ First stop object:', JSON.stringify(data.data[0], null, 2));
            }

            // Safely extract stops
            let stopsToReturn = [];
            if (Array.isArray(data.data)) {
                stopsToReturn = data.data;
            } else if (data.data && Array.isArray(data.data.stops)) {
                stopsToReturn = data.data.stops;
            } else if (data.data) {
                console.warn('⚠️ Unexpected data structure:', data.data);
                stopsToReturn = data.data;
            }

            console.log('✅ Returning stops array with length:', stopsToReturn.length);
            return stopsToReturn;
        } catch (err) {
            console.error('❌ Error fetching stops:', err);
            console.error('❌ Error message:', err.message);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const searchStops = useCallback(async (query) => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔎 Searching stops:', query);
            const data = await routesAPI.searchStops(query);
            console.log('✅ Search results:', data);
            return data.data;
        } catch (err) {
            console.error('❌ Error searching stops:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getNearbyStops = useCallback(async (stopId, radiusKm = 2) => {
        setLoading(true);
        setError(null);
        try {
            console.log('📍 Finding nearby stops:', { stopId, radiusKm });
            const data = await routesAPI.findNearbyStops(stopId, radiusKm);
            console.log('✅ Nearby stops:', data);
            return data.data;
        } catch (err) {
            console.error('❌ Error finding nearby stops:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📊 Fetching route statistics');
            const data = await routesAPI.getStats();
            console.log('✅ Stats loaded:', data);
            return data.data;
        } catch (err) {
            console.error('❌ Error fetching stats:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const initGraph = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔄 Initializing route graph');
            const data = await routesAPI.initGraph();
            console.log('✅ Graph initialized:', data);
            return data;
        } catch (err) {
            console.error('❌ Error initializing graph:', err);
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
        getAllStops,
        searchStops,
        getNearbyStops,
        getStats,
        initGraph,
    };
};

export default useRoutes;
