import React, { createContext, useContext, useState, useEffect } from 'react';
import { BACKEND_BASE_URL } from '../config/apiConfig';

const AuthContext = createContext();

const API_URL = `${BACKEND_BASE_URL}/auth`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for stored tokens and validate on mount
    useEffect(() => {
        const initializeAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const storedUser = localStorage.getItem('user');

            if (accessToken && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Failed to parse stored user:', error);
                    clearAuthData();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const clearAuthData = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
    };

    const refreshAccessToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                clearAuthData();
                return null;
            }

            const response = await fetch(`${API_URL}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                clearAuthData();
                return null;
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            return data.accessToken;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            clearAuthData();
            return null;
        }
    };

    const login = async (email, password) => {
        try {
            console.log('📍 Login attempt with email:', email);
            setError(null);

            // Real API Mode
            console.log('🌐 Attempting login via API:', API_URL + '/login');
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Login failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `Server error: ${response.status}`;
                } catch (e) {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('📦 Full response data:', data);
            const { accessToken, refreshToken, user: userData } = data.data;
            console.log('🔑 Received tokens and user data:', { accessToken, refreshToken, userData });

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            console.log('✅ Login successful:', userData);
            return userData;
        } catch (error) {
            const errorMsg = error.message || 'Unknown error occurred';
            console.error('❌ Login error:', errorMsg);
            setError(errorMsg);
            throw error;
        }
    };

    const register = async (name, email, password) => {
        try {
            console.log('📍 Registration attempt with email:', email);
            setError(null);

            // Real API Mode
            console.log('🌐 Attempting registration via API:', API_URL + '/register');
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Registration failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `Server error: ${response.status}`;
                } catch (e) {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('📦 Full response data:', data);

            // Registration successful - user needs to login
            // The response contains the user object but no tokens
            console.log('✅ Registration successful - user needs to login');
            return { success: true, message: 'Registration successful. Please login.' };
        } catch (error) {
            const errorMsg = error.message || 'Unknown error occurred';
            console.error('❌ Registration error:', errorMsg);
            setError(errorMsg);
            throw error;
        }
    };

    const logout = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
                await fetch(`${API_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuthData();
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
