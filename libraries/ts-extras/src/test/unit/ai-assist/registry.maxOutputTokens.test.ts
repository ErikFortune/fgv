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
 * cloud provider must resolve to one. When a limit is recorded for one of these, the second test
 * below fails until the alias is removed from this list.
 */
const ALIASES_WITHOUT_A_LIMIT: ReadonlyArray<string> = [
  // Image and embedding models: no completion output limit applies.
  '@google-gemini:flash-image',
  '@google-gemini:embedding',
  '@openai:image',
  '@openai:embedding',
  '@xai-grok:imagine',
  // No provider page could be fetched: ai.google.dev now redirects to aistudio.google.com,
  // which was outside the network the limits were researched from. Recorded nothing rather than
  // a number from memory.
  '@google-gemini:flash',
  '@google-gemini:pro',
  '@google-gemini:flash-lite',
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
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), 'claude-haiku-4-5-20251001')).toBe(
        64000
      );
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('openai'), 'gpt-6-luna')).toBe(128000);
    });

    test('an alias resolves to the same limit as the concrete id it names', () => {
      const anthropic = getDescriptor('anthropic');
      expect(AiAssist.resolveMaxOutputTokens(anthropic, '@anthropic:haiku')).toBe(64000);
      expect(AiAssist.resolveMaxOutputTokens(anthropic, '@anthropic:opus')).toBe(
        AiAssist.resolveMaxOutputTokens(anthropic, 'claude-opus-5-5')
      );
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('openai'), '@openai:nano')).toBe(128000);
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
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('groq'), 'llama-3.3-70b-versatile')).toBe(
        undefined
      );
    });

    test('a model no entry matches yields undefined', () => {
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('anthropic'), 'claude-3-opus-20240229')).toBe(
        undefined
      );
      expect(AiAssist.resolveMaxOutputTokens(getDescriptor('openai'), 'text-embedding-3-small')).toBe(
        undefined
      );
    });

    test('no shipped descriptor declares a catch-all', () => {
      for (const descriptor of AiAssist.getProviderDescriptors()) {
        for (const entry of descriptor.maxOutputTokens ?? []) {
          expect({ provider: descriptor.id, modelPrefix: entry.modelPrefix }).not.toEqual({
            provider: descriptor.id,
            modelPrefix: ''
          });
        }
      }
      // An id no entry names gets nothing, whatever the provider.
      for (const descriptor of AiAssist.getProviderDescriptors()) {
        expect(AiAssist.resolveMaxOutputTokens(descriptor, 'zz-no-such-model')).toBe(undefined);
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

    test('the longest matching prefix wins, whatever the entry order', () => {
      const descriptor: AiAssist.IAiProviderDescriptor = {
        ...base,
        maxOutputTokens: [
          { modelPrefix: 'claude-', maxOutputTokens: 1000 },
          { modelPrefix: 'claude-opus-5-5', maxOutputTokens: 3000 },
          { modelPrefix: 'claude-opus-', maxOutputTokens: 2000 }
        ]
      };
      expect(AiAssist.resolveMaxOutputTokens(descriptor, 'claude-opus-5-5')).toBe(3000);
      expect(AiAssist.resolveMaxOutputTokens(descriptor, '@anthropic:opus')).toBe(3000);
      expect(AiAssist.resolveMaxOutputTokens(descriptor, 'claude-opus-5')).toBe(2000);
      expect(AiAssist.resolveMaxOutputTokens(descriptor, 'claude-sonnet-5')).toBe(1000);
    });

    test('a catch-all is honoured when a descriptor declares one, but never for an unresolvable alias', () => {
      const descriptor: AiAssist.IAiProviderDescriptor = {
        ...base,
        maxOutputTokens: [{ modelPrefix: '', maxOutputTokens: 8192 }]
      };
      expect(AiAssist.resolveMaxOutputTokens(descriptor, 'anything-at-all')).toBe(8192);
      expect(AiAssist.resolveMaxOutputTokens(descriptor, '@anthropic:nonexistent')).toBe(undefined);
    });

    test('a descriptor with no entries yields undefined', () => {
      const descriptor: AiAssist.IAiProviderDescriptor = { ...base, maxOutputTokens: undefined };
      expect(AiAssist.resolveMaxOutputTokens(descriptor, 'claude-opus-5-5')).toBe(undefined);
    });
  });
});
