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
 * Antagonist torture tests — target class 6 (ai-assist-antagonist phase 2):
 * client-tool continuation per-provider rawTail projection. Multi-round
 * cumulative-semantics is already exhaustively covered (3-round Anthropic and
 * OpenAI drives) in `clientToolContinuationBuilder.test.ts`; this file extends
 * adversarially into the two genuinely uncovered angles named in the brief:
 * (1) an entry with extra/unexpected fields is projected (fields dropped) for
 * Anthropic/Gemini but round-trips verbatim for OpenAI/xAI, and (2) a non-object
 * entry mixed into the continuation tail is skipped, not thrown on.
 *
 * Exercises the `rawTail` handling in `chatRequestBuilders.ts` directly
 * (`buildAnthropicMessages` / `buildGeminiContents` / `buildMessages`) — the
 * same builders `executeClientToolTurn` delegates to when weaving
 * `continuationMessages` into the outbound wire request.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  buildAnthropicMessages,
  buildGeminiContents,
  buildMessages
} from '../../../packlets/ai-assist/chatRequestBuilders';

const TEST_PROMPT = new AiAssist.AiPrompt('hello', 'system');

describe('Anthropic rawTail projection — extra fields dropped (antagonist)', () => {
  // Wrong impl this guards: applying the OpenAI verbatim-passthrough rule to Anthropic
  // would leak `extraProviderSpecificField` / `id` onto the wire request, which Anthropic
  // does not expect on a `{role, content}` message.
  test('an entry with extra fields is projected to {role, content} only — extras dropped', () => {
    const rawTail = [
      {
        role: 'assistant' as const,
        content: [{ type: 'text', text: 'hi' }],
        extraProviderSpecificField: 'should-be-dropped',
        id: 'msg_123'
      }
    ];
    const messages = buildAnthropicMessages(TEST_PROMPT, { rawTail });
    const projected = messages[messages.length - 1];
    expect(projected).toEqual({ role: 'assistant', content: [{ type: 'text', text: 'hi' }] });
    expect(Object.keys(projected).sort()).toEqual(['content', 'role']);
  });
});

describe('Gemini rawTail projection — extra fields dropped (antagonist)', () => {
  test('an entry with extra fields is projected to {role, parts} only — extras dropped', () => {
    const rawTail = [
      {
        role: 'model' as const,
        parts: [{ functionCall: { name: 'x', args: {} } }],
        extraProviderSpecificField: 'should-be-dropped',
        id: 'msg_123'
      }
    ];
    const contents = buildGeminiContents(TEST_PROMPT, { rawTail });
    const projected = contents[contents.length - 1];
    expect(projected).toEqual({ role: 'model', parts: [{ functionCall: { name: 'x', args: {} } }] });
    expect(Object.keys(projected).sort()).toEqual(['parts', 'role']);
  });
});

describe('OpenAI / xAI Responses rawTail — verbatim passthrough (antagonist)', () => {
  // Wrong impl this guards: a field-by-field allowlist (instead of a bare JsonObject
  // guard) would strip `extraProviderSpecificField` / `id` here too, even though the
  // OpenAI Responses API items legitimately carry per-type fields the builder cannot
  // know about ahead of time.
  test('an entry with extra fields round-trips verbatim, including the extra fields', () => {
    const rawTail = [
      {
        type: 'function_call',
        call_id: 'call_1',
        name: 'x',
        arguments: '{}',
        extraProviderSpecificField: 'should-survive',
        id: 'fc_123'
      }
    ];
    const messages = buildMessages('system prompt', 'user text', { rawTail });
    const projected = messages[messages.length - 1];
    expect(projected).toEqual(rawTail[0]);
  });
});

describe('invalid (non-object) continuation entries are skipped, not thrown on (antagonist)', () => {
  // Wrong impl this guards: iterating rawTail without a per-entry shape guard (or one
  // that throws instead of skipping) would crash the whole continuation build when a
  // non-object entry (a persisted-and-reloaded corrupt record, for instance) is present.
  const invalidEntries: ReadonlyArray<unknown> = ['a raw string', 42, null, ['nested', 'array'], true];

  test('Anthropic builder skips every invalid entry without throwing', () => {
    const rawTail = [
      { role: 'assistant' as const, content: 'valid one' },
      ...invalidEntries,
      { role: 'user' as const, content: 'valid two' }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any;
    let messages: unknown;
    expect(() => {
      messages = buildAnthropicMessages(TEST_PROMPT, { rawTail });
    }).not.toThrow();
    const tail = (messages as unknown[]).slice(1); // index 0 is the prompt's own user turn
    expect(tail).toEqual([
      { role: 'assistant', content: 'valid one' },
      { role: 'user', content: 'valid two' }
    ]);
  });

  test('Gemini builder skips every invalid entry without throwing', () => {
    const rawTail = [
      { role: 'model' as const, parts: [{ text: 'valid one' }] },
      ...invalidEntries,
      { role: 'user' as const, parts: [{ text: 'valid two' }] }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any;
    let contents: unknown;
    expect(() => {
      contents = buildGeminiContents(TEST_PROMPT, { rawTail });
    }).not.toThrow();
    const tail = (contents as unknown[]).slice(1); // index 0 is the prompt's own user turn
    expect(tail).toEqual([
      { role: 'model', parts: [{ text: 'valid one' }] },
      { role: 'user', parts: [{ text: 'valid two' }] }
    ]);
  });

  test('OpenAI / xAI builder skips every invalid entry without throwing', () => {
    const rawTail = [
      { type: 'function_call', call_id: 'c1', name: 'x', arguments: '{}' },
      ...invalidEntries,
      { type: 'function_call_output', call_id: 'c1', output: 'ok' }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any;
    let messages: unknown;
    expect(() => {
      messages = buildMessages('system prompt', 'user text', { rawTail });
    }).not.toThrow();
    const tail = (messages as unknown[]).slice(2); // index 0 system, 1 user
    expect(tail).toEqual([
      { type: 'function_call', call_id: 'c1', name: 'x', arguments: '{}' },
      { type: 'function_call_output', call_id: 'c1', output: 'ok' }
    ]);
  });
});
