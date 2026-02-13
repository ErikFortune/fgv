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

import React, { useMemo, useState } from 'react';

import { IMessage, MessageSeverity } from './model';

// ============================================================================
// Severity Icons (text-based for now, heroicons can be added later)
// ============================================================================

const SEVERITY_ICONS: Record<MessageSeverity, string> = {
  info: '\u2139',
  success: '\u2713',
  warning: '\u26A0',
  error: '\u2717'
};

const SEVERITY_COLORS: Record<MessageSeverity, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500'
};

const LOG_ROW_COLORS: Record<MessageSeverity, string> = {
  info: '',
  success: 'bg-green-50',
  warning: 'bg-amber-50',
  error: 'bg-red-50'
};

// ============================================================================
// Status Bar
// ============================================================================

/**
 * Props for the StatusBar component.
 * @public
 */
export interface IStatusBarProps {
  readonly messages: ReadonlyArray<IMessage>;
  readonly onClear: () => void;
}

/**
 * Collapsible status bar / log panel at the bottom of the application.
 *
 * Collapsed: shows severity counts.
 * Expanded: scrollable log of all messages.
 * @public
 */
export function StatusBar(props: IStatusBarProps): React.ReactElement {
  const { messages, onClear } = props;
  const [expanded, setExpanded] = useState(false);

  const counts = useMemo(() => {
    const result: Record<MessageSeverity, number> = { info: 0, success: 0, warning: 0, error: 0 };
    for (const msg of messages) {
      result[msg.severity]++;
    }
    return result;
  }, [messages]);

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Collapsed bar */}
      <button
        onClick={(): void => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          {(Object.keys(counts) as MessageSeverity[]).map((severity) =>
            counts[severity] > 0 ? (
              <span key={severity} className={`flex items-center gap-1 ${SEVERITY_COLORS[severity]}`}>
                <span>{SEVERITY_ICONS[severity]}</span>
                <span>{counts[severity]}</span>
              </span>
            ) : null
          )}
          {messages.length === 0 && <span className="text-gray-400">No messages</span>}
        </div>
        <span className="text-gray-400">{expanded ? '\u25BC' : '\u25B2'}</span>
      </button>

      {/* Expanded log */}
      {expanded && (
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between px-4 py-1 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
            <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">No messages</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 px-4 py-1.5 text-xs border-b border-gray-50 ${
                    LOG_ROW_COLORS[msg.severity]
                  }`}
                >
                  <span className={`shrink-0 ${SEVERITY_COLORS[msg.severity]}`}>
                    {SEVERITY_ICONS[msg.severity]}
                  </span>
                  <span className="flex-1 text-gray-700">{msg.text}</span>
                  <span className="shrink-0 text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
