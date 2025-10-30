import React from 'react';
import { InfoIcon } from './icons';

interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  return (
    <div className="relative flex items-center group">
      <InfoIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-slate-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-slate-600">
        {text}
      </div>
    </div>
  );
};
