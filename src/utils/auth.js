/**
 * Authentication utility functions
 */

/**
 * Check if user is properly authenticated
 * @param {object} user - User object from GlobalContext
 * @returns {boolean} - True if authenticated, false otherwise
 */
export const isAuthenticated = (user) => {
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    // User must exist in context AND have a valid token AND be stored in localStorage
    return !!(user && accessToken && storedUser);
};

/**
 * Check if user has a valid session
 * @returns {boolean} - True if session exists, false otherwise
 */
export const hasValidSession = () => {
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    return !!(accessToken && storedUser);
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // legacy cleanup
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token'); // legacy cleanup
};

/**
 * Get stored user data
 * @returns {object|null} - User object or null if not found
 */
export const getStoredUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        return null;
    }
};

/**
 * Get access token
 * @returns {string|null} - Access token or null if not found
 */
export const getAccessToken = () => {
    return localStorage.getItem('accessToken');
};

/**
 * Handle authentication errors consistently across the app
 * @param {Error} error - The error object
 * @param {Function} navigate - React Router navigate function
 * @returns {boolean} - True if error was handled (redirect to login), false if not an auth error
 */
export const handleAuthError = async (error, navigate) => {
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
    } else if (error?.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        // Sometimes 403s come as fetch errors, check the response if available
        try {
            const response = await fetch(error.url || '', { method: 'HEAD' });
            if (response.status === 403) {
                is403 = true;
            }
        } catch {
            // Ignore additional errors
        }
    }
    
    if (is403) {
        // Clear all authentication data
        clearAuthData();
        
        // Redirect to login page
        navigate('/login', { 
            replace: true,
            state: { message: 'Your session has expired. Please log in again.' }
        });
        return true; // Indicates that auth error was handled
    }
    return false; // Not an auth error
};