import { useState, useCallback } from 'react';
import { usersAPI } from '../utils/api';

export const useUsers = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const createUser = useCallback(async (userData) => {
        setLoading(true);
        setError(null);
        try {
            console.log('👤 Creating user:', userData);
            const data = await usersAPI.createUser(userData);
            console.log('✅ User created:', data);
            return data.data;
        } catch (err) {
            console.error('❌ Error creating user:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAllUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('👥 Fetching all users');
            const data = await usersAPI.getAllUsers();
            console.log('✅ Users loaded:', data);
            setUsers(data.data);
            return data.data;
        } catch (err) {
            console.error('❌ Error fetching users:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getUserById = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        try {
            console.log('👤 Fetching user:', userId);
            const data = await usersAPI.getUserById(userId);
            console.log('✅ User loaded:', data);
            setCurrentUser(data.data);
            return data.data;
        } catch (err) {
            console.error('❌ Error fetching user:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = useCallback(async (userId, userData) => {
        setLoading(true);
        setError(null);
        try {
            console.log('✏️ Updating user:', userId);
            const data = await usersAPI.updateUser(userId, userData);
            console.log('✅ User updated:', data);
            setCurrentUser(data.data);
            return data.data;
        } catch (err) {
            console.error('❌ Error updating user:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteUser = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        try {
            console.log('🗑️ Deleting user:', userId);
            const data = await usersAPI.deleteUser(userId);
            console.log('✅ User deleted:', data);
            return data.data;
        } catch (err) {
            console.error('❌ Error deleting user:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        users,
        currentUser,
        loading,
        error,
        createUser,
        getAllUsers,
        getUserById,
        updateUser,
        deleteUser,
    };
};

export default useUsers;
