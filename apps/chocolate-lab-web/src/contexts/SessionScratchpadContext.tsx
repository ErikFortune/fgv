import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Runtime, type ConfectionId, type ConfectionVersionSpec, type SessionId } from '@fgv/ts-chocolate';

type Scratchpad = Runtime.Scratchpad.ISessionScratchpad;
type PersistedSessionStatus = Runtime.Scratchpad.PersistedSessionStatus;

type SessionScratchpadContextValue = {
  scratchpad: Scratchpad;
  createConfectionSession: (params: {
    confectionId: ConfectionId;
    versionSpec: ConfectionVersionSpec;
    label?: string;
  }) => SessionId;
  deleteSession: (sessionId: SessionId) => void;
  setActiveSessionId: (sessionId: SessionId | undefined) => void;
  updateSessionLabel: (sessionId: SessionId, label: string | undefined) => void;
  setSessionStatus: (sessionId: SessionId, status: PersistedSessionStatus) => void;
};

const STORAGE_KEY = 'chocolate-lab-web:scratchpad:sessions:v1';

function nowIso(): string {
  return new Date().toISOString();
}

function createEmptyScratchpad(): Scratchpad {
  return {
    schemaVersion: Runtime.Scratchpad.SESSION_SCRATCHPAD_SCHEMA_VERSION,
    updatedAt: nowIso(),
    sessions: {}
  };
}

function tryReadScratchpadFromStorage(): Scratchpad {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyScratchpad();
    }
    const parsed: unknown = JSON.parse(raw);
    const converted = Runtime.Scratchpad.Converters.sessionScratchpad.convert(parsed);
    if (converted.isFailure()) {
      return createEmptyScratchpad();
    }
    return converted.value;
  } catch {
    return createEmptyScratchpad();
  }
}

function writeScratchpadToStorage(scratchpad: Scratchpad): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scratchpad));
  } catch {
    // ignore
  }
}

const SessionScratchpadContext = createContext<SessionScratchpadContextValue | null>(null);

export function SessionScratchpadProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [scratchpad, setScratchpad] = useState<Scratchpad>(() => tryReadScratchpadFromStorage());

  useEffect(() => {
    writeScratchpadToStorage(scratchpad);
  }, [scratchpad]);

  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key !== STORAGE_KEY || e.newValue === null) {
        return;
      }
      try {
        const parsed: unknown = JSON.parse(e.newValue);
        const converted = Runtime.Scratchpad.Converters.sessionScratchpad.convert(parsed);
        if (converted.isSuccess()) {
          setScratchpad(converted.value);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateScratchpad = useCallback((fn: (prev: Scratchpad) => Scratchpad) => {
    setScratchpad((prev) => fn(prev));
  }, []);

  const setActiveSessionId = useCallback(
    (sessionId: SessionId | undefined) => {
      updateScratchpad((prev) => ({
        ...prev,
        updatedAt: nowIso(),
        activeSessionId: sessionId
      }));
    },
    [updateScratchpad]
  );

  const createConfectionSession = useCallback(
    (params: {
      confectionId: ConfectionId;
      versionSpec: ConfectionVersionSpec;
      label?: string;
    }): SessionId => {
      const sessionId = Runtime.Session.generateSessionId().orThrow();
      const ts = nowIso();

      const session: Runtime.Scratchpad.IPersistedConfectionSession = {
        sessionId,
        sessionType: 'confection',
        status: 'active',
        createdAt: ts,
        updatedAt: ts,
        ...(params.label ? { label: params.label } : {}),
        base: {
          confectionId: params.confectionId,
          versionSpec: params.versionSpec
        }
      };

      updateScratchpad((prev) => ({
        ...prev,
        updatedAt: ts,
        sessions: {
          ...prev.sessions,
          [sessionId]: session
        },
        activeSessionId: sessionId
      }));

      return sessionId;
    },
    [updateScratchpad]
  );

  const deleteSession = useCallback(
    (sessionId: SessionId) => {
      updateScratchpad((prev) => {
        const nextSessions = { ...prev.sessions };
        delete nextSessions[sessionId];

        const nextActive =
          prev.activeSessionId === sessionId
            ? (Object.keys(nextSessions)[0] as unknown as SessionId) ?? undefined
            : prev.activeSessionId;

        return {
          ...prev,
          updatedAt: nowIso(),
          sessions: nextSessions,
          activeSessionId: nextActive
        };
      });
    },
    [updateScratchpad]
  );

  const setSessionStatus = useCallback(
    (sessionId: SessionId, status: PersistedSessionStatus) => {
      updateScratchpad((prev) => {
        const existing = prev.sessions[sessionId];
        if (!existing) {
          return prev;
        }
        const ts = nowIso();
        return {
          ...prev,
          updatedAt: ts,
          sessions: {
            ...prev.sessions,
            [sessionId]: {
              ...existing,
              status,
              updatedAt: ts
            }
          }
        };
      });
    },
    [updateScratchpad]
  );

  const updateSessionLabel = useCallback(
    (sessionId: SessionId, label: string | undefined) => {
      updateScratchpad((prev) => {
        const existing = prev.sessions[sessionId];
        if (!existing) {
          return prev;
        }
        const ts = nowIso();
        const nextSession = {
          ...existing,
          updatedAt: ts,
          ...(label && label.trim().length > 0 ? { label: label.trim() } : { label: undefined })
        };
        return {
          ...prev,
          updatedAt: ts,
          sessions: {
            ...prev.sessions,
            [sessionId]: nextSession
          }
        };
      });
    },
    [updateScratchpad]
  );

  const value = useMemo(
    (): SessionScratchpadContextValue => ({
      scratchpad,
      createConfectionSession,
      deleteSession,
      setActiveSessionId,
      updateSessionLabel,
      setSessionStatus
    }),
    [
      createConfectionSession,
      deleteSession,
      scratchpad,
      setActiveSessionId,
      setSessionStatus,
      updateSessionLabel
    ]
  );

  return <SessionScratchpadContext.Provider value={value}>{children}</SessionScratchpadContext.Provider>;
}

export function useSessionScratchpad(): SessionScratchpadContextValue {
  const ctx = useContext(SessionScratchpadContext);
  if (!ctx) {
    throw new Error('useSessionScratchpad must be used within SessionScratchpadProvider');
  }
  return ctx;
}
