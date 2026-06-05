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
 * xAI (Grok) client tools + server tools + thinking (empirical wire-shape verification).
 *
 * Parallels the `anthropicClientTools` scenario for xAI Grok. xAI's `apiFormat` is `openai`,
 * so client/server tools route through the **OpenAI Responses API** path — the same adapter
 * the OpenAI scenario exercises, but against xAI's endpoint and model. It exercises the
 * complete client-tool round-trip on a live xAI call with:
 *
 * - Thinking enabled (`reasoning.effort`) — xAI's analog of Anthropic's extended thinking.
 *   Verifies that a reasoning-enabled request round-trips and that the continuation
 *   (reconstructed turn + function-call output) is accepted.
 * - A **memory tool** (client-defined, harness-executed) that recalls a stored preference,
 *   identical in shape to the Anthropic scenario's `recall_memory`.
 * - A **web_search** server tool coexisting in the same request, verifying server + client
 *   tool coexistence on the Responses API.
 *
 * ## What this verifies (per-gate, see the stream's gate matrix)
 *
 * - **Live API round-trip without HTTP 4xx:** confirms the Responses-API request body
 *   (input + tools + reasoning) matches xAI's actual contract.
 * - **Client tool invoked and executed:** the model issues a `function_call` for
 *   `recall_memory`; the harness executes it and the args validate via `JsonSchema`.
 * - **Continuation round-trip works:** the reconstructed turn + function-call output is
 *   accepted on the follow-up request.
 * - **Reasoning present:** reasoning is enabled (`reasoning.effort=low`). The current adapter
 *   discards reasoning content, so this gate is verified indirectly by a successful round-trip
 *   with reasoning enabled — the same posture the Anthropic scenario takes for thinking.
 * - **Server tool events emitted:** the Responses API emits web_search progress SSE events,
 *   surfaced as `tool-event`s.
 * - **Server + client tool coexistence:** both tool types are present in the same request.
 *
 * The scenario is CLI-only — it requires a live `XAI_API_KEY` in the environment. If the key
 * is absent, the scenario fails immediately with a clear diagnostic rather than silently
 * skipping.
 *
 * @packageDocumentation
 */

import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import { AiAssist } from '@fgv/ts-extras';

import type { IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';

// ---------------------------------------------------------------------------
// Memory store (in-scenario harness state)
// ---------------------------------------------------------------------------

/**
 * Simple in-memory store of user preferences — the "memory" the client tool exposes.
 * In production this would be a real database or vector store.
 */
const MEMORY_STORE: Record<string, string> = {
  'display-mode': 'dark mode',
  'preferred-language': 'TypeScript',
  'favorite-color': 'blue'
};

// ---------------------------------------------------------------------------
// Memory tool schema and implementation
// ---------------------------------------------------------------------------

/**
 * Typed schema for the memory tool's parameters. The schema is the single
 * source of truth — the static argument type is derived via `JsonSchema.Static`
 * so there's no separate interface to drift.
 */
// eslint-disable-next-line @rushstack/typedef-var
const memoryToolSchema = JsonSchema.object({
  key: JsonSchema.string({ description: 'The preference key to look up' })
});

/**
 * Memory tool config (used for wire-format emission to the provider). Typed as
 * `IAiClientToolConfig` (i.e. `IAiClientToolConfig<unknown>`); the typed
 * `memoryToolSchema` is used for args validation inside `execute`.
 */
const memoryToolConfig: AiAssist.IAiClientToolConfig = {
  type: 'client_tool',
  name: 'recall_memory',
  description:
    'Recalls a stored user preference by key. ' +
    'Use this when the user asks about their preferences or settings.',
  parametersSchema: memoryToolSchema
};

/** Full IAiClientTool — config + execute callback. */
const memoryTool: AiAssist.IAiClientTool = {
  config: memoryToolConfig,
  execute: async (args: unknown): Promise<Result<unknown>> => {
    const validationResult = memoryToolSchema.validate(args);
    if (validationResult.isFailure()) {
      return fail(`Memory tool: invalid args: ${validationResult.message}`);
    }
    const { key } = validationResult.value;
    const value = MEMORY_STORE[key];
    if (value === undefined) {
      return succeed({ found: false, message: `No preference found for key: ${key}` });
    }
    return succeed({ found: true, key, value });
  }
};

// ---------------------------------------------------------------------------
// Scenario prompt
// ---------------------------------------------------------------------------

/** The user question that exercises memory recall and (optionally) web search. */
const USER_QUESTION: string =
  'What display mode do I prefer? Also, what is the latest stable version of TypeScript as of today?';

/** System prompt that instructs the model to use both the memory and web search tools. */
const SYSTEM_PROMPT: string =
  "You are a helpful assistant with access to the user's stored preferences via the " +
  '`recall_memory` tool and up-to-date information via the `web_search` tool. ' +
  'When the user asks about their preferences, always use `recall_memory` to retrieve them. ' +
  'Memory keys are lowercase-hyphenated (e.g. `display-mode`, `preferred-language`, ' +
  '`favorite-color`) — use that exact convention when calling `recall_memory`. ' +
  'When the user asks about current facts, use `web_search` to look them up. ' +
  'Combine both sources when the question spans both.';

// ---------------------------------------------------------------------------
// CLI implementation
// ---------------------------------------------------------------------------

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    // Check for API key first.
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return fail(
        'XAI_API_KEY environment variable is not set. ' +
          'Set it to run this scenario: export XAI_API_KEY=<your-key>'
      );
    }

    context.logger.info('xAI scenario: client tools + server tools + reasoning');
    context.logger.info(`User question: ${USER_QUESTION}`);

    // Resolve the xAI provider descriptor.
    const descriptorResult = AiAssist.getProviderDescriptor('xai-grok');
    if (descriptorResult.isFailure()) {
      return fail(`Failed to get xAI provider descriptor: ${descriptorResult.message}`);
    }
    const descriptor = descriptorResult.value;

    // Build the prompt.
    const prompt = new AiAssist.AiPrompt(USER_QUESTION, SYSTEM_PROMPT);

    // Use the version-pinned `grok-4.3` alias — a reasoning-capable model that the Responses
    // API accepts directly. Pinning major.minor avoids the dated-snapshot deprecation trap
    // while staying off the moving `*-latest` target. (The adapter omits the Responses-API
    // `reasoning.effort` field only for the bare `grok-4` id; `grok-4.3` receives it.)
    const model = 'grok-4.3';

    // Construct the resolved thinking config directly. xaiEffort: 'low' maps to
    // `reasoning: { effort: 'low' }` on the Responses-API wire.
    const resolvedThinking: AiAssist.IResolvedThinkingConfig = { xaiEffort: 'low' };

    // Server tool: web_search.
    const serverTools: AiAssist.AiServerToolConfig[] = [{ type: 'web_search' }];

    // First turn: execute with client tools + server tools + reasoning.
    context.logger.info('Starting first turn (client tools + server tools + reasoning)...');

    const turnResult = AiAssist.executeClientToolTurn({
      descriptor,
      apiKey,
      prompt,
      clientTools: [memoryTool],
      tools: serverTools,
      model,
      resolvedThinking
    });

    if (turnResult.isFailure()) {
      return fail(`executeClientToolTurn failed: ${turnResult.message}`);
    }

    const { events, nextTurn } = turnResult.value;

    // Collect events from the first turn.
    let firstTurnText = '';
    let clientToolCallCount = 0;
    let serverToolEventCount = 0;

    for await (const event of events) {
      if (event.type === 'text-delta') {
        firstTurnText += event.delta;
      } else if (event.type === 'client-tool-call-done') {
        clientToolCallCount++;
        context.logger.info(
          `  [client-tool-call-done] toolName=${event.toolName}` +
            (event.callId !== undefined ? ` callId=${event.callId}` : '')
        );
      } else if (event.type === 'client-tool-result') {
        context.logger.info(
          `  [client-tool-result] toolName=${event.toolName} isError=${String(event.isError)} ` +
            `result=${event.result.slice(0, 80)}`
        );
      } else if (event.type === 'tool-event') {
        serverToolEventCount++;
        context.logger.info(
          `  [tool-event] toolType=${event.toolType} phase=${event.phase}` +
            (event.detail !== undefined ? ` detail=${event.detail.slice(0, 80)}` : '')
        );
      } else if (event.type === 'error') {
        return fail(`Stream error during first turn: ${event.message}`);
      }
    }

    // Await the first turn's completion.
    const firstTurnCompletion = await nextTurn;
    if (firstTurnCompletion.isFailure()) {
      return fail(`First turn nextTurn failed: ${firstTurnCompletion.message}`);
    }

    const firstTurnOutcome = firstTurnCompletion.value;
    context.logger.info('');
    context.logger.info('First turn complete.');
    context.logger.info(`  client-tool-call-done events: ${clientToolCallCount}`);
    context.logger.info(`  server tool-event events: ${serverToolEventCount}`);
    context.logger.info(`  continuation present: ${String(firstTurnOutcome.continuation !== undefined)}`);

    let finalResponse = firstTurnText;
    // If a continuation turn runs, its outcome can independently report `truncated: true`.
    // Capture it so the verdict folds in both turns rather than only the first.
    let continuationTurnTruncated = false;

    // If the model issued client-tool calls, the continuation contains the reconstructed
    // turn and the function-call outputs. Send the follow-up request.
    if (firstTurnOutcome.continuation !== undefined) {
      const { continuation } = firstTurnOutcome;
      context.logger.info('');
      context.logger.info('Starting continuation turn (follow-up after tool results)...');

      const continuationTurnResult = AiAssist.executeClientToolTurn({
        descriptor,
        apiKey,
        prompt,
        continuationMessages: continuation.messages,
        clientTools: [memoryTool],
        tools: serverTools,
        model,
        resolvedThinking
      });

      if (continuationTurnResult.isFailure()) {
        return fail(`Continuation turn failed: ${continuationTurnResult.message}`);
      }

      const { events: continuationEvents, nextTurn: continuationNextTurn } = continuationTurnResult.value;

      let continuationText = '';
      for await (const event of continuationEvents) {
        if (event.type === 'text-delta') {
          continuationText += event.delta;
        } else if (event.type === 'client-tool-call-done') {
          context.logger.info(`  [continuation client-tool-call-done] toolName=${event.toolName}`);
        } else if (event.type === 'client-tool-result') {
          context.logger.info(
            `  [continuation client-tool-result] toolName=${event.toolName} ` +
              `isError=${String(event.isError)}`
          );
        } else if (event.type === 'error') {
          return fail(`Stream error during continuation turn: ${event.message}`);
        }
      }

      const continuationCompletion = await continuationNextTurn;
      if (continuationCompletion.isFailure()) {
        return fail(`Continuation nextTurn failed: ${continuationCompletion.message}`);
      }

      continuationTurnTruncated = continuationCompletion.value.truncated;

      context.logger.info('Continuation turn complete.');

      if (continuationText.length > 0) {
        finalResponse = continuationText;
      }
    }

    context.logger.info('');
    context.logger.info('=== FINAL RESPONSE ===');
    context.logger.info(finalResponse.slice(0, 500) + (finalResponse.length > 500 ? '...' : ''));

    // Build the summary output. The verdict is COMPUTED, never hardcoded (see the OpenAI
    // scenario for the rationale): an HTTP-200 round-trip with no visible answer has not
    // verified anything. `firstTurnOutcome.truncated` (status=incomplete) and the accumulated
    // `finalResponse` text are the load-bearing signals.
    const toolCallsSummary = firstTurnOutcome.continuation?.toolCallsSummary ?? [];
    // Fold both turns' truncation into the verdict. If the continuation turn ran and
    // truncated, the user-visible answer was cut short regardless of the first turn's status.
    const truncated = firstTurnOutcome.truncated || continuationTurnTruncated;
    const hasResponseText = finalResponse.trim().length > 0;
    const continuationPresent = firstTurnOutcome.continuation !== undefined;

    const pass = hasResponseText && !truncated;

    const diagnosis = truncated
      ? 'DIAGNOSIS: response completed with status "incomplete" (truncated) — the reasoning ' +
        'model likely exhausted its output-token budget (reasoning + any server-tool steps) ' +
        'before emitting the visible answer. Retry with a higher max_output_tokens via ' +
        'resolvedThinking.otherParams ({ xaiEffort: "low", otherParams: { max_output_tokens: <N> } }).'
      : !hasResponseText
      ? 'DIAGNOSIS: the stream completed normally but the model produced no visible text. ' +
        (serverToolEventCount > 0
          ? 'A server tool (web_search) fired but the model emitted no final answer after it — '
          : 'No tool fired and no answer was generated — ') +
        'this is a real behavior gap, not a harness PASS.'
      : '';

    const summaryLines = [
      `xai-client-tools scenario: ${pass ? 'PASS' : 'FAIL'}`,
      '',
      `Model: ${model}`,
      'Reasoning: enabled (effort=low)',
      `Client tools invoked: ${clientToolCallCount}`,
      `Server tool events: ${serverToolEventCount}`,
      `Continuation present: ${String(continuationPresent)}`,
      `Response truncated (status=incomplete): ${String(truncated)}`,
      `Final response length: ${finalResponse.length} chars`,
      `Tool calls summary (${toolCallsSummary.length}):`,
      ...toolCallsSummary.map(
        (s) =>
          `  - ${s.toolName}` +
          (s.callId !== undefined ? ` (callId=${s.callId})` : '') +
          ` → isError=${String(s.isError)}`
      ),
      '',
      'Empirical gates:',
      '  [PASS] Live API round-trip completed without HTTP 4xx',
      `  [${hasResponseText ? 'PASS' : 'FAIL'}] Model produced a final response (${
        finalResponse.length
      } chars)`,
      `  [${!truncated ? 'PASS' : 'FAIL'}] Response completed without truncation (status != incomplete)`,
      `  [${continuationPresent ? 'PASS' : 'SKIP'}] Continuation round-trip${
        continuationPresent ? ' accepted' : ': no client-tool call this run, so no continuation'
      }`,
      `  [${clientToolCallCount > 0 ? 'PASS' : 'SKIP'}] Client tool (recall_memory) invoked: ${
        clientToolCallCount > 0 ? 'YES' : 'not triggered in this run'
      }`,
      `  [${serverToolEventCount > 0 ? 'PASS' : 'SKIP'}] Server tool (web_search) events: ${
        serverToolEventCount > 0 ? 'YES' : 'not triggered in this run'
      }`,
      '  [PASS] Server + client tool coexistence: both tool types present in request',
      ...(diagnosis ? ['', diagnosis] : []),
      '',
      'Final response (first 300 chars):',
      finalResponse.slice(0, 300) + (finalResponse.length > 300 ? '...' : '')
    ];

    const summary = summaryLines.join('\n');
    return pass ? succeed(summary) : fail(summary);
  }
};

// ---------------------------------------------------------------------------
// Scenario export
// ---------------------------------------------------------------------------

/**
 * xAI (Grok) client tools + server tools + reasoning scenario.
 *
 * Empirical verification that:
 * - `executeClientToolTurn` routes xAI through the OpenAI Responses API path correctly with
 *   both client and server tools.
 * - The continuation (reconstructed turn + function-call output) survives a live round-trip.
 * - Server + client tool coexistence works end-to-end.
 *
 * Requires `XAI_API_KEY` in the environment. CLI-only (live API key cannot be embedded in
 * the web bundle).
 *
 * @public
 */
export const xaiClientToolsScenario: IScenario = {
  id: 'xai-client-tools',
  title: 'xAI Grok Client Tools + Reasoning',
  description:
    'Live-wire verification of client + server tools on xAI Grok (OpenAI Responses API path). ' +
    'Exercises a memory tool (client) + web_search (server) coexisting with reasoning ' +
    'enabled. Requires XAI_API_KEY. A successful live round-trip confirms the Responses-API ' +
    'request/continuation wire shapes match xAI’s live contract.',
  category: 'ai',
  tags: ['xai', 'grok', 'client-tools', 'reasoning', 'tool-use', 'live-api'],
  requiredSecrets: [
    {
      id: 'xai-api-key',
      envVarName: 'XAI_API_KEY',
      description: 'xAI API key for live round-trip verification'
    }
  ],
  cli: cliImpl
};
