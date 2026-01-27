/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { useCallback, useMemo } from 'react';
import type {
  IProductionSessionState,
  IProductionSessionActions,
  PersistedSessionStatus,
  SessionId
} from './model';

/**
 * Raw session data from scratchpad
 * @public
 */
export interface IPersistedSessionData {
  /** Session ID */
  sessionId: SessionId;
  /** Session status */
  status: PersistedSessionStatus;
  /** Session label */
  label?: string;
  /** Session type */
  sessionType: 'confection';
  /** Base confection info */
  base: {
    confectionId: string;
    versionSpec: string;
  };
  /** Production data */
  production?: {
    moldId?: string;
    frames?: number;
  };
  /** Draft data */
  draft?: {
    draftVersion?: unknown;
  };
}

/**
 * Mold data needed for yield calculation
 * @public
 */
export interface IMoldData {
  /** Cavity count per frame */
  cavityCount: number;
}

/**
 * Options for useProductionSession hook
 * @public
 */
export interface IUseProductionSessionOptions {
  /** The persisted session data, or undefined if no session selected */
  session: IPersistedSessionData | undefined;
  /** Function to get mold data by ID */
  getMold: (moldId: string) => IMoldData | undefined;
  /** Callback when production data changes */
  onUpdateProduction: (sessionId: SessionId, production: { moldId?: string; frames?: number }) => void;
  /** Callback when session label changes */
  onUpdateLabel: (sessionId: SessionId, label: string | undefined) => void;
}

/**
 * Result type for useProductionSession hook
 * @public
 */
export interface IUseProductionSessionResult {
  /** Current session state */
  state: IProductionSessionState;
  /** Actions for modifying session */
  actions: IProductionSessionActions;
}

/**
 * Hook for managing production session state.
 *
 * Provides computed state and actions for a production session including
 * mold selection, frame count, and yield calculation.
 *
 * @example
 * ```tsx
 * const { state, actions } = useProductionSession({
 *   session: currentSession,
 *   getMold: (id) => runtime?.getRuntimeMold(id).orDefault(undefined),
 *   onUpdateProduction: (sessionId, production) => updateConfectionProduction(sessionId, production),
 *   onUpdateLabel: (sessionId, label) => updateSessionLabel(sessionId, label)
 * });
 *
 * // Use state
 * console.log(state.scaledYieldCount); // e.g., 32 pieces
 *
 * // Use actions
 * actions.selectMold('mold-001');
 * actions.setFrames(2);
 * ```
 *
 * @param options - Hook configuration
 * @returns Object containing state and actions
 * @public
 */
export function useProductionSession(options: IUseProductionSessionOptions): IUseProductionSessionResult {
  const { session, getMold, onUpdateProduction, onUpdateLabel } = options;

  const state = useMemo((): IProductionSessionState => {
    if (!session) {
      return {
        sessionId: undefined,
        confectionId: undefined,
        versionSpec: undefined,
        moldId: undefined,
        frames: 1,
        scaledYieldCount: undefined,
        status: 'active',
        hasDraftChanges: false,
        label: undefined
      };
    }

    const moldId = session.production?.moldId;
    const frames = session.production?.frames ?? 1;
    const mold = moldId ? getMold(moldId) : undefined;
    const scaledYieldCount = mold ? mold.cavityCount * frames : undefined;
    const hasDraftChanges = session.draft?.draftVersion !== undefined;

    return {
      sessionId: session.sessionId,
      confectionId: session.base.confectionId,
      versionSpec: session.base.versionSpec,
      moldId,
      frames,
      scaledYieldCount,
      status: session.status,
      hasDraftChanges,
      label: session.label
    };
  }, [session, getMold]);

  const selectMold = useCallback(
    (moldId: string | undefined): void => {
      if (!session) return;
      onUpdateProduction(session.sessionId, {
        moldId,
        frames: session.production?.frames
      });
    },
    [session, onUpdateProduction]
  );

  const setFrames = useCallback(
    (frames: number): void => {
      /* c8 ignore next - defensive: hook is only usable when session exists */
      if (!session) return;
      const validFrames = Number.isFinite(frames) && frames > 0 ? frames : 1;
      onUpdateProduction(session.sessionId, {
        moldId: session.production?.moldId,
        frames: validFrames
      });
    },
    [session, onUpdateProduction]
  );

  const rename = useCallback(
    (label: string): void => {
      /* c8 ignore next - defensive: hook is only usable when session exists */
      if (!session) return;
      onUpdateLabel(session.sessionId, label.trim() || undefined);
    },
    [session, onUpdateLabel]
  );

  const actions = useMemo(
    (): IProductionSessionActions => ({
      selectMold,
      setFrames,
      rename
    }),
    [selectMold, setFrames, rename]
  );

  return { state, actions };
}
