/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createContext, useContext, ReactNode } from 'react';
import type { ToastType } from '../contexts';

/**
 * Toast notification data structure.
 */
export interface IToast {
  id: string;
  type: ToastType;
  message: string;
  timestamp: number;
}

/**
 * Toast context for managing toast notifications.
 */
interface IToastContext {
  toasts: IToast[];
  showToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<IToastContext | undefined>(undefined);

/**
 * Provider component for toast notifications.
 */
export interface IToastProviderProps {
  children: ReactNode;
  /** Duration in milliseconds before auto-removing toasts (default: 5000) */
  autoRemoveDelay?: number;
}

export const ToastProvider: React.FC<IToastProviderProps> = ({ children, autoRemoveDelay = 5000 }) => {
  const [toasts, setToasts] = useState<IToast[]>([]);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: IToast = {
        id,
        type,
        message,
        timestamp: Date.now()
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after delay
      const timeoutId = setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, autoRemoveDelay);

      // Return cleanup function if needed
      return () => clearTimeout(timeoutId);
    },
    [autoRemoveDelay]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue: IToastContext = {
    toasts,
    showToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Hook to access the toast context.
 */
export const useToast = (): IToastContext => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Individual toast component.
 */
interface IToastItemProps {
  toast: IToast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<IToastItemProps> = ({ toast, onRemove }) => {
  const getToastClassName = (type: ToastType): string => {
    const baseClass =
      'p-3 rounded-lg shadow-lg text-white font-medium flex items-center justify-between min-w-80 max-w-96 mb-2 animate-slide-in motion-reduce:animate-none';
    switch (type) {
      case 'success':
        return `${baseClass} bg-emerald-600`;
      case 'error':
        return `${baseClass} bg-red-600`;
      case 'warning':
        return `${baseClass} bg-amber-600`;
      case 'info':
      default:
        return `${baseClass} bg-blue-600`;
    }
  };

  const getIcon = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={getToastClassName(toast.type)} role="alert" aria-live="polite">
      <div className="flex items-center">
        <span className="mr-2 text-lg" aria-hidden="true">
          {getIcon(toast.type)}
        </span>
        <span className="flex-1">{toast.message}</span>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-4 text-white bg-transparent border-0 cursor-pointer p-1 rounded transition-colors hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-white"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

/**
 * Container component that renders all active toasts.
 */
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};
