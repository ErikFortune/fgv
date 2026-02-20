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
 * Read-only procedure detail view.
 * @packageDocumentation
 */

import React from 'react';

import { DetailSection, DetailRow, TagList } from '@fgv/ts-app-shell';
import type { LibraryRuntime, TaskId } from '@fgv/ts-chocolate';
import { EntityDetailHeader, NotesSection } from '../common';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the ProcedureDetail component.
 * @public
 */
export interface IProcedureDetailProps {
  /** The resolved procedure to display */
  readonly procedure: LibraryRuntime.IProcedure;
  /** Optional callback when a task step is clicked (drill-down). Works for both library and inline tasks. */
  readonly onTaskClick?: (taskId: TaskId) => void;
  /** Called when the user clicks the Edit button */
  readonly onEdit?: () => void;
  /** Called when the user clicks the Preview button */
  readonly onPreview?: () => void;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
}

// ============================================================================
// Shared Helpers
// ============================================================================

// ============================================================================
// Timing Helpers
// ============================================================================

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

// ============================================================================
// Timing Summary
// ============================================================================

function TimingSummary({
  procedure
}: {
  readonly procedure: LibraryRuntime.IProcedure;
}): React.ReactElement | null {
  const hasAnyTiming =
    procedure.totalActiveTime !== undefined ||
    procedure.totalWaitTime !== undefined ||
    procedure.totalHoldTime !== undefined;

  if (!hasAnyTiming) {
    return null;
  }

  return (
    <DetailSection title="Timing Summary">
      {procedure.totalActiveTime !== undefined && (
        <DetailRow label="Active time" value={formatMinutes(procedure.totalActiveTime)} />
      )}
      {procedure.totalWaitTime !== undefined && (
        <DetailRow label="Wait time" value={formatMinutes(procedure.totalWaitTime)} />
      )}
      {procedure.totalHoldTime !== undefined && (
        <DetailRow label="Hold time" value={formatMinutes(procedure.totalHoldTime)} />
      )}
      {procedure.totalTime !== undefined && (
        <DetailRow label="Total time" value={formatMinutes(procedure.totalTime)} />
      )}
    </DetailSection>
  );
}

// ============================================================================
// Step Row
// ============================================================================

function StepRow({
  step,
  onTaskClick
}: {
  readonly step: LibraryRuntime.IResolvedProcedureStep;
  readonly onTaskClick?: (taskId: TaskId) => void;
}): React.ReactElement {
  const { resolvedTask, params, isInline } = step;
  const timingParts: string[] = [];
  if (step.activeTime !== undefined) {
    timingParts.push(`${step.activeTime}min active`);
  }
  if (step.waitTime !== undefined) {
    timingParts.push(`${step.waitTime}min wait`);
  }
  if (step.holdTime !== undefined) {
    timingParts.push(`${step.holdTime}min hold`);
  }
  if (step.temperature !== undefined) {
    timingParts.push(`${step.temperature}°C`);
  }

  const hasParams = params && Object.keys(params).length > 0;

  if (!isInline) {
    const clickable = onTaskClick !== undefined;
    return (
      <div
        className={`flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0${
          clickable ? ' cursor-pointer hover:bg-gray-50 rounded -mx-1 px-1' : ''
        }`}
        onClick={clickable ? (): void => onTaskClick(resolvedTask.id) : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e: React.KeyboardEvent): void => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onTaskClick(resolvedTask.id);
                }
              }
            : undefined
        }
      >
        <span className="text-xs text-gray-400 font-mono w-5 shrink-0 text-right mt-0.5">{step.order}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-800 flex items-center gap-1">
            <span>{resolvedTask.name}</span>
            {clickable && <span className="text-gray-400 text-xs">→</span>}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">{resolvedTask.id}</div>
          {hasParams && (
            <div className="text-xs text-gray-400 mt-0.5">
              {Object.entries(params)
                .map(([k, v]) => `${k}=${String(v)}`)
                .join(', ')}
            </div>
          )}
          {timingParts.length > 0 && (
            <div className="text-xs text-gray-400 mt-0.5">{timingParts.join(' · ')}</div>
          )}
        </div>
      </div>
    );
  }

  // Inline task: show name + template directly
  const clickable = onTaskClick !== undefined;
  return (
    <div
      className={`flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0${
        clickable ? ' cursor-pointer hover:bg-gray-50 rounded -mx-1 px-1' : ''
      }`}
      onClick={clickable ? (): void => onTaskClick(resolvedTask.id) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e: React.KeyboardEvent): void => {
              if (e.key === 'Enter' || e.key === ' ') {
                onTaskClick(resolvedTask.id);
              }
            }
          : undefined
      }
    >
      <span className="text-xs text-gray-400 font-mono w-5 shrink-0 text-right mt-0.5">{step.order}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-800 flex items-center gap-1">
          <span>{resolvedTask.name}</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">inline</span>
          {clickable && <span className="text-gray-400 text-xs">→</span>}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 font-mono whitespace-pre-wrap">
          {resolvedTask.template}
        </div>
        {hasParams && (
          <div className="text-xs text-gray-400 mt-0.5">
            {Object.entries(params)
              .map(([k, v]) => `${k}=${String(v)}`)
              .join(', ')}
          </div>
        )}
        {timingParts.length > 0 && (
          <div className="text-xs text-gray-400 mt-0.5">{timingParts.join(' · ')}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ProcedureDetail Component
// ============================================================================

/**
 * Read-only detail view for a procedure entity.
 *
 * Displays:
 * - Header with name, category badge, description
 * - Timing summary (active, wait, hold, total)
 * - Ordered step list with task references and timing overrides
 * - Notes and tags
 *
 * @public
 */
export function ProcedureDetail(props: IProcedureDetailProps): React.ReactElement {
  const { procedure, onTaskClick, onEdit, onPreview, onClose } = props;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <EntityDetailHeader
        title={procedure.name}
        description={procedure.description}
        badge={
          procedure.category
            ? { label: procedure.category, colorClass: 'bg-choco-primary/10 text-choco-primary' }
            : undefined
        }
        subtitle={procedure.id}
        onPreview={onPreview}
        onEdit={onEdit}
        onClose={onClose}
      />

      {/* Timing summary */}
      <TimingSummary procedure={procedure} />

      {/* Steps */}
      <DetailSection title={`Steps (${procedure.stepCount})`}>
        {procedure.getSteps().isSuccess() ? (
          <>
            <div>
              {procedure
                .getSteps()
                .orThrow()
                .map((step) => (
                  <StepRow key={step.order} step={step} onTaskClick={onTaskClick} />
                ))}
            </div>
            {procedure.getSteps().orThrow().length === 0 && (
              <p className="text-xs text-gray-400 italic">No steps defined.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-red-500">Failed to resolve steps: {procedure.getSteps().message}</p>
        )}
      </DetailSection>

      {/* Notes */}
      <NotesSection notes={procedure.notes ?? []} />

      {/* Tags */}
      <TagList tags={procedure.tags ?? []} />
    </div>
  );
}
