import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Simulate checking for a logged-in user on mount
    useEffect(() => {
        // Here you would check localStorage or an auth token
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (email, password) => {
        // MOCK LOGIN - Replace with actual API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockUser = {
                    name: "Demo User",
                    email: email || "demo@metromate.com"
                };
                setUser(mockUser);
                localStorage.setItem('user', JSON.stringify(mockUser));
                resolve(mockUser);
            }, 800); // Slightly faster for demo
        });
    };

    const signup = (name, email, password) => {
        // MOCK SIGNUP - Replace with actual API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockUser = {
                    name: name || "Demo User",
                    email: email || "demo@metromate.com"
                };
                setUser(mockUser);
                localStorage.setItem('user', JSON.stringify(mockUser));
                resolve(mockUser);
            }, 800);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
