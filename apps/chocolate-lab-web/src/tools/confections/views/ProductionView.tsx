import * as React from 'react';
import { useMemo, useState } from 'react';
import type { ConfectionId, ConfectionVersionSpec } from '@fgv/ts-chocolate';
import { Converters, Entities, Runtime, type JournalId, type SourceId } from '@fgv/ts-chocolate';
import { useChocolate } from '../../../contexts/ChocolateContext';
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
  const {
    scratchpad,
    createConfectionSession,
    deleteSession,
    setActiveSessionId,
    setSessionStatus,
    updateSessionLabel
  } = useSessionScratchpad();

  const [error, setError] = useState<string | null>(null);

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

              const confectionResult = runtime.getRuntimeConfection(s.base.confectionId);
              if (confectionResult.isFailure()) {
                setError(confectionResult.message);
                return;
              }

              const versionResult = confectionResult.value.getVersion(s.base.versionSpec);
              if (versionResult.isFailure()) {
                setError(versionResult.message);
                return;
              }

              const journalId = Runtime.Session.generateJournalId().orThrow();
              const confectionVersionId = Converters.confectionVersionId
                .convert(
                  `${s.base.confectionId as unknown as string}@${s.base.versionSpec as unknown as string}`
                )
                .orThrow();

              const journal: Entities.Journal.IConfectionJournalRecord = {
                journalType: 'confection',
                journalId,
                confectionVersionId,
                date: Runtime.Session.getCurrentDateString(),
                yieldCount: versionResult.value.yield.count,
                ...(versionResult.value.yield.weightPerPiece !== undefined
                  ? { weightPerPiece: versionResult.value.yield.weightPerPiece }
                  : {}),
                ...(s.label ? { notes: s.label } : {})
              };

              const addResult = runtime.journals.addJournal(journal);
              if (addResult.isFailure()) {
                setError(addResult.message);
                return;
              }

              upsertJournalToLocalCollection({
                collectionId: 'local' as unknown as SourceId,
                journalId,
                journal
              });

              setSessionStatus(s.sessionId, 'committed');
            };

            return (
              <div
                key={s.sessionId as unknown as string}
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
                  disabled={s.status !== 'active'}
                  className="px-2 py-1 text-xs rounded-md bg-chocolate-600 text-white hover:bg-chocolate-700 disabled:opacity-50"
                >
                  Commit
                </button>

                <button
                  type="button"
                  onClick={onAbandon}
                  disabled={s.status !== 'active'}
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
            );
          })
        )}
      </div>
    </div>
  );
}
