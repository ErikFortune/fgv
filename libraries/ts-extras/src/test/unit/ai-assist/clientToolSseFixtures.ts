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
 * Anthropic SSE fixtures for client-tool tests that mock `fetch`: one response per provider
 * round, queued in order.
 */

import { type Result, succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiClientTool, IAiProviderDescriptor, IAiStreamEvent } from '../../../packlets/ai-assist/model';

export function makeReadable(chunks: ReadonlyArray<string>): ReadableStream<Uint8Array> {
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

/** A body that delivers `chunks` and then never ends — a provider stream that stalls. */
export function makeStalledReadable(chunks: ReadonlyArray<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> | void {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
        return;
      }
      return new Promise<void>(() => undefined);
    }
  });
}

function sseResponse(body: ReadableStream<Uint8Array>): unknown {
  return {
    ok: true,
    status: 200,
    body,
    text: jest.fn().mockResolvedValue(''),
    headers: new Map([['content-type', 'text/event-stream']])
  };
}

/** Queues one SSE response for the next `fetch`. */
export function queueSse(chunks: ReadonlyArray<string>): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce(sseResponse(makeReadable(chunks)));
}

/** Queues one SSE response for the next `fetch` that delivers `chunks` and then stalls. */
export function queueStalledSse(chunks: ReadonlyArray<string>): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce(sseResponse(makeStalledReadable(chunks)));
}

export interface IFakeToolUse {
  readonly id: string;
  readonly name: string;
  readonly args?: string;
}

/** A round in which the model calls each of `calls`, in order, then stops for tool use. */
export function anthropicToolUseSse(calls: ReadonlyArray<IFakeToolUse>, text?: string): string[] {
  const textBlock: string[] =
    text === undefined
      ? []
      : [
          `event: content_block_start\ndata: ${JSON.stringify({ index: 0, content_block: { type: 'text' } })}\n\n`,
          `event: content_block_delta\ndata: ${JSON.stringify({
            index: 0,
            delta: { type: 'text_delta', text }
          })}\n\n`,
          `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`
        ];
  const offset = textBlock.length > 0 ? 1 : 0;
  return [
    ...textBlock,
    ...calls.flatMap((call, i) => [
      `event: content_block_start\ndata: ${JSON.stringify({
        index: i + offset,
        content_block: { type: 'tool_use', id: call.id, name: call.name }
      })}\n\n`,
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: i + offset,
        delta: { type: 'input_json_delta', partial_json: call.args ?? '{"query":"q"}' }
      })}\n\n`,
      `event: content_block_stop\ndata: ${JSON.stringify({ index: i + offset })}\n\n`
    ]),
    `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
    `event: message_stop\ndata: {}\n\n`
  ];
}

/** A round in which the model answers with `text` and calls no tool. */
export function anthropicTextSse(
  text: string,
  options?: { stopReason?: string; usage?: { input_tokens: number; output_tokens: number } }
): string[] {
  return [
    ...(options?.usage !== undefined
      ? [
          `event: message_start\ndata: ${JSON.stringify({
            message: { usage: { input_tokens: options.usage.input_tokens, output_tokens: 0 } }
          })}\n\n`
        ]
      : []),
    `event: content_block_start\ndata: ${JSON.stringify({ index: 0, content_block: { type: 'text' } })}\n\n`,
    `event: content_block_delta\ndata: ${JSON.stringify({ index: 0, delta: { type: 'text_delta', text } })}\n\n`,
    `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
    `event: message_delta\ndata: ${JSON.stringify({
      delta: { stop_reason: options?.stopReason ?? 'end_turn' },
      ...(options?.usage !== undefined ? { usage: { output_tokens: options.usage.output_tokens } } : {})
    })}\n\n`,
    `event: message_stop\ndata: {}\n\n`
  ];
}

export function makeAnthropicDescriptor(): IAiProviderDescriptor {
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
    acceptsImageInput: false
  };
}

export const recallSchema = JsonSchema.object({ query: JsonSchema.string() });
export type RecallParams = JsonSchema.Static<typeof recallSchema>;

/** A `recall` tool whose `execute` is the test's to define; defaults to answering `"found"`. */
export function makeRecallTool(
  execute?: (args: RecallParams, context?: { signal?: AbortSignal }) => Promise<Result<unknown>>,
  name: string = 'recall'
): IAiClientTool {
  const tool: IAiClientTool<RecallParams> = {
    config: {
      type: 'client_tool',
      name,
      description: 'Recall stored context',
      parametersSchema: recallSchema
    },
    execute: execute ?? (async () => succeed('found'))
  };
  // The usual widening at the call site of `clientTools`, which is typed over `unknown` params.
  return tool as IAiClientTool;
}

export async function collect(iter: AsyncIterable<IAiStreamEvent>): Promise<IAiStreamEvent[]> {
  const out: IAiStreamEvent[] = [];
  for await (const event of iter) {
    out.push(event);
  }
  return out;
}
