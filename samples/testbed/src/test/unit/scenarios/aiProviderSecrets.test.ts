import '@fgv/ts-utils-jest';
import { renderHook, waitFor } from '@testing-library/react';
import { fail, succeed, type Result } from '@fgv/ts-utils';
import type { AiAssist } from '@fgv/ts-extras';

import {
  PROVIDER_SECRET_SPECS,
  requiredSecretsForProviders,
  resolveProviderApiKey,
  SingleSecretKeyStore,
  useProviderApiKey
} from '../../../scenarios/aiProviderSecrets';
import type { IScenarioContext, ISecretSpec } from '../../../shell';

// Minimal context stub — only `resolveSecret` and `logger` are exercised by this module.
function makeContext(resolveSecret: IScenarioContext['resolveSecret']): IScenarioContext {
  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      detail: jest.fn()
    } as unknown as IScenarioContext['logger'],
    keyStore: undefined,
    resolveSecret,
    dataTree: {} as unknown as IScenarioContext['dataTree']
  };
}

describe('requiredSecretsForProviders', () => {
  test('returns an empty array for a provider with no entry (self-hosted)', () => {
    expect(requiredSecretsForProviders(['ollama'])).toEqual([]);
  });

  test('returns the canonical spec for a single-secret provider', () => {
    const specs = requiredSecretsForProviders(['openai']);
    expect(specs.map((s) => s.id)).toEqual(['provider:openai']);
  });

  test('returns a single spec for gemini (env fallback handled within the spec)', () => {
    const specs = requiredSecretsForProviders(['google-gemini']);
    expect(specs.map((s) => s.id)).toEqual(['provider:google-gemini']);
    expect(specs[0].envVarName).toBe('GEMINI_API_KEY');
    expect(specs[0].fallbackEnvVarNames).toEqual(['GOOGLE_API_KEY']);
  });

  test('dedupes across multiple providers', () => {
    const specs = requiredSecretsForProviders(['openai', 'openai', 'xai-grok']);
    expect(specs.map((s) => s.id)).toEqual(['provider:openai', 'provider:xai-grok']);
  });

  test('every entry in PROVIDER_SECRET_SPECS is reachable', () => {
    const providers = Object.keys(PROVIDER_SECRET_SPECS) as ReadonlyArray<keyof typeof PROVIDER_SECRET_SPECS>;
    expect(requiredSecretsForProviders(providers).length).toBeGreaterThan(0);
  });
});

describe('resolveProviderApiKey', () => {
  test('resolves to an empty string for a provider with no secret spec', async () => {
    const context = makeContext(async () => fail('should not be called'));
    const result = await resolveProviderApiKey(context, 'ollama');
    expect(result).toSucceedWith('');
  });

  test('resolves via context.resolveSecret using the provider’s canonical spec', async () => {
    const context = makeContext(async (spec: ISecretSpec) =>
      spec.id === 'provider:openai' ? succeed('sk-primary') : fail('unexpected spec')
    );
    const result = await resolveProviderApiKey(context, 'openai');
    expect(result).toSucceedWith('sk-primary');
  });

  test('passes the gemini spec with its GEMINI_API_KEY/GOOGLE_API_KEY env fallback chain', async () => {
    const context = makeContext(async (spec: ISecretSpec) =>
      spec.id === 'provider:google-gemini' &&
      spec.envVarName === 'GEMINI_API_KEY' &&
      spec.fallbackEnvVarNames?.includes('GOOGLE_API_KEY')
        ? succeed('sk-gemini')
        : fail('unexpected spec')
    );
    const result = await resolveProviderApiKey(context, 'google-gemini');
    expect(result).toSucceedWith('sk-gemini');
  });

  test('propagates a failure from context.resolveSecret', async () => {
    const context = makeContext(async () => fail('not set'));
    const result = await resolveProviderApiKey(context, 'openai');
    expect(result).toFailWith(/not set/);
  });
});

describe('SingleSecretKeyStore', () => {
  test('isUnlocked is always true', () => {
    expect(new SingleSecretKeyStore(new Map()).isUnlocked).toBe(true);
  });

  test('hasSecret reflects the backing map', () => {
    const store = new SingleSecretKeyStore(new Map([['openai', 'sk-test']]));
    expect(store.hasSecret('openai')).toSucceedWith(true);
    expect(store.hasSecret('anthropic')).toSucceedWith(false);
  });

  test('getApiKey succeeds with the stored value', () => {
    const store = new SingleSecretKeyStore(new Map([['openai', 'sk-test']]));
    expect(store.getApiKey('openai')).toSucceedWith('sk-test');
  });

  test('getApiKey fails when the secret is absent', () => {
    const store = new SingleSecretKeyStore(new Map());
    expect(store.getApiKey('openai')).toFailWith(/not set/);
  });

  test('getApiKey fails when the secret is an empty string', () => {
    const store = new SingleSecretKeyStore(new Map([['openai', '']]));
    expect(store.getApiKey('openai')).toFailWith(/not set/);
  });
});

describe('useProviderApiKey', () => {
  test('starts loading, then transitions to ready on a successful resolve', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    const { result } = renderHook(() => useProviderApiKey(context, 'openai'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.apiKey).toBe('sk-test');
    expect(result.current.error).toBeUndefined();
  });

  test('transitions to missing with the failure message when resolution fails', async () => {
    const context = makeContext(async () => fail('no key configured'));
    const { result } = renderHook(() => useProviderApiKey(context, 'openai'));

    await waitFor(() => expect(result.current.status).toBe('missing'));
    expect(result.current.apiKey).toBe('');
    expect(result.current.error).toMatch(/no key configured/);
  });

  test('re-resolves when the provider changes', async () => {
    const resolveSecret = jest.fn(
      async (spec: ISecretSpec): Promise<Result<string>> => succeed(`sk-${spec.id}`)
    );
    const context = makeContext(resolveSecret);
    const { result, rerender } = renderHook(
      ({ provider }: { provider: AiAssist.AiProviderId }) => useProviderApiKey(context, provider),
      { initialProps: { provider: 'openai' } }
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.apiKey).toBe('sk-provider:openai');

    rerender({ provider: 'anthropic' });
    await waitFor(() => expect(result.current.apiKey).toBe('sk-provider:anthropic'));
  });

  test('re-resolves when the resolveSecret closure identity changes (session store updated)', async () => {
    let currentValue = 'sk-first';
    const context1 = makeContext(async () => succeed(currentValue));
    const { result, rerender } = renderHook(({ context }) => useProviderApiKey(context, 'openai'), {
      initialProps: { context: context1 }
    });
    await waitFor(() => expect(result.current.apiKey).toBe('sk-first'));

    currentValue = 'sk-second';
    const context2 = makeContext(async () => succeed(currentValue));
    rerender({ context: context2 });
    await waitFor(() => expect(result.current.apiKey).toBe('sk-second'));
  });

  test('ignores a resolve that completes after the component unmounts', async () => {
    let resolveFn: (result: Result<string>) => void = () => undefined;
    const pending = new Promise<Result<string>>((resolve) => {
      resolveFn = resolve;
    });
    const context = makeContext(async () => pending);
    const { unmount } = renderHook(() => useProviderApiKey(context, 'openai'));

    unmount();
    resolveFn(succeed('sk-late'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Test passes if no "can't update unmounted component" warning fires.
  });
});
