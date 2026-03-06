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
 * Three-state production overlay panel.
 *
 * States:
 * 1. Collapsed strip (48px) — session count + alert indicator
 * 2. Status panel (~160px) — compact list of active sessions
 * 3. Detail view (~480px) — step-by-step execution with session tabs
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, BeakerIcon } from '@heroicons/react/20/solid';
import type { SessionId, UserLibrary } from '@fgv/ts-chocolate';

import { ProductionStatusCard } from './ProductionStatusCard';
import { StepExecutionView } from './StepExecutionView';
import { useExecutionActions } from './useExecutionActions';

/**
 * Panel expansion state.
 * @public
 */
export type ProductionPanelState = 'collapsed' | 'status' | 'detail';

/**
 * An active session entry with its materialized data.
 * @public
 */
export interface IActiveSessionEntry {
  readonly sessionId: SessionId;
  readonly session: UserLibrary.AnyMaterializedSession;
}

/**
 * Props for ProductionOverlayPanel.
 * @public
 */
export interface IProductionOverlayPanelProps {
  readonly sessions: ReadonlyArray<IActiveSessionEntry>;
  readonly panelState: ProductionPanelState;
  readonly onStateChange: (state: ProductionPanelState) => void;
}

// Width constants
const COLLAPSED_WIDTH: number = 48;
const STATUS_WIDTH: number = 160;
const DETAIL_WIDTH: number = 480;

/**
 * Three-state production overlay panel that slides from the right edge.
 *
 * - Collapsed: thin strip with session count badge
 * - Status: compact list of all active sessions
 * - Detail: full step execution view with session tabs
 *
 * @public
 */
export function ProductionOverlayPanel({
  sessions,
  panelState,
  onStateChange
}: IProductionOverlayPanelProps): React.ReactElement {
  const [selectedSessionId, setSelectedSessionId] = useState<SessionId | undefined>(sessions[0]?.sessionId);

  const selectedEntry = useMemo(
    () => sessions.find((e) => e.sessionId === selectedSessionId) ?? sessions[0],
    [sessions, selectedSessionId]
  );

  const executionActions = useExecutionActions();

  const handleStatusCardClick = useCallback(
    (sessionId: SessionId) => {
      setSelectedSessionId(sessionId);
      onStateChange('detail');
    },
    [onStateChange]
  );

  const handleExpand = useCallback(() => {
    if (panelState === 'collapsed') {
      onStateChange('status');
    } else if (panelState === 'status') {
      onStateChange('detail');
    }
  }, [panelState, onStateChange]);

  const handleCollapse = useCallback(() => {
    if (panelState === 'detail') {
      onStateChange('status');
    } else if (panelState === 'status') {
      onStateChange('collapsed');
    }
  }, [panelState, onStateChange]);

  const width =
    panelState === 'collapsed' ? COLLAPSED_WIDTH : panelState === 'status' ? STATUS_WIDTH : DETAIL_WIDTH;

  return (
    <div
      className="flex shrink-0 border-l border-gray-300 bg-white transition-all duration-200 overflow-hidden"
      style={{ width }}
      data-testid="production-overlay-panel"
    >
      {panelState === 'collapsed' && <CollapsedStrip sessions={sessions} onExpand={handleExpand} />}

      {panelState === 'status' && (
        <StatusPanel
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleStatusCardClick}
          onCollapse={handleCollapse}
          executionActions={executionActions}
        />
      )}

      {panelState === 'detail' && selectedEntry && (
        <DetailPanel
          sessions={sessions}
          selectedEntry={selectedEntry}
          onSelectSession={setSelectedSessionId}
          onCollapse={handleCollapse}
          executionActions={executionActions}
        />
      )}
    </div>
  );
}

// ============================================================================
// Collapsed Strip
// ============================================================================

function CollapsedStrip({
  sessions,
  onExpand
}: {
  readonly sessions: ReadonlyArray<IActiveSessionEntry>;
  readonly onExpand: () => void;
}): React.ReactElement {
  return (
    <button
      onClick={onExpand}
      className="flex flex-col items-center justify-start w-full h-full py-3 gap-2 hover:bg-gray-50 transition-colors"
      data-testid="production-collapsed-strip"
      title="Open production panel"
    >
      <BeakerIcon className="w-5 h-5 text-green-600" />
      <span className="text-xs font-medium text-gray-700 [writing-mode:vertical-lr] rotate-180">
        Production
      </span>
      <span className="mt-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-green-600 rounded-full">
        {sessions.length}
      </span>
    </button>
  );
}

// ============================================================================
// Status Panel
// ============================================================================

function StatusPanel({
  sessions,
  selectedSessionId,
  onSelectSession,
  onCollapse,
  executionActions
}: {
  readonly sessions: ReadonlyArray<IActiveSessionEntry>;
  readonly selectedSessionId: SessionId | undefined;
  readonly onSelectSession: (id: SessionId) => void;
  readonly onCollapse: () => void;
  readonly executionActions: ReturnType<typeof useExecutionActions>;
}): React.ReactElement {
  return (
    <div className="flex flex-col w-full h-full" data-testid="production-status-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 shrink-0">
        <span className="text-xs font-semibold text-gray-700">Production</span>
        <button
          onClick={onCollapse}
          className="p-0.5 rounded hover:bg-gray-100 transition-colors"
          title="Collapse panel"
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-1">
        {sessions.map((entry) => {
          const progressLabel = executionActions.getProgressLabel(entry);
          return (
            <ProductionStatusCard
              key={entry.sessionId}
              sessionId={entry.sessionId}
              session={entry.session}
              progressLabel={progressLabel}
              isSelected={entry.sessionId === selectedSessionId}
              onClick={(): void => onSelectSession(entry.sessionId)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Detail Panel
// ============================================================================

function DetailPanel({
  sessions,
  selectedEntry,
  onSelectSession,
  onCollapse,
  executionActions
}: {
  readonly sessions: ReadonlyArray<IActiveSessionEntry>;
  readonly selectedEntry: IActiveSessionEntry;
  readonly onSelectSession: (id: SessionId) => void;
  readonly onCollapse: () => void;
  readonly executionActions: ReturnType<typeof useExecutionActions>;
}): React.ReactElement {
  const stepSummaries = useMemo(
    () => executionActions.getStepSummaries(selectedEntry),
    [executionActions, selectedEntry]
  );

  const hasExecution = useMemo(
    () => executionActions.hasExecutionState(selectedEntry),
    [executionActions, selectedEntry]
  );

  const handleStart = useCallback(() => {
    executionActions.startExecution(selectedEntry.sessionId);
  }, [executionActions, selectedEntry.sessionId]);

  const handleAdvance = useCallback(() => {
    executionActions.advanceStep(selectedEntry.sessionId);
  }, [executionActions, selectedEntry.sessionId]);

  const handleSkip = useCallback(() => {
    executionActions.skipStep(selectedEntry.sessionId);
  }, [executionActions, selectedEntry.sessionId]);

  const handleJumpTo = useCallback(
    (stepIndex: number) => {
      executionActions.jumpToStep(selectedEntry.sessionId, stepIndex);
    },
    [executionActions, selectedEntry.sessionId]
  );

  return (
    <div className="flex flex-col w-full h-full" data-testid="production-detail-panel">
      {/* Header with collapse and tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 shrink-0">
        <button
          onClick={onCollapse}
          className="p-0.5 rounded hover:bg-gray-100 transition-colors shrink-0"
          title="Show status panel"
        >
          <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
        </button>

        {/* Session tabs */}
        <div className="flex-1 flex gap-0.5 overflow-x-auto min-w-0">
          {sessions.map((entry) => {
            const isActive = entry.sessionId === selectedEntry.sessionId;
            const tabLabel = entry.session.label ?? entry.session.baseId;
            return (
              <button
                key={entry.sessionId}
                onClick={(): void => onSelectSession(entry.sessionId)}
                className={`px-2 py-1 text-xs rounded-t whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 font-medium border-b-2 border-green-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step execution content */}
      <StepExecutionView
        session={selectedEntry.session}
        stepSummaries={stepSummaries}
        hasExecutionState={hasExecution}
        onStartExecution={handleStart}
        onAdvanceStep={handleAdvance}
        onSkipStep={handleSkip}
        onJumpToStep={handleJumpTo}
      />
    </div>
  );
}
