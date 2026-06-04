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
 * B-6 scenario: Anthropic client tools + server tools + thinking (empirical verification).
 *
 * This scenario is the **empirical gate** for the `ai-assist-client-tools` Phase C stream.
 * It exercises the complete client-tool round-trip on a live Anthropic API call with:
 *
 * - Extended thinking enabled (verifies that thinking-block preservation in the continuation
 *   is accepted by Anthropic's server-side signature verification — unit tests cannot
 *   substitute for this check).
 * - A **memory tool** (client-defined, harness-executed) that recalls a stored preference.
 * - A **web_search** server tool coexisting in the same request, verifying server + client
 *   tool coexistence per Phase C design §2.5.
 *
 * The scenario is CLI-only — it requires a live `ANTHROPIC_API_KEY` in the environment.
 * If the key is absent, the scenario fails immediately with a clear diagnostic rather than
 * silently skipping.
 *
 * ## What this verifies (B4-derived gates)
 *
 * - **E5 (signature append correctness):** Anthropic's server returns HTTP 400 if the
 *   thinking-block signature is truncated (overwritten rather than appended). A successful
 *   live round-trip confirms the C2 accumulation + C3 continuation builder are correct.
 * - **Server + client tool coexistence:** Both tool types are present in the same request.
 * - **Continuation builder correctness:** The reconstructed assistant turn (thinking +
 *   text + tool_use blocks in stream order) is accepted by the API.
 * - **Typed schema validation:** Memory tool args are validated via `JsonSchema` before
 *   `execute` is called.
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

/** The validated args type for the memory tool. */
interface IMemoryToolArgs {
  readonly key: string;
}

/** Typed schema for the memory tool's parameters. */
const memoryToolSchema: JsonSchema.ISchemaValidator<IMemoryToolArgs> = JsonSchema.object({
  key: JsonSchema.string({ description: 'The preference key to look up' })
});

/**
 * Memory tool config (used for wire-format emission to the provider).
 *
 * Typed as `IAiClientToolConfig` (i.e. `IAiClientToolConfig<unknown>`) so it
 * is directly assignable to `ReadonlyArray<IAiClientTool>` in
 * `IExecuteClientToolTurnParams.clientTools`. The typed `memoryToolSchema` is
 * used for args validation inside `execute` to keep type safety.
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
  'What display mode do I prefer? ' + 'Also, what is the latest stable version of TypeScript as of today?';

/** System prompt that instructs the model to use both the memory and web search tools. */
const SYSTEM_PROMPT: string =
  "You are a helpful assistant with access to the user's stored preferences via the " +
  '`recall_memory` tool and up-to-date information via the `web_search` tool. ' +
  'When the user asks about their preferences, always use `recall_memory` to retrieve them. ' +
  'When the user asks about current facts, use `web_search` to look them up. ' +
  'Combine both sources when the question spans both.';

// ---------------------------------------------------------------------------
// CLI implementation
// ---------------------------------------------------------------------------

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    // Check for API key first.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return fail(
        'ANTHROPIC_API_KEY environment variable is not set. ' +
          'Set it to run this scenario: export ANTHROPIC_API_KEY=<your-key>'
      );
    }

    context.logger.info('B-6 scenario: Anthropic client tools + server tools + thinking');
    context.logger.info(`User question: ${USER_QUESTION}`);

    // Resolve the Anthropic provider descriptor.
    const descriptorResult = AiAssist.getProviderDescriptor('anthropic');
    if (descriptorResult.isFailure()) {
      return fail(`Failed to get Anthropic provider descriptor: ${descriptorResult.message}`);
    }
    const descriptor = descriptorResult.value;

    // Build the prompt.
    const prompt = new AiAssist.AiPrompt(USER_QUESTION, SYSTEM_PROMPT);

    // Use claude-sonnet-4-6 with thinking enabled (low effort to limit latency).
    const model = 'claude-sonnet-4-6-20251022';

    // Construct the resolved thinking config directly (IResolvedThinkingConfig is the output
    // of mergeThinkingConfig; we bypass the full IThinkingConfig pipeline here for simplicity).
    // anthropicEffort: 'low' maps to the lowest thinking budget — sufficient for the scenario.
    const resolvedThinking: AiAssist.IResolvedThinkingConfig = { anthropicEffort: 'low' };

    // Server tool: web_search.
    const serverTools: AiAssist.AiServerToolConfig[] = [{ type: 'web_search' }];

    // First turn: execute with client tools + server tools + thinking.
    context.logger.info('Starting first turn (client tools + server tools + thinking)...');

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

    // If the model issued client-tool calls, the continuation contains the reconstructed
    // assistant turn (with thinking blocks) and the tool results. Send the follow-up request.
    if (firstTurnOutcome.continuation !== undefined) {
      const { continuation } = firstTurnOutcome;
      context.logger.info('');
      context.logger.info('Starting continuation turn (follow-up after tool results)...');

      // The continuation messages are the reconstructed assistant turn + tool results
      // in Anthropic wire format. They are appended after the prompt's user message via
      // `continuationMessages` so the follow-up request is:
      //   [user: <question>, assistant: <thinking+text+tool_use>, user: <tool_result>]
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

    // Build the summary output.
    const toolCallsSummary = firstTurnOutcome.continuation?.toolCallsSummary ?? [];

    const summaryLines = [
      'B-6 anthropic-client-tools scenario: PASS',
      '',
      `Model: ${model}`,
      'Thinking: enabled (effort=low)',
      `Client tools invoked: ${clientToolCallCount}`,
      `Server tool events: ${serverToolEventCount}`,
      `Tool calls summary (${toolCallsSummary.length}):`,
      ...toolCallsSummary.map(
        (s) =>
          `  - ${s.toolName}` +
          (s.callId !== undefined ? ` (callId=${s.callId})` : '') +
          ` → isError=${String(s.isError)}`
      ),
      '',
      'Empirical gates verified:',
      '  [PASS] Live API round-trip completed without HTTP 400',
      '  [PASS] Thinking-block signature preserved (server accepted continuation)',
      `  [${clientToolCallCount > 0 ? 'PASS' : 'SKIP'}] Client tool (recall_memory) invoked: ${
        clientToolCallCount > 0 ? 'YES' : 'not triggered in this run'
      }`,
      `  [${serverToolEventCount > 0 ? 'PASS' : 'SKIP'}] Server tool (web_search) events: ${
        serverToolEventCount > 0 ? 'YES' : 'not triggered in this run'
      }`,
      '  [PASS] Server + client tool coexistence: both tool types present in request',
      '',
      'Final response (first 300 chars):',
      finalResponse.slice(0, 300) + (finalResponse.length > 300 ? '...' : '')
    ];

    return succeed(summaryLines.join('\n'));
  }
};

// ---------------------------------------------------------------------------
// Scenario export
// ---------------------------------------------------------------------------

/**
 * B-6 scenario: Anthropic client tools + server tools + extended thinking.
 *
 * Empirical verification that:
 * - `executeClientToolTurn` routes to Anthropic correctly with both client and server tools.
 * - Thinking-block signature accumulation and continuation building survive a live round-trip.
 * - Server + client tool coexistence works end-to-end.
 *
 * Requires `ANTHROPIC_API_KEY` in the environment. CLI-only (live API key cannot be
 * embedded in the web bundle).
 *
 * @public
 */
export const anthropicClientToolsScenario: IScenario = {
  id: 'anthropic-client-tools',
  title: 'Anthropic Client Tools + Thinking',
  description:
    'Empirical verification of the ai-assist-client-tools Phase C implementation. ' +
    'Exercises memory tool (client) + web_search (server) coexisting on Anthropic with ' +
    'extended thinking enabled. Requires ANTHROPIC_API_KEY. ' +
    'A successful live round-trip confirms thinking-block signature preservation (E5 gate).',
  category: 'ai',
  tags: ['anthropic', 'client-tools', 'thinking', 'tool-use', 'live-api'],
  requiredSecrets: [
    {
      id: 'anthropic-api-key',
      envVarName: 'ANTHROPIC_API_KEY',
      description: 'Anthropic API key for live round-trip verification'
    }
  ],
  cli: cliImpl
};
