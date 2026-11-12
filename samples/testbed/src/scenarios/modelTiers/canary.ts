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
 * Shared model-tier canary logic for the per-provider tier scenarios
 * (`openai-model-tiers`, `anthropic-model-tiers`, `google-gemini-model-tiers`,
 * `xai-grok-model-tiers`).
 *
 * The canary has two halves, separated so the deterministic half is fully unit-testable
 * without any network access (the `mcpProbe` deps-injection pattern):
 *
 * 1. **Resolver proof (offline, deterministic).** For each requested tier, resolve the
 *    descriptor's tiered `defaultModel` to its (possibly aliased) model string and then to the
 *    concrete provider id, and log the `alias -> concrete` hop — matching the shipped
 *    `@google-gemini:flash -> …` maintenance-loop log line. A `frontier` request against a
 *    descriptor with no `frontier` key resolves (via the cascade) to the `advanced` id — the log
 *    line for that request is the live cascade proof.
 * 2. **Live canary (keyed).** Fire a minimal completion at each tier and classify the outcome.
 *    This half is the orchestrator's gate: it needs live API keys, so the completion call is
 *    injected via {@link ITierCanaryDeps.complete}. When no key is available the scenario omits
 *    `complete` and every tier is reported as `not-run` (STOP-FLAG: resolver verified, live
 *    canary pending the orchestrator's keyed run).
 * 3. **Supplementary probes (keyed, opt-in per spec).** Each has its own report section:
 *    - thinking probes: one completion per tier, extra model and effort (`thinkingEfforts`)
 *    - strict-none probes: `'none'` plus `onUnsupported: 'fail'` on every tier and extra model,
 *      checked against `thinkingRequiredModelPrefixes` (`strictNoneProbe`). A listed model must be
 *      `refused-locally`. On a listed model, and on a model with its own off value
 *      (`anthropicThinkingOffTypes`), a second, raw `'none'` sends the provider's default off value
 *      past the library gate, and the provider's own rejection (`expected-reject`) keeps the listing
 *      honest in the other direction
 *    - model-override rows for aliases no tier reaches (`extraModels`)
 *    - temperature probes: a `temperature` (optionally with an effort) on the tiers and extra
 *      models a probe names, each with a stated expectation — accepted, `refused-locally` (the
 *      library refuses before any request is sent), `expected-reject` (the provider is expected
 *      to return a 400) or `observed` (report-only; a `raw` probe sends the temperature in an
 *      `'other'` block, past the library gate) (`temperatureProbes`)
 *    - max-output probes: one completion per tier and extra model with `maxTokens` set to the
 *      recorded `resolveMaxOutputTokens` limit, or a `no-recorded-limit` row and no call when none
 *      is recorded (`maxOutputProbe`)
 *    - structured-output probes: a schema-mode completion per tier and extra model with
 *      `onUnsupported: 'fail'` (`structuredOutputProbe`), checked against the registry's declared
 *      format — the reported enforcement must match it and the reply must satisfy the schema.
 *      `structuredOutputEfforts` repeats each with a thinking effort, so the request carries a
 *      thinking config and a structured-output constraint at once
 *    - one live image generation (`liveImage`, via {@link ITierCanaryDeps.generateImage})
 *    Any probe failure fails the run, the same as a tier failure.
 *
 * The verdict deliberately distinguishes a **resolver bug or stale id** (a real failure) from
 * **access-gating** (resolver correct, the key simply lacks access — e.g. gpt-image
 * org-verification or frontier-model gating). An access-gated tier is surfaced as
 * `BLOCKED`, not a failure of the resolver work.
 *
 * @packageDocumentation
 */

import { fail, mapResults, succeed } from '@fgv/ts-utils';
import type { Logging, Result } from '@fgv/ts-utils';
import { Converters as JsonConverters, JsonSchema } from '@fgv/ts-json-base';
import { AiAssist } from '@fgv/ts-extras';

/**
 * A quality tier requested against a provider's tiered `defaultModel`.
 * @public
 */
export type CanaryTier = 'base' | 'advanced' | 'frontier';

/**
 * The offline (deterministic) resolution of one tier request against a descriptor.
 * @public
 */
export interface ITierResolution {
  /** The requested tier. */
  readonly tier: CanaryTier;
  /**
   * The (possibly aliased) model string the spec-walk selected. For a tier with no direct key on
   * the descriptor this is the cascade target's alias (e.g. a `frontier` request on a
   * frontier-less descriptor yields the `advanced` alias).
   */
  readonly alias: string;
  /** The concrete provider id after alias resolution. */
  readonly concrete: string;
  /** True when the requested tier has no direct key on the descriptor, so the cascade fired. */
  readonly cascaded: boolean;
}

/**
 * Classification of a live completion attempt for one tier.
 * @public
 */
export type TierLiveOutcome =
  /** HTTP 200 + non-empty body: resolver correct AND the id answers. */
  | 'live-pass'
  /** Resolver correct, but the key lacks access (401/403 or org-verification) — canary-blocked, not a failure. */
  | 'access-gated'
  /**
   * Resolver + id correct, but the model rejected an explicitly-supplied request **parameter**
   * (e.g. a caller-provided `temperature`, which the Claude-5 family rejects outright and GPT-5.5
   * rejects at non-default values). This is a completion-path/parameter incompatibility, NOT a
   * resolver or id problem — surfaced as BLOCKED so it is not conflated with a stale alias. The
   * default completion path no longer injects `temperature` (fixed in B5: it is sent only when the
   * caller explicitly provides one), so a keyed run with a minimal request does not hit this; it
   * remains a classification for an explicitly-incompatible param.
   */
  | 'param-rejected'
  /**
   * The id exists but is not callable via the chat-completions endpoint (needs the Responses API /
   * `v1/completions`) — e.g. OpenAI `gpt-5.5-pro`. A real capability/routing gap, distinct from a
   * stale id: no one-line alias edit fixes it. Fails the run and is escalated.
   */
  | 'wrong-endpoint'
  /** HTTP 404 / unknown-model: the alias value is stale — the maintenance-loop trigger, a real failure. */
  | 'id-wrong'
  /**
   * A thinking probe was rejected (HTTP 400, or a rejected-parameter message): the id answers, but
   * not with the thinking effort ai-assist sent for it. A real failure: it is an ai-assist
   * wire-mapping gap (e.g. `'none'` on a model with no `none` effort), not an access problem.
   */
  | 'param-failed'
  /** Any other live failure (or a 200 with an empty body) — a real failure. */
  | 'error'
  /**
   * The library refused the request before sending anything, and the probe expected exactly that
   * (a temperature the model rejects, or `'none'` with `onUnsupported: 'fail'` on a thinking-required
   * model). Not a failure. A local refusal returns before `fetch`, so no network call was made.
   */
  | 'refused-locally'
  /**
   * The provider rejected the request (an HTTP 400 or a rejected-parameter message), and the probe
   * expected exactly that — e.g. a raw `'none'` on a thinking-required model. Not a failure.
   */
  | 'expected-reject'
  /**
   * A report-only probe whose answer is not known yet: the row records whether the provider
   * accepted the request or what it said rejecting it, and makes no pass/fail claim. Not a failure.
   */
  | 'observed'
  /** A max-output probe on a model with no recorded output limit: nothing to verify, no call made. */
  | 'no-recorded-limit'
  /** Live call not attempted (no API key) — STOP-FLAG: resolver verified, live pending a keyed run. */
  | 'not-run';

/**
 * The per-tier live-canary result: the offline resolution plus the live classification.
 * @public
 */
export interface ITierLiveResult {
  readonly resolution: ITierResolution;
  readonly outcome: TierLiveOutcome;
  /** Free-text detail (the underlying failure message) for any non-`live-pass` / non-`not-run` outcome. */
  readonly detail?: string;
}

/**
 * The offline resolution of the (OpenAI-only) `image` tier, logged alongside the completion tiers.
 * @public
 */
export interface IImageResolution {
  readonly alias: string;
  readonly concrete: string;
}

/**
 * A generic thinking effort a thinking probe sends (`IThinkingConfig.effort`).
 * @public
 */
export type CanaryThinkingEffort = NonNullable<AiAssist.IThinkingConfig['effort']>;

/**
 * Per-call options for {@link ITierCanaryDeps.complete}. Absent fields mean the plain tier canary.
 * @public
 */
export interface ICanaryCompleteOptions {
  /** Send `thinking: { effort }` (a thinking probe). */
  readonly effort?: CanaryThinkingEffort;
  /** Send this `modelOverride` (an extra-model probe; alias or concrete id) instead of the tier. */
  readonly modelOverride?: string;
  /** Send `thinking.onUnsupported` alongside `effort` (the strict-none probe sends `'fail'`). */
  readonly onUnsupported?: 'degrade' | 'fail';
  /**
   * Send the provider's thinking-off value in an explicit provider block, which bypasses the
   * library's `'none'` gate, so the provider itself answers whether it accepts `'none'`.
   */
  readonly rawNone?: boolean;
  /**
   * Send this `temperature` inside an `'other'` provider block for the target model rather than as
   * the `temperature` parameter. The library sends such a block verbatim and does not check it, so
   * the provider itself answers whether it accepts the value.
   */
  readonly rawTemperature?: number;
  /** Send this `structuredOutput` request (a structured-output probe). */
  readonly structuredOutput?: AiAssist.StructuredOutputRequest;
  /** Send this `temperature` (a temperature probe). */
  readonly temperature?: number;
  /** Send this `maxTokens` (a max-output probe). */
  readonly maxTokens?: number;
  /**
   * Send this Gemini `thinkingLevel` in an explicit `google` block (an explicit-level probe). The
   * library sends a declared level verbatim, so the provider itself answers whether it accepts it.
   */
  readonly thinkingLevel?: AiAssist.GeminiThinkingLevel;
}

/**
 * What a probe expects of one request: that the provider answers it, that the library refuses it
 * before anything is sent, that the provider rejects it, or — `'observed'` — nothing yet: the row
 * reports what the provider said without a pass/fail claim.
 * @public
 */
export type CanaryExpectation = 'accepted' | 'refused-locally' | 'expected-reject' | 'observed';

/**
 * One temperature probe: a `temperature` (optionally with a thinking effort) sent to the tiers and
 * extra models it names, with the outcome it expects.
 * @public
 */
export interface ICanaryTemperatureProbe {
  readonly temperature: number;
  /** Send `thinking: { effort }` alongside the temperature. */
  readonly effort?: CanaryThinkingEffort;
  /** Concrete ids the probe applies to. Absent: every tier and extra model. */
  readonly models?: ReadonlyArray<string>;
  readonly expect: CanaryExpectation;
  /**
   * For `expect: 'expected-reject'`: the text the provider's rejection must match, so a 400 for an
   * unrelated reason (a usage limit) is not mistaken for the expected one.
   */
  readonly rejectPattern?: RegExp;
  /**
   * Send the temperature through an `'other'` provider block (see
   * {@link ICanaryCompleteOptions.rawTemperature}) instead of the `temperature` parameter, so the
   * library's own temperature gate does not answer for the provider.
   */
  readonly raw?: boolean;
}

/**
 * The schema every structured-output probe sends, and validates the reply against — the same
 * object, so the wire schema and the check cannot drift.
 * @public
 */
export const CANARY_STRUCTURED_SCHEMA: JsonSchema.ISchemaValidator<{ answer: string }> = JsonSchema.object({
  answer: JsonSchema.string()
});

/**
 * The live result of one supplementary probe (thinking, extra model, or image).
 * @public
 */
export interface ICanaryProbeResult {
  /** Row label in the report (e.g. `frontier effort=none`, `@google-gemini:flash-lite`, `image`). */
  readonly label: string;
  /** The concrete id the probe targets. */
  readonly concrete: string;
  readonly outcome: TierLiveOutcome;
  readonly detail?: string;
}

/**
 * Results of the supplementary probes a spec opted into. Each list is empty when not requested.
 * @public
 */
export interface ICanaryProbeResults {
  readonly thinking: ReadonlyArray<ICanaryProbeResult>;
  readonly strictNone: ReadonlyArray<ICanaryProbeResult>;
  readonly extraModels: ReadonlyArray<ICanaryProbeResult>;
  readonly temperature: ReadonlyArray<ICanaryProbeResult>;
  readonly maxOutput: ReadonlyArray<ICanaryProbeResult>;
  readonly structured: ReadonlyArray<ICanaryProbeResult>;
  readonly explicitLevel: ReadonlyArray<ICanaryProbeResult>;
  readonly image: ReadonlyArray<ICanaryProbeResult>;
}

/**
 * Injected dependencies for {@link runTierCanary}. The live seams are `complete` and
 * `generateImage`; omit them to run the offline resolver proof only (the keyless STOP-FLAG path).
 * @public
 */
export interface ITierCanaryDeps {
  /**
   * Fires a minimal live completion at the given tier (optionally with a thinking effort or a
   * `modelOverride`). Omit (leave `undefined`) when no API key is available — every tier and
   * completion probe is then reported `not-run`.
   */
  readonly complete?: (
    tier: CanaryTier,
    options?: ICanaryCompleteOptions
  ) => Promise<Result<AiAssist.IAiCompletionResponse>>;
  /**
   * Fires one live image generation at the descriptor's `image` tier. Omit when no API key is
   * available — the image probe is then reported `not-run`.
   */
  readonly generateImage?: () => Promise<Result<AiAssist.IAiImageGenerationResponse>>;
}

/**
 * The spec describing which provider + tiers a canary run exercises.
 * @public
 */
export interface ITierCanarySpec {
  /** The provider id (for report headings and error prefixes). */
  readonly providerId: string;
  /** The resolved provider descriptor. */
  readonly descriptor: AiAssist.IAiProviderDescriptor;
  /** The completion tiers to resolve + fire, in report order. */
  readonly tiers: ReadonlyArray<CanaryTier>;
  /** When true, also resolve + log the `image` tier (e.g. OpenAI's `@openai:image → gpt-image-2.5-sunburst`). */
  readonly imageTier?: boolean;
  /**
   * Thinking efforts to probe on every tier and extra model, one extra live completion per (target,
   * effort). Catches an effort the resolved model rejects (e.g. `'none'` on a model whose effort
   * floor is `low`). A `'none'` row on a thinking-required model is expected to be degraded to
   * `'low'` and answer; on any other model it is expected to answer with thinking off.
   */
  readonly thinkingEfforts?: ReadonlyArray<CanaryThinkingEffort>;
  /**
   * Extra models (fgv aliases or concrete ids) to resolve and fire via `modelOverride` — for
   * aliases no tier reaches (e.g. `@google-gemini:flash-lite`).
   */
  readonly extraModels?: ReadonlyArray<string>;
  /** When true (and `imageTier` is set), fire one live image generation at the `image` tier. */
  readonly liveImage?: boolean;
  /**
   * When true, probe every tier and extra model with `effort: 'none'` + `onUnsupported: 'fail'`.
   * The expectation comes from the registry: a model listed in `thinkingRequiredModelPrefixes` must
   * be refused locally, and any other model must answer live. A mismatch either way means the list
   * is wrong. A listed model, and a model with its own off value (`anthropicThinkingOffTypes`), also
   * gets a `none raw` row sending the provider's default off value, which must be rejected.
   */
  readonly strictNoneProbe?: boolean;
  /**
   * The text a `none raw` row's provider rejection must match (see
   * {@link ICanaryTemperatureProbe.rejectPattern}). Absent: any 400 counts as the expected rejection.
   */
  readonly rawNoneRejection?: RegExp;
  /** Temperature probes, each with its own expectation (see {@link ICanaryTemperatureProbe}). */
  readonly temperatureProbes?: ReadonlyArray<ICanaryTemperatureProbe>;
  /**
   * When true, fire one completion per tier and extra model with `maxTokens` set to
   * `resolveMaxOutputTokens` for it. It must be accepted: a refusal naming the output limit means
   * the recorded value is too high. A model with no recorded limit gets a `no-recorded-limit` row
   * and no call.
   */
  readonly maxOutputProbe?: boolean;
  /**
   * When true, fire one schema-mode structured-output completion (`onUnsupported: 'fail'`) per
   * tier and per extra model. The expectation comes from the registry: the response must report
   * the enforcement the model's declared format implies, and its content must satisfy
   * {@link CANARY_STRUCTURED_SCHEMA}. A provider 400 is `FAIL(param)` — the declared format is
   * one the model rejects.
   */
  readonly structuredOutputProbe?: boolean;
  /**
   * Thinking efforts to repeat every structured-output probe with, one extra row per (target,
   * effort). Such a request carries a thinking config **and** a structured-output constraint at once.
   * On Anthropic's adaptive models both land in `output_config` (`effort` beside `format`), which is
   * the combination only a live call can show the provider accepts. A dropped effort is invisible
   * here — the response does not report it — and is pinned by ts-extras' request-body tests instead.
   */
  readonly structuredOutputEfforts?: ReadonlyArray<CanaryThinkingEffort>;
  /**
   * When true, fire one completion per tier and extra model whose concrete id has a Gemini level
   * declaration (`resolveGeminiThinkingLevels`), sending its lowest declared level in an explicit
   * `google` block. It must be accepted: a provider 400 means the declared level list is wrong.
   */
  readonly explicitLevelProbe?: boolean;
}

/**
 * True when the descriptor's `defaultModel` declares a **direct key** for `tier`. A tiered map that
 * omits the key (or a bare-string `defaultModel`) means a request for that tier resolves via the
 * cascade rather than a direct hit — this key-presence check is the authoritative cascade signal
 * (a value-equality heuristic would false-positive if a provider ever set two tiers to the same
 * alias non-cascadingly).
 */
function tierKeyPresent(descriptor: AiAssist.IAiProviderDescriptor, tier: CanaryTier): boolean {
  const spec = descriptor.defaultModel;
  return typeof spec !== 'string' && tier in spec;
}

/**
 * Resolves one tier against the descriptor's tiered `defaultModel` to its alias + concrete id +
 * whether the cascade fired. Fails (with tier context) when the tier fails to resolve.
 */
function resolveOneTier(
  descriptor: AiAssist.IAiProviderDescriptor,
  tier: CanaryTier
): Result<ITierResolution> {
  // The completion path passes `tier` verbatim as the model context, with `undefined` meaning
  // base — mirror that so the canary resolves exactly what a real call would.
  const context = tier === 'base' ? undefined : tier;
  const alias = AiAssist.resolveModel(descriptor.defaultModel, context);
  // A non-base tier with no direct key on the descriptor resolves via the cascade.
  const cascaded = tier !== 'base' && !tierKeyPresent(descriptor, tier);
  return AiAssist.resolveProviderModel(descriptor, undefined, context)
    .withErrorFormat((msg) => `tier '${tier}': resolver failed: ${msg}`)
    .onSuccess((concrete) => succeed({ tier, alias, concrete, cascaded }));
}

/**
 * Resolves each requested tier against the descriptor's tiered `defaultModel`, returning the
 * alias + concrete id + whether the cascade fired. Fails if any tier fails to resolve (a real
 * resolver bug, offline-detectable).
 * @public
 */
export function resolveTierResolutions(
  descriptor: AiAssist.IAiProviderDescriptor,
  tiers: ReadonlyArray<CanaryTier>
): Result<ITierResolution[]> {
  return mapResults(tiers.map((tier) => resolveOneTier(descriptor, tier)));
}

/**
 * Classifies a live-completion failure message into a {@link TierLiveOutcome}. A real access signal
 * — an HTTP 401/403, or a specific organization-verification phrase — is `access-gated` (resolver
 * correct, key lacks access); a 404 / unknown-model is `id-wrong` (the alias value is stale);
 * anything else is `error`.
 *
 * The access-gated gate deliberately does NOT match a bare `/verif/i`: a TLS/certificate
 * "verification failed" error carries no access meaning, and green-washing it as `access-gated`
 * would hide a real transport failure behind a BLOCKED line. Such an error (no 401/403, no
 * org-verification phrase) falls through to `error`.
 * @public
 */
export function classifyLiveFailure(message: string): TierLiveOutcome {
  // Endpoint/capability mismatch (checked before the 404 branch, since it arrives as a 404/400):
  // the id exists but is not a chat-completions model.
  if (
    /not a chat model|chat\/completions endpoint|not supported in the v1\/chat\/completions|v1\/completions/i.test(
      message
    )
  ) {
    return 'wrong-endpoint';
  }
  // Completion-path parameter incompatibility (e.g. `temperature` deprecated on Claude-5, or
  // unsupported at 0.7 on GPT-5.5). Resolver + id are correct; the default request param is the
  // blocker — a real ai-assist finding, not a resolver bug.
  if (/temperature|is deprecated for this model|unsupported_value/i.test(message)) {
    return 'param-rejected';
  }
  const statusMatch = message.match(/returned (\d{3})/);
  const status = statusMatch ? Number(statusMatch[1]) : undefined;
  // Access-gated requires a real access signal: an HTTP 401/403, or a specific org-verification
  // phrase. A bare "verif" match is deliberately excluded so a TLS/cert "verification" failure is
  // NOT green-washed as access-gated (it falls through to `error`).
  if (
    status === 401 ||
    status === 403 ||
    /organization .*verif|verify your organization|must be verified/i.test(message)
  ) {
    return 'access-gated';
  }
  if (status === 404 || /model[^a-z]*not[^a-z]*found|not_found|does not exist|unknown model/i.test(message)) {
    return 'id-wrong';
  }
  return 'error';
}

/**
 * Classifies a thinking-probe failure. Access, stale-id and endpoint signals keep their tier-canary
 * meaning; an HTTP 400 or a rejected-parameter message becomes `param-failed` — on a probe whose
 * only difference from the passing tier canary is the thinking config, that is the config being
 * refused.
 * @public
 */
export function classifyThinkingFailure(message: string): TierLiveOutcome {
  const base = classifyLiveFailure(message);
  if (base === 'access-gated' || base === 'id-wrong' || base === 'wrong-endpoint') {
    return base;
  }
  if (base === 'param-rejected' || /returned 400/.test(message)) {
    return 'param-failed';
  }
  return base;
}

/** True for the outcomes that fail a canary run. */
function isRealFailure(outcome: TierLiveOutcome): boolean {
  return (
    outcome === 'id-wrong' ||
    outcome === 'error' ||
    outcome === 'wrong-endpoint' ||
    outcome === 'param-failed'
  );
}

/** Maps a {@link TierLiveOutcome} to the bracketed status tag used in the report. */
function liveTag(outcome: TierLiveOutcome): string {
  switch (outcome) {
    case 'live-pass':
      return 'PASS';
    case 'access-gated':
      return 'BLOCKED(access)';
    case 'param-rejected':
      return 'BLOCKED(param)';
    case 'wrong-endpoint':
      return 'FAIL(endpoint)';
    case 'id-wrong':
      return 'FAIL(id)';
    case 'param-failed':
      return 'FAIL(param)';
    case 'error':
      return 'FAIL';
    case 'refused-locally':
      return 'REFUSED-LOCALLY';
    case 'expected-reject':
      return 'EXPECTED-REJECT';
    case 'observed':
      return 'OBSERVED';
    case 'no-recorded-limit':
      return 'NO-RECORDED-LIMIT';
    case 'not-run':
      return 'PENDING';
  }
}

/**
 * Formats the human-readable canary report (resolver proof + live results + verdict).
 * @public
 */
export function formatTierCanaryReport(
  spec: ITierCanarySpec,
  liveResults: ReadonlyArray<ITierLiveResult>,
  imageResolution?: IImageResolution,
  probes?: ICanaryProbeResults
): string {
  const probeResults = probes
    ? [
        ...probes.thinking,
        ...probes.strictNone,
        ...probes.extraModels,
        ...probes.temperature,
        ...probes.maxOutput,
        ...probes.structured,
        ...probes.explicitLevel,
        ...probes.image
      ]
    : [];
  const outcomes = [...liveResults.map((r) => r.outcome), ...probeResults.map((r) => r.outcome)];
  const anyTierFailure = liveResults.some((r) => isRealFailure(r.outcome));
  const anyProbeFailure = probeResults.some((r) => isRealFailure(r.outcome));
  const anyNotRun = outcomes.some((o) => o === 'not-run');
  const anyBlocked = outcomes.some((o) => o === 'access-gated' || o === 'param-rejected');

  const verdict = anyTierFailure
    ? 'FAILED — a tier is not chat-completions-callable (wrong endpoint) or resolves to a stale id (see FAIL lines below)'
    : anyProbeFailure
    ? 'FAILED — a thinking, strict-none, model-override, temperature, max-output, structured-output, explicit-level or image probe failed (see FAIL lines below)'
    : anyNotRun
    ? 'RESOLVER-VERIFIED; LIVE CANARY PENDING (STOP-FLAG: set the provider API key to run the keyed gate)'
    : anyBlocked
    ? 'RESOLVER-VERIFIED; LIVE BLOCKED (resolver + ids correct; a tier was access-gated or its live check was blocked by a completion-path parameter incompatibility — see BLOCKED lines)'
    : 'LIVE-VERIFIED (every tier resolved and answered)';

  const resolverLines = liveResults.map((r) => {
    const cascade = r.resolution.cascaded ? ` (cascaded from a lower tier)` : '';
    return `  [PASS] ${r.resolution.tier.padEnd(8)} ${r.resolution.alias} -> ${
      r.resolution.concrete
    }${cascade}`;
  });
  if (imageResolution) {
    resolverLines.push(
      `  [PASS] ${'image'.padEnd(8)} ${imageResolution.alias} -> ${imageResolution.concrete}`
    );
  }

  const liveLines = liveResults.map((r) => {
    const detail = r.detail ? `  (${r.detail})` : '';
    return `  [${liveTag(r.outcome)}] ${r.resolution.tier.padEnd(8)} ${r.resolution.concrete}${detail}`;
  });

  const probeSection = (title: string, rows: ReadonlyArray<ICanaryProbeResult>): string[] =>
    rows.length === 0
      ? []
      : [
          '',
          title,
          ...rows.map((r) => {
            const detail = r.detail ? `  (${r.detail})` : '';
            return `  [${liveTag(r.outcome)}] ${r.label.padEnd(28)} ${r.concrete}${detail}`;
          })
        ];

  return [
    `=== ${spec.providerId} model-tier canary ===`,
    '',
    'Resolver proof (offline, deterministic — alias -> concrete id):',
    ...resolverLines,
    '',
    'Live canary (minimal completion per tier):',
    ...liveLines,
    ...probeSection('Thinking probes (tier + effort):', probes?.thinking ?? []),
    ...probeSection("Strict-none probes (effort none, onUnsupported 'fail'):", probes?.strictNone ?? []),
    ...probeSection('Model-override probes:', probes?.extraModels ?? []),
    ...probeSection('Temperature probes (each row states its expected outcome):', probes?.temperature ?? []),
    ...probeSection('Max-output probes (maxTokens = recorded output limit):', probes?.maxOutput ?? []),
    ...probeSection("Structured-output probes (schema, onUnsupported 'fail'):", probes?.structured ?? []),
    ...probeSection(
      'Explicit thinkingLevel probes (lowest declared level, sent verbatim):',
      probes?.explicitLevel ?? []
    ),
    ...probeSection('Live image probe:', probes?.image ?? []),
    '',
    `Verdict: ${verdict}`
  ].join('\n');
}

/** Classifies a completed (or failed) completion into a probe row. */
function completionProbe(
  label: string,
  concrete: string,
  result: Result<AiAssist.IAiCompletionResponse>,
  classify: (message: string) => TierLiveOutcome
): ICanaryProbeResult {
  if (result.isFailure()) {
    return { label, concrete, outcome: classify(result.message), detail: result.message };
  }
  return result.value.content.trim().length > 0
    ? { label, concrete, outcome: 'live-pass' }
    : { label, concrete, outcome: 'error', detail: 'HTTP 200 but empty body' };
}

/** Classifies a live image generation into a probe row. */
function imageProbe(
  concrete: string,
  result: Result<AiAssist.IAiImageGenerationResponse>
): ICanaryProbeResult {
  if (result.isFailure()) {
    // A rejected parameter is a real failure here, not a BLOCKED: the probe exists to verify the
    // image parameters ai-assist sends (e.g. xAI `quality`), so a 400 on one of them is the finding.
    const classified = classifyLiveFailure(result.message);
    const outcome: TierLiveOutcome = classified === 'param-rejected' ? 'param-failed' : classified;
    return { label: 'image', concrete, outcome, detail: result.message };
  }
  return result.value.images.some((img) => img.base64.length > 0)
    ? { label: 'image', concrete, outcome: 'live-pass' }
    : { label: 'image', concrete, outcome: 'error', detail: 'HTTP 200 but no image data' };
}

/**
 * One request target shared by the per-target probes: a tier, or an extra model reached through
 * `modelOverride` (always at the `base` tier). `label` is the tier name or the model string.
 */
interface ICanaryTarget {
  readonly label: string;
  readonly concrete: string;
  readonly tier: CanaryTier;
  readonly modelOverride?: string;
}

/** The completion options for `target`, adding its `modelOverride` (when it has one) to `options`. */
function targetOptions(target: ICanaryTarget, options: ICanaryCompleteOptions): ICanaryCompleteOptions {
  return target.modelOverride !== undefined ? { ...options, modelOverride: target.modelOverride } : options;
}

/** The tier targets followed by the extra-model targets, in report order. */
function allTargets(
  resolutions: ReadonlyArray<ITierResolution>,
  extraModels: ReadonlyArray<ICanaryTarget>
): ICanaryTarget[] {
  return [...resolutions.map((r) => ({ label: r.tier, concrete: r.concrete, tier: r.tier })), ...extraModels];
}

/**
 * The library's local refusals: each is returned before the request is built, so before `fetch`.
 * A provider failure always carries `returned <status>` (see `isLocalRefusal`).
 */
const LOCAL_REFUSALS: ReadonlyArray<RegExp> = [
  /thinking effort 'none' is not supported by/,
  /does not accept (a non-default )?temperature/,
  /thinking mode is not compatible with temperature/,
  /is not supported by \S+: its thinking levels are/
];

/**
 * True when a failure message is one of the library's own pre-wire refusals rather than a provider
 * response: it matches a known local refusal and carries no HTTP status.
 * @public
 */
export function isLocalRefusal(message: string): boolean {
  return !/returned \d{3}/.test(message) && LOCAL_REFUSALS.some((re) => re.test(message));
}

/**
 * The expectation a thinking probe states for its row, read off the registry: `'none'` on a
 * thinking-required model is sent as `'low'`; elsewhere it turns thinking off, naming the off value
 * when the model has its own (`anthropicThinkingOffTypes`). On a Gemini level model
 * (`resolveGeminiThinkingLevels`) every row names the `thinkingLevel` it is sent as.
 */
function thinkingExpectation(
  spec: ITierCanarySpec,
  concrete: string,
  effort: CanaryThinkingEffort
): string | undefined {
  const levels = AiAssist.resolveGeminiThinkingLevels(spec.descriptor, concrete);
  const required = AiAssist.isThinkingRequiredModel(spec.descriptor, concrete);
  if (levels !== undefined) {
    if (effort === 'none') {
      return required
        ? "degraded to thinkingLevel 'low' (thinking-required)"
        : "sent as thinkingLevel 'minimal'";
    }
    return `sent as thinkingLevel '${effort}'`;
  }
  if (effort !== 'none') {
    return undefined;
  }
  if (required) {
    return "degraded to 'low' (thinking-required)";
  }
  const offType = AiAssist.resolveAnthropicThinkingOffType(spec.descriptor, concrete);
  return offType === 'disabled' ? 'sent with thinking off' : `sent with thinking off (${offType})`;
}

/**
 * Whether a target gets a `none raw` row, and the rejection text it must match. A thinking-required
 * model and a model with its own off value both reject the provider's default off value.
 */
function rawNonePlan(
  spec: ITierCanarySpec,
  concrete: string,
  listed: boolean
): { readonly note: string; readonly rejectPattern?: RegExp } | undefined {
  const offType = AiAssist.resolveAnthropicThinkingOffType(spec.descriptor, concrete);
  if (!listed && offType === 'disabled') {
    return undefined;
  }
  return {
    note: listed
      ? 'the provider still rejects none, as listed'
      : `the provider still rejects disabled; this model's off value is ${offType}`,
    rejectPattern: spec.rawNoneRejection
  };
}

/** Runs the thinking probes: one live completion per (tier or extra model, effort). */
async function runThinkingProbes(
  spec: ITierCanarySpec,
  targets: ReadonlyArray<ICanaryTarget>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  for (const target of targets) {
    for (const effort of spec.thinkingEfforts ?? []) {
      const label = `${target.label} effort=${effort}`;
      const expectation = thinkingExpectation(spec, target.concrete, effort);
      if (deps.complete === undefined) {
        rows.push({
          label,
          concrete: target.concrete,
          outcome: 'not-run',
          ...(expectation !== undefined ? { detail: `expect ${expectation}` } : {})
        });
        continue;
      }
      const result = await deps.complete(target.tier, targetOptions(target, { effort }));
      rows.push(
        withPassDetail(completionProbe(label, target.concrete, result, classifyThinkingFailure), expectation)
      );
    }
  }
  return rows;
}

/**
 * Runs the explicit-level probes: on every target whose concrete id has a Gemini level declaration,
 * one completion sending its lowest declared level in an explicit block. Targets with no declaration
 * get no row.
 */
async function runExplicitLevelProbes(
  spec: ITierCanarySpec,
  targets: ReadonlyArray<ICanaryTarget>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  if (!spec.explicitLevelProbe) {
    return rows;
  }
  for (const target of targets) {
    const lowest = AiAssist.resolveGeminiThinkingLevels(spec.descriptor, target.concrete)?.[0];
    if (lowest === undefined) {
      continue;
    }
    const label = `${target.label} level=${lowest}`;
    if (deps.complete === undefined) {
      rows.push({ label, concrete: target.concrete, outcome: 'not-run', detail: 'expect accepted' });
      continue;
    }
    const result = await deps.complete(target.tier, targetOptions(target, { thinkingLevel: lowest }));
    rows.push(
      classifyExpectedProbe(label, target.concrete, 'accepted', result, {
        note: `thinkingLevel '${lowest}' accepted`
      })
    );
  }
  return rows;
}

/** Classifies one strict-none probe against the registry's expectation for that model. */
function strictNoneProbe(
  label: string,
  concrete: string,
  listed: boolean,
  result: Result<AiAssist.IAiCompletionResponse>
): ICanaryProbeResult {
  if (listed) {
    return classifyExpectedProbe(label, concrete, 'refused-locally', result, { note: 'as listed' });
  }
  return completionProbe(label, concrete, result, classifyThinkingFailure);
}

/** Runs the strict-none probes: one `none` + `onUnsupported: 'fail'` completion per target. */
async function runStrictNoneProbes(
  spec: ITierCanarySpec,
  targets: ReadonlyArray<ICanaryTarget>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  if (!spec.strictNoneProbe) {
    return rows;
  }
  for (const target of targets) {
    const label = `${target.label} none+fail`;
    const rawLabel = `${target.label} none raw`;
    const listed = AiAssist.isThinkingRequiredModel(spec.descriptor, target.concrete);
    const raw = rawNonePlan(spec, target.concrete, listed);
    if (deps.complete === undefined) {
      rows.push({
        label,
        concrete: target.concrete,
        outcome: 'not-run',
        detail: listed ? 'expect refused-locally' : 'expect accepted'
      });
      if (raw !== undefined) {
        rows.push({
          label: rawLabel,
          concrete: target.concrete,
          outcome: 'not-run',
          detail: 'expect expected-reject'
        });
      }
      continue;
    }
    const result = await deps.complete(
      target.tier,
      targetOptions(target, { effort: 'none', onUnsupported: 'fail' })
    );
    rows.push(strictNoneProbe(label, target.concrete, listed, result));
    if (raw !== undefined) {
      // The local refusal above never reaches the provider, so it cannot notice a provider that
      // has started accepting 'none'. Ask the provider directly, bypassing the gate. On a model
      // with its own off value, this pins that the default value is still rejected.
      const rawResult = await deps.complete(target.tier, targetOptions(target, { rawNone: true }));
      rows.push(rawNoneProbe(rawLabel, target.concrete, rawResult, raw.note, raw.rejectPattern));
    }
  }
  return rows;
}

/**
 * Classifies a raw-`none` probe. A provider 400 (or rejected-parameter message) is the expected
 * answer: the listing, or the model's own off value, is still needed. A success fails: the provider
 * now accepts its default off value, and the `thinkingRequiredModelPrefixes` or
 * `anthropicThinkingOffTypes` entry is stale.
 */
function rawNoneProbe(
  label: string,
  concrete: string,
  result: Result<AiAssist.IAiCompletionResponse>,
  note: string,
  rejectPattern: RegExp | undefined
): ICanaryProbeResult {
  if (result.isSuccess()) {
    return {
      label,
      concrete,
      outcome: 'error',
      detail: 'the provider accepted none; the thinking-required or off-value listing is stale'
    };
  }
  return classifyExpectedProbe(label, concrete, 'expected-reject', result, { note, rejectPattern });
}

/**
 * Options for {@link classifyExpectedProbe}.
 * @public
 */
export interface ICanaryExpectationOptions {
  /** Detail on a passing row (prefixed to the provider text on an `expected-reject` row). */
  readonly note?: string;
  /** The text an `expected-reject` row's provider rejection must match. */
  readonly rejectPattern?: RegExp;
}

/**
 * Classifies a probe whose expected outcome is stated up front.
 *
 * - `'refused-locally'`: passes only on one of the library's pre-wire refusals
 *   ({@link isLocalRefusal}); a call that went through, or reached the provider and failed there,
 *   is an `error`.
 * - `'expected-reject'`: passes only on a provider rejection of the request (HTTP 400 or a
 *   rejected-parameter message). A success, or a local refusal, is an `error`; an access or
 *   stale-id failure keeps its usual meaning.
 * - `'accepted'`: passes on a non-empty answer. A local refusal is an `error` (the library is
 *   stricter than the probe expects); a provider failure is classified as a thinking failure.
 * - `'observed'`: report-only. An answer reads `accepted`; a provider rejection of the request reads
 *   `rejected: <provider text>`; neither fails. A local refusal is an `error` (the probe meant to
 *   reach the provider), and an access or stale-id failure keeps its usual meaning.
 *
 * `options.note`, when given, is the detail on a passing row; on an `expected-reject` row the
 * provider's own text follows it, so the report always shows what the provider said.
 * `options.rejectPattern`, when given, must match an `expected-reject` row's provider text: a 400
 * for some other reason (a usage limit, a malformed request) is an `error` carrying that text.
 * @public
 */
export function classifyExpectedProbe(
  label: string,
  concrete: string,
  expect: CanaryExpectation,
  result: Result<AiAssist.IAiCompletionResponse>,
  options: ICanaryExpectationOptions = {}
): ICanaryProbeResult {
  const { note, rejectPattern } = options;
  const local = result.isFailure() && isLocalRefusal(result.message);
  const passDetail = note !== undefined ? { detail: note } : {};
  switch (expect) {
    case 'refused-locally':
      if (result.isSuccess()) {
        return {
          label,
          concrete,
          outcome: 'error',
          detail: 'expected a local refusal, but the call went through'
        };
      }
      return local
        ? { label, concrete, outcome: 'refused-locally', ...passDetail }
        : {
            label,
            concrete,
            outcome: 'error',
            detail: `expected a local refusal, but the request reached the provider: ${result.message}`
          };
    case 'expected-reject': {
      if (result.isSuccess()) {
        return {
          label,
          concrete,
          outcome: 'error',
          detail: 'expected the provider to reject this, but it answered — the expectation is stale'
        };
      }
      if (local) {
        return {
          label,
          concrete,
          outcome: 'error',
          detail: `expected the provider to reject this, but it was refused locally: ${result.message}`
        };
      }
      const outcome = classifyThinkingFailure(result.message);
      if (outcome !== 'param-failed') {
        return { label, concrete, outcome, detail: result.message };
      }
      if (rejectPattern !== undefined && !rejectPattern.test(result.message)) {
        return {
          label,
          concrete,
          outcome: 'error',
          detail: `the provider rejected this, but not for the expected reason: ${result.message}`
        };
      }
      return {
        label,
        concrete,
        outcome: 'expected-reject',
        detail: note !== undefined ? `${note}: ${result.message}` : result.message
      };
    }
    case 'accepted':
      if (local) {
        return {
          label,
          concrete,
          outcome: 'error',
          detail: `expected the provider to answer, but it was refused locally: ${result.message}`
        };
      }
      return withPassDetail(completionProbe(label, concrete, result, classifyThinkingFailure), note);
    case 'observed':
      return observedProbe(label, concrete, result, local);
  }
}

/** Classifies a report-only probe (see {@link classifyExpectedProbe}'s `'observed'`). */
function observedProbe(
  label: string,
  concrete: string,
  result: Result<AiAssist.IAiCompletionResponse>,
  local: boolean
): ICanaryProbeResult {
  if (result.isSuccess()) {
    return { label, concrete, outcome: 'observed', detail: 'accepted' };
  }
  if (local) {
    return {
      label,
      concrete,
      outcome: 'error',
      detail: `the probe meant to reach the provider, but it was refused locally: ${result.message}`
    };
  }
  const outcome = classifyThinkingFailure(result.message);
  return outcome === 'param-failed'
    ? { label, concrete, outcome: 'observed', detail: `rejected: ${result.message}` }
    : { label, concrete, outcome, detail: result.message };
}

/** `row` with `detail` set to `note` when the row passed and a note is given. */
function withPassDetail(row: ICanaryProbeResult, note: string | undefined): ICanaryProbeResult {
  return row.outcome === 'live-pass' && note !== undefined ? { ...row, detail: note } : row;
}

/** The row label for one temperature probe on one target. */
function temperatureLabel(target: ICanaryTarget, probe: ICanaryTemperatureProbe): string {
  const effort = probe.effort !== undefined ? `+effort=${probe.effort}` : '';
  const raw = probe.raw === true ? ' raw' : '';
  return `${target.label} temp=${probe.temperature}${effort}${raw}`;
}

/**
 * Runs the temperature probes: each probe on every target it names (every target when it names
 * none), classified against the probe's stated expectation.
 */
async function runTemperatureProbes(
  spec: ITierCanarySpec,
  targets: ReadonlyArray<ICanaryTarget>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  for (const probe of spec.temperatureProbes ?? []) {
    // A probe that names a model no target reaches would silently produce no rows once an alias
    // moves; report it instead, so the probe gets updated with the alias.
    for (const model of probe.models ?? []) {
      if (!targets.some((t) => t.concrete === model)) {
        rows.push({
          label: `temp=${probe.temperature}`,
          concrete: model,
          outcome: 'error',
          detail: 'the probe names a model no tier or extra model resolves to; update the probe'
        });
      }
    }
    for (const target of targets) {
      if (probe.models !== undefined && !probe.models.includes(target.concrete)) {
        continue;
      }
      const label = temperatureLabel(target, probe);
      if (deps.complete === undefined) {
        rows.push({ label, concrete: target.concrete, outcome: 'not-run', detail: `expect ${probe.expect}` });
        continue;
      }
      const result = await deps.complete(
        target.tier,
        targetOptions(target, {
          ...(probe.raw === true
            ? { rawTemperature: probe.temperature }
            : { temperature: probe.temperature }),
          ...(probe.effort !== undefined ? { effort: probe.effort } : {})
        })
      );
      rows.push(
        classifyExpectedProbe(label, target.concrete, probe.expect, result, {
          rejectPattern: probe.rejectPattern
        })
      );
    }
  }
  return rows;
}

/** A refusal that names the output-token cap: the recorded limit is above what the provider takes. */
const OUTPUT_LIMIT_REFUSAL: RegExp =
  /max_tokens|max_completion_tokens|max_output_tokens|maxOutputTokens|output limit|output tokens/i;

/**
 * Classifies one max-output probe. A non-empty answer passes. A refusal naming the output-token cap
 * is `param-failed` with the recorded limit in the detail: that value is too high. Any other
 * failure keeps its thinking-probe classification.
 * @public
 */
export function classifyMaxOutputProbe(
  label: string,
  concrete: string,
  limit: number,
  result: Result<AiAssist.IAiCompletionResponse>
): ICanaryProbeResult {
  if (result.isFailure() && OUTPUT_LIMIT_REFUSAL.test(result.message)) {
    return {
      label,
      concrete,
      outcome: 'param-failed',
      detail: `the recorded limit ${limit} is too high: ${result.message}`
    };
  }
  return completionProbe(label, concrete, result, classifyThinkingFailure);
}

/**
 * Runs the max-output probes: per target, `maxTokens` = `resolveMaxOutputTokens` for exactly the
 * model the call reaches. No recorded limit → a `no-recorded-limit` row and no call.
 */
async function runMaxOutputProbes(
  spec: ITierCanarySpec,
  targets: ReadonlyArray<ICanaryTarget>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  if (!spec.maxOutputProbe) {
    return rows;
  }
  for (const target of targets) {
    const limit = AiAssist.resolveMaxOutputTokens(
      spec.descriptor,
      target.modelOverride,
      target.tier === 'base' ? undefined : target.tier
    );
    if (limit === undefined) {
      rows.push({
        label: `${target.label} max`,
        concrete: target.concrete,
        outcome: 'no-recorded-limit',
        detail: 'no maxOutputTokens entry for this model; no call made'
      });
      continue;
    }
    const label = `${target.label} max=${limit}`;
    if (deps.complete === undefined) {
      rows.push({ label, concrete: target.concrete, outcome: 'not-run', detail: 'expect accepted' });
      continue;
    }
    const result = await deps.complete(target.tier, targetOptions(target, { maxTokens: limit }));
    rows.push(classifyMaxOutputProbe(label, target.concrete, limit, result));
  }
  return rows;
}

/**
 * The enforcement a structured-output probe must report for `concrete`, read off the registry.
 * `'none'` when the model declares no capability — the probe then expects a local refusal.
 * @public
 */
export function expectedStructuredEnforcement(
  descriptor: AiAssist.IAiProviderDescriptor,
  concrete: string
): AiAssist.StructuredOutputEnforcement {
  switch (AiAssist.resolveStructuredOutputCapability(descriptor, concrete)?.format) {
    case undefined:
      return 'none';
    case 'anthropic-tool-forced':
      return 'tool-forced';
    default:
      return 'schema';
  }
}

/**
 * Classifies one structured-output probe. A pass needs all three: the call succeeded, the reported
 * enforcement is the one the registry declares for the model, and the content satisfies
 * {@link CANARY_STRUCTURED_SCHEMA}. A mock-free live 200 with the wrong enforcement or a
 * non-conforming reply is exactly the failure a request-shape unit test cannot see.
 * @public
 */
export function classifyStructuredProbe(
  label: string,
  concrete: string,
  expected: AiAssist.StructuredOutputEnforcement,
  result: Result<AiAssist.IAiCompletionResponse>
): ICanaryProbeResult {
  if (result.isFailure()) {
    return { label, concrete, outcome: classifyThinkingFailure(result.message), detail: result.message };
  }
  const reported = result.value.structuredOutput;
  if (reported !== expected) {
    return {
      label,
      concrete,
      outcome: 'error',
      detail: `reported enforcement '${reported}', but the registry declares '${expected}' for this model`
    };
  }
  const parsed = JsonConverters.stringifiedJson(CANARY_STRUCTURED_SCHEMA).convert(result.value.content);
  return parsed.isSuccess()
    ? { label, concrete, outcome: 'live-pass', detail: `enforcement '${reported}'` }
    : {
        label,
        concrete,
        outcome: 'error',
        detail: `reply does not satisfy the probe schema: ${parsed.message}`
      };
}

/**
 * Runs the structured-output probes: one schema-mode completion per tier and per extra model, each
 * with `onUnsupported: 'fail'` so a model that declares no capability fails loudly rather than
 * degrading into a plain-text pass.
 */
async function runStructuredOutputProbes(
  spec: ITierCanarySpec,
  targets: ReadonlyArray<ICanaryTarget>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  if (!spec.structuredOutputProbe) {
    return rows;
  }
  const structuredOutput: AiAssist.StructuredOutputRequest = {
    mode: 'schema',
    schema: CANARY_STRUCTURED_SCHEMA,
    onUnsupported: 'fail'
  };
  const efforts: ReadonlyArray<CanaryThinkingEffort | undefined> = [
    undefined,
    ...(spec.structuredOutputEfforts ?? [])
  ];
  for (const effort of efforts) {
    for (const target of targets) {
      const label = `${target.label} schema${effort !== undefined ? `+effort=${effort}` : ''}`;
      if (deps.complete === undefined) {
        rows.push({ label, concrete: target.concrete, outcome: 'not-run' });
        continue;
      }
      const result = await deps.complete(
        target.tier,
        targetOptions(target, { structuredOutput, ...(effort !== undefined ? { effort } : {}) })
      );
      rows.push(
        classifyStructuredProbe(
          label,
          target.concrete,
          expectedStructuredEnforcement(spec.descriptor, target.concrete),
          result
        )
      );
    }
  }
  return rows;
}

/** Resolves (offline) one extra model to a `modelOverride` target. */
function resolveExtraModel(spec: ITierCanarySpec, model: string): Result<ICanaryTarget> {
  return AiAssist.resolveProviderModel(spec.descriptor, model, undefined)
    .withErrorFormat((msg) => `model override '${model}': resolver failed: ${msg}`)
    .onSuccess((concrete) =>
      succeed({ label: model, concrete, tier: 'base' as const, modelOverride: model })
    );
}

/** Fires (live) each extra model via `modelOverride`. */
async function runExtraModelProbes(
  extraModels: ReadonlyArray<ICanaryTarget>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  for (const target of extraModels) {
    if (deps.complete === undefined) {
      rows.push({ label: target.label, concrete: target.concrete, outcome: 'not-run' });
      continue;
    }
    const result = await deps.complete('base', targetOptions(target, {}));
    rows.push(completionProbe(target.label, target.concrete, result, classifyLiveFailure));
  }
  return rows;
}

/**
 * Runs a model-tier canary for one provider: resolves every tier (offline), logs each
 * `alias -> concrete` hop, optionally fires a live completion per tier via `deps.complete`, and
 * returns the formatted report. The Result fails only on a resolver bug or a stale id (`id-wrong`)
 * or a live `error`; `access-gated` and `not-run` tiers do NOT fail the run — they are surfaced in
 * the report as BLOCKED / PENDING (STOP-FLAG).
 * @public
 */
export async function runTierCanary(
  spec: ITierCanarySpec,
  deps: ITierCanaryDeps,
  logger: Logging.ILogger
): Promise<Result<string>> {
  const resolutionsResult = resolveTierResolutions(spec.descriptor, spec.tiers);
  if (resolutionsResult.isFailure()) {
    return fail(`${spec.providerId} tier canary: ${resolutionsResult.message}`);
  }
  const resolutions = resolutionsResult.value;

  // Offline resolver proof: log each alias -> concrete hop (matches the shipped
  // `@google-gemini:flash -> …` maintenance-loop log line). Deterministic; needs no API key.
  for (const r of resolutions) {
    logger.info(
      `resolved ${r.alias} -> ${r.concrete}` +
        (r.cascaded ? ` (tier '${r.tier}' request cascaded)` : ` (tier '${r.tier}')`)
    );
  }

  // Optional image-tier resolution — offline resolve + log. A live image call happens only when the
  // spec opts in with `liveImage` (see the image probe below), because a live image request can
  // fail for reasons unrelated to id rotation — some image models are access-gated (e.g. org
  // verification on the gpt-image line) — which the probe reports as BLOCKED, not FAIL.
  let imageResolution: IImageResolution | undefined;
  if (spec.imageTier) {
    const alias = AiAssist.resolveModel(spec.descriptor.defaultModel, 'image');
    const concreteResult = AiAssist.resolveProviderModel(spec.descriptor, undefined, 'image');
    if (concreteResult.isFailure()) {
      return fail(`${spec.providerId} tier canary: image tier resolver failed: ${concreteResult.message}`);
    }
    imageResolution = { alias, concrete: concreteResult.value };
    logger.info(`resolved ${alias} -> ${concreteResult.value} (image)`);
  }

  // Live half: fire a minimal completion per tier and classify. Omitted `complete` → all not-run.
  const liveResults: ITierLiveResult[] = [];
  for (const resolution of resolutions) {
    if (deps.complete === undefined) {
      liveResults.push({ resolution, outcome: 'not-run' });
      continue;
    }
    const completionResult = await deps.complete(resolution.tier);
    if (completionResult.isSuccess()) {
      const hasBody = completionResult.value.content.trim().length > 0;
      liveResults.push({
        resolution,
        outcome: hasBody ? 'live-pass' : 'error',
        detail: hasBody ? undefined : 'HTTP 200 but empty body'
      });
    } else {
      liveResults.push({
        resolution,
        outcome: classifyLiveFailure(completionResult.message),
        detail: completionResult.message
      });
    }
  }

  const extraTargetsResult = mapResults((spec.extraModels ?? []).map((m) => resolveExtraModel(spec, m)));
  if (extraTargetsResult.isFailure()) {
    return fail(`${spec.providerId} tier canary: ${extraTargetsResult.message}`);
  }
  const extraTargets = extraTargetsResult.value;
  for (const t of extraTargets) {
    logger.info(`resolved ${t.label} -> ${t.concrete} (modelOverride)`);
  }
  const targets = allTargets(resolutions, extraTargets);

  const thinking = await runThinkingProbes(spec, targets, deps);
  const strictNone = await runStrictNoneProbes(spec, targets, deps);
  const extraModels = await runExtraModelProbes(extraTargets, deps);
  const temperature = await runTemperatureProbes(spec, targets, deps);
  const maxOutput = await runMaxOutputProbes(spec, targets, deps);
  const structured = await runStructuredOutputProbes(spec, targets, deps);
  const explicitLevel = await runExplicitLevelProbes(spec, targets, deps);
  const image: ICanaryProbeResult[] = [];
  if (spec.liveImage && imageResolution) {
    image.push(
      deps.generateImage === undefined
        ? { label: 'image', concrete: imageResolution.concrete, outcome: 'not-run' }
        : imageProbe(imageResolution.concrete, await deps.generateImage())
    );
  }
  const probes: ICanaryProbeResults = {
    thinking,
    strictNone,
    extraModels,
    temperature,
    maxOutput,
    structured,
    explicitLevel,
    image
  };

  const report = formatTierCanaryReport(spec, liveResults, imageResolution, probes);

  // Verdict: a stale id (`id-wrong`), a non-chat-callable id (`wrong-endpoint`), a rejected thinking
  // config (`param-failed`), or a plain `error` — on a tier or on any probe — fails the run.
  // `access-gated` / `param-rejected` (resolver + id correct; access or a completion-path parameter
  // is the blocker), `not-run` (STOP-FLAG: pending the keyed run), the expected outcomes
  // `refused-locally`, `expected-reject` and `no-recorded-limit`, and the report-only `observed` do not.
  const realFailure = [
    ...liveResults,
    ...thinking,
    ...strictNone,
    ...extraModels,
    ...temperature,
    ...maxOutput,
    ...structured,
    ...explicitLevel,
    ...image
  ].some((r) => isRealFailure(r.outcome));
  return realFailure ? fail(report) : succeed(report);
}
