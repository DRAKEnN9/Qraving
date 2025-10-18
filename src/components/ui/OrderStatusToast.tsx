'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface OrderStatusToastProps {
  isVisible: boolean;
  title: string;
  message: string;
  type: 'success' | 'waiting' | 'preparing';
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function OrderStatusToast({
  isVisible,
  title,
  message,
  type,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000
}: OrderStatusToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      
      if (autoClose && autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          setShow(false);
          setTimeout(() => onClose?.(), 300); // Wait for animation to complete
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [isVisible, autoClose, autoCloseDelay, onClose]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose?.(), 300); // Wait for animation to complete
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
      case 'preparing':
        return <CheckCircle className="h-16 w-16 text-white" />;
      case 'waiting':
        return (
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
            <div className="absolute inset-4 rounded-full bg-white/30"></div>
          </div>
        );
      default:
        return <CheckCircle className="h-16 w-16 text-white" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-green-400 to-green-500';
      case 'preparing':
        return 'bg-gradient-to-br from-blue-400 to-blue-500';
      case 'waiting':
        return 'bg-gradient-to-br from-yellow-400 to-orange-500';
      default:
        return 'bg-gradient-to-br from-green-400 to-green-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        className={`
          relative w-full max-w-sm transform rounded-2xl bg-white shadow-2xl transition-all duration-300
          ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/10 p-1 text-gray-600 hover:bg-black/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Green header with icon */}
        <div className={`relative rounded-t-2xl px-8 py-12 text-center ${getBgColor()}`}>
          <div className="flex justify-center mb-2">
            {getIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>
          
          {onClose && (
            <button
              onClick={handleClose}
              className="w-full rounded-xl bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 transition-colors"
            >
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
