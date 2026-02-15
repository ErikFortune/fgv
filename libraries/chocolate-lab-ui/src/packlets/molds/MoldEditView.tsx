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
 * Editable mold view wired to EditedMold with undo/redo support.
 * @packageDocumentation
 */

import React, { useCallback } from 'react';

import {
  EditField,
  EditSection,
  TextInput,
  TextAreaInput,
  NumberInput,
  SelectInput,
  TagsInput
} from '@fgv/ts-app-shell';

import {
  Entities,
  LibraryRuntime,
  Model as CommonModel,
  type MoldFormat,
  type MoldId,
  type Measurement,
  type Millimeters
} from '@fgv/ts-chocolate';

type EditedMold = LibraryRuntime.EditedMold;
type ICavities = Entities.Molds.ICavities;
type ICavityDimensions = Entities.Molds.ICavityDimensions;

import { EditingToolbar, useEditingContext, NotesEditor, UrlsEditor } from '../editing';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the MoldEditView component.
 * @public
 */
export interface IMoldEditViewProps {
  /** The EditedMold wrapper to edit. */
  readonly wrapper: EditedMold;
  /** Called when the user requests save. */
  readonly onSave: (wrapper: EditedMold) => void;
  /** Called when the user requests "save to" another collection. */
  readonly onSaveAs?: (wrapper: EditedMold) => void;
  /** Called when the user cancels editing. */
  readonly onCancel: () => void;
  /** If true, the source entity is read-only (e.g. built-in collection). */
  readonly readOnly?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ALL_FORMATS: ReadonlyArray<MoldFormat> = CommonModel.Enums.allMoldFormats;
const CAVITY_KINDS: ReadonlyArray<'grid' | 'count'> = ['grid', 'count'];

// ============================================================================
// Cavity Editor
// ============================================================================

function CavityEditor({
  cavities,
  onChange
}: {
  readonly cavities: ICavities;
  readonly onChange: (cavities: ICavities) => void;
}): React.ReactElement {
  const handleKindChange = useCallback(
    (kind: 'grid' | 'count') => {
      if (kind === 'grid') {
        onChange({
          kind: 'grid',
          columns: cavities.kind === 'grid' ? cavities.columns : 3,
          rows: cavities.kind === 'grid' ? cavities.rows : 8,
          info: cavities.info
        });
      } else {
        const count =
          cavities.kind === 'grid'
            ? cavities.columns * cavities.rows
            : cavities.kind === 'count'
            ? cavities.count
            : 24;
        onChange({
          kind: 'count',
          count,
          info: cavities.info
        });
      }
    },
    [cavities, onChange]
  );

  const handleColumnsChange = useCallback(
    (value: number | undefined) => {
      if (cavities.kind === 'grid' && value !== undefined) {
        onChange({ ...cavities, columns: Math.max(1, Math.round(value)) });
      }
    },
    [cavities, onChange]
  );

  const handleRowsChange = useCallback(
    (value: number | undefined) => {
      if (cavities.kind === 'grid' && value !== undefined) {
        onChange({ ...cavities, rows: Math.max(1, Math.round(value)) });
      }
    },
    [cavities, onChange]
  );

  const handleCountChange = useCallback(
    (value: number | undefined) => {
      if (cavities.kind === 'count' && value !== undefined) {
        onChange({ ...cavities, count: Math.max(1, Math.round(value)) });
      }
    },
    [cavities, onChange]
  );

  const handleWeightChange = useCallback(
    (value: number | undefined) => {
      const info = { ...(cavities.info ?? {}), weight: value as Measurement | undefined };
      if (cavities.kind === 'grid') {
        onChange({ ...cavities, info });
      } else {
        onChange({ ...cavities, info });
      }
    },
    [cavities, onChange]
  );

  const handleDimensionChange = useCallback(
    (field: keyof ICavityDimensions, value: number | undefined) => {
      const currentDims = cavities.info?.dimensions ?? {
        width: 0 as Millimeters,
        length: 0 as Millimeters,
        depth: 0 as Millimeters
      };
      const newDims: ICavityDimensions = { ...currentDims, [field]: (value ?? 0) as Millimeters };

      // Clear dimensions if all zero
      const allZero = newDims.width === 0 && newDims.length === 0 && newDims.depth === 0;
      const info = {
        ...(cavities.info ?? {}),
        dimensions: allZero ? undefined : newDims
      };

      if (cavities.kind === 'grid') {
        onChange({ ...cavities, info });
      } else {
        onChange({ ...cavities, info });
      }
    },
    [cavities, onChange]
  );

  return (
    <EditSection title="Cavities">
      <EditField label="Layout">
        <SelectInput value={cavities.kind} options={CAVITY_KINDS} onChange={handleKindChange} />
      </EditField>

      {cavities.kind === 'grid' ? (
        <>
          <EditField label="Columns">
            <NumberInput
              value={cavities.columns}
              onChange={handleColumnsChange}
              label="Columns"
              min={1}
              step={1}
            />
          </EditField>
          <EditField label="Rows">
            <NumberInput value={cavities.rows} onChange={handleRowsChange} label="Rows" min={1} step={1} />
          </EditField>
        </>
      ) : (
        <EditField label="Count">
          <NumberInput value={cavities.count} onChange={handleCountChange} label="Count" min={1} step={1} />
        </EditField>
      )}

      <EditField label="Cavity weight (g)">
        <NumberInput
          value={cavities.info?.weight}
          onChange={handleWeightChange}
          label="Cavity weight"
          min={0}
          step={0.5}
        />
      </EditField>

      <EditField label="Width (mm)">
        <NumberInput
          value={cavities.info?.dimensions?.width}
          onChange={(v) => handleDimensionChange('width', v)}
          label="Width"
          min={0}
          step={0.5}
        />
      </EditField>
      <EditField label="Length (mm)">
        <NumberInput
          value={cavities.info?.dimensions?.length}
          onChange={(v) => handleDimensionChange('length', v)}
          label="Length"
          min={0}
          step={0.5}
        />
      </EditField>
      <EditField label="Depth (mm)">
        <NumberInput
          value={cavities.info?.dimensions?.depth}
          onChange={(v) => handleDimensionChange('depth', v)}
          label="Depth"
          min={0}
          step={0.5}
        />
      </EditField>
    </EditSection>
  );
}

// ============================================================================
// MoldEditView Component
// ============================================================================

/**
 * Editable view for a mold entity.
 *
 * Provides form fields for all mold properties:
 * - Identity: description, manufacturer, product number, format, baseId (read-only)
 * - Cavities: kind toggle (grid/count), columns/rows or count, weight, dimensions
 * - Tags, Notes, URLs, Related molds
 *
 * Wired to EditedMold via useEditingContext for undo/redo support.
 *
 * @public
 */
export function MoldEditView(props: IMoldEditViewProps): React.ReactElement {
  const { wrapper, onSave, onSaveAs, onCancel, readOnly } = props;
  const ctx = useEditingContext({ wrapper, onSave, onSaveAs, onCancel, readOnly });

  const entity = wrapper.current;

  // ---- Field change handlers ----

  const handleManufacturerChange = useCallback(
    (value: string) => {
      wrapper.setManufacturer(value);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleProductNumberChange = useCallback(
    (value: string) => {
      wrapper.setProductNumber(value);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleDescriptionChange = useCallback(
    (value: string | undefined) => {
      wrapper.setDescription(value);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleFormatChange = useCallback(
    (value: MoldFormat) => {
      wrapper.setFormat(value);
      ctx.notifyMutation();
    },
    [wrapper, ctx]
  );

  const handleCavitiesChange = useCallback(
    (cavities: ICavities) => {
      wrapper.setCavities(cavities);
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

  const handleRelatedChange = useCallback(
    (value: ReadonlyArray<string> | undefined) => {
      wrapper.setRelated(value as ReadonlyArray<MoldId> | undefined);
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

  const handleUrlsChange = useCallback(
    (value: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined) => {
      wrapper.setUrls(value);
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
        <EditField label="Manufacturer">
          <TextInput
            value={entity.manufacturer}
            onChange={handleManufacturerChange}
            placeholder="e.g. Chocolate World"
          />
        </EditField>
        <EditField label="Product #">
          <TextInput
            value={entity.productNumber}
            onChange={handleProductNumberChange}
            placeholder="e.g. CW1000"
          />
        </EditField>
        <EditField label="Description">
          <TextAreaInput
            value={entity.description}
            onChange={handleDescriptionChange}
            placeholder="Shape description"
          />
        </EditField>
        <EditField label="Format">
          <SelectInput value={entity.format} options={ALL_FORMATS} onChange={handleFormatChange} />
        </EditField>
      </EditSection>

      {/* Cavities Section */}
      <CavityEditor cavities={entity.cavities} onChange={handleCavitiesChange} />

      {/* Tags */}
      <EditSection title="Tags">
        <EditField label="Tags">
          <TagsInput
            value={entity.tags}
            onChange={handleTagsChange}
            placeholder="e.g. sphere, bonbon, polycarbonate"
          />
        </EditField>
      </EditSection>

      {/* Related Molds */}
      <EditSection title="Related Molds">
        <EditField label="Related IDs">
          <TagsInput
            value={entity.related as ReadonlyArray<string> | undefined}
            onChange={handleRelatedChange}
            placeholder="comma-separated mold IDs"
          />
        </EditField>
      </EditSection>

      {/* Notes */}
      <NotesEditor value={entity.notes} onChange={handleNotesChange} />

      {/* URLs */}
      <UrlsEditor value={entity.urls} onChange={handleUrlsChange} />
    </div>
  );
}
