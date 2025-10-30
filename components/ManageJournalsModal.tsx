
import React from 'react';
import { Modal } from './Modal';

interface ManageJournalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageJournalsModal: React.FC<ManageJournalsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Journals">
      <div className="text-white">
        <p className="text-slate-400">This feature is coming soon!</p>
        <p className="mt-2 text-sm text-slate-500">
          In the future, you'll be able to create and switch between different trade journals,
          for example, one for stocks and one for crypto.
        </p>
        <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">
                Close
            </button>
        </div>
      </div>
    </Modal>
  );
};
