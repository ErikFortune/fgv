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
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

import type { LibraryRuntime, Model } from '@fgv/ts-chocolate';

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
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{task.name}</h2>
          <div className="ml-auto flex items-center gap-1">
            {onPreview && (
              <button
                onClick={onPreview}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
                title="Preview template"
              >
                <EyeIcon className="w-4 h-4" />
                Preview
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
                title="Edit task"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{task.id}</p>
      </div>

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
