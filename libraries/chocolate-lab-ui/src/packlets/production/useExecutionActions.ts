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
 * Hook for production execution actions (advance, skip, jump to step).
 * @packageDocumentation
 */

import { useCallback, useMemo } from 'react';
import type { Entities, LibraryRuntime, ProcedureId, SessionId, UserLibrary } from '@fgv/ts-chocolate';
import { UserLibrary as UserLibraryNs } from '@fgv/ts-chocolate';

import { renderPreview } from '../tasks';
import { useWorkspace, useReactiveWorkspace } from '../workspace';
import type { IActiveSessionEntry } from './ProductionOverlayPanel';
import type { IStepSummaryView } from './StepExecutionView';

/**
 * Return type for useExecutionActions hook.
 * @public
 */
export interface IExecutionActions {
  readonly startExecution: (sessionId: SessionId) => Promise<void>;
  readonly advanceStep: (sessionId: SessionId) => Promise<void>;
  readonly skipStep: (sessionId: SessionId) => Promise<void>;
  readonly jumpToStep: (sessionId: SessionId, stepIndex: number) => Promise<void>;
  readonly hasExecutionState: (entry: IActiveSessionEntry) => boolean;
  readonly getStepSummaries: (entry: IActiveSessionEntry) => ReadonlyArray<IStepSummaryView>;
  readonly getProgressLabel: (entry: IActiveSessionEntry) => string;
}

/**
 * Provides execution actions for production sessions.
 *
 * Reads procedure steps from the workspace and execution state from the session
 * entity. Mutations update the session's execution state and persist it.
 *
 * @public
 */
export function useExecutionActions(): IExecutionActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const getSessionProcedureId = useCallback(
    (session: UserLibrary.AnyMaterializedSession): ProcedureId | undefined => {
      if (session.sessionType === 'filling') {
        const fillingSession = session as UserLibrary.Session.EditingSession;
        return fillingSession.produced.snapshot.procedureId as ProcedureId | undefined;
      }
      if (session.sessionType === 'confection') {
        const confectionSession = session as UserLibrary.Session.AnyConfectionEditingSession;
        return confectionSession.produced.procedureId;
      }
      return undefined;
    },
    []
  );

  const getResolvedSteps = useCallback(
    (session: UserLibrary.AnyMaterializedSession): ReadonlyArray<LibraryRuntime.IResolvedProcedureStep> => {
      const procedureId = getSessionProcedureId(session);
      if (!procedureId) {
        return [];
      }
      const proc = workspace.data.procedures.get(procedureId);
      if (proc.isFailure()) {
        return [];
      }
      const stepsResult = proc.value.getSteps();
      if (stepsResult.isFailure()) {
        return [];
      }
      return stepsResult.value;
    },
    [workspace, getSessionProcedureId]
  );

  const getRawSteps = useCallback(
    (session: UserLibrary.AnyMaterializedSession): ReadonlyArray<Entities.IProcedureStepEntity> => {
      const procedureId = getSessionProcedureId(session);
      if (!procedureId) {
        return [];
      }
      const proc = workspace.data.procedures.get(procedureId);
      if (proc.isFailure()) {
        return [];
      }
      return proc.value.entity.steps;
    },
    [workspace, getSessionProcedureId]
  );

  const getExecutionRuntime = useCallback(
    (entry: IActiveSessionEntry): UserLibraryNs.Session.ExecutionRuntime | undefined => {
      const execution = entry.session.execution;
      if (!execution) {
        return undefined;
      }
      const steps = getRawSteps(entry.session);
      return UserLibraryNs.Session.ExecutionRuntime.from(execution, steps);
    },
    [getRawSteps]
  );

  const persistExecution = useCallback(
    async (sessionId: SessionId, executionState: Entities.IExecutionState): Promise<void> => {
      try {
        const result = await workspace.userData.updateSessionExecutionAndPersist(sessionId, executionState);
        if (result.isFailure()) {
          workspace.data.logger.error(`Execution state persistence failed: ${result.message}`);
          return;
        }
        reactiveWorkspace.notifyChange();
      } catch (err: unknown) {
        workspace.data.logger.error(`Execution state persistence error: ${String(err)}`);
      }
    },
    [workspace, reactiveWorkspace]
  );

  const startExecution = useCallback(
    async (sessionId: SessionId): Promise<void> => {
      const sessionResult = workspace.userData.sessions.get(sessionId);
      if (sessionResult.isFailure()) {
        return;
      }
      const rawSteps = getRawSteps(sessionResult.value);
      if (rawSteps.length === 0) {
        return;
      }
      const initialState = UserLibraryNs.Session.ExecutionRuntime.initialize(rawSteps);
      await persistExecution(sessionId, initialState);
    },
    [workspace, getRawSteps, persistExecution]
  );

  const getRuntimeForSession = useCallback(
    (sessionId: SessionId): UserLibraryNs.Session.ExecutionRuntime | undefined => {
      const sessionResult = workspace.userData.sessions.get(sessionId);
      if (sessionResult.isFailure()) {
        return undefined;
      }
      const entry: IActiveSessionEntry = { sessionId, session: sessionResult.value };
      return getExecutionRuntime(entry);
    },
    [workspace, getExecutionRuntime]
  );

  const advanceStep = useCallback(
    async (sessionId: SessionId): Promise<void> => {
      const runtime = getRuntimeForSession(sessionId);
      if (!runtime) {
        return;
      }
      const result = runtime.advanceStep();
      if (result.isSuccess()) {
        await persistExecution(sessionId, result.value);
      }
    },
    [getRuntimeForSession, persistExecution]
  );

  const skipStep = useCallback(
    async (sessionId: SessionId): Promise<void> => {
      const runtime = getRuntimeForSession(sessionId);
      if (!runtime) {
        return;
      }
      const result = runtime.skipStep();
      if (result.isSuccess()) {
        await persistExecution(sessionId, result.value);
      }
    },
    [getRuntimeForSession, persistExecution]
  );

  const jumpToStep = useCallback(
    async (sessionId: SessionId, stepIndex: number): Promise<void> => {
      const runtime = getRuntimeForSession(sessionId);
      if (!runtime) {
        return;
      }
      const result = runtime.jumpToStep(stepIndex);
      if (result.isSuccess()) {
        await persistExecution(sessionId, result.value);
      }
    },
    [getRuntimeForSession, persistExecution]
  );

  const getStepSummaries = useCallback(
    (entry: IActiveSessionEntry): ReadonlyArray<IStepSummaryView> => {
      const resolvedSteps = getResolvedSteps(entry.session);
      const runtime = getExecutionRuntime(entry);

      if (!runtime) {
        // No execution state — show all steps as pending (user must click Start)
        return resolvedSteps.map((step, idx) => ({
          stepIndex: idx,
          label: getResolvedStepLabel(step),
          status: 'pending' as const,
          isCurrent: false,
          timingLabel: formatResolvedStepTiming(step),
          temperatureLabel: step.temperature ? `${step.temperature}\u00B0C` : undefined,
          executionCount: 0
        }));
      }

      return runtime.getStepSummaries().map((summary) => {
        const resolvedStep = resolvedSteps[summary.stepIndex];
        return {
          stepIndex: summary.stepIndex,
          label: resolvedStep ? getResolvedStepLabel(resolvedStep) : `Step ${summary.stepIndex + 1}`,
          status: summary.status,
          isCurrent: summary.isCurrent,
          timingLabel: resolvedStep ? formatResolvedStepTiming(resolvedStep) : undefined,
          temperatureLabel: resolvedStep?.temperature ? `${resolvedStep.temperature}\u00B0C` : undefined,
          executionCount: summary.executionCount
        };
      });
    },
    [getExecutionRuntime, getResolvedSteps]
  );

  const getProgressLabel = useCallback(
    (entry: IActiveSessionEntry): string => {
      const runtime = getExecutionRuntime(entry);
      if (runtime) {
        return runtime.progressLabel;
      }
      // No execution state — show 0/total from resolved steps
      const steps = getResolvedSteps(entry.session);
      return `0/${steps.length}`;
    },
    [getExecutionRuntime, getResolvedSteps]
  );

  const hasExecutionState = useCallback((entry: IActiveSessionEntry): boolean => {
    return entry.session.execution !== undefined;
  }, []);

  return useMemo(
    () => ({
      startExecution,
      advanceStep,
      skipStep,
      jumpToStep,
      hasExecutionState,
      getStepSummaries,
      getProgressLabel
    }),
    [startExecution, advanceStep, skipStep, jumpToStep, hasExecutionState, getStepSummaries, getProgressLabel]
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getResolvedStepLabel(step: LibraryRuntime.IResolvedProcedureStep): string {
  const mergedParams: Record<string, string> = {};
  if (step.resolvedTask.defaults) {
    for (const [key, value] of Object.entries(step.resolvedTask.defaults)) {
      mergedParams[key] = String(value);
    }
  }
  for (const [key, value] of Object.entries(step.params)) {
    mergedParams[key] = String(value);
  }
  return renderPreview(step.resolvedTask.template, mergedParams);
}

function formatResolvedStepTiming(step: LibraryRuntime.IResolvedProcedureStep): string | undefined {
  const parts: string[] = [];
  if (step.activeTime) {
    parts.push(`${step.activeTime} min`);
  }
  if (step.waitTime) {
    parts.push(`wait ${step.waitTime} min`);
  }
  if (step.holdTime) {
    parts.push(`hold ${step.holdTime} min`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}
