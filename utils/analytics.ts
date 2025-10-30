import { Trade } from '../types';
import { calculateNetPnl } from './brokerage';

export interface AnalyticsSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalPnL: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number | null;
  averageWin: number;
  averageLoss: number;
  averagePnL: number;
  largestWin: number;
  largestLoss: number;
}

export const calculateAnalytics = (trades: Trade[]): AnalyticsSummary => {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      totalPnL: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: null,
      averageWin: 0,
      averageLoss: 0,
      averagePnL: 0,
      largestWin: 0,
      largestLoss: 0,
    };
  }

  let totalPnL = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let largestWin = 0;
  let largestLoss = 0;

  trades.forEach(trade => {
    // Use Net PnL for all calculations to ensure consistency and accuracy.
    const pnl = calculateNetPnl(trade);
    
    totalPnL += pnl;

    if (pnl > 0) {
      winningTrades++;
      grossProfit += pnl;
      if (pnl > largestWin) largestWin = pnl;
    } else if (pnl < 0) {
      losingTrades++;
      grossLoss += pnl;
      if (pnl < largestLoss) largestLoss = pnl;
    } else {
      breakevenTrades++;
    }
  });

  const totalTrades = trades.length;
  const winnableTrades = winningTrades + losingTrades;
  const winRate = winnableTrades > 0 ? (winningTrades / winnableTrades) * 100 : 0;
  const profitFactor = grossLoss !== 0 ? Math.abs(grossProfit / grossLoss) : null;
  const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: isNaN(winRate) ? 0 : winRate,
    totalPnL,
    grossProfit,
    grossLoss,
    profitFactor,
    averageWin,
    averageLoss: Math.abs(averageLoss),
    averagePnL,
    largestWin,
    largestLoss: Math.abs(largestLoss),
  };
};