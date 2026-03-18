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
 * Generic read-only detail view for sessions without a specialized panel.
 * Used as a fallback for confection sessions until Phase 2.
 * @packageDocumentation
 */

import React from 'react';
import { DetailSection, DetailRow } from '@fgv/ts-app-shell';
import { type SessionId, UserLibrary } from '@fgv/ts-chocolate';

import { EntityDetailHeader, NotesSection } from '../common';

// ============================================================================
// Status Colors
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-status-info-surface text-status-info-text',
  active: 'bg-status-success-surface text-status-success-text',
  committing: 'bg-status-warning-surface text-status-warning-text',
  committed: 'bg-surface-raised text-primary',
  abandoned: 'bg-status-error-surface text-status-error-text'
};

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the GenericSessionDetailView component.
 * @internal
 */
export interface IGenericSessionDetailViewProps {
  readonly sessionId: SessionId;
  readonly session: UserLibrary.AnyMaterializedSession;
  readonly onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Generic read-only detail view for a materialized editing session.
 * Displays session metadata without specialized editing capabilities.
 * @internal
 */
export function GenericSessionDetailView({
  sessionId,
  session,
  onClose
}: IGenericSessionDetailViewProps): React.ReactElement {
  const statusColor = STATUS_COLORS[session.status] ?? 'bg-surface-raised text-primary';

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      <EntityDetailHeader
        title={session.label ?? session.baseId}
        subtitle={sessionId}
        badge={{ label: session.status, colorClass: statusColor }}
        onClose={onClose}
      />

      <DetailSection title="Session Info">
        <DetailRow label="Type" value={session.sessionType} />
        <DetailRow label="Status" value={session.status} />
        {session.group && <DetailRow label="Group" value={session.group} />}
        <DetailRow label="Source Variation" value={session.sourceVariationId} />
      </DetailSection>

      {session instanceof UserLibrary.Session.ConfectionEditingSessionBase && (
        <DetailSection title="Confection">
          <DetailRow label="Confection Type" value={session.confectionType} />
        </DetailSection>
      )}

      <DetailSection title="Timestamps">
        <DetailRow label="Created" value={formatTimestamp(session.createdAt)} />
        <DetailRow label="Updated" value={formatTimestamp(session.updatedAt)} />
      </DetailSection>

      {session.notes && session.notes.length > 0 && <NotesSection notes={session.notes} />}

      <DetailSection title="Identity">
        <DetailRow label="Session ID" value={sessionId} />
        <DetailRow label="Base ID" value={session.baseId} />
      </DetailSection>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}
