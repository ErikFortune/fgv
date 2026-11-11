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

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { checkSamplingParams, requestTurnsThinkingOff } from '../../../packlets/ai-assist/samplingParams';

const openai = AiAssist.getProviderDescriptor('openai').orThrow();

describe('requestTurnsThinkingOff', () => {
  test.each([
    ["an OpenAI effort 'none'", { openAiEffort: 'none' }],
    ["an xAI effort 'none'", { xaiEffort: 'none' }],
    ['an Anthropic thinking-off request with no effort', { anthropicThinkingDisabled: true }],
    ['a Gemini thinking budget of 0', { geminiThinkingBudget: 0 }]
  ] as ReadonlyArray<[string, AiAssist.IResolvedThinkingConfig]>)('is true for %s', (__label, resolved) => {
    expect(requestTurnsThinkingOff(resolved)).toBe(true);
  });

  test.each([
    ['no thinking config (the model default)', undefined],
    ['an empty resolved config', {}],
    ['an OpenAI effort low', { openAiEffort: 'low' }],
    ['an xAI effort low', { xaiEffort: 'low' }],
    ['an Anthropic thinking-off flag beside an effort', { anthropicThinkingDisabled: true, anthropicEffort: 'low' }],
    ['a nonzero Gemini budget', { geminiThinkingBudget: 1024 }],
    ['a Gemini thinking level', { geminiThinkingLevel: 'minimal' }],
    ['a verbatim provider block', { otherParams: { reasoning_effort: 'none' } }]
  ] as ReadonlyArray<[string, AiAssist.IResolvedThinkingConfig | undefined]>)(
    'is false for %s',
    (__label, resolved) => {
      expect(requestTurnsThinkingOff(resolved)).toBe(false);
    }
  );
});

describe('checkSamplingParams on a model restricted only while reasoning', () => {
  test('succeeds with no temperature, reasoning or not', () => {
    expect(checkSamplingParams(openai, 'gpt-6-luna', undefined, undefined)).toSucceedWith(undefined);
  });

  test('accepts any temperature once thinking is off', () => {
    expect(checkSamplingParams(openai, 'gpt-6-luna', 0.3, { openAiEffort: 'none' })).toSucceedWith(0.3);
  });

  test('accepts the declared default while reasoning and refuses any other value', () => {
    expect(checkSamplingParams(openai, 'gpt-6-luna', 1, { openAiEffort: 'high' })).toSucceedWith(1);
    expect(checkSamplingParams(openai, 'gpt-6-luna', 0.7, { openAiEffort: 'high' })).toFailWith(
      /gpt-6-luna does not accept a non-default temperature \(0\.7\) while reasoning: remove temperature, send 1, or set effort 'none'/
    );
  });

  test('a descriptor that declares no accepted temperature refuses every value while reasoning', () => {
    const strict: AiAssist.IAiProviderDescriptor = { ...openai, samplingParamsAcceptedTemperature: undefined };
    for (const temperature of [0.3, 1]) {
      expect(checkSamplingParams(strict, 'gpt-6-luna', temperature, undefined)).toFailWith(
        /gpt-6-luna does not accept temperature while reasoning: remove temperature, or set effort 'none'/
      );
    }
    expect(checkSamplingParams(strict, 'gpt-6-luna', 0.3, { openAiEffort: 'none' })).toSucceedWith(0.3);
  });

  test('a model on both lists follows the effort-blind rule', () => {
    const both: AiAssist.IAiProviderDescriptor = {
      ...openai,
      samplingParamsRejectedWithThinkingModelPrefixes: ['gpt-6-luna', 'gpt-6.1-sol']
    };
    expect(checkSamplingParams(both, 'gpt-6.1-sol', 0.3, { openAiEffort: 'none' })).toFailWith(
      /gpt-6\.1-sol does not accept a non-default temperature \(0\.3\): remove temperature, or send 1$/
    );
  });

  test('an unlisted model is not restricted', () => {
    expect(checkSamplingParams(openai, 'gpt-6-sol', 0.3, { openAiEffort: 'low' })).toSucceedWith(0.3);
  });
});
