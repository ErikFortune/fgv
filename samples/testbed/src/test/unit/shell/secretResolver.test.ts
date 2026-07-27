import '@fgv/ts-utils-jest';
import { CryptoUtils } from '@fgv/ts-extras';
import { resolveSecret } from '../../../shell/secretResolver';
import type { ISecretSpec } from '../../../shell';

const SPEC: ISecretSpec = {
  id: 'openai-api-key',
  envVarName: 'OPENAI_API_KEY',
  description: 'OpenAI completions'
};

describe('resolveSecret', () => {
  test('fails with a message naming the id, env fallback, and description when nothing resolves', async () => {
    const result = await resolveSecret({ spec: SPEC, keyStore: undefined, getEnvVar: () => undefined });
    expect(result).toFailWith(/openai-api-key/);
    expect(result).toFailWith(/OPENAI_API_KEY/);
    expect(result).toFailWith(/OpenAI completions/);
  });

  test('resolves from the session secrets store when present', async () => {
    const result = await resolveSecret({
      spec: SPEC,
      keyStore: undefined,
      sessionSecrets: new Map([['openai-api-key', 'sk-session']]),
      getEnvVar: () => undefined
    });
    expect(result).toSucceedWith('sk-session');
  });

  test('ignores an empty-string session secret and falls through to env', async () => {
    const result = await resolveSecret({
      spec: SPEC,
      keyStore: undefined,
      sessionSecrets: new Map([['openai-api-key', '']]),
      getEnvVar: (name) => (name === 'OPENAI_API_KEY' ? 'sk-env' : undefined)
    });
    expect(result).toSucceedWith('sk-env');
  });

  test('falls back to the env var when no session secret is set', async () => {
    const result = await resolveSecret({
      spec: SPEC,
      keyStore: undefined,
      getEnvVar: (name) => (name === 'OPENAI_API_KEY' ? 'sk-env' : undefined)
    });
    expect(result).toSucceedWith('sk-env');
  });

  test('ignores an empty-string env var and fails with the documented message', async () => {
    const result = await resolveSecret({
      spec: SPEC,
      keyStore: undefined,
      getEnvVar: () => ''
    });
    expect(result.isFailure()).toBe(true);
  });

  test('session secrets take priority over the env-var fallback', async () => {
    const result = await resolveSecret({
      spec: SPEC,
      keyStore: undefined,
      sessionSecrets: new Map([['openai-api-key', 'sk-session']]),
      getEnvVar: () => 'sk-env'
    });
    expect(result).toSucceedWith('sk-session');
  });

  async function unlockedKeyStore(): Promise<CryptoUtils.KeyStore.KeyStore> {
    const keyStore = CryptoUtils.KeyStore.KeyStore.create({
      cryptoProvider: CryptoUtils.nodeCryptoProvider
    }).orThrow();
    (await keyStore.initialize('correct horse battery staple')).orThrow();
    return keyStore;
  }

  test('an unlocked KeyStore holding the secret takes priority over session and env', async () => {
    const keyStore = await unlockedKeyStore();
    (await keyStore.importApiKey('openai-api-key', 'sk-keystore')).orThrow();

    const result = await resolveSecret({
      spec: SPEC,
      keyStore,
      sessionSecrets: new Map([['openai-api-key', 'sk-session']]),
      getEnvVar: () => 'sk-env'
    });
    expect(result).toSucceedWith('sk-keystore');
  });

  test('a locked KeyStore is skipped in favor of the session secret', async () => {
    const keyStore = await unlockedKeyStore();
    (await keyStore.importApiKey('openai-api-key', 'sk-keystore')).orThrow();
    keyStore.lock(true);

    const result = await resolveSecret({
      spec: SPEC,
      keyStore,
      sessionSecrets: new Map([['openai-api-key', 'sk-session']]),
      getEnvVar: () => undefined
    });
    expect(result).toSucceedWith('sk-session');
  });

  test('an unlocked KeyStore missing the secret falls through to the session secret', async () => {
    const keyStore = await unlockedKeyStore();

    const result = await resolveSecret({
      spec: SPEC,
      keyStore,
      sessionSecrets: new Map([['openai-api-key', 'sk-session']]),
      getEnvVar: () => undefined
    });
    expect(result).toSucceedWith('sk-session');
  });
});
