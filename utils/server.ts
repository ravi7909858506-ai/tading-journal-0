import { Trade, User } from '../types';
import * as backend from './backend'; // Import the simulated backend

const USER_STORAGE_KEY = 'trade_journal_user'; // This will act as our session token storage

// --- Auth Functions ---

export const getCurrentUser = (): User | null => {
    // This function still checks the browser's storage to see if a session exists.
    try {
        const userData = localStorage.getItem(USER_STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch {
        return null;
    }
};

export const login = async (username: string, password: string): Promise<User> => {
    await delay(400);
    const user = backend.db_login(username, password);
    if (user) {
        // On successful login, store the user object in localStorage as a "session token".
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return user;
    }
    throw new Error("Invalid username or password.");
};

export const logout = async (): Promise<void> => {
    await delay(100);
    // Clear the session token from the browser.
    localStorage.removeItem(USER_STORAGE_KEY);
};


// --- API Functions ---

// Helper function to get the current user ID for API calls.
const getUserId = (): string => {
    const user = getCurrentUser();
    if (!user || !user.id) {
        throw new Error("User not authenticated. Cannot perform this action.");
    }
    return user.id;
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getTrades = async (): Promise<Trade[]> => {
    await delay(200);
    const userId = getUserId();
    const trades = backend.db_getTrades(userId);
    // The backend should return data in the correct order, but we sort here to be safe.
    return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addTrade = async (tradeData: Omit<Trade, 'id'>): Promise<Trade> => {
    await delay(150);
    const userId = getUserId();
    return backend.db_addTrade(userId, tradeData);
};

export const updateTrade = async (updatedTrade: Trade): Promise<Trade> => {
    await delay(150);
    const userId = getUserId();
    return backend.db_updateTrade(userId, updatedTrade);
};

export const deleteTrade = async (id: string): Promise<void> => {
    await delay(150);
    const userId = getUserId();
    backend.db_deleteTrade(userId, id);
};

export const deleteAllTrades = async (): Promise<void> => {
    await delay(250);
    const userId = getUserId();
    backend.db_deleteAllTrades(userId);
};
