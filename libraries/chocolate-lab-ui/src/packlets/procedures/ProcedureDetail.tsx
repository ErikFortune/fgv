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

import type { LibraryRuntime, Model, TaskId } from '@fgv/ts-chocolate';
import { Entities } from '@fgv/ts-chocolate';

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
  /** Optional callback when a task reference is clicked (drill-down) */
  readonly onTaskClick?: (taskId: TaskId) => void;
  /** Optional resolver to get a human-readable task name from a task ID */
  readonly resolveTaskName?: (taskId: TaskId) => string | undefined;
}

// ============================================================================
// Shared Helpers
// ============================================================================

function DetailSection({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between py-0.5 text-sm">
      <span className="text-gray-500 shrink-0 mr-2">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function CategoryBadge({ label }: { readonly label: string }): React.ReactElement {
  return (
    <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-choco-primary/10 text-choco-primary">
      {label}
    </span>
  );
}

function TagList({ tags }: { readonly tags: ReadonlyArray<string> }): React.ReactElement | null {
  if (tags.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Tags">
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
            {tag}
          </span>
        ))}
      </div>
    </DetailSection>
  );
}

function NotesSection({
  notes
}: {
  readonly notes: ReadonlyArray<Model.ICategorizedNote>;
}): React.ReactElement | null {
  if (notes.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Notes">
      {notes.map((note, i) => (
        <div key={i} className="text-sm text-gray-700 mb-1">
          <span className="text-xs text-gray-400 mr-1">[{note.category}]</span>
          {note.note}
        </div>
      ))}
    </DetailSection>
  );
}

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
  onTaskClick,
  resolveTaskName
}: {
  readonly step: Entities.IProcedureStepEntity;
  readonly onTaskClick?: (taskId: TaskId) => void;
  readonly resolveTaskName?: (taskId: TaskId) => string | undefined;
}): React.ReactElement {
  const task = step.task;
  const isRef = Entities.isTaskRefEntity(task);
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

  const params = task.params;
  const hasParams = params && Object.keys(params).length > 0;

  if (isRef) {
    const clickable = onTaskClick !== undefined;
    return (
      <div
        className={`flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0${
          clickable ? ' cursor-pointer hover:bg-gray-50 rounded -mx-1 px-1' : ''
        }`}
        onClick={clickable ? (): void => onTaskClick(task.taskId) : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e: React.KeyboardEvent): void => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onTaskClick(task.taskId);
                }
              }
            : undefined
        }
      >
        <span className="text-xs text-gray-400 font-mono w-5 shrink-0 text-right mt-0.5">{step.order}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-800 flex items-center gap-1">
            <span>{resolveTaskName?.(task.taskId) ?? task.taskId}</span>
            {clickable && <span className="text-gray-400 text-xs">→</span>}
          </div>
          {resolveTaskName?.(task.taskId) && (
            <div className="text-[10px] text-gray-400 font-mono">{task.taskId}</div>
          )}
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
  const inlineTask = task.task;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 font-mono w-5 shrink-0 text-right mt-0.5">{step.order}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-800 flex items-center gap-1">
          <span>{inlineTask.name}</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">inline</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5 font-mono whitespace-pre-wrap">
          {inlineTask.template}
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
  const { procedure, onTaskClick } = props;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{procedure.name}</h2>
          {procedure.category && <CategoryBadge label={procedure.category} />}
        </div>
        {procedure.description && <p className="text-sm text-gray-600">{procedure.description}</p>}
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{procedure.id}</p>
      </div>

      {/* Timing summary */}
      <TimingSummary procedure={procedure} />

      {/* Steps */}
      <DetailSection title={`Steps (${procedure.stepCount})`}>
        <div>
          {procedure.steps.map((step) => (
            <StepRow
              key={step.order}
              step={step}
              onTaskClick={onTaskClick}
              resolveTaskName={props.resolveTaskName}
            />
          ))}
        </div>
        {procedure.steps.length === 0 && <p className="text-xs text-gray-400 italic">No steps defined.</p>}
      </DetailSection>

      {/* Notes */}
      <NotesSection notes={procedure.notes ?? []} />

      {/* Tags */}
      <TagList tags={procedure.tags ?? []} />
    </div>
  );
}
