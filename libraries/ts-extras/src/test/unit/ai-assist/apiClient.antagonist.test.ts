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
 * Antagonist torture tests — target class 1 (ai-assist-antagonist phase 2):
 * Gemini image-generation decline vs. benign-terminal finishReason disambiguation,
 * and the completion-path truncation flag. Extends the existing coverage in
 * `apiClient.imageGeneration.test.ts` / `apiClient.test.ts` with the remaining
 * finishReason matrix cells called out in the antagonist brief.
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

function makeImageDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'google-gemini',
    label: 'Google Gemini',
    buttonLabel: 'AI Assist | Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: { base: 'gemini-2.5-flash', image: 'gemini-3.1-flash-image-preview' },
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    imageGeneration: [{ modelPrefix: '', format: 'gemini-image-out', acceptsImageReferenceInput: true }],
    ...overrides
  };
}

function makeCompletionDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'google-gemini',
    label: 'Google Gemini',
    buttonLabel: 'AI Assist | Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    ...overrides
  };
}

describe('callProviderImageGeneration — Gemini finishReason decline matrix (antagonist)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const descriptor = makeImageDescriptor();

  async function runImageGen(
    candidateBody: unknown
  ): Promise<ReturnType<typeof AiAssist.callProviderImageGeneration>> {
    mockFetchResponse(candidateBody);
    return AiAssist.callProviderImageGeneration({
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a robot' }
    });
  }

  // Wrong impl this guards: "any finishReason present (even benign) = decline" would
  // wrongly report MAX_TOKENS as a refusal instead of a benign truncation.
  test('MAX_TOKENS with no image parts is the generic no-image failure, not a decline', async () => {
    const result = await runImageGen({ candidates: [{ finishReason: 'MAX_TOKENS' }] });
    expect(result).toFailWith(/Gemini image API response: no image parts in response/);
    expect(result).toFailWith(/^(?!.*declined).*$/);
  });

  // Exploratory: empty string is `!== undefined`, so the current implementation does NOT
  // treat it as benign (the benign set only contains 'STOP'/'MAX_TOKENS', not ''), and it is
  // not in the set either — so it takes the decline branch with reason ''. This test locks in
  // whatever the actual behavior is; it does not assume it ahead of the run.
  test('an empty-string finishReason with no image parts is treated as a non-benign decline', async () => {
    const result = await runImageGen({ candidates: [{ finishReason: '' }] });
    expect(result).toFailWith(/Gemini image generation declined: $/);
  });

  // Wrong impl this guards: a decline check hard-coded to only 'SAFETY' (missing RECITATION,
  // PROHIBITED_CONTENT, OTHER, and any future value) would silently fall through to the
  // generic no-image message for these reasons instead of surfacing the refusal.
  test('finishReason RECITATION with no image parts is reported as a declined refusal', async () => {
    const result = await runImageGen({ candidates: [{ finishReason: 'RECITATION' }] });
    expect(result).toFailWith(/Gemini image generation declined: RECITATION$/);
  });

  test('finishReason PROHIBITED_CONTENT with no image parts is reported as a declined refusal', async () => {
    const result = await runImageGen({ candidates: [{ finishReason: 'PROHIBITED_CONTENT' }] });
    expect(result).toFailWith(/Gemini image generation declined: PROHIBITED_CONTENT$/);
  });

  test('finishReason OTHER with no image parts is reported as a declined refusal', async () => {
    const result = await runImageGen({ candidates: [{ finishReason: 'OTHER' }] });
    expect(result).toFailWith(/Gemini image generation declined: OTHER$/);
  });

  test('an unknown future finishReason with no image parts is reported as a declined refusal', async () => {
    const result = await runImageGen({ candidates: [{ finishReason: 'WEIRD_NEW_REASON_FROM_THE_FUTURE' }] });
    expect(result).toFailWith(/Gemini image generation declined: WEIRD_NEW_REASON_FROM_THE_FUTURE$/);
  });

  // Wrong impl this guards: a case-insensitive or prefix-based benign check (e.g.
  // lower-casing both sides, or checking `startsWith('STOP')`) would incorrectly treat a
  // near-miss spelling/casing of a benign value as benign and swallow a real decline.
  test.each(['stop', 'Stop', 'STOPPED', 'MAX_TOKEN'])(
    'a near-miss spelling/casing of a benign reason (%s) is NOT treated as benign',
    async (finishReason) => {
      const result = await runImageGen({ candidates: [{ finishReason }] });
      expect(result.isFailure() && result.message.includes(`declined: ${finishReason}`)).toBe(true);
    }
  );
});

describe('callProviderCompletion — Gemini truncated flag matrix (antagonist)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const descriptor = makeCompletionDescriptor();

  function geminiResponse(text: string, finishReason: string): unknown {
    return {
      candidates: [{ content: { parts: [{ text }] }, finishReason }]
    };
  }

  // Wrong impl this guards: "truncated = finishReason !== 'STOP'" would wrongly mark a
  // SAFETY-terminated (or any other non-STOP, non-MAX_TOKENS) completion as truncated.
  test('a non-MAX_TOKENS, non-STOP finishReason (SAFETY) does not set truncated', async () => {
    mockFetchResponse(geminiResponse('partial content', 'SAFETY'));

    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceedAndSatisfy((response) => {
      expect(response.truncated).toBe(false);
    });
  });

  // Wrong impl this guards: a lenient truthiness check (`truncated: !!candidate.finishReason`)
  // would set truncated=true for every terminal reason, including the ordinary 'STOP' case.
  test('a normal STOP finishReason does not set truncated', async () => {
    mockFetchResponse(geminiResponse('done', 'STOP'));

    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceedAndSatisfy((response) => {
      expect(response.truncated).toBe(false);
    });
  });

  // Wrong impl this guards: a case-insensitive match on the finishReason value would
  // incorrectly set truncated=true for a lower-cased wire value; the Gemini API's wire
  // value is exact-cased and must be matched exactly.
  test('a lowercase variant "max_tokens" does not set truncated (exact-case match only)', async () => {
    mockFetchResponse(geminiResponse('partial', 'max_tokens'));

    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceedAndSatisfy((response) => {
      expect(response.truncated).toBe(false);
    });
  });
});

describe('callProviderCompletion — Anthropic truncated flag matrix (antagonist)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function anthropicDescriptorFor(): IAiProviderDescriptor {
    return {
      id: 'anthropic',
      label: 'Anthropic Claude',
      buttonLabel: 'AI Assist | Claude',
      needsSecret: true,
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-4-6',
      supportedTools: [],
      corsRestricted: false,
      acceptsImageInput: true,
      streamingCorsRestricted: false,
      thinkingMode: 'optional'
    };
  }

  function anthropicResponseWithStopReason(stopReason: string): unknown {
    return { content: [{ type: 'text', text: 'answer' }], stop_reason: stopReason };
  }

  // Wrong impl this guards: treating any non-'end_turn' stop_reason as truncated would
  // mislabel a legitimate 'stop_sequence' or 'tool_use' termination as token-limited.
  test.each(['end_turn', 'stop_sequence', 'tool_use', 'refusal'])(
    'stop_reason=%s does not set truncated (only max_tokens does)',
    async (stopReason) => {
      mockFetchResponse(anthropicResponseWithStopReason(stopReason));

      const result = await AiAssist.callProviderCompletion({
        descriptor: anthropicDescriptorFor(),
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.truncated).toBe(false);
      });
    }
  );

  test('stop_reason=max_tokens sets truncated=true', async () => {
    mockFetchResponse(anthropicResponseWithStopReason('max_tokens'));

    const result = await AiAssist.callProviderCompletion({
      descriptor: anthropicDescriptorFor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceedAndSatisfy((response) => {
      expect(response.truncated).toBe(true);
    });
  });

  // Wrong impl this guards: a case-insensitive stop_reason match would incorrectly set
  // truncated=true for an uppercase wire value that Anthropic never actually sends.
  test('an uppercase variant MAX_TOKENS does not set truncated (exact-case match only)', async () => {
    mockFetchResponse(anthropicResponseWithStopReason('MAX_TOKENS'));

    const result = await AiAssist.callProviderCompletion({
      descriptor: anthropicDescriptorFor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceedAndSatisfy((response) => {
      expect(response.truncated).toBe(false);
    });
  });
});
