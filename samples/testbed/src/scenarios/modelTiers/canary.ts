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
 *    - thinking probes: one completion per tier and effort (`thinkingEfforts`)
 *    - strict-none probes: `'none'` plus `onUnsupported: 'fail'`, checked against
 *      `thinkingRequiredModelPrefixes` (`strictNoneProbe`). On a listed model, a second, raw
 *      `'none'` bypasses the library gate, so the provider's own rejection keeps the listing
 *      honest in the other direction.
 *    - model-override rows for aliases no tier reaches (`extraModels`)
 *    - structured-output probes: a schema-mode completion per tier and extra model with
 *      `onUnsupported: 'fail'` (`structuredOutputProbe`), checked against the registry's declared
 *      format — the reported enforcement must match it and the reply must satisfy the schema
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
  /** Send this `structuredOutput` request (a structured-output probe). */
  readonly structuredOutput?: AiAssist.StructuredOutputRequest;
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
  readonly structured: ReadonlyArray<ICanaryProbeResult>;
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
   * Thinking efforts to probe on every tier, one extra live completion per (tier, effort). Catches
   * an effort the resolved model rejects (e.g. `'none'` on a model whose effort floor is `low`).
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
   * When true, probe every tier with `effort: 'none'` + `onUnsupported: 'fail'`. The expectation
   * comes from the registry: a model listed in `thinkingRequiredModelPrefixes` must be refused
   * locally, and any other model must answer live. A mismatch either way means the list is wrong.
   */
  readonly strictNoneProbe?: boolean;
  /**
   * When true, fire one schema-mode structured-output completion (`onUnsupported: 'fail'`) per
   * tier and per extra model. The expectation comes from the registry: the response must report
   * the enforcement the model's declared format implies, and its content must satisfy
   * {@link CANARY_STRUCTURED_SCHEMA}. A provider 400 is `FAIL(param)` — the declared format is
   * one the model rejects.
   */
  readonly structuredOutputProbe?: boolean;
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
    ? [...probes.thinking, ...probes.strictNone, ...probes.extraModels, ...probes.structured, ...probes.image]
    : [];
  const outcomes = [...liveResults.map((r) => r.outcome), ...probeResults.map((r) => r.outcome)];
  const anyTierFailure = liveResults.some((r) => isRealFailure(r.outcome));
  const anyProbeFailure = probeResults.some((r) => isRealFailure(r.outcome));
  const anyNotRun = outcomes.some((o) => o === 'not-run');
  const anyBlocked = outcomes.some((o) => o === 'access-gated' || o === 'param-rejected');

  const verdict = anyTierFailure
    ? 'FAILED — a tier is not chat-completions-callable (wrong endpoint) or resolves to a stale id (see FAIL lines below)'
    : anyProbeFailure
    ? 'FAILED — a thinking, strict-none, model-override, structured-output or image probe failed (see FAIL lines below)'
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
            return `  [${liveTag(r.outcome)}] ${r.label.padEnd(24)} ${r.concrete}${detail}`;
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
    ...probeSection("Structured-output probes (schema, onUnsupported 'fail'):", probes?.structured ?? []),
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

/** Runs the thinking probes: one live completion per (tier, effort). */
async function runThinkingProbes(
  spec: ITierCanarySpec,
  resolutions: ReadonlyArray<ITierResolution>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  for (const resolution of resolutions) {
    for (const effort of spec.thinkingEfforts ?? []) {
      const label = `${resolution.tier} effort=${effort}`;
      if (deps.complete === undefined) {
        rows.push({ label, concrete: resolution.concrete, outcome: 'not-run' });
        continue;
      }
      const result = await deps.complete(resolution.tier, { effort });
      rows.push(completionProbe(label, resolution.concrete, result, classifyThinkingFailure));
    }
  }
  return rows;
}

/** The library's local refusal for `'none'` + `onUnsupported: 'fail'` on a thinking-required model. */
const LOCAL_NONE_REFUSAL: RegExp = /thinking effort 'none' is not supported by/;

/** Classifies one strict-none probe against the registry's expectation for that model. */
function strictNoneProbe(
  label: string,
  concrete: string,
  listed: boolean,
  result: Result<AiAssist.IAiCompletionResponse>
): ICanaryProbeResult {
  if (listed) {
    if (result.isFailure() && LOCAL_NONE_REFUSAL.test(result.message)) {
      return { label, concrete, outcome: 'live-pass', detail: 'refused locally, as listed' };
    }
    return result.isSuccess()
      ? {
          label,
          concrete,
          outcome: 'error',
          detail: 'listed as thinking-required, but the call went through'
        }
      : {
          label,
          concrete,
          outcome: 'error',
          detail: `listed as thinking-required, but not refused locally: ${result.message}`
        };
  }
  return completionProbe(label, concrete, result, classifyThinkingFailure);
}

/** Runs the strict-none probes: one `none` + `onUnsupported: 'fail'` completion per tier. */
async function runStrictNoneProbes(
  spec: ITierCanarySpec,
  resolutions: ReadonlyArray<ITierResolution>,
  deps: ITierCanaryDeps
): Promise<ICanaryProbeResult[]> {
  const rows: ICanaryProbeResult[] = [];
  if (!spec.strictNoneProbe) {
    return rows;
  }
  for (const resolution of resolutions) {
    const label = `${resolution.tier} none+fail`;
    const listed = AiAssist.isThinkingRequiredModel(spec.descriptor, resolution.concrete);
    if (deps.complete === undefined) {
      rows.push({ label, concrete: resolution.concrete, outcome: 'not-run' });
      if (listed) {
        rows.push({
          label: `${resolution.tier} none raw`,
          concrete: resolution.concrete,
          outcome: 'not-run'
        });
      }
      continue;
    }
    const result = await deps.complete(resolution.tier, { effort: 'none', onUnsupported: 'fail' });
    rows.push(strictNoneProbe(label, resolution.concrete, listed, result));
    if (listed) {
      // The local refusal above never reaches the provider, so it cannot notice a provider that
      // has started accepting 'none'. Ask the provider directly, bypassing the gate.
      const raw = await deps.complete(resolution.tier, { rawNone: true });
      rows.push(rawNoneProbe(`${resolution.tier} none raw`, resolution.concrete, raw));
    }
  }
  return rows;
}

/**
 * Classifies a raw-`none` probe on a listed model. A provider 400 (or rejected-parameter message)
 * is the expected answer and passes: the listing is still needed. A success fails: the provider now
 * accepts `'none'` and the `thinkingRequiredModelPrefixes` entry is stale.
 */
function rawNoneProbe(
  label: string,
  concrete: string,
  result: Result<AiAssist.IAiCompletionResponse>
): ICanaryProbeResult {
  if (result.isSuccess()) {
    return {
      label,
      concrete,
      outcome: 'error',
      detail: 'the provider accepted none; the thinking-required listing is stale'
    };
  }
  const outcome = classifyThinkingFailure(result.message);
  return outcome === 'param-failed'
    ? { label, concrete, outcome: 'live-pass', detail: 'the provider still rejects none, as listed' }
    : { label, concrete, outcome, detail: result.message };
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
  resolutions: ReadonlyArray<ITierResolution>,
  extraModels: ReadonlyArray<ICanaryProbeResult>,
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
  // Extra models reuse the model-override rows' already-resolved ids; each row's label is the
  // model string it was resolved from.
  const targets: Array<{ label: string; concrete: string; tier: CanaryTier; modelOverride?: string }> = [
    ...resolutions.map((r) => ({ label: `${r.tier} schema`, concrete: r.concrete, tier: r.tier })),
    ...extraModels.map((r) => ({
      label: `${r.label} schema`,
      concrete: r.concrete,
      tier: 'base' as const,
      modelOverride: r.label
    }))
  ];
  for (const target of targets) {
    if (deps.complete === undefined) {
      rows.push({ label: target.label, concrete: target.concrete, outcome: 'not-run' });
      continue;
    }
    const result = await deps.complete(target.tier, {
      structuredOutput,
      ...(target.modelOverride !== undefined ? { modelOverride: target.modelOverride } : {})
    });
    rows.push(
      classifyStructuredProbe(
        target.label,
        target.concrete,
        expectedStructuredEnforcement(spec.descriptor, target.concrete),
        result
      )
    );
  }
  return rows;
}

/** Resolves (offline) and fires (live) each extra model via `modelOverride`. */
async function runExtraModelProbes(
  spec: ITierCanarySpec,
  deps: ITierCanaryDeps,
  logger: Logging.ILogger
): Promise<Result<ICanaryProbeResult[]>> {
  const rows: ICanaryProbeResult[] = [];
  for (const model of spec.extraModels ?? []) {
    const concreteResult = AiAssist.resolveProviderModel(spec.descriptor, model, undefined);
    if (concreteResult.isFailure()) {
      return fail(`model override '${model}': resolver failed: ${concreteResult.message}`);
    }
    const concrete = concreteResult.value;
    logger.info(`resolved ${model} -> ${concrete} (modelOverride)`);
    if (deps.complete === undefined) {
      rows.push({ label: model, concrete, outcome: 'not-run' });
      continue;
    }
    const result = await deps.complete('base', { modelOverride: model });
    rows.push(completionProbe(model, concrete, result, classifyLiveFailure));
  }
  return succeed(rows);
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

  const thinking = await runThinkingProbes(spec, resolutions, deps);
  const strictNone = await runStrictNoneProbes(spec, resolutions, deps);
  const extraModelsResult = await runExtraModelProbes(spec, deps, logger);
  if (extraModelsResult.isFailure()) {
    return fail(`${spec.providerId} tier canary: ${extraModelsResult.message}`);
  }
  const structured = await runStructuredOutputProbes(spec, resolutions, extraModelsResult.value, deps);
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
    extraModels: extraModelsResult.value,
    structured,
    image
  };

  const report = formatTierCanaryReport(spec, liveResults, imageResolution, probes);

  // Verdict: a stale id (`id-wrong`), a non-chat-callable id (`wrong-endpoint`), a rejected thinking
  // config (`param-failed`), or a plain `error` — on a tier or on any probe — fails the run.
  // `access-gated` / `param-rejected` (resolver + id correct; access or a completion-path parameter
  // is the blocker) and `not-run` (STOP-FLAG: pending the keyed run) do not.
  const realFailure = [
    ...liveResults,
    ...thinking,
    ...strictNone,
    ...probes.extraModels,
    ...structured,
    ...image
  ].some((r) => isRealFailure(r.outcome));
  return realFailure ? fail(report) : succeed(report);
}
