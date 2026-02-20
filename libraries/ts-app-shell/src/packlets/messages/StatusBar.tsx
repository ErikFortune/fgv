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

import React, { useCallback, useMemo, useState } from 'react';

import { Logging, type MessageLogLevel } from '@fgv/ts-utils';
import { FunnelIcon, DocumentDuplicateIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

import { IMessage, MessageSeverity } from './model';

// ============================================================================
// Severity display config
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
// Level filter config
// ============================================================================

/**
 * Maps MessageSeverity to MessageLogLevel for shouldLog filtering.
 * 'success' is treated as 'info' since it doesn't exist in the log level hierarchy.
 */
function severityToLogLevel(severity: MessageSeverity): MessageLogLevel {
  return severity === 'success' ? 'info' : severity;
}

/**
 * Filter choices exposed in the UI, mapping labels to ReporterLogLevel values.
 */
const FILTER_LEVELS: ReadonlyArray<{ readonly label: string; readonly level: Logging.ReporterLogLevel }> = [
  { label: 'All', level: 'all' },
  { label: 'Info+', level: 'info' },
  { label: 'Warn+', level: 'warning' },
  { label: 'Error', level: 'error' }
] as const;

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
 * Expanded: filterable, searchable, copyable log of all messages.
 * @public
 */
export function StatusBar(props: IStatusBarProps): React.ReactElement {
  const { messages, onClear } = props;
  const [expanded, setExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterLevel, setFilterLevel] = useState<Logging.ReporterLogLevel>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<MessageSeverity, number> = { info: 0, success: 0, warning: 0, error: 0 };
    for (const msg of messages) {
      result[msg.severity]++;
    }
    return result;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const passesLevel = Logging.shouldLog(severityToLogLevel(msg.severity), filterLevel);
      const passesSearch = searchTerm === '' || msg.text.toLowerCase().includes(searchTerm.toLowerCase());
      return passesLevel && passesSearch;
    });
  }, [messages, filterLevel, searchTerm]);

  const isFiltered = filteredMessages.length !== messages.length;

  const formatTime = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  }, []);

  const copyToClipboard = useCallback((text: string, id: string): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopySuccessId(id);
        setTimeout(() => setCopySuccessId(null), 2000);
      })
      .catch(() => undefined);
  }, []);

  const copyAllFiltered = useCallback((): void => {
    const text = filteredMessages
      .map((msg) => `[${msg.severity.toUpperCase()}] ${formatTime(msg.timestamp)} - ${msg.text}`)
      .join('\n');
    copyToClipboard(text, '__all__');
  }, [filteredMessages, formatTime, copyToClipboard]);

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
          {/* Header toolbar */}
          <div className="flex items-center justify-between px-4 py-1 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">
              {isFiltered
                ? `${filteredMessages.length} of ${messages.length} messages`
                : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(): void => setShowFilters(!showFilters)}
                className={`p-1 rounded hover:bg-gray-200 ${showFilters ? 'bg-gray-200' : ''}`}
                title="Filter messages"
              >
                <FunnelIcon className="h-3.5 w-3.5 text-gray-500" />
              </button>
              <button
                onClick={copyAllFiltered}
                className={`p-1 rounded transition-colors ${
                  copySuccessId === '__all__' ? 'bg-green-100' : 'hover:bg-gray-200'
                }`}
                title={copySuccessId === '__all__' ? 'Copied!' : 'Copy filtered messages'}
              >
                {copySuccessId === '__all__' ? (
                  <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <DocumentDuplicateIcon className="h-3.5 w-3.5 text-gray-500" />
                )}
              </button>
              <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600 ml-1">
                Clear
              </button>
            </div>
          </div>

          {/* Filter toolbar */}
          {showFilters && (
            <div className="px-4 py-1.5 bg-gray-100 border-b border-gray-100 flex items-center gap-3">
              {/* Level filter buttons */}
              <div className="flex items-center gap-1">
                {FILTER_LEVELS.map(({ label, level }) => (
                  <button
                    key={level}
                    onClick={(): void => setFilterLevel(level)}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      filterLevel === level
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e): void => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-6 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm.length > 0 && (
                  <button
                    onClick={(): void => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    aria-label="Clear search"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Message list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                {isFiltered ? 'No messages match the current filter' : 'No messages'}
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group flex items-start gap-2 px-4 py-1.5 text-xs border-b border-gray-50 ${
                    LOG_ROW_COLORS[msg.severity]
                  }`}
                >
                  <span className={`shrink-0 ${SEVERITY_COLORS[msg.severity]}`}>
                    {SEVERITY_ICONS[msg.severity]}
                  </span>
                  <span className="flex-1 text-gray-700">{msg.text}</span>
                  <button
                    onClick={(): void => copyToClipboard(msg.text, msg.id)}
                    className={`shrink-0 p-0.5 rounded transition-colors ${
                      copySuccessId === msg.id
                        ? 'opacity-100 bg-green-100'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200'
                    }`}
                    title={copySuccessId === msg.id ? 'Copied!' : 'Copy message'}
                  >
                    {copySuccessId === msg.id ? (
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    ) : (
                      <DocumentDuplicateIcon className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                  <span className="shrink-0 text-gray-400">{formatTime(msg.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
