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
 * Read-only location detail view.
 * @packageDocumentation
 */

import React from 'react';

import { DetailSection } from '@fgv/ts-app-shell';
import type { Entities, LocationId, Model as CommonModel } from '@fgv/ts-chocolate';
import { EntityDetailHeader, NotesSection, UrlsSection } from '../common';

type ILocationEntity = Entities.Locations.ILocationEntity;

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the LocationDetail component.
 * @public
 */
export interface ILocationDetailProps {
  /** Composite location ID */
  readonly locationId: LocationId;
  /** The location entity to display */
  readonly entity: ILocationEntity;
  /** Optional callback to switch to edit mode */
  readonly onEdit?: () => void;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Read-only detail view for a location.
 *
 * Displays:
 * - Header with name
 * - Description
 * - Notes
 *
 * @public
 */
export function LocationDetail(props: ILocationDetailProps): React.ReactElement {
  const { locationId, entity, onEdit, onClose } = props;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <EntityDetailHeader
        title={entity.name}
        description={entity.description}
        subtitle={locationId}
        onEdit={onEdit}
        onClose={onClose}
      />

      {/* Description */}
      <DetailSection title="Description">
        {entity.description ? (
          <p className="text-sm text-gray-700">{entity.description}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">(none)</p>
        )}
      </DetailSection>

      {/* Notes */}
      <NotesSection notes={(entity.notes as ReadonlyArray<CommonModel.ICategorizedNote>) ?? []} />

      {/* URLs */}
      <UrlsSection urls={(entity.urls as ReadonlyArray<CommonModel.ICategorizedUrl>) ?? []} />
    </div>
  );
}
