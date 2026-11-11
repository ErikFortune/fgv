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
 * Request-body tests for the prefix check that Claude Fable 5.2 and Claude Mythos 5.2 enforce on
 * every account: across the rounds of `runClientToolLoop`, `system` and `tools` stay identical and
 * `messages` is append-only, with every thinking block — including one whose `thinking` text is
 * empty and whose signature arrived in several deltas — sent back exactly as it streamed.
 */

import '@fgv/ts-utils-jest';

import { type JsonObject } from '@fgv/ts-json-base';
import { AiAssist } from '../../..';
import { anthropicTextSse, makeRecallTool, queueSse } from './clientToolSseFixtures';

function event(name: string, data: unknown): string {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * A round that streams `blocks` (each a content_block_start payload plus its deltas, in order) and
 * stops for tool use.
 */
function roundSse(blocks: ReadonlyArray<{ start: unknown; deltas: ReadonlyArray<unknown> }>): string[] {
  return [
    ...blocks.flatMap((b, index) => [
      event('content_block_start', { index, content_block: b.start }),
      ...b.deltas.map((delta) => event('content_block_delta', { index, delta })),
      event('content_block_stop', { index })
    ]),
    event('message_delta', { delta: { stop_reason: 'tool_use' } }),
    event('message_stop', {})
  ];
}

function fetchBody(call: number): JsonObject {
  const init = (global.fetch as jest.Mock).mock.calls[call][1] as { body: string };
  return JSON.parse(init.body) as JsonObject;
}

function messagesOf(call: number): ReadonlyArray<unknown> {
  return fetchBody(call).messages as ReadonlyArray<unknown>;
}

describe('runClientToolLoop keeps the history append-only (prefix check)', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each(['@anthropic:fable', 'claude-fable-5-2', 'claude-mythos-5-2'])(
    '%s: every assistant turn is replayed exactly as streamed, and each request extends the last',
    async (model) => {
      // Round 1: an empty-text thinking block whose signature arrives in two deltas (the default
      // display on these models), a progress-update thinking block, then a tool call.
      queueSse(
        roundSse([
          {
            start: { type: 'thinking', thinking: '', signature: '' },
            deltas: [
              { type: 'signature_delta', signature: 'SIG_A1_' },
              { type: 'signature_delta', signature: 'SIG_A2' }
            ]
          },
          {
            start: { type: 'thinking', thinking: '', signature: '' },
            deltas: [
              { type: 'thinking_delta', thinking: 'Looking it up' },
              { type: 'thinking_delta', thinking: ' now.' },
              { type: 'signature_delta', signature: 'SIG_B' }
            ]
          },
          {
            start: { type: 'tool_use', id: 'toolu_1', name: 'recall' },
            deltas: [{ type: 'input_json_delta', partial_json: '{"query":"first"}' }]
          }
        ])
      );
      // Round 2: a redacted thinking block, then a second tool call.
      queueSse(
        roundSse([
          { start: { type: 'redacted_thinking', data: 'OPAQUE' }, deltas: [] },
          {
            start: { type: 'tool_use', id: 'toolu_2', name: 'recall' },
            deltas: [{ type: 'input_json_delta', partial_json: '{"query":"second"}' }]
          }
        ])
      );
      queueSse(anthropicTextSse('done'));

      expect(
        await AiAssist.runClientToolLoop({
          descriptor: AiAssist.getProviderDescriptor('anthropic').orThrow(),
          apiKey: 'k',
          model,
          system: 'You are a helpful agent.',
          messages: [{ role: 'user', content: 'Look it up.' }],
          clientTools: [makeRecallTool()],
          maxRounds: 8
        })
      ).toSucceedAndSatisfy((outcome) => {
        expect(outcome.state).toBe('completed');
      });
      expect(global.fetch).toHaveBeenCalledTimes(3);

      // system and tools are the same on every request.
      for (const call of [1, 2]) {
        expect(JSON.stringify(fetchBody(call).system)).toBe(JSON.stringify(fetchBody(0).system));
        expect(JSON.stringify(fetchBody(call).tools)).toBe(JSON.stringify(fetchBody(0).tools));
      }

      // Each request's messages begin with the previous request's messages, serialized identically.
      for (const call of [1, 2]) {
        const before = messagesOf(call - 1);
        expect(JSON.stringify(messagesOf(call).slice(0, before.length))).toBe(JSON.stringify(before));
        expect(messagesOf(call).length).toBe(before.length + 2);
      }

      // The assistant turns carry every thinking block, in stream order, with its text and signature.
      const final = messagesOf(2);
      expect(final[1]).toEqual({
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: '', signature: 'SIG_A1_SIG_A2' },
          { type: 'thinking', thinking: 'Looking it up now.', signature: 'SIG_B' },
          { type: 'tool_use', id: 'toolu_1', name: 'recall', input: { query: 'first' } }
        ]
      });
      expect(final[3]).toEqual({
        role: 'assistant',
        content: [
          { type: 'redacted_thinking', data: 'OPAQUE' },
          { type: 'tool_use', id: 'toolu_2', name: 'recall', input: { query: 'second' } }
        ]
      });
      expect(fetchBody(2).model).toBe(model === '@anthropic:fable' ? 'claude-fable-5-2' : model);
    }
  );

  // A web_search round beside a client tool: the server tool's blocks, and the citations its search
  // put on the text, are part of the assistant turn and must come back exactly as streamed. Run with
  // thinking (a model that runs the prefix check on every account) and without it.
  test.each([
    { label: 'claude-fable-5-2 with thinking', model: 'claude-fable-5-2', thinking: true },
    { label: 'claude-haiku-4-5 without thinking', model: 'claude-haiku-4-5', thinking: false }
  ])('$label: server-tool blocks and citations are replayed in place', async ({ model, thinking }) => {
    const searchResult = {
      type: 'web_search_tool_result',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tool_use_id: 'srvtoolu_1',
      content: [
        {
          type: 'web_search_result',
          url: 'https://example.com/ts',
          title: 'TypeScript',
          encrypted_content: 'ENC_1',
          page_age: '1 day'
        }
      ]
    };
    const citationA = {
      type: 'web_search_result_location',
      url: 'https://example.com/ts',
      title: 'TypeScript',
      encrypted_index: 'IDX_A',
      cited_text: 'TypeScript 6'
    };
    const citationB = { ...citationA, encrypted_index: 'IDX_B' };
    queueSse(
      roundSse([
        ...(thinking
          ? [
              {
                start: { type: 'thinking', thinking: '', signature: '' },
                deltas: [{ type: 'signature_delta', signature: 'SIG_T' }]
              }
            ]
          : []),
        {
          start: { type: 'server_tool_use', id: 'srvtoolu_1', name: 'web_search', input: {} },
          deltas: [
            { type: 'input_json_delta', partial_json: '{"query":' },
            { type: 'input_json_delta', partial_json: '"typescript"}' }
          ]
        },
        { start: searchResult, deltas: [] },
        {
          start: { type: 'text', text: '' },
          deltas: [
            { type: 'citations_delta', citation: citationA },
            { type: 'citations_delta', citation: citationB },
            { type: 'text_delta', text: 'The latest is TypeScript 6.' }
          ]
        },
        {
          start: { type: 'tool_use', id: 'toolu_1', name: 'recall' },
          deltas: [{ type: 'input_json_delta', partial_json: '{"query":"display-mode"}' }]
        }
      ])
    );
    queueSse(
      roundSse([
        {
          start: { type: 'tool_use', id: 'toolu_2', name: 'recall' },
          deltas: [{ type: 'input_json_delta', partial_json: '{"query":"again"}' }]
        }
      ])
    );
    queueSse(anthropicTextSse('done'));

    expect(
      await AiAssist.runClientToolLoop({
        descriptor: AiAssist.getProviderDescriptor('anthropic').orThrow(),
        apiKey: 'k',
        model,
        system: 'You are a helpful agent.',
        messages: [{ role: 'user', content: 'Look it up.' }],
        clientTools: [makeRecallTool()],
        tools: [{ type: 'web_search' }],
        maxRounds: 8
      })
    ).toSucceedAndSatisfy((outcome) => {
      expect(outcome.state).toBe('completed');
    });
    expect(global.fetch).toHaveBeenCalledTimes(3);

    const expectedTurn = {
      role: 'assistant',
      content: [
        ...(thinking ? [{ type: 'thinking', thinking: '', signature: 'SIG_T' }] : []),
        { type: 'server_tool_use', id: 'srvtoolu_1', name: 'web_search', input: { query: 'typescript' } },
        searchResult,
        { type: 'text', text: 'The latest is TypeScript 6.', citations: [citationA, citationB] },
        { type: 'tool_use', id: 'toolu_1', name: 'recall', input: { query: 'display-mode' } }
      ]
    };
    // Byte-identical: the serialized turn, key order included, on both later requests.
    expect(JSON.stringify(messagesOf(1)[1])).toBe(JSON.stringify(expectedTurn));
    expect(JSON.stringify(messagesOf(2)[1])).toBe(JSON.stringify(expectedTurn));
    for (const call of [1, 2]) {
      const before = messagesOf(call - 1);
      expect(JSON.stringify(messagesOf(call).slice(0, before.length))).toBe(JSON.stringify(before));
      expect(JSON.stringify(fetchBody(call).tools)).toBe(JSON.stringify(fetchBody(0).tools));
    }
  });

  // A field the API adds to a block's start object (one this library does not know) is part of what
  // streamed, so it comes back with the accumulated text, thinking and signature laid over it.
  test('fields on a text or thinking block start object are replayed', async () => {
    queueSse(
      roundSse([
        {
          start: { type: 'thinking', thinking: '', signature: '', future_field: 'kept-t' },
          deltas: [{ type: 'signature_delta', signature: 'SIG' }]
        },
        {
          start: { type: 'text', text: '', future_field: 'kept-x' },
          deltas: [{ type: 'text_delta', text: 'Checking.' }]
        },
        { start: { type: 'tool_use', id: 'toolu_1', name: 'recall' }, deltas: [] }
      ])
    );
    queueSse(anthropicTextSse('done'));
    expect(
      await AiAssist.runClientToolLoop({
        descriptor: AiAssist.getProviderDescriptor('anthropic').orThrow(),
        apiKey: 'k',
        model: 'claude-fable-5-2',
        system: 'You are a helpful agent.',
        messages: [{ role: 'user', content: 'Look it up.' }],
        clientTools: [makeRecallTool()],
        maxRounds: 8
      })
    ).toSucceed();
    expect(JSON.stringify(messagesOf(1)[1])).toBe(
      JSON.stringify({
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: '', signature: 'SIG', future_field: 'kept-t' },
          { type: 'text', text: 'Checking.', future_field: 'kept-x' },
          { type: 'tool_use', id: 'toolu_1', name: 'recall', input: {} }
        ]
      })
    );
  });
});
