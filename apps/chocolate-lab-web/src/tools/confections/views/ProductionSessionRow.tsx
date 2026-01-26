/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { FillingId, IngredientId, MoldId, ProcedureId, SessionId, SourceId } from '@fgv/ts-chocolate';
import { Runtime } from '@fgv/ts-chocolate';
import {
  ProductionTools,
  type IFillingSlotData,
  type IShellChocolateSpec,
  type IProcedureSpec,
  type IMoldSpec,
  type IFillingOption,
  type IPickerItem,
  type SlotId
} from '@fgv/ts-chocolate-ui';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { useSessionScratchpad } from '../../../contexts/SessionScratchpadContext';

type PersistedConfectionSession = Runtime.Scratchpad.IPersistedConfectionSession;

/**
 * Props for ProductionSessionRow
 */
export interface IProductionSessionRowProps {
  /** The session to render */
  session: PersistedConfectionSession;
  /** Whether this session is the active one */
  isActive: boolean;
  /** Callback when commit is requested */
  onCommit: (session: PersistedConfectionSession) => void;
  /** Callback when abandon is requested */
  onAbandon: (sessionId: SessionId) => void;
  /** Callback when delete is requested */
  onDelete: (sessionId: SessionId) => void;
}

/**
 * Extracts version data needed by the hooks
 */
function useVersionData(session: PersistedConfectionSession) {
  const { runtime } = useChocolate();

  return useMemo(() => {
    if (!runtime) return { baseRawVersion: undefined, draftRawVersion: undefined };

    const confection = runtime.getRuntimeConfection(session.base.confectionId).orDefault(undefined);
    if (!confection) return { baseRawVersion: undefined, draftRawVersion: undefined };

    const version = confection.getVersion(session.base.versionSpec).orDefault(undefined);
    const baseRawVersion = (version as unknown as { raw?: unknown })?.raw as
      | Record<string, unknown>
      | undefined;

    const draftRawVersion =
      (session.draft?.draftVersion as unknown as Record<string, unknown> | undefined) ?? undefined;

    return {
      baseRawVersion,
      draftRawVersion,
      confection,
      version
    };
  }, [runtime, session.base.confectionId, session.base.versionSpec, session.draft?.draftVersion]);
}

/**
 * Hook to adapt session data for useProductionSession
 */
function useProductionSessionAdapter(session: PersistedConfectionSession) {
  const { runtime } = useChocolate();
  const { updateConfectionProduction, updateSessionLabel } = useSessionScratchpad();

  const getMold = useCallback(
    (moldId: string) => {
      if (!runtime) return undefined;
      const mold = runtime.getRuntimeMold(moldId as MoldId).orDefault(undefined);
      return mold ? { cavityCount: mold.cavityCount } : undefined;
    },
    [runtime]
  );

  const onUpdateProduction = useCallback(
    (sessionId: ProductionTools.SessionId, production: { moldId?: string; frames?: number }) => {
      updateConfectionProduction(sessionId as unknown as SessionId, {
        moldId: production.moldId as MoldId | undefined,
        frames: production.frames
      });
    },
    [updateConfectionProduction]
  );

  const onUpdateLabel = useCallback(
    (sessionId: ProductionTools.SessionId, label: string | undefined) => {
      updateSessionLabel(sessionId as unknown as SessionId, label);
    },
    [updateSessionLabel]
  );

  const sessionData: ProductionTools.IPersistedSessionData = useMemo(
    () => ({
      sessionId: session.sessionId as unknown as ProductionTools.SessionId,
      sessionType: 'confection' as const,
      status: session.status,
      label: session.label,
      base: {
        confectionId: session.base.confectionId as unknown as string,
        versionSpec: session.base.versionSpec as unknown as string
      },
      production: session.production
        ? {
            moldId: session.production.moldId as unknown as string | undefined,
            frames: session.production.frames
          }
        : undefined,
      draft: session.draft ? { draftVersion: session.draft.draftVersion as unknown } : undefined
    }),
    [session]
  );

  return ProductionTools.useProductionSession({
    session: sessionData,
    getMold,
    onUpdateProduction,
    onUpdateLabel
  });
}

/**
 * Hook to adapt draft editing for shell chocolate
 */
function useShellChocolateAdapter(
  session: PersistedConfectionSession,
  baseRawVersion: Record<string, unknown> | undefined,
  draftRawVersion: Record<string, unknown> | undefined
) {
  const { updateConfectionDraft, updateConfectionProduction } = useSessionScratchpad();

  const baseSpec = useMemo((): IShellChocolateSpec | undefined => {
    const shell = baseRawVersion?.shellChocolate as { ids: string[]; preferredId?: string } | undefined;
    if (!shell) return undefined;
    return { ids: shell.ids, preferredId: shell.preferredId };
  }, [baseRawVersion]);

  const draftSpec = useMemo((): IShellChocolateSpec | undefined => {
    if (!draftRawVersion) return undefined;
    const shell = draftRawVersion.shellChocolate as { ids: string[]; preferredId?: string } | undefined;
    if (!shell) return undefined;
    return { ids: shell.ids, preferredId: shell.preferredId };
  }, [draftRawVersion]);

  // Production selection (for this run, not recipe edit)
  const productionSelectedId = (session.production?.shellChocolateId as unknown as string) ?? undefined;

  const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

  const onUpdateDraft = useCallback(
    (spec: IShellChocolateSpec) => {
      if (!baseRawVersion) return;
      const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
      nextDraft.shellChocolate = spec;
      updateConfectionDraft(session.sessionId, { draftVersion: nextDraft as unknown });
    },
    [baseRawVersion, draftRawVersion, session.sessionId, updateConfectionDraft]
  );

  const onResetDraft = useCallback(() => {
    updateConfectionDraft(session.sessionId, { draftVersion: undefined });
  }, [session.sessionId, updateConfectionDraft]);

  const onSelectProduction = useCallback(
    (id: string) => {
      updateConfectionProduction(session.sessionId, {
        shellChocolateId: id as unknown as IngredientId
      });
    },
    [session.sessionId, updateConfectionProduction]
  );

  return ProductionTools.useShellChocolateSelection({
    baseSpec,
    draftSpec,
    onUpdateDraft,
    onResetDraft,
    productionSelectedId,
    onSelectProduction
  });
}

/**
 * Hook to adapt draft editing for filling slots
 */
function useFillingSlotAdapter(
  session: PersistedConfectionSession,
  baseRawVersion: Record<string, unknown> | undefined,
  draftRawVersion: Record<string, unknown> | undefined
) {
  const { updateConfectionDraft, updateConfectionProduction } = useSessionScratchpad();

  const baseSlots = useMemo((): IFillingSlotData[] | undefined => {
    const fillings = baseRawVersion?.fillings as
      | Array<{
          slotId: string;
          name?: string;
          filling: { options: Array<{ type: 'recipe' | 'ingredient'; id: string }>; preferredId?: string };
        }>
      | undefined;
    if (!fillings) return undefined;
    return fillings.map((f) => ({
      slotId: f.slotId,
      name: f.name,
      filling: { options: f.filling.options, preferredId: f.filling.preferredId }
    }));
  }, [baseRawVersion]);

  const draftSlots = useMemo((): IFillingSlotData[] | undefined => {
    if (!draftRawVersion) return undefined;
    const fillings = draftRawVersion.fillings as
      | Array<{
          slotId: string;
          name?: string;
          filling: { options: Array<{ type: 'recipe' | 'ingredient'; id: string }>; preferredId?: string };
        }>
      | undefined;
    if (!fillings) return undefined;
    return fillings.map((f) => ({
      slotId: f.slotId,
      name: f.name,
      filling: { options: f.filling.options, preferredId: f.filling.preferredId }
    }));
  }, [draftRawVersion]);

  // Production selections (for this run, not recipe edit)
  const productionSelections = useMemo(() => {
    const selections = session.production?.fillingSelections;
    return selections as Readonly<Record<SlotId, string>> | undefined;
  }, [session.production?.fillingSelections]);

  const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

  const onUpdateDraft = useCallback(
    (slots: IFillingSlotData[]) => {
      if (!baseRawVersion) return;
      const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
      nextDraft.fillings = slots;
      updateConfectionDraft(session.sessionId, { draftVersion: nextDraft as unknown });
    },
    [baseRawVersion, draftRawVersion, session.sessionId, updateConfectionDraft]
  );

  const onResetDraft = useCallback(() => {
    updateConfectionDraft(session.sessionId, { draftVersion: undefined });
  }, [session.sessionId, updateConfectionDraft]);

  const onSelectProduction = useCallback(
    (slotId: SlotId, fillingId: string) => {
      const existingSelections = session.production?.fillingSelections ?? {};
      updateConfectionProduction(session.sessionId, {
        fillingSelections: {
          ...existingSelections,
          [slotId]: fillingId
        } as Record<SlotId, string>
      });
    },
    [session.sessionId, session.production?.fillingSelections, updateConfectionProduction]
  );

  return ProductionTools.useFillingSlotManagement({
    baseSlots,
    draftSlots,
    onUpdateDraft,
    onResetDraft,
    productionSelections,
    onSelectProduction
  });
}

/**
 * Hook to adapt draft editing for procedures
 */
function useProcedureAdapter(
  session: PersistedConfectionSession,
  baseRawVersion: Record<string, unknown> | undefined,
  draftRawVersion: Record<string, unknown> | undefined
) {
  const { updateConfectionDraft, updateConfectionProduction } = useSessionScratchpad();

  const baseSpec = useMemo((): IProcedureSpec | undefined => {
    const procs = baseRawVersion?.procedures as
      | { options: Array<{ id: string; notes?: string }>; preferredId?: string }
      | undefined;
    if (!procs) return undefined;
    return { options: procs.options, preferredId: procs.preferredId };
  }, [baseRawVersion]);

  const draftSpec = useMemo((): IProcedureSpec | undefined => {
    if (!draftRawVersion) return undefined;
    const procs = draftRawVersion.procedures as
      | { options: Array<{ id: string; notes?: string }>; preferredId?: string }
      | undefined;
    if (!procs) return undefined;
    return { options: procs.options, preferredId: procs.preferredId };
  }, [draftRawVersion]);

  // Production selection (for this run, not recipe edit)
  const productionSelectedId = (session.production?.procedureId as unknown as string) ?? undefined;

  const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

  const onUpdateDraft = useCallback(
    (spec: IProcedureSpec) => {
      if (!baseRawVersion) return;
      const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
      nextDraft.procedures = spec;
      updateConfectionDraft(session.sessionId, { draftVersion: nextDraft as unknown });
    },
    [baseRawVersion, draftRawVersion, session.sessionId, updateConfectionDraft]
  );

  const onResetDraft = useCallback(() => {
    updateConfectionDraft(session.sessionId, { draftVersion: undefined });
  }, [session.sessionId, updateConfectionDraft]);

  const onSelectProduction = useCallback(
    (id: string) => {
      updateConfectionProduction(session.sessionId, {
        procedureId: id as unknown as ProcedureId
      });
    },
    [session.sessionId, updateConfectionProduction]
  );

  return ProductionTools.useProcedureSelection({
    baseSpec,
    draftSpec,
    onUpdateDraft,
    onResetDraft,
    productionSelectedId,
    onSelectProduction
  });
}

/**
 * Hook to adapt draft editing for molds
 */
function useMoldAdapter(
  session: PersistedConfectionSession,
  baseRawVersion: Record<string, unknown> | undefined,
  draftRawVersion: Record<string, unknown> | undefined
) {
  const { updateConfectionDraft, updateConfectionProduction } = useSessionScratchpad();

  const baseSpec = useMemo((): IMoldSpec | undefined => {
    const molds = baseRawVersion?.molds as
      | { options: Array<{ id: string; notes?: string }>; preferredId?: string }
      | undefined;
    if (!molds) return undefined;
    return { options: molds.options, preferredId: molds.preferredId };
  }, [baseRawVersion]);

  const draftSpec = useMemo((): IMoldSpec | undefined => {
    if (!draftRawVersion) return undefined;
    const molds = draftRawVersion.molds as
      | { options: Array<{ id: string; notes?: string }>; preferredId?: string }
      | undefined;
    if (!molds) return undefined;
    return { options: molds.options, preferredId: molds.preferredId };
  }, [draftRawVersion]);

  // Production selection - moldId is stored in session.production.moldId
  const productionSelectedId = (session.production?.moldId as unknown as string) ?? undefined;

  const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

  const onUpdateDraft = useCallback(
    (spec: IMoldSpec) => {
      if (!baseRawVersion) return;
      const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
      nextDraft.molds = spec;
      updateConfectionDraft(session.sessionId, { draftVersion: nextDraft as unknown });
    },
    [baseRawVersion, draftRawVersion, session.sessionId, updateConfectionDraft]
  );

  const onResetDraft = useCallback(() => {
    updateConfectionDraft(session.sessionId, { draftVersion: undefined });
  }, [session.sessionId, updateConfectionDraft]);

  const onSelectProduction = useCallback(
    (id: string) => {
      updateConfectionProduction(session.sessionId, {
        moldId: id as unknown as MoldId
      });
    },
    [session.sessionId, updateConfectionProduction]
  );

  return ProductionTools.useMoldSelection({
    baseSpec,
    draftSpec,
    onUpdateDraft,
    onResetDraft,
    productionSelectedId,
    onSelectProduction
  });
}

/**
 * Production session row component that displays a single session
 * with its editing controls when active.
 */
export function ProductionSessionRow({
  session,
  isActive,
  onCommit,
  onAbandon,
  onDelete
}: IProductionSessionRowProps): React.ReactElement {
  const { runtime } = useChocolate();
  const { setActiveSessionId, updateSessionDestination } = useSessionScratchpad();

  // Extract version data
  const { baseRawVersion, draftRawVersion, confection } = useVersionData(session);

  // Use the new composable hooks
  const { state: sessionState, actions: sessionActions } = useProductionSessionAdapter(session);
  const { state: shellState, actions: shellActions } = useShellChocolateAdapter(
    session,
    baseRawVersion,
    draftRawVersion
  );
  const {
    slots,
    actions: slotActions,
    hasChanges: slotsHasChanges
  } = useFillingSlotAdapter(session, baseRawVersion, draftRawVersion);
  const { state: procedureState, actions: procedureActions } = useProcedureAdapter(
    session,
    baseRawVersion,
    draftRawVersion
  );
  const { state: moldState, actions: moldActions } = useMoldAdapter(session, baseRawVersion, draftRawVersion);

  // Get mold options from the mold state (which includes draft changes)
  const moldOptions = useMemo(() => {
    return moldState.options.map((opt) => ({ id: opt.id as unknown as MoldId }));
  }, [moldState.options]);

  // Get mutable confection collections
  const mutableCollectionIds = useMemo((): SourceId[] => {
    if (!runtime) return [];
    return (Array.from(runtime.library.confections.collections.keys()) as SourceId[]).filter((id) => {
      const c = runtime.library.confections.collections.get(id).asResult;
      return c.isSuccess() && c.value.isMutable;
    });
  }, [runtime]);

  // Compute display title
  const displayTitle = useMemo(() => {
    if (session.label?.trim()) return session.label;
    if (!confection) return session.sessionId as unknown as string;
    const name = confection.name as unknown as string;
    const isGolden = confection.goldenVersionSpec === session.base.versionSpec;
    return isGolden ? name : `${name} (${session.base.versionSpec as unknown as string})`;
  }, [session, confection]);

  const subtitle = `${session.base.confectionId as unknown as string}@${
    session.base.versionSpec as unknown as string
  }`;

  // Handlers
  const handleRename = useCallback(() => {
    const next = window.prompt('Session name', session.label ?? '');
    if (next === null) return;
    sessionActions.rename(next);
  }, [session.label, sessionActions]);

  const handleMoldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      sessionActions.selectMold(value || undefined);
    },
    [sessionActions]
  );

  const handleFramesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (Number.isFinite(n) && Number.isInteger(n) && n > 0) {
        sessionActions.setFrames(n);
      }
    },
    [sessionActions]
  );

  const isMoldedBonBon = confection?.isMoldedBonBon?.() ?? false;

  // Picker dialog state
  const [fillingPickerSlotId, setFillingPickerSlotId] = useState<SlotId | null>(null);
  const [showChocolatePicker, setShowChocolatePicker] = useState(false);
  const [showProcedurePicker, setShowProcedurePicker] = useState(false);
  const [showMoldPicker, setShowMoldPicker] = useState(false);

  // Available items for pickers
  const availableFillings = useMemo((): IPickerItem[] => {
    if (!runtime) return [];
    return Array.from(runtime.fillings.values()).map((f) => ({
      id: f.id as unknown as string,
      name: f.name as unknown as string
    }));
  }, [runtime]);

  const availableChocolates = useMemo((): IPickerItem[] => {
    if (!runtime) return [];
    // Filter to chocolate ingredients
    return Array.from(runtime.ingredients.values())
      .filter((i) => {
        const category = (i as unknown as { category?: string }).category;
        return category === 'chocolate' || category === 'couverture';
      })
      .map((i) => ({
        id: i.id as unknown as string,
        name: i.name as unknown as string,
        description: (i as unknown as { category?: string }).category
      }));
  }, [runtime]);

  const availableProcedures = useMemo((): IPickerItem[] => {
    if (!runtime) return [];
    return Array.from(runtime.library.procedures.entries()).map(([id, p]) => ({
      id: id as unknown as string,
      name: (p as unknown as { name: string }).name
    }));
  }, [runtime]);

  const availableMolds = useMemo((): IPickerItem[] => {
    if (!runtime) return [];
    const items: IPickerItem[] = [];
    for (const [id] of runtime.library.molds.entries()) {
      const moldResult = runtime.getRuntimeMold(id as MoldId);
      if (moldResult.isSuccess()) {
        const mold = moldResult.value;
        items.push({
          id: id as unknown as string,
          name: mold.displayName ?? (id as unknown as string),
          description: `${mold.cavityCount} cavities`
        });
      }
    }
    return items;
  }, [runtime]);

  // Get existing IDs for exclusion
  const existingChocolateIds = useMemo(() => shellState.availableChoices, [shellState.availableChoices]);
  const existingProcedureIds = useMemo(
    () => procedureState.options.map((o) => o.id),
    [procedureState.options]
  );
  const existingMoldIds = useMemo(() => moldOptions.map((o) => o.id as unknown as string), [moldOptions]);
  const getExistingFillingIdsForSlot = useCallback(
    (slotId: SlotId): string[] => {
      const slot = slots.find((s) => s.slotId === slotId);
      return slot?.options.map((o) => o.id) ?? [];
    },
    [slots]
  );

  // Picker handlers
  const handleAddFillingOption = useCallback((slotId: SlotId) => {
    setFillingPickerSlotId(slotId);
  }, []);

  const handleFillingSelect = useCallback(
    (item: IPickerItem) => {
      if (fillingPickerSlotId) {
        slotActions.addFillingOption(fillingPickerSlotId, { type: 'recipe', id: item.id });
      }
      setFillingPickerSlotId(null);
    },
    [fillingPickerSlotId, slotActions]
  );

  const handleChocolateSelect = useCallback(
    (item: IPickerItem) => {
      shellActions.addChoice(item.id);
      setShowChocolatePicker(false);
    },
    [shellActions]
  );

  const handleProcedureSelect = useCallback(
    (item: IPickerItem) => {
      procedureActions.addOption({ id: item.id });
      setShowProcedurePicker(false);
    },
    [procedureActions]
  );

  const handleMoldSelect = useCallback(
    (item: IPickerItem) => {
      // Check if this mold is already in the options
      const isExisting = moldState.options.some((opt) => opt.id === item.id);

      if (!isExisting) {
        // Add the mold to the draft (this creates a recipe edit)
        moldActions.addOption({ id: item.id });
      }

      // Also set as production mold
      sessionActions.selectMold(item.id);
      setShowMoldPicker(false);
    },
    [moldState.options, moldActions, sessionActions]
  );

  return (
    <React.Fragment>
      {/* Session header row */}
      <div
        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md border ${
          isActive
            ? 'border-chocolate-400 bg-chocolate-50 dark:border-chocolate-600 dark:bg-chocolate-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
        }`}
      >
        <button
          type="button"
          className="flex-1 text-left min-w-0"
          onClick={() => setActiveSessionId(session.sessionId)}
        >
          <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{displayTitle}</div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400 font-mono">{subtitle}</div>
        </button>

        <span className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
          {sessionState.status}
        </span>

        <button
          type="button"
          onClick={handleRename}
          className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Rename
        </button>

        <button
          type="button"
          onClick={() => onCommit(session)}
          disabled={session.status === 'committed' || session.status === 'abandoned'}
          className="px-2 py-1 text-xs rounded-md bg-chocolate-600 text-white hover:bg-chocolate-700 disabled:opacity-50"
        >
          Commit
        </button>

        <button
          type="button"
          onClick={() => onAbandon(session.sessionId)}
          disabled={session.status === 'committed' || session.status === 'abandoned'}
          className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          Abandon
        </button>

        <button
          type="button"
          onClick={() => onDelete(session.sessionId)}
          className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Delete
        </button>
      </div>

      {/* Active session panel */}
      {isActive && isMoldedBonBon && (
        <div className="ml-6 p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Active Session</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{subtitle}</p>
          </div>

          {/* Mold and Frames */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400">Mold</label>
                {moldState.hasChanges && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Modified</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                  value={sessionState.moldId ?? ''}
                  onChange={handleMoldChange}
                >
                  <option value="">Unspecified</option>
                  {moldOptions.map((opt) => {
                    const mold = runtime?.getRuntimeMold(opt.id).orDefault(undefined);
                    const displayName = mold?.displayName ?? mold?.name ?? (opt.id as unknown as string);
                    return (
                      <option key={opt.id as unknown as string} value={opt.id as unknown as string}>
                        {displayName}
                      </option>
                    );
                  })}
                  {/* Show current selection if not in options */}
                  {sessionState.moldId &&
                    !moldOptions.some((o) => (o.id as unknown as string) === sessionState.moldId) && (
                      <option value={sessionState.moldId}>
                        {runtime?.getRuntimeMold(sessionState.moldId as MoldId).orDefault(undefined)
                          ?.displayName ??
                          runtime?.getRuntimeMold(sessionState.moldId as MoldId).orDefault(undefined)?.name ??
                          sessionState.moldId}
                      </option>
                    )}
                </select>
                <button
                  type="button"
                  onClick={() => setShowMoldPicker(true)}
                  className="px-2 py-2 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-chocolate-600 dark:text-chocolate-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  title="Pick any mold from library"
                >
                  Pick...
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Frames</label>
              <input
                className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                type="number"
                min={1}
                step={1}
                value={sessionState.frames}
                onChange={handleFramesChange}
              />
            </div>
          </div>

          {/* Yield calculation */}
          {sessionState.scaledYieldCount !== undefined && (
            <div className="text-sm text-gray-700 dark:text-gray-200">
              {runtime?.getRuntimeMold(sessionState.moldId as MoldId).orDefault(undefined)?.cavityCount ?? 0}{' '}
              cavities × {sessionState.frames} frames ={' '}
              <span className="font-semibold">{sessionState.scaledYieldCount}</span> pieces
            </div>
          )}

          {/* Fillings */}
          {slots.length > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <ProductionTools.FillingSlotManager
                slots={slots}
                actions={slotActions}
                hasChanges={slotsHasChanges}
                getFillingName={(opt: IFillingOption) => {
                  if (opt.type === 'recipe') {
                    return (
                      runtime?.getRuntimeFilling(opt.id as FillingId).orDefault(undefined)?.name ?? opt.id
                    );
                  }
                  return (
                    runtime?.getRuntimeIngredient(opt.id as IngredientId).orDefault(undefined)?.name ?? opt.id
                  );
                }}
                onAddFillingOption={handleAddFillingOption}
              />
            </div>
          )}

          {/* Procedures */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <ProductionTools.ProcedureSelector
              state={procedureState}
              actions={procedureActions}
              getProcedureName={(id) =>
                runtime?.getRuntimeProcedure(id as ProcedureId).orDefault(undefined)?.name ?? id
              }
              onAddProcedure={() => setShowProcedurePicker(true)}
            />
          </div>

          {/* Shell Chocolate */}
          {shellState.availableChoices.length > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <ProductionTools.ShellChocolateSelector
                state={shellState}
                actions={shellActions}
                getChocolateName={(id) =>
                  runtime?.getRuntimeIngredient(id as IngredientId).orDefault(undefined)?.name ?? id
                }
                onAddChocolate={() => setShowChocolatePicker(true)}
              />
            </div>
          )}

          {/* Destination Collection */}
          {mutableCollectionIds.length > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Destination collection
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-500 dark:text-gray-500 mb-1">Default</label>
                  <select
                    className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                    value={(session.destination?.defaultCollectionId as unknown as string) ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateSessionDestination(session.sessionId, {
                        defaultCollectionId: value ? (value as unknown as SourceId) : undefined,
                        overrideCollectionId: session.destination?.overrideCollectionId
                      });
                    }}
                  >
                    <option value="">Auto</option>
                    {mutableCollectionIds.map((id) => (
                      <option key={id as unknown as string} value={id as unknown as string}>
                        {id as unknown as string}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 dark:text-gray-500 mb-1">Override</label>
                  <select
                    className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                    value={(session.destination?.overrideCollectionId as unknown as string) ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateSessionDestination(session.sessionId, {
                        defaultCollectionId: session.destination?.defaultCollectionId,
                        overrideCollectionId: value ? (value as unknown as SourceId) : undefined
                      });
                    }}
                  >
                    <option value="">None</option>
                    {mutableCollectionIds.map((id) => (
                      <option key={id as unknown as string} value={id as unknown as string}>
                        {id as unknown as string}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Picker Dialogs */}
      <ProductionTools.ItemPickerDialog
        isOpen={fillingPickerSlotId !== null}
        title="Add Filling Option"
        items={availableFillings}
        onSelect={handleFillingSelect}
        onClose={() => setFillingPickerSlotId(null)}
        excludeIds={fillingPickerSlotId ? getExistingFillingIdsForSlot(fillingPickerSlotId) : []}
        searchPlaceholder="Search fillings..."
        emptyMessage="No fillings available"
      />

      <ProductionTools.ItemPickerDialog
        isOpen={showChocolatePicker}
        title="Add Shell Chocolate"
        items={availableChocolates}
        onSelect={handleChocolateSelect}
        onClose={() => setShowChocolatePicker(false)}
        excludeIds={existingChocolateIds}
        searchPlaceholder="Search chocolates..."
        emptyMessage="No chocolates available"
      />

      <ProductionTools.ItemPickerDialog
        isOpen={showProcedurePicker}
        title="Add Procedure Option"
        items={availableProcedures}
        onSelect={handleProcedureSelect}
        onClose={() => setShowProcedurePicker(false)}
        excludeIds={existingProcedureIds}
        searchPlaceholder="Search procedures..."
        emptyMessage="No procedures available"
      />

      <ProductionTools.ItemPickerDialog
        isOpen={showMoldPicker}
        title="Select Mold"
        items={availableMolds}
        onSelect={handleMoldSelect}
        onClose={() => setShowMoldPicker(false)}
        excludeIds={existingMoldIds}
        searchPlaceholder="Search molds..."
        emptyMessage="No molds available"
      />
    </React.Fragment>
  );
}
