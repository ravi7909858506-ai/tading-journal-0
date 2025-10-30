import React, { useState, useEffect } from 'react';
import { Trade, TradeDirection, InstrumentType, OptionType, TradeCategory, MarketIndex, McxCommodity } from '../types';
import { Tooltip } from './Tooltip';
import { SpinnerIcon, AiIcon } from './icons';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';


interface TradeFormProps {
  onClose: () => void;
  onSubmit: (tradeData: Omit<Trade, 'id'>) => void;
  onUpdate: (trade: Trade) => void;
  initialData: Trade | null;
}

const defaultState: Omit<Trade, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  ticker: '',
  instrument: InstrumentType.Stock,
  tradeCategory: TradeCategory.Cash,
  direction: TradeDirection.Long,
  size: 0,
  entryPrice: 0,
  exitPrice: 0,
  stopLoss: undefined,
  target: undefined,
  setup: '',
  notes: '',
};

export const TradeForm: React.FC<TradeFormProps> = ({ onClose, onSubmit, onUpdate, initialData }) => {
  const [trade, setTrade] = useState(initialData || defaultState);
  const [isLoading, setIsLoading] = useState(false);
  
  const [quickAddText, setQuickAddText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTrade(initialData);
    } else {
      setTrade(defaultState);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setTrade(prev => {
        let updatedTrade = { ...prev, [name]: value };

        const requiredNumericFields = ['size', 'entryPrice', 'exitPrice'];
        const optionalNumericFields = ['strikePrice', 'stopLoss', 'target'];
        
        if (requiredNumericFields.includes(name)) {
            (updatedTrade as any)[name] = parseFloat(value) || 0;
        } else if (optionalNumericFields.includes(name)) {
            const parsedValue = parseFloat(value);
            (updatedTrade as any)[name] = isNaN(parsedValue) ? undefined : parsedValue;
        }
        
        if (name === 'instrument') {
            if (value !== InstrumentType.Index) updatedTrade.marketIndex = undefined;
            if (value !== InstrumentType.Commodity) updatedTrade.mcxCommodity = undefined;
        }

        const isOption = updatedTrade.tradeCategory === TradeCategory.Option;
        
        if (name === 'strikePrice') {
            const newStrike = updatedTrade.strikePrice || 0;
            if (isOption) {
                if (updatedTrade.instrument === InstrumentType.Index) {
                    updatedTrade.ticker = `${updatedTrade.marketIndex || ''} ${newStrike}`.trim();
                } else if (updatedTrade.instrument !== InstrumentType.Stock) {
                    updatedTrade.ticker = String(newStrike);
                }
            }
        }

        if (name === 'instrument') {
             if (isOption) {
                if (value === InstrumentType.Index) {
                    updatedTrade.ticker = `${updatedTrade.marketIndex || ''} ${updatedTrade.strikePrice || ''}`.trim();
                } else if (value !== InstrumentType.Stock) {
                    updatedTrade.ticker = String(updatedTrade.strikePrice || '');
                } else {
                    updatedTrade.ticker = '';
                }
             } else {
                 const wasAutoTicker = prev.instrument === InstrumentType.Commodity || (prev.tradeCategory === TradeCategory.Option && prev.instrument !== InstrumentType.Stock);
                 if (wasAutoTicker) {
                     updatedTrade.ticker = '';
                 }
             }
        }
        
        return updatedTrade;
    });
  };

  const handleDirectionChange = (direction: TradeDirection) => {
    setTrade(prev => ({ ...prev, direction }));
  };
  
  const handleMarketIndexChange = (index: MarketIndex) => {
    setTrade(prev => {
        const updatedTrade = { ...prev, marketIndex: index };
        if (updatedTrade.instrument === InstrumentType.Index && updatedTrade.tradeCategory === TradeCategory.Option) {
            updatedTrade.ticker = `${index} ${updatedTrade.strikePrice || ''}`.trim();
        }
        return updatedTrade;
    });
  };
  
  const handleCommodityChange = (commodity: McxCommodity) => {
    setTrade(prev => ({ 
        ...prev, 
        mcxCommodity: commodity,
        ticker: commodity,
    }));
  };

  const handleCategoryChange = (category: TradeCategory) => {
    setTrade(prev => {
        let updatedTrade = { ...prev, tradeCategory: category };

        if (category === TradeCategory.Cash) {
            updatedTrade.instrument = InstrumentType.Stock;
        }

        const isNowOption = category === TradeCategory.Option;
        
        if (isNowOption) {
             if (updatedTrade.instrument === InstrumentType.Index) {
                updatedTrade.ticker = `${updatedTrade.marketIndex || ''} ${updatedTrade.strikePrice || ''}`.trim();
             } else if (updatedTrade.instrument !== InstrumentType.Stock) {
                updatedTrade.ticker = String(updatedTrade.strikePrice || '');
             }
        } else {
             const wasNonStockOption = prev.tradeCategory === TradeCategory.Option && prev.instrument !== InstrumentType.Stock;
             if (wasNonStockOption) {
                 updatedTrade.ticker = '';
             }
        }


        if (category !== TradeCategory.Option) {
            updatedTrade.optionType = undefined;
            updatedTrade.strikePrice = undefined;
        }
        
        return updatedTrade;
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (initialData?.id) {
      await onUpdate({ ...trade, id: initialData.id });
    } else {
      await onSubmit(trade);
    }
    setIsLoading(false);
    onClose();
  };
  
  const handleParseAndFill = async () => {
    if (!quickAddText.trim()) return;

    setIsParsing(true);
    setParseError(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const systemInstruction = `You are an intelligent assistant for a trading journal. Your task is to parse a user's natural language description of a trade and extract key details. The user might mention tickers from the Indian market like 'BANKNIFTY' or 'RELIANCE'. Respond ONLY with a valid JSON object matching the provided schema. If a value cannot be determined, omit the key from the JSON object.
- For 'direction', use one of: ${Object.values(TradeDirection).join(', ')}.
- For 'tradeCategory', use one of: ${Object.values(TradeCategory).join(', ')}.
- For 'instrument', use one of: ${Object.values(InstrumentType).join(', ')}. Infer from the ticker; e.g., 'BANKNIFTY' is usually an 'Index', 'CRUDEOIL' is a 'Commodity'. Default to 'Stock' if unsure.
- For 'marketIndex', if instrument is 'Index', use one of: ${Object.values(MarketIndex).join(', ')}. Map common names like 'Bank Nifty' to 'BANK NIFTY'.
- For 'mcxCommodity', if instrument is 'Commodody', use one of: ${Object.values(McxCommodity).join(', ')}. The 'ticker' should be the same as this value. Map common names like 'Crude Oil' to 'CRUDE OIL'.
- For 'optionType', if tradeCategory is 'Option', use one of: ${Object.values(OptionType).join(', ')}.
- For 'strikePrice', if tradeCategory is 'Option', extract the numeric strike price.
- Tickers should be uppercase.
- For 'stopLoss', extract the numeric stop loss price if mentioned.
- For 'target', extract the numeric target price if mentioned.
Example input: "shorted 1 crude oil future at 6500 sold at 6400"
Example output: { "ticker": "CRUDE OIL", "instrument": "Commodity", "mcxCommodity": "CRUDE OIL", "tradeCategory": "Future", "direction": "Short", "size": 1, "entryPrice": 6500, "exitPrice": 6400 }`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: quickAddText,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ticker: { type: Type.STRING },
                        instrument: { type: Type.STRING },
                        marketIndex: { type: Type.STRING },
                        mcxCommodity: { type: Type.STRING },
                        tradeCategory: { type: Type.STRING },
                        optionType: { type: Type.STRING },
                        strikePrice: { type: Type.NUMBER },
                        direction: { type: Type.STRING },
                        size: { type: Type.NUMBER },
                        entryPrice: { type: Type.NUMBER },
                        exitPrice: { type: Type.NUMBER },
                        stopLoss: { type: Type.NUMBER },
                        target: { type: Type.NUMBER },
                        setup: { type: Type.STRING },
                        notes: { type: Type.STRING },
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const parsedData = JSON.parse(jsonStr);
        
        const sanitizedData: Partial<Omit<Trade, 'id' | 'date'>> = {};
        const allowedKeys: Array<keyof Omit<Trade, 'id' | 'date'>> = [
            'ticker', 'instrument', 'tradeCategory', 'optionType', 'strikePrice', 'stopLoss', 'target',
            'direction', 'size', 'entryPrice', 'exitPrice', 'setup', 'notes', 'marketIndex', 'mcxCommodity'
        ];

        for (const key of allowedKeys) {
            if (key in parsedData && parsedData[key] !== undefined && parsedData[key] !== null) {
                (sanitizedData as any)[key] = parsedData[key];
            }
        }
        
        if (sanitizedData.ticker) {
            sanitizedData.ticker = sanitizedData.ticker.toUpperCase();
        }

        setTrade(prev => ({ ...defaultState, date: prev.date, ...sanitizedData }));
        setQuickAddText('');

    } catch (error) {
        console.error("Gemini parsing error:", error);
        setParseError("Sorry, I couldn't understand that. Please try rephrasing or fill out the form manually.");
    } finally {
        setIsParsing(false);
    }
  };
  
  const isTickerReadOnly = (trade.tradeCategory === TradeCategory.Option && trade.instrument !== InstrumentType.Stock) || trade.instrument === InstrumentType.Commodity;


  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
        <div className="p-4 border border-[var(--border-primary)] bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-lg">
            <label htmlFor="quickAdd" className="flex items-center gap-2 text-md font-semibold text-indigo-400 mb-2">
            <AiIcon className="h-5 w-5" />
            Quick Add with AI
            </label>
            <p className="text-xs text-slate-400 mb-2">Describe your trade and let AI pre-fill the form for you.</p>
            <div className="flex flex-col sm:flex-row items-start gap-2">
            <textarea
                id="quickAdd"
                value={quickAddText}
                onChange={(e) => {
                    setQuickAddText(e.target.value);
                    if (parseError) setParseError(null);
                }}
                placeholder="e.g., Bought 10 reliance at 2300.5, sold at 2325..."
                rows={2}
                className="flex-grow w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 text-white p-2 text-sm"
            />
            <button
                type="button"
                onClick={handleParseAndFill}
                disabled={isParsing || !quickAddText.trim()}
                className="flex items-center justify-center w-full sm:w-36 h-[52px] px-4 py-2 bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex-shrink-0"
            >
                {isParsing ? <SpinnerIcon className="h-5 w-5" /> : 'Analyze & Fill'}
            </button>
            </div>
            {parseError && <p className="text-red-400 text-xs mt-2">{parseError}</p>}
        </div>
      
      <div className="space-y-6">
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">Date</label>
            <input type="date" name="date" id="date" value={trade.date} onChange={handleChange} required className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-slate-300 mb-1">Ticker</label>
            <input 
              type="text" 
              name="ticker" 
              id="ticker" 
              value={trade.ticker} 
              onChange={handleChange}
              onBlur={(e) => {
                if (!isTickerReadOnly) {
                    const upperCasedValue = e.target.value.toUpperCase();
                    if (upperCasedValue !== trade.ticker) {
                        setTrade(prev => ({...prev, ticker: upperCasedValue}));
                    }
                }
              }}
              required 
              placeholder={isTickerReadOnly ? "Auto-generated" : "e.g., RELIANCE"}
              readOnly={isTickerReadOnly}
              className={`block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 transition-colors duration-200 ${isTickerReadOnly ? 'cursor-not-allowed bg-slate-800 text-slate-400 focus:ring-0 focus:border-slate-600' : ''}`} 
            />
          </div>
        </fieldset>
        
        <fieldset className="space-y-4 p-4 border border-[var(--border-primary)] rounded-lg">
            <legend className="text-sm font-semibold text-indigo-400 px-2">Instrument Details</legend>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Trade Type</label>
                    <div className="grid grid-cols-3 gap-1 bg-[var(--surface-secondary)] p-1 rounded-md">
                        {Object.values(TradeCategory).map(cat => (
                             <button key={cat} type="button" onClick={() => handleCategoryChange(cat)} className={`px-2 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${trade.tradeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-transparent hover:bg-slate-600 text-slate-300'}`}>
                                {cat}
                             </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="instrument" className="block text-sm font-medium text-slate-300 mb-1">Instrument</label>
                    <select 
                        name="instrument" 
                        id="instrument" 
                        value={trade.instrument} 
                        onChange={handleChange} 
                        disabled={trade.tradeCategory === TradeCategory.Cash}
                        className={`block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 transition-colors duration-200 ${trade.tradeCategory === TradeCategory.Cash ? 'cursor-not-allowed bg-slate-800 text-slate-400 focus:ring-0 focus:border-slate-600' : ''}`}
                    >
                        {Object.values(InstrumentType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>
            
            {trade.instrument === InstrumentType.Index && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Market Index</label>
                    <div className="flex flex-wrap gap-2 bg-[var(--surface-secondary)] p-1 rounded-md">
                        {Object.values(MarketIndex).map(index => (
                            <button key={index} type="button" onClick={() => handleMarketIndexChange(index)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 ${trade.marketIndex === index ? 'bg-indigo-600 text-white' : 'bg-transparent hover:bg-slate-600 text-slate-300'}`}>
                                {index}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {trade.instrument === InstrumentType.Commodity && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">MCX Commodity</label>
                    <div className="flex flex-wrap gap-2 bg-[var(--surface-secondary)] p-1 rounded-md">
                        {Object.values(McxCommodity).map(commodity => (
                            <button key={commodity} type="button" onClick={() => handleCommodityChange(commodity)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 ${trade.mcxCommodity === commodity ? 'bg-indigo-600 text-white' : 'bg-transparent hover:bg-slate-600 text-slate-300'}`}>
                                {commodity}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </fieldset>

        {trade.tradeCategory === TradeCategory.Option && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="optionType" className="block text-sm font-medium text-slate-300 mb-1">CE / PE</label>
                    <select name="optionType" id="optionType" value={trade.optionType || ''} onChange={handleChange} required className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500">
                        <option value="" disabled>Select...</option>
                        {Object.values(OptionType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="strikePrice" className="block text-sm font-medium text-slate-300 mb-1">Strike Price</label>
                    <input type="number" name="strikePrice" id="strikePrice" value={trade.strikePrice || ''} onChange={handleChange} required min="0" step="any" className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500" />
                </div>
            </fieldset>
        )}

        <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
             <div>
                <label htmlFor="entryPrice" className="block text-sm font-medium text-slate-300 mb-1">Entry Price</label>
                <input type="number" name="entryPrice" id="entryPrice" value={trade.entryPrice || ''} onChange={handleChange} required min="0" step="any" className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500" placeholder="0.00" />
            </div>
            <div>
                <label htmlFor="exitPrice" className="block text-sm font-medium text-slate-300 mb-1">Exit Price</label>
                <input type="number" name="exitPrice" id="exitPrice" value={trade.exitPrice || ''} onChange={handleChange} required min="0" step="any" className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500" placeholder="0.00" />
            </div>
            <div>
                <label htmlFor="size" className="block text-sm font-medium text-slate-300 mb-1">Size</label>
                <input type="number" name="size" id="size" value={trade.size || ''} onChange={handleChange} required min="0" step="any" placeholder="Shares/Contracts" className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500" />
            </div>
             <div>
                <label htmlFor="stopLoss" className="block text-sm font-medium text-slate-300 mb-1">Stop Loss</label>
                <input type="number" name="stopLoss" id="stopLoss" value={trade.stopLoss || ''} onChange={handleChange} min="0" step="any" className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500" placeholder="Open"/>
            </div>
             <div>
                <label htmlFor="target" className="block text-sm font-medium text-slate-300 mb-1">Target</label>
                <input type="number" name="target" id="target" value={trade.target || ''} onChange={handleChange} min="0" step="any" className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500" placeholder="Open"/>
            </div>
           <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-medium text-slate-300 mb-1">Direction</label>
               <div className="grid grid-cols-2 gap-1 bg-[var(--surface-secondary)] p-1 rounded-md h-[42px] items-center">
                   <button type="button" onClick={() => handleDirectionChange(TradeDirection.Long)} className={`px-2 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${trade.direction === TradeDirection.Long ? 'bg-green-600 text-white' : 'bg-transparent hover:bg-slate-600 text-slate-300'}`}>
                       Buy
                   </button>
                   <button type="button" onClick={() => handleDirectionChange(TradeDirection.Short)} className={`px-2 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${trade.direction === TradeDirection.Short ? 'bg-red-600 text-white' : 'bg-transparent hover:bg-slate-600 text-slate-300'}`}>
                       Sell
                   </button>
               </div>
           </div>
        </fieldset>

        <fieldset className="space-y-4">
            <div>
              <label htmlFor="setup" className="flex items-center gap-1 text-sm font-medium text-slate-300 mb-1">
                <span>Setup / Strategy</span>
                <Tooltip text="Your specific trading pattern or reason for entry. Examples: Bull Flag Breakout, 5-min ORB, Support Bounce." />
              </label>
              <input type="text" name="setup" id="setup" value={trade.setup} onChange={handleChange} required placeholder="e.g., Earnings Breakout" className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">Notes / Reflection</label>
              <textarea name="notes" id="notes" value={trade.notes || ''} onChange={handleChange} rows={4} placeholder="What went well? What could be improved?" className="block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500"></textarea>
            </div>
        </fieldset>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)] sticky bottom-0 bg-[var(--surface-primary)] py-4 px-6 -mx-6">
        <button type="button" onClick={onClose} className="px-5 py-2 bg-[var(--surface-tertiary)] rounded-md hover:bg-opacity-80 font-semibold transition-colors">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex items-center justify-center w-36 px-5 py-2 bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 font-semibold transition-colors shadow-lg shadow-indigo-600/30">
            {isLoading ? <SpinnerIcon className="h-5 w-5"/> : (initialData ? 'Update Trade' : 'Save Trade')}
        </button>
      </div>
    </form>
  );
};