import '@fgv/ts-utils-jest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type Result, succeed } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';
import { CryptoUtils as WebCryptoUtils } from '@fgv/ts-web-extras';

import { KeyStoreSection } from '../../../web/KeyStoreSection';
import * as OpenKeyStoreModule from '../../../web/openKeyStore';

const PASSWORD = 'correct horse battery staple';

/** Builds a real, saved keystore file (via the actual `KeyStore` class) with one secret. */
async function buildFixtureKeystoreFile(): Promise<File> {
  const cryptoProvider = new WebCryptoUtils.BrowserCryptoProvider();
  const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
  await keyStore.initialize(PASSWORD);
  await keyStore.importApiKey('openai-api-key', 'sk-fixture-value');
  const saved = (await keyStore.save(PASSWORD)).orThrow();
  return new File([JSON.stringify(saved)], 'keystore.json', { type: 'application/json' });
}

/** Builds a fixture unlocked `KeyStore` instance directly, for the "already unlocked" tests. */
async function buildUnlockedFixtureKeyStore(): Promise<CryptoUtils.KeyStore.KeyStore> {
  const cryptoProvider = new WebCryptoUtils.BrowserCryptoProvider();
  const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
  await keyStore.initialize(PASSWORD);
  await keyStore.importApiKey('openai-api-key', 'sk-fixture-value');
  return keyStore;
}

describe('KeyStoreSection', () => {
  afterEach(cleanup);

  test('renders the file picker + password + Unlock form when locked', () => {
    render(<KeyStoreSection keyStore={undefined} onUnlocked={() => undefined} onLocked={() => undefined} />);
    expect(screen.getByTestId('testbed-keystore-file-input')).not.toBeNull();
    expect(screen.getByTestId('testbed-keystore-password-input')).not.toBeNull();
    expect(screen.queryByTestId('testbed-keystore-unlocked')).toBeNull();
  });

  test('Unlock is disabled until both a file and a password are present', () => {
    render(<KeyStoreSection keyStore={undefined} onUnlocked={() => undefined} onLocked={() => undefined} />);
    const unlockBtn = screen.getByTestId('testbed-keystore-unlock-btn') as HTMLButtonElement;
    expect(unlockBtn.disabled).toBe(true);

    fireEvent.change(screen.getByTestId('testbed-keystore-password-input'), {
      target: { value: PASSWORD }
    });
    // Password alone (no file) is still not enough.
    expect((screen.getByTestId('testbed-keystore-unlock-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  test('clearing the file selection (files: null) disables Unlock again', async () => {
    const file = await buildFixtureKeystoreFile();
    render(<KeyStoreSection keyStore={undefined} onUnlocked={() => undefined} onLocked={() => undefined} />);

    fireEvent.change(screen.getByTestId('testbed-keystore-file-input'), { target: { files: [file] } });
    fireEvent.change(screen.getByTestId('testbed-keystore-password-input'), {
      target: { value: PASSWORD }
    });
    expect((screen.getByTestId('testbed-keystore-unlock-btn') as HTMLButtonElement).disabled).toBe(false);

    // Cancelling the file picker (`input.files` reverts to `null`) must disable Unlock again.
    fireEvent.change(screen.getByTestId('testbed-keystore-file-input'), { target: { files: null } });
    expect((screen.getByTestId('testbed-keystore-unlock-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  test('clicking Unlock with a valid file + password calls onUnlocked and clears the password field', async () => {
    const file = await buildFixtureKeystoreFile();
    const onUnlocked = jest.fn();
    render(<KeyStoreSection keyStore={undefined} onUnlocked={onUnlocked} onLocked={() => undefined} />);

    fireEvent.change(screen.getByTestId('testbed-keystore-file-input'), { target: { files: [file] } });
    const passwordInput = screen.getByTestId('testbed-keystore-password-input') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: PASSWORD } });
    fireEvent.click(screen.getByTestId('testbed-keystore-unlock-btn'));

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    const unlockedKeyStore = onUnlocked.mock.calls[0][0] as CryptoUtils.KeyStore.KeyStore;
    expect(unlockedKeyStore.isUnlocked).toBe(true);
    // The password field is cleared after the attempt (success or failure) — never held longer.
    expect(passwordInput.value).toBe('');
  });

  test('a wrong password surfaces a friendly error and does not call onUnlocked', async () => {
    const file = await buildFixtureKeystoreFile();
    const onUnlocked = jest.fn();
    render(<KeyStoreSection keyStore={undefined} onUnlocked={onUnlocked} onLocked={() => undefined} />);

    fireEvent.change(screen.getByTestId('testbed-keystore-file-input'), { target: { files: [file] } });
    fireEvent.change(screen.getByTestId('testbed-keystore-password-input'), {
      target: { value: 'wrong password' }
    });
    fireEvent.click(screen.getByTestId('testbed-keystore-unlock-btn'));

    await waitFor(() => expect(screen.getByTestId('testbed-keystore-error')).not.toBeNull());
    expect(screen.getByTestId('testbed-keystore-error').textContent).toMatch(
      /incorrect password|corrupted key store/i
    );
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  test('clicking Unlock again clears a previous error', async () => {
    const badFile = new File(['not json'], 'keystore.json', { type: 'application/json' });
    const goodFile = await buildFixtureKeystoreFile();
    const onUnlocked = jest.fn();
    render(<KeyStoreSection keyStore={undefined} onUnlocked={onUnlocked} onLocked={() => undefined} />);

    fireEvent.change(screen.getByTestId('testbed-keystore-file-input'), { target: { files: [badFile] } });
    fireEvent.change(screen.getByTestId('testbed-keystore-password-input'), {
      target: { value: PASSWORD }
    });
    fireEvent.click(screen.getByTestId('testbed-keystore-unlock-btn'));
    await waitFor(() => expect(screen.getByTestId('testbed-keystore-error')).not.toBeNull());

    // Selecting a new file clears the stale error immediately (before the next Unlock attempt).
    fireEvent.change(screen.getByTestId('testbed-keystore-file-input'), { target: { files: [goodFile] } });
    expect(screen.queryByTestId('testbed-keystore-error')).toBeNull();

    fireEvent.change(screen.getByTestId('testbed-keystore-password-input'), {
      target: { value: PASSWORD }
    });
    fireEvent.click(screen.getByTestId('testbed-keystore-unlock-btn'));
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
  });

  test('shows the unlocked status with secret count when a keyStore is supplied', async () => {
    const keyStore = await buildUnlockedFixtureKeyStore();
    render(<KeyStoreSection keyStore={keyStore} onUnlocked={() => undefined} onLocked={() => undefined} />);
    expect(screen.getByTestId('testbed-keystore-unlocked').textContent).toMatch(/unlocked \(1 secret\)/i);
    expect(screen.queryByTestId('testbed-keystore-file-input')).toBeNull();
  });

  test('pluralizes the secret count for zero/multiple secrets', async () => {
    const cryptoProvider = new WebCryptoUtils.BrowserCryptoProvider();
    const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
    await keyStore.initialize(PASSWORD);
    render(<KeyStoreSection keyStore={keyStore} onUnlocked={() => undefined} onLocked={() => undefined} />);
    expect(screen.getByTestId('testbed-keystore-unlocked').textContent).toMatch(/unlocked \(0 secrets\)/i);
  });

  test('clicking Lock calls onLocked and locks the underlying KeyStore', async () => {
    const keyStore = await buildUnlockedFixtureKeyStore();
    const onLocked = jest.fn();
    render(<KeyStoreSection keyStore={keyStore} onUnlocked={() => undefined} onLocked={onLocked} />);

    fireEvent.click(screen.getByTestId('testbed-keystore-lock-btn'));
    expect(onLocked).toHaveBeenCalledTimes(1);
    expect(keyStore.isUnlocked).toBe(false);
  });

  test('unmounting mid-unlock does not update state after unmount (no act warning)', async () => {
    // Deferred so the test controls exactly when the unlock resolves, letting it unmount the
    // component (e.g. the Secrets modal closing mid-unlock) BEFORE resolution — the scenario
    // the isMountedRef guard exists for. Spies on the module (rather than mocking file/password
    // content) since openKeyStoreFromFile isn't dependency-injected into the component.
    let resolveUnlock: (result: Result<CryptoUtils.KeyStore.KeyStore>) => void = () => undefined;
    const deferred = new Promise<Result<CryptoUtils.KeyStore.KeyStore>>((resolve) => {
      resolveUnlock = resolve;
    });
    const openSpy = jest.spyOn(OpenKeyStoreModule, 'openKeyStoreFromFile').mockReturnValue(deferred);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const file = new File(['irrelevant — openKeyStoreFromFile is mocked'], 'keystore.json', {
        type: 'application/json'
      });
      const onUnlocked = jest.fn();
      const { unmount } = render(
        <KeyStoreSection keyStore={undefined} onUnlocked={onUnlocked} onLocked={() => undefined} />
      );

      fireEvent.change(screen.getByTestId('testbed-keystore-file-input'), { target: { files: [file] } });
      fireEvent.change(screen.getByTestId('testbed-keystore-password-input'), {
        target: { value: PASSWORD }
      });
      fireEvent.click(screen.getByTestId('testbed-keystore-unlock-btn'));

      // Unmount while the unlock is still in flight (mirrors closing the Secrets modal mid-unlock).
      unmount();

      // Resolve AFTER unmount — the isMountedRef guard must prevent the resulting setState calls.
      const keyStore = await buildUnlockedFixtureKeyStore();
      resolveUnlock(succeed(keyStore));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(onUnlocked).not.toHaveBeenCalled();
      // No React "state update on an unmounted component" warning reached console.error.
      for (const call of consoleErrorSpy.mock.calls) {
        expect(String(call[0])).not.toMatch(/not wrapped in act|unmounted component/i);
      }
    } finally {
      openSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });
});
