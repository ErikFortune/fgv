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
 * Tests for C3 per-provider continuation builders.
 *
 * @remarks
 * `executeClientToolTurn`'s own suite lives in the sibling
 * `clientToolTurn.test.ts` — split when this file reached the 2000-line
 * `max-lines` cap.
 */

import '@fgv/ts-utils-jest';

import { Logging } from '@fgv/ts-utils';
import type { JsonObject } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  buildAnthropicContinuation,
  buildGeminiContinuation,
  buildOpenAiContinuation
} from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedBlock } from '../../../packlets/ai-assist/streamingAdapters/anthropic';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedFunctionCall } from '../../../packlets/ai-assist/streamingAdapters/openaiResponses';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedGeminiFunctionCall } from '../../../packlets/ai-assist/streamingAdapters/gemini';

// ============================================================================
// buildAnthropicContinuation
// ============================================================================

describe('buildAnthropicContinuation', () => {
  describe('thinking-inactive path (no thinking blocks in buffer)', () => {
    test('emits tool_use + tool_result for a single call without thinking', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, {
        type: 'tool_use',
        id: 'toolu_01',
        name: 'recall_memory',
        argsBuffer: '{"query":"test"}'
      });

      const results = [
        {
          toolName: 'recall_memory',
          callId: 'toolu_01',
          args: { query: 'test' },
          result: '"ok"',
          isError: false
        }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();

      expect(cont.messages).toHaveLength(2);
      const assistantMsg = cont.messages[0];
      const userMsg = cont.messages[1];

      expect(assistantMsg.role).toBe('assistant');
      const assistantContent = assistantMsg.content as unknown[];
      expect(assistantContent).toHaveLength(1);
      expect((assistantContent[0] as Record<string, unknown>).type).toBe('tool_use');
      expect((assistantContent[0] as Record<string, unknown>).id).toBe('toolu_01');
      expect((assistantContent[0] as Record<string, unknown>).name).toBe('recall_memory');
      expect((assistantContent[0] as Record<string, unknown>).input).toEqual({ query: 'test' });

      expect(userMsg.role).toBe('user');
      const userContent = userMsg.content as unknown[];
      expect(userContent).toHaveLength(1);
      expect((userContent[0] as Record<string, unknown>).type).toBe('tool_result');
      expect((userContent[0] as Record<string, unknown>).tool_use_id).toBe('toolu_01');
      expect((userContent[0] as Record<string, unknown>).content).toBe('"ok"');
      expect((userContent[0] as Record<string, unknown>).is_error).toBeUndefined();
    });

    test('preserves text blocks when present and non-empty', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'text', text: 'Let me look that up.' });
      buffer.set(1, { type: 'tool_use', id: 'toolu_02', name: 'recall', argsBuffer: '{}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_02', args: {}, result: '"found"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      const assistantContent = cont.messages[0].content as unknown[];
      expect(assistantContent).toHaveLength(2);
      expect((assistantContent[0] as Record<string, unknown>).type).toBe('text');
      expect((assistantContent[0] as Record<string, unknown>).text).toBe('Let me look that up.');
      expect((assistantContent[1] as Record<string, unknown>).type).toBe('tool_use');
    });

    test('omits empty text blocks', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'text', text: '' });
      buffer.set(1, { type: 'tool_use', id: 'toolu_03', name: 'recall', argsBuffer: '{}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_03', args: {}, result: '"found"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      const assistantContent = cont.messages[0].content as unknown[];
      expect(assistantContent).toHaveLength(1);
      expect((assistantContent[0] as Record<string, unknown>).type).toBe('tool_use');
    });

    test('does NOT set tool_choice on continuation — no forced tool_choice when thinking is inactive (E3)', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_04', name: 'recall', argsBuffer: '{}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_04', args: {}, result: '"found"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      // Neither the assistant message nor the user message should carry a tool_choice field.
      for (const msg of cont.messages) {
        expect(Object.keys(msg)).not.toContain('tool_choice');
      }
      // The continuation itself should not carry tool_choice.
      expect(Object.keys(cont)).not.toContain('tool_choice');
    });
  });

  describe('thinking-active path', () => {
    test('includes thinking block before tool_use in original stream order', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'thinking', thinking: 'I should recall memory.', signature: 'sig-abc' });
      buffer.set(1, { type: 'tool_use', id: 'toolu_05', name: 'recall', argsBuffer: '{"q":"x"}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_05', args: { q: 'x' }, result: '"result"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      const assistantContent = cont.messages[0].content as unknown[];
      expect(assistantContent).toHaveLength(2);
      expect((assistantContent[0] as Record<string, unknown>).type).toBe('thinking');
      expect((assistantContent[0] as Record<string, unknown>).thinking).toBe('I should recall memory.');
      expect((assistantContent[0] as Record<string, unknown>).signature).toBe('sig-abc');
      expect((assistantContent[1] as Record<string, unknown>).type).toBe('tool_use');
    });

    test('signature passthrough: emits the full accumulated signature unchanged (E5)', () => {
      // This test verifies that C2's signature-delta append produces a complete
      // signature that C3 passes through unmodified — the round-trip regression.
      const fullSignature = 'BDaL4VrbR2Oj0hO4XpJxT28J5TILnCrrUXoKiiNBZW9P+nr8';
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'thinking', thinking: 'Thinking...', signature: fullSignature });
      buffer.set(1, { type: 'tool_use', id: 'toolu_06', name: 'recall', argsBuffer: '{}' });

      const results = [{ toolName: 'recall', callId: 'toolu_06', args: {}, result: '"x"', isError: false }];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      const assistantContent = cont.messages[0].content as unknown[];
      expect((assistantContent[0] as Record<string, unknown>).signature).toBe(fullSignature);
    });

    test('redacted_thinking passthrough: emits opaque data field unchanged', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'redacted_thinking', data: 'opaque-encrypted-string' });
      buffer.set(1, { type: 'tool_use', id: 'toolu_07', name: 'recall', argsBuffer: '{}' });

      const results = [{ toolName: 'recall', callId: 'toolu_07', args: {}, result: '"x"', isError: false }];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      const assistantContent = cont.messages[0].content as unknown[];
      expect((assistantContent[0] as Record<string, unknown>).type).toBe('redacted_thinking');
      expect((assistantContent[0] as Record<string, unknown>).data).toBe('opaque-encrypted-string');
    });

    test('interleaved thinking ordering: thinking + text + tool_use + thinking + tool_use (E6)', () => {
      // Simulates Claude 4 adaptive thinking with interleaved thinking blocks.
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'thinking', thinking: 'First thought', signature: 'sig-1' });
      buffer.set(1, { type: 'text', text: 'I will recall first.' });
      buffer.set(2, { type: 'tool_use', id: 'toolu_a', name: 'recall', argsBuffer: '{"q":"a"}' });
      buffer.set(3, { type: 'thinking', thinking: 'Second thought', signature: 'sig-2' });
      buffer.set(4, { type: 'tool_use', id: 'toolu_b', name: 'recall', argsBuffer: '{"q":"b"}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_a', args: { q: 'a' }, result: '"res-a"', isError: false },
        { toolName: 'recall', callId: 'toolu_b', args: { q: 'b' }, result: '"res-b"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      const assistantContent = cont.messages[0].content as unknown[];
      // Must preserve original interleaved order: thinking, text, tool_use, thinking, tool_use
      expect(assistantContent).toHaveLength(5);
      expect((assistantContent[0] as Record<string, unknown>).type).toBe('thinking');
      expect((assistantContent[0] as Record<string, unknown>).signature).toBe('sig-1');
      expect((assistantContent[1] as Record<string, unknown>).type).toBe('text');
      expect((assistantContent[2] as Record<string, unknown>).type).toBe('tool_use');
      expect((assistantContent[2] as Record<string, unknown>).id).toBe('toolu_a');
      expect((assistantContent[3] as Record<string, unknown>).type).toBe('thinking');
      expect((assistantContent[3] as Record<string, unknown>).signature).toBe('sig-2');
      expect((assistantContent[4] as Record<string, unknown>).type).toBe('tool_use');
      expect((assistantContent[4] as Record<string, unknown>).id).toBe('toolu_b');
    });

    test('parallel tool_use blocks all go into a single assistant turn', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'thinking', thinking: 'Parallel calls.', signature: 'sig-par' });
      buffer.set(1, { type: 'tool_use', id: 'toolu_p1', name: 'recall', argsBuffer: '{"q":"p1"}' });
      buffer.set(2, { type: 'tool_use', id: 'toolu_p2', name: 'search', argsBuffer: '{"q":"p2"}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_p1', args: { q: 'p1' }, result: '"r1"', isError: false },
        { toolName: 'search', callId: 'toolu_p2', args: { q: 'p2' }, result: '"r2"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      expect(cont.messages).toHaveLength(2);
      const assistantContent = cont.messages[0].content as unknown[];
      expect(assistantContent).toHaveLength(3);
      expect((assistantContent[0] as Record<string, unknown>).type).toBe('thinking');
      expect((assistantContent[1] as Record<string, unknown>).id).toBe('toolu_p1');
      expect((assistantContent[2] as Record<string, unknown>).id).toBe('toolu_p2');

      const userContent = cont.messages[1].content as unknown[];
      expect(userContent).toHaveLength(2);
      expect((userContent[0] as Record<string, unknown>).tool_use_id).toBe('toolu_p1');
      expect((userContent[1] as Record<string, unknown>).tool_use_id).toBe('toolu_p2');
    });

    test('does NOT set tool_choice on continuation — no forced tool_choice when thinking is active (E3)', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'thinking', thinking: 'Thinking...', signature: 'sig' });
      buffer.set(1, { type: 'tool_use', id: 'toolu_08', name: 'recall', argsBuffer: '{}' });

      const results = [{ toolName: 'recall', callId: 'toolu_08', args: {}, result: '"x"', isError: false }];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      for (const msg of cont.messages) {
        expect(Object.keys(msg)).not.toContain('tool_choice');
      }
      expect(Object.keys(cont)).not.toContain('tool_choice');
    });
  });

  describe('error path', () => {
    test('marks tool_result as error when isError is true', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_err', name: 'recall', argsBuffer: '{}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_err', args: {}, result: 'validation failed', isError: true }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      const userContent = cont.messages[1].content as unknown[];
      expect((userContent[0] as Record<string, unknown>).is_error).toBe(true);
      expect((userContent[0] as Record<string, unknown>).content).toBe('validation failed');
    });

    // id-correlation divergence repro (the production "malformed identifier" bug):
    // a missing/empty/mismatched callId was masked by a `?? toolName` fallback that
    // emitted the tool name (never a toolu_* id). The build must now fail loud.
    interface ILooseToolResult {
      toolName: string;
      callId?: string;
      args: JsonObject;
      result: string;
      isError: boolean;
    }

    test('fails loud (does NOT fall back to toolName) when callId is absent', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_noid', name: 'recall', argsBuffer: '{}' });

      const results: ILooseToolResult[] = [
        // callId omitted (undefined)
        { toolName: 'recall', args: {}, result: '"x"', isError: false }
      ];

      expect(buildAnthropicContinuation(buffer, results)).toFailWith(/recall.*no call id.*missing or empty/i);
    });

    test('fails loud when callId is the empty string (?? would not catch it)', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_empty', name: 'recall', argsBuffer: '{}' });

      const results: ILooseToolResult[] = [
        { toolName: 'recall', callId: '', args: {}, result: '"x"', isError: false }
      ];

      expect(buildAnthropicContinuation(buffer, results)).toFailWith(/recall.*no call id.*missing or empty/i);
    });

    test('fails loud when callId does not match any buffered tool_use block id', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_real', name: 'recall', argsBuffer: '{}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_mismatch', args: {}, result: '"x"', isError: false }
      ];

      expect(buildAnthropicContinuation(buffer, results)).toFailWith(
        /recall.*toolu_mismatch.*does not match any buffered/i
      );
    });

    test('fails loud when a buffered tool_use block has an empty id', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      // A tool_use block that somehow reached the buffer with an empty id can
      // never be referenced by a valid tool_result — emitting it would corrupt
      // the assistant turn.
      buffer.set(0, { type: 'tool_use', id: '', name: 'recall', argsBuffer: '{}' });

      const results = [{ toolName: 'recall', callId: '', args: {}, result: '"x"', isError: false }];

      expect(buildAnthropicContinuation(buffer, results)).toFailWith(
        /buffered tool_use block.*recall.*empty id/i
      );
    });
  });

  describe('toolCallsSummary', () => {
    test('includes correct summary for all tool calls', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_sum', name: 'recall', argsBuffer: '{"q":"summary"}' });

      const results = [
        { toolName: 'recall', callId: 'toolu_sum', args: { q: 'summary' }, result: '"data"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      expect(cont.toolCallsSummary).toHaveLength(1);
      expect(cont.toolCallsSummary[0].toolName).toBe('recall');
      expect(cont.toolCallsSummary[0].callId).toBe('toolu_sum');
      expect(cont.toolCallsSummary[0].args).toEqual({ q: 'summary' });
      expect(cont.toolCallsSummary[0].result).toBe('"data"');
      expect(cont.toolCallsSummary[0].isError).toBe(false);
    });
  });

  describe('id-correlation: tool_use.id === tool_result.tool_use_id (single source of truth)', () => {
    // The continuation MUST key every tool_result.tool_use_id off the assistant
    // tool_use.id from the buffer — never the tool name. These assert the positive
    // invariant for single and parallel tool calls.
    const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
    function toolUseIds(cont: { messages: ReadonlyArray<JsonObject> }): string[] {
      const content = cont.messages[0].content as Record<string, unknown>[];
      return content.filter((b) => b.type === 'tool_use').map((b) => asString(b.id));
    }
    function toolResultIds(cont: { messages: ReadonlyArray<JsonObject> }): string[] {
      const content = cont.messages[1].content as Record<string, unknown>[];
      return content.map((b) => asString(b.tool_use_id));
    }

    test('single call: tool_result.tool_use_id equals the assistant tool_use.id', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_single', name: 'recall', argsBuffer: '{}' });
      const results = [
        { toolName: 'recall', callId: 'toolu_single', args: {}, result: '"x"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      expect(toolUseIds(cont)).toEqual(['toolu_single']);
      expect(toolResultIds(cont)).toEqual(['toolu_single']);
    });

    test('parallel calls: each tool_result.tool_use_id equals its assistant tool_use.id', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_a', name: 'recall', argsBuffer: '{}' });
      buffer.set(1, { type: 'tool_use', id: 'toolu_b', name: 'search', argsBuffer: '{}' });
      // Supply results out of buffer order to prove correlation is by id, not position.
      const results = [
        { toolName: 'search', callId: 'toolu_b', args: {}, result: '"rb"', isError: false },
        { toolName: 'recall', callId: 'toolu_a', args: {}, result: '"ra"', isError: false }
      ];

      const cont = buildAnthropicContinuation(buffer, results).orThrow();
      expect(toolUseIds(cont).sort()).toEqual(['toolu_a', 'toolu_b']);
      // tool_result order follows toolResults order; ids must match their own call.
      expect(toolResultIds(cont)).toEqual(['toolu_b', 'toolu_a']);
    });
  });

  describe('diagnostic logging', () => {
    test('logs the tool_use.id ↔ tool_result.tool_use_id pairing at detail level', () => {
      const buffer = new Map<number, IAccumulatedBlock>();
      buffer.set(0, { type: 'tool_use', id: 'toolu_diag', name: 'recall', argsBuffer: '{}' });
      const results = [{ toolName: 'recall', callId: 'toolu_diag', args: {}, result: '"x"', isError: false }];

      const logger = new Logging.InMemoryLogger('all');
      expect(buildAnthropicContinuation(buffer, results, logger)).toSucceed();

      const line = logger.logged.find((m) => m.includes('ai-assist:anthropic-continuation'));
      expect(line).toBeDefined();
      expect(line).toContain('recall:toolu_diag');
    });
  });
});

// ============================================================================
// buildOpenAiContinuation
// ============================================================================

describe('buildOpenAiContinuation', () => {
  test('emits function_call + function_call_output items for a single call', () => {
    const calls = new Map<string, IAccumulatedFunctionCall>();
    calls.set('call_abc', { id: 'call_abc', name: 'recall_memory', argsBuffer: '{"query":"test"}' });

    const results = [
      {
        toolName: 'recall_memory',
        callId: 'call_abc',
        args: { query: 'test' },
        result: '"found"',
        isError: false
      }
    ];

    const cont = buildOpenAiContinuation(calls, results).orThrow();
    expect(cont.messages).toHaveLength(2);
    // Per ResponseFunctionToolCall spec, call_id is the required correlation field
    // and must match the matching function_call_output's call_id below. The optional
    // `id` (output-item id) is omitted for input items.
    expect(cont.messages[0].type).toBe('function_call');
    expect(cont.messages[0].call_id).toBe('call_abc');
    expect(cont.messages[0].id).toBeUndefined();
    expect(cont.messages[0].name).toBe('recall_memory');
    expect(cont.messages[0].arguments).toBe('{"query":"test"}');

    expect(cont.messages[1].type).toBe('function_call_output');
    expect(cont.messages[1].call_id).toBe('call_abc');
    expect(cont.messages[1].output).toBe('"found"');
  });

  test('emits multiple function_call + function_call_output items for parallel calls', () => {
    const calls = new Map<string, IAccumulatedFunctionCall>();
    calls.set('call_1', { id: 'call_1', name: 'recall', argsBuffer: '{"q":"a"}' });
    calls.set('call_2', { id: 'call_2', name: 'search', argsBuffer: '{"q":"b"}' });

    const results = [
      { toolName: 'recall', callId: 'call_1', args: { q: 'a' }, result: '"r1"', isError: false },
      { toolName: 'search', callId: 'call_2', args: { q: 'b' }, result: '"r2"', isError: false }
    ];

    const cont = buildOpenAiContinuation(calls, results).orThrow();
    expect(cont.messages).toHaveLength(4);
    const functionCallItems = cont.messages.filter((m) => m.type === 'function_call');
    const outputItems = cont.messages.filter((m) => m.type === 'function_call_output');
    expect(functionCallItems).toHaveLength(2);
    expect(outputItems).toHaveLength(2);
    // Each function_call item must carry call_id (the required correlation field) — the
    // call_id pairs the function_call to its matching function_call_output by spec.
    const functionCallCallIds = functionCallItems.map((m) => m.call_id).sort();
    const outputCallIds = outputItems.map((m) => m.call_id).sort();
    expect(functionCallCallIds).toEqual(['call_1', 'call_2']);
    expect(outputCallIds).toEqual(['call_1', 'call_2']);
  });

  test('includes correct toolCallsSummary', () => {
    const calls = new Map<string, IAccumulatedFunctionCall>();
    calls.set('call_s', { id: 'call_s', name: 'recall', argsBuffer: '{}' });

    const results = [{ toolName: 'recall', callId: 'call_s', args: {}, result: '"x"', isError: false }];

    const cont = buildOpenAiContinuation(calls, results).orThrow();
    expect(cont.toolCallsSummary).toHaveLength(1);
    expect(cont.toolCallsSummary[0].toolName).toBe('recall');
    expect(cont.toolCallsSummary[0].callId).toBe('call_s');
  });

  // OpenAI parity for the id-correlation fix: never key function_call_output by
  // tool name; fail loud on a missing / empty / mismatched call_id.
  test('fails loud (does NOT fall back to toolName) when callId is absent', () => {
    const calls = new Map<string, IAccumulatedFunctionCall>();
    calls.set('call_real', { id: 'call_real', name: 'recall', argsBuffer: '{}' });

    const results = [
      { toolName: 'recall', args: {} as JsonObject, result: '"x"', isError: false } as {
        toolName: string;
        callId?: string;
        args: JsonObject;
        result: string;
        isError: boolean;
      }
    ];

    expect(buildOpenAiContinuation(calls, results)).toFailWith(/recall.*no call id.*missing or empty/i);
  });

  test('fails loud when callId is the empty string', () => {
    const calls = new Map<string, IAccumulatedFunctionCall>();
    calls.set('call_real', { id: 'call_real', name: 'recall', argsBuffer: '{}' });

    const results = [{ toolName: 'recall', callId: '', args: {}, result: '"x"', isError: false }];

    expect(buildOpenAiContinuation(calls, results)).toFailWith(/recall.*no call id.*missing or empty/i);
  });

  test('fails loud when callId does not match any accumulated function_call call_id', () => {
    const calls = new Map<string, IAccumulatedFunctionCall>();
    calls.set('call_real', { id: 'call_real', name: 'recall', argsBuffer: '{}' });

    const results = [{ toolName: 'recall', callId: 'call_ghost', args: {}, result: '"x"', isError: false }];

    expect(buildOpenAiContinuation(calls, results)).toFailWith(
      /recall.*call_ghost.*does not match any accumulated/i
    );
  });

  test('logs the function_call.call_id ↔ output.call_id pairing at detail level', () => {
    const calls = new Map<string, IAccumulatedFunctionCall>();
    calls.set('call_diag', { id: 'call_diag', name: 'recall', argsBuffer: '{}' });
    const results = [{ toolName: 'recall', callId: 'call_diag', args: {}, result: '"x"', isError: false }];

    const logger = new Logging.InMemoryLogger('all');
    expect(buildOpenAiContinuation(calls, results, logger)).toSucceed();

    const line = logger.logged.find((m) => m.includes('ai-assist:openai-continuation'));
    expect(line).toBeDefined();
    expect(line).toContain('recall:call_diag');
  });
});

// ============================================================================
// buildGeminiContinuation
// ============================================================================

describe('buildGeminiContinuation', () => {
  test('emits model turn + user turn for a single call', () => {
    const calls: IAccumulatedGeminiFunctionCall[] = [{ name: 'recall_memory', args: { query: 'test' } }];
    const results = [
      { toolName: 'recall_memory', args: { query: 'test' }, result: '"found"', isError: false }
    ];
    const cont = buildGeminiContinuation(calls, results);
    expect(cont.messages).toHaveLength(2);
    const modelMsg = cont.messages[0];
    expect(modelMsg.role).toBe('model');
    const modelParts = modelMsg.parts as unknown[];
    expect(modelParts).toHaveLength(1);
    const modelPart = modelParts[0] as Record<string, unknown>;
    expect((modelPart.functionCall as Record<string, unknown>).name).toBe('recall_memory');
    const userMsg = cont.messages[1];
    expect(userMsg.role).toBe('user');
    const userParts = userMsg.parts as unknown[];
    expect(userParts).toHaveLength(1);
    const userPart = userParts[0] as Record<string, unknown>;
    const fnResponse = userPart.functionResponse as Record<string, unknown>;
    expect(fnResponse.name).toBe('recall_memory');
    expect((fnResponse.response as Record<string, unknown>).content).toBe('"found"');
  });
  test('emits multiple functionCall + functionResponse parts for parallel calls', () => {
    const calls: IAccumulatedGeminiFunctionCall[] = [
      { name: 'recall', args: { q: 'a' } },
      { name: 'search', args: { q: 'b' } }
    ];
    const results = [
      { toolName: 'recall', args: { q: 'a' }, result: '"r1"', isError: false },
      { toolName: 'search', args: { q: 'b' }, result: '"r2"', isError: false }
    ];
    const cont = buildGeminiContinuation(calls, results);
    expect(cont.messages).toHaveLength(2);
    expect(cont.messages[0].parts as unknown[]).toHaveLength(2);
    expect(cont.messages[1].parts as unknown[]).toHaveLength(2);
  });
  test('marks error in functionResponse.response when isError is true', () => {
    const calls: IAccumulatedGeminiFunctionCall[] = [{ name: 'recall', args: {} }];
    const results = [{ toolName: 'recall', args: {}, result: 'schema failed', isError: true }];
    const cont = buildGeminiContinuation(calls, results);
    const userParts = cont.messages[1].parts as unknown[];
    const userPart = userParts[0] as Record<string, unknown>;
    const fnResponse = userPart.functionResponse as Record<string, unknown>;
    const response = fnResponse.response as Record<string, unknown>;
    expect(response.error).toBe(true);
    expect(response.content).toBe('schema failed');
  });
  test('includes correct toolCallsSummary', () => {
    const calls: IAccumulatedGeminiFunctionCall[] = [{ name: 'recall', args: { q: 'z' } }];
    const results = [{ toolName: 'recall', args: { q: 'z' }, result: '"data"', isError: false }];
    const cont = buildGeminiContinuation(calls, results);
    expect(cont.toolCallsSummary).toHaveLength(1);
    expect(cont.toolCallsSummary[0].toolName).toBe('recall');
    expect(cont.toolCallsSummary[0].args).toEqual({ q: 'z' });
  });

  const sigResults = [{ toolName: 'recall', args: { q: 'z' }, result: '"data"', isError: false }];
  test('replays thoughtSignature as a sibling of functionCall on the model part when present', () => {
    const calls: IAccumulatedGeminiFunctionCall[] = [
      { name: 'recall', args: { q: 'z' }, thoughtSignature: 'sig-xyz789' }
    ];
    const cont = buildGeminiContinuation(calls, sigResults);
    const modelPart = (cont.messages[0].parts as unknown[])[0] as Record<string, unknown>;
    // functionCall is unchanged; thoughtSignature is emitted verbatim as its sibling.
    expect((modelPart.functionCall as Record<string, unknown>).name).toBe('recall');
    expect(modelPart.thoughtSignature).toBe('sig-xyz789');
  });
  test('omits the thoughtSignature key entirely (not just falsy) when the call carries none', () => {
    const cont = buildGeminiContinuation([{ name: 'recall', args: { q: 'z' } }], sigResults);
    const modelPart = (cont.messages[0].parts as unknown[])[0] as Record<string, unknown>;
    // The key must be absent, not present-with-undefined — Gemini reads the part shape literally.
    expect('thoughtSignature' in modelPart).toBe(false);
  });
});
