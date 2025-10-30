import React from 'react';
import { Trade } from '../types';
import { Modal } from './Modal';
import { generateCumulativePnlData } from '../utils/chartUtils';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    ReferenceLine
} from 'recharts';

interface PnlChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-700 p-2 border border-slate-600 rounded shadow-lg text-sm">
                <p className="text-slate-300">{`Trade #${label}`}</p>
                <p className="font-bold text-white">{`Cumulative P&L: ₹${payload[0].value.toFixed(2)}`}</p>
            </div>
        );
    }
    return null;
};

export const PnlChartModal: React.FC<PnlChartModalProps> = ({ isOpen, onClose, trades }) => {
  const chartData = generateCumulativePnlData(trades);
  
  const finalPnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnl : 0;
  const strokeColor = finalPnl >= 0 ? '#4ade80' : '#f87171'; // green-400 or red-400

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cumulative P&L Over Time">
      {chartData.length > 1 ? (
        <div className="w-full h-96 text-white">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                        dataKey="tradeNumber"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Number of Trades', position: 'insideBottom', offset: -5, fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${value}`}
                        label={{ value: 'Cumulative P&L', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12, dx: -20 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="cumulativePnl" stroke={strokeColor} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-96 text-slate-400">
          <p>Not enough trade data to display a chart. Please log at least two trades.</p>
        </div>
      )}
    </Modal>
  );
};