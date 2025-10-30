import { Trade, TradeDirection, InstrumentType, TradeCategory } from '../types';

// Constants simulating a typical Indian discount broker (e.g., Zerodha, Angel One)
const FLAT_FEE_PER_ORDER = 20; // ₹20 for Intraday & F&O
const STT_INTRADAY = 0.00025; // 0.025% on sell side
const STT_OPTIONS = 0.000625; // 0.0625% on sell side (on premium)
const STT_FUTURES = 0.000125; // 0.0125% on sell side
const TRANSACTION_CHARGE_NSE = 0.0000325; // 0.00325% on turnover
const GST = 0.18; // 18% on (Brokerage + Transaction Charges)

export interface BrokerageDetails {
  brokerage: number;
  stt: number;
  transactionCharge: number;
  gst: number;
  totalCharges: number;
}

/**
 * Calculates a detailed breakdown of brokerage and charges for a trade.
 * @param trade The trade object.
 * @returns A BrokerageDetails object.
 */
export const calculateBrokerage = (trade: Trade): BrokerageDetails => {
  const { instrument, size, entryPrice, exitPrice, tradeCategory } = trade;
  
  const entryTurnover = entryPrice * size;
  const exitTurnover = exitPrice * size;
  const totalTurnover = entryTurnover + exitTurnover;

  const brokerage = FLAT_FEE_PER_ORDER * 2; // Buy and Sell order

  let stt = 0;
  if (instrument === InstrumentType.Stock) { // Assuming intraday for this model
    stt = exitTurnover * STT_INTRADAY;
  } else if (tradeCategory === TradeCategory.Option) {
    stt = exitTurnover * STT_OPTIONS;
  } else if (tradeCategory === TradeCategory.Future) {
    stt = exitTurnover * STT_FUTURES;
  }
  // Crypto is not regulated with these charges, so STT is 0.

  const transactionCharge = totalTurnover * TRANSACTION_CHARGE_NSE;
  const gst = (brokerage + transactionCharge) * GST;
  
  const totalCharges = brokerage + stt + transactionCharge + gst;

  return { brokerage, stt, transactionCharge, gst, totalCharges };
};


/**
 * Calculates the net Profit and Loss for a trade, accounting for mock brokerage fees.
 * This provides a more realistic P&L figure than the gross calculation.
 * @param trade The trade object containing price, size, and direction.
 * @returns The net P&L as a number.
 */
export const calculateNetPnl = (trade: Trade): number => {
  const directionMultiplier = trade.direction === TradeDirection.Long ? 1 : -1;
  const grossPnl = (trade.exitPrice - trade.entryPrice) * trade.size * directionMultiplier;
  
  const { totalCharges } = calculateBrokerage(trade);
  
  const netPnl = grossPnl - totalCharges;
  
  return netPnl;
};
