import React from 'react';
import { Trade, TradeDirection, TradeCategory, InstrumentType } from '../types';
import { calculateBrokerage, calculateNetPnl } from '../utils/brokerage';

interface TradeDetailsProps {
  trade: Trade;
}

const DetailItem: React.FC<{ label: string; value: string | number | undefined; className?: string }> = ({ label, value, className }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className={`mt-1 text-sm text-white sm:mt-0 sm:col-span-2 ${className}`}>{value ?? 'N/A'}</dd>
    </div>
);

export const TradeDetails: React.FC<TradeDetailsProps> = ({ trade }) => {
  const grossPnl = (trade.direction === TradeDirection.Long 
    ? trade.exitPrice - trade.entryPrice 
    : trade.entryPrice - trade.exitPrice) * trade.size;
  
  const brokerageInfo = calculateBrokerage(trade);
  const netPnl = grossPnl - brokerageInfo.totalCharges;

  const isProfit = netPnl >= 0;
  const netPnlColor = isProfit ? 'text-green-400' : 'text-red-400';
  const netPnlBgColor = isProfit ? 'bg-green-500/10' : 'bg-red-500/10';
  const returnPercentage = trade.entryPrice !== 0 ? ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * (trade.direction === TradeDirection.Long ? 1 : -1) : 0;

  // 1. Planned Risk/Reward Ratio (based on Target)
  let plannedRiskRewardRatio: number | null = null;
  if (trade.target && trade.stopLoss && trade.target > 0 && trade.stopLoss > 0) {
    const potentialReward = Math.abs(trade.target - trade.entryPrice);
    const potentialRisk = Math.abs(trade.entryPrice - trade.stopLoss);

    if (potentialRisk > 0) {
      // Validate if target and stop loss are on the correct sides of the entry price
      const isLongValid = trade.direction === TradeDirection.Long && trade.target > trade.entryPrice && trade.entryPrice > trade.stopLoss;
      const isShortValid = trade.direction === TradeDirection.Short && trade.target < trade.entryPrice && trade.entryPrice < trade.stopLoss;

      if (isLongValid || isShortValid) {
        plannedRiskRewardRatio = potentialReward / potentialRisk;
      }
    }
  }

  // 2. Actual Risk/Reward Ratio (based on Exit)
  let actualRiskRewardRatio: number | null = null;
  if (trade.stopLoss && trade.stopLoss > 0) {
      const actualReward = Math.abs(trade.exitPrice - trade.entryPrice);
      const potentialRisk = Math.abs(trade.entryPrice - trade.stopLoss);

      if (potentialRisk > 0) {
          actualRiskRewardRatio = actualReward / potentialRisk;
      }
  }


  return (
    <div className="text-white">
      <dl className="divide-y divide-[var(--border-primary)]">
        <div className={`p-4 rounded-lg ${netPnlBgColor} mb-4`}>
             <dt className="text-sm font-medium text-slate-400">Net P&L</dt>
             <dd className={`mt-1 text-2xl font-bold ${netPnlColor}`}>
                ₹{netPnl.toFixed(2)} 
                <span className="ml-2 text-lg">({returnPercentage.toFixed(2)}%)</span>
            </dd>
        </div>
        <DetailItem label="Gross P&L" value={`₹${grossPnl.toFixed(2)}`} />
        <DetailItem label="Brokerage & Charges" value={`- ₹${brokerageInfo.totalCharges.toFixed(2)}`} className="text-red-400" />
        <DetailItem label="Ticker" value={trade.ticker.toUpperCase()} />
        <DetailItem label="Date" value={trade.date} />
        <DetailItem label="Instrument" value={trade.instrument} />
        {trade.instrument === InstrumentType.Index && trade.marketIndex && (
            <DetailItem label="Market Index" value={trade.marketIndex} />
        )}
        {trade.instrument === InstrumentType.Commodity && trade.mcxCommodity && (
            <DetailItem label="MCX Commodity" value={trade.mcxCommodity} />
        )}
        <DetailItem label="Category" value={trade.tradeCategory} />
        {trade.tradeCategory === TradeCategory.Option && (
            <>
                <DetailItem label="Option Type" value={trade.optionType} />
                <DetailItem label="Strike Price" value={trade.strikePrice ? `₹${trade.strikePrice.toFixed(2)}` : 'N/A'} />
            </>
        )}
        <DetailItem label="Direction" value={trade.direction === TradeDirection.Long ? 'Buy' : 'Sell'} />
        <DetailItem label="Size" value={trade.size} />
        <DetailItem label="Entry Price" value={`₹${trade.entryPrice.toFixed(2)}`} />
        <DetailItem label="Exit Price" value={`₹${trade.exitPrice.toFixed(2)}`} />
        <DetailItem label="Stop Loss" value={trade.stopLoss ? `₹${trade.stopLoss.toFixed(2)}` : 'Open'} />
        <DetailItem label="Target" value={trade.target ? `₹${trade.target.toFixed(2)}` : 'Open'} />
        {plannedRiskRewardRatio !== null && (
            <DetailItem label="Planned R/R Ratio" value={`1 : ${plannedRiskRewardRatio.toFixed(2)}`} />
        )}
        {actualRiskRewardRatio !== null && (
            <DetailItem label="Actual R/R Ratio" value={`1 : ${actualRiskRewardRatio.toFixed(2)}`} />
        )}
        <DetailItem label="Setup / Strategy" value={trade.setup} />
        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-slate-400">Notes / Reflection</dt>
            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{trade.notes || 'No notes added.'}</dd>
        </div>
      </dl>
    </div>
  );
};