import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useToast } from '../contexts/ToastContext';
import { InfoIcon, WarningIcon, SuccessIcon, CloseIcon } from './icons';

export type ToastType = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const toastIcons = {
  info: <InfoIcon className="h-5 w-5 text-blue-400" />,
  success: <SuccessIcon className="h-5 w-5 text-green-400" />,
  error: <WarningIcon className="h-5 w-5 text-red-400" />,
};

const toastStyles = {
    info: 'bg-blue-900/50 border-blue-700',
    success: 'bg-green-900/50 border-green-700',
    error: 'bg-red-900/50 border-red-700',
};


const Toast: React.FC<{ message: ToastMessage; onDismiss: (id: number) => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(message.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [message, onDismiss]);

    return (
        <div 
            className={`w-full max-w-sm p-4 rounded-lg shadow-lg flex items-center gap-3 border text-white animate-slide-in-from-top ${toastStyles[message.type]}`}
        >
            <div className="flex-shrink-0">
                {toastIcons[message.type]}
            </div>
            <div className="flex-1 text-sm font-medium">
                {message.message}
            </div>
            <button onClick={() => onDismiss(message.id)} className="p-1 rounded-full hover:bg-white/10">
                <CloseIcon className="h-4 w-4" />
            </button>
        </div>
    );
};


export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  
  const toastRoot = document.getElementById('toast-root');

  if (!toastRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast} onDismiss={removeToast} />
      ))}
    </div>,
    toastRoot
  );
};