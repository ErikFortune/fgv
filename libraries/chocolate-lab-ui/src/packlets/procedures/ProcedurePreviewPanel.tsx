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
 * Procedure preview panel.
 * @packageDocumentation
 */

import React, { useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

import type { Entities, LibraryRuntime, TaskId } from '@fgv/ts-chocolate';

import { renderPreview } from '../tasks';

export interface IProcedurePreviewPanelProps {
  readonly procedure: LibraryRuntime.IProcedure;
  readonly draftEntity?: Entities.Procedures.IProcedureEntity;
  readonly availableTasks?: ReadonlyArray<LibraryRuntime.ITask>;
  readonly onClose?: () => void;
}

function formatStepTiming(step: Entities.Procedures.IProcedureStepEntity): string | undefined {
  const parts: string[] = [];
  if (step.activeTime !== undefined) {
    parts.push(`${step.activeTime}min active`);
  }
  if (step.waitTime !== undefined) {
    parts.push(`${step.waitTime}min wait`);
  }
  if (step.holdTime !== undefined) {
    parts.push(`${step.holdTime}min hold`);
  }
  if (step.temperature !== undefined) {
    parts.push(`${step.temperature}°C`);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function ProcedurePreviewPanel(props: IProcedurePreviewPanelProps): React.ReactElement {
  const { procedure, draftEntity, availableTasks, onClose } = props;

  const entity = draftEntity ?? procedure.entity;

  const tasksById = useMemo(() => {
    const map = new Map<TaskId, LibraryRuntime.ITask>();
    const stepsResult = procedure.getSteps();
    const tasks =
      availableTasks ?? (stepsResult.isSuccess() ? stepsResult.value.map((s) => s.resolvedTask) : []);
    for (const task of tasks) {
      map.set(task.id, task);
    }
    return map;
  }, [availableTasks, procedure]);

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{entity.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Procedure Preview</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Close preview"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {entity.description && <p className="text-sm text-gray-600 mb-4">{entity.description}</p>}

      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Steps ({entity.steps.length})
        </h3>
        <div className="space-y-2">
          {entity.steps.map((step) => {
            const timingText = formatStepTiming(step);

            let rendered = '';
            if ('taskId' in step.task) {
              const task = tasksById.get(step.task.taskId as TaskId);
              if (task) {
                const mergedParams: Record<string, string> = {};
                if (task.defaults) {
                  for (const [key, value] of Object.entries(task.defaults)) {
                    mergedParams[key] = String(value);
                  }
                }
                for (const [key, value] of Object.entries(step.task.params)) {
                  mergedParams[key] = String(value);
                }
                rendered = renderPreview(task.template, mergedParams);
              } else {
                rendered = `[Task: ${step.task.taskId}]`;
              }
            } else {
              const mergedParams: Record<string, string> = {};
              if (step.task.task.defaults) {
                for (const [key, value] of Object.entries(step.task.task.defaults)) {
                  mergedParams[key] = String(value);
                }
              }
              for (const [key, value] of Object.entries(step.task.params)) {
                mergedParams[key] = String(value);
              }
              rendered = renderPreview(step.task.task.template, mergedParams);
            }

            return (
              <div key={step.order} className="rounded border border-gray-200 bg-white p-2.5">
                <div className="text-xs text-gray-500 mb-1">Step {step.order}</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{rendered}</div>
                {timingText && <div className="text-xs text-gray-400 mt-1">{timingText}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
