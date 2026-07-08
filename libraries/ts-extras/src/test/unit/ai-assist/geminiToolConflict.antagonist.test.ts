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
 * Antagonist torture tests — target class 7 (ai-assist-antagonist phase 2):
 * Gemini `web_search` x function-calling mutual exclusion.
 *
 * Gemini's `generateContent` HTTP-400s when built-in grounding (mapped from
 * `web_search` to `google_search`) and function calling (`function_declarations`) are
 * combined in the same request. This test determines — empirically, against
 * the real `toGeminiTools` implementation — whether ai-assist guards this
 * combination before the wire call.
 *
 * FINDING (see the antagonist report): no pre-flight guard exists anywhere in
 * `apiClient.ts`, `streamingAdapters/gemini.ts`, or `toolFormats.ts`. Per the
 * antagonist brief, this is an explicitly allowed outcome — the task is to
 * document the current pass-through behavior, not to invent a guard in
 * production code. This test locks in the CURRENT behavior (both tool blocks
 * serialized into the same `tools` array) so a future change to add a guard
 * will be a deliberate, visible diff against this test rather than a silent
 * behavior change.
 */

import '@fgv/ts-utils-jest';

// eslint-disable-next-line @rushstack/packlets/mechanics
import { toGeminiTools } from '../../../packlets/ai-assist/toolFormats';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { AiToolConfig } from '../../../packlets/ai-assist/model';

describe('Gemini web_search + client tool combination — current pass-through behavior (antagonist)', () => {
  test('DOCUMENTS A GAP: both google_search and function_declarations are serialized together with no rejection', () => {
    const tools: ReadonlyArray<AiToolConfig> = [
      { type: 'web_search' },
      {
        type: 'client_tool',
        name: 'get_weather',
        description: 'Get current weather',
        parametersSchema: {
          validate: () => {
            throw new Error('not exercised by this test');
          },
          toJson: () => ({ type: 'object', properties: {} })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      }
    ];

    const result = toGeminiTools(tools);

    // Both blocks land in the same tools array — nothing here rejects the combination
    // before it would reach Gemini's wire request (which 400s on this exact shape).
    expect(result).toEqual([
      { google_search: {} },
      {
        function_declarations: [
          {
            name: 'get_weather',
            description: 'Get current weather',
            parameters: { type: 'object', properties: {} }
          }
        ]
      }
    ]);
  });
});
