// This file simulates a stateful backend server with an in-memory database.
// In a real application, this would be a separate server process with a real database.

import { Trade, User, InstrumentType, TradeDirection, OptionType, TradeCategory, MarketIndex, McxCommodity } from '../types';

// --- In-Memory Database ---

interface Database {
  users: Record<string, Omit<User, 'id'> & { passwordHash: string }>;
  trades: Record<string, Trade[]>; // Keyed by userId
}

// A simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 15);

const mockData: Trade[] = [
    { id: '1', date: '2023-10-26', ticker: 'RELIANCE', instrument: InstrumentType.Stock, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Long, size: 10, entryPrice: 2300.50, exitPrice: 2325.00, stopLoss: 2290.00, target: 2330.00, setup: 'Breakout', notes: 'Good volume on breakout.' },
    { id: '2', date: '2023-10-25', ticker: 'TCS', instrument: InstrumentType.Stock, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Short, size: 5, entryPrice: 3400.00, exitPrice: 3380.00, stopLoss: 3410.00, target: 3375.00, setup: 'Reversal', notes: 'Faded the morning pump.' },
    { id: '3', date: '2023-10-24', ticker: '44000', instrument: InstrumentType.Index, marketIndex: MarketIndex.BANKNIFTY, tradeCategory: TradeCategory.Option, optionType: OptionType.Call, strikePrice: 44000, direction: TradeDirection.Long, size: 50, entryPrice: 150.50, exitPrice: 120.00, stopLoss: 130.00, target: 200.00, setup: 'Expiry Play', notes: 'IV crush was higher than expected.' },
    { id: '4', date: '2023-11-01', ticker: 'INFY', instrument: InstrumentType.Stock, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Long, size: 15, entryPrice: 1450.00, exitPrice: 1465.25, setup: 'Trend Following', notes: 'Followed the trend after positive news.' },
    { id: '5', date: '2023-11-02', ticker: 'HDFCBANK', instrument: InstrumentType.Stock, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Short, size: 8, entryPrice: 1500.50, exitPrice: 1505.00, setup: 'Fading Strength', notes: 'Got stopped out. Should have waited for confirmation.' },
    { id: '6', date: '2023-11-03', ticker: 'BTC/INR', instrument: InstrumentType.Crypto, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Long, size: 0.01, entryPrice: 2800000, exitPrice: 2900000, setup: 'Support Bounce', notes: 'Bounced off the 2.8M support level.' },
    { id: '7', date: '2023-11-04', ticker: 'GOLDM', instrument: InstrumentType.Commodity, mcxCommodity: McxCommodity.GOLD, tradeCategory: TradeCategory.Future, direction: TradeDirection.Long, size: 1, entryPrice: 59000, exitPrice: 59500, stopLoss: 58800, target: 59800, setup: 'Inflation Hedge', notes: 'Positive global cues.' }
];


// Initialize our in-memory DB
const db: Database = {
    users: {
        'user-123': { username: 'trader', passwordHash: 'password' }, // Plain text for demo purposes
    },
    trades: {
        'user-123': mockData,
    }
};

// --- Backend Logic Functions ---

// Note: In a real backend, userId would come from a validated session token (e.g., JWT).
// For this simulation, we'll pass it explicitly.

export const db_login = (username: string, password: string): User | null => {
    const userId = Object.keys(db.users).find(id => 
        db.users[id].username === username && db.users[id].passwordHash === password
    );

    if (userId) {
        // Seed data if the user has no trades yet.
        // In a real app, this might just initialize an empty array for a new user.
        if (db.trades[userId] === undefined) {
            db.trades[userId] = userId === 'user-123' ? mockData : [];
        }
        return { id: userId, username };
    }
    return null;
};

export const db_getTrades = (userId: string): Trade[] => {
    if (!db.trades[userId]) {
        // This case handles a valid user who might not have any trades yet.
        return [];
    }
    // Return a copy to prevent direct mutation of the DB state from outside
    return [...db.trades[userId]];
};

export const db_addTrade = (userId: string, tradeData: Omit<Trade, 'id'>): Trade => {
    if (!db.users[userId]) {
        throw new Error("User not found.");
    }
    const newTrade: Trade = { ...tradeData, id: generateId() };

    if (!db.trades[userId]) {
        db.trades[userId] = [];
    }

    db.trades[userId].unshift(newTrade); // Add to the beginning
    return { ...newTrade }; // Return a copy
};

export const db_updateTrade = (userId: string, updatedTrade: Trade): Trade => {
    if (!db.trades[userId]) {
        throw new Error("No trades found for this user.");
    }
    const index = db.trades[userId].findIndex(t => t.id === updatedTrade.id);
    if (index === -1) {
        throw new Error("Trade not found.");
    }
    db.trades[userId][index] = updatedTrade;
    return { ...updatedTrade }; // Return a copy
};

export const db_deleteTrade = (userId: string, tradeId: string): void => {
     if (!db.trades[userId]) {
        throw new Error("No trades found for this user.");
    }
    const initialLength = db.trades[userId].length;
    db.trades[userId] = db.trades[userId].filter(t => t.id !== tradeId);
    if (db.trades[userId].length === initialLength) {
        // Optional: Throw an error if the trade to be deleted wasn't found
        // throw new Error("Trade to delete not found.");
    }
};

export const db_deleteAllTrades = (userId: string): void => {
    if (!db.users[userId]) {
        throw new Error("User not found.");
    }
    db.trades[userId] = [];
};
