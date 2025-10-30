// Defines the core data structures and enumerations for the trading journal application.

export enum TradeDirection {
  Long = 'Long',
  Short = 'Short',
}

export enum InstrumentType {
  Stock = 'Stock',
  Commodity = 'Commodity',
  Index = 'Index',
  Crypto = 'Crypto',
}

export enum TradeCategory {
    Cash = 'Cash',
    Option = 'Option',
    Future = 'Future',
}

export enum OptionType {
  Call = 'Call',
  Put = 'Put',
}

export enum MarketIndex {
    NIFTY50 = 'NIFTY 50',
    BANKNIFTY = 'BANK NIFTY',
    FINNIFTY = 'FIN NIFTY',
    SENSEX = 'SENSEX',
    BANKEX = 'BANKEX',
    MIDCAPNIFTY = 'MIDCAP NIFTY',
    NIFTYNXT50 = 'NIFTY NXT 50',
}

export enum McxCommodity {
    GOLD = 'GOLD',
    SILVER = 'SILVER',
    CRUDEOIL = 'CRUDE OIL',
    NATURALGAS = 'NATURAL GAS',
    COPPER = 'COPPER',
    ZINC = 'ZINC',
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  ticker: string;
  instrument: InstrumentType;
  marketIndex?: MarketIndex;
  mcxCommodity?: McxCommodity;
  tradeCategory: TradeCategory;
  optionType?: OptionType;
  strikePrice?: number;
  direction: TradeDirection;
  size: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  target?: number;
  setup: string;
  notes?: string;
}

export interface User {
  id: string;
  username: string;
}