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
 * Step-by-step execution view for a production session.
 * Shows procedure steps with completion tracking and action buttons.
 * @packageDocumentation
 */

import React from 'react';
import { CheckIcon, ForwardIcon, PlayIcon } from '@heroicons/react/20/solid';
import type { UserLibrary } from '@fgv/ts-chocolate';

/**
 * Props for StepExecutionView.
 * @public
 */
export interface IStepExecutionViewProps {
  readonly session: UserLibrary.AnyMaterializedSession;
  readonly stepSummaries: ReadonlyArray<IStepSummaryView>;
  readonly hasExecutionState: boolean;
  readonly onStartExecution: () => void;
  readonly onAdvanceStep: () => void;
  readonly onSkipStep: () => void;
  readonly onJumpToStep: (stepIndex: number) => void;
}

/**
 * UI-facing step summary (simplified from the runtime IStepSummary).
 * @public
 */
export interface IStepSummaryView {
  readonly stepIndex: number;
  readonly label: string;
  readonly status: 'pending' | 'active' | 'completed' | 'skipped';
  readonly isCurrent: boolean;
  readonly timingLabel: string | undefined;
  readonly temperatureLabel: string | undefined;
  readonly executionCount: number;
}

/**
 * Step-by-step execution view showing procedure progress.
 *
 * - Completed steps: collapsed to one line with checkmark
 * - Active step: expanded with details and action buttons
 * - Pending steps: one line with timing preview
 * @public
 */
export function StepExecutionView({
  session,
  stepSummaries,
  hasExecutionState,
  onStartExecution,
  onAdvanceStep,
  onSkipStep,
  onJumpToStep
}: IStepExecutionViewProps): React.ReactElement {
  const label = session.label ?? session.baseId;
  const completedCount = stepSummaries.filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length;
  const totalSteps = stepSummaries.length;

  return (
    <div className="flex flex-col h-full overflow-y-auto" data-testid="step-execution-view">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="text-sm font-medium text-gray-900 truncate">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {hasExecutionState
            ? `Step ${Math.min(completedCount + 1, totalSteps)} of ${totalSteps}`
            : `${totalSteps} steps`}
        </div>
      </div>

      {/* Start button when no execution state */}
      {!hasExecutionState && totalSteps > 0 && (
        <div className="px-3 py-3 border-b border-gray-200 shrink-0">
          <button
            onClick={onStartExecution}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
            data-testid="start-execution-button"
          >
            <PlayIcon className="w-5 h-5" />
            Start Production
          </button>
        </div>
      )}

      {/* Step list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {stepSummaries.map((step) => (
          <StepRow
            key={`${step.stepIndex}-${step.executionCount}`}
            step={step}
            onAdvance={onAdvanceStep}
            onSkip={onSkipStep}
            onJumpTo={(): void => onJumpToStep(step.stepIndex)}
          />
        ))}

        {hasExecutionState && completedCount === totalSteps && (
          <div className="text-center py-4 text-sm text-green-600 font-medium">All steps complete</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Step Row
// ============================================================================

interface IStepRowProps {
  readonly step: IStepSummaryView;
  readonly onAdvance: () => void;
  readonly onSkip: () => void;
  readonly onJumpTo: () => void;
}

function StepRow({ step, onAdvance, onSkip, onJumpTo }: IStepRowProps): React.ReactElement {
  if (step.isCurrent && step.status === 'active') {
    return <ActiveStepRow step={step} onAdvance={onAdvance} onSkip={onSkip} />;
  }

  if (step.status === 'completed' || step.status === 'skipped') {
    return <CompletedStepRow step={step} onJumpTo={onJumpTo} />;
  }

  return <PendingStepRow step={step} />;
}

function ActiveStepRow({
  step,
  onAdvance,
  onSkip
}: {
  readonly step: IStepSummaryView;
  readonly onAdvance: () => void;
  readonly onSkip: () => void;
}): React.ReactElement {
  return (
    <div
      className="border border-green-300 bg-green-50 rounded-lg p-3"
      data-testid={`step-row-active-${step.stepIndex}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-green-600 font-bold text-sm mt-0.5">{step.stepIndex + 1}.</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{step.label}</div>

          {/* Timing and temperature details */}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
            {step.timingLabel && <span>{step.timingLabel}</span>}
            {step.temperatureLabel && <span>{step.temperatureLabel}</span>}
          </div>
        </div>
      </div>

      {/* Action buttons — large for messy hands */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onAdvance}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
          data-testid="step-advance-button"
        >
          <CheckIcon className="w-4 h-4" />
          Done
        </button>
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-1 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 active:bg-gray-300 transition-colors"
          data-testid="step-skip-button"
        >
          <ForwardIcon className="w-4 h-4" />
          Skip
        </button>
      </div>
    </div>
  );
}

function CompletedStepRow({
  step,
  onJumpTo
}: {
  readonly step: IStepSummaryView;
  readonly onJumpTo: () => void;
}): React.ReactElement {
  const isSkipped = step.status === 'skipped';
  return (
    <button
      onClick={onJumpTo}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-gray-50 transition-colors group"
      data-testid={`step-row-completed-${step.stepIndex}`}
      title="Click to repeat this step"
    >
      <CheckIcon className={`w-3.5 h-3.5 shrink-0 ${isSkipped ? 'text-gray-400' : 'text-green-500'}`} />
      <span className={`text-xs truncate ${isSkipped ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
        {step.stepIndex + 1}. {step.label}
      </span>
      {step.timingLabel && <span className="text-xs text-gray-400 ml-auto shrink-0">{step.timingLabel}</span>}
    </button>
  );
}

function PendingStepRow({ step }: { readonly step: IStepSummaryView }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5" data-testid={`step-row-pending-${step.stepIndex}`}>
      <span className="w-3.5 h-3.5 shrink-0 rounded-full border border-gray-300" />
      <span className="text-xs text-gray-500 truncate">
        {step.stepIndex + 1}. {step.label}
      </span>
      {step.timingLabel && <span className="text-xs text-gray-400 ml-auto shrink-0">{step.timingLabel}</span>}
    </div>
  );
}
