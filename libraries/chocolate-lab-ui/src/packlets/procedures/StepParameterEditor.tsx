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
 * Step parameter editor flyout for editing task parameters in procedure steps.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

import { extractVariableNames, renderPreview } from '../tasks';

/**
 * Props for the StepParameterEditor component.
 * @public
 */
export interface IStepParameterEditorProps {
  /** The task template string */
  readonly template: string;
  /** Task name for display */
  readonly taskName: string;
  /** Step order number */
  readonly stepOrder: number;
  /** Current parameter values */
  readonly params: Readonly<Record<string, unknown>>;
  /** Default values from the task definition */
  readonly defaults?: Readonly<Record<string, unknown>>;
  /** Called when the user saves the parameters */
  readonly onSave: (params: Record<string, unknown>) => void;
  /** Called when the user cancels editing */
  readonly onCancel: () => void;
}

/**
 * Flyout panel for editing task parameters in a procedure step.
 * Similar to TaskPreviewPanel but with save/cancel actions.
 *
 * @public
 */
export function StepParameterEditor(props: IStepParameterEditorProps): React.ReactElement {
  const { template, taskName, stepOrder, params: initialParams, defaults, onSave, onCancel } = props;

  const variables = useMemo(() => extractVariableNames(template), [template]);
  const [params, setParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, value] of Object.entries(initialParams)) {
      initial[key] = String(value);
    }
    return initial;
  });

  const handleParamChange = useCallback((name: string, value: string) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== '') {
        result[key] = value;
      }
    }
    onSave(result);
  }, [params, onSave]);

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">Step {stepOrder} Parameters</h2>
        <p className="text-sm text-gray-500 mt-0.5">{taskName}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Variable inputs */}
        {variables.length > 0 ? (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Parameters</h4>
            <div className="space-y-2">
              {variables.map((v) => {
                const defaultValue = defaults?.[v];
                return (
                  <div key={v}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{v}</label>
                    <input
                      type="text"
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                      value={params[v] ?? ''}
                      onChange={(e): void => handleParamChange(v, e.target.value)}
                      placeholder={
                        defaultValue !== undefined ? `default: ${String(defaultValue)}` : `{{${v}}}`
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-500 italic">This task has no parameters.</p>
          </div>
        )}

        {/* Template source */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Template</h4>
          <div className="bg-gray-50 rounded-md p-2.5 text-xs text-gray-600 font-mono whitespace-pre-wrap border border-gray-200">
            {template || <span className="text-gray-400 italic">Empty template</span>}
          </div>
        </div>

        {/* Rendered preview */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Preview</h4>
          <div className="bg-white rounded-md p-2.5 text-sm text-gray-800 whitespace-pre-wrap border-2 border-choco-primary/20">
            {rendered || <span className="text-gray-400 italic">Empty template</span>}
          </div>
        </div>
      </div>

      {/* Footer with actions */}
      <div className="p-4 border-t border-gray-200 flex gap-2 flex-shrink-0">
        <button
          onClick={handleSave}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded transition-colors"
        >
          <CheckIcon className="w-4 h-4" />
          Save Parameters
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
