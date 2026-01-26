import * as React from 'react';
import { useMemo, useState } from 'react';
import type {
  ConfectionId,
  ConfectionVersionSpec,
  FillingId,
  IngredientId,
  MoldId,
  ProcedureId,
  SlotId
} from '@fgv/ts-chocolate';
import { Converters, Entities, Runtime, type JournalId, type SourceId } from '@fgv/ts-chocolate';
import { useObservability } from '@fgv/ts-chocolate-ui';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { useEditing } from '../../../contexts/EditingContext';
import { useSessionScratchpad } from '../../../contexts/SessionScratchpadContext';

const LOCAL_JOURNAL_COLLECTIONS_KEY = 'chocolate-lab-web:journals:collections:v1';

function readLocalJournalCollections(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(LOCAL_JOURNAL_COLLECTIONS_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeLocalJournalCollections(next: Record<string, unknown>): void {
  window.localStorage.setItem(LOCAL_JOURNAL_COLLECTIONS_KEY, JSON.stringify(next));
}

function nextConfectionVersionSpec(existing: ReadonlyArray<{ versionSpec: string }>): ConfectionVersionSpec {
  const date = Runtime.Session.getCurrentDateString();
  const prefix = `${date}-`;
  let max = 0;
  for (const v of existing) {
    const spec = v.versionSpec;
    if (!spec.startsWith(prefix)) {
      continue;
    }
    const suffix = spec.slice(prefix.length);
    const counter = Number(suffix.slice(0, 2));
    if (Number.isFinite(counter) && counter > max) {
      max = counter;
    }
  }
  const next = String(max + 1).padStart(2, '0');
  return `${date}-${next}` as unknown as ConfectionVersionSpec;
}

function getConfectionSourceId(id: ConfectionId): SourceId {
  return (id as unknown as string).split('.')[0] as unknown as SourceId;
}

function getConfectionBaseId(id: ConfectionId): string {
  return (id as unknown as string).split('.')[1] ?? '';
}

function upsertJournalToLocalCollection(params: {
  collectionId: SourceId;
  journalId: JournalId;
  journal: Entities.Journal.AnyJournalRecord;
}): void {
  const all = readLocalJournalCollections();
  const existing = all[params.collectionId as unknown as string];
  const baseObject: Record<string, unknown> =
    typeof existing === 'object' && existing !== null && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  const itemsObject: Record<string, unknown> =
    typeof baseObject.items === 'object' && baseObject.items !== null && !Array.isArray(baseObject.items)
      ? (baseObject.items as Record<string, unknown>)
      : {};

  itemsObject[params.journalId as unknown as string] = params.journal as unknown;

  const nextCollection = {
    ...baseObject,
    metadata:
      typeof baseObject.metadata === 'object' &&
      baseObject.metadata !== null &&
      !Array.isArray(baseObject.metadata)
        ? baseObject.metadata
        : { name: params.collectionId as unknown as string },
    items: itemsObject
  };

  all[params.collectionId as unknown as string] = nextCollection;
  writeLocalJournalCollections(all);
}

export function ProductionView({
  selectedConfectionId
}: {
  selectedConfectionId: ConfectionId | null;
}): React.ReactElement {
  const { runtime, loadingState } = useChocolate();
  const { commitConfectionCollection } = useEditing();
  const { user, diag } = useObservability();
  const {
    scratchpad,
    createConfectionSession,
    deleteSession,
    setActiveSessionId,
    setSessionStatus,
    updateSessionDestination,
    updateConfectionProduction,
    updateConfectionDraft,
    updateSessionLabel
  } = useSessionScratchpad();

  const [error, setError] = useState<string | null>(null);

  const cloneJson = <T,>(value: T): T => {
    return JSON.parse(JSON.stringify(value)) as T;
  };

  const isJsonEqual = (a: unknown, b: unknown): boolean => {
    const normalize = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map((v) => normalize(v));
      }
      if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj).sort();
        const normalized: Record<string, unknown> = {};
        for (const k of keys) {
          normalized[k] = normalize(obj[k]);
        }
        return normalized;
      }
      return value;
    };

    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  };

  const sessions = useMemo(() => {
    return Object.values(scratchpad.sessions)
      .filter((s) => s.sessionType === 'confection')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [scratchpad.sessions]);

  const selectedConfection = useMemo(() => {
    if (!runtime || !selectedConfectionId) {
      return null;
    }
    const r = runtime.getRuntimeConfection(selectedConfectionId);
    return r.isSuccess() ? r.value : null;
  }, [runtime, selectedConfectionId]);

  const startFromSelected = (): void => {
    setError(null);
    if (!selectedConfectionId || !selectedConfection) {
      setError('Select a confection first (open it in Browse/Detail) to start a session.');
      return;
    }

    const versionSpec = selectedConfection.goldenVersionSpec as unknown as ConfectionVersionSpec;

    const sessionId = createConfectionSession({
      confectionId: selectedConfectionId,
      versionSpec
    });

    setActiveSessionId(sessionId);
  };

  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Production Sessions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sessions.length} session{sessions.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          type="button"
          onClick={startFromSelected}
          className="px-3 py-2 rounded-md bg-chocolate-600 text-white hover:bg-chocolate-700 disabled:opacity-50"
          disabled={!selectedConfectionId}
          title={!selectedConfectionId ? 'Select a confection to start a session' : 'Start session'}
        >
          Start Session
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div className="p-6 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">No active sessions yet.</p>
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = scratchpad.activeSessionId === s.sessionId;

            const confectionForRow =
              runtime && s.sessionType === 'confection'
                ? runtime.getRuntimeConfection(s.base.confectionId).orDefault(undefined)
                : undefined;

            const moldOptions: Array<{ id: MoldId; mold?: unknown }> =
              (confectionForRow as unknown as { molds?: { options: Array<{ id: MoldId; mold?: unknown }> } })
                ?.molds?.options ?? [];

            const versionForRow =
              s.sessionType === 'confection' && confectionForRow
                ? confectionForRow.getVersion(s.base.versionSpec).orDefault(undefined)
                : undefined;
            const baseRawVersion = (versionForRow as unknown as { raw?: unknown })?.raw as
              | Record<string, unknown>
              | undefined;
            const draftRawVersion =
              s.sessionType === 'confection'
                ? (s.draft?.draftVersion as unknown as Record<string, unknown> | undefined) ?? undefined
                : undefined;
            const effectiveRawVersion = draftRawVersion ?? baseRawVersion;

            const baseShellSpec =
              (baseRawVersion?.shellChocolate as
                | { ids: IngredientId[]; preferredId?: IngredientId }
                | undefined) ?? undefined;
            const effectiveShellSpec =
              (effectiveRawVersion?.shellChocolate as
                | { ids: IngredientId[]; preferredId?: IngredientId }
                | undefined) ?? undefined;

            const shellChoices = effectiveShellSpec?.ids ?? [];
            const baseShellPreferredId = baseShellSpec?.preferredId ?? baseShellSpec?.ids?.[0];
            const effectiveShellPreferredId =
              effectiveShellSpec?.preferredId ?? effectiveShellSpec?.ids?.[0] ?? baseShellPreferredId;

            const baseFillings =
              (baseRawVersion?.fillings as
                | Array<{
                    slotId: SlotId;
                    name?: string;
                    filling: {
                      options: Array<{
                        type: 'recipe' | 'ingredient';
                        id: FillingId | IngredientId;
                        notes?: string;
                      }>;
                      preferredId?: FillingId | IngredientId;
                    };
                  }>
                | undefined) ?? undefined;

            const effectiveFillings =
              (effectiveRawVersion?.fillings as
                | Array<{
                    slotId: SlotId;
                    name?: string;
                    filling: {
                      options: Array<{
                        type: 'recipe' | 'ingredient';
                        id: FillingId | IngredientId;
                        notes?: string;
                      }>;
                      preferredId?: FillingId | IngredientId;
                    };
                  }>
                | undefined) ?? undefined;

            const baseProcedures =
              (baseRawVersion?.procedures as
                | {
                    options: Array<{ id: ProcedureId; notes?: string }>;
                    preferredId?: ProcedureId;
                  }
                | undefined) ?? undefined;

            const effectiveProcedures =
              (effectiveRawVersion?.procedures as
                | {
                    options: Array<{ id: ProcedureId; notes?: string }>;
                    preferredId?: ProcedureId;
                  }
                | undefined) ?? undefined;

            const baseProcedurePreferredId = baseProcedures?.preferredId ?? baseProcedures?.options?.[0]?.id;
            const effectiveProcedurePreferredId =
              effectiveProcedures?.preferredId ??
              effectiveProcedures?.options?.[0]?.id ??
              baseProcedurePreferredId;

            const mutableConfectionCollectionIds: SourceId[] = runtime
              ? (Array.from(runtime.library.confections.collections.keys()) as SourceId[]).filter((id) => {
                  const c = runtime.library.confections.collections.get(id).asResult;
                  return c.isSuccess() && c.value.isMutable;
                })
              : [];

            const destinationDefault = s.destination?.defaultCollectionId;
            const destinationOverride = s.destination?.overrideCollectionId;

            const production = s.sessionType === 'confection' ? s.production : undefined;
            const selectedMoldId = production?.moldId;
            const selectedMold =
              runtime && selectedMoldId
                ? runtime.getRuntimeMold(selectedMoldId).orDefault(undefined)
                : undefined;
            const frames = production?.frames ?? 1;
            const scaledYieldCount = selectedMold ? selectedMold.cavityCount * frames : undefined;

            const confectionId = s.sessionType === 'confection' ? s.base.confectionId : undefined;
            const versionSpec = s.sessionType === 'confection' ? s.base.versionSpec : undefined;
            const subtitle =
              s.sessionType === 'confection'
                ? `${confectionId as unknown as string}@${versionSpec as unknown as string}`
                : (s.sessionId as unknown as string);

            let computedTitle: string;
            if (s.sessionType === 'confection' && runtime && confectionId && versionSpec) {
              const confectionResult = runtime.getRuntimeConfection(confectionId);
              const confectionName = confectionResult.isSuccess()
                ? (confectionResult.value.name as unknown as string)
                : (confectionId as unknown as string);
              const isGolden =
                confectionResult.isSuccess() && confectionResult.value.goldenVersionSpec === versionSpec;

              computedTitle = `${confectionName}${!isGolden ? ` (${versionSpec as unknown as string})` : ''}`;
            } else {
              computedTitle = s.sessionId as unknown as string;
            }

            const rowTitle = s.label?.trim().length ? s.label : computedTitle;

            const statusLabel = s.status;

            const onRename = (): void => {
              const next = window.prompt('Session name', s.label ?? '');
              if (next === null) {
                return;
              }
              updateSessionLabel(s.sessionId, next);
            };

            const onAbandon = (): void => {
              const ok = window.confirm('Mark this session as abandoned?');
              if (!ok) {
                return;
              }
              setSessionStatus(s.sessionId, 'abandoned');
            };

            const onCommit = (): void => {
              if (!runtime || s.sessionType !== 'confection') {
                return;
              }

              user.info(`Committing session ${s.sessionId as unknown as string}...`);

              const confectionResult = runtime.getRuntimeConfection(s.base.confectionId);
              if (confectionResult.isFailure()) {
                setError(confectionResult.message);
                user.error(confectionResult.message);
                return;
              }

              const versionResult = confectionResult.value.getVersion(s.base.versionSpec);
              if (versionResult.isFailure()) {
                setError(versionResult.message);
                user.error(versionResult.message);
                return;
              }

              void (async () => {
                setError(null);

                const sessionFrames = s.production?.frames;
                const sessionMoldId = s.production?.moldId;
                const sessionMold = sessionMoldId
                  ? runtime.getRuntimeMold(sessionMoldId).orDefault(undefined)
                  : undefined;
                const scaledYield =
                  sessionMold && sessionFrames && sessionFrames > 0
                    ? sessionMold.cavityCount * sessionFrames
                    : undefined;

                const baseConfectionId = s.base.confectionId;
                const baseVersionSpec = s.base.versionSpec;

                let targetConfectionId = baseConfectionId;
                let targetVersionSpec = baseVersionSpec;

                const shellChanged =
                  baseShellSpec &&
                  effectiveShellPreferredId !== undefined &&
                  baseShellPreferredId !== undefined &&
                  effectiveShellPreferredId !== baseShellPreferredId;

                const fillingChanges: Array<{
                  slotId: SlotId;
                  previousOptionId?: FillingId | IngredientId;
                  nextOptionId: FillingId | IngredientId;
                  nextType: 'recipe' | 'ingredient';
                  previousType?: 'recipe' | 'ingredient';
                }> = [];

                const effectiveFillingsForCommit = effectiveFillings ?? [];
                for (const slot of effectiveFillingsForCommit) {
                  const baseSlot = (baseFillings ?? []).find((b) => b.slotId === slot.slotId);
                  const basePreferred = baseSlot?.filling.preferredId ?? baseSlot?.filling.options?.[0]?.id;
                  const desired = slot.filling.preferredId ?? slot.filling.options?.[0]?.id;

                  if (!desired) {
                    continue;
                  }

                  const desiredOpt = slot.filling.options.find((o) => o.id === desired);
                  if (!desiredOpt) {
                    setError('Selected filling option is not in the allowed options for this version');
                    return;
                  }

                  if (basePreferred && desired !== basePreferred) {
                    const previousOpt = baseSlot?.filling.options.find((o) => o.id === basePreferred);
                    fillingChanges.push({
                      slotId: slot.slotId,
                      previousOptionId: basePreferred,
                      nextOptionId: desired,
                      nextType: desiredOpt.type,
                      previousType: previousOpt?.type
                    });
                  }
                }

                const fillingsChanged = fillingChanges.length > 0;

                const procedureChanged =
                  effectiveProcedures &&
                  effectiveProcedurePreferredId !== undefined &&
                  baseProcedurePreferredId !== undefined &&
                  effectiveProcedurePreferredId !== baseProcedurePreferredId;

                const recipeChanged = draftRawVersion !== undefined;

                if (!recipeChanged) {
                  diag.info(
                    `Session ${
                      s.sessionId as unknown as string
                    } commit: no draftVersion present; commit will be journal-only.`
                  );
                }

                if (recipeChanged) {
                  const desiredShell = effectiveShellPreferredId as IngredientId | undefined;
                  if (shellChanged) {
                    if (!desiredShell || !shellChoices.includes(desiredShell)) {
                      setError('Selected shell chocolate is not in the allowed options for this version');
                      user.error('Selected shell chocolate is not in the allowed options for this version');
                      return;
                    }
                  }

                  const desiredProcedure = effectiveProcedurePreferredId as ProcedureId | undefined;
                  if (procedureChanged) {
                    if (
                      !desiredProcedure ||
                      !effectiveProcedures?.options?.some((o) => o.id === desiredProcedure)
                    ) {
                      setError('Selected procedure is not in the allowed options for this version');
                      user.error('Selected procedure is not in the allowed options for this version');
                      return;
                    }
                  }

                  const sourceId = getConfectionSourceId(baseConfectionId);

                  const isMutableConfectionCollection = (id: SourceId): boolean => {
                    const c = runtime.library.confections.collections.get(id).asResult;
                    return c.isSuccess() && c.value.isMutable;
                  };

                  let destination: SourceId | undefined;
                  if (destinationOverride) {
                    if (!isMutableConfectionCollection(destinationOverride)) {
                      setError(
                        `Override destination "${destinationOverride as unknown as string}" is not mutable`
                      );
                      user.error(
                        `Override destination "${destinationOverride as unknown as string}" is not mutable`
                      );
                      return;
                    }
                    destination = destinationOverride;
                  } else if (destinationDefault) {
                    if (!isMutableConfectionCollection(destinationDefault)) {
                      setError(
                        `Default destination "${destinationDefault as unknown as string}" is not mutable`
                      );
                      user.error(
                        `Default destination "${destinationDefault as unknown as string}" is not mutable`
                      );
                      return;
                    }
                    destination = destinationDefault;
                  } else if (isMutableConfectionCollection(sourceId)) {
                    destination = sourceId;
                  } else {
                    destination = mutableConfectionCollectionIds[0];
                  }

                  if (!destination) {
                    setError('No mutable confection collection available to save a new version');
                    user.error('No mutable confection collection available to save a new version');
                    return;
                  }

                  const baseIdString = getConfectionBaseId(baseConfectionId);
                  const baseIdResult = Converters.baseConfectionId.convert(baseIdString);
                  if (baseIdResult.isFailure()) {
                    setError(baseIdResult.message);
                    user.error(baseIdResult.message);
                    return;
                  }

                  const confectionResult = runtime.library.getConfection(baseConfectionId);
                  if (confectionResult.isFailure()) {
                    setError(confectionResult.message);
                    user.error(confectionResult.message);
                    return;
                  }

                  const rawConfection = confectionResult.value;
                  const rawVersions = rawConfection.versions as ReadonlyArray<Record<string, unknown>>;
                  const rawVersion = rawVersions.find(
                    (v) => v.versionSpec === (baseVersionSpec as unknown as string)
                  );
                  if (!rawVersion) {
                    setError(`Version ${baseVersionSpec as unknown as string} not found`);
                    user.error(`Version ${baseVersionSpec as unknown as string} not found`);
                    return;
                  }

                  const newVersionSpec = nextConfectionVersionSpec(
                    rawConfection.versions as unknown as ReadonlyArray<{ versionSpec: string }>
                  );

                  const newVersion: Record<string, unknown> = {
                    ...(draftRawVersion ? cloneJson(draftRawVersion) : cloneJson(rawVersion)),
                    versionSpec: newVersionSpec as unknown as string,
                    createdDate: new Date().toISOString()
                  };

                  const updatedConfection: Record<string, unknown> = {
                    ...rawConfection,
                    goldenVersionSpec: newVersionSpec as unknown as string,
                    versions: [...rawVersions, newVersion]
                  };

                  const validated = Entities.Confections.Converters.confectionData.convert(updatedConfection);
                  if (validated.isFailure()) {
                    setError(validated.message);
                    user.error(validated.message);
                    return;
                  }

                  const collectionResult = runtime.library.confections.collections.get(destination).asResult;
                  if (collectionResult.isFailure()) {
                    setError(collectionResult.message);
                    user.error(collectionResult.message);
                    return;
                  }
                  if (!collectionResult.value.isMutable) {
                    setError(`Collection "${destination as unknown as string}" is not mutable`);
                    user.error(`Collection "${destination as unknown as string}" is not mutable`);
                    return;
                  }

                  if (collectionResult.value.items.has(baseIdResult.value)) {
                    // allow overwrite only if it's the same confection being edited
                    // (baseId collision across different sources isn't representable here)
                  }

                  const setResult = collectionResult.value.items.validating.set(
                    baseIdResult.value,
                    validated.value
                  ).asResult;
                  if (setResult.isFailure()) {
                    setError(setResult.message);
                    user.error(setResult.message);
                    return;
                  }

                  const persistResult = await commitConfectionCollection(destination);
                  if (persistResult.isFailure()) {
                    setError(persistResult.message);
                    user.error(persistResult.message);
                    return;
                  }

                  targetConfectionId = `${destination as unknown as string}.${
                    baseIdResult.value as unknown as string
                  }` as unknown as ConfectionId;
                  targetVersionSpec = newVersionSpec;

                  user.success(
                    `Saved new confection version ${targetConfectionId as unknown as string}@${
                      targetVersionSpec as unknown as string
                    }`
                  );

                  updateConfectionDraft(s.sessionId, { draftVersion: undefined });
                } else {
                  user.info('No recipe edits detected; recording production journal only.');
                }

                const journalId = Runtime.Session.generateJournalId().orThrow();
                const confectionVersionId = Converters.confectionVersionId
                  .convert(
                    `${targetConfectionId as unknown as string}@${targetVersionSpec as unknown as string}`
                  )
                  .orThrow();

                const entries: Entities.Journal.IConfectionJournalEntry[] = [];
                if (shellChanged && effectiveShellPreferredId) {
                  entries.push({
                    timestamp: Runtime.Session.getCurrentTimestamp(),
                    eventType: 'chocolate-select',
                    chocolateRole: 'shell',
                    ingredientId: effectiveShellPreferredId,
                    previousIngredientId: baseShellPreferredId
                  });
                }

                if (fillingsChanged) {
                  for (const change of fillingChanges) {
                    const entry: Entities.Journal.IConfectionJournalEntry = {
                      timestamp: Runtime.Session.getCurrentTimestamp(),
                      eventType: 'filling-select',
                      fillingSlotId: change.slotId
                    };

                    if (change.nextType === 'recipe') {
                      entry.fillingRecipeId = change.nextOptionId as unknown as FillingId;
                    } else {
                      entry.fillingIngredientId = change.nextOptionId as unknown as IngredientId;
                    }

                    if (change.previousOptionId) {
                      if (change.previousType === 'recipe') {
                        entry.previousFillingRecipeId = change.previousOptionId as unknown as FillingId;
                      } else if (change.previousType === 'ingredient') {
                        entry.previousFillingIngredientId =
                          change.previousOptionId as unknown as IngredientId;
                      }
                    }

                    entries.push(entry);
                  }
                }

                if (procedureChanged && effectiveProcedurePreferredId) {
                  entries.push({
                    timestamp: Runtime.Session.getCurrentTimestamp(),
                    eventType: 'procedure-select',
                    procedureId: effectiveProcedurePreferredId,
                    previousProcedureId: baseProcedurePreferredId
                  });
                }
                if (sessionMoldId) {
                  entries.push({
                    timestamp: Runtime.Session.getCurrentTimestamp(),
                    eventType: 'mold-select',
                    moldId: sessionMoldId
                  });
                }
                if (scaledYield !== undefined) {
                  entries.push({
                    timestamp: Runtime.Session.getCurrentTimestamp(),
                    eventType: 'yield-modify',
                    newYieldCount: scaledYield,
                    previousYieldCount: versionResult.value.yield.count
                  });
                }

                const journal: Entities.Journal.IConfectionJournalRecord = {
                  journalType: 'confection',
                  journalId,
                  confectionVersionId,
                  date: Runtime.Session.getCurrentDateString(),
                  yieldCount: scaledYield ?? versionResult.value.yield.count,
                  ...(versionResult.value.yield.weightPerPiece !== undefined
                    ? { weightPerPiece: versionResult.value.yield.weightPerPiece }
                    : {}),
                  ...(s.label ? { notes: s.label } : {}),
                  ...(entries.length > 0 ? { entries } : {})
                };

                const addResult = runtime.journals.addJournal(journal);
                if (addResult.isFailure()) {
                  setError(addResult.message);
                  user.error(addResult.message);
                  return;
                }

                upsertJournalToLocalCollection({
                  collectionId: 'local' as unknown as SourceId,
                  journalId,
                  journal
                });

                user.success(`Recorded journal ${journalId as unknown as string}`);

                setSessionStatus(s.sessionId, 'committed');
              })();
            };

            return (
              <React.Fragment key={s.sessionId as unknown as string}>
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
                    onClick={() => setActiveSessionId(s.sessionId)}
                  >
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {rowTitle}
                    </div>
                    <div className="truncate text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {subtitle}
                    </div>
                  </button>

                  <span className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                    {statusLabel}
                  </span>

                  <button
                    type="button"
                    onClick={onRename}
                    className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Rename
                  </button>

                  <button
                    type="button"
                    onClick={onCommit}
                    disabled={s.status === 'committed' || s.status === 'abandoned'}
                    className="px-2 py-1 text-xs rounded-md bg-chocolate-600 text-white hover:bg-chocolate-700 disabled:opacity-50"
                  >
                    Commit
                  </button>

                  <button
                    type="button"
                    onClick={onAbandon}
                    disabled={s.status === 'committed' || s.status === 'abandoned'}
                    className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    Abandon
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSession(s.sessionId)}
                    className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Delete
                  </button>
                </div>

                {isActive && confectionForRow?.isMoldedBonBon?.() ? (
                  <div className="ml-6 p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Active Session
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Mold</label>
                        <select
                          className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                          value={(selectedMoldId as unknown as string) ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const next = raw.length > 0 ? (raw as unknown as MoldId) : undefined;
                            updateConfectionProduction(s.sessionId, {
                              moldId: next,
                              frames: production?.frames
                            });
                          }}
                        >
                          <option value="">Unspecified</option>
                          {moldOptions.map((opt) => {
                            const displayName =
                              (opt.mold as unknown as { displayName?: string })?.displayName ??
                              (opt.mold as unknown as { name?: string })?.name ??
                              (opt.id as unknown as string);
                            return (
                              <option key={opt.id as unknown as string} value={opt.id as unknown as string}>
                                {displayName}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Frames</label>
                        <input
                          className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                          type="number"
                          min={1}
                          step={1}
                          value={production?.frames ?? 1}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            updateConfectionProduction(s.sessionId, {
                              moldId: production?.moldId,
                              frames: Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : undefined
                            });
                          }}
                        />
                      </div>
                    </div>

                    {selectedMold && scaledYieldCount !== undefined ? (
                      <div className="text-sm text-gray-700 dark:text-gray-200">
                        {selectedMold.cavityCount} cavities × {frames} frames ={' '}
                        <span className="font-semibold">{scaledYieldCount}</span> pieces
                      </div>
                    ) : null}

                    {effectiveFillings && effectiveFillings.length > 0 ? (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        <label className="block text-xs text-gray-600 dark:text-gray-400">Fillings</label>
                        {effectiveFillings.map((slot) => {
                          const baseSlot = (baseFillings ?? []).find((b) => b.slotId === slot.slotId);
                          const basePreferred =
                            baseSlot?.filling.preferredId ?? baseSlot?.filling.options?.[0]?.id;
                          const effectivePreferred =
                            slot.filling.preferredId ?? slot.filling.options?.[0]?.id;

                          const label = slot.name ?? (slot.slotId as unknown as string);

                          return (
                            <div key={slot.slotId as unknown as string} className="space-y-1">
                              <label className="block text-[11px] text-gray-500 dark:text-gray-500">
                                {label}
                              </label>
                              <select
                                className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                                value={(effectivePreferred as unknown as string) ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const next =
                                    raw.length > 0 ? (raw as unknown as FillingId | IngredientId) : undefined;
                                  if (!baseRawVersion) {
                                    return;
                                  }
                                  const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
                                  const nextFillings =
                                    (nextDraft.fillings as unknown as Array<Record<string, unknown>>) ?? [];
                                  const slotIx = nextFillings.findIndex(
                                    (f) =>
                                      (f.slotId as unknown as string) === (slot.slotId as unknown as string)
                                  );
                                  if (slotIx < 0) {
                                    return;
                                  }
                                  const existingSlot = nextFillings[slotIx];
                                  const filling =
                                    (existingSlot.filling as unknown as Record<string, unknown>) ?? {};
                                  const preferredId =
                                    next ??
                                    (filling.options as unknown as Array<{ id: unknown }> | undefined)?.[0]
                                      ?.id;
                                  nextFillings[slotIx] = {
                                    ...existingSlot,
                                    filling: {
                                      ...filling,
                                      ...(preferredId
                                        ? { preferredId: preferredId as unknown as string }
                                        : {})
                                    }
                                  };
                                  nextDraft.fillings = nextFillings;

                                  updateConfectionDraft(s.sessionId, {
                                    draftVersion: isJsonEqual(nextDraft, baseRawVersion)
                                      ? undefined
                                      : (nextDraft as any)
                                  });
                                }}
                              >
                                {slot.filling.options.map((opt) => {
                                  let name: string;
                                  if (opt.type === 'recipe') {
                                    name =
                                      runtime?.getRuntimeFilling(opt.id as FillingId).orDefault(undefined)
                                        ?.name ?? (opt.id as unknown as string);
                                  } else {
                                    name =
                                      runtime
                                        ?.getRuntimeIngredient(opt.id as IngredientId)
                                        .orDefault(undefined)?.name ?? (opt.id as unknown as string);
                                  }
                                  return (
                                    <option
                                      key={opt.id as unknown as string}
                                      value={opt.id as unknown as string}
                                    >
                                      {name}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            if (!baseRawVersion || !runtime) {
                              return;
                            }
                            const allFillings = Array.from(runtime.fillings.values());
                            if (allFillings.length === 0) {
                              return;
                            }
                            const firstFilling = allFillings[0];
                            const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
                            const nextFillings =
                              (nextDraft.fillings as unknown as Array<Record<string, unknown>>) ?? [];
                            const newSlotId = `slot-${Date.now()}`;
                            nextFillings.push({
                              slotId: newSlotId,
                              name: 'New Filling',
                              filling: {
                                options: [
                                  {
                                    type: 'recipe',
                                    id: firstFilling.id as unknown as string
                                  }
                                ],
                                preferredId: firstFilling.id as unknown as string
                              }
                            });
                            nextDraft.fillings = nextFillings;
                            updateConfectionDraft(s.sessionId, {
                              draftVersion: nextDraft as any
                            });
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          + Add Filling Slot
                        </button>
                      </div>
                    ) : null}

                    {effectiveProcedures && effectiveProcedures.options.length > 0 ? (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Procedure
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            className="flex-1 px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                            value={(effectiveProcedurePreferredId as unknown as string) ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const next = raw.length > 0 ? (raw as unknown as ProcedureId) : undefined;
                              if (!baseRawVersion) {
                                return;
                              }
                              const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
                              const existingProceduresObj = (nextDraft.procedures as unknown as Record<
                                string,
                                unknown
                              >) ?? {
                                options: []
                              };
                              nextDraft.procedures = {
                                ...existingProceduresObj,
                                ...(next ? { preferredId: next as unknown as string } : {})
                              };
                              updateConfectionDraft(s.sessionId, {
                                draftVersion: isJsonEqual(nextDraft, baseRawVersion)
                                  ? undefined
                                  : (nextDraft as any)
                              });
                            }}
                          >
                            {effectiveProcedures.options.map((opt) => {
                              const proc = runtime?.getRuntimeProcedure(opt.id).orDefault(undefined);
                              const label = proc?.name ?? (opt.id as unknown as string);
                              return (
                                <option key={opt.id as unknown as string} value={opt.id as unknown as string}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                          <button
                            type="button"
                            onClick={() => updateConfectionDraft(s.sessionId, { draftVersion: undefined })}
                            className="px-2 py-2 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Reset
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!baseRawVersion || !runtime) {
                              return;
                            }
                            const allProcedures = Array.from(runtime.procedures.values());
                            if (allProcedures.length === 0) {
                              return;
                            }
                            const firstProcedure = allProcedures[0];
                            const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
                            const nextProcedures =
                              (nextDraft.procedures as unknown as Record<string, unknown>) ?? {};
                            const existingOptions =
                              (nextProcedures.options as unknown as Array<Record<string, unknown>>) ?? [];
                            const newOption = {
                              id: firstProcedure.id as unknown as string,
                              notes: 'Added in production'
                            };
                            const alreadyExists = existingOptions.some(
                              (opt) =>
                                (opt.id as unknown as string) === (firstProcedure.id as unknown as string)
                            );
                            if (!alreadyExists) {
                              nextProcedures.options = [...existingOptions, newOption];
                              nextDraft.procedures = nextProcedures;
                              updateConfectionDraft(s.sessionId, {
                                draftVersion: nextDraft as any
                              });
                            }
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          + Add Procedure Option
                        </button>
                      </div>
                    ) : null}

                    {shellChoices.length > 0 ? (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Shell chocolate
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            className="flex-1 px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                            value={(effectiveShellPreferredId as unknown as string) ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const next = raw.length > 0 ? (raw as unknown as IngredientId) : undefined;
                              if (!baseRawVersion) {
                                return;
                              }
                              const nextDraft = cloneJson(draftRawVersion ?? baseRawVersion);
                              const existingShell = (nextDraft.shellChocolate as unknown as Record<
                                string,
                                unknown
                              >) ?? {
                                ids: []
                              };
                              nextDraft.shellChocolate = {
                                ...existingShell,
                                ...(next ? { preferredId: next as unknown as string } : {})
                              };
                              updateConfectionDraft(s.sessionId, {
                                draftVersion: isJsonEqual(nextDraft, baseRawVersion)
                                  ? undefined
                                  : (nextDraft as any)
                              });
                            }}
                          >
                            {shellChoices.map((id) => {
                              const ingredient = runtime?.getRuntimeIngredient(id).orDefault(undefined);
                              const label = ingredient?.name ?? (id as unknown as string);
                              return (
                                <option key={id as unknown as string} value={id as unknown as string}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                          <button
                            type="button"
                            onClick={() => updateConfectionDraft(s.sessionId, {})}
                            className="px-2 py-2 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {mutableConfectionCollectionIds.length > 0 ? (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Destination collection
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-gray-500 dark:text-gray-500 mb-1">
                              Default
                            </label>
                            <select
                              className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                              value={(destinationDefault as unknown as string) ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const next = raw.length > 0 ? (raw as unknown as SourceId) : undefined;
                                updateSessionDestination(s.sessionId, {
                                  defaultCollectionId: next,
                                  overrideCollectionId: destinationOverride
                                });
                              }}
                            >
                              <option value="">Auto</option>
                              {mutableConfectionCollectionIds.map((id) => (
                                <option key={id as unknown as string} value={id as unknown as string}>
                                  {id as unknown as string}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500 dark:text-gray-500 mb-1">
                              Override
                            </label>
                            <select
                              className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm"
                              value={(destinationOverride as unknown as string) ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const next = raw.length > 0 ? (raw as unknown as SourceId) : undefined;
                                updateSessionDestination(s.sessionId, {
                                  defaultCollectionId: destinationDefault,
                                  overrideCollectionId: next
                                });
                              }}
                            >
                              <option value="">None</option>
                              {mutableConfectionCollectionIds.map((id) => (
                                <option key={id as unknown as string} value={id as unknown as string}>
                                  {id as unknown as string}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
