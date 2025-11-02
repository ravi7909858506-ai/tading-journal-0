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
  expiryDate: undefined,
};

// Helper components for form fields
const InputField: React.FC<{ label: string; name: string; value?: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; required?: boolean; step?: string; min?: string; placeholder?: string; rows?: number }> = ({ label, name, value, onChange, type = 'text', required = false, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300">{label}</label>
        {type === 'textarea' ? (
             <textarea
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                required={required}
                className="mt-1 block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2"
                {...props}
            />
        ) : (
            <input
                type={type}
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                required={required}
                className="mt-1 block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2"
                {...props}
            />
        )}
    </div>
);

const SelectField: React.FC<{ label: string; name: string; value?: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; required?: boolean }> = ({ label, name, value, onChange, children, required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300">{label}</label>
        <select
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            className="mt-1 block w-full bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2"
        >
            {children}
        </select>
    </div>
);


export const TradeForm: React.FC<TradeFormProps> = ({ onClose, onSubmit, onUpdate, initialData }) => {
  const [trade, setTrade] = useState(initialData || defaultState);
  const [isLoading, setIsLoading] = useState(false);
  
  const [quickAddText, setQuickAddText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const isAiEnabled = typeof process !== 'undefined' && process.env && !!process.env.API_KEY;

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
        let updated = { ...prev, [name]: value };

        // 1. Type Coercion for numeric fields
        const numericFields = ['size', 'entryPrice', 'exitPrice'];
        const optionalNumericFields = ['strikePrice', 'stopLoss', 'target'];
        
        if (numericFields.includes(name)) {
            (updated as any)[name] = parseFloat(value) || 0;
        } else if (optionalNumericFields.includes(name)) {
            const parsedValue = parseFloat(value);
            (updated as any)[name] = isNaN(parsedValue) ? undefined : parsedValue;
        }

        // 2. Handle dependent field resets based on the field that just changed
        if (name === 'instrument') {
            updated.marketIndex = undefined;
            updated.mcxCommodity = undefined;
        }
        if (name === 'tradeCategory') {
            if (value !== TradeCategory.Option) {
                updated.optionType = undefined;
                updated.strikePrice = undefined;
            }
            if (value !== TradeCategory.Option && value !== TradeCategory.Future) {
                updated.expiryDate = undefined;
            }
            if (value === TradeCategory.Cash) {
                updated.instrument = InstrumentType.Stock;
            }
        }
        
        // 3. Derive the Ticker value
        let newTicker = updated.ticker;
        const { tradeCategory, instrument, marketIndex, mcxCommodity, strikePrice, optionType } = updated;
        const isOption = tradeCategory === TradeCategory.Option;
        
        // Always try to construct if it's an auto-generating instrument
        if (instrument === InstrumentType.Index) {
            newTicker = isOption 
                ? `${marketIndex || ''} ${strikePrice || ''} ${optionType || ''}`.trim().replace(/\s+/g, ' ')
                : marketIndex || ''; // Non-option index trade (e.g., futures)
        } else if (instrument === InstrumentType.Commodity) {
            newTicker = isOption
                ? `${mcxCommodity || ''} ${strikePrice || ''} ${optionType || ''}`.trim().replace(/\s+/g, ' ')
                : mcxCommodity || '';
        }

        // Handle edge cases when switching instrument types
        if (name === 'instrument') {
            const wasAuto = prev.instrument === InstrumentType.Index || prev.instrument === InstrumentType.Commodity;
            const isNowManual = value === InstrumentType.Stock || value === InstrumentType.Crypto;
            if (wasAuto && isNowManual) {
                newTicker = ''; // Clear the old auto-generated ticker
            }
        }
        
        // Handle switching away from an auto-generated option
        if (name === 'tradeCategory' && value !== TradeCategory.Option && prev.tradeCategory === TradeCategory.Option) {
            if (prev.instrument === InstrumentType.Commodity) {
                newTicker = prev.mcxCommodity || ''; // Revert to just commodity name
            } else if (prev.instrument === InstrumentType.Index) {
                newTicker = ''; // Index Futures need manual ticker, so clear
            }
        }

        updated.ticker = newTicker;
        return updated;
    });
  };

  const handleDirectionChange = (direction: TradeDirection) => {
    setTrade(prev => ({ ...prev, direction }));
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
    if (!isAiEnabled || !quickAddText.trim()) return;

    setIsParsing(true);
    setParseError(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const systemInstruction = `You are an intelligent assistant for a trading journal. Your task is to parse a user's natural language description of a trade and extract key details. The user might mention tickers from the Indian market like 'BANKNIFTY' or 'RELIANCE'. Respond ONLY with a valid JSON object matching the provided schema. If a value cannot be determined, omit the key from the JSON object.
- For 'direction', use one of: ${Object.values(TradeDirection).join(', ')}.
- For 'tradeCategory', use one of: ${Object.values(TradeCategory).join(', ')}.
- For 'instrument', use one of: ${Object.values(InstrumentType).join(', ')}. Infer from the ticker; e.g., 'BANKNIFTY' is usually an 'Index', 'CRUDEOIL' is a 'Commodity'. Default to 'Stock' if unsure.
- For 'marketIndex', if instrument is 'Index', use one of: ${Object.values(MarketIndex).join(', ')}.
- For 'mcxCommodity', if instrument is 'Commodity', use one of: ${Object.values(McxCommodity).join(', ')}.
- For 'optionType', if tradeCategory is 'Option', use one of: ${Object.values(OptionType).join(', ')}.
- For date, use today's date if not specified: ${new Date().toISOString().split('T')[0]}.
- For numeric fields like strikePrice, size, entryPrice, exitPrice, stopLoss, target, extract the numbers.
- 'setup' should be a concise description of the trading strategy (e.g., 'Breakout', 'Reversal').
- 'notes' should capture any additional commentary.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: quickAddText,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING },
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
                        expiryDate: { type: Type.STRING },
                    },
                },
            }
        });

        const parsedData = JSON.parse(response.text);
        
        setTrade(prev => ({
            ...prev,
            ...parsedData,
            size: parsedData.size !== undefined ? Number(parsedData.size) : prev.size,
            entryPrice: parsedData.entryPrice !== undefined ? Number(parsedData.entryPrice) : prev.entryPrice,
            exitPrice: parsedData.exitPrice !== undefined ? Number(parsedData.exitPrice) : prev.exitPrice,
            strikePrice: parsedData.strikePrice !== undefined ? Number(parsedData.strikePrice) : prev.strikePrice,
            stopLoss: parsedData.stopLoss !== undefined ? Number(parsedData.stopLoss) : prev.stopLoss,
            target: parsedData.target !== undefined ? Number(parsedData.target) : prev.target,
        }));
        
        setQuickAddText('');

    } catch (error) {
        console.error("Error parsing trade data:", error);
        setParseError("Sorry, I couldn't understand that. Please try rephrasing or enter the details manually.");
    } finally {
        setIsParsing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      {isAiEnabled && (
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-2">
                <label htmlFor="quickAdd" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <AiIcon className="text-indigo-400" />
                    <span>Quick Add with AI</span>
                </label>
                <Tooltip text="Describe your trade in plain English. For example: 'Bought 10 RELIANCE at 2300, sold at 2325 for a breakout setup.'" />
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    id="quickAdd"
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    placeholder="e.g., Bought 10 BANKNIFTY 44000 CE at 150..."
                    className="flex-grow bg-[var(--surface-secondary)] border-[var(--border-primary)] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2"
                />
                <button 
                    type="button" 
                    onClick={handleParseAndFill} 
                    disabled={isParsing || !quickAddText.trim()}
                    className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-28"
                >
                    {isParsing ? <SpinnerIcon className="h-5 w-5" /> : 'Parse'}
                </button>
            </div>
            {parseError && <p className="text-red-400 text-xs mt-2">{parseError}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Date" name="date" type="date" value={trade.date} onChange={handleChange} required />
        
        <SelectField label="Category" name="tradeCategory" value={trade.tradeCategory} onChange={handleChange}>
          {Object.values(TradeCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </SelectField>

        {trade.tradeCategory !== TradeCategory.Cash && (
            <SelectField label="Instrument" name="instrument" value={trade.instrument} onChange={handleChange}>
              {Object.values(InstrumentType).filter(i => i !== InstrumentType.Stock).map(inst => <option key={inst} value={inst}>{inst}</option>)}
            </SelectField>
        )}

        {trade.instrument === InstrumentType.Index && (
            <SelectField label="Index" name="marketIndex" value={trade.marketIndex} onChange={handleChange}>
                <option value="">Select Index</option>
                {Object.values(MarketIndex).map(index => <option key={index} value={index}>{index}</option>)}
            </SelectField>
        )}

        {trade.instrument === InstrumentType.Commodity && (
             <SelectField label="Commodity" name="mcxCommodity" value={trade.mcxCommodity} onChange={handleChange}>
                <option value="">Select Commodity</option>
                {Object.values(McxCommodity).map(com => <option key={com} value={com}>{com}</option>)}
            </SelectField>
        )}

        <InputField label="Ticker / Symbol" name="ticker" value={trade.ticker} onChange={handleChange} required placeholder="e.g., RELIANCE" />
        
        {trade.tradeCategory === TradeCategory.Option && (
            <>
              <InputField label="Strike Price" name="strikePrice" type="number" step="any" value={trade.strikePrice} onChange={handleChange} required />
              <SelectField label="Option Type" name="optionType" value={trade.optionType} onChange={handleChange} required>
                <option value="">Select Type</option>
                {Object.values(OptionType).map(type => <option key={type} value={type}>{type}</option>)}
              </SelectField>
            </>
        )}
         {(trade.tradeCategory === TradeCategory.Option || trade.tradeCategory === TradeCategory.Future) && (
            <InputField label="Expiry Date (Optional)" name="expiryDate" type="date" value={trade.expiryDate} onChange={handleChange} />
        )}
      </div>

       <div>
        <label className="block text-sm font-medium text-slate-300">Direction</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleDirectionChange(TradeDirection.Long)} className={`py-2 rounded-md transition-colors ${trade.direction === TradeDirection.Long ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Buy</button>
            <button type="button" onClick={() => handleDirectionChange(TradeDirection.Short)} className={`py-2 rounded-md transition-colors ${trade.direction === TradeDirection.Short ? 'bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Sell</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField label="Size / Quantity" name="size" type="number" step="any" min="0" value={trade.size} onChange={handleChange} required />
        <InputField label="Entry Price" name="entryPrice" type="number" step="any" min="0" value={trade.entryPrice} onChange={handleChange} required />
        <InputField label="Exit Price" name="exitPrice" type="number" step="any" min="0" value={trade.exitPrice} onChange={handleChange} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Stop Loss (Optional)" name="stopLoss" type="number" step="any" value={trade.stopLoss} onChange={handleChange} />
        <InputField label="Target (Optional)" name="target" type="number" step="any" value={trade.target} onChange={handleChange} />
      </div>
      
      <InputField label="Setup / Strategy" name="setup" value={trade.setup} onChange={handleChange} required placeholder="e.g., Breakout, Reversal" />
      <InputField label="Notes / Reflection (Optional)" name="notes" type="textarea" value={trade.notes} onChange={handleChange} rows={4} placeholder="What went well? What could be improved?" />

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-700">Cancel</button>
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold disabled:opacity-50 flex items-center justify-center w-28">
            {isLoading ? <SpinnerIcon /> : (initialData ? 'Update Trade' : 'Save Trade')}
        </button>
      </div>
    </form>
  );
};