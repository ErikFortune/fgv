// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Antagonist torture tests — target class 4 (ai-assist-antagonist phase 2):
 * thinking-vs-temperature param-rejection matrix, exercised end-to-end through
 * `callProviderCompletion` (not just the pure `mergeThinkingConfig` /
 * `checkTemperatureConflict` unit level, which `thinkingOptionsResolver.test.ts`
 * already covers exhaustively). Also covers the "tier selects the model,
 * thinking/tools never select a model" composition invariant.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

const testPrompt = new AiAssist.AiPrompt('Generate a recipe', 'You are a helpful assistant');

function mockFetchResponse(body: unknown, status: number = 200): void {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

function anthropicResponse(text: string): unknown {
  return { content: [{ type: 'text', text }], stop_reason: 'end_turn' };
}
function openAiResponse(text: string): unknown {
  return { choices: [{ message: { content: text }, finish_reason: 'stop' }] };
}
function geminiResponse(text: string): unknown {
  return { candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] };
}

function anthropicDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'anthropic',
    label: 'Anthropic',
    buttonLabel: 'AI Assist | Anthropic',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: { base: 'claude-sonnet-5', advanced: 'claude-opus-4-8', frontier: 'claude-opus-4-9' },
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    ...overrides
  };
}

function openAiDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'AI Assist | OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-5.4-mini',
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    ...overrides
  };
}

function xaiDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'xai-grok',
    label: 'xAI Grok',
    buttonLabel: 'AI Assist | Grok',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4-1-fast',
    supportedTools: [],
    corsRestricted: true,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    ...overrides
  };
}

function geminiDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'google-gemini',
    label: 'Google Gemini',
    buttonLabel: 'AI Assist | Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: { base: 'gemini-2.5-flash' },
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    ...overrides
  };
}

// Unknown-provider (no ThinkingProviderDiscriminator mapping): ollama, groq, mistral,
// openai-compat, copy-paste all map to `undefined` via providerDiscriminatorForId.
function unknownThinkingProviderDescriptor(
  overrides: Partial<IAiProviderDescriptor> = {}
): IAiProviderDescriptor {
  return {
    id: 'ollama',
    label: 'Ollama',
    buttonLabel: 'AI Assist | Ollama',
    needsSecret: false,
    apiFormat: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: false,
    streamingCorsRestricted: false,
    thinkingMode: 'unsupported',
    ...overrides
  };
}

describe('temperature + thinking rejection matrix — end-to-end via callProviderCompletion (antagonist)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Wrong impl this guards: a single global "reject if both temperature and thinking are
  // set, regardless of provider" would incorrectly reject this Anthropic case too (it
  // SHOULD reject, but for the provider-specific reason, not a blanket one) — and more
  // importantly a matrix implementation that's missing the Anthropic arm entirely would
  // let this request through to the wire.
  test('Anthropic: temperature + thinking together is rejected before any fetch call', async () => {
    const result = await AiAssist.callProviderCompletion({
      descriptor: anthropicDescriptor(),
      apiKey: 'sk',
      temperature: 0.7,
      thinking: { effort: 'medium' },
      ...testPrompt.toRequest()
    });

    expect(result).toFailWith(/thinking mode is not compatible with temperature on provider anthropic/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('OpenAI: temperature + a non-none effort is rejected before any fetch call', async () => {
    const result = await AiAssist.callProviderCompletion({
      descriptor: openAiDescriptor(),
      apiKey: 'sk',
      temperature: 0.7,
      thinking: { effort: 'medium' },
      ...testPrompt.toRequest()
    });

    expect(result).toFailWith(/thinking mode is not compatible with temperature on provider openai/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // Wrong impl this guards: a matrix that only flips OpenAI's `'none'` effort case for
  // the *resolver* but forgets to re-thread it through the dispatcher's call site would
  // still fail here even though 'none' should re-enable temperature end-to-end.
  test("OpenAI: temperature + effort 'none' succeeds and the resolved request carries temperature", async () => {
    mockFetchResponse(openAiResponse('ok'));

    const result = await AiAssist.callProviderCompletion({
      descriptor: openAiDescriptor(),
      apiKey: 'sk',
      temperature: 0.7,
      thinking: { providers: [{ provider: 'openai', config: { effort: 'none' } }] },
      ...testPrompt.toRequest()
    });

    expect(result).toSucceed();
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.temperature).toBe(0.7);
  });

  test('xAI: temperature + thinking together is rejected before any fetch call', async () => {
    const result = await AiAssist.callProviderCompletion({
      descriptor: xaiDescriptor(),
      apiKey: 'sk',
      temperature: 0.7,
      thinking: { effort: 'medium' },
      ...testPrompt.toRequest()
    });

    expect(result).toFailWith(/thinking mode is not compatible with temperature on provider xai/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // Wrong impl this guards: a blanket "reject if both are set" matrix would incorrectly
  // fail this Gemini case, which must succeed with BOTH params reaching the wire request
  // (neither silently dropped — the target-class-3 "no silent drop" theme applied here).
  test('Gemini: temperature + thinking together succeeds with both reaching the wire request', async () => {
    mockFetchResponse(geminiResponse('ok'));

    const result = await AiAssist.callProviderCompletion({
      descriptor: geminiDescriptor(),
      apiKey: 'sk',
      temperature: 0.7,
      thinking: { effort: 'medium' },
      ...testPrompt.toRequest()
    });

    expect(result).toSucceed();
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.generationConfig.temperature).toBe(0.7);
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 4096 });
  });

  // Wrong impl this guards: a matrix missing the "unknown provider" fallthrough arm would
  // either throw or incorrectly reject/require thinking for a provider with no
  // ThinkingProviderDiscriminator mapping (ollama, groq, mistral, openai-compat).
  test('unknown thinking provider: thinking is silently ignored, not an error, and temperature passes through', async () => {
    mockFetchResponse(openAiResponse('ok'));

    const result = await AiAssist.callProviderCompletion({
      descriptor: unknownThinkingProviderDescriptor(),
      apiKey: '',
      temperature: 0.7,
      thinking: { effort: 'high' },
      ...testPrompt.toRequest()
    });

    expect(result).toSucceed();
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.temperature).toBe(0.7);
    // No reasoning/thinking-shaped field should have been injected for an unsupported provider.
    expect(body.reasoning_effort).toBeUndefined();
    expect(body.reasoning).toBeUndefined();
  });

  // Composition: tier selects the model; thinking rides on top and never gates on model
  // capability. Wrong impl this guards: a resolver that only applies thinking when the
  // resolved model matches some allowlist (a capability branch) would silently drop
  // thinking here even though the base-tier model (the default when `tier` is omitted)
  // was legitimately requested.
  test('composition: a base-tier + thinking request resolves the base model AND still sends thinking', async () => {
    mockFetchResponse(anthropicResponse('ok'));

    const result = await AiAssist.callProviderCompletion({
      descriptor: anthropicDescriptor(),
      apiKey: 'sk',
      // tier omitted — base is the default; the assertion below confirms it resolved base,
      // not advanced/frontier, while thinking still rides on top.
      thinking: { effort: 'low' },
      ...testPrompt.toRequest()
    });

    expect(result).toSucceed();
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.model).toBe('claude-sonnet-5'); // the base-tier model, not advanced/frontier
    expect(body.thinking).toEqual({ type: 'enabled', budget_tokens: 2048 }); // low-effort budget
  });
});
