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
 * (`openai-model-tiers`, `anthropic-model-tiers`, `gemini-model-tiers`).
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
 *
 * The verdict deliberately distinguishes a **resolver bug or stale id** (a real failure) from
 * **access-gating** (resolver correct, the key simply lacks access — e.g. `gpt-image-1.5`
 * org-verification or `gpt-5.5-pro` frontier gating). An access-gated tier is surfaced as
 * `BLOCKED`, not a failure of the resolver work.
 *
 * @packageDocumentation
 */

import { fail, mapResults, succeed } from '@fgv/ts-utils';
import type { Logging, Result } from '@fgv/ts-utils';
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
  /** Resolver correct, but the key lacks access (401/403/verification) — canary-blocked, not a failure. */
  | 'access-gated'
  /** HTTP 404 / unknown-model: the alias value is stale — the maintenance-loop trigger, a real failure. */
  | 'id-wrong'
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
  /** Free-text detail (e.g. the underlying failure message) for `access-gated` / `id-wrong` / `error`. */
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
 * Injected dependencies for {@link runTierCanary}. The single live seam is `complete`; omit it to
 * run the offline resolver proof only (the keyless STOP-FLAG path).
 * @public
 */
export interface ITierCanaryDeps {
  /**
   * Fires a minimal live completion at the given tier. Omit (leave `undefined`) when no API key is
   * available — every tier is then reported `not-run`.
   */
  readonly complete?: (tier: CanaryTier) => Promise<Result<AiAssist.IAiCompletionResponse>>;
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
  /** When true, also resolve + log the `image` tier (OpenAI's `@openai:image → gpt-image-1.5`). */
  readonly imageTier?: boolean;
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
 * Classifies a live-completion failure message into a {@link TierLiveOutcome}. An auth/verification
 * status (401/403 or a "verif…" message) is `access-gated` (resolver correct, key lacks access);
 * a 404 / unknown-model is `id-wrong` (the alias value is stale); anything else is `error`.
 * @public
 */
export function classifyLiveFailure(message: string): TierLiveOutcome {
  const statusMatch = message.match(/returned (\d{3})/);
  const status = statusMatch ? Number(statusMatch[1]) : undefined;
  if (status === 401 || status === 403 || /verif/i.test(message)) {
    return 'access-gated';
  }
  if (status === 404 || /model[^a-z]*not[^a-z]*found|not_found|does not exist|unknown model/i.test(message)) {
    return 'id-wrong';
  }
  return 'error';
}

/** Maps a {@link TierLiveOutcome} to the bracketed status tag used in the report. */
function liveTag(outcome: TierLiveOutcome): string {
  switch (outcome) {
    case 'live-pass':
      return 'PASS';
    case 'access-gated':
      return 'BLOCKED';
    case 'id-wrong':
      return 'FAIL(id)';
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
  imageResolution?: IImageResolution
): string {
  const anyRealFailure = liveResults.some((r) => r.outcome === 'id-wrong' || r.outcome === 'error');
  const anyNotRun = liveResults.some((r) => r.outcome === 'not-run');
  const anyBlocked = liveResults.some((r) => r.outcome === 'access-gated');

  const verdict = anyRealFailure
    ? 'FAILED — resolver bug or stale id (see FAIL lines below)'
    : anyNotRun
    ? 'RESOLVER-VERIFIED; LIVE CANARY PENDING (STOP-FLAG: set the provider API key to run the keyed gate)'
    : anyBlocked
    ? 'RESOLVER-VERIFIED; LIVE PARTIAL (one or more tiers access-gated — surfaced as BLOCKED, not a failure)'
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

  return [
    `=== ${spec.providerId} model-tier canary ===`,
    '',
    'Resolver proof (offline, deterministic — alias -> concrete id):',
    ...resolverLines,
    '',
    'Live canary (minimal completion per tier):',
    ...liveLines,
    '',
    `Verdict: ${verdict}`
  ].join('\n');
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

  // Optional image-tier resolution (OpenAI only) — offline resolve + log, no live image call
  // (image generation is a separate call path; its live gate is the orchestrator's, and
  // `gpt-image-1.5` is an org-verification access risk called out in the design's Q8).
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

  const report = formatTierCanaryReport(spec, liveResults, imageResolution);

  // Verdict: a stale id (`id-wrong`) or a plain `error` fails the run; `access-gated` (resolver
  // correct, key lacks access) and `not-run` (STOP-FLAG: pending the keyed run) do not.
  const realFailure = liveResults.some((r) => r.outcome === 'id-wrong' || r.outcome === 'error');
  return realFailure ? fail(report) : succeed(report);
}
