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

import React, { useEffect } from 'react';

import { DEFAULT_TOAST_CONFIG, IMessage, MessageSeverity } from './model';

// ============================================================================
// Severity Styles
// ============================================================================

const SEVERITY_STYLES: Record<MessageSeverity, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800'
};

// ============================================================================
// Single Toast
// ============================================================================

/**
 * Props for a single Toast item.
 * @public
 */
export interface IToastItemProps {
  readonly message: IMessage;
  readonly onDismiss: (id: string) => void;
}

/**
 * A single toast notification.
 * @public
 */
export function ToastItem(props: IToastItemProps): React.ReactElement {
  const { message, onDismiss } = props;
  const config = DEFAULT_TOAST_CONFIG[message.severity];

  useEffect(() => {
    if (config.autoDismissMs > 0) {
      const timer = setTimeout(() => onDismiss(message.id), config.autoDismissMs);
      return (): void => clearTimeout(timer);
    }
    return undefined;
  }, [message.id, config.autoDismissMs, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${
        SEVERITY_STYLES[message.severity]
      }`}
      role="alert"
    >
      <div className="flex-1 text-sm line-clamp-4" title={message.text}>
        {message.text}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {message.action && (
          <button
            onClick={message.action.onAction}
            className="text-sm font-medium underline hover:no-underline"
          >
            {message.action.label}
          </button>
        )}
        <button
          onClick={(): void => onDismiss(message.id)}
          className="text-current opacity-50 hover:opacity-100"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Toast Container
// ============================================================================

/**
 * Props for the ToastContainer.
 * @public
 */
export interface IToastContainerProps {
  readonly toasts: ReadonlyArray<IMessage>;
  readonly onDismiss: (id: string) => void;
  /** Maximum number of toasts to show simultaneously */
  readonly maxVisible?: number;
}

/**
 * Container that renders active toasts in the bottom-right corner.
 * @public
 */
export function ToastContainer(props: IToastContainerProps): React.ReactElement | null {
  const { toasts, onDismiss, maxVisible = 5 } = props;
  const visible = toasts.slice(-maxVisible);

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2">
      {visible.map((toast) => (
        <ToastItem key={toast.id} message={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
