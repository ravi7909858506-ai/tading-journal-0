import React, { useState } from 'react';
import { Trade } from '../types';
import { TradeTable } from './TradeTable';

interface TradeHistoryProps {
  trades: Trade[];
  onView: (trade: Trade) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string, ticker: string) => void;
  onFilter: (filter: { start: string; end: string }) => void;
}

export const TradeHistory: React.FC<TradeHistoryProps> = React.memo(({ trades, onView, onEdit, onDelete, onFilter }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const handleApplyFilter = () => {
    onFilter({ start: startDate, end: endDate });
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    onFilter({ start: '', end: '' });
  };


  return (
    <div className="bg-slate-900/70 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-[var(--border-primary)]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Trade History</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
            <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white text-sm p-2"
                aria-label="Start Date"
            />
            <span className="text-slate-400 hidden sm:block">-</span>
            <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white text-sm p-2"
                aria-label="End Date"
            />
            <button
                onClick={handleApplyFilter}
                className="px-4 py-2 bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-hover)] text-sm font-semibold transition-colors duration-150"
            >
                Filter
            </button>
            <button
                onClick={handleClearFilter}
                className="px-4 py-2 bg-[var(--surface-tertiary)] rounded-md hover:bg-opacity-80 text-sm transition-colors duration-150"
            >
                Clear
            </button>
        </div>
      </div>
      <TradeTable trades={trades} onView={onView} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
});