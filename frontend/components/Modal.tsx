'use client';

import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ title, onClose, children, size = 'md', subtitle }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeMap[size]} max-h-[90vh] flex flex-col animate-slide-up`}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 -mt-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors duration-200 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
