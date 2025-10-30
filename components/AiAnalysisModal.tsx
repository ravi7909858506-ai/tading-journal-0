import React, { useState } from 'react';
import { Modal } from './Modal';
import { Trade } from '../types';
import { AiIcon, SpinnerIcon } from './icons';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
}

// Gemini API key is handled by the environment variable `process.env.API_KEY`
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-pro'; // Using a more powerful model for analysis

const systemInstruction = `You are a trading performance analyst reviewing a user's trade journal from the Indian market.
All monetary values in the data are in Indian Rupees (₹).
Your role is to provide an objective, data-driven analysis of their trading activity.
Analyze the provided JSON data of trades and identify patterns, strengths, and weaknesses.
Structure your analysis into the following sections:
1.  **Overall Performance Summary:** A brief overview of the key metrics (e.g., win rate, P&L, profit factor).
2.  **Strengths:** What is the trader doing well? (e.g., profitable setups, good risk management on winning trades).
3.  **Areas for Improvement:** Where are the biggest opportunities to improve? (e.g., cutting losses, over-trading specific setups, poor performance on certain days/tickers).
4.  **Actionable Insights & Suggestions:** Provide 2-3 specific, actionable suggestions based on the data.

**IMPORTANT RULES:**
-   Base your entire analysis STRICTLY on the provided trade data. Do not invent or assume information.
-   Do NOT provide any financial advice, market predictions, or recommendations to buy/sell specific assets.
-   Keep the tone professional, helpful, and educational.
-   Format your response using Markdown for readability (headings, bullet points, bold text).`;


export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({ isOpen, onClose, trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (trades.length < 5) {
        setError("You need at least 5 trades to get a meaningful analysis.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
        const tradesForPrompt = trades.map(({ id, notes, ...rest }) => rest); // Remove fields not relevant for analysis
        const prompt = `Here is the trade data in JSON format. All monetary values are in INR (₹). Please provide a detailed analysis:\n\n${JSON.stringify(tradesForPrompt, null, 2)}`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        
        setAnalysis(response.text);

    } catch (err) {
      console.error("Gemini API Error:", err);
      setError("An error occurred while generating the analysis. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset state when modal is closed
  const handleClose = () => {
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Performance Analysis">
        <div className="flex flex-col text-white min-h-[300px]">
            {!analysis && !isLoading && (
                <div className="text-center flex flex-col items-center justify-center flex-grow">
                    <p className="text-slate-300 mb-4">Get an AI-powered analysis of your trading performance based on your logged trades.</p>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <button 
                        onClick={handleAnalyze} 
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold transition-colors shadow-lg shadow-indigo-600/30"
                        disabled={trades.length < 5}
                    >
                        <AiIcon />
                        <span>Analyze My Trades</span>
                    </button>
                    {trades.length < 5 && <p className="text-xs text-slate-500 mt-2">Requires at least 5 trades.</p>}
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col items-center justify-center flex-grow">
                    <SpinnerIcon />
                    <p className="mt-4 text-slate-300">Analyzing your performance...</p>
                </div>
            )}

            {analysis && (
                 <div className="prose prose-slate prose-invert max-w-none prose-headings:text-indigo-400 prose-a:text-indigo-400">
                    {/* A simple way to render markdown-like text with basic formatting */}
                    {analysis.split('\n').map((line, index) => {
                        if (line.startsWith('### ')) return <h3 key={index} className="font-bold text-lg mt-4 mb-2">{line.substring(4)}</h3>;
                        if (line.startsWith('## ')) return <h2 key={index} className="font-bold text-xl mt-6 mb-3">{line.substring(3)}</h2>;
                        if (line.startsWith('# ')) return <h1 key={index} className="font-bold text-2xl mt-8 mb-4">{line.substring(2)}</h1>;
                        if (line.match(/^(\*|\-)\s/)) return <li key={index} className="ml-4 list-disc">{line.substring(2)}</li>;
                        if (line.trim() === '') return <div key={index} className="h-4"></div>;
                        return <p key={index} className="text-slate-300">{line}</p>;
                    })}
                 </div>
            )}
        </div>
    </Modal>
  );
};