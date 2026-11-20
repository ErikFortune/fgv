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

/**
 * A `ModelSpec` outside its type — reachable from untyped JSON or a cast — fails with the provider
 * id and the offending key at every call site that resolves a model, instead of throwing.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';

const prompt = new AiAssist.AiPrompt('Say ok', 'You are terse');

const openai = AiAssist.getProviderDescriptor('openai').orThrow();

// `{ base: undefined }` reaches `key in undefined` one level down when walked without a check.
const badOverride = { base: undefined } as unknown as AiAssist.ModelSpec;
const badNested = { advanced: { base: 42 } } as unknown as AiAssist.ModelSpec;
const badDescriptor: AiAssist.IAiProviderDescriptor = {
  ...openai,
  defaultModel: { base: null } as unknown as AiAssist.ModelSpec
};

const overrideFailure = /provider "openai": model spec modelOverride\.base is undefined/;

describe('a malformed ModelSpec fails instead of throwing', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('resolveProviderModel', () => {
    test('names the provider and the offending key of a modelOverride', () => {
      expect(AiAssist.resolveProviderModel(openai, badOverride)).toFailWith(overrideFailure);
    });

    test('names the full path of a nested offending key', () => {
      expect(AiAssist.resolveProviderModel(openai, badNested, 'advanced')).toFailWith(
        /provider "openai": model spec modelOverride\.advanced\.base is 42/
      );
    });

    test("names the descriptor's defaultModel when no override is passed", () => {
      expect(AiAssist.resolveProviderModel(badDescriptor, undefined)).toFailWith(
        /provider "openai": model spec defaultModel\.base is null/
      );
    });

    test('resolves a context named like an Object.prototype member to base', () => {
      expect(
        AiAssist.resolveProviderModel(openai, { base: 'gpt-6-luna' }, 'constructor' as AiAssist.ModelSpecKey)
      ).toSucceedWith('gpt-6-luna');
    });

    test('still reports an empty spec as no model resolved', () => {
      expect(AiAssist.resolveProviderModel(openai, {})).toFailWith(/provider "openai": no model resolved/);
    });
  });

  test('callProviderCompletion fails before the wire', async () => {
    expect(
      await AiAssist.callProviderCompletion({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: badOverride
      })
    ).toFailWith(overrideFailure);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('callProviderCompletionStream fails before the wire', async () => {
    expect(
      await AiAssist.callProviderCompletionStream({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: badOverride
      })
    ).toFailWith(overrideFailure);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // `model` is a string here, so the malformed spec can only arrive as the descriptor's default.
  test('executeClientToolTurn fails before the wire', () => {
    expect(
      AiAssist.executeClientToolTurn({
        descriptor: badDescriptor,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: []
      })
    ).toFailWith(/provider "openai": model spec defaultModel\.base is null/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('resolveMaxOutputTokens reports no limit', () => {
    expect(AiAssist.resolveMaxOutputTokens(openai, badOverride)).toBeUndefined();
    expect(AiAssist.resolveMaxOutputTokens(badDescriptor)).toBeUndefined();
  });

  describe('resolveModel', () => {
    test('resolves a malformed spec to the empty string', () => {
      expect(AiAssist.resolveModel(badOverride)).toBe('');
      expect(AiAssist.resolveModel(badNested, 'advanced')).toBe('');
    });

    // Only the spec's own keys count: an inherited Object.prototype member is not a context entry.
    test.each(['constructor', 'toString', '__proto__'])(
      'falls back to base for the context %s',
      (context) => {
        expect(AiAssist.resolveModel({ base: 'B', advanced: 'A' }, context)).toBe('B');
      }
    );

    test('resolves an empty spec to the empty string', () => {
      expect(AiAssist.resolveModel({})).toBe('');
    });
  });
});
