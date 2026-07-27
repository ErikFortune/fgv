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
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), detail: jest.fn() } as unknown as IScenarioContext['logger'],
    keyStore: undefined,
    resolveSecret,
    dataTree: {} as unknown as IScenarioContext['dataTree']
  };
}

describe('requiredSecretsForProviders', () => {
  test('returns an empty array for a provider with no entry (self-hosted)', () => {
    expect(requiredSecretsForProviders(['ollama'])).toEqual([]);
  });

  test('returns the primary spec for a single-secret provider', () => {
    const specs = requiredSecretsForProviders(['openai']);
    expect(specs.map((s) => s.id)).toEqual(['openai-api-key']);
  });

  test('returns primary + fallback for gemini', () => {
    const specs = requiredSecretsForProviders(['google-gemini']);
    expect(specs.map((s) => s.id)).toEqual(['gemini-api-key', 'google-api-key']);
  });

  test('dedupes across multiple providers', () => {
    const specs = requiredSecretsForProviders(['openai', 'openai', 'xai-grok']);
    expect(specs.map((s) => s.id)).toEqual(['openai-api-key', 'xai-api-key']);
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

  test('resolves via the primary spec when it succeeds', async () => {
    const context = makeContext(async (spec: ISecretSpec) =>
      spec.id === 'openai-api-key' ? succeed('sk-primary') : fail('unexpected spec')
    );
    const result = await resolveProviderApiKey(context, 'openai');
    expect(result).toSucceedWith('sk-primary');
  });

  test('falls back to the fallback spec when the primary fails (gemini)', async () => {
    const context = makeContext(async (spec: ISecretSpec) =>
      spec.id === 'google-api-key' ? succeed('sk-fallback') : fail('primary missing')
    );
    const result = await resolveProviderApiKey(context, 'google-gemini');
    expect(result).toSucceedWith('sk-fallback');
  });

  test('fails with both messages when neither primary nor fallback resolve (gemini)', async () => {
    const context = makeContext(async () => fail('not set'));
    const result = await resolveProviderApiKey(context, 'google-gemini');
    expect(result).toFailWith(/not set[\s\S]*not set/);
  });

  test('fails with the primary message when a provider has no fallback (openai)', async () => {
    const context = makeContext(async () => fail('primary missing'));
    const result = await resolveProviderApiKey(context, 'openai');
    expect(result).toFailWith(/primary missing/);
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
    const resolveSecret = jest.fn(async (spec: ISecretSpec): Promise<Result<string>> =>
      succeed(`sk-${spec.id}`)
    );
    const context = makeContext(resolveSecret);
    const { result, rerender } = renderHook(
      ({ provider }: { provider: AiAssist.AiProviderId }) => useProviderApiKey(context, provider),
      { initialProps: { provider: 'openai' } }
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.apiKey).toBe('sk-openai-api-key');

    rerender({ provider: 'anthropic' });
    await waitFor(() => expect(result.current.apiKey).toBe('sk-anthropic-api-key'));
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
