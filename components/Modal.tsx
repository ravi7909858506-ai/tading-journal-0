import React, { ReactNode } from 'react';
import { CloseIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-[var(--surface-primary)] rounded-lg shadow-xl w-full max-w-2xl transform transition-all animate-fade-in-scale max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] sticky top-0 bg-[var(--surface-primary)] z-10">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-[var(--surface-secondary)] transition-colors duration-150">
                <CloseIcon />
            </button>
        </div>
        <div className="p-6 overflow-y-auto">
            {children}
        </div>
      </div>
    </div>
  );
};