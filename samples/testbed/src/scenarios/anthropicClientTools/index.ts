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
 * The scenario requires a live Anthropic API key (CLI: `ANTHROPIC_API_KEY`; web: the Secrets
 * panel) and is web-runnable via the shell's generic runner panel (Phase B). If the key is
 * absent, the scenario fails immediately with a clear diagnostic rather than silently skipping.
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
 * - **The bounded runner:** the rounds are driven by `AiAssist.runClientToolLoop` rather than a
 *   hand-written loop over `executeClientToolTurn`, with a round cap and a deadline.
 *
 * @packageDocumentation
 */

import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import { AiAssist } from '@fgv/ts-extras';

import type { IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';
import { resolveProviderApiKey } from '../aiProviderSecrets';

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
 * so there's no separate interface to drift. The const's inferred type is
 * `JsonSchema.ISchemaValidator<{ readonly key: string }>`; we omit the
 * annotation so `JsonSchema.Static<typeof memoryToolSchema>` can extract
 * the validated argument shape without parameter duplication.
 */
// eslint-disable-next-line @rushstack/typedef-var
const memoryToolSchema = JsonSchema.object({
  key: JsonSchema.string({ description: 'The preference key to look up' })
});

/**
 * Memory tool config (used for wire-format emission to the provider).
 *
 * Typed as `IAiClientToolConfig` (i.e. `IAiClientToolConfig<unknown>`) — the
 * config is paired with `execute` below to form the full `memoryTool`, which
 * is what gets passed into `IExecuteClientToolTurnParams.clientTools`. The
 * typed `memoryToolSchema` is used for args validation inside `execute` to
 * keep type safety.
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

/** At most this many provider rounds: one to call the tools, one to answer, and headroom. */
const MAX_ROUNDS: number = 4;

/** Bound on the whole loop, so a stalled provider or tool cannot hold the scenario. */
const LOOP_DEADLINE_MS: number = 120000;

// ---------------------------------------------------------------------------
// Run verdicts
// ---------------------------------------------------------------------------

/**
 * What a run of the scenario actually did, as the verdicts need it.
 * @public
 */
export interface IClientToolRunEvidence {
  /** Provider rounds run. A continuation is sent back only from round 2 on. */
  readonly rounds: number;
  /** Client tool calls across all rounds. */
  readonly clientToolCalls: number;
  /** Server tool (`web_search`) events across all rounds. */
  readonly serverToolEvents: number;
  /** Rounds that had both a server tool event and a client tool call. */
  readonly mixedRounds: number;
}

/**
 * The scenario's header line and gate lines for a run.
 * @public
 */
export interface IClientToolRunVerdicts {
  readonly header: string;
  readonly gates: ReadonlyArray<string>;
}

/**
 * Turns what a run did into its verdicts.
 * @public
 */
export function clientToolRunVerdicts(evidence: IClientToolRunEvidence): IClientToolRunVerdicts {
  // A continuation is only sent back from round 2 on; with one round, the replay was never tried.
  const replayed = evidence.rounds >= 2;
  const oneRound = 'only one round ran, so no continuation was sent back';
  const mixed = replayed && evidence.mixedRounds > 0;
  return {
    header: replayed
      ? 'B-6 anthropic-client-tools scenario: PASS'
      : `B-6 anthropic-client-tools scenario: NOT EXERCISED (${oneRound})`,
    gates: [
      replayed
        ? '  [PASS] Continuation replay: the API accepted the replayed history without HTTP 400'
        : `  [NOT EXERCISED] Continuation replay: ${oneRound}`,
      replayed
        ? '  [PASS] Thinking-block signature preserved (the API accepted the continuation)'
        : `  [NOT EXERCISED] Thinking-block signature: ${oneRound}`,
      `  [${evidence.clientToolCalls > 0 ? 'PASS' : 'SKIP'}] Client tool (recall_memory) invoked: ${
        evidence.clientToolCalls > 0 ? 'YES' : 'not triggered in this run'
      }`,
      `  [${evidence.serverToolEvents > 0 ? 'PASS' : 'SKIP'}] Server tool (web_search) events: ${
        evidence.serverToolEvents > 0 ? 'YES' : 'not triggered in this run'
      }`,
      mixed
        ? '  [exercised] Server tool and client tool in one round, replayed (the server-tool replay path)'
        : '  [not exercised] Server tool and client tool in one round, replayed (the server-tool replay path)'
    ]
  };
}

// ---------------------------------------------------------------------------
// CLI implementation
// ---------------------------------------------------------------------------

/**
 * The CLI implementation, run against `model` (a registry alias, so the scenario follows registry
 * rotations).
 */
function makeCliImpl(model: string): ICliScenarioImpl {
  return {
    webRunnable: true,
    async run(context: IScenarioContext): Promise<Result<string>> {
      // Resolve the API key via the shared secret pipeline (KeyStore -> session secrets store ->
      // env var), so this scenario works identically on the CLI and the web runner panel.
      const apiKeyResult = await resolveProviderApiKey(context, 'anthropic');
      if (apiKeyResult.isFailure()) {
        return fail(apiKeyResult.message);
      }
      const apiKey = apiKeyResult.value;

      context.logger.info(`B-6 scenario: Anthropic client tools + server tools + thinking on ${model}`);
      context.logger.info(`User question: ${USER_QUESTION}`);

      // Resolve the Anthropic provider descriptor.
      const descriptorResult = AiAssist.getProviderDescriptor('anthropic');
      if (descriptorResult.isFailure()) {
        return fail(`Failed to get Anthropic provider descriptor: ${descriptorResult.message}`);
      }
      const descriptor = descriptorResult.value;

      // Build the request (system + the current user turn).
      const request: AiAssist.IChatRequest = {
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: USER_QUESTION }]
      };

      // Construct the resolved thinking config directly (IResolvedThinkingConfig is the output
      // of mergeThinkingConfig; we bypass the full IThinkingConfig pipeline here for simplicity).
      // anthropicEffort: 'low' is the lowest effort. On an adaptive-thinking model (the Claude 5
      // family, which both scenario models resolve to) it is sent as `thinking: { type: 'adaptive' }`
      // plus `output_config.effort: 'low'`, with no token budget; only an older model converts it to
      // the lowest `budget_tokens`. Either way, sufficient for the scenario.
      const resolvedThinking: AiAssist.IResolvedThinkingConfig = { anthropicEffort: 'low' };

      // Server tool: web_search.
      const serverTools: AiAssist.AiServerToolConfig[] = [{ type: 'web_search' }];

      // The rounds are driven by `runClientToolLoop`: it replaces the cumulative continuation
      // each round, dispatches the memory tool while each round's stream drains, and stops at
      // the round cap or the deadline. The observer sees each round's events as they arrive.
      context.logger.info('Running the client-tool loop (client tools + server tools + thinking)...');

      let serverToolEventCount = 0;
      const roundsWithServerToolEvents = new Set<number>();
      const observer: AiAssist.IClientToolLoopObserver = {
        event: (round, event) => {
          if (event.type === 'client-tool-call-done') {
            context.logger.info(
              `  [round ${round} client-tool-call-done] toolName=${event.toolName}` +
                (event.callId !== undefined ? ` callId=${event.callId}` : '')
            );
          } else if (event.type === 'client-tool-result') {
            const isError = String(event.isError);
            context.logger.info(
              `  [round ${round} client-tool-result] toolName=${event.toolName} isError=${isError} ` +
                `result=${event.result.slice(0, 80)}`
            );
          } else if (event.type === 'tool-event') {
            serverToolEventCount++;
            roundsWithServerToolEvents.add(round);
            context.logger.info(
              `  [round ${round} tool-event] toolType=${event.toolType} phase=${event.phase}` +
                (event.detail !== undefined ? ` detail=${event.detail.slice(0, 80)}` : '')
            );
          } else if (event.type === 'error') {
            context.logger.warn(`  [round ${round} error] ${event.message}`);
          }
        },
        round: (r) => {
          context.logger.info(
            `Round ${r.round} complete: ${r.calls.length} tool call(s), provider ${Math.round(
              r.providerDurationMs
            )} ms, truncated=${String(r.truncated)}`
          );
        }
      };

      const loopResult = await AiAssist.runClientToolLoop({
        descriptor,
        apiKey,
        ...request,
        clientTools: [memoryTool],
        tools: serverTools,
        model,
        resolvedThinking,
        maxRounds: MAX_ROUNDS,
        deadlineMs: LOOP_DEADLINE_MS,
        logger: context.logger,
        observer
      });
      if (loopResult.isFailure()) {
        return fail(
          `runClientToolLoop failed after ${loopResult.detail?.rounds.length ?? 0} round(s): ${
            loopResult.message
          }`
        );
      }

      const outcome = loopResult.value;
      if (outcome.state !== 'completed') {
        return fail(`runClientToolLoop ended ${outcome.state} after ${outcome.rounds.length} round(s)`);
      }

      const calls = outcome.rounds.flatMap((r) => r.calls);
      const clientToolCallCount = calls.length;
      // The final round's text, falling back to round 1's when the final round said nothing.
      const lastText = outcome.rounds[outcome.rounds.length - 1]?.fullText ?? '';
      const finalResponse = lastText.length > 0 ? lastText : outcome.rounds[0]?.fullText ?? '';

      context.logger.info('');
      context.logger.info('=== FINAL RESPONSE ===');
      context.logger.info(finalResponse.slice(0, 500) + (finalResponse.length > 500 ? '...' : ''));

      const verdicts = clientToolRunVerdicts({
        rounds: outcome.rounds.length,
        clientToolCalls: clientToolCallCount,
        serverToolEvents: serverToolEventCount,
        mixedRounds: outcome.rounds.filter(
          (r) => r.calls.length > 0 && roundsWithServerToolEvents.has(r.round)
        ).length
      });
      const summaryLines = [
        verdicts.header,
        '',
        `Model: ${model} (${AiAssist.resolveProviderModel(descriptor, model, undefined).orDefault(model)})`,
        'Thinking: enabled (effort=low)',
        `Rounds: ${outcome.rounds.length} (state=${outcome.state})`,
        `Client tools invoked: ${clientToolCallCount}`,
        `Server tool events: ${serverToolEventCount}`,
        `Tool calls summary (${calls.length}):`,
        ...calls.map(
          (s) =>
            `  - ${s.toolName}` +
            (s.callId !== undefined ? ` (callId=${s.callId})` : '') +
            ` → isError=${String(s.isError)}, ${Math.round(s.durationMs)} ms`
        ),
        '',
        'Empirical gates:',
        ...verdicts.gates,
        '  [PASS] Server + client tool coexistence: both tool types present in request',
        '',
        'Final response (first 300 chars):',
        finalResponse.slice(0, 300) + (finalResponse.length > 300 ? '...' : '')
      ];

      return succeed(summaryLines.join('\n'));
    }
  };
}

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
 * Requires an Anthropic API key (env var `ANTHROPIC_API_KEY` on the CLI, the Secrets panel
 * on the web). Web-runnable — the shell's generic runner panel invokes `cli.run` directly in
 * the browser via a direct (CORS-permitting) Anthropic API call.
 *
 * @public
 */
export const anthropicClientToolsScenario: IScenario = {
  id: 'anthropic-client-tools',
  title: 'Anthropic Client Tools + Thinking',
  description:
    'Empirical verification of the ai-assist-client-tools Phase C implementation. ' +
    'Exercises memory tool (client) + web_search (server) coexisting on Anthropic with ' +
    'extended thinking enabled. Requires an Anthropic API key. ' +
    'A successful live round-trip confirms thinking-block signature preservation (E5 gate).',
  category: 'ai',
  tags: ['anthropic', 'client-tools', 'thinking', 'tool-use', 'live-api'],
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('anthropic'),
      envVarName: 'ANTHROPIC_API_KEY',
      description: 'Anthropic API key for live round-trip verification'
    }
  ],
  cli: makeCliImpl('@anthropic:sonnet')
};

/**
 * The same B-6 round-trip on `@anthropic:fable`.
 *
 * @remarks
 * Claude Fable 5.2 and Claude Mythos 5.2 enforce the prefix check on every account: a replayed
 * thinking block whose prefix (`system`, `tools`, or an earlier message) has changed returns a 400
 * ("The block is bound to a different conversation"), where Claude Sonnet 5.5 errors only for
 * accounts created on or after 2026-08-31. A clean run here is the live check that the replayed
 * history is append-only.
 *
 * @public
 */
export const anthropicClientToolsFableScenario: IScenario = {
  ...anthropicClientToolsScenario,
  id: 'anthropic-client-tools-fable',
  title: 'Anthropic Client Tools + Thinking (Fable)',
  description:
    'The anthropic-client-tools round-trip on @anthropic:fable, which enforces the preserved-thinking ' +
    'prefix check on every account: a 400 naming "a different conversation" means a replayed turn was ' +
    'edited. Requires an Anthropic API key.',
  cli: makeCliImpl('@anthropic:fable')
};
