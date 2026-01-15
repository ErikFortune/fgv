/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { TaskId } from '@fgv/ts-chocolate';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { KeyValueTableEditor, LoadingSpinner, type IKeyValueRow } from '../../../components/common';

export interface IDetailViewProps {
  taskId: TaskId;
  onBack: () => void;
}

function parsePrimitiveValue(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return '';
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && String(asNumber) === trimmed) {
    return asNumber;
  }
  return trimmed;
}

export function DetailView({ taskId, onBack }: IDetailViewProps): React.ReactElement {
  const { runtime, loadingState } = useChocolate();

  const [paramsRows, setParamsRows] = useState<IKeyValueRow[]>([]);
  const [rendered, setRendered] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const runtimeTaskResult = useMemo(() => {
    if (!runtime) {
      return null;
    }
    return runtime.getRuntimeTask(taskId);
  }, [runtime, taskId]);

  const runtimeTask = runtimeTaskResult?.isSuccess() ? runtimeTaskResult.value : null;

  useEffect(() => {
    if (!runtimeTask) {
      return;
    }

    const required = runtimeTask.requiredVariables;
    if (required.length === 0) {
      return;
    }

    setParamsRows((prev) => {
      const existingKeys = new Set(prev.map((r) => r.key.trim()).filter((k) => k.length > 0));
      const missing = required.filter((v) => !existingKeys.has(v));
      if (missing.length === 0) {
        return prev;
      }
      return [...prev, ...missing.map((v) => ({ key: v, value: '' }))];
    });
  }, [runtimeTask]);

  const handleRender = useCallback(() => {
    if (!runtimeTask) {
      return;
    }
    setRendered(null);
    setRenderError(null);

    let params: Record<string, unknown> = {};
    const obj: Record<string, unknown> = {};
    for (const row of paramsRows) {
      const key = row.key.trim();
      if (key.length === 0) {
        continue;
      }
      obj[key] = parsePrimitiveValue(row.value);
    }
    params = obj;

    const result = runtimeTask.validateAndRender(params);
    if (result.isFailure()) {
      setRenderError(result.message);
      return;
    }

    setRendered(result.value);
  }, [paramsRows, runtimeTask]);

  if (loadingState === 'loading' || !runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!runtimeTaskResult || runtimeTaskResult.isFailure() || !runtimeTask) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400 mb-4">Task not found</p>
        <button
          type="button"
          onClick={onBack}
          className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to browse
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{runtimeTask.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{taskId as string}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-2">
              Template
            </h3>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 font-mono text-gray-900 dark:text-gray-100">
              {runtimeTask.template}
            </pre>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-2">
                Required variables
              </h3>
              {runtimeTask.requiredVariables.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">None</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {runtimeTask.requiredVariables.map((v) => (
                    <span
                      key={v}
                      className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded px-2 py-1"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-2">
              Preview
            </h3>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Params</label>
            <KeyValueTableEditor
              rows={paramsRows}
              onChange={setParamsRows}
              keyPlaceholder="name"
              valuePlaceholder="value"
              emptyMessage="No params"
            />

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleRender}
                className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md"
              >
                Render
              </button>
              <button
                type="button"
                onClick={() => {
                  setParamsRows([]);
                  setRendered(null);
                  setRenderError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Clear
              </button>
            </div>

            {renderError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{renderError}</p>
              </div>
            )}

            {rendered && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-2">
                  Output
                </h4>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">{rendered}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
