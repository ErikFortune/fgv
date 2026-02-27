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

import React, { useCallback, useEffect, useState } from 'react';
import { EyeIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

import {
  EditField,
  EditSection,
  TextInput,
  TextAreaInput,
  NumberInput,
  TagsInput,
  MultiActionButton
} from '@fgv/ts-app-shell';

import { LibraryRuntime, Model as CommonModel, type Celsius, type Minutes } from '@fgv/ts-chocolate';

type EditedTask = LibraryRuntime.EditedTask;

import { EditingToolbar, useEditingContext, NotesEditor } from '../editing';
import { useWorkspace } from '../workspace';

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
  /** Called when the user clicks the Preview button to open a preview pane. */
  readonly onPreview?: () => void;
  /** Called on every edit mutation (e.g. to invalidate a live preview). */
  readonly onMutate?: () => void;
  /** If true, this task is being edited in the context of a procedure step. */
  readonly isStepContext?: boolean;
  /** Current storage mode when editing in step context. */
  readonly currentMode?: 'inline' | 'library';
  /** Called when user wants to convert between inline and library modes. */
  readonly onConvertMode?: (mode: 'inline' | 'library') => void;
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
  const {
    wrapper,
    onSave,
    onSaveAs,
    onCancel,
    readOnly,
    onPreview,
    onMutate,
    isStepContext,
    currentMode,
    onConvertMode
  } = props;

  const {
    data: { logger }
  } = useWorkspace();
  const ctx = useEditingContext<EditedTask>({ wrapper, onSave, onSaveAs, onCancel, readOnly, logger });
  const entity = wrapper.current;

  // ---- Base ID editing state ----
  const [isEditingBaseId, setIsEditingBaseId] = useState(false);
  const [baseIdDraft, setBaseIdDraft] = useState(entity.baseId);

  // ---- Field Handlers ----

  const handleBaseIdEdit = useCallback(() => {
    setBaseIdDraft(entity.baseId);
    setIsEditingBaseId(true);
  }, [entity.baseId]);

  const handleBaseIdSave = useCallback(() => {
    // Create new entity with updated baseId by restoring from snapshot with new baseId
    const snapshot = wrapper.createSnapshot();
    const newEntity = { ...snapshot, baseId: baseIdDraft as never };
    wrapper.restoreSnapshot(newEntity);
    ctx.notifyMutation();
    setIsEditingBaseId(false);
  }, [wrapper, ctx, baseIdDraft]);

  const handleBaseIdCancel = useCallback(() => {
    setBaseIdDraft(entity.baseId);
    setIsEditingBaseId(false);
  }, [entity.baseId]);

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

  // Notify parent of mutations so live preview can update.
  // `entity` is a new object reference after each mutation, so this fires on every edit.
  useEffect(() => {
    onMutate?.();
  }, [entity, onMutate]);

  // Build custom save button for step context with mode selection
  const customSaveButton =
    isStepContext && onConvertMode && currentMode ? (
      <MultiActionButton
        primaryAction={{
          id: 'save',
          label: 'Save',
          icon: <CheckIcon className="h-3.5 w-3.5" />,
          onSelect: ctx.save
        }}
        alternativeActions={[
          {
            id: 'save-inline',
            label: currentMode === 'inline' ? 'Save Inline (current)' : 'Save Inline',
            onSelect: (): void => {
              if (currentMode !== 'inline') {
                onConvertMode('inline');
              }
              ctx.save();
            }
          },
          {
            id: 'save-library',
            label: currentMode === 'library' ? 'Save to Library (current)' : 'Save to Library',
            onSelect: (): void => {
              if (currentMode !== 'library') {
                onConvertMode('library');
              }
              ctx.save();
            }
          }
        ]}
        variant="primary"
      />
    ) : undefined;

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      {/* Toolbar */}
      <EditingToolbar
        context={ctx}
        customSaveButton={customSaveButton}
        extraButtons={
          <>
            {onPreview && (
              <button
                type="button"
                onClick={onPreview}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors text-gray-600 hover:text-choco-primary hover:bg-gray-100"
                title="Open preview pane"
              >
                <EyeIcon className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
            )}
          </>
        }
      />

      {/* Identity Section */}
      <EditSection title="Identity">
        <EditField label="Base ID">
          {isEditingBaseId ? (
            <div className="flex items-center gap-2">
              <TextInput
                value={baseIdDraft}
                onChange={(value: string): void => setBaseIdDraft(value as never)}
                placeholder="e.g. melt-chocolate"
              />
              <button
                type="button"
                onClick={handleBaseIdSave}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                title="Save base ID"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleBaseIdCancel}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-500">{entity.baseId}</span>
              <button
                type="button"
                onClick={handleBaseIdEdit}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Edit base ID"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
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
