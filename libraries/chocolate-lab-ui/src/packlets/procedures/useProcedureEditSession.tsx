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
 * Reusable hook for procedure editing orchestration.
 *
 * Encapsulates nested task editing, step parameter editing, and the cascade
 * entries they produce. Used by the Procedures tab, Decoration tab, and any
 * future context that needs to edit a procedure in a cascade.
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';

import type { ICascadeColumn } from '@fgv/ts-app-shell';
import type { BaseTaskId, CollectionId, IWorkspace, ProcedureId, TaskId } from '@fgv/ts-chocolate';
import { Entities, LibraryRuntime } from '@fgv/ts-chocolate';

import type { ICascadeEntry } from '../navigation';
import { TaskDetail, TaskEditView, TaskPreviewPanel } from '../tasks';
import { useWorkspace, useReactiveWorkspace } from '../workspace';
import { StepParameterEditor } from './StepParameterEditor';

// ============================================================================
// Types
// ============================================================================

/**
 * Internal state for a nested task editing session.
 */
interface INestedTaskSession {
  readonly mode: 'inline' | 'library';
  readonly stepOrder: number;
  readonly taskEntityId: string;
  readonly wrapper: LibraryRuntime.EditedTask;
  /** Cascade entries that existed before the task entry was pushed. Restored on save/cancel. */
  readonly parentStack: ReadonlyArray<ICascadeEntry>;
}

/**
 * Internal state for a step parameter editing session.
 */
interface IStepParamsSession {
  readonly procedureId: string;
  readonly stepOrder: number;
  /** Cascade entries that existed before the step-params entry was pushed. Restored on save/cancel. */
  readonly parentStack: ReadonlyArray<ICascadeEntry>;
}

/**
 * Options for the useProcedureEditSession hook.
 * @public
 */
export interface IProcedureEditSessionOptions {
  /** Ref to the procedure being edited (id + wrapper). */
  readonly procedureRef: React.RefObject<{ id: string; wrapper: LibraryRuntime.EditedProcedure } | undefined>;
  /** Available library tasks for the task selector. */
  readonly availableTasks: ReadonlyArray<LibraryRuntime.ITask>;
  /** Current cascade stack. */
  readonly cascadeStack: ReadonlyArray<ICascadeEntry>;
  /** Replace the entire cascade stack. */
  readonly squashCascade: (entries: ReadonlyArray<ICascadeEntry>) => void;
  /** Slugify function for generating IDs from names. */
  readonly slugify: (name: string) => string;
  /** Called when the session modifies the procedure (for triggering re-renders). */
  readonly onMutate?: () => void;
}

/**
 * Result of the useProcedureEditSession hook.
 * @public
 */
export interface IProcedureEditSessionResult {
  /** Wire into ProcedureEditView.onEditStepTask */
  readonly onEditStepTask: (stepOrder: number, mode: 'inline' | 'library', seed: string) => void;
  /** Wire into ProcedureEditView.onEditStepParams */
  readonly onEditStepParams: (stepOrder: number) => void;
  /**
   * Try to render a cascade entry managed by this session.
   * Returns a cascade column if the entry is a task or step-params entry
   * that this session handles. Returns undefined otherwise, so the caller
   * can fall through to other rendering logic.
   */
  readonly renderCascadeEntry: (entry: ICascadeEntry, index: number) => ICascadeColumn | undefined;
  /** Reset all session state. Call when procedure editing ends (save or cancel). */
  readonly cleanup: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function findMutableTaskCollectionId(workspace: IWorkspace): CollectionId | undefined {
  for (const [id, col] of workspace.data.entities.tasks.collections.entries()) {
    if (col.isMutable) {
      return id as CollectionId;
    }
  }
  return undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that encapsulates the full procedure editing orchestration:
 * nested task editing, step parameter editing, and the cascade entries
 * they produce.
 *
 * @param options - Configuration for the editing session
 * @returns Callbacks and rendering helpers for the procedure editing cascade
 * @public
 */
export function useProcedureEditSession(options: IProcedureEditSessionOptions): IProcedureEditSessionResult {
  const { procedureRef, availableTasks, cascadeStack, squashCascade, slugify, onMutate } = options;
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const [nestedTaskSession, setNestedTaskSession] = useState<INestedTaskSession | undefined>(undefined);
  const [stepParamsSession, setStepParamsSession] = useState<IStepParamsSession | undefined>(undefined);

  const mutableTaskCollectionId = useMemo(() => findMutableTaskCollectionId(workspace), [workspace]);

  const makeProcedureEditEntry = useCallback(
    (procId: string): ICascadeEntry => ({
      entityType: 'procedure',
      entityId: procId,
      mode: 'edit',
      entity: workspace.data.procedures.get(procId as ProcedureId).orDefault()
    }),
    [workspace]
  );

  // --------------------------------------------------------------------------
  // Step Task Editor
  // --------------------------------------------------------------------------

  const onEditStepTask = useCallback(
    (stepOrder: number, mode: 'inline' | 'library', seed: string): void => {
      const procId = procedureRef.current?.id;
      const procWrapper = procedureRef.current?.wrapper;
      if (!procId || !procWrapper) {
        return;
      }

      const currentStep = procWrapper.current.steps.find((s) => s.order === stepOrder);
      let wrapperResult: ReturnType<typeof LibraryRuntime.EditedTask.create>;

      if (currentStep && 'taskId' in currentStep.task) {
        const taskResult = workspace.data.tasks.get(currentStep.task.taskId);
        if (taskResult.isFailure()) {
          workspace.data.logger.error(
            `Failed to load library task ${currentStep.task.taskId}: ${taskResult.message}`
          );
          return;
        }
        wrapperResult = LibraryRuntime.EditedTask.create(taskResult.value.entity);
      } else if (currentStep && 'task' in currentStep.task) {
        wrapperResult = LibraryRuntime.EditedTask.create(currentStep.task.task);
      } else if (mode === 'library') {
        const taskResult = workspace.data.tasks.get(seed as TaskId);
        if (taskResult.isFailure()) {
          workspace.data.logger.error(`Failed to load library task ${seed}: ${taskResult.message}`);
          return;
        }
        wrapperResult = LibraryRuntime.EditedTask.create(taskResult.value.entity);
        procWrapper.addStep({
          task: { taskId: seed as TaskId, params: {} }
        });
      } else {
        const baseId = slugify(seed || `step-${stepOrder}`) as BaseTaskId;
        const rawTask = Entities.Tasks.createBlankRawTaskEntity(baseId, seed || `Step ${stepOrder}`);
        wrapperResult = LibraryRuntime.EditedTask.create(rawTask);
      }

      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create task wrapper: ${wrapperResult.message}`);
        return;
      }

      const taskEntityId = `${procId}::__step_${stepOrder}_${mode}`;
      const baseStack = cascadeStack.filter((e) => e.mode !== 'preview' && e.entityType !== 'task');
      const ensuredProcedureEdit = baseStack.some(
        (e) => e.entityType === 'procedure' && e.entityId === procId && e.mode === 'edit'
      )
        ? baseStack
        : [makeProcedureEditEntry(procId), ...baseStack];

      setNestedTaskSession({
        mode,
        stepOrder,
        taskEntityId,
        wrapper: wrapperResult.value,
        parentStack: ensuredProcedureEdit
      });

      squashCascade([...ensuredProcedureEdit, { entityType: 'task', entityId: taskEntityId, mode: 'edit' }]);
    },
    [procedureRef, cascadeStack, squashCascade, slugify, workspace, makeProcedureEditEntry]
  );

  // --------------------------------------------------------------------------
  // Nested Task Save / Cancel / Preview / Convert
  // --------------------------------------------------------------------------

  const handleNestedTaskCancel = useCallback((): void => {
    const parentStack = nestedTaskSession?.parentStack;
    setNestedTaskSession(undefined);
    if (parentStack) {
      squashCascade(parentStack);
    } else {
      const procId = procedureRef.current?.id;
      if (procId) {
        squashCascade([makeProcedureEditEntry(procId)]);
      }
    }
  }, [nestedTaskSession, procedureRef, squashCascade, makeProcedureEditEntry]);

  const handleNestedTaskSave = useCallback(
    async (wrapper: LibraryRuntime.EditedTask): Promise<void> => {
      const session = nestedTaskSession;
      const procWrapper = procedureRef.current?.wrapper;
      const procId = procedureRef.current?.id;
      if (!session || !procWrapper || !procId) {
        return;
      }

      const currentStep = procWrapper.current.steps.find((s) => s.order === session.stepOrder);
      const existingParams = currentStep
        ? 'taskId' in currentStep.task
          ? currentStep.task.params
          : currentStep.task.params
        : {};

      if (session.mode === 'inline') {
        if (currentStep) {
          procWrapper.updateStep(session.stepOrder, {
            task: { task: wrapper.current, params: { ...existingParams } }
          });
        } else {
          procWrapper.addStep({
            task: { task: wrapper.current, params: {} }
          });
        }
      } else {
        if (!mutableTaskCollectionId) {
          workspace.data.logger.error('Cannot save nested library task: no mutable task collection');
          return;
        }

        const baseId = wrapper.current.baseId as BaseTaskId;
        const compositeTaskId = `${mutableTaskCollectionId}.${baseId}` as TaskId;

        const persistedResult = workspace.data.entities.getPersistedTasksCollection(mutableTaskCollectionId);
        if (persistedResult.isFailure()) {
          workspace.data.logger.error(`Failed to get persisted task collection: ${persistedResult.message}`);
          return;
        }

        const upsertResult = await persistedResult.value.upsertItem(baseId, wrapper.current);
        if (upsertResult.isFailure()) {
          workspace.data.logger.error(`Failed to save task: ${upsertResult.message}`);
          return;
        }

        if (currentStep) {
          procWrapper.updateStep(session.stepOrder, {
            task: { taskId: compositeTaskId, params: { ...existingParams } }
          });
        } else {
          procWrapper.addStep({
            task: { taskId: compositeTaskId, params: {} }
          });
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      onMutate?.();
      const parentStack = session.parentStack;
      setNestedTaskSession(undefined);
      squashCascade(parentStack);
    },
    [
      nestedTaskSession,
      procedureRef,
      mutableTaskCollectionId,
      workspace,
      reactiveWorkspace,
      squashCascade,
      onMutate
    ]
  );

  const handleNestedTaskPreview = useCallback(
    (entityId: string): void => {
      const withoutPreview = cascadeStack.filter(
        (e) => !(e.entityType === 'task' && e.entityId === entityId && e.mode === 'preview')
      );
      squashCascade([...withoutPreview, { entityType: 'task', entityId, mode: 'preview' }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCloseNestedTaskPreview = useCallback(
    (entityId: string): void => {
      squashCascade(
        cascadeStack.filter(
          (e) => !(e.entityType === 'task' && e.entityId === entityId && e.mode === 'preview')
        )
      );
    },
    [cascadeStack, squashCascade]
  );

  const handleNestedTaskConvertMode = useCallback(
    async (targetMode: 'inline' | 'library'): Promise<void> => {
      const session = nestedTaskSession;
      const procWrapper = procedureRef.current?.wrapper;
      const procId = procedureRef.current?.id;
      if (!session || !procWrapper || !procId) {
        return;
      }

      const currentStep = procWrapper.current.steps.find((s) => s.order === session.stepOrder);
      const existingParams = currentStep
        ? 'taskId' in currentStep.task
          ? currentStep.task.params
          : currentStep.task.params
        : {};

      if (targetMode === 'library') {
        if (!mutableTaskCollectionId) {
          workspace.data.logger.error('Cannot convert to library task: no mutable task collection');
          return;
        }

        const baseId = session.wrapper.current.baseId as BaseTaskId;
        const compositeTaskId = `${mutableTaskCollectionId}.${baseId}` as TaskId;

        const persistedResult = workspace.data.entities.getPersistedTasksCollection(mutableTaskCollectionId);
        if (persistedResult.isFailure()) {
          workspace.data.logger.error(`Failed to get persisted task collection: ${persistedResult.message}`);
          return;
        }

        const upsertResult = await persistedResult.value.upsertItem(baseId, session.wrapper.current);
        if (upsertResult.isFailure()) {
          workspace.data.logger.error(`Failed to save task: ${upsertResult.message}`);
          return;
        }

        procWrapper.updateStep(session.stepOrder, {
          task: { taskId: compositeTaskId, params: { ...existingParams } }
        });

        setNestedTaskSession({ ...session, mode: 'library' });
      } else {
        procWrapper.updateStep(session.stepOrder, {
          task: { task: session.wrapper.current, params: { ...existingParams } }
        });

        setNestedTaskSession({ ...session, mode: 'inline' });
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      onMutate?.();
    },
    [nestedTaskSession, procedureRef, mutableTaskCollectionId, workspace, reactiveWorkspace, onMutate]
  );

  // --------------------------------------------------------------------------
  // Step Parameter Editor
  // --------------------------------------------------------------------------

  const onEditStepParams = useCallback(
    (stepOrder: number): void => {
      const procId = procedureRef.current?.id;
      if (!procId) return;

      const withoutPreviewOrStepParams = cascadeStack.filter(
        (e) => e.mode !== 'preview' && e.entityType !== 'step-params'
      );
      setStepParamsSession({ procedureId: procId, stepOrder, parentStack: withoutPreviewOrStepParams });
      squashCascade([
        ...withoutPreviewOrStepParams,
        { entityType: 'step-params', entityId: `${procId}:${stepOrder}`, mode: 'edit' }
      ]);
    },
    [procedureRef, cascadeStack, squashCascade]
  );

  const handleSaveStepParams = useCallback(
    (params: Record<string, unknown>): void => {
      const session = stepParamsSession;
      const procWrapper = procedureRef.current?.wrapper;
      if (!session || !procWrapper) {
        return;
      }

      const step = procWrapper.current.steps.find((s) => s.order === session.stepOrder);
      if (!step) {
        return;
      }

      procWrapper.updateStep(session.stepOrder, {
        task: 'taskId' in step.task ? { taskId: step.task.taskId, params } : { task: step.task.task, params }
      });

      const parentStack = session.parentStack;
      setStepParamsSession(undefined);
      onMutate?.();
      squashCascade(parentStack);
    },
    [stepParamsSession, procedureRef, squashCascade, onMutate]
  );

  const handleCancelStepParams = useCallback((): void => {
    if (!stepParamsSession) {
      return;
    }
    const parentStack = stepParamsSession.parentStack;
    setStepParamsSession(undefined);
    squashCascade(parentStack);
  }, [stepParamsSession, squashCascade]);

  // --------------------------------------------------------------------------
  // Cascade Entry Rendering
  // --------------------------------------------------------------------------

  const renderCascadeEntry = useCallback(
    (entry: ICascadeEntry, index: number): ICascadeColumn | undefined => {
      // Step parameter editor
      if (entry.entityType === 'step-params') {
        const session = stepParamsSession;
        if (!session) {
          return {
            key: entry.entityId,
            label: 'Step Parameters',
            content: <div className="p-4 text-red-500">No step parameter session</div>
          };
        }

        const procWrapper = procedureRef.current?.wrapper;
        if (!procWrapper) {
          return {
            key: entry.entityId,
            label: 'Step Parameters',
            content: <div className="p-4 text-red-500">No procedure wrapper</div>
          };
        }

        const step = procWrapper.current.steps.find((s) => s.order === session.stepOrder);
        if (!step) {
          return {
            key: entry.entityId,
            label: 'Step Parameters',
            content: <div className="p-4 text-red-500">Step not found</div>
          };
        }

        let template: string;
        let taskName: string;
        let params: Record<string, unknown>;
        let defaults: Readonly<Record<string, unknown>> | undefined;

        const taskInvocation = step.task;
        if ('taskId' in taskInvocation) {
          const task = availableTasks.find((t) => t.id === taskInvocation.taskId);
          if (!task) {
            return {
              key: entry.entityId,
              label: 'Step Parameters',
              content: <div className="p-4 text-red-500">Task not found</div>
            };
          }
          template = task.template;
          taskName = task.name;
          params = taskInvocation.params;
          defaults = task.defaults;
        } else {
          const inlineTask = taskInvocation.task;
          template = inlineTask.template;
          taskName = inlineTask.name;
          params = taskInvocation.params;
          defaults = inlineTask.defaults;
        }

        return {
          key: entry.entityId,
          label: `Step ${session.stepOrder} Parameters`,
          content: (
            <StepParameterEditor
              template={template}
              taskName={taskName}
              stepOrder={session.stepOrder}
              params={params}
              defaults={defaults}
              onSave={handleSaveStepParams}
              onCancel={handleCancelStepParams}
            />
          )
        };
      }

      // Task entries (nested editing or browse)
      if (entry.entityType === 'task') {
        // Active nested editing session
        if (nestedTaskSession && entry.entityId === nestedTaskSession.taskEntityId) {
          if (entry.mode === 'preview') {
            return {
              key: `${entry.entityId}:preview`,
              label: `${nestedTaskSession.wrapper.current.name} (preview)`,
              content: (
                <TaskPreviewPanel
                  template={nestedTaskSession.wrapper.current.template}
                  defaults={nestedTaskSession.wrapper.current.defaults}
                  taskName={nestedTaskSession.wrapper.current.name}
                  onClose={(): void => handleCloseNestedTaskPreview(entry.entityId)}
                />
              )
            };
          }

          return {
            key: `${entry.entityId}:edit`,
            label: `${nestedTaskSession.wrapper.current.name} (editing)`,
            content: (
              <TaskEditView
                wrapper={nestedTaskSession.wrapper}
                onSave={handleNestedTaskSave}
                onCancel={handleNestedTaskCancel}
                onPreview={(): void => handleNestedTaskPreview(entry.entityId)}
                onMutate={onMutate}
                isStepContext={true}
                currentMode={nestedTaskSession.mode}
                onConvertMode={handleNestedTaskConvertMode}
              />
            )
          };
        }

        // Browse-only task (clicked from procedure detail)
        const taskResult = workspace.data.tasks.get(entry.entityId as TaskId);
        if (taskResult.isFailure()) {
          // Check for inline task from parent procedure
          const parentProcEntry = cascadeStack
            .slice(0, index)
            .reverse()
            .find((e) => e.entityType === 'procedure');
          if (parentProcEntry) {
            const proc = workspace.data.procedures.get(parentProcEntry.entityId as ProcedureId);
            const steps = proc.isSuccess() ? proc.value.getSteps() : undefined;
            const inlineStep = steps?.isSuccess()
              ? steps.value.find((s) => s.isInline && s.resolvedTask.id === entry.entityId)
              : undefined;
            if (inlineStep) {
              return {
                key: entry.entityId,
                label: `${inlineStep.resolvedTask.name} (inline)`,
                content: <TaskDetail task={inlineStep.resolvedTask} />
              };
            }
          }
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load task: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: taskResult.value.name,
          content: <TaskDetail task={taskResult.value} />
        };
      }

      return undefined;
    },
    [
      stepParamsSession,
      nestedTaskSession,
      procedureRef,
      availableTasks,
      cascadeStack,
      workspace,
      handleSaveStepParams,
      handleCancelStepParams,
      handleNestedTaskSave,
      handleNestedTaskCancel,
      handleNestedTaskPreview,
      handleCloseNestedTaskPreview,
      handleNestedTaskConvertMode,
      onMutate
    ]
  );

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------

  const cleanup = useCallback((): void => {
    setNestedTaskSession(undefined);
    setStepParamsSession(undefined);
  }, []);

  return { onEditStepTask, onEditStepParams, renderCascadeEntry, cleanup };
}
