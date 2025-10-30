import { Trade, User, InstrumentType, TradeDirection, OptionType, TradeCategory, MarketIndex, McxCommodity } from '../types';

const USER_STORAGE_KEY = 'trade_journal_user';

// --- Auth Functions (must be in this file to be accessible by data functions) ---

export const getCurrentUser = (): User | null => {
    try {
        const userData = localStorage.getItem(USER_STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch {
        return null;
    }
};

export const login = async (username: string, password: string): Promise<User> => {
    await delay(1000);
    if (username === 'trader' && password === 'password') {
        const user: User = { id: 'user-123', username };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return user;
    }
    throw new Error("Invalid username or password.");
};

export const logout = async (): Promise<void> => {
    await delay(200);
    localStorage.removeItem(USER_STORAGE_KEY);
};


// --- User-Specific Data Storage ---

// A simple ID generator to avoid external dependencies like uuid
const generateId = () => Math.random().toString(36).substring(2, 15);

// This function is now the single source of truth for the user-specific storage key.
const getTradesStorageKey = (): string => {
    const user = getCurrentUser();
    if (!user || !user.id) {
        // This case should not happen if the app is guarded by auth.
        // Throwing an error is safer to prevent data corruption or mixing.
        throw new Error("User not authenticated. Cannot access trade data.");
    }
    return `trade_journal_trades_${user.id}`;
}

const getTradesFromStorage = (): Trade[] => {
  try {
    const key = getTradesStorageKey();
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse trades from localStorage", error);
  }
  // If user has no trades for their key, return an empty array.
  return [];
};

const saveTradesToStorage = (trades: Trade[]) => {
  try {
    const key = getTradesStorageKey();
    localStorage.setItem(key, JSON.stringify(trades));
  } catch (error) {
      console.error("Failed to save trades to localStorage", error);
  }
};

// This function seeds the user's storage with initial data if they have none.
export const seedInitialData = () => {
    const key = getTradesStorageKey();
    if (localStorage.getItem(key) === null) {
        const mockData = [
            { id: '1', date: '2023-10-26', ticker: 'RELIANCE', instrument: InstrumentType.Stock, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Long, size: 10, entryPrice: 2300.50, exitPrice: 2325.00, stopLoss: 2290.00, target: 2330.00, setup: 'Breakout', notes: 'Good volume on breakout.' },
            { id: '2', date: '2023-10-25', ticker: 'TCS', instrument: InstrumentType.Stock, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Short, size: 5, entryPrice: 3400.00, exitPrice: 3380.00, stopLoss: 3410.00, target: 3375.00, setup: 'Reversal', notes: 'Faded the morning pump.' },
            { id: '3', date: '2023-10-24', ticker: '44000', instrument: InstrumentType.Index, marketIndex: MarketIndex.BANKNIFTY, tradeCategory: TradeCategory.Option, optionType: OptionType.Call, strikePrice: 44000, direction: TradeDirection.Long, size: 50, entryPrice: 150.50, exitPrice: 120.00, stopLoss: 130.00, target: 200.00, setup: 'Expiry Play', notes: 'IV crush was higher than expected.' },
            { id: '4', date: '2023-11-01', ticker: 'INFY', instrument: InstrumentType.Stock, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Long, size: 15, entryPrice: 1450.00, exitPrice: 1465.25, setup: 'Trend Following', notes: 'Followed the trend after positive news.' },
            { id: '5', date: '2023-11-02', ticker: 'HDFCBANK', instrument: InstrumentType.Stock, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Short, size: 8, entryPrice: 1500.50, exitPrice: 1505.00, setup: 'Fading Strength', notes: 'Got stopped out. Should have waited for confirmation.' },
            { id: '6', date: '2023-11-03', ticker: 'BTC/INR', instrument: InstrumentType.Crypto, tradeCategory: TradeCategory.Cash, direction: TradeDirection.Long, size: 0.01, entryPrice: 2800000, exitPrice: 2900000, setup: 'Support Bounce', notes: 'Bounced off the 2.8M support level.' },
            { id: '7', date: '2023-11-04', ticker: 'GOLDM', instrument: InstrumentType.Commodity, mcxCommodity: McxCommodity.GOLD, tradeCategory: TradeCategory.Future, direction: TradeDirection.Long, size: 1, entryPrice: 59000, exitPrice: 59500, stopLoss: 58800, target: 59800, setup: 'Inflation Hedge', notes: 'Positive global cues.' }
        ];
        saveTradesToStorage(mockData);
    }
};


// --- API Functions ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getTrades = async (): Promise<Trade[]> => {
  await delay(500);
  return [...getTradesFromStorage()];
};

export const addTrade = async (tradeData: Omit<Trade, 'id'>): Promise<Trade> => {
  await delay(300);
  const currentTrades = getTradesFromStorage();
  const newTrade: Trade = { ...tradeData, id: generateId() };
  const updatedTrades = [newTrade, ...currentTrades];
  saveTradesToStorage(updatedTrades);
  return newTrade;
};

export const updateTrade = async (updatedTrade: Trade): Promise<Trade> => {
    await delay(300);
    const currentTrades = getTradesFromStorage();
    const index = currentTrades.findIndex(t => t.id === updatedTrade.id);
    if (index === -1) {
        throw new Error("Trade not found");
    }
    currentTrades[index] = updatedTrade;
    saveTradesToStorage(currentTrades);
    return updatedTrade;
};

export const deleteTrade = async (id: string): Promise<void> => {
  await delay(300);
  const currentTrades = getTradesFromStorage();
  const updatedTrades = currentTrades.filter(t => t.id !== id);
  saveTradesToStorage(updatedTrades);
};

export const deleteAllTrades = async (): Promise<void> => {
  await delay(500);
  saveTradesToStorage([]); // Replaces all trades with an empty array.
};