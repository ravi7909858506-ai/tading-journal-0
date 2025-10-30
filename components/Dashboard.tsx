import React from 'react';
import { Trade } from '../types';
import { calculateAnalytics, AnalyticsSummary } from '../utils/analytics';
import { PnlChartIcon, ChartIcon, PlusIcon, InfoIcon } from './icons';

interface DashboardProps {
  trades: Trade[];
}

const StatCard: React.FC<{
    label: string;
    value: string | number;
    valueClassName?: string;
    accentColor?: string;
    icon: React.ElementType;
}> = ({ label, value, valueClassName, accentColor = 'border-slate-700', icon: Icon }) => (
    <div className={`relative bg-slate-800/50 p-4 rounded-lg shadow-lg border border-[var(--border-primary)] overflow-hidden transition-all duration-300 hover:bg-slate-800 hover:shadow-indigo-500/10 hover:-translate-y-1`}>
        <div className={`absolute top-0 left-0 bottom-0 w-1 ${accentColor}`}></div>
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <p className="text-sm text-[var(--text-secondary)] truncate">{label}</p>
                <p className={`text-xl sm:text-2xl font-bold truncate ${valueClassName}`}>{value}</p>
            </div>
            <div className="p-2 bg-slate-700/50 rounded-full">
              <Icon className="h-6 w-6 text-slate-400" />
            </div>
        </div>
    </div>
);


export const Dashboard: React.FC<DashboardProps> = React.memo(({ trades }) => {
  const summary: AnalyticsSummary = calculateAnalytics(trades);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    return `${sign}₹${absValue.toFixed(2)}`;
  };
  
  const pnlColor = summary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400';
  const pnlBorderColor = summary.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500';
  const winRateColor = summary.winRate >= 50 ? 'text-green-400' : 'text-red-400';
  const winRateBorderColor = summary.winRate >= 50 ? 'bg-green-500' : 'bg-red-500';


  return (
    <div className="bg-slate-900/70 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-[var(--border-primary)]">
        <h2 className="text-2xl font-bold text-white mb-6">Performance Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard label="Total P&L (Net)" value={formatCurrency(summary.totalPnL)} valueClassName={pnlColor} accentColor={pnlBorderColor} icon={PnlChartIcon} />
            <StatCard label="Total Trades" value={summary.totalTrades} accentColor="bg-indigo-500" icon={ChartIcon} />
            <StatCard label="Win Rate" value={`${summary.winRate.toFixed(2)}%`} valueClassName={winRateColor} accentColor={winRateBorderColor} icon={ChartIcon} />
            <StatCard label="Profit Factor" value={summary.profitFactor ? summary.profitFactor.toFixed(2) : 'N/A'} accentColor={summary.profitFactor && summary.profitFactor >= 1 ? 'bg-green-500' : 'bg-yellow-500'} icon={InfoIcon} />
            <StatCard label="Avg. Win" value={formatCurrency(summary.averageWin)} valueClassName="text-green-400" accentColor="bg-green-500" icon={PlusIcon} />
            <StatCard label="Avg. Loss" value={formatCurrency(summary.averageLoss * -1)} valueClassName="text-red-400" accentColor="bg-red-500" icon={PlusIcon} />
            <StatCard label="Largest Win" value={formatCurrency(summary.largestWin)} valueClassName="text-green-400" accentColor="bg-green-500" icon={PnlChartIcon} />
            <StatCard label="Largest Loss" value={formatCurrency(summary.largestLoss * -1)} valueClassName="text-red-400" accentColor="bg-red-500" icon={PnlChartIcon} />
        </div>
    </div>
  );
});