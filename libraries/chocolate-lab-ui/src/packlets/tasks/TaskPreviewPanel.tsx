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

/**
 * Standalone task template preview panel.
 * Can be used as a cascade column from browse, edit, or (future) inline task contexts.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the TaskPreviewPanel component.
 * @public
 */
export interface ITaskPreviewPanelProps {
  /** The Mustache template string to preview */
  readonly template: string;
  /** Optional default values for template placeholders */
  readonly defaults?: Readonly<Record<string, unknown>>;
  /** Optional pre-filled parameter values (e.g. from inline task invocations) */
  readonly initialParams?: Readonly<Record<string, string>>;
  /** Optional task name for the panel header */
  readonly taskName?: string;
  /** Called when the user clicks the close button */
  readonly onClose?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extracts Mustache variable names from a template string.
 * Handles simple variable patterns (not sections/partials).
 */
export function extractVariableNames(template: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const regex = /\{\{([#^/!>]?)([^}]+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    const prefix = match[1];
    const name = match[2].trim();
    // Skip section/partial/comment markers
    if (!prefix && name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

/**
 * Simple Mustache-like rendering for preview purposes.
 * Replaces variable placeholders with provided values, leaves unresolved vars as-is.
 */
export function renderPreview(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (__match, name: string) => {
    const trimmed = name.trim();
    return trimmed in params && params[trimmed] !== '' ? params[trimmed] : `{{${trimmed}}}`;
  });
}

// ============================================================================
// TaskPreviewPanel Component
// ============================================================================

/**
 * Standalone task template preview panel.
 *
 * Displays:
 * - Header with task name
 * - Variable input fields with default value hints
 * - Live-rendered template preview
 *
 * Decoupled from ITask and EditedTask — accepts raw template + defaults.
 *
 * @public
 */
export function TaskPreviewPanel(props: ITaskPreviewPanelProps): React.ReactElement {
  const { template, defaults, initialParams, taskName, onClose } = props;
  const variables = useMemo(() => extractVariableNames(template), [template]);
  const [params, setParams] = useState<Record<string, string>>(initialParams ? { ...initialParams } : {});

  const handleParamChange = useCallback((name: string, value: string) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Merge defaults with user-entered params for preview
  const mergedParams = useMemo(() => {
    const merged: Record<string, string> = {};
    if (defaults) {
      for (const [key, val] of Object.entries(defaults)) {
        merged[key] = String(val);
      }
    }
    for (const [key, val] of Object.entries(params)) {
      if (val !== '') {
        merged[key] = val;
      }
    }
    return merged;
  }, [defaults, params]);

  const rendered = useMemo(() => renderPreview(template, mergedParams), [template, mergedParams]);

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{taskName ?? 'Template Preview'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Live preview of the rendered template</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Close preview"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Variable inputs */}
      {variables.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Variables</h3>
          <div className="space-y-1.5">
            {variables.map((v) => {
              const defaultValue = defaults?.[v];
              return (
                <div key={v} className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-600 shrink-0 w-32 truncate" title={v}>
                    {v}
                  </span>
                  <input
                    type="text"
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={params[v] ?? ''}
                    onChange={(e): void => handleParamChange(v, e.target.value)}
                    placeholder={defaultValue !== undefined ? `default: ${String(defaultValue)}` : `{{${v}}}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Template source */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Template</h3>
        <div className="bg-gray-50 rounded-md p-2.5 text-sm text-gray-600 font-mono whitespace-pre-wrap border border-gray-200">
          {template || <span className="text-gray-400 italic">Empty template</span>}
        </div>
      </div>

      {/* Rendered preview */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Preview</h3>
        <div className="bg-white rounded-md p-2.5 text-sm text-gray-800 whitespace-pre-wrap border-2 border-choco-primary/20">
          {rendered || <span className="text-gray-400 italic">Empty template</span>}
        </div>
      </div>
    </div>
  );
}
