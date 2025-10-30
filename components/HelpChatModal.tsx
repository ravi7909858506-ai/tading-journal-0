import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { SendIcon, SpinnerIcon } from './icons';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const model = 'gemini-2.5-flash';

const systemInstruction = `You are a helpful assistant for a trading journal application. 
Your goal is to answer questions about trading concepts, financial markets, or how to use the application.
Keep your answers concise and easy to understand for beginners.
If you don't know the answer, say so. Do not provide financial advice.`;

export const HelpChatModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm your trading assistant. How can I help you today? You can ask me about trading terms, strategies, or how to use this journal." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAiEnabled = typeof process !== 'undefined' && process.env && !!process.env.API_KEY;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);
  
  const handleSend = async () => {
    if (!isAiEnabled || !input.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: input,
        config: {
            systemInstruction: systemInstruction,
        }
      });
      
      const botMessage: Message = { sender: 'bot', text: response.text };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage: Message = { sender: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Trading Assistant">
      {isAiEnabled ? (
        <div className="flex flex-col h-[60vh]">
          <div className="flex-grow overflow-y-auto pr-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="flex items-center justify-center p-3 rounded-lg bg-slate-700 text-slate-200">
                    <SpinnerIcon className="h-5 w-5" />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="mt-4 flex items-center border-t border-slate-700 pt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-grow bg-slate-700 border-slate-600 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2"
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 bg-indigo-600 rounded-r-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10">
              {isLoading ? <SpinnerIcon className="h-5 w-5" /> : <SendIcon />}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[60vh] items-center justify-center text-center">
          <p className="text-amber-400 bg-amber-900/30 p-3 rounded-md border border-amber-800 max-w-sm">
              AI Chat is unavailable. The `API_KEY` has not been configured in the application's environment.
          </p>
        </div>
      )}
    </Modal>
  );
};