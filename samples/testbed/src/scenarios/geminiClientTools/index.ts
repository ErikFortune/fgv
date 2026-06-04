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
 * Gemini client tools + grounding + thinking (empirical wire-shape verification).
 *
 * Parallels the `anthropicClientTools` scenario for Google Gemini. It exercises the complete
 * client-tool round-trip on a live Gemini call with:
 *
 * - Thinking enabled (`thinkingConfig.thinkingBudget`) — Gemini's analog of Anthropic's
 *   extended thinking. Verifies that a thinking-enabled request round-trips and that the
 *   continuation (reconstructed turn + functionResponse parts) is accepted.
 * - A **memory tool** (client-defined, harness-executed) that recalls a stored preference,
 *   identical in shape to the Anthropic scenario's `recall_memory`. Gemini surfaces these as
 *   `functionCall` parts → `client-tool-call-done` events (no delta accumulation).
 *
 * ## Server-tool note (gate matrix divergence)
 *
 * Gemini's `web_search` support is **Google Search grounding**, not an explicit tool-progress
 * protocol. The streaming adapter (`gemini.ts`) documents that grounding metadata arrives
 * attached to text chunks and that the adapter therefore **never yields `tool-event`s**.
 * Consequently the "Server tool events emitted" gate is **N/A for Gemini** — grounding is
 * still requested (verifying server + client coexistence at the request layer), but the
 * scenario does not assert `tool-event` emission because the wire shape does not produce them.
 *
 * The scenario is CLI-only — it requires a live `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) in the
 * environment. If neither is set, the scenario fails immediately with a clear diagnostic
 * rather than silently skipping.
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

/** The user question that exercises memory recall and (optionally) grounding. */
const USER_QUESTION: string =
  'What display mode do I prefer? Also, what is the latest stable version of TypeScript as of today?';

/** System prompt that instructs the model to use both the memory and search tools. */
const SYSTEM_PROMPT: string =
  "You are a helpful assistant with access to the user's stored preferences via the " +
  '`recall_memory` tool and up-to-date information via Google Search. ' +
  'When the user asks about their preferences, always use `recall_memory` to retrieve them. ' +
  'Memory keys are lowercase-hyphenated (e.g. `display-mode`, `preferred-language`, ' +
  '`favorite-color`) — use that exact convention when calling `recall_memory`. ' +
  'When the user asks about current facts, search for them. ' +
  'Combine both sources when the question spans both.';

// ---------------------------------------------------------------------------
// CLI implementation
// ---------------------------------------------------------------------------

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    // Check for API key first. Gemini accepts either GEMINI_API_KEY (newer convention) or
    // GOOGLE_API_KEY (legacy); honor both.
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return fail(
        'Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable is set. ' +
          'Set one to run this scenario: export GEMINI_API_KEY=<your-key>'
      );
    }

    context.logger.info('Gemini scenario: client tools + grounding + thinking');
    context.logger.info(`User question: ${USER_QUESTION}`);

    // Resolve the Gemini provider descriptor.
    const descriptorResult = AiAssist.getProviderDescriptor('google-gemini');
    if (descriptorResult.isFailure()) {
      return fail(`Failed to get Gemini provider descriptor: ${descriptorResult.message}`);
    }
    const descriptor = descriptorResult.value;

    // Build the prompt.
    const prompt = new AiAssist.AiPrompt(USER_QUESTION, SYSTEM_PROMPT);

    // Use the version-pinned `gemini-2.5-flash` alias — a thinking-capable model that the
    // generateContent API accepts directly. Pinning major.minor avoids the dated-snapshot
    // deprecation trap while staying off the moving `*-latest` target.
    const model = 'gemini-2.5-flash';

    // Construct the resolved thinking config directly. geminiThinkingBudget maps to
    // `generationConfig.thinkingConfig.thinkingBudget` on the wire. 1024 is the low-budget
    // analog of the other providers' effort=low.
    const resolvedThinking: AiAssist.IResolvedThinkingConfig = { geminiThinkingBudget: 1024 };

    // Server tool: web_search (Google Search grounding). Grounding does NOT emit tool-events
    // (see the module header); it is included to exercise server + client coexistence.
    const serverTools: AiAssist.AiServerToolConfig[] = [{ type: 'web_search' }];

    // First turn: execute with client tools + grounding + thinking.
    context.logger.info('Starting first turn (client tools + grounding + thinking)...');

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
        // Not expected for Gemini grounding, but surfaced if the adapter ever emits one.
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
    context.logger.info(`  server tool-event events: ${serverToolEventCount} (expected 0 for grounding)`);
    context.logger.info(`  continuation present: ${String(firstTurnOutcome.continuation !== undefined)}`);

    let finalResponse = firstTurnText;

    // If the model issued client-tool calls, the continuation contains the reconstructed
    // turn and the functionResponse parts. Send the follow-up request.
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
    // verified anything. `firstTurnOutcome.truncated` (incomplete completion) and the
    // accumulated `finalResponse` text are the load-bearing signals.
    const toolCallsSummary = firstTurnOutcome.continuation?.toolCallsSummary ?? [];
    const truncated = firstTurnOutcome.truncated;
    const hasResponseText = finalResponse.trim().length > 0;
    const continuationPresent = firstTurnOutcome.continuation !== undefined;

    const pass = hasResponseText && !truncated;

    const diagnosis = truncated
      ? 'DIAGNOSIS: response completed incomplete (truncated) — the model likely exhausted its ' +
        'output-token budget (thinking + any grounding) before emitting the visible answer. ' +
        'Retry with a higher token budget via resolvedThinking.otherParams.'
      : !hasResponseText
      ? 'DIAGNOSIS: the stream completed normally but the model produced no visible text and ' +
        'no client-tool call. The HTTP round-trip succeeded but no answer was generated — ' +
        'this is a real behavior gap, not a harness PASS.'
      : '';

    const summaryLines = [
      `gemini-client-tools scenario: ${pass ? 'PASS' : 'FAIL'}`,
      '',
      `Model: ${model}`,
      'Thinking: enabled (thinkingBudget=1024)',
      `Client tools invoked: ${clientToolCallCount}`,
      `Server tool events: ${serverToolEventCount} (grounding emits none — N/A gate)`,
      `Continuation present: ${String(continuationPresent)}`,
      `Response truncated (incomplete): ${String(truncated)}`,
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
      `  [${!truncated ? 'PASS' : 'FAIL'}] Response completed without truncation`,
      `  [${continuationPresent ? 'PASS' : 'SKIP'}] Continuation round-trip${
        continuationPresent ? ' accepted' : ': no client-tool call this run, so no continuation'
      }`,
      `  [${clientToolCallCount > 0 ? 'PASS' : 'SKIP'}] Client tool (recall_memory) invoked: ${
        clientToolCallCount > 0 ? 'YES' : 'not triggered in this run'
      }`,
      '  [N/A] Server tool events: Gemini grounding does not emit tool-events (by design)',
      '  [PASS] Server + client tool coexistence: grounding + client tool present in request',
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
 * Gemini client tools + grounding + thinking scenario.
 *
 * Empirical verification that:
 * - `executeClientToolTurn` routes to the Gemini generateContent API correctly with both
 *   client tools and Google Search grounding.
 * - The continuation (reconstructed turn + functionResponse parts) survives a live round-trip.
 * - Server + client tool coexistence works end-to-end (grounding emits no tool-events; see
 *   the module header).
 *
 * Requires `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) in the environment. CLI-only (live API key
 * cannot be embedded in the web bundle).
 *
 * @public
 */
export const geminiClientToolsScenario: IScenario = {
  id: 'gemini-client-tools',
  title: 'Gemini Client Tools + Thinking',
  description:
    'Live-wire verification of client tools + grounding on Google Gemini. ' +
    'Exercises a memory tool (client) coexisting with Google Search grounding and thinking ' +
    'enabled. Requires GEMINI_API_KEY (or GOOGLE_API_KEY). Grounding does not emit ' +
    'tool-events (by design), so that gate is N/A for Gemini.',
  category: 'ai',
  tags: ['gemini', 'client-tools', 'thinking', 'tool-use', 'live-api'],
  requiredSecrets: [
    {
      id: 'gemini-api-key',
      envVarName: 'GEMINI_API_KEY',
      description: 'Gemini API key for live round-trip verification (GOOGLE_API_KEY also accepted)'
    }
  ],
  cli: cliImpl
};
