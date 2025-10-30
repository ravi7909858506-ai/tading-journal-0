import React from 'react';
import { Modal } from './Modal';
import { Trade, TradeDirection } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-700 p-2 border border-slate-600 rounded shadow-lg text-sm text-white">
        <p>{`Price: ₹${data.price.toFixed(2)}`}</p>
        {data.label && <p className="text-slate-300">{data.label}</p>}
      </div>
    );
  }
  return null;
};

export const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, trade }) => {
  if (!trade) return null;

  const { entryPrice, exitPrice, direction } = trade;
  const isProfit = (direction === TradeDirection.Long && exitPrice > entryPrice) || (direction === TradeDirection.Short && entryPrice > exitPrice);
  
  const priceRange = Math.abs(exitPrice - entryPrice);
  const buffer = priceRange > 0 ? priceRange * 0.5 : entryPrice * 0.01;

  // Simulate a simple price path for visualization
  const chartData = [
    { time: 0, price: entryPrice + (isProfit ? -buffer : buffer) },
    { time: 1, price: entryPrice, label: 'Entry' },
    { time: 2, price: (entryPrice + exitPrice) / 2 },
    { time: 3, price: exitPrice, label: 'Exit' },
    { time: 4, price: exitPrice + (isProfit ? buffer : -buffer) },
  ];

  const domain = [
      Math.min(...chartData.map(d => d.price)),
      Math.max(...chartData.map(d => d.price))
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chart for ${trade.ticker.toUpperCase()}`}>
      <div className="w-full h-80 text-white">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fontSize: 12 }} hide={true} />
            <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${value.toFixed(2)}`}
                domain={domain}
                width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} dot={false} name="Price Path" />
            
            <ReferenceDot
              x={1}
              y={entryPrice}
              r={5}
              fill={direction === TradeDirection.Long ? '#4ade80' : '#f87171'}
              stroke="white"
            />

            <ReferenceDot
              x={3}
              y={exitPrice}
              r={5}
              fill="#60a5fa"
              stroke="white"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center items-center gap-4 mt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: trade.direction === TradeDirection.Long ? '#4ade80' : '#f87171' }}></div>
                <span>Entry</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-400" style={{backgroundColor: '#60a5fa'}}></div>
                <span>Exit</span>
            </div>
        </div>
      </div>
    </Modal>
  );
};