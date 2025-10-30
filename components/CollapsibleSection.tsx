import React, { useState, ReactNode, useEffect } from 'react';
import { ChevronDownIcon } from './icons';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // This state ensures children are mounted before the open animation starts
  // and unmounted after the close animation finishes.
  const [shouldRender, setShouldRender] = useState(defaultOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) {
      setShouldRender(false);
    }
  };
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur-sm rounded-xl shadow-2xl border border-[var(--border-primary)] overflow-hidden">
      <button
        onClick={toggleOpen}
        className="w-full flex justify-between items-center p-6 md:p-8 text-left"
        aria-expanded={isOpen}
      >
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <ChevronDownIcon
          className={`h-6 w-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        onTransitionEnd={onAnimationEnd}
        className={`transition-all duration-300 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
            <div className="px-6 md:px-8 pb-6 md:pb-8">
                {shouldRender && children}
            </div>
        </div>
      </div>
    </div>
  );
};