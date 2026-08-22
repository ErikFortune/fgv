/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Provider-agnostic structured-output probe.
 *
 * @remarks
 * **What this exists to check, and what unit tests cannot.** The suite pins each
 * provider's request body against the wire shape *as documented*. That is evidence
 * the client does what it intends; it is not evidence the provider **accepts** it.
 * A wrong-but-plausible field name is accepted-and-ignored by several of these
 * APIs, which is the worst outcome available: the request looks constrained, the
 * reply is not, and `structuredOutput` reports `'schema'`. Only a live call can
 * tell those apart.
 *
 * So the probe deliberately does **not** assert "the call succeeded". It asserts
 * the three things that would still be true of a silently-ignored constraint only
 * by luck:
 *
 * 1. the reply **parses** as JSON;
 * 2. the reply **validates** against the very schema that was sent; and
 * 3. the reported enforcement is the one we asked for, not a degradation.
 *
 * The prompt is written to make an *unconstrained* model likely to fail (2) — it
 * asks for prose framing and a field the schema forbids — so a pass is meaningful
 * rather than incidental.
 * @packageDocumentation
 */

import { AiAssist } from '@fgv/ts-extras';
import { JsonSchema } from '@fgv/ts-json-base';
import { Logging, Result, captureResult, fail, succeed } from '@fgv/ts-utils';

/**
 * The shape every probe asks for. Small, cheap, and strict — `additionalProperties`
 * is false by default in `JsonSchema`, which is what makes the "invent a field"
 * half of the prompt a real test rather than a formality.
 * @public
 */
export const PROBE_SCHEMA: JsonSchema.ISchemaValidator<{
  city: string;
  countryCode: string;
  populationMillions: number;
}> = JsonSchema.object({
  city: JsonSchema.string(),
  countryCode: JsonSchema.string(),
  populationMillions: JsonSchema.number()
});

/** The static type derived from {@link PROBE_SCHEMA} — no caller-supplied `T`. */
export type ProbeShape = JsonSchema.Static<typeof PROBE_SCHEMA>;

/**
 * Written to be hostile to an unconstrained model: it invites prose, a code fence,
 * and an extra field. A model under a real schema constraint cannot comply with any
 * of those; a model that was merely *asked* very often does.
 */
const PROBE_PROMPT: string =
  'Tell me about Paris, France. Start with a friendly sentence of context, then give the ' +
  'data as a JSON object in a markdown code fence, and include a "funFact" field.';

/** One provider's probe outcome. @public */
export interface IProbeOutcome {
  readonly label: string;
  /** `'pass'` — parsed, validated, and reported the requested enforcement. */
  readonly verdict: 'pass' | 'fail' | 'skipped';
  readonly detail: string;
}

/**
 * The live completion seam, injected so the probe's own logic (dispatch,
 * classification, the three assertions, the fold) is testable without a key —
 * the same shape `modelTiers`' `ITierCanaryDeps.complete` uses.
 * @public
 */
export type ProbeComplete = (
  params: AiAssist.IProviderCompletionParams
) => Promise<Result<AiAssist.IAiCompletionResponse>>;

/** How long a single probe waits before giving up. @public */
export const DEFAULT_PROBE_TIMEOUT_MS: number = 90_000;

/** Everything one probe run needs. @public */
export interface IProbeSpec {
  readonly label: string;
  readonly descriptor: AiAssist.IAiProviderDescriptor;
  readonly apiKey: string | undefined;
  /** Omit for the default (chat-completions) route; `[{ type: 'web_search' }]`-style to force the alternate one. */
  readonly tools?: ReadonlyArray<AiAssist.AiServerToolConfig>;
  readonly modelOverride?: string;
  readonly request: AiAssist.StructuredOutputRequest;
  /** The enforcement this provider/model pair is expected to report. */
  readonly expect: AiAssist.StructuredOutputEnforcement;
  /** Overrides {@link DEFAULT_PROBE_TIMEOUT_MS} for this probe. */
  readonly timeoutMs?: number;
}

/**
 * Run one probe. Returns a `'skipped'` outcome (not a failure) when no API key
 * resolved, so a partial-key run still reports usefully on the providers it can
 * reach rather than failing as a whole.
 */
export async function runProbe(
  spec: IProbeSpec,
  logger: Logging.ILogger,
  complete: ProbeComplete
): Promise<IProbeOutcome> {
  if (spec.apiKey === undefined) {
    return { label: spec.label, verdict: 'skipped', detail: 'no API key resolved' };
  }
  const completion = await complete({
    // A hung provider call blocked the first live run of this scenario with no
    // output and no way to tell "slow" from "wedged". A probe that can hang is not
    // a gate — it is a thing you have to babysit.
    signal: AbortSignal.timeout(spec.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS),
    descriptor: spec.descriptor,
    apiKey: spec.apiKey,
    messages: [{ role: 'user', content: PROBE_PROMPT }],
    ...(spec.tools !== undefined ? { tools: spec.tools } : {}),
    ...(spec.modelOverride !== undefined ? { modelOverride: spec.modelOverride } : {}),
    structuredOutput: spec.request,
    // Strict on purpose. A probe that degraded would report a green run for a
    // provider whose constraint never reached the wire.
    logger
  });
  if (completion.isFailure()) {
    return { label: spec.label, verdict: 'fail', detail: `call failed: ${completion.message}` };
  }
  const { content, structuredOutput } = completion.value;
  logger.info(`${spec.label}: enforcement=${structuredOutput} content=${content}`);

  if (structuredOutput !== spec.expect) {
    return {
      label: spec.label,
      verdict: 'fail',
      detail: `reported '${structuredOutput}', expected '${spec.expect}' — the model/capability pair may have changed`
    };
  }
  const parsed: Result<unknown> = captureResult(() => JSON.parse(content) as unknown).withErrorFormat(
    (m) =>
      `reply did not parse as JSON (${m}). Either the constraint never reached the wire, or the ` +
      `provider applied it and still emitted a malformed document — check whether the content is ` +
      `fenced/prose (constraint missing) or nearly-valid JSON (provider defect)`
  );
  if (parsed.isFailure()) {
    return { label: spec.label, verdict: 'fail', detail: parsed.message };
  }
  // **What is checked next follows from the MODE, because the two modes promise
  // different things and asserting the stronger one everywhere tests a guarantee
  // the library never made.**
  //
  // `json-object` promises syntactic validity and *arbitrary shape*. So the parse
  // above IS its guarantee — and against this deliberately hostile prompt it is a
  // real one, since the prompt asks for a markdown code fence and a successful
  // parse proves the fence was suppressed. Demanding schema conformance here
  // failed a live run against OpenAI on 2026-08-22 where every party behaved
  // correctly: the model added the `funFact` field the prompt asked for, which
  // nothing in this mode forbids.
  if (spec.request.mode === 'json-object') {
    if (typeof parsed.value !== 'object' || parsed.value === null || Array.isArray(parsed.value)) {
      return {
        label: spec.label,
        verdict: 'fail',
        detail: `json-object mode returned valid JSON that is not an object: ${content}`
      };
    }
    return {
      label: spec.label,
      verdict: 'pass',
      detail: `enforcement=${structuredOutput}, parsed as an object`
    };
  }

  // `schema` and `tool-forced` DO promise shape, so validate against the very
  // object that was sent — the assertion an accepted-and-ignored field would fail.
  const validated = PROBE_SCHEMA.validate(parsed.value);
  if (validated.isFailure()) {
    return {
      label: spec.label,
      verdict: 'fail',
      detail: `reply parsed but does not match the schema that was sent: ${validated.message}`
    };
  }
  return {
    label: spec.label,
    verdict: 'pass',
    detail: `enforcement=${structuredOutput}, matched the schema`
  };
}

/**
 * Fold a set of outcomes into the scenario's `Result`.
 *
 * @remarks
 * A run in which **everything** was skipped is a failure, not a pass — a green
 * check for a probe that made no calls is exactly the "gate that stopped gating"
 * shape this repo has been burned by.
 */
export function summarize(outcomes: ReadonlyArray<IProbeOutcome>): Result<string> {
  const lines = outcomes.map((o) => `  ${o.verdict.toUpperCase().padEnd(7)} ${o.label} — ${o.detail}`);
  const failed = outcomes.filter((o) => o.verdict === 'fail');
  const passed = outcomes.filter((o) => o.verdict === 'pass');
  const report = lines.join('\n');
  if (failed.length > 0) {
    return fail(`${failed.length} of ${outcomes.length} probes failed:\n${report}`);
  }
  if (passed.length === 0) {
    return fail(`no probe ran — every provider was skipped for want of an API key:\n${report}`);
  }
  return succeed(`${passed.length} passed, ${outcomes.length - passed.length} skipped:\n${report}`);
}
