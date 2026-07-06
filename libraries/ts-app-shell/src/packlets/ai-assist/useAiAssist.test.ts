/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { act, renderHook } from '@testing-library/react';

import { AiAssist } from '@fgv/ts-extras';
import { fail, type Result, succeed } from '@fgv/ts-utils';

import { checkForAiErrorObject, useAiAssist, type IUseAiAssistParams } from './useAiAssist';

// ============================================================================
// Test helpers
// ============================================================================

class StubKeyStore implements AiAssist.IAiAssistKeyStore {
  public isUnlocked: boolean;
  private readonly _secrets: Map<string, string>;
  public constructor(isUnlocked: boolean = true, secrets: ReadonlyMap<string, string> = new Map()) {
    this.isUnlocked = isUnlocked;
    this._secrets = new Map(secrets);
  }
  public hasSecret(name: string): Result<boolean> {
    return succeed(this._secrets.has(name));
  }
  public getApiKey(name: string): Result<string> {
    const v = this._secrets.get(name);
    return v === undefined ? fail(`secret "${name}" not set`) : succeed(v);
  }
}

class FailingKeyStore implements AiAssist.IAiAssistKeyStore {
  public readonly isUnlocked: boolean = true;
  public hasSecret(): Result<boolean> {
    return fail('storage offline');
  }
  public getApiKey(name: string): Result<string> {
    return fail(`could not load "${name}"`);
  }
}

function settingsFor(
  provider: AiAssist.AiProviderId,
  overrides: Partial<AiAssist.IAiAssistProviderConfig> = {}
): AiAssist.IAiAssistSettings {
  return {
    providers: [{ provider, secretName: `secret.${provider}`, ...overrides }]
  };
}

function defaultParams(overrides: Partial<IUseAiAssistParams> = {}): IUseAiAssistParams {
  return {
    settings: settingsFor('openai'),
    keyStore: new StubKeyStore(true, new Map([['secret.openai', 'sk-test']])),
    ...overrides
  };
}

const TEST_PROMPT = new AiAssist.AiPrompt('hello', 'system');

// ============================================================================
// checkForAiErrorObject (exported helper)
// ============================================================================

describe('checkForAiErrorObject', () => {
  test('returns failure when input has a string error field', () => {
    const result = checkForAiErrorObject({ error: 'cannot generate', term: 'foo' });
    expect(result?.isFailure()).toBe(true);
    expect(result?.message).toMatch(/cannot generate/);
    expect(result?.message).toMatch(/term: "foo"/);
  });

  test('omits term when missing', () => {
    const result = checkForAiErrorObject({ error: 'no can do' });
    expect(result?.message).toMatch(/no can do/);
    expect(result?.message).not.toMatch(/term/);
  });

  test('returns undefined for objects without an error field', () => {
    expect(checkForAiErrorObject({ name: 'Alice' })).toBeUndefined();
  });

  test('returns undefined for non-objects', () => {
    expect(checkForAiErrorObject(null)).toBeUndefined();
    expect(checkForAiErrorObject('string')).toBeUndefined();
    expect(checkForAiErrorObject(42)).toBeUndefined();
  });

  test('returns undefined when error field is non-string', () => {
    expect(checkForAiErrorObject({ error: 42 })).toBeUndefined();
  });
});

// ============================================================================
// actions
// ============================================================================

describe('useAiAssist › actions', () => {
  test('returns a single copy-paste action when settings are undefined', () => {
    const { result } = renderHook(() => useAiAssist({ settings: undefined, keyStore: undefined }));

    expect(result.current.actions).toHaveLength(1);
    expect(result.current.actions[0]).toMatchObject({
      provider: 'copy-paste',
      isDefault: true,
      isAvailable: true
    });
  });

  test('returns one action per configured provider', () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'copy-paste' }, { provider: 'openai', secretName: 'secret.openai' }]
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.openai', 'sk-test']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    expect(result.current.actions.map((a) => a.provider)).toEqual(['copy-paste', 'openai']);
  });

  test('marks API providers unavailable when keystore is missing', () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: undefined })
    );

    expect(result.current.actions[0].isAvailable).toBe(false);
    expect(result.current.actions[0].unavailableReason).toMatch(/no keystore/i);
  });

  test('marks API providers unavailable when keystore is locked', () => {
    const keyStore = new StubKeyStore(false);
    const { result } = renderHook(() => useAiAssist({ settings: settingsFor('openai'), keyStore }));

    expect(result.current.actions[0].isAvailable).toBe(false);
    expect(result.current.actions[0].unavailableReason).toMatch(/locked/i);
  });

  test('marks API providers unavailable when secret name is missing', () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'openai' }] // no secretName
    };
    const keyStore = new StubKeyStore();
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    expect(result.current.actions[0].isAvailable).toBe(false);
    expect(result.current.actions[0].unavailableReason).toMatch(/no API key secret/i);
  });

  test('marks API providers unavailable when secret is not in the keystore', () => {
    const keyStore = new StubKeyStore(true, new Map()); // unlocked but empty
    const { result } = renderHook(() => useAiAssist({ settings: settingsFor('openai'), keyStore }));

    expect(result.current.actions[0].isAvailable).toBe(false);
    expect(result.current.actions[0].unavailableReason).toMatch(/not found/i);
  });

  test('marks API providers unavailable when keystore.hasSecret fails', () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new FailingKeyStore() })
    );

    expect(result.current.actions[0].isAvailable).toBe(false);
    expect(result.current.actions[0].unavailableReason).toMatch(/not found/i);
  });

  test('marks the configured defaultProvider when present and enabled', () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'copy-paste' }, { provider: 'openai', secretName: 'secret.openai' }],
      defaultProvider: 'openai'
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.openai', 'sk-test']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    const defaults = result.current.actions.filter((a) => a.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].provider).toBe('openai');
  });

  test('falls back to first provider when defaultProvider is not in the enabled set', () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'copy-paste' }, { provider: 'openai', secretName: 'secret.openai' }],
      defaultProvider: 'anthropic' // not in providers
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.openai', 'sk-test']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    const defaults = result.current.actions.filter((a) => a.isDefault);
    expect(defaults[0].provider).toBe('copy-paste');
  });

  test('marks no-secret providers (ollama) available without a configured secret or keystore', () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'ollama', endpoint: 'http://localhost:11434/v1', model: 'llama3.2' }]
    };
    const { result } = renderHook(() => useAiAssist({ settings, keyStore: undefined }));

    expect(result.current.actions[0].provider).toBe('ollama');
    expect(result.current.actions[0].isAvailable).toBe(true);
    expect(result.current.actions[0].unavailableReason).toBeUndefined();
  });

  test('marks no-secret providers (openai-compat) available even with a locked keystore', () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'openai-compat', endpoint: 'http://10.0.0.5:8080/v1', model: 'mistral-7b' }]
    };
    const keyStore = new StubKeyStore(false); // locked
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    expect(result.current.actions[0].isAvailable).toBe(true);
  });
});

// ============================================================================
// copyPrompt
// ============================================================================

describe('useAiAssist › copyPrompt', () => {
  let writeText: jest.Mock;

  beforeEach(() => {
    writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });
  });

  test('copies the combined prompt to the clipboard and returns "copied"', async () => {
    const { result } = renderHook(() => useAiAssist({ settings: undefined, keyStore: undefined }));

    let copyResult: Result<'copied'> | undefined;
    await act(async () => {
      copyResult = await result.current.copyPrompt(TEST_PROMPT);
    });

    expect(copyResult?.isSuccess()).toBe(true);
    expect(writeText).toHaveBeenCalledWith(TEST_PROMPT.combined);
  });

  test('returns failure when clipboard.writeText rejects', async () => {
    writeText.mockRejectedValueOnce(new Error('clipboard denied'));
    const { result } = renderHook(() => useAiAssist({ settings: undefined, keyStore: undefined }));

    let copyResult: Result<'copied'> | undefined;
    await act(async () => {
      copyResult = await result.current.copyPrompt(TEST_PROMPT);
    });

    expect(copyResult?.isFailure()).toBe(true);
    expect(copyResult?.message).toMatch(/failed to copy/i);
  });
});

// ============================================================================
// Shared helpers for direct/image/list tests (call mocking)
// ============================================================================

function mockSucceed<T>(spy: jest.SpyInstance, value: T): void {
  spy.mockResolvedValueOnce(succeed(value));
}

function mockFail<T>(spy: jest.SpyInstance, message: string): void {
  spy.mockResolvedValueOnce(fail<T>(message));
}

// ============================================================================
// generateDirect
// ============================================================================

describe('useAiAssist › generateDirect', () => {
  let directSpy: jest.SpyInstance;
  let proxiedSpy: jest.SpyInstance;

  beforeEach(() => {
    directSpy = jest.spyOn(AiAssist, 'callProviderCompletion');
    proxiedSpy = jest.spyOn(AiAssist, 'callProxiedCompletion');
  });

  afterEach(() => {
    directSpy.mockRestore();
    proxiedSpy.mockRestore();
  });

  test('fails when provider is not in settings', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new StubKeyStore() })
    );

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('anthropic', TEST_PROMPT, succeed);
    });

    expect(r?.isFailure()).toBe(true);
    expect(r?.message).toMatch(/not configured/i);
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('fails when provider has no secret name', async () => {
    const settings: AiAssist.IAiAssistSettings = { providers: [{ provider: 'openai' }] };
    const { result } = renderHook(() => useAiAssist({ settings, keyStore: new StubKeyStore() }));

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(r?.message).toMatch(/no secret name/i);
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('fails when keystore is missing', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: undefined })
    );

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(r?.message).toMatch(/no keystore/i);
  });

  test('fails when API key fetch fails', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new FailingKeyStore() })
    );

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(r?.message).toMatch(/failed to get API key/i);
  });

  test('returns the validated entity on success', async () => {
    mockSucceed(directSpy, { content: '{"name":"Alice"}', truncated: false });
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<{ entity: { name: string }; source: 'ai' }> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, (parsed) =>
        succeed(parsed as { name: string })
      );
    });

    expect(r?.isSuccess()).toBe(true);
    if (r?.isSuccess()) {
      expect(r.value.entity).toEqual({ name: 'Alice' });
      expect(r.value.source).toBe('ai');
    }
  });

  test('strips markdown code fences before parsing', async () => {
    mockSucceed(directSpy, { content: '```json\n{"x":1}\n```', truncated: false });
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<{ entity: { x: number }; source: 'ai' }> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, (p) => succeed(p as { x: number }));
    });

    expect(r?.isSuccess()).toBe(true);
  });

  test('fails fast when the response is truncated (no retry)', async () => {
    mockSucceed(directSpy, { content: 'partial', truncated: true });
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(r?.message).toMatch(/truncated/i);
    expect(directSpy).toHaveBeenCalledTimes(1);
  });

  test('fails when JSON parse fails (no retry)', async () => {
    mockSucceed(directSpy, { content: 'not json', truncated: false });
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(r?.message).toMatch(/invalid JSON/i);
    expect(directSpy).toHaveBeenCalledTimes(1);
  });

  test('surfaces an AI error object as a failure', async () => {
    mockSucceed(directSpy, { content: '{"error":"refused","term":"sketchy"}', truncated: false });
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(r?.message).toMatch(/AI declined.*refused/);
  });

  test('retries when the validator fails and succeeds on the next attempt (logs the retry)', async () => {
    mockSucceed(directSpy, { content: '{"x":"bad"}', truncated: false });
    mockSucceed(directSpy, { content: '{"x":1}', truncated: false });

    const warn = jest.fn();
    const params = defaultParams({
      logger: {
        logLevel: 'detail',
        log: jest.fn(),
        error: jest.fn(),
        warn,
        info: jest.fn(),
        detail: jest.fn()
      }
    });
    const { result } = renderHook(() => useAiAssist(params));
    let attempt = 0;
    const convert = (parsed: unknown): Result<{ x: number }> => {
      const obj = parsed as { x: unknown };
      attempt += 1;
      if (typeof obj.x !== 'number') {
        return fail('x is not a number');
      }
      return succeed({ x: obj.x });
    };

    let r: Result<{ entity: { x: number }; source: 'ai' }> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, convert);
    });

    expect(r?.isSuccess()).toBe(true);
    expect(attempt).toBe(2);
    expect(directSpy).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/validation failed.*1\/3/));
  });

  test('fails up front when the descriptor lookup fails for the requested provider', async () => {
    // The string union prevents this at compile time; cast simulates a
    // settings file that pre-dates a renamed provider id.
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'mystery-provider' as AiAssist.AiProviderId, secretName: 'secret.mystery' }]
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.mystery', 'sk-x']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect(
        'mystery-provider' as AiAssist.AiProviderId,
        TEST_PROMPT,
        succeed
      );
    });

    expect(r?.message).toMatch(/unknown AI provider/i);
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('fails after exceeding max validator attempts', async () => {
    mockSucceed(directSpy, { content: '{"x":"bad"}', truncated: false });
    mockSucceed(directSpy, { content: '{"x":"still bad"}', truncated: false });
    mockSucceed(directSpy, { content: '{"x":"nope"}', truncated: false });

    const { result } = renderHook(() => useAiAssist(defaultParams()));
    const convert = (): Result<unknown> => fail('always fails');

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, convert);
    });

    expect(r?.message).toMatch(/validation failed after 3 attempts/i);
    expect(directSpy).toHaveBeenCalledTimes(3);
  });

  test('surfaces upstream API failures', async () => {
    mockFail(directSpy, 'API offline');
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<unknown> | undefined;
    await act(async () => {
      r = await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(r?.message).toBe('API offline');
  });

  test('routes through the proxy for CORS-restricted providers when proxyUrl is set', async () => {
    mockSucceed(proxiedSpy, { content: '{"x":1}', truncated: false });
    const settings: AiAssist.IAiAssistSettings = {
      ...settingsFor('xai-grok'),
      providers: [{ provider: 'xai-grok', secretName: 'secret.xai-grok' }],
      proxyUrl: 'http://proxy.local:3001'
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.xai-grok', 'sk-xai']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    await act(async () => {
      await result.current.generateDirect('xai-grok', TEST_PROMPT, succeed);
    });

    expect(proxiedSpy).toHaveBeenCalledTimes(1);
    expect(proxiedSpy.mock.calls[0][0]).toBe('http://proxy.local:3001');
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('routes direct (skips proxy) for non-CORS providers when proxyAllProviders is false', async () => {
    mockSucceed(directSpy, { content: '{"x":1}', truncated: false });
    const settings: AiAssist.IAiAssistSettings = {
      ...settingsFor('openai'),
      proxyUrl: 'http://proxy.local:3001'
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.openai', 'sk-test']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    await act(async () => {
      await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(directSpy).toHaveBeenCalledTimes(1);
    expect(proxiedSpy).not.toHaveBeenCalled();
  });

  test('routes through the proxy when proxyAllProviders is true even for non-CORS providers', async () => {
    mockSucceed(proxiedSpy, { content: '{"x":1}', truncated: false });
    const settings: AiAssist.IAiAssistSettings = {
      ...settingsFor('openai'),
      proxyUrl: 'http://proxy.local:3001',
      proxyAllProviders: true
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.openai', 'sk-test']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    await act(async () => {
      await result.current.generateDirect('openai', TEST_PROMPT, succeed);
    });

    expect(proxiedSpy).toHaveBeenCalledTimes(1);
  });

  test('forwards endpoint and uses an empty apiKey for no-secret providers (ollama)', async () => {
    mockSucceed(directSpy, { content: '{"x":1}', truncated: false });
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'ollama', endpoint: 'http://localhost:11434/v1', model: 'llama3.2' }]
    };
    const { result } = renderHook(() => useAiAssist({ settings, keyStore: undefined }));

    await act(async () => {
      await result.current.generateDirect('ollama', TEST_PROMPT, succeed);
    });

    expect(directSpy).toHaveBeenCalledTimes(1);
    const call = directSpy.mock.calls[0][0] as AiAssist.IProviderCompletionParams;
    expect(call.endpoint).toBe('http://localhost:11434/v1');
    expect(call.apiKey).toBe('');
    expect(call.modelOverride).toBe('llama3.2');
  });
});

// ============================================================================
// generateImages
// ============================================================================

describe('useAiAssist › generateImages', () => {
  let directSpy: jest.SpyInstance;
  let proxiedSpy: jest.SpyInstance;

  beforeEach(() => {
    directSpy = jest.spyOn(AiAssist, 'callProviderImageGeneration');
    proxiedSpy = jest.spyOn(AiAssist, 'callProxiedImageGeneration');
  });

  afterEach(() => {
    directSpy.mockRestore();
    proxiedSpy.mockRestore();
  });

  test('fails when provider is not configured', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new StubKeyStore() })
    );

    let r: Result<AiAssist.IAiImageGenerationResponse> | undefined;
    await act(async () => {
      r = await result.current.generateImages('anthropic', { prompt: 'cat' });
    });

    expect(r?.message).toMatch(/not configured/i);
  });

  test('fails when provider does not support image generation', async () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'anthropic', secretName: 'secret.anthropic' }]
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.anthropic', 'sk-anth']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    let r: Result<AiAssist.IAiImageGenerationResponse> | undefined;
    await act(async () => {
      r = await result.current.generateImages('anthropic', { prompt: 'cat' });
    });

    expect(r?.message).toMatch(/does not support image generation/i);
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('fails when secret name is missing', async () => {
    const settings: AiAssist.IAiAssistSettings = { providers: [{ provider: 'openai' }] };
    const { result } = renderHook(() => useAiAssist({ settings, keyStore: new StubKeyStore() }));

    let r: Result<AiAssist.IAiImageGenerationResponse> | undefined;
    await act(async () => {
      r = await result.current.generateImages('openai', { prompt: 'cat' });
    });

    expect(r?.message).toMatch(/no secret name/i);
  });

  test('fails when keystore is missing', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: undefined })
    );

    let r: Result<AiAssist.IAiImageGenerationResponse> | undefined;
    await act(async () => {
      r = await result.current.generateImages('openai', { prompt: 'cat' });
    });

    expect(r?.message).toMatch(/no keystore/i);
  });

  test('fails when API key fetch fails', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new FailingKeyStore() })
    );

    let r: Result<AiAssist.IAiImageGenerationResponse> | undefined;
    await act(async () => {
      r = await result.current.generateImages('openai', { prompt: 'cat' });
    });

    expect(r?.message).toMatch(/failed to get API key/i);
  });

  test('returns the response on success', async () => {
    const response: AiAssist.IAiImageGenerationResponse = {
      images: [{ mimeType: 'image/png', base64: 'AAAA' }]
    };
    mockSucceed(directSpy, response);

    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<AiAssist.IAiImageGenerationResponse> | undefined;
    await act(async () => {
      r = await result.current.generateImages('openai', { prompt: 'cat' });
    });

    expect(r?.isSuccess()).toBe(true);
    if (r?.isSuccess()) {
      expect(r.value).toEqual(response);
    }
  });

  test('forwards the abort signal to the underlying call', async () => {
    mockSucceed(directSpy, { images: [{ mimeType: 'image/png', base64: 'A' }] });
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    const controller = new AbortController();

    await act(async () => {
      await result.current.generateImages('openai', { prompt: 'cat' }, controller.signal);
    });

    expect(directSpy.mock.calls[0][0].signal).toBe(controller.signal);
  });

  test('routes through the proxy for CORS-restricted providers', async () => {
    mockSucceed(proxiedSpy, { images: [{ mimeType: 'image/jpeg', base64: 'X' }] });
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'xai-grok', secretName: 'secret.xai-grok' }],
      proxyUrl: 'http://proxy.local:3001'
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.xai-grok', 'sk-xai']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    await act(async () => {
      await result.current.generateImages('xai-grok', { prompt: 'cat' });
    });

    expect(proxiedSpy).toHaveBeenCalledTimes(1);
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('surfaces upstream failures', async () => {
    mockFail(directSpy, 'image API down');
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<AiAssist.IAiImageGenerationResponse> | undefined;
    await act(async () => {
      r = await result.current.generateImages('openai', { prompt: 'cat' });
    });

    expect(r?.message).toBe('image API down');
  });

  test('fails up front when the descriptor lookup fails', async () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'unknown-x' as AiAssist.AiProviderId, secretName: 'secret.unknown' }]
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.unknown', 'sk']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    let r: Result<AiAssist.IAiImageGenerationResponse> | undefined;
    await act(async () => {
      r = await result.current.generateImages('unknown-x' as AiAssist.AiProviderId, { prompt: 'cat' });
    });

    expect(r?.message).toMatch(/unknown AI provider/i);
  });

  test('forwards endpoint when configured (e.g. self-hosted reverse proxy)', async () => {
    mockSucceed(directSpy, { images: [{ mimeType: 'image/png', base64: 'A' }] });
    const settings: AiAssist.IAiAssistSettings = {
      providers: [
        {
          provider: 'openai',
          secretName: 'secret.openai',
          endpoint: 'http://10.0.0.5:8080/v1',
          model: 'gpt-image-1'
        }
      ]
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.openai', 'sk-test']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    await act(async () => {
      await result.current.generateImages('openai', { prompt: 'cat' });
    });

    expect(directSpy).toHaveBeenCalledTimes(1);
    const call = directSpy.mock.calls[0][0] as AiAssist.IProviderImageGenerationParams;
    expect(call.endpoint).toBe('http://10.0.0.5:8080/v1');
    expect(call.modelOverride).toBe('gpt-image-1');
  });
});

// ============================================================================
// listModels
// ============================================================================

describe('useAiAssist › listModels', () => {
  let directSpy: jest.SpyInstance;
  let proxiedSpy: jest.SpyInstance;

  beforeEach(() => {
    directSpy = jest.spyOn(AiAssist, 'callProviderListModels');
    proxiedSpy = jest.spyOn(AiAssist, 'callProxiedListModels');
  });

  afterEach(() => {
    directSpy.mockRestore();
    proxiedSpy.mockRestore();
  });

  test('fails when provider is not configured', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new StubKeyStore() })
    );

    let r: Result<ReadonlyArray<AiAssist.IAiModelInfo>> | undefined;
    await act(async () => {
      r = await result.current.listModels('anthropic');
    });

    expect(r?.message).toMatch(/not configured/i);
  });

  test('fails when secret name is missing', async () => {
    const settings: AiAssist.IAiAssistSettings = { providers: [{ provider: 'openai' }] };
    const { result } = renderHook(() => useAiAssist({ settings, keyStore: new StubKeyStore() }));

    let r: Result<ReadonlyArray<AiAssist.IAiModelInfo>> | undefined;
    await act(async () => {
      r = await result.current.listModels('openai');
    });

    expect(r?.message).toMatch(/no secret name/i);
  });

  test('fails when keystore is missing', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: undefined })
    );

    let r: Result<ReadonlyArray<AiAssist.IAiModelInfo>> | undefined;
    await act(async () => {
      r = await result.current.listModels('openai');
    });

    expect(r?.message).toMatch(/no keystore/i);
  });

  test('fails when API key fetch fails', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new FailingKeyStore() })
    );

    let r: Result<ReadonlyArray<AiAssist.IAiModelInfo>> | undefined;
    await act(async () => {
      r = await result.current.listModels('openai');
    });

    expect(r?.message).toMatch(/failed to get API key/i);
  });

  test('returns the models on success and forwards the capability filter', async () => {
    const models: ReadonlyArray<AiAssist.IAiModelInfo> = [
      { id: 'gpt-image-1.5', capabilities: new Set(['image-generation']) }
    ];
    mockSucceed(directSpy, models);

    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<ReadonlyArray<AiAssist.IAiModelInfo>> | undefined;
    await act(async () => {
      r = await result.current.listModels('openai', 'image-generation');
    });

    expect(r?.isSuccess()).toBe(true);
    expect(directSpy.mock.calls[0][0].capability).toBe('image-generation');
  });

  test('omits capability when not specified', async () => {
    mockSucceed(directSpy, []);
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    await act(async () => {
      await result.current.listModels('openai');
    });

    expect(directSpy.mock.calls[0][0].capability).toBeUndefined();
  });

  test('forwards the abort signal', async () => {
    mockSucceed(directSpy, []);
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    const controller = new AbortController();

    await act(async () => {
      await result.current.listModels('openai', undefined, controller.signal);
    });

    expect(directSpy.mock.calls[0][0].signal).toBe(controller.signal);
  });

  test('routes through the proxy for CORS-restricted providers', async () => {
    mockSucceed(proxiedSpy, []);
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'xai-grok', secretName: 'secret.xai-grok' }],
      proxyUrl: 'http://proxy.local:3001'
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.xai-grok', 'sk-xai']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    await act(async () => {
      await result.current.listModels('xai-grok', 'image-generation');
    });

    expect(proxiedSpy).toHaveBeenCalledTimes(1);
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('surfaces upstream failures', async () => {
    mockFail(directSpy, 'list API offline');
    const { result } = renderHook(() => useAiAssist(defaultParams()));

    let r: Result<ReadonlyArray<AiAssist.IAiModelInfo>> | undefined;
    await act(async () => {
      r = await result.current.listModels('openai');
    });

    expect(r?.message).toBe('list API offline');
  });

  test('fails up front when the descriptor lookup fails', async () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'unknown-y' as AiAssist.AiProviderId, secretName: 'secret.unknown' }]
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.unknown', 'sk']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    let r: Result<ReadonlyArray<AiAssist.IAiModelInfo>> | undefined;
    await act(async () => {
      r = await result.current.listModels('unknown-y' as AiAssist.AiProviderId);
    });

    expect(r?.message).toMatch(/unknown AI provider/i);
  });

  test('forwards endpoint and uses an empty apiKey for no-secret providers (ollama)', async () => {
    mockSucceed(directSpy, []);
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'ollama', endpoint: 'http://localhost:11434/v1' }]
    };
    const { result } = renderHook(() => useAiAssist({ settings, keyStore: undefined }));

    await act(async () => {
      await result.current.listModels('ollama');
    });

    expect(directSpy).toHaveBeenCalledTimes(1);
    const call = directSpy.mock.calls[0][0] as AiAssist.IProviderListModelsParams;
    expect(call.endpoint).toBe('http://localhost:11434/v1');
    expect(call.apiKey).toBe('');
  });
});

// ============================================================================
// streamDirect
// ============================================================================

function makeStreamSource(
  events: ReadonlyArray<AiAssist.IAiStreamEvent>
): AsyncIterable<AiAssist.IAiStreamEvent> {
  return (async function* (): AsyncGenerator<AiAssist.IAiStreamEvent> {
    for (const e of events) {
      yield e;
    }
  })();
}

describe('useAiAssist › streamDirect', () => {
  let directSpy: jest.SpyInstance;
  let proxiedSpy: jest.SpyInstance;

  beforeEach(() => {
    directSpy = jest.spyOn(AiAssist, 'callProviderCompletionStream');
    proxiedSpy = jest.spyOn(AiAssist, 'callProxiedCompletionStream');
  });

  afterEach(() => {
    directSpy.mockRestore();
    proxiedSpy.mockRestore();
  });

  test('fails when provider is not configured', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new StubKeyStore() })
    );
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('anthropic', TEST_PROMPT, jest.fn());
    });
    expect(r?.message).toMatch(/not configured/i);
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('fails when secret name is missing', async () => {
    const settings: AiAssist.IAiAssistSettings = { providers: [{ provider: 'openai' }] };
    const { result } = renderHook(() => useAiAssist({ settings, keyStore: new StubKeyStore() }));
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('openai', TEST_PROMPT, jest.fn());
    });
    expect(r?.message).toMatch(/no secret name/i);
  });

  test('fails when keystore is missing', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: undefined })
    );
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('openai', TEST_PROMPT, jest.fn());
    });
    expect(r?.message).toMatch(/no keystore/i);
  });

  test('fails when API key fetch fails', async () => {
    const { result } = renderHook(() =>
      useAiAssist({ settings: settingsFor('openai'), keyStore: new FailingKeyStore() })
    );
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('openai', TEST_PROMPT, jest.fn());
    });
    expect(r?.message).toMatch(/failed to get API key/i);
  });

  test('surfaces the connect-time failure when callProviderCompletionStream returns Result.fail', async () => {
    directSpy.mockResolvedValueOnce(fail<AsyncIterable<AiAssist.IAiStreamEvent>>('connection refused'));
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('openai', TEST_PROMPT, jest.fn());
    });
    expect(r?.message).toBe('connection refused');
  });

  test('emits each event to the callback and returns aggregated text on done', async () => {
    directSpy.mockResolvedValueOnce(
      succeed(
        makeStreamSource([
          { type: 'text-delta', delta: 'Hi, ' },
          { type: 'text-delta', delta: 'world!' },
          { type: 'done', truncated: false, fullText: 'Hi, world!' }
        ])
      )
    );
    const events: AiAssist.IAiStreamEvent[] = [];
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('openai', TEST_PROMPT, (e) => events.push(e));
    });
    expect(events.map((e) => e.type)).toEqual(['text-delta', 'text-delta', 'done']);
    expect(r?.isSuccess()).toBe(true);
    if (r?.isSuccess()) {
      expect(r.value).toEqual({ fullText: 'Hi, world!', truncated: false });
    }
  });

  test('returns Result.fail when the stream ends in a terminal error event', async () => {
    directSpy.mockResolvedValueOnce(
      succeed(
        makeStreamSource([
          { type: 'text-delta', delta: 'half' },
          { type: 'error', message: 'rate limited' }
        ])
      )
    );
    const events: AiAssist.IAiStreamEvent[] = [];
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('openai', TEST_PROMPT, (e) => events.push(e));
    });
    expect(r?.isFailure()).toBe(true);
    expect(r?.message).toBe('rate limited');
    // The callback still saw both events (caller can show partial text + error).
    expect(events.map((e) => e.type)).toEqual(['text-delta', 'error']);
  });

  test('returns Result.fail when the stream ends without a terminal done or error event', async () => {
    // Simulates a misbehaving proxy/transport that closes the stream after
    // some content but without ever sending a `done` or `error` event.
    directSpy.mockResolvedValueOnce(succeed(makeStreamSource([{ type: 'text-delta', delta: 'partial' }])));
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('openai', TEST_PROMPT, jest.fn());
    });
    expect(r?.isFailure()).toBe(true);
    expect(r?.message).toMatch(/without a terminal done or error event/);
  });

  test('returns Result.fail (does not reject) when the onEvent callback throws', async () => {
    directSpy.mockResolvedValueOnce(
      succeed(
        makeStreamSource([
          { type: 'text-delta', delta: 'first' },
          { type: 'done', truncated: false, fullText: 'first' }
        ])
      )
    );
    const onEvent = jest.fn(() => {
      throw new Error('consumer blew up');
    });
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    // Wrap in a no-throw expectation: the hook must always resolve to a Result,
    // never reject — that's the documented contract.
    await act(async () => {
      r = await result.current.streamDirect('openai', TEST_PROMPT, onEvent);
    });
    expect(r?.isFailure()).toBe(true);
    expect(r?.message).toMatch(/event handler failed.*consumer blew up/);
    // Iteration stops on the first throw so only one event is delivered.
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  test('forwards tools and orders messagesBefore before the current turn', async () => {
    directSpy.mockResolvedValueOnce(
      succeed(makeStreamSource([{ type: 'done', truncated: false, fullText: '' }]))
    );
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    await act(async () => {
      await result.current.streamDirect('openai', TEST_PROMPT, jest.fn(), {
        tools: [{ type: 'web_search' }],
        messagesBefore: [{ role: 'assistant', content: 'previous turn' }]
      });
    });
    const params = directSpy.mock.calls[0][0];
    expect(params.tools).toEqual([{ type: 'web_search' }]);
    // The hook lowers to the unified request shape: history precedes the current turn.
    expect(params.system).toBe('system');
    expect(params.messages).toEqual([
      { role: 'assistant', content: 'previous turn' },
      { role: 'user', content: 'hello' }
    ]);
  });

  test('forwards the abort signal', async () => {
    directSpy.mockResolvedValueOnce(
      succeed(makeStreamSource([{ type: 'done', truncated: false, fullText: '' }]))
    );
    const controller = new AbortController();
    const { result } = renderHook(() => useAiAssist(defaultParams()));
    await act(async () => {
      await result.current.streamDirect('openai', TEST_PROMPT, jest.fn(), { signal: controller.signal });
    });
    expect(directSpy.mock.calls[0][0].signal).toBe(controller.signal);
  });

  test('routes through the proxy for streaming-CORS-restricted providers', async () => {
    proxiedSpy.mockResolvedValueOnce(
      succeed(makeStreamSource([{ type: 'done', truncated: false, fullText: '' }]))
    );
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'xai-grok', secretName: 'secret.xai-grok' }],
      proxyUrl: 'http://proxy.local:3001'
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.xai-grok', 'sk-xai']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));

    await act(async () => {
      await result.current.streamDirect('xai-grok', TEST_PROMPT, jest.fn());
    });

    expect(proxiedSpy).toHaveBeenCalledTimes(1);
    expect(directSpy).not.toHaveBeenCalled();
  });

  test('fails up front when descriptor lookup fails', async () => {
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'unknown-z' as AiAssist.AiProviderId, secretName: 'secret.unknown' }]
    };
    const keyStore = new StubKeyStore(true, new Map([['secret.unknown', 'sk']]));
    const { result } = renderHook(() => useAiAssist({ settings, keyStore }));
    let r: Result<{ fullText: string; truncated: boolean }> | undefined;
    await act(async () => {
      r = await result.current.streamDirect('unknown-z' as AiAssist.AiProviderId, TEST_PROMPT, jest.fn());
    });
    expect(r?.message).toMatch(/unknown AI provider/i);
  });

  test('forwards endpoint and uses an empty apiKey for no-secret providers (ollama)', async () => {
    directSpy.mockResolvedValueOnce(
      succeed(makeStreamSource([{ type: 'done', truncated: false, fullText: 'hi' }]))
    );
    const settings: AiAssist.IAiAssistSettings = {
      providers: [{ provider: 'ollama', endpoint: 'http://localhost:11434/v1', model: 'llama3.2' }]
    };
    const { result } = renderHook(() => useAiAssist({ settings, keyStore: undefined }));

    await act(async () => {
      await result.current.streamDirect('ollama', TEST_PROMPT, jest.fn());
    });

    expect(directSpy).toHaveBeenCalledTimes(1);
    const call = directSpy.mock.calls[0][0] as AiAssist.IProviderCompletionStreamParams;
    expect(call.endpoint).toBe('http://localhost:11434/v1');
    expect(call.apiKey).toBe('');
    expect(call.modelOverride).toBe('llama3.2');
  });
});
