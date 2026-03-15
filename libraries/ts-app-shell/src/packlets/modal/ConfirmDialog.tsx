/*
 * Copyright (c) 2026 Erik Fortune
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

import React, { useCallback, useEffect } from 'react';

/**
 * Severity level for the confirm dialog.
 * Controls the color of the confirm button.
 * @public
 */
export type ConfirmDialogSeverity = 'danger' | 'warning' | 'info';

/**
 * Props for the ConfirmDialog component.
 * @public
 */
export interface IConfirmDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** Dialog title */
  readonly title: string;
  /** Dialog message body */
  readonly message: React.ReactNode;
  /** Label for the confirm button (defaults to 'Confirm') */
  readonly confirmLabel?: string;
  /** Label for the cancel button (defaults to 'Cancel') */
  readonly cancelLabel?: string;
  /** Severity level controlling confirm button color (defaults to 'danger') */
  readonly severity?: ConfirmDialogSeverity;
  /** Called when the user confirms */
  readonly onConfirm: () => void;
  /** Called when the user cancels or closes */
  readonly onCancel: () => void;
}

const severityClasses: Record<ConfirmDialogSeverity, string> = {
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
  info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
};

const severityIconClasses: Record<ConfirmDialogSeverity, string> = {
  danger: 'text-red-600',
  warning: 'text-amber-500',
  info: 'text-blue-600'
};

/**
 * Generic confirmation dialog.
 *
 * Renders a modal overlay with a title, message, and confirm/cancel buttons.
 * Closes on Escape key or backdrop click (treated as cancel).
 *
 * @public
 */
export function ConfirmDialog(props: IConfirmDialogProps): React.ReactElement | null {
  const {
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    severity = 'danger',
    onConfirm,
    onCancel
  } = props;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return (): void => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} role="presentation" />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                severity === 'danger' ? 'bg-red-100' : severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
              }`}
            >
              <svg
                className={`w-6 h-6 ${severityIconClasses[severity]}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {severity === 'info' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                )}
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 id="confirm-dialog-title" className="text-base font-semibold text-gray-900 leading-6">
                {title}
              </h3>
              <div id="confirm-dialog-message" className="mt-2 text-sm text-gray-600">
                {typeof message === 'string' ? <p>{message}</p> : message}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${severityClasses[severity]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
