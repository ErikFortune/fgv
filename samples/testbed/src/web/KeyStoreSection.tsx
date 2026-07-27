/**
 * The Secrets modal's "Open KeyStore" section — file picker + password + Unlock, and the
 * unlocked/locked status display. Session-only: the selected `File`, the typed password, and
 * the derived key all live in this component's React state for the current tab only (never
 * `localStorage`); the password field is cleared after every unlock attempt regardless of
 * outcome.
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CryptoUtils } from '@fgv/ts-extras';

import { openKeyStoreFromFile } from './openKeyStore';

/**
 * Props for {@link KeyStoreSection}.
 * @public
 */
export interface IKeyStoreSectionProps {
  /** The currently unlocked KeyStore, or `undefined` if none is open. */
  readonly keyStore: CryptoUtils.KeyStore.KeyStore | undefined;
  readonly onUnlocked: (keyStore: CryptoUtils.KeyStore.KeyStore) => void;
  readonly onLocked: () => void;
}

/** Renders the unlocked status + Lock affordance. */
function UnlockedStatus({
  keyStore,
  onLock
}: {
  readonly keyStore: CryptoUtils.KeyStore.KeyStore;
  readonly onLock: () => void;
}): React.ReactElement {
  const secretCount = keyStore.listSecrets().orDefault([]).length;
  return (
    <div className="space-y-2">
      <p data-testid="testbed-keystore-unlocked" className="text-sm text-status-success-text">
        ✓ KeyStore unlocked ({secretCount} secret{secretCount === 1 ? '' : 's'})
      </p>
      <button
        type="button"
        data-testid="testbed-keystore-lock-btn"
        onClick={onLock}
        className="text-xs font-medium text-secondary hover:text-primary"
      >
        Lock
      </button>
    </div>
  );
}

/**
 * The KeyStore import flow. Renders the unlocked status (with a Lock affordance) when
 * `keyStore` is set, otherwise the file picker + password + Unlock form.
 * @public
 */
export function KeyStoreSection({
  keyStore,
  onUnlocked,
  onLocked
}: IKeyStoreSectionProps): React.ReactElement {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Guards the async unlock resolution against updating state after unmount — e.g. the Secrets
  // modal closing (Modal returns null) mid-unlock. Mirrors ScenarioHost's `active`-flag cleanup.
  const isMountedRef = useRef(true);
  useEffect(() => {
    // Reset on setup, not just initialization: under React.StrictMode's dev-mode
    // mount→unmount→remount cycle the cleanup runs once against the SAME ref, so a
    // cleanup-only effect would leave the ref false for the component's whole life
    // (silently swallowing every unlock resolution).
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Shared by the Unlock button's `disabled` condition and `handleUnlock`'s guard, so the two
  // never drift apart.
  const canUnlock = file !== undefined && password.length > 0;

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0]);
    setError(undefined);
  }, []);

  const handleUnlock = useCallback(() => {
    /* c8 ignore next 3 - defensive: the Unlock button's disabled condition already excludes !canUnlock; kept for type-narrowing (file: File | undefined) and robustness against a non-UI invocation. */
    if (!file || !canUnlock) {
      return;
    }
    setIsUnlocking(true);
    setError(undefined);
    openKeyStoreFromFile(file, password)
      .then((result) => {
        if (!isMountedRef.current) {
          return;
        }
        setIsUnlocking(false);
        // Cleared after every attempt, success or failure — never held longer than needed.
        setPassword('');
        if (result.isSuccess()) {
          onUnlocked(result.value);
        } else {
          setError(result.message);
        }
      })
      /* c8 ignore next 7 - openKeyStoreFromFile returns Promise<Result>; it never rejects in practice (failures become Result.fail). Guard is defensive, mirrors ScenarioRunnerPanel's run() catch. */
      .catch((err: unknown) => {
        if (!isMountedRef.current) {
          return;
        }
        setIsUnlocking(false);
        setPassword('');
        setError(String(err));
      });
  }, [file, password, canUnlock, onUnlocked]);

  const handleLock = useCallback(
    (ks: CryptoUtils.KeyStore.KeyStore) => {
      // force=true: this KeyStore is opened read-only by the modal (never `addSecret`/etc.), so
      // there are never unsaved changes to protect against — force just skips that irrelevant guard.
      ks.lock(true);
      setFile(undefined);
      setPassword('');
      setError(undefined);
      onLocked();
    },
    [onLocked]
  );

  return (
    <div data-testid="testbed-keystore-section" className="space-y-2">
      <h3 className="text-sm font-semibold text-primary">KeyStore</h3>
      {keyStore ? (
        <UnlockedStatus keyStore={keyStore} onLock={() => handleLock(keyStore)} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-secondary">
            Open an existing password-protected KeyStore file instead of pasting individual keys below. Secret
            ids must match the library convention (e.g. <code>openai-api-key</code>) for lookups to work.
          </p>
          {/* No `accept` filter: keystore files carry no canonical extension, and the
              content is fully validated by the keystore converters on open anyway. */}
          <input
            type="file"
            data-testid="testbed-keystore-file-input"
            onChange={handleFileChange}
            disabled={isUnlocking}
            className="block w-full text-sm text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:text-sm file:text-primary disabled:opacity-50"
          />
          <input
            type="password"
            autoComplete="off"
            data-testid="testbed-keystore-password-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isUnlocking}
            placeholder="KeyStore password"
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
          <button
            type="button"
            data-testid="testbed-keystore-unlock-btn"
            onClick={handleUnlock}
            disabled={isUnlocking || !canUnlock}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUnlocking ? 'Unlocking…' : 'Unlock'}
          </button>
          {error !== undefined && (
            <p data-testid="testbed-keystore-error" className="text-xs text-status-error-text">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
