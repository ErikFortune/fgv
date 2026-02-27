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
 * Procedure edit view.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EyeIcon, ChevronRightIcon, PencilIcon } from '@heroicons/react/24/outline';

import { EditField, EditSection, TextInput, TagsInput } from '@fgv/ts-app-shell';
import type { Entities, LibraryRuntime, Model, TaskId } from '@fgv/ts-chocolate';

import { EditingToolbar, NotesEditor, useEditingContext, useDatalistMatch } from '../editing';
import { useWorkspace } from '../workspace';

type EditedProcedure = LibraryRuntime.EditedProcedure;

export interface IProcedureEditViewProps {
  readonly wrapper: EditedProcedure;
  readonly availableTasks: ReadonlyArray<LibraryRuntime.ITask>;
  readonly onSave: (wrapper: EditedProcedure) => void;
  readonly onSaveAs?: (wrapper: EditedProcedure) => void;
  readonly onCancel: () => void;
  readonly readOnly?: boolean;
  readonly onPreview?: () => void;
  readonly onMutate?: () => void;
  readonly onEditStepTask?: (stepOrder: number, mode: 'inline' | 'library', seed: string) => void;
  readonly onEditStepParams?: (stepOrder: number) => void;
}

function getTaskDisplayValue(
  task: Entities.Procedures.IProcedureStepEntity['task'],
  availableTasks: ReadonlyArray<LibraryRuntime.ITask>
): string {
  if ('taskId' in task) {
    const matchedTask = availableTasks.find((t) => t.id === task.taskId);
    return matchedTask ? matchedTask.name : task.taskId;
  }
  return task.task.name;
}

function buildTaskRef(
  taskId: TaskId,
  params: Record<string, unknown>
): Entities.Procedures.IProcedureStepEntity['task'] {
  return {
    taskId,
    params
  };
}

export function ProcedureEditView(props: IProcedureEditViewProps): React.ReactElement {
  const {
    wrapper,
    availableTasks,
    onSave,
    onSaveAs,
    onCancel,
    readOnly,
    onPreview,
    onMutate,
    onEditStepTask,
    onEditStepParams
  } = props;

  const {
    data: { logger }
  } = useWorkspace();
  const ctx = useEditingContext<EditedProcedure>({ wrapper, onSave, onSaveAs, onCancel, readOnly, logger });
  const entity = wrapper.current;

  const [newStepText, setNewStepText] = useState('');
  const [stepInputDraft, setStepInputDraft] = useState<Record<number, string>>({});
  const [unresolvedByStep, setUnresolvedByStep] = useState<Record<number, string>>({});

  const taskSuggestions = useMemo(() => {
    return availableTasks.map((task) => ({ id: task.id, name: task.name }));
  }, [availableTasks]);

  const { findExactMatch: findTaskExactMatch, resolveOnBlur: resolveTaskOnBlur } =
    useDatalistMatch(taskSuggestions);

  const notify = useCallback((): void => {
    ctx.notifyMutation();
    onMutate?.();
  }, [ctx, onMutate]);

  const handleNameChange = useCallback(
    (value: string) => {
      wrapper.setName(value);
      notify();
    },
    [wrapper, notify]
  );

  const handleDescriptionChange = useCallback(
    (value: string | undefined) => {
      wrapper.setDescription(value?.trim() ? value : undefined);
      notify();
    },
    [wrapper, notify]
  );

  const handleTagsChange = useCallback(
    (value: ReadonlyArray<string> | undefined) => {
      wrapper.setTags(value);
      notify();
    },
    [wrapper, notify]
  );

  const handleNotesChange = useCallback(
    (value: ReadonlyArray<Model.ICategorizedNote> | undefined) => {
      wrapper.setNotes(value);
      notify();
    },
    [wrapper, notify]
  );

  const commitStepTaskInput = useCallback(
    (step: Entities.Procedures.IProcedureStepEntity, input: string) => {
      const match = resolveTaskOnBlur(input);
      if (match) {
        const existingParams = 'taskId' in step.task ? step.task.params : step.task.params;
        wrapper.updateStep(step.order, {
          task: buildTaskRef(match.id, { ...existingParams })
        });
        setUnresolvedByStep((prev) => {
          const next = { ...prev };
          delete next[step.order];
          return next;
        });
        notify();
      } else if (input.trim().length > 0) {
        setUnresolvedByStep((prev) => ({ ...prev, [step.order]: input.trim() }));
      }
    },
    [resolveTaskOnBlur, notify, wrapper]
  );

  const handleAddStep = useCallback(() => {
    const seed = newStepText.trim();
    const nextOrder = entity.steps.length + 1;
    const exactMatch = findTaskExactMatch(seed);
    if (exactMatch) {
      // For library task exact match, go directly to parameter selector
      onEditStepParams?.(nextOrder);
      wrapper.addStep({
        task: { taskId: exactMatch.id, params: {} }
      });
      setNewStepText('');
      return;
    }

    // Try partial match resolution (single partial match auto-selects)
    const blurMatch = resolveTaskOnBlur(seed);
    if (blurMatch) {
      // If exactly one partial match, auto-select it and go to parameter selector
      onEditStepParams?.(nextOrder);
      wrapper.addStep({
        task: { taskId: blurMatch.id, params: {} }
      });
      setNewStepText('');
      return;
    }

    // Default to inline task for no matches or multiple matches, route to editor
    onEditStepTask?.(nextOrder, 'inline', seed || `Step ${nextOrder}`);
    setNewStepText('');
  }, [
    entity.steps.length,
    findTaskExactMatch,
    resolveTaskOnBlur,
    newStepText,
    onEditStepTask,
    onEditStepParams,
    wrapper
  ]);

  const handleRemoveStep = useCallback(
    (order: number): void => {
      wrapper.removeStep(order);
      setStepInputDraft((prev) => {
        const next = { ...prev };
        delete next[order];
        return next;
      });
      setUnresolvedByStep((prev) => {
        const next = { ...prev };
        delete next[order];
        return next;
      });
      notify();
    },
    [notify, wrapper]
  );

  useEffect(() => {
    onMutate?.();
  }, [entity, onMutate]);

  useEffect(() => {
    // Clear unresolved state for steps that now have valid tasks
    setUnresolvedByStep((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const order of Object.keys(next)) {
        const orderNum = Number(order);
        const step = entity.steps.find((s) => s.order === orderNum);
        if (step) {
          // Check if step has a valid task (either inline or library reference)
          const taskInvocation = step.task;
          const hasValidTask =
            'taskId' in taskInvocation ? availableTasks.some((t) => t.id === taskInvocation.taskId) : true; // Inline tasks are always valid
          if (hasValidTask) {
            delete next[orderNum];
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [entity.steps, availableTasks]);

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      <EditingToolbar
        context={ctx}
        extraButtons={
          onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors text-gray-600 hover:text-choco-primary hover:bg-gray-100"
              title="Open procedure preview pane"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          ) : undefined
        }
      />

      <EditSection title="Identity">
        <EditField label="Base ID">
          <span className="text-sm font-mono text-gray-500">{entity.baseId}</span>
        </EditField>
        <EditField label="Name">
          <TextInput value={entity.name} onChange={handleNameChange} placeholder="e.g. Tempering Curve" />
        </EditField>
        <EditField label="Description">
          <TextInput
            value={entity.description ?? ''}
            onChange={handleDescriptionChange}
            placeholder="Optional procedure description"
          />
        </EditField>
      </EditSection>

      <EditSection title="Steps">
        <div className="space-y-2">
          {entity.steps.map((step) => {
            const value = stepInputDraft[step.order] ?? getTaskDisplayValue(step.task, availableTasks);
            const unresolved = unresolvedByStep[step.order];
            return (
              <div key={step.order} className="rounded border border-gray-200 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono w-6 text-right">{step.order}</span>
                  <input
                    type="text"
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                    value={value}
                    list="procedure-task-suggestions"
                    onChange={(e): void => {
                      const nextValue = e.target.value;
                      setStepInputDraft((prev) => ({ ...prev, [step.order]: nextValue }));
                    }}
                    onBlur={(): void => commitStepTaskInput(step, value)}
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter') {
                        commitStepTaskInput(step, value);
                      } else if (e.key === 'Tab') {
                        commitStepTaskInput(step, value);
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  {(() => {
                    const taskInvocation = step.task;
                    if ('taskId' in taskInvocation) {
                      return (
                        <button
                          type="button"
                          onClick={(): void => onEditStepTask?.(step.order, 'library', taskInvocation.taskId)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="View library task"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={(): void => onEditStepTask?.(step.order, 'inline', taskInvocation.task.name)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit inline task"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={(): void => onEditStepParams?.(step.order)}
                    className="p-1 text-gray-400 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
                    title="Edit parameters"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(): void => handleRemoveStep(step.order)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>

                {unresolved && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-amber-700">No library task match for "{unresolved}".</span>
                    <button
                      type="button"
                      onClick={(): void => onEditStepTask?.(step.order, 'inline', unresolved)}
                      className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Add Inline Task
                    </button>
                    <button
                      type="button"
                      onClick={(): void => onEditStepTask?.(step.order, 'library', unresolved)}
                      className="px-2 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                    >
                      Add Library Task
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
              value={newStepText}
              list="procedure-task-suggestions"
              onChange={(e): void => setNewStepText(e.target.value)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') {
                  handleAddStep();
                } else if (e.key === 'Tab' && newStepText.trim()) {
                  e.preventDefault();
                  handleAddStep();
                  e.currentTarget.blur();
                }
              }}
              placeholder="Type task name or id to add a step"
            />
            <button
              type="button"
              onClick={handleAddStep}
              className="px-2.5 py-1 text-xs font-medium rounded bg-choco-primary text-white hover:bg-choco-primary/90"
            >
              Add Step
            </button>
          </div>

          <datalist id="procedure-task-suggestions">
            {taskSuggestions.map((task) => (
              <option key={task.id} value={task.name}>
                {task.id}
              </option>
            ))}
          </datalist>
        </div>
      </EditSection>

      <EditSection title="Tags">
        <EditField label="Tags">
          <TagsInput value={entity.tags} onChange={handleTagsChange} placeholder="e.g. ganache, shell" />
        </EditField>
      </EditSection>

      <NotesEditor value={entity.notes} onChange={handleNotesChange} />
    </div>
  );
}
