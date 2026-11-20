import '@fgv/ts-utils-jest';
import { CryptoUtils } from '@fgv/ts-extras';
import { CryptoUtils as WebCryptoUtils } from '@fgv/ts-web-extras';

import { openKeyStoreFromFile } from '../../../web/openKeyStore';

const PASSWORD = 'correct horse battery staple';

/**
 * Builds a real, saved keystore file (via the actual `KeyStore` class, not a mock) carrying
 * one API-key secret, matching the library-convention id `provider:openai` per `ISecretSpec`.
 */
async function buildFixtureKeystoreFile(): Promise<File> {
  const cryptoProvider = new WebCryptoUtils.BrowserCryptoProvider();
  const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
  await keyStore.initialize(PASSWORD);
  await keyStore.importApiKey('provider:openai', 'sk-fixture-value');
  const saved = (await keyStore.save(PASSWORD)).orThrow();
  return new File([JSON.stringify(saved)], 'keystore.json', { type: 'application/json' });
}

describe('openKeyStoreFromFile', () => {
  test('opens and unlocks a valid keystore file with the correct password', async () => {
    const file = await buildFixtureKeystoreFile();
    expect(await openKeyStoreFromFile(file, PASSWORD)).toSucceedAndSatisfy((keyStore) => {
      expect(keyStore.isUnlocked).toBe(true);
      expect(keyStore.getApiKey('provider:openai')).toSucceedWith('sk-fixture-value');
      expect(keyStore.listSecrets()).toSucceedWith(['provider:openai']);
    });
  });

  test('fails with a friendly message for the wrong password', async () => {
    const file = await buildFixtureKeystoreFile();
    expect(await openKeyStoreFromFile(file, 'wrong password')).toFailWith(
      /incorrect password|corrupted key store/i
    );
  });

  test('fails with a friendly message for a non-JSON file', async () => {
    const file = new File(['not json at all'], 'keystore.json', { type: 'application/json' });
    // Anchored: guards against the file-read step's error-format wrapper leaking into (and
    // masking) this step's message — a flat, un-nested `.withErrorFormat` chain would prefix
    // this with "Failed to read keystore file: " even though the file WAS read successfully.
    expect(await openKeyStoreFromFile(file, PASSWORD)).toFailWith(/^Invalid keystore file:/i);
  });

  test('fails with a friendly message for well-formed JSON that is not a keystore file', async () => {
    const file = new File([JSON.stringify({ hello: 'world' })], 'keystore.json', {
      type: 'application/json'
    });
    expect(await openKeyStoreFromFile(file, PASSWORD)).toFailWith(/^Invalid keystore file:/i);
  });

  test('fails with a friendly message when the file cannot be read', async () => {
    const unreadable = {
      text: async (): Promise<string> => {
        throw new Error('boom: disk error');
      }
    } as unknown as File;
    // Anchored: a regression that re-wraps this in "Invalid keystore file: ..." (the next
    // step's error-format label) would fail this assertion.
    expect(await openKeyStoreFromFile(unreadable, PASSWORD)).toFailWith(
      /^Failed to read keystore file:.*boom: disk error/i
    );
  });
});
