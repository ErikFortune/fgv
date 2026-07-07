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
 * Tests for C3: the `onBeforeToolExecute` before-execute gate hook on
 * `executeClientToolTurn` (deny-semantics LOCKED — see the stream brief).
 */

import '@fgv/ts-utils-jest';

import { fail, type Result, succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  executeClientToolTurn,
  type IToolExecutionDecision
} from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiClientTool, IAiProviderDescriptor, IAiStreamEvent } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { AiPrompt } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers (self-contained: mirror the minimal harness the sibling suite uses)
// ============================================================================

function makeReadable(chunks: ReadonlyArray<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    }
  });
}

function mockSseResponse(chunks: ReadonlyArray<string>): void {
  const body = makeReadable(chunks);
  const response = {
    ok: true,
    status: 200,
    body,
    text: jest.fn().mockResolvedValue(''),
    headers: new Map([['content-type', 'text/event-stream']])
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

async function collect(iter: AsyncIterable<IAiStreamEvent>): Promise<IAiStreamEvent[]> {
  const out: IAiStreamEvent[] = [];
  for await (const event of iter) {
    out.push(event);
  }
  return out;
}

const testPrompt = new AiPrompt('hello', 'system');

function makeAnthropicDescriptor(): IAiProviderDescriptor {
  return {
    id: 'anthropic',
    label: 'Anthropic',
    buttonLabel: 'Anthropic',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-6',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'optional'
  };
}

function anthropicToolUseSse(toolId: string, toolName: string, argsJson: string): string[] {
  return [
    `event: content_block_start\ndata: ${JSON.stringify({
      index: 0,
      content_block: { type: 'tool_use', id: toolId, name: toolName }
    })}\n\n`,
    `event: content_block_delta\ndata: ${JSON.stringify({
      index: 0,
      delta: { type: 'input_json_delta', partial_json: argsJson }
    })}\n\n`,
    `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
    `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
    `event: message_stop\ndata: {}\n\n`
  ];
}

const recallSchema = JsonSchema.object({ query: JsonSchema.string() });
type RecallParams = JsonSchema.Static<typeof recallSchema>;

// A memory tool whose execute is a spy, so tests can assert it was / was not run.
function makeSpyTool(
  spy: jest.Mock,
  annotations?: IAiClientTool['config']['annotations']
): IAiClientTool<RecallParams> {
  return {
    config: {
      type: 'client_tool',
      name: 'recall_memory',
      description: 'Recall stored context',
      parametersSchema: recallSchema,
      ...(annotations !== undefined ? { annotations } : {})
    },
    execute: async (args) => {
      spy(args);
      return succeed(`User prefers ${args.query}`);
    }
  };
}

// ============================================================================
// onBeforeToolExecute gate (C3)
// ============================================================================

describe('onBeforeToolExecute gate (C3)', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('proceed → tool runs (unchanged behavior)', async () => {
    mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"user prefs"}'));
    const spy = jest.fn();
    const tool = makeSpyTool(spy);

    const result = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [tool] as IAiClientTool[],
      model: 'claude-sonnet-4-6',
      onBeforeToolExecute: async () => succeed({ action: 'proceed' })
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;

    const events = await collect(result.value.events);
    const turnResult = await result.value.nextTurn;

    expect(spy).toHaveBeenCalledTimes(1);
    const resultEvent = events.find((e) => e.type === 'client-tool-result');
    expect(resultEvent?.type === 'client-tool-result' && resultEvent.isError).toBe(false);
    expect(turnResult).toSucceedAndSatisfy((r) => {
      expect(r.continuation?.toolCallsSummary[0].isError).toBe(false);
    });
  });

  test('deny → execute NOT called, synthesized denial result in continuation, event emitted, turn continues', async () => {
    mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"user prefs"}'));
    const spy = jest.fn();
    const tool = makeSpyTool(spy);

    const result = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [tool] as IAiClientTool[],
      model: 'claude-sonnet-4-6',
      onBeforeToolExecute: async () => succeed({ action: 'deny', reason: 'pending user confirmation' })
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;

    const events = await collect(result.value.events);
    const turnResult = await result.value.nextTurn;

    // execute never ran.
    expect(spy).not.toHaveBeenCalled();

    // a client-tool-result event was emitted for the denied call, carrying the reason.
    const resultEvent = events.find((e) => e.type === 'client-tool-result');
    expect(resultEvent).toBeDefined();
    if (resultEvent?.type === 'client-tool-result') {
      expect(resultEvent.isError).toBe(true);
      expect(resultEvent.toolName).toBe('recall_memory');
      expect(resultEvent.result).toMatch(/denied.*pending user confirmation/i);
    }

    // the turn continues: nextTurn succeeds with a continuation carrying the denial as
    // a normal (isError) tool-result the model will see and can react to.
    expect(turnResult).toSucceedAndSatisfy((r) => {
      expect(r.continuation).toBeDefined();
      expect(r.continuation?.toolCallsSummary).toHaveLength(1);
      expect(r.continuation?.toolCallsSummary[0].isError).toBe(true);
      expect(JSON.stringify(r.continuation?.messages)).toMatch(/pending user confirmation/i);
    });
  });

  test('callback returning Result.fail → hard error (not a silent deny), execute NOT called', async () => {
    mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"user prefs"}'));
    const spy = jest.fn();
    const tool = makeSpyTool(spy);

    const result = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [tool] as IAiClientTool[],
      model: 'claude-sonnet-4-6',
      onBeforeToolExecute: async () => fail('gate backend unavailable')
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;

    const events = await collect(result.value.events);
    const turnResult = await result.value.nextTurn;

    expect(spy).not.toHaveBeenCalled();
    const resultEvent = events.find((e) => e.type === 'client-tool-result');
    expect(resultEvent?.type === 'client-tool-result' && resultEvent.isError).toBe(true);
    // Gate-fail is turn-terminating: an explicit `error` event is emitted inline so an
    // events-only consumer sees the fatal failure (and can distinguish it from a non-fatal deny).
    const errorEvent = events.find((e) => e.type === 'error');
    expect(errorEvent?.type === 'error' && /gate backend unavailable/i.test(errorEvent.message)).toBe(true);
    expect(turnResult).toFailWith(/gate backend unavailable/i);
  });

  test('callback that rejects → hard error (caught like an execute failure), execute NOT called', async () => {
    mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"user prefs"}'));
    const spy = jest.fn();
    const tool = makeSpyTool(spy);

    const result = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [tool] as IAiClientTool[],
      model: 'claude-sonnet-4-6',
      onBeforeToolExecute: async () => {
        throw new Error('gate threw');
      }
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;

    await collect(result.value.events);
    const turnResult = await result.value.nextTurn;

    expect(spy).not.toHaveBeenCalled();
    expect(turnResult).toFailWith(/gate threw/i);
  });

  test('absent callback → unchanged behavior', async () => {
    mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"user prefs"}'));
    const spy = jest.fn();
    const tool = makeSpyTool(spy);

    const result = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [tool] as IAiClientTool[],
      model: 'claude-sonnet-4-6'
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;

    await collect(result.value.events);
    const turnResult = await result.value.nextTurn;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(turnResult).toSucceedAndSatisfy((r) => {
      expect(r.continuation?.toolCallsSummary[0].isError).toBe(false);
    });
  });

  test('end-to-end: an annotations-keyed gate denies a destructive tool and proceeds a readOnly one', async () => {
    // One gate keyed off tool.config.annotations.destructiveHint, applied across two turns.
    const gate: (tool: IAiClientTool, args: unknown) => Promise<Result<IToolExecutionDecision>> = async (
      tool
    ) =>
      tool.config.annotations?.destructiveHint === true
        ? succeed({ action: 'deny', reason: 'destructive tool blocked by policy' })
        : succeed({ action: 'proceed' });

    // Turn 1: the destructive tool is denied.
    mockSseResponse(anthropicToolUseSse('toolu_01', 'recall_memory', '{"query":"x"}'));
    const destructiveSpy = jest.fn();
    const destructiveTool = makeSpyTool(destructiveSpy, { destructiveHint: true });
    const denyRun = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [destructiveTool] as IAiClientTool[],
      model: 'claude-sonnet-4-6',
      onBeforeToolExecute: gate
    });
    expect(denyRun).toSucceed();
    if (denyRun.isFailure()) return;
    await collect(denyRun.value.events);
    const denyResult = await denyRun.value.nextTurn;
    expect(destructiveSpy).not.toHaveBeenCalled();
    expect(denyResult).toSucceedAndSatisfy((r) => {
      expect(r.continuation?.toolCallsSummary[0].isError).toBe(true);
      expect(JSON.stringify(r.continuation?.messages)).toMatch(/destructive tool blocked by policy/i);
    });

    // Turn 2: the read-only tool proceeds under the same gate.
    mockSseResponse(anthropicToolUseSse('toolu_02', 'recall_memory', '{"query":"y"}'));
    const readOnlySpy = jest.fn();
    const readOnlyTool = makeSpyTool(readOnlySpy, { readOnlyHint: true });
    const proceedRun = executeClientToolTurn({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [readOnlyTool] as IAiClientTool[],
      model: 'claude-sonnet-4-6',
      onBeforeToolExecute: gate
    });
    expect(proceedRun).toSucceed();
    if (proceedRun.isFailure()) return;
    await collect(proceedRun.value.events);
    const proceedResult = await proceedRun.value.nextTurn;
    expect(readOnlySpy).toHaveBeenCalledTimes(1);
    expect(proceedResult).toSucceedAndSatisfy((r) => {
      expect(r.continuation?.toolCallsSummary[0].isError).toBe(false);
    });
  });
});
