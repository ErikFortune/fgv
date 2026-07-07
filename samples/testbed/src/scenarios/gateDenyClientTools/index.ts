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
 * Client-tool before-execute gate (deny path) scenario — `onBeforeToolExecute`.
 *
 * Demonstrates the C3 gate hook end-to-end WITHOUT a live model. The provider stream is
 * **mocked** (a canned Anthropic tool_use SSE stream substituted for `global.fetch`), so the
 * scenario is deterministic and requires no API key. It proves the LOCKED deny-semantics:
 *
 * - The model "calls" a `delete_all_memories` tool (a destructive tool, annotated
 *   `destructiveHint: true`).
 * - The host gate keys off `tool.config.annotations.destructiveHint` and returns
 *   `{ action: 'deny', reason }`.
 * - The tool's `execute` is NEVER run; a synthesized denial tool-result is emitted as a
 *   `client-tool-result` event AND fed into `continuation.messages`, so the turn stays
 *   coherent and the model would see "that call was denied because <reason>".
 *
 * A second run with a `recall_memory` tool (annotated `readOnlyHint: true`) proves the same
 * gate proceeds a read-only call — the annotations→gate composition.
 *
 * This scenario is CLI-only and self-contained (mocked stream, no live API), matching the
 * `*ClientTools/` coverage-exclusion convention used by the sibling live client-tool scenarios.
 *
 * @packageDocumentation
 */

import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import { AiAssist } from '@fgv/ts-extras';

import type { IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';

// ---------------------------------------------------------------------------
// Mocked provider stream (Anthropic tool_use SSE) — no live API
// ---------------------------------------------------------------------------

/** Builds a canned Anthropic SSE stream in which the model calls `toolName` with `argsJson`. */
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

/** Installs a mocked `global.fetch` returning the given SSE chunks; returns a restore fn. */
function installMockFetch(chunks: ReadonlyArray<string>): () => void {
  const original = global.fetch;
  const encoder = new TextEncoder();
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    }
  });
  const response = {
    ok: true,
    status: 200,
    body,
    text: async (): Promise<string> => '',
    headers: new Map([['content-type', 'text/event-stream']])
  };
  global.fetch = (async () => response) as unknown as typeof global.fetch;
  return () => {
    global.fetch = original;
  };
}

// ---------------------------------------------------------------------------
// Tools + gate
// ---------------------------------------------------------------------------

// eslint-disable-next-line @rushstack/typedef-var
const memorySchema = JsonSchema.object({
  key: JsonSchema.string({ description: 'The preference key' })
});

/** A destructive tool the gate must deny. Its `execute` throws if ever reached. */
const deleteTool: AiAssist.IAiClientTool = {
  config: {
    type: 'client_tool',
    name: 'delete_all_memories',
    description: 'Permanently delete all stored user memories.',
    parametersSchema: memorySchema,
    annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false }
  },
  execute: async (): Promise<Result<unknown>> => fail('BUG: destructive execute ran despite a deny decision')
};

/** A read-only tool the gate must allow. */
const recallTool: AiAssist.IAiClientTool = {
  config: {
    type: 'client_tool',
    name: 'recall_memory',
    description: 'Recall a stored user preference.',
    parametersSchema: memorySchema,
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  execute: async (): Promise<Result<unknown>> => succeed({ found: true, value: 'dark mode' })
};

/** The host gate: deny anything annotated destructive; proceed otherwise. */
const gate: (
  tool: AiAssist.IAiClientTool,
  args: unknown
) => Promise<Result<AiAssist.IToolExecutionDecision>> = async (tool) =>
  tool.config.annotations?.destructiveHint === true
    ? succeed({ action: 'deny', reason: 'destructive tool blocked by host policy pending confirmation' })
    : succeed({ action: 'proceed' });

// ---------------------------------------------------------------------------
// CLI implementation
// ---------------------------------------------------------------------------

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    const descriptorResult = AiAssist.getProviderDescriptor('anthropic');
    if (descriptorResult.isFailure()) {
      return fail(`Failed to get Anthropic descriptor: ${descriptorResult.message}`);
    }
    const descriptor = descriptorResult.value;
    const request: AiAssist.IChatRequest = {
      system: 'You manage user memories.',
      messages: [{ role: 'user', content: 'Delete all my memories.' }]
    };
    const summary: string[] = ['client-tool gate deny-path scenario (mocked stream, no live API)', ''];

    // --- Run 1: destructive tool → DENIED --------------------------------
    const restore1 = installMockFetch(
      anthropicToolUseSse('toolu_del', 'delete_all_memories', '{"key":"all"}')
    );
    let denyEventSeen = false;
    let denyResultText = '';
    try {
      const turn = AiAssist.executeClientToolTurn({
        descriptor,
        apiKey: 'mock-key',
        ...request,
        clientTools: [deleteTool],
        model: 'claude-sonnet-4-6',
        onBeforeToolExecute: gate
      });
      if (turn.isFailure()) {
        return fail(`deny-run executeClientToolTurn failed: ${turn.message}`);
      }
      for await (const event of turn.value.events) {
        if (event.type === 'client-tool-result') {
          denyEventSeen = true;
          denyResultText = event.result;
        } else if (event.type === 'error') {
          return fail(`deny-run stream error: ${event.message}`);
        }
      }
      const outcome = await turn.value.nextTurn;
      if (outcome.isFailure()) {
        return fail(`deny-run nextTurn failed (should continue, not hard-fail): ${outcome.message}`);
      }
      const cont = outcome.value.continuation;
      const denialInContinuation =
        cont !== undefined && JSON.stringify(cont.messages).includes('destructive tool blocked');
      const denialSummarized = cont?.toolCallsSummary[0]?.isError === true;

      if (!denyEventSeen || !denialInContinuation || !denialSummarized) {
        return fail(
          `deny-path assertion failed: event=${String(denyEventSeen)} ` +
            `continuation=${String(denialInContinuation)} summary=${String(denialSummarized)}`
        );
      }
      context.logger.info(
        `[run 1] destructive tool DENIED — execute skipped; denial result: ${denyResultText}`
      );
      summary.push('Run 1 (destructive delete_all_memories): DENIED');
      summary.push(`  - execute() never ran (tool.execute would have failed the run if reached)`);
      summary.push(`  - client-tool-result event emitted: ${denyResultText}`);
      summary.push('  - synthesized denial fed into continuation.messages; turn continued (nextTurn ok)');
    } finally {
      restore1();
    }

    // --- Run 2: read-only tool → PROCEEDS --------------------------------
    const restore2 = installMockFetch(anthropicToolUseSse('toolu_recall', 'recall_memory', '{"key":"mode"}'));
    try {
      const turn = AiAssist.executeClientToolTurn({
        descriptor,
        apiKey: 'mock-key',
        ...request,
        clientTools: [recallTool],
        model: 'claude-sonnet-4-6',
        onBeforeToolExecute: gate
      });
      if (turn.isFailure()) {
        return fail(`proceed-run executeClientToolTurn failed: ${turn.message}`);
      }
      let proceedIsError = true;
      for await (const event of turn.value.events) {
        if (event.type === 'client-tool-result') {
          proceedIsError = event.isError;
        } else if (event.type === 'error') {
          return fail(`proceed-run stream error: ${event.message}`);
        }
      }
      const outcome = await turn.value.nextTurn;
      if (outcome.isFailure()) {
        return fail(`proceed-run nextTurn failed: ${outcome.message}`);
      }
      if (proceedIsError) {
        return fail('proceed-path assertion failed: read-only tool result was flagged isError');
      }
      context.logger.info('[run 2] read-only tool PROCEEDED under the same gate');
      summary.push('');
      summary.push('Run 2 (read-only recall_memory): PROCEEDED (same gate, keyed off annotations)');
    } finally {
      restore2();
    }

    summary.push('');
    summary.push('gate-deny-client-tools scenario: PASS');
    return succeed(summary.join('\n'));
  }
};

/**
 * Client-tool before-execute gate (deny path) scenario.
 *
 * Self-contained (mocked provider stream; no live API / key) demonstration of the C3
 * `onBeforeToolExecute` deny-semantics and the annotations→gate composition.
 *
 * @public
 */
export const gateDenyClientToolsScenario: IScenario = {
  id: 'gate-deny-client-tools',
  title: 'Client-Tool Gate — Deny Path',
  description:
    'Self-contained (mocked stream, no live API) demonstration of the onBeforeToolExecute gate: ' +
    'a host gate keyed off tool.config.annotations.destructiveHint denies a destructive tool ' +
    '(execute skipped, synthesized denial in the continuation, turn continues) and proceeds a ' +
    'read-only one.',
  category: 'ai',
  tags: ['client-tools', 'tool-use', 'annotations', 'gate', 'deny', 'mocked'],
  cli: cliImpl
};
