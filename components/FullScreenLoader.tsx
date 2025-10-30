import React from 'react';
import { SpinnerIcon } from './icons';

export const FullScreenLoader: React.FC<{ message?: string }> = ({ message = "Loading Trades..." }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
      <SpinnerIcon />
      <p className="mt-4 text-slate-300 text-lg">{message}</p>
    </div>
  );
};
