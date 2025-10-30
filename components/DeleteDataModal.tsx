import React, { useState } from 'react';
import { Modal } from './Modal';
import { SpinnerIcon, WarningIcon } from './icons';

interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteDataModal: React.FC<DeleteDataModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        await onConfirm();
        setIsDeleting(false);
        onClose();
    };
    
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete All Trade Data">
      <div className="text-white">
        <div className="flex items-start sm:items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <WarningIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg leading-6 font-medium text-white">Confirm Deletion</h3>
                <div className="mt-2">
                    <p className="text-sm text-slate-300">
                        Are you absolutely sure you want to delete all of your trade data? This action is irreversible and cannot be undone.
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-700">
            <button 
                type="button" 
                onClick={onClose} 
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-700 disabled:opacity-50"
            >
                Cancel
            </button>
            <button 
                type="button" 
                onClick={handleConfirm}
                disabled={isDeleting}
                className="inline-flex justify-center w-full sm:w-48 px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 text-white font-semibold disabled:bg-red-800"
            >
                {isDeleting ? <SpinnerIcon className="h-5 w-5"/> : 'Yes, Delete Everything'}
            </button>
        </div>
      </div>
    </Modal>
  );
};
