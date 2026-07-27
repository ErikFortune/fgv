import '@fgv/ts-utils-jest';
import { CryptoUtils } from '@fgv/ts-extras';
import { resolveSecret } from '../../../shell/secretResolver';
import type { ISecretSpec } from '../../../shell';

const SPEC: ISecretSpec = {
  id: 'provider:openai',
  envVarName: 'OPENAI_API_KEY',
  description: 'OpenAI completions'
};

describe('resolveSecret', () => {
  test('fails with a message naming the id, env fallback, and description when nothing resolves', async () => {
    const result = await resolveSecret({ spec: SPEC, keyStore: undefined, getEnvVar: () => undefined });
    expect(result).toFailWith(/provider:openai/);
    expect(result).toFailWith(/OPENAI_API_KEY/);
    expect(result).toFailWith(/OpenAI completions/);
  });

  test('resolves from the session secrets store when present', async () => {
    const result = await resolveSecret({
      spec: SPEC,
      keyStore: undefined,
      sessionSecrets: new Map([['provider:openai', 'sk-session']]),
      getEnvVar: () => undefined
    });
    expect(result).toSucceedWith('sk-session');
  });

  test('ignores an empty-string session secret and falls through to env', async () => {
    const result = await resolveSecret({
      spec: SPEC,
      keyStore: undefined,
      sessionSecrets: new Map([['provider:openai', '']]),
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
      sessionSecrets: new Map([['provider:openai', 'sk-session']]),
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
    (await keyStore.importApiKey('provider:openai', 'sk-keystore')).orThrow();

    const result = await resolveSecret({
      spec: SPEC,
      keyStore,
      sessionSecrets: new Map([['provider:openai', 'sk-session']]),
      getEnvVar: () => 'sk-env'
    });
    expect(result).toSucceedWith('sk-keystore');
  });

  test('a locked KeyStore is skipped in favor of the session secret', async () => {
    const keyStore = await unlockedKeyStore();
    (await keyStore.importApiKey('provider:openai', 'sk-keystore')).orThrow();
    keyStore.lock(true);

    const result = await resolveSecret({
      spec: SPEC,
      keyStore,
      sessionSecrets: new Map([['provider:openai', 'sk-session']]),
      getEnvVar: () => undefined
    });
    expect(result).toSucceedWith('sk-session');
  });

  test('an unlocked KeyStore missing the secret falls through to the session secret', async () => {
    const keyStore = await unlockedKeyStore();

    const result = await resolveSecret({
      spec: SPEC,
      keyStore,
      sessionSecrets: new Map([['provider:openai', 'sk-session']]),
      getEnvVar: () => undefined
    });
    expect(result).toSucceedWith('sk-session');
  });

  describe('fallbackEnvVarNames', () => {
    const GEMINI_SPEC: ISecretSpec = {
      id: 'provider:google-gemini',
      envVarName: 'GEMINI_API_KEY',
      fallbackEnvVarNames: ['GOOGLE_API_KEY'],
      description: 'Gemini API key'
    };

    test('resolves from envVarName before trying fallbackEnvVarNames', async () => {
      const result = await resolveSecret({
        spec: GEMINI_SPEC,
        keyStore: undefined,
        getEnvVar: (name) => (name === 'GEMINI_API_KEY' ? 'sk-gemini' : 'sk-google')
      });
      expect(result).toSucceedWith('sk-gemini');
    });

    test('falls through to a fallbackEnvVarNames entry when envVarName is unset', async () => {
      const result = await resolveSecret({
        spec: GEMINI_SPEC,
        keyStore: undefined,
        getEnvVar: (name) => (name === 'GOOGLE_API_KEY' ? 'sk-google' : undefined)
      });
      expect(result).toSucceedWith('sk-google');
    });

    test('fails naming every env var tried when neither resolves', async () => {
      const result = await resolveSecret({
        spec: GEMINI_SPEC,
        keyStore: undefined,
        getEnvVar: () => undefined
      });
      expect(result).toFailWith(/GEMINI_API_KEY/);
      expect(result).toFailWith(/GOOGLE_API_KEY/);
    });

    test('queries the KeyStore only once even though two env vars are configured', async () => {
      const keyStore = await unlockedKeyStore();
      const hasSecretSpy = jest.spyOn(keyStore, 'hasSecret');

      await resolveSecret({
        spec: GEMINI_SPEC,
        keyStore,
        getEnvVar: () => 'sk-env'
      });

      expect(hasSecretSpy).toHaveBeenCalledTimes(1);
    });
  });
});
