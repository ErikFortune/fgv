/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type {
  ConfectionId,
  ConfectionVersionSpec,
  FillingId,
  IngredientId,
  MoldId,
  ProcedureId,
  SessionId,
  SlotId,
  SourceId
} from '@fgv/ts-chocolate';
import { Converters, Entities, Runtime, type JournalId } from '@fgv/ts-chocolate';
import { useObservability } from '@fgv/ts-chocolate-ui';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { useEditing } from '../../../contexts/EditingContext';
import { useSessionScratchpad } from '../../../contexts/SessionScratchpadContext';
import { ProductionSessionRow } from './ProductionSessionRow';

type PersistedConfectionSession = Runtime.Scratchpad.IPersistedConfectionSession;

const LOCAL_JOURNAL_COLLECTIONS_KEY = 'chocolate-lab-web:journals:collections:v1';

function readLocalJournalCollections(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(LOCAL_JOURNAL_COLLECTIONS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
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
    if (!v.versionSpec.startsWith(prefix)) continue;
    const counter = Number(v.versionSpec.slice(prefix.length, prefix.length + 2));
    if (Number.isFinite(counter) && counter > max) max = counter;
  }
  return `${date}-${String(max + 1).padStart(2, '0')}` as unknown as ConfectionVersionSpec;
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

  all[params.collectionId as unknown as string] = {
    ...baseObject,
    metadata:
      typeof baseObject.metadata === 'object' &&
      baseObject.metadata !== null &&
      !Array.isArray(baseObject.metadata)
        ? baseObject.metadata
        : { name: params.collectionId as unknown as string },
    items: itemsObject
  };
  writeLocalJournalCollections(all);
}

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export interface IProductionViewRefactoredProps {
  selectedConfectionId: ConfectionId | null;
}

/**
 * Refactored production view using composable hooks.
 * This version extracts session row rendering to ProductionSessionRow
 * while keeping the commit logic here.
 */
export function ProductionViewRefactored({
  selectedConfectionId
}: IProductionViewRefactoredProps): React.ReactElement {
  const { runtime, loadingState } = useChocolate();
  const { commitConfectionCollection } = useEditing();
  const { user, diag } = useObservability();
  const {
    scratchpad,
    createConfectionSession,
    deleteSession,
    setActiveSessionId,
    setSessionStatus,
    updateConfectionDraft
  } = useSessionScratchpad();

  const [error, setError] = useState<string | null>(null);

  // Get filtered and sorted sessions
  const sessions = useMemo(() => {
    return Object.values(scratchpad.sessions)
      .filter((s): s is PersistedConfectionSession => s.sessionType === 'confection')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [scratchpad.sessions]);

  // Get selected confection
  const selectedConfection = useMemo(() => {
    if (!runtime || !selectedConfectionId) return null;
    return runtime.getRuntimeConfection(selectedConfectionId).orDefault(null);
  }, [runtime, selectedConfectionId]);

  // Start session from selected confection
  const startFromSelected = useCallback((): void => {
    setError(null);
    if (!selectedConfectionId || !selectedConfection) {
      setError('Select a confection first (open it in Browse/Detail) to start a session.');
      return;
    }
    const versionSpec = selectedConfection.goldenVersionSpec as unknown as ConfectionVersionSpec;
    const sessionId = createConfectionSession({ confectionId: selectedConfectionId, versionSpec });
    setActiveSessionId(sessionId);
  }, [selectedConfectionId, selectedConfection, createConfectionSession, setActiveSessionId]);

  // Handle abandon
  const handleAbandon = useCallback(
    (sessionId: SessionId): void => {
      if (window.confirm('Mark this session as abandoned?')) {
        setSessionStatus(sessionId, 'abandoned');
      }
    },
    [setSessionStatus]
  );

  // Handle commit - this contains the complex commit logic
  const handleCommit = useCallback(
    (session: PersistedConfectionSession): void => {
      if (!runtime) return;

      user.info(`Committing session ${session.sessionId as unknown as string}...`);

      const confectionResult = runtime.getRuntimeConfection(session.base.confectionId);
      if (confectionResult.isFailure()) {
        setError(confectionResult.message);
        user.error(confectionResult.message);
        return;
      }

      const versionResult = confectionResult.value.getVersion(session.base.versionSpec);
      if (versionResult.isFailure()) {
        setError(versionResult.message);
        user.error(versionResult.message);
        return;
      }

      void (async () => {
        setError(null);

        // Extract session data
        const sessionMoldId = session.production?.moldId;
        const sessionFrames = session.production?.frames;
        const sessionMold = sessionMoldId
          ? runtime.getRuntimeMold(sessionMoldId).orDefault(undefined)
          : undefined;
        const scaledYield =
          sessionMold && sessionFrames && sessionFrames > 0
            ? sessionMold.cavityCount * sessionFrames
            : undefined;

        // Extract version data
        const baseRawVersion = (versionResult.value as unknown as { raw?: unknown })?.raw as
          | Record<string, unknown>
          | undefined;
        const draftRawVersion =
          (session.draft?.draftVersion as unknown as Record<string, unknown>) ?? undefined;

        // Extract shell chocolate specs
        const baseShellSpec = baseRawVersion?.shellChocolate as
          | { ids: IngredientId[]; preferredId?: IngredientId }
          | undefined;
        const effectiveShellSpec = (draftRawVersion ?? baseRawVersion)?.shellChocolate as
          | { ids: IngredientId[]; preferredId?: IngredientId }
          | undefined;

        const shellChoices = effectiveShellSpec?.ids ?? [];
        const baseShellPreferredId = baseShellSpec?.preferredId ?? baseShellSpec?.ids?.[0];
        const effectiveShellPreferredId =
          effectiveShellSpec?.preferredId ?? effectiveShellSpec?.ids?.[0] ?? baseShellPreferredId;

        // Extract filling specs
        type FillingSlotSpec = {
          slotId: SlotId;
          filling: {
            options: Array<{ type: 'recipe' | 'ingredient'; id: FillingId | IngredientId }>;
            preferredId?: FillingId | IngredientId;
          };
        };
        const baseFillings = baseRawVersion?.fillings as FillingSlotSpec[] | undefined;
        const effectiveFillings = (draftRawVersion ?? baseRawVersion)?.fillings as
          | FillingSlotSpec[]
          | undefined;

        // Extract procedure specs
        type ProcedureSpec = {
          options: Array<{ id: ProcedureId }>;
          preferredId?: ProcedureId;
        };
        const baseProcedures = baseRawVersion?.procedures as ProcedureSpec | undefined;
        const effectiveProcedures = (draftRawVersion ?? baseRawVersion)?.procedures as
          | ProcedureSpec
          | undefined;

        const baseProcedurePreferredId = baseProcedures?.preferredId ?? baseProcedures?.options?.[0]?.id;
        const effectiveProcedurePreferredId =
          effectiveProcedures?.preferredId ??
          effectiveProcedures?.options?.[0]?.id ??
          baseProcedurePreferredId;

        // Detect changes
        const baseConfectionId = session.base.confectionId;
        const baseVersionSpec = session.base.versionSpec;
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

        for (const slot of effectiveFillings ?? []) {
          const baseSlot = baseFillings?.find((b) => b.slotId === slot.slotId);
          const basePreferred = baseSlot?.filling.preferredId ?? baseSlot?.filling.options?.[0]?.id;
          const desired = slot.filling.preferredId ?? slot.filling.options?.[0]?.id;
          if (!desired) continue;

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
            `Session ${session.sessionId as unknown as string} commit: no draftVersion present; journal-only.`
          );
        }

        // Handle recipe changes - create new version
        if (recipeChanged) {
          const desiredShell = effectiveShellPreferredId as IngredientId | undefined;
          if (shellChanged && (!desiredShell || !shellChoices.includes(desiredShell))) {
            setError('Selected shell chocolate is not in the allowed options');
            user.error('Selected shell chocolate is not in the allowed options');
            return;
          }

          const desiredProcedure = effectiveProcedurePreferredId as ProcedureId | undefined;
          if (
            procedureChanged &&
            (!desiredProcedure || !effectiveProcedures?.options?.some((o) => o.id === desiredProcedure))
          ) {
            setError('Selected procedure is not in the allowed options');
            user.error('Selected procedure is not in the allowed options');
            return;
          }

          const sourceId = getConfectionSourceId(baseConfectionId);
          const destinationDefault = session.destination?.defaultCollectionId;
          const destinationOverride = session.destination?.overrideCollectionId;
          const mutableCollectionIds = Array.from(runtime.library.confections.collections.keys()).filter(
            (id) => {
              const c = runtime.library.confections.collections.get(id as SourceId).asResult;
              return c.isSuccess() && c.value.isMutable;
            }
          ) as SourceId[];

          const isMutable = (id: SourceId): boolean => {
            const c = runtime.library.confections.collections.get(id).asResult;
            return c.isSuccess() && c.value.isMutable;
          };

          let destination: SourceId | undefined;
          if (destinationOverride && isMutable(destinationOverride)) {
            destination = destinationOverride;
          } else if (destinationOverride) {
            setError(`Override destination "${destinationOverride as unknown as string}" is not mutable`);
            return;
          } else if (destinationDefault && isMutable(destinationDefault)) {
            destination = destinationDefault;
          } else if (destinationDefault) {
            setError(`Default destination "${destinationDefault as unknown as string}" is not mutable`);
            return;
          } else if (isMutable(sourceId)) {
            destination = sourceId;
          } else {
            destination = mutableCollectionIds[0];
          }

          if (!destination) {
            setError('No mutable confection collection available');
            user.error('No mutable confection collection available');
            return;
          }

          const baseIdString = getConfectionBaseId(baseConfectionId);
          const baseIdResult = Converters.baseConfectionId.convert(baseIdString);
          if (baseIdResult.isFailure()) {
            setError(baseIdResult.message);
            return;
          }

          const rawConfection = runtime.library.getConfection(baseConfectionId);
          if (rawConfection.isFailure()) {
            setError(rawConfection.message);
            return;
          }

          const rawVersions = rawConfection.value.versions as ReadonlyArray<Record<string, unknown>>;
          const newVersionSpec = nextConfectionVersionSpec(
            rawConfection.value.versions as unknown as ReadonlyArray<{ versionSpec: string }>
          );

          const rawVersion = rawVersions.find(
            (v) => v.versionSpec === (baseVersionSpec as unknown as string)
          );
          if (!rawVersion) {
            setError(`Version ${baseVersionSpec as unknown as string} not found`);
            return;
          }

          const newVersion = {
            ...(draftRawVersion ? cloneJson(draftRawVersion) : cloneJson(rawVersion)),
            versionSpec: newVersionSpec as unknown as string,
            createdDate: new Date().toISOString()
          };

          const updatedConfection = {
            ...rawConfection.value,
            goldenVersionSpec: newVersionSpec as unknown as string,
            versions: [...rawVersions, newVersion]
          };

          const validated = Entities.Confections.Converters.confectionData.convert(updatedConfection);
          if (validated.isFailure()) {
            setError(validated.message);
            return;
          }

          const collection = runtime.library.confections.collections.get(destination).asResult;
          if (collection.isFailure() || !collection.value.isMutable) {
            setError(`Collection "${destination as unknown as string}" is not mutable`);
            return;
          }

          const setResult = collection.value.items.validating.set(
            baseIdResult.value,
            validated.value
          ).asResult;
          if (setResult.isFailure()) {
            setError(setResult.message);
            return;
          }

          const persistResult = await commitConfectionCollection(destination);
          if (persistResult.isFailure()) {
            setError(persistResult.message);
            return;
          }

          targetConfectionId = `${destination as unknown as string}.${
            baseIdResult.value as unknown as string
          }` as unknown as ConfectionId;
          targetVersionSpec = newVersionSpec;

          user.success(
            `Saved new version ${targetConfectionId as unknown as string}@${
              targetVersionSpec as unknown as string
            }`
          );
          updateConfectionDraft(session.sessionId, { draftVersion: undefined });
        } else {
          user.info('No recipe edits detected; recording production journal only.');
        }

        // Create journal entry
        const journalId = Runtime.Session.generateJournalId().orThrow();
        const confectionVersionId = Converters.confectionVersionId
          .convert(`${targetConfectionId as unknown as string}@${targetVersionSpec as unknown as string}`)
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
              } else {
                entry.previousFillingIngredientId = change.previousOptionId as unknown as IngredientId;
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
          ...(session.label ? { notes: session.label } : {}),
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
        setSessionStatus(session.sessionId, 'committed');
      })();
    },
    [runtime, user, diag, commitConfectionCollection, updateConfectionDraft, setSessionStatus]
  );

  // Loading state
  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div className="p-6 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">No active sessions yet.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <ProductionSessionRow
              key={session.sessionId as unknown as string}
              session={session}
              isActive={scratchpad.activeSessionId === session.sessionId}
              onCommit={handleCommit}
              onAbandon={handleAbandon}
              onDelete={deleteSession}
            />
          ))
        )}
      </div>
    </div>
  );
}
