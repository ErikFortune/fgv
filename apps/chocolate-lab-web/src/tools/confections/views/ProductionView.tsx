import * as React from 'react';
import { useMemo, useState } from 'react';
import type { ConfectionId, ConfectionVersionSpec } from '@fgv/ts-chocolate';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { useSessionScratchpad } from '../../../contexts/SessionScratchpadContext';

export function ProductionView({
  selectedConfectionId
}: {
  selectedConfectionId: ConfectionId | null;
}): React.ReactElement {
  const { runtime, loadingState } = useChocolate();
  const { scratchpad, createConfectionSession, deleteSession, setActiveSessionId } = useSessionScratchpad();

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
            const title =
              s.sessionType === 'confection'
                ? `${s.base.confectionId as unknown as string}@${s.base.versionSpec as unknown as string}`
                : s.sessionId;
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
                    {s.label?.trim().length ? s.label : title}
                  </div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400 font-mono">{title}</div>
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
