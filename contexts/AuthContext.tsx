import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as api from '../utils/server';
import { User } from '../types';
import { FullScreenLoader } from '../components/FullScreenLoader';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if user is already logged in (e.g., from localStorage)
        const checkLoggedInUser = () => {
            try {
                const currentUser = api.getCurrentUser();
                setUser(currentUser);
                if (currentUser) {
                    api.seedInitialData(); // Also seed here on app load for existing user
                }
            } catch (err) {
                console.error("Failed to get current user", err);
            } finally {
                setIsAuthLoading(false);
            }
        };
        checkLoggedInUser();
    }, []);

    const login = async (username: string, password: string) => {
        setIsAuthLoading(true);
        setError(null);
        try {
            const loggedInUser = await api.login(username, password);
            setUser(loggedInUser);
            // After user is set, their ID is available via getCurrentUser in the API service
            api.seedInitialData(); // Seed data for the new user if they have none.
        } catch (err: any) {
            setError(err.message || "Login failed.");
            throw err; // Re-throw to be caught in the component
        } finally {
            setIsAuthLoading(false);
        }
    };

    const logout = async () => {
        // No need to set loading for logout as it should be fast
        try {
            await api.logout();
            setUser(null);
        } catch (err: any) {
            setError(err.message || "Logout failed.");
        }
    };

    if (isAuthLoading) {
        return <FullScreenLoader message="Initializing..." />;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading: isAuthLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};