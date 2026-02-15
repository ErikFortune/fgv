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
 * Editable task view wired to EditedTask with undo/redo support and template preview.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';

import { EditField, EditSection, TextInput, TextAreaInput, NumberInput, TagsInput } from '@fgv/ts-app-shell';

import { LibraryRuntime, Model as CommonModel, type Celsius, type Minutes } from '@fgv/ts-chocolate';

type EditedTask = LibraryRuntime.EditedTask;

import { EditingToolbar, useEditingContext, NotesEditor } from '../editing';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the TaskEditView component.
 * @public
 */
export interface ITaskEditViewProps {
  /** The EditedTask wrapper to edit. */
  readonly wrapper: EditedTask;
  /** Called when the user requests save. */
  readonly onSave: (wrapper: EditedTask) => void;
  /** Called when the user requests "save to" another collection. */
  readonly onSaveAs?: (wrapper: EditedTask) => void;
  /** Called when the user cancels editing. */
  readonly onCancel: () => void;
  /** If true, the source entity is read-only (e.g. built-in collection). */
  readonly readOnly?: boolean;
}

// ============================================================================
// Template Preview
// ============================================================================

/**
 * Extracts Mustache variable names from a template string.
 * Handles simple variable patterns (not sections/partials).
 */
function extractVariableNames(template: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const regex = /\{\{([#^/!>]?)([^}]+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    const prefix = match[1];
    const name = match[2].trim();
    // Skip section/partial/comment markers
    if (!prefix && name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

/**
 * Simple Mustache-like rendering for preview purposes.
 * Replaces variable placeholders with provided values, leaves unresolved vars as-is.
 */
function renderPreview(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (__match, name: string) => {
    const trimmed = name.trim();
    return trimmed in params && params[trimmed] !== '' ? params[trimmed] : `{{${trimmed}}}`;
  });
}

function TemplatePreview({
  template,
  defaults
}: {
  readonly template: string;
  readonly defaults?: Readonly<Record<string, unknown>>;
}): React.ReactElement {
  const variables = useMemo(() => extractVariableNames(template), [template]);
  const [params, setParams] = useState<Record<string, string>>({});

  const handleParamChange = useCallback((name: string, value: string) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Merge defaults with user-entered params for preview
  const mergedParams = useMemo(() => {
    const merged: Record<string, string> = {};
    if (defaults) {
      for (const [key, val] of Object.entries(defaults)) {
        merged[key] = String(val);
      }
    }
    for (const [key, val] of Object.entries(params)) {
      if (val !== '') {
        merged[key] = val;
      }
    }
    return merged;
  }, [defaults, params]);

  const rendered = useMemo(() => renderPreview(template, mergedParams), [template, mergedParams]);

  if (variables.length === 0 && template.trim().length === 0) {
    return (
      <EditSection title="Preview">
        <p className="text-sm text-gray-400 italic">Enter a template above to see a preview.</p>
      </EditSection>
    );
  }

  return (
    <EditSection title="Preview">
      {variables.length > 0 && (
        <div className="mb-3 space-y-1.5">
          <p className="text-xs text-gray-500 mb-1">Enter values for template variables:</p>
          {variables.map((v) => {
            const defaultValue = defaults?.[v];
            return (
              <div key={v} className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-600 shrink-0 w-32 truncate" title={v}>
                  {v}
                </span>
                <input
                  type="text"
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={params[v] ?? ''}
                  onChange={(e): void => handleParamChange(v, e.target.value)}
                  placeholder={defaultValue !== undefined ? `default: ${String(defaultValue)}` : `{{${v}}}`}
                />
              </div>
            );
          })}
        </div>
      )}
      <div className="bg-gray-50 rounded-md p-2.5 text-sm text-gray-800 whitespace-pre-wrap border border-gray-200">
        {rendered || <span className="text-gray-400 italic">Empty template</span>}
      </div>
    </EditSection>
  );
}

// ============================================================================
// TaskEditView Component
// ============================================================================

/**
 * Editable task view with undo/redo support and live template preview.
 *
 * Displays:
 * - Editing toolbar (undo/redo/save/cancel)
 * - Identity fields (baseId, name)
 * - Template editor (textarea)
 * - Live template preview with placeholder inputs
 * - Default timing fields
 * - Default placeholder values
 * - Notes and tags
 *
 * @public
 */
export function TaskEditView(props: ITaskEditViewProps): React.ReactElement {
  const { wrapper, onSave, onSaveAs, onCancel, readOnly } = props;

  const ctx = useEditingContext<EditedTask>({ wrapper, onSave, onSaveAs, onCancel, readOnly });
  const entity = wrapper.current;

  // ---- Field Handlers ----

  const handleNameChange = useCallback(
    (value: string) => {
      wrapper.setName(value);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleTemplateChange = useCallback(
    (value: string | undefined) => {
      wrapper.setTemplate(value ?? '');
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleDefaultActiveTimeChange = useCallback(
    (value: number | undefined) => {
      wrapper.setDefaultActiveTime(value as Minutes | undefined);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleDefaultWaitTimeChange = useCallback(
    (value: number | undefined) => {
      wrapper.setDefaultWaitTime(value as Minutes | undefined);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleDefaultHoldTimeChange = useCallback(
    (value: number | undefined) => {
      wrapper.setDefaultHoldTime(value as Minutes | undefined);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleDefaultTemperatureChange = useCallback(
    (value: number | undefined) => {
      wrapper.setDefaultTemperature(value as Celsius | undefined);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleTagsChange = useCallback(
    (value: ReadonlyArray<string> | undefined) => {
      wrapper.setTags(value);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleNotesChange = useCallback(
    (value: ReadonlyArray<CommonModel.ICategorizedNote> | undefined) => {
      wrapper.setNotes(value);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      {/* Toolbar */}
      <EditingToolbar context={ctx} />

      {/* Identity Section */}
      <EditSection title="Identity">
        <EditField label="Base ID">
          <span className="text-sm font-mono text-gray-500">{entity.baseId}</span>
        </EditField>
        <EditField label="Name">
          <TextInput value={entity.name} onChange={handleNameChange} placeholder="e.g. Melt Chocolate" />
        </EditField>
      </EditSection>

      {/* Template Section */}
      <EditSection title="Template">
        <EditField label="Mustache Template">
          <TextAreaInput
            value={entity.template}
            onChange={handleTemplateChange}
            placeholder="e.g. Melt {{ingredient}} at {{temperature}}°C for {{time}} minutes"
          />
        </EditField>
      </EditSection>

      {/* Preview Section */}
      <TemplatePreview template={entity.template} defaults={entity.defaults} />

      {/* Default Timing */}
      <EditSection title="Default Timing">
        <EditField label="Active Time (min)">
          <NumberInput
            value={entity.defaultActiveTime}
            onChange={handleDefaultActiveTimeChange}
            label="Active time"
            min={0}
            step={1}
          />
        </EditField>
        <EditField label="Wait Time (min)">
          <NumberInput
            value={entity.defaultWaitTime}
            onChange={handleDefaultWaitTimeChange}
            label="Wait time"
            min={0}
            step={1}
          />
        </EditField>
        <EditField label="Hold Time (min)">
          <NumberInput
            value={entity.defaultHoldTime}
            onChange={handleDefaultHoldTimeChange}
            label="Hold time"
            min={0}
            step={1}
          />
        </EditField>
        <EditField label="Temperature (°C)">
          <NumberInput
            value={entity.defaultTemperature}
            onChange={handleDefaultTemperatureChange}
            label="Temperature"
            step={0.5}
          />
        </EditField>
      </EditSection>

      {/* Tags */}
      <EditSection title="Tags">
        <EditField label="Tags">
          <TagsInput
            value={entity.tags}
            onChange={handleTagsChange}
            placeholder="e.g. mixing, prep, tempering"
          />
        </EditField>
      </EditSection>

      {/* Notes */}
      <NotesEditor value={entity.notes} onChange={handleNotesChange} />
    </div>
  );
}
