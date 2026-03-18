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
 * Compact status card for one active session in the production status panel.
 * @packageDocumentation
 */

import React from 'react';
import type { SessionId, UserLibrary } from '@fgv/ts-chocolate';

/**
 * Props for ProductionStatusCard.
 * @public
 */
export interface IProductionStatusCardProps {
  readonly sessionId: SessionId;
  readonly session: UserLibrary.AnyMaterializedSession;
  readonly progressLabel: string;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}

/**
 * Compact card showing session name and step progress.
 * Used in the status panel (160px wide) — intentionally minimal.
 * @public
 */
export function ProductionStatusCard({
  session,
  progressLabel,
  isSelected,
  onClick
}: IProductionStatusCardProps): React.ReactElement {
  const label = session.label ?? session.baseId;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-2 rounded-md transition-colors ${
        isSelected
          ? 'bg-status-success-surface border border-status-success-border'
          : 'bg-surface border border-border hover:bg-hover'
      }`}
      data-testid="production-status-card"
    >
      <div className="text-xs font-medium text-primary truncate">{label}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted">{progressLabel}</span>
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            session.status === 'active' ? 'bg-status-success-icon' : 'bg-status-warning-btn'
          }`}
        />
      </div>
    </button>
  );
}
