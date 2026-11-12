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
import { checkSamplingParams } from '../../../packlets/ai-assist/samplingParams';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { requestTurnsThinkingOff } from '../../../packlets/ai-assist/thinkingOptionsResolver';

const openai = AiAssist.getProviderDescriptor('openai').orThrow();

describe('requestTurnsThinkingOff', () => {
  type Case = [string, AiAssist.AiApiFormat, AiAssist.IResolvedThinkingConfig | undefined];

  test.each([
    ["an OpenAI effort 'none'", 'openai', { openAiEffort: 'none' }],
    ["an xAI effort 'none' (the OpenAI-format adapter sends openAiEffort ?? xaiEffort)", 'openai', { xaiEffort: 'none' }],
    ["an 'other' reasoning_effort 'none' over a typed low", 'openai', { openAiEffort: 'low', otherParams: { reasoning_effort: 'none' } }],
    ["an 'other' reasoning.effort 'none' with no typed effort", 'openai', { otherParams: { reasoning: { effort: 'none' } } }],
    ['an Anthropic thinking-off request with no effort', 'anthropic', { anthropicThinkingDisabled: true }],
    ["an 'other' thinking disabled", 'anthropic', { anthropicEffort: 'low', otherParams: { thinking: { type: 'disabled' } } }],
    ["an 'other' thinking between_tools", 'anthropic', { otherParams: { thinking: { type: 'between_tools' } } }],
    ['a Gemini thinking budget of 0', 'gemini', { geminiThinkingBudget: 0 }],
    ["an 'other' thinkingConfig budget 0", 'gemini', { geminiThinkingBudget: 1024, otherParams: { thinkingConfig: { thinkingBudget: 0 } } }]
  ] as ReadonlyArray<Case>)('is true for %s', (__label, apiFormat, resolved) => {
    expect(requestTurnsThinkingOff(resolved, apiFormat)).toBe(true);
  });

  test.each([
    ['no thinking config (the model default)', 'openai', undefined],
    ['an empty resolved config', 'openai', {}],
    ['an OpenAI effort low', 'openai', { openAiEffort: 'low' }],
    ["openAiEffort low beside xaiEffort 'none' (the adapter sends openAiEffort)", 'openai', { openAiEffort: 'low', xaiEffort: 'none' }],
    ["an 'other' reasoning_effort low over a typed 'none'", 'openai', { openAiEffort: 'none', otherParams: { reasoning_effort: 'low' } }],
    ["an 'other' reasoning.effort low over a typed 'none'", 'openai', { openAiEffort: 'none', otherParams: { reasoning: { effort: 'low' } } }],
    ["an 'other' reasoning that is not an object", 'openai', { openAiEffort: 'none', otherParams: { reasoning: 'none' } }],
    ["an 'other' block without an effort key leaves the typed effort deciding", 'openai', { openAiEffort: 'low', otherParams: { temperature: 1 } }],
    ['Anthropic thinking-off on the OpenAI wire', 'openai', { anthropicThinkingDisabled: true }],
    ['a Gemini budget of 0 on the OpenAI wire', 'openai', { geminiThinkingBudget: 0 }],
    ["an OpenAI effort 'none' on the Anthropic wire", 'anthropic', { openAiEffort: 'none' }],
    ['an Anthropic thinking-off flag beside an effort', 'anthropic', { anthropicThinkingDisabled: true, anthropicEffort: 'low' }],
    ["an 'other' thinking adaptive over a typed off", 'anthropic', { anthropicThinkingDisabled: true, otherParams: { thinking: { type: 'adaptive' } } }],
    ["an 'other' thinking that is not an object", 'anthropic', { otherParams: { thinking: 'disabled' } }],
    ["an OpenAI effort 'none' on the Gemini wire", 'gemini', { openAiEffort: 'none' }],
    ['a nonzero Gemini budget', 'gemini', { geminiThinkingBudget: 1024 }],
    ['a Gemini thinking level', 'gemini', { geminiThinkingLevel: 'minimal' }],
    ["an 'other' thinkingConfig level over a typed budget 0", 'gemini', { geminiThinkingBudget: 0, otherParams: { thinkingConfig: { thinkingLevel: 'minimal' } } }],
    ["an 'other' thinkingConfig that is not an object", 'gemini', { otherParams: { thinkingConfig: 0 } }]
  ] as ReadonlyArray<Case>)('is false for %s', (__label, apiFormat, resolved) => {
    expect(requestTurnsThinkingOff(resolved, apiFormat)).toBe(false);
  });
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

  test("offers effort 'none' only where it would turn thinking off", () => {
    const required: AiAssist.IAiProviderDescriptor = {
      ...openai,
      thinkingRequiredModelPrefixes: [...(openai.thinkingRequiredModelPrefixes ?? []), 'gpt-6-luna']
    };
    expect(checkSamplingParams(required, 'gpt-6-luna', 0.3, undefined)).toFailWith(
      /^gpt-6-luna does not accept a non-default temperature \(0\.3\) while reasoning: remove temperature, or send 1$/
    );
    const strictRequired: AiAssist.IAiProviderDescriptor = { ...required, samplingParamsAcceptedTemperature: undefined };
    expect(checkSamplingParams(strictRequired, 'gpt-6-luna', 0.3, undefined)).toFailWith(
      /^gpt-6-luna does not accept temperature while reasoning: remove temperature$/
    );
    const gemini = AiAssist.getProviderDescriptor('google-gemini').orThrow();
    const levelModel: AiAssist.IAiProviderDescriptor = {
      ...gemini,
      samplingParamsRejectedWithThinkingModelPrefixes: ['gemini-3.5-flash-lite'],
      samplingParamsAcceptedTemperature: 1
    };
    expect(checkSamplingParams(levelModel, 'gemini-3.5-flash-lite', 0.3, undefined)).toFailWith(
      /^gemini-3\.5-flash-lite does not accept a non-default temperature \(0\.3\) while reasoning: remove temperature, or send 1$/
    );
    // A budget model: 'none' is sent as budget 0, which is off, so the hint is offered.
    const budgetModel: AiAssist.IAiProviderDescriptor = {
      ...levelModel,
      samplingParamsRejectedWithThinkingModelPrefixes: ['gemini-3.8-flash']
    };
    expect(checkSamplingParams(budgetModel, 'gemini-3.8-flash', 0.3, undefined)).toFailWith(
      /send 1, or set effort 'none'$/
    );
    expect(checkSamplingParams(budgetModel, 'gemini-3.8-flash', 0.3, { geminiThinkingBudget: 0 })).toSucceedWith(0.3);
  });
});
