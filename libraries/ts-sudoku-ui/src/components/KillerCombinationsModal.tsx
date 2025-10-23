/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
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

import React, { useEffect, useRef } from 'react';
import { ICage } from '@fgv/ts-sudoku-lib';
import { ICombinationDisplayInfo } from '../types';
import { CombinationGrid } from './CombinationGrid';

/**
 * Props for the KillerCombinationsModal component
 */
export interface IKillerCombinationsModalProps {
  readonly cage: ICage;
  readonly combinations: ICombinationDisplayInfo[];
  readonly onToggle: (signature: string) => void;
  readonly onClose: () => void;
  readonly isOpen: boolean;
  readonly className?: string;
}

/**
 * Mobile modal variant for killer combinations explorer
 * @public
 */
export const KillerCombinationsModal: React.FC<IKillerCombinationsModalProps> = ({
  cage,
  combinations,
  onToggle,
  onClose,
  isOpen,
  className
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus trap and initial focus
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleTab = (event: KeyboardEvent): void => {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleTab);
      return () => window.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const activeCount = combinations.filter((c) => !c.isEliminated).length;
  const totalCount = combinations.length;

  /* c8 ignore next 1 - defense in depth */
  const opacity = isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none';
  const overlayClasses = [
    'fixed inset-0 z-[9999]',
    'flex items-end sm:items-center justify-center',
    'p-4',
    'bg-black bg-opacity-40',
    'transition-opacity duration-300',
    opacity
  ]
    .filter(Boolean)
    .join(' ');

  /* c8 ignore next 1 - defense in depth */
  const translation = isOpen ? 'translate-y-0' : 'translate-y-full';
  const dialogClasses = [
    'bg-white dark:bg-gray-900',
    'rounded-t-2xl sm:rounded-2xl',
    'w-full max-w-lg',
    'max-h-[85vh]',
    'overflow-hidden',
    'flex flex-col',
    'shadow-2xl',
    'transform transition-transform duration-300',
    translation,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={overlayClasses} onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className={dialogClasses}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Combinations
            </h2>
            <p id="modal-description" className="text-sm text-gray-500 dark:text-gray-400">
              {cage.numCells} cells, sum {cage.total}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close combinations modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {activeCount} of {totalCount} combinations possible
          </p>
        </div>

        {/* Combinations Grid */}
        <div className="flex-1 overflow-hidden">
          <CombinationGrid combinations={combinations} onToggle={onToggle} mode="modal" />
        </div>
      </div>
    </div>
  );
};
