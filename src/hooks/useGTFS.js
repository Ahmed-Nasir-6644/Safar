import { useState, useCallback } from 'react';
import { gtfsAPI } from '../utils/api';

export const useGTFS = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [gtfsData, setGtfsData] = useState(null);
    const [stats, setStats] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📦 Loading GTFS data');
            const data = await gtfsAPI.loadData();
            console.log('✅ GTFS data loaded:', data);
            return data;
        } catch (err) {
            console.error('❌ Error loading GTFS data:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📊 Fetching all GTFS data');
            const data = await gtfsAPI.getAllData();
            console.log('✅ All GTFS data:', data);
            setGtfsData(data.data);
            return data.data;
        } catch (err) {
            console.error('❌ Error fetching GTFS data:', err);
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
            console.log('📈 Fetching GTFS statistics');
            const data = await gtfsAPI.getStats();
            console.log('✅ GTFS stats:', data);
            setStats(data.data);
            return data.data;
        } catch (err) {
            console.error('❌ Error fetching GTFS stats:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getDataType = useCallback(async (dataType) => {
        setLoading(true);
        setError(null);
        try {
            console.log(`📋 Fetching ${dataType} data`);
            const data = await gtfsAPI.getDataType(dataType);
            console.log(`✅ ${dataType} data:`, data);
            return data.data;
        } catch (err) {
            console.error(`❌ Error fetching ${dataType} data:`, err);
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
            console.log('🔎 Searching GTFS stops:', query);
            const data = await gtfsAPI.searchStops(query);
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

    const getRoutesForStop = useCallback(async (stopId) => {
        setLoading(true);
        setError(null);
        try {
            console.log('🚌 Fetching routes for stop:', stopId);
            const data = await gtfsAPI.getRoutesForStop(stopId);
            console.log('✅ Routes for stop:', data);
            return data.data;
        } catch (err) {
            console.error('❌ Error fetching routes:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const exportData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('💾 Exporting GTFS data');
            const data = await gtfsAPI.exportData();
            console.log('✅ Data exported:', data);
            return data;
        } catch (err) {
            console.error('❌ Error exporting data:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        gtfsData,
        stats,
        loading,
        error,
        loadData,
        getAllData,
        getStats,
        getDataType,
        searchStops,
        getRoutesForStop,
        exportData,
    };
};

export default useGTFS;
