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
 * Antagonist torture tests — target class 2 (ai-assist-antagonist phase 2):
 * `isResponsesOnlyModel` prefix-matching edge cases not covered by the existing
 * `modelAlias.test.ts` suite (substring-but-not-a-real-prefix false matches,
 * case sensitivity). The tier cascade and `@`-alias resolution (including cycle
 * guarding) are already exhaustively covered in `model.test.ts` /
 * `modelAlias.test.ts` — this file extends adversarially rather than duplicating.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

function makeDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'AI Assist | OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: { base: 'gpt-5.4-mini', frontier: 'gpt-5.5-pro' },
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    responsesOnlyModelPrefixes: ['gpt-5.5-pro'],
    ...overrides
  };
}

describe('isResponsesOnlyModel — substring and case-sensitivity guards (antagonist)', () => {
  const descriptor = makeDescriptor();

  // Wrong impl this guards: a naive `.includes(prefix)` check (instead of `.startsWith`)
  // would false-match a model id that merely contains the Responses-only prefix as a
  // trailing or embedded substring, incorrectly routing a chat-completions-compatible
  // model to the Responses API.
  test('does not match a model id that contains the prefix as a non-leading substring (suffix)', () => {
    expect(AiAssist.isResponsesOnlyModel(descriptor, 'xgpt-5.5-pro')).toBe(false);
  });

  test('does not match a model id that contains the prefix as a non-leading substring (embedded)', () => {
    expect(AiAssist.isResponsesOnlyModel(descriptor, 'not-gpt-5.5-pro-either')).toBe(false);
  });

  // Wrong impl this guards: a case-insensitive compare (e.g. `.toLowerCase()` on both
  // sides before `.startsWith`) would incorrectly match a differently-cased model id.
  // `startsWith` is case-sensitive, so this correctly returns false — locking that in.
  test('is case-sensitive: an uppercase variant of the prefix does not match', () => {
    expect(AiAssist.isResponsesOnlyModel(descriptor, 'GPT-5.5-PRO')).toBe(false);
  });

  test('is case-sensitive: a mixed-case variant of the prefix does not match', () => {
    expect(AiAssist.isResponsesOnlyModel(descriptor, 'Gpt-5.5-Pro')).toBe(false);
  });

  // Wrong impl this guards: short-circuiting on the first declared prefix only (e.g. a
  // buggy refactor from `.some()` to indexing `[0]`) would miss a match against any
  // later-declared prefix in a multi-entry list.
  test('a model matching a non-first declared prefix in a multi-entry list still matches', () => {
    const multi = makeDescriptor({
      responsesOnlyModelPrefixes: ['gpt-5.5-pro', 'o-mega-reasoning']
    });
    expect(AiAssist.isResponsesOnlyModel(multi, 'o-mega-reasoning-2026')).toBe(true);
    expect(AiAssist.isResponsesOnlyModel(multi, 'gpt-5.5-pro')).toBe(true);
    expect(AiAssist.isResponsesOnlyModel(multi, 'unrelated-model')).toBe(false);
  });

  // Not a wrong-impl guard so much as a documented registry-authoring footgun: an
  // empty-string prefix entry matches every model id under `startsWith('')`. Locking
  // this in explicitly means a future registry author who accidentally adds `''` to a
  // provider's list gets a loud, understood-in-advance test failure rather than a live
  // surprise (every model on that provider silently routing to the Responses API).
  test('an empty-string prefix entry matches every model id (documents a registry-authoring footgun)', () => {
    const catchAll = makeDescriptor({ responsesOnlyModelPrefixes: [''] });
    expect(AiAssist.isResponsesOnlyModel(catchAll, 'anything-at-all')).toBe(true);
  });
});
