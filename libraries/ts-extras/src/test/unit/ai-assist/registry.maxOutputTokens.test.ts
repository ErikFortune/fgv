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

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';

/**
 * Providers that serve caller-chosen models; they declare no limits by design.
 * `copy-paste` reaches no API at all.
 */
const NON_CLOUD_PROVIDERS: ReadonlyArray<AiAssist.AiProviderId> = ['copy-paste', 'ollama', 'openai-compat'];

/**
 * Registered aliases that deliberately resolve to no recorded limit. Every other alias of every
 * cloud provider must resolve to one. When a limit is recorded for one of these, the exclusion test
 * below fails until the alias is removed from this list.
 */
const ALIASES_WITHOUT_A_LIMIT: ReadonlyArray<string> = [
  // Image and embedding models: no completion output limit applies.
  '@google-gemini:flash-image',
  '@google-gemini:embedding',
  '@openai:image',
  '@openai:embedding',
  '@xai-grok:imagine',
  // docs.x.ai states a context window and a default `max_output_tokens` (128,000 when unset,
  // "set a larger value to allow longer generations"), but no maximum.
  '@xai-grok:standard',
  '@xai-grok:flagship'
];

function getDescriptor(id: AiAssist.AiProviderId): AiAssist.IAiProviderDescriptor {
  return AiAssist.getProviderDescriptor(id).orThrow();
}

describe('AiAssist.resolveMaxOutputTokens', () => {
  describe('against the shipped registry', () => {
    test('a concrete model id resolves to its recorded limit', () => {
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), 'claude-opus-5-5')).toBe(128000);
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), 'claude-haiku-4-5')).toBe(64000);
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('openai'), 'gpt-6-luna')).toBe(128000);
    });

    test('a snapshot a provider page names has its own entry', () => {
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), 'claude-haiku-4-5-20251001')).toBe(
        64000
      );
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('openai'), 'gpt-5.4-nano-2026-03-17')).toBe(
        128000
      );
    });

    test.each([
      ['anthropic', 'claude-opus-5-6'],
      ['anthropic', 'claude-sonnet-5-6'],
      ['anthropic', 'claude-sonnet-50'],
      ['anthropic', 'claude-haiku-4-5-1'],
      ['anthropic', 'claude-haiku-4-5-2025100'],
      ['anthropic', 'claude-haiku-4-5-20251001-v2'],
      ['openai', 'gpt-6-luna-mini'],
      ['openai', 'gpt-6-sol-pro'],
      ['openai', 'gpt-6-solar'],
      ['openai', 'gpt-5.4-nano-2026-03'],
      ['openai', 'gpt-6'],
      ['openai', 'gpt-5.4'],
      // snapshots no fetched page names
      ['openai', 'gpt-6-luna-2026-13-45'],
      ['openai', 'gpt-5.4-nano-20260317'],
      ['anthropic', 'claude-haiku-4-5-2025-10-01'],
      ['anthropic', 'claude-opus-5-20260101']
    ] as ReadonlyArray<[AiAssist.AiProviderId, string]>)(
      '%s %s — a sibling, prefix, suffix or unnamed snapshot of a recorded id gets no limit',
      (id, model) => {
        expect(AiAssist.resolveMaxOutputTokens(getDescriptor(id), model)).toBeUndefined();
      }
    );

    test('an alias resolves to the same limit as the concrete id it names', () => {
      const anthropic = getDescriptor('anthropic');
      expect(AiAssist.resolveMaxOutputTokens(anthropic, '@anthropic:haiku')).toBe(
        AiAssist.resolveMaxOutputTokens(anthropic, 'claude-haiku-5-5')
      );
      expect(AiAssist.resolveMaxOutputTokens(anthropic, '@anthropic:opus')).toBe(
        AiAssist.resolveMaxOutputTokens(anthropic, 'claude-opus-5-5')
      );
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('openai'), '@openai:nano')).toBe(128000);
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('google-gemini'), '@google-gemini:pro')).toBe(
        AiAssist.resolveMaxOutputTokens(getDescriptor('google-gemini'), 'gemini-4-argon')
      );
    });

    test('a provider default with no alias resolves to its recorded limit', () => {
      // Groq names openai/gpt-oss-120b directly; its model page states 65,536.
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('groq'))).toBe(65536);
      // Mistral's Large 4 page states no maximum, so nothing is recorded.
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('mistral'))).toBe(undefined);
    });

    test('an unresolvable alias yields undefined', () => {
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), '@anthropic:nonexistent')).toBe(
        undefined
      );
      // Another provider's alias is not registered here either.
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), '@openai:mini')).toBe(undefined);
    });

    test('a provider that declares no limits yields undefined', () => {
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('ollama'), 'llama3.3')).toBe(undefined);
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('mistral'), 'mistral-large-4')).toBe(undefined);
    });

    test('a model no entry names yields undefined', () => {
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), 'claude-3-opus-20240229')).toBe(
        undefined
      );
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('openai'), 'text-embedding-3-small')).toBe(
        undefined
      );
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('groq'), 'llama-3.3-70b-versatile')).toBe(
        undefined
      );
    });

    test('every shipped entry names a non-empty concrete model id', () => {
      for (const descriptor of AiAssist.getProviderDescriptors()) {
        for (const entry of descriptor.maxOutputTokens ?? []) {
          // Groq ids carry an owner prefix (`openai/gpt-oss-120b`), hence the '/'.
          expect(entry.modelId).toMatch(/^[a-z0-9][a-z0-9./-]*$/);
          expect(entry.modelId.startsWith(AiAssist.MODEL_ALIAS_SIGIL)).toBe(false);
        }
      }
    });

    test('every recorded limit is a positive integer', () => {
      for (const descriptor of AiAssist.getProviderDescriptors()) {
        for (const entry of descriptor.maxOutputTokens ?? []) {
          expect(Number.isInteger(entry.maxOutputTokens) && entry.maxOutputTokens > 0).toBe(true);
        }
      }
    });

    test('self-hosted and copy-paste providers declare nothing', () => {
      for (const id of NON_CLOUD_PROVIDERS) {
        expect(getDescriptor(id).maxOutputTokens).toBeUndefined();
      }
    });
  });

  describe('with a ModelSpec and context, as a completion call takes them', () => {
    test('an undefined model resolves the descriptor default', () => {
      // anthropic defaultModel: base @anthropic:sonnet, advanced @anthropic:opus
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'))).toBe(128000);
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), undefined, 'advanced')).toBe(128000);
    });

    test('a spec object is walked for the requested tier', () => {
      // claude-haiku-4-5 (64000) against the opus alias (128000), so the two tiers differ.
      const spec: AiAssist.ModelSpec = { base: 'claude-haiku-4-5', advanced: '@anthropic:opus' };
      const anthropic = getDescriptor('anthropic');
      expect(AiAssist.resolveMaxOutputTokens(anthropic, spec)).toBe(64000);
      expect(AiAssist.resolveMaxOutputTokens(anthropic, spec, 'base')).toBe(64000);
      expect(AiAssist.resolveMaxOutputTokens(anthropic, spec, 'advanced')).toBe(128000);
      // frontier cascades to advanced
      expect(AiAssist.resolveMaxOutputTokens(anthropic, spec, 'frontier')).toBe(128000);
    });

    test('a string alias works as the spec', () => {
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('openai'), '@openai:flagship', 'advanced')).toBe(
        128000
      );
      expect(
        AiAssist.resolveMaxOutputTokens(getDescriptor('google-gemini'), '@google-gemini:flash', 'advanced')
      ).toBe(65536);
    });

    test('a provider with no default model yields undefined', () => {
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('ollama'))).toBe(undefined);
    });

    test('for every provider and tier, the lookup equals the lookup of the model resolveProviderModel picks', () => {
      const specs: ReadonlyArray<AiAssist.ModelSpec | undefined> = [
        undefined,
        { base: '@anthropic:haiku', advanced: '@anthropic:opus' },
        { base: '@openai:nano', advanced: '@openai:flagship', frontier: '@openai:pro' }
      ];
      for (const descriptor of AiAssist.getProviderDescriptors()) {
        for (const spec of specs) {
          for (const context of AiAssist.allModelSpecKeys) {
            const picked = AiAssist.resolveProviderModel(descriptor, spec, context).orDefault();
            const expected =
              picked === undefined ? undefined : AiAssist.resolveMaxOutputTokens(descriptor, picked);
            expect({
              provider: descriptor.id,
              context,
              limit: AiAssist.resolveMaxOutputTokens(descriptor, spec, context)
            }).toEqual({ provider: descriptor.id, context, limit: expected });
          }
        }
      }
    });
  });

  describe('agrees with the model a completion call actually sends', () => {
    const originalFetch = global.fetch;
    const prompt = new AiAssist.AiPrompt('Say ok', 'You are terse');

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    const responses: Partial<Record<AiAssist.AiProviderId, unknown>> = {
      anthropic: { content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn' },
      openai: { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] },
      groq: { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] }
    };
    type Tier = 'advanced' | 'frontier' | undefined;
    const cases: ReadonlyArray<[AiAssist.AiProviderId, string, Tier, AiAssist.ModelSpec | undefined]> = [
      ['anthropic', 'default', undefined, undefined],
      ['anthropic', 'default', 'advanced', undefined],
      ['anthropic', 'default', 'frontier', undefined],
      ['anthropic', 'spec', undefined, { base: '@anthropic:haiku', advanced: '@anthropic:opus' }],
      ['anthropic', 'spec', 'advanced', { base: '@anthropic:haiku', advanced: '@anthropic:opus' }],
      ['openai', 'default', undefined, undefined],
      ['openai', 'default', 'advanced', undefined],
      ['openai', 'default', 'frontier', undefined],
      ['openai', 'spec', undefined, { base: '@openai:nano', advanced: '@openai:flagship' }],
      ['openai', 'spec', 'frontier', { base: '@openai:nano', advanced: '@openai:flagship' }],
      ['groq', 'default', undefined, undefined]
    ];

    test.each(cases)('%s %s model, tier %s', async (id, __label, tier, spec) => {
      const descriptor = getDescriptor(id);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(responses[id]),
        text: jest.fn().mockResolvedValue(JSON.stringify(responses[id]))
      });

      expect(
        await AiAssist.callProviderCompletion({
          descriptor,
          apiKey: 'test-key',
          ...prompt.toRequest(),
          modelOverride: spec,
          tier
        })
      ).toSucceed();

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      // Most recorded limits are equal, so pin the model id too: the lookup must answer for
      // exactly the model the call sent, not merely one with the same limit.
      expect(body.model).toBe(AiAssist.resolveProviderModel(descriptor, spec, tier).orThrow());
      const sentLimit = AiAssist.resolveMaxOutputTokens(descriptor, body.model);
      expect(sentLimit).toBeDefined();
      expect(AiAssist.resolveMaxOutputTokens(descriptor, spec, tier)).toBe(sentLimit);
    });
  });

  describe('alias coverage', () => {
    const cloudAliases: ReadonlyArray<[AiAssist.AiProviderId, string]> = AiAssist.getProviderDescriptors()
      .filter((d) => !NON_CLOUD_PROVIDERS.includes(d.id))
      .flatMap((d) =>
        Object.keys(d.aliases ?? {}).map((alias): [AiAssist.AiProviderId, string] => [d.id, alias])
      );

    test('the registry registers cloud aliases to check', () => {
      expect(cloudAliases.length).toBeGreaterThan(0);
    });

    test.each(cloudAliases.filter(([, alias]) => !ALIASES_WITHOUT_A_LIMIT.includes(alias)))(
      '%s %s resolves to a recorded limit',
      (id, alias) => {
        expect(AiAssist.resolveMaxOutputTokens(getDescriptor(id), alias)).toBeGreaterThan(0);
      }
    );

    test.each(cloudAliases.filter(([, alias]) => ALIASES_WITHOUT_A_LIMIT.includes(alias)))(
      '%s %s is excluded and resolves to no limit',
      (id, alias) => {
        expect(AiAssist.resolveMaxOutputTokens(getDescriptor(id), alias)).toBeUndefined();
      }
    );

    test('every exclusion names a registered alias', () => {
      const registered = cloudAliases.map(([, alias]) => alias);
      for (const alias of ALIASES_WITHOUT_A_LIMIT) {
        expect(registered).toContain(alias);
      }
    });
  });

  describe('the Anthropic default', () => {
    test('DEFAULT_ANTHROPIC_MAX_TOKENS is at or below every recorded Anthropic limit', () => {
      // If this fails, a call that sets no maxTokens is refused on that model, and the adapters
      // that apply the default must send min(default, resolved limit) instead.
      for (const entry of getDescriptor('anthropic').maxOutputTokens ?? []) {
        expect(AiAssist.DEFAULT_ANTHROPIC_MAX_TOKENS).toBeLessThanOrEqual(entry.maxOutputTokens);
      }
    });
  });

  describe('with a hand-built descriptor', () => {
    const base = getDescriptor('anthropic');

    test('a descriptor with no entries yields undefined', () => {
      const descriptor: AiAssist.IAiProviderDescriptor = { ...base, maxOutputTokens: undefined };
      expect(AiAssist.resolveMaxOutputTokens(descriptor, 'claude-opus-5-5')).toBe(undefined);
    });
  });
});
