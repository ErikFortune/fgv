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
 * Read-only task detail view.
 * @packageDocumentation
 */

import React from 'react';

import { DetailSection, DetailRow, TagList } from '@fgv/ts-app-shell';
import type { LibraryRuntime } from '@fgv/ts-chocolate';
import { EntityDetailHeader, NotesSection } from '../common';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the TaskDetail component.
 * @public
 */
export interface ITaskDetailProps {
  /** The resolved task to display */
  readonly task: LibraryRuntime.ITask;
  /** Called when the user clicks the Edit button */
  readonly onEdit?: () => void;
  /** Called when the user clicks the Preview button */
  readonly onPreview?: () => void;
}

// ============================================================================
// Shared Helpers
// ============================================================================

// ============================================================================
// Timing Section
// ============================================================================

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

function TimingSection({ task }: { readonly task: LibraryRuntime.ITask }): React.ReactElement | null {
  const hasAnyTiming =
    task.defaultActiveTime !== undefined ||
    task.defaultWaitTime !== undefined ||
    task.defaultHoldTime !== undefined ||
    task.defaultTemperature !== undefined;

  if (!hasAnyTiming) {
    return null;
  }

  return (
    <DetailSection title="Default Timing">
      {task.defaultActiveTime !== undefined && (
        <DetailRow label="Active time" value={formatMinutes(task.defaultActiveTime)} />
      )}
      {task.defaultWaitTime !== undefined && (
        <DetailRow label="Wait time" value={formatMinutes(task.defaultWaitTime)} />
      )}
      {task.defaultHoldTime !== undefined && (
        <DetailRow label="Hold time" value={formatMinutes(task.defaultHoldTime)} />
      )}
      {task.defaultTemperature !== undefined && (
        <DetailRow label="Temperature" value={`${task.defaultTemperature}°C`} />
      )}
    </DetailSection>
  );
}

// ============================================================================
// Template Section
// ============================================================================

function TemplateSection({ template }: { readonly template: string }): React.ReactElement {
  return (
    <DetailSection title="Template">
      <div className="bg-gray-50 rounded-md p-2.5 text-sm text-gray-800 font-mono whitespace-pre-wrap border border-gray-200">
        {template}
      </div>
    </DetailSection>
  );
}

// ============================================================================
// Variables Section
// ============================================================================

function VariablesSection({
  variables,
  defaults
}: {
  readonly variables: ReadonlyArray<string>;
  readonly defaults?: Readonly<Record<string, unknown>>;
}): React.ReactElement | null {
  if (variables.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Required Variables">
      <div className="space-y-0.5">
        {variables.map((v) => {
          const defaultValue = defaults?.[v];
          return (
            <div key={v} className="flex items-baseline justify-between text-sm">
              <span className="font-mono text-gray-700">{v}</span>
              {defaultValue !== undefined && (
                <span className="text-xs text-gray-400">default: {String(defaultValue)}</span>
              )}
            </div>
          );
        })}
      </div>
    </DetailSection>
  );
}

// ============================================================================
// TaskDetail Component
// ============================================================================

/**
 * Read-only detail view for a task entity.
 *
 * Displays:
 * - Header with name and ID
 * - Mustache template
 * - Required variables with defaults
 * - Default timing (active, wait, hold, temperature)
 * - Notes and tags
 *
 * @public
 */
export function TaskDetail(props: ITaskDetailProps): React.ReactElement {
  const { task, onEdit, onPreview } = props;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <EntityDetailHeader title={task.name} subtitle={task.id} onPreview={onPreview} onEdit={onEdit} />

      {/* Template */}
      <TemplateSection template={task.template} />

      {/* Variables */}
      <VariablesSection variables={[...task.requiredVariables]} defaults={task.defaults} />

      {/* Timing */}
      <TimingSection task={task} />

      {/* Notes */}
      <NotesSection notes={task.notes ?? []} />

      {/* Tags */}
      <TagList tags={task.tags ?? []} />
    </div>
  );
}
