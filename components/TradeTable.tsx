import React, { useState } from 'react';
import { Trade, TradeDirection } from '../types';
import { EditIcon, TrashIcon, LongIcon, ShortIcon, ChartIcon, InfoIcon } from './icons';
import { ChartModal } from './ChartModal';

interface TradeTableProps {
  trades: Trade[];
  onView: (trade: Trade) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string, ticker: string) => void;
}

export const TradeTable: React.FC<TradeTableProps> = React.memo(({ trades, onView, onEdit, onDelete }) => {
  const [tradeForChart, setTradeForChart] = useState<Trade | null>(null);

  const getPnl = (trade: Trade) => {
    const pnlPerUnit = trade.direction === TradeDirection.Long
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice;
    return pnlPerUnit * trade.size;
  };

  const handleOpenChart = (trade: Trade) => {
    setTradeForChart(trade);
  };
  
  const handleCloseChart = () => {
    setTradeForChart(null);
  };

  if (trades.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-800/50 rounded-lg">
        <p className="text-slate-400">No trades logged yet.</p>
        <p className="text-slate-500 text-sm mt-2">Click "Add New Trade" to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border-primary)]">
          <thead className="bg-[var(--surface-primary)]/50">
            <tr>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Ticker</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Direction</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">P&L</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Setup</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-[var(--border-primary)]">
            {trades.map((trade) => {
              const pnl = getPnl(trade);
              const isProfit = pnl >= 0;

              return (
                <tr key={trade.id} className="hover:bg-slate-700/50 transition-colors duration-150 group">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300" onClick={() => onView(trade)}>{trade.date}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-white" onClick={() => onView(trade)}>{trade.ticker.toUpperCase()}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300" onClick={() => onView(trade)}>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${trade.direction === TradeDirection.Long ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                      {trade.direction === TradeDirection.Long ? <LongIcon /> : <ShortIcon />}
                      {trade.direction === TradeDirection.Long ? 'Buy' : 'Sell'}
                    </span>
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`} onClick={() => onView(trade)}>
                     <span className={`p-1.5 rounded-md ${isProfit ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                        ₹{pnl.toFixed(2)}
                     </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400" onClick={() => onView(trade)}>{trade.setup}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[120px]">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onView(trade)} className="text-slate-400 hover:text-indigo-400 p-2 rounded-md hover:bg-slate-700 transition-colors" title="View Details">
                        <InfoIcon />
                      </button>
                      <button onClick={() => handleOpenChart(trade)} className="text-slate-400 hover:text-indigo-400 p-2 rounded-md hover:bg-slate-700 transition-colors" title="View Chart">
                        <ChartIcon />
                      </button>
                      <button onClick={() => onEdit(trade)} className="text-slate-400 hover:text-blue-400 p-2 rounded-md hover:bg-slate-700 transition-colors" title="Edit Trade">
                        <EditIcon />
                      </button>
                      <button onClick={() => onDelete(trade.id, trade.ticker)} className="text-slate-400 hover:text-red-400 p-2 rounded-md hover:bg-slate-700 transition-colors" title="Delete Trade">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tradeForChart && <ChartModal isOpen={!!tradeForChart} onClose={handleCloseChart} trade={tradeForChart} />}
    </>
  );
});