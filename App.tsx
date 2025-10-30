import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from 'recharts';
import { Trade, TradeDirection, InstrumentType } from './types';
import * as api from './utils/server';
import { calculateNetPnl } from './utils/brokerage';
import { Dashboard } from './components/Dashboard';
import { TradeHistory } from './components/TradeHistory';
import { Modal } from './components/Modal';
import { TradeForm } from './components/TradeForm';
import { TradeDetails } from './components/TradeDetails';
import { useAuth } from './contexts/AuthContext';
import { FullScreenLoader } from './components/FullScreenLoader';
import { PnlChartModal } from './components/PnlChartModal';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import { HelpChatModal } from './components/HelpChatModal';
import { ManageJournalsModal } from './components/ManageJournalsModal';
import { DeleteDataModal } from './components/DeleteDataModal';
import { useToast } from './contexts/ToastContext';
import { PlusIcon, UserIcon, ChevronDownIcon, AiIcon, PnlChartIcon, HelpIcon, FolderIcon, LogoutIcon, DownloadIcon, WarningIcon, CandleChartIcon } from './components/icons';
import { CollapsibleSection } from './components/CollapsibleSection';


const ChartContainer: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg shadow-md border border-[var(--border-primary)] h-80 flex flex-col">
        <h4 className="text-md font-semibold text-white mb-4 text-center">{title}</h4>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-slate-700/80 backdrop-blur-sm border border-slate-600 rounded-lg shadow-lg text-sm">
        <p className="text-white">{`${payload[0].name}: ${payload[0].value}`}</p>
        <p className="text-slate-300">{`(${(payload[0].percent * 100).toFixed(1)}%)`}</p>
      </div>
    );
  }
  return null;
};

const Visualizations: React.FC<{ trades: Trade[] }> = React.memo(({ trades }) => {
    if (trades.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-slate-400">No data available for visualization.</p>
            </div>
        );
    }

    const { directionData, winLossData, instrumentData } = useMemo(() => {
        const directionData = [
            { name: 'Buy', value: trades.filter(t => t.direction === TradeDirection.Long).length },
            { name: 'Sell', value: trades.filter(t => t.direction === TradeDirection.Short).length },
        ].filter(d => d.value > 0);

        const netWinLoss = trades.reduce((acc, trade) => {
            const netPnl = calculateNetPnl(trade);
            if (netPnl > 0) acc.wins++;
            else if (netPnl < 0) acc.losses++;
            return acc;
        }, { wins: 0, losses: 0 });

        const winLossData = [
            { name: 'Wins', value: netWinLoss.wins },
            { name: 'Losses', value: netWinLoss.losses },
        ].filter(d => d.value > 0);
        
        const instrumentData = Object.values(InstrumentType).map(instrument => ({
            name: instrument,
            value: trades.filter(t => t.instrument === instrument).length
        })).filter(d => d.value > 0);

        return { directionData, winLossData, instrumentData };
    }, [trades]);

    const COLORS = ['#818CF8', '#F87171', '#4ADE80', '#FBBF24', '#60A5FA'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartContainer title="Trade Direction">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={directionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" fill="#8884d8" label={false} labelLine={false}>
                  {directionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend wrapperStyle={{ fontSize: '14px', color: '#cbd5e1' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Win / Loss Ratio">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={winLossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" fill="#8884d8" label={false} labelLine={false}>
                   <Cell fill="#4ADE80" />
                   <Cell fill="#F87171" />
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend wrapperStyle={{ fontSize: '14px', color: '#cbd5e1' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="By Instrument">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={instrumentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" fill="#8884d8" label={false} labelLine={false}>
                  {instrumentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend wrapperStyle={{ fontSize: '14px', color: '#cbd5e1' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
    );
});

const MonthlyPerformance: React.FC<{ trades: Trade[] }> = React.memo(({ trades }) => {
    const monthlyPerformance = useMemo(() => {
        const tradesByMonth = trades.reduce((acc: Record<string, Trade[]>, trade) => {
            const month = new Date(trade.date).toISOString().slice(0, 7); // YYYY-MM
            if (!acc[month]) {
              acc[month] = [];
            }
            acc[month].push(trade);
            return acc;
          }, {} as Record<string, Trade[]>);
        
        return Object.entries(tradesByMonth).map(([month, monthTrades]: [string, Trade[]]) => {
            const monthlyNetPnl = monthTrades.reduce((sum, trade) => sum + calculateNetPnl(trade), 0);
            const winningTrades = monthTrades.filter(t => calculateNetPnl(t) > 0).length;
            const winnableTrades = monthTrades.filter(t => calculateNetPnl(t) !== 0).length;
            const winRate = winnableTrades > 0 ? (winningTrades / winnableTrades) * 100 : 0;
            
            return {
              month,
              totalTrades: monthTrades.length,
              netPnl: monthlyNetPnl,
              winRate
            };
        }).sort((a, b) => b.month.localeCompare(a.month));
    }, [trades]);

    const formatCurrency = (value: number) => {
        const absValue = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        return `${sign}₹${absValue.toFixed(2)}`;
    };

    if (monthlyPerformance.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-slate-400">No monthly performance data available.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-primary)]">
            <thead className="bg-[var(--surface-primary)]/50">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Month</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Total Trades</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Win Rate (Net)</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Net P&L</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/50 divide-y divide-[var(--border-primary)]">
              {monthlyPerformance.map(perf => (
                <tr key={perf.month} className="hover:bg-slate-700/50 transition-colors duration-150">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {new Date(perf.month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">{perf.totalTrades}</td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${perf.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{perf.winRate.toFixed(2)}%</td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${perf.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(perf.netPnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    );
});


function App() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPnlChartModalOpen, setIsPnlChartModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isManageJournalsModalOpen, setIsManageJournalsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTrades = await api.getTrades();
      setTrades(fetchedTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err: any) {
      addToast(err.message || "Failed to load trades.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const filteredTrades = useMemo(() => {
    const { start, end } = dateFilter;
    if (!start && !end) {
        return trades;
    }
    return trades.filter(trade => {
        const tradeDate = trade.date;
        const isAfterStart = start ? tradeDate >= start : true;
        const isBeforeEnd = end ? tradeDate <= end : true;
        return isAfterStart && isBeforeEnd;
    });
  }, [trades, dateFilter]);

  const handleAddTrade = useCallback(() => {
    setSelectedTrade(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditTrade = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setIsFormModalOpen(true);
  }, []);

  const handleViewTrade = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setIsDetailsModalOpen(true);
  }, []);

  const handleDeleteTrade = useCallback(async (id: string, ticker: string) => {
      try {
        await api.deleteTrade(id);
        setTrades(prev => prev.filter(t => t.id !== id));
        addToast(`Trade for ${ticker} deleted successfully.`, 'success');
      } catch (err: any) {
        addToast(err.message || "Failed to delete trade.", 'error');
      }
  }, [addToast]);

  const handleFormSubmit = useCallback(async (tradeData: Omit<Trade, 'id'>) => {
    try {
      const newTrade = await api.addTrade(tradeData);
      setTrades(prev => [newTrade, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      addToast('Trade added successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || "Failed to add trade.", 'error');
    }
  }, [addToast]);
  
  const handleFormUpdate = useCallback(async (trade: Trade) => {
    try {
      const updatedTrade = await api.updateTrade(trade);
      setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      addToast('Trade updated successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || "Failed to update trade.", 'error');
    }
  }, [addToast]);
  
  const handleDateFilter = useCallback((filter: { start: string, end: string }) => {
    setDateFilter(filter);
  }, []);

  const handleExportData = useCallback(() => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(trades, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `trade-journal-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      addToast('Data exported successfully!', 'success');
    } catch (err) {
      addToast("Failed to export data.", 'error');
    }
  }, [trades, addToast]);

  const handleDeleteAllData = useCallback(async () => {
    try {
      await api.deleteAllTrades();
      setTrades([]);
      addToast('All trade data has been deleted.', 'success');
    } catch (err: any) {
      addToast(err.message || "Failed to delete all trades.", 'error');
    }
  }, [addToast]);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  const isAiEnabled = typeof process !== 'undefined' && process.env && !!process.env.API_KEY;
  const menuItems = [
    { label: 'AI Analysis', icon: AiIcon, action: () => setIsAiModalOpen(true), disabled: !isAiEnabled },
    { label: 'P&L Chart', icon: PnlChartIcon, action: () => setIsPnlChartModalOpen(true), disabled: false },
    { label: 'Help Chatbot', icon: HelpIcon, action: () => setIsHelpModalOpen(true), disabled: !isAiEnabled },
    { label: 'Manage Journals', icon: FolderIcon, action: () => setIsManageJournalsModalOpen(true), disabled: false },
  ];

  return (
    <div className="min-h-screen text-[var(--text-primary)] font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <CandleChartIcon className="h-8 w-8 text-[var(--accent-primary)]" />
                <h1 className="text-3xl font-bold">Trade Journal</h1>
            </div>
            <div className="flex items-center gap-2">
               <button
                  onClick={handleAddTrade}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-hover)] text-white font-semibold transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-indigo-600/30"
                >
                  <PlusIcon />
                  <span className="hidden sm:inline">Add New Trade</span>
                </button>

               <div className="w-px h-6 bg-[var(--surface-secondary)] mx-2"></div>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--surface-primary)] transition-colors"
                >
                  <UserIcon />
                  <span className="hidden md:inline capitalize">{user?.username}</span>
                  <ChevronDownIcon className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-md shadow-lg z-20 origin-top-right animate-scale-in-top">
                    <div className="p-1">
                      {menuItems.map(item => (
                        <button
                          key={item.label}
                          onClick={() => { if (!item.disabled) { item.action(); setIsUserMenuOpen(false); } }}
                          disabled={item.disabled}
                          title={item.disabled ? 'Feature disabled: API_KEY not configured.' : item.label}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 rounded-md hover:bg-[var(--surface-secondary)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <item.icon className="h-4 w-4 text-slate-400" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                       <div className="h-px bg-[var(--border-primary)] my-1"></div>
                       <button
                        onClick={() => { handleExportData(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 rounded-md hover:bg-[var(--surface-secondary)] transition-colors duration-150"
                      >
                        <DownloadIcon className="h-4 w-4 text-slate-400" />
                        <span>Export Data</span>
                      </button>
                      <button
                        onClick={() => { setIsDeleteModalOpen(true); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 rounded-md hover:bg-[var(--surface-secondary)] transition-colors duration-150"
                      >
                        <WarningIcon className="h-4 w-4"/>
                        <span>Delete All Data</span>
                      </button>
                      <div className="h-px bg-[var(--border-primary)] my-1"></div>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 rounded-md hover:bg-[var(--surface-secondary)] transition-colors duration-150"
                      >
                        <LogoutIcon className="h-4 w-4"/>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </header>

        <main className="space-y-8">
          <Dashboard trades={filteredTrades} />
          <TradeHistory 
            trades={filteredTrades} 
            onView={handleViewTrade}
            onEdit={handleEditTrade}
            onDelete={handleDeleteTrade}
            onFilter={handleDateFilter}
          />
          <CollapsibleSection title="Visualizations (Net P&L)">
            <Visualizations trades={filteredTrades} />
          </CollapsibleSection>
          <CollapsibleSection title="Monthly Performance">
            <MonthlyPerformance trades={filteredTrades} />
          </CollapsibleSection>
        </main>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedTrade ? 'Edit Trade' : 'Add New Trade'}>
        <TradeForm 
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleFormSubmit}
          onUpdate={handleFormUpdate}
          initialData={selectedTrade}
        />
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Trade Details">
        {selectedTrade && <TradeDetails trade={selectedTrade} />}
      </Modal>

      <PnlChartModal isOpen={isPnlChartModalOpen} onClose={() => setIsPnlChartModalOpen(false)} trades={trades} />
      <AiAnalysisModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} trades={trades} />
      <HelpChatModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      <ManageJournalsModal isOpen={isManageJournalsModalOpen} onClose={() => setIsManageJournalsModalOpen(false)} />
      <DeleteDataModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteAllData}
      />

    </div>
  );
}

export default App;
