import { Trade } from '../types';
import { calculateNetPnl } from './brokerage';

export interface CumulativePnlData {
  tradeNumber: number;
  cumulativePnl: number;
  tradeDate: string;
  ticker: string;
}

/**
 * Generates data for a cumulative P&L chart.
 * @param trades An array of Trade objects.
 * @returns An array of data points for the chart.
 */
export const generateCumulativePnlData = (trades: Trade[]): CumulativePnlData[] => {
  if (!trades || trades.length === 0) {
    return [];
  }

  // Sort trades by date to ensure correct cumulative calculation
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulativePnl = 0;
  return sortedTrades.map((trade, index) => {
    const netPnl = calculateNetPnl(trade);
    cumulativePnl += netPnl;
    return {
      tradeNumber: index + 1,
      cumulativePnl: parseFloat(cumulativePnl.toFixed(2)),
      tradeDate: trade.date,
      ticker: trade.ticker,
    };
  });
};