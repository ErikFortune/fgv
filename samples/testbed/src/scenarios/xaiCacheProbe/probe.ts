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
 * xAI prompt-cache wire probe — settles **OQ-1** of the `ai-assist-prompt-caching` design.
 *
 * ## The question
 *
 * `ai-assist` reaches xAI over the **OpenAI-compatible** path (`registry.ts`: `xai-grok` is
 * `apiFormat: 'openai'`, `baseUrl: https://api.x.ai/v1`), so the `cached_prompt_text_tokens`
 * field that phase-A research confirmed in xAI's own gRPC protos is for a wire this repo
 * never speaks. Two things are unknown, and both gate the `reports` level for `xai-grok` in
 * the design's §8 normalization table:
 *
 * 1. Does `POST {baseUrl}/responses` exist at all? A tools-bearing request routes there
 *    (`completionClient.ts`: `usesResponsesApi = apiFormat === 'openai' && (hasTools || …)`).
 * 2. What does each route's `usage` block call cached tokens — if it reports them at all?
 *
 * ## Why this is name-agnostic, and why that is the point
 *
 * The obvious probe asks "is `usage.prompt_tokens_details.cached_tokens` present?" — which
 * can only confirm a guess, and reports a false negative if xAI spells it differently. This
 * scenario instead sends the **same byte-identical request twice** and **diffs the two usage
 * blocks**. A cached-token field is one that is absent-or-zero on the cold call and positive
 * on the warm one, so the diff *names the field for us* whatever xAI chose to call it. The
 * flattened key list is reported either way, so even a run with no cache hit still records
 * the usage schema — a negative result here is a real result, not a failed run.
 *
 * ## Reading the output
 *
 * | outcome | means |
 * |---|---|
 * | route reports HTTP 404 | that endpoint does not exist on xAI; settles (1) for that route |
 * | keys listed, none changed | route works, but no cache hit — see "no hit" below |
 * | a key went 0 → positive | **that is the field**; record it in the design's §8 table |
 *
 * A "no hit" outcome is ambiguous between *xAI does not cache* and *the prompt was under an
 * unverified minimum*, so the filler below is deliberately large. If a run reports no hit,
 * raise `FILLER_PARAGRAPHS` and re-run before concluding anything — and record the size that
 * failed, because that is itself a bound on the threshold.
 *
 * Requires a live xAI key (CLI: `XAI_API_KEY`; web: the Secrets panel). Costs two small
 * completions per route — four total, at `max_tokens: 1`, on the cheap model line.
 *
 * @packageDocumentation
 */

import { captureResult, fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import type { JsonObject, JsonValue } from '@fgv/ts-json-base';

import type { IScenarioContext } from '../../shell';
import { resolveProviderApiKey } from '../aiProviderSecrets';

// ---------------------------------------------------------------------------
// The stable prefix
// ---------------------------------------------------------------------------

/**
 * Paragraphs of deterministic filler. **Deterministic, not random** — the whole probe rests
 * on the two calls being byte-identical, so a `ts-random` corpus seeded per-call (or any
 * timestamp) would silently guarantee a miss and the run would look like "xAI does not
 * cache".
 */
const FILLER_PARAGRAPHS: number = 60;

/**
 * Builds the stable prefix. Every provider that caches rewards a large, byte-identical
 * prefix; this is sized well above Anthropic's largest known minimum (4096 tokens on Opus
 * 4.6 / Haiku 4.5) because xAI's own minimum is unverified and undershooting it produces a
 * false negative that reads exactly like "no caching".
 */
function buildStablePrefix(): string {
  const paragraphs: string[] = [];
  for (let i = 0; i < FILLER_PARAGRAPHS; i++) {
    paragraphs.push(
      `Section ${i}. This paragraph exists to occupy prompt tokens in a byte-identical, ` +
        `deterministic way across repeated requests, so that a provider-side prompt cache has ` +
        `a stable prefix to match on. It carries no meaning and asks for nothing. The index ` +
        `${i} makes each paragraph distinct so the text does not compress into a trivial ` +
        `repetition that a tokenizer might collapse.`
    );
  }
  return paragraphs.join('\n\n');
}

// ---------------------------------------------------------------------------
// Usage-block flattening and diffing
// ---------------------------------------------------------------------------

/**
 * Flattens a usage object to `dotted.path -> number`, keeping only numeric leaves. The
 * cached-token field sits one level down on the OpenAI-compatible shape
 * (`prompt_tokens_details.cached_tokens`), and we cannot assume xAI nests it the same way —
 * so flatten rather than probe a path.
 */
function flattenNumbers(value: JsonValue, prefix: string = ''): ReadonlyMap<string, number> {
  const out: Map<string, number> = new Map();
  if (typeof value === 'number') {
    out.set(prefix, value);
    return out;
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return out;
  }
  for (const [key, child] of Object.entries(value)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    for (const [k, v] of flattenNumbers(child, path)) {
      out.set(k, v);
    }
  }
  return out;
}

/** One field whose value differed between the cold and warm calls. @public */
export interface IUsageDelta {
  readonly path: string;
  readonly cold: number | undefined;
  readonly warm: number | undefined;
}

/**
 * Fields that differ between two usage blocks. A field that is absent-or-zero cold and
 * positive warm is the cached-token field; a field that merely wobbles (output tokens, a
 * total) is noise and is reported so the reader can discount it rather than being hidden.
 */
function diffUsage(
  cold: ReadonlyMap<string, number>,
  warm: ReadonlyMap<string, number>
): ReadonlyArray<IUsageDelta> {
  const paths = new Set<string>([...cold.keys(), ...warm.keys()]);
  const deltas: IUsageDelta[] = [];
  for (const path of [...paths].sort()) {
    const c = cold.get(path);
    const w = warm.get(path);
    if (c !== w) {
      deltas.push({ path, cold: c, warm: w });
    }
  }
  return deltas;
}

/**
 * A delta that looks like a cache read: something warm, nothing cold.
 *
 * @remarks
 * Ordered warm-first deliberately. Both operands are pure so the order does not change the
 * answer, but `cold`-first short-circuits before `warm` is ever read on a field that vanished
 * between calls — leaving a branch that no honest test can reach, since a delta with both
 * sides absent is never produced. Warm-first makes every branch reachable from real cases.
 */
function looksLikeCacheRead(delta: IUsageDelta): boolean {
  return (delta.warm ?? 0) > 0 && (delta.cold ?? 0) === 0;
}

// ---------------------------------------------------------------------------
// The two routes
// ---------------------------------------------------------------------------

interface IRouteProbe {
  /** Path appended to the provider's `baseUrl`. */
  readonly path: string;
  /** Human label for the report. */
  readonly label: string;
  /** Why `ai-assist` would ever post here. */
  readonly why: string;
  /** Builds the request body for this route's wire shape. */
  readonly body: (model: string, prefix: string) => JsonObject;
}

/**
 * Wire field names, as computed keys.
 *
 * @remarks
 * These are snake_case because the wire is, and the repo's lint profile rejects snake_case
 * object-literal property names. `ai-assist` solves this the same way: `completionClient.ts`
 * selects its token-limit field into a `maxTokensField` variable and assigns through it, so a
 * computed key is the house pattern here rather than an inline rule disable.
 */
const WIRE_MAX_TOKENS: string = 'max_tokens';
const WIRE_MAX_OUTPUT_TOKENS: string = 'max_output_tokens';

/** The prompt is irrelevant; only the usage block matters, so ask for as little as possible. */
const TRIVIAL_QUESTION: string = 'Reply with the single character: x';

const ROUTES: ReadonlyArray<IRouteProbe> = [
  {
    path: '/chat/completions',
    label: 'Chat Completions',
    why: 'the route a tools-free request takes',
    body: (model, prefix) => ({
      model,
      [WIRE_MAX_TOKENS]: 1,
      messages: [
        { role: 'system', content: prefix },
        { role: 'user', content: TRIVIAL_QUESTION }
      ]
    })
  },
  {
    path: '/responses',
    label: 'Responses',
    why: 'the route a tools-bearing request takes — existence is half of OQ-1',
    body: (model, prefix) => ({
      model,
      [WIRE_MAX_OUTPUT_TOKENS]: 16,
      input: [
        { role: 'system', content: prefix },
        { role: 'user', content: TRIVIAL_QUESTION }
      ]
    })
  }
];

/** Outcome of probing one route. @public */
export interface IRouteResult {
  readonly label: string;
  /** Absent when the route answered; present when it did not. */
  readonly unreachable?: string;
  readonly usageKeys: ReadonlyArray<string>;
  readonly deltas: ReadonlyArray<IUsageDelta>;
  readonly cacheReadFields: ReadonlyArray<string>;
  readonly rawCold?: JsonValue;
  readonly rawWarm?: JsonValue;
}

/**
 * Injected seams. The probe's value is its **report**, and a report that has never been
 * exercised against a known-shaped usage block is an untested artifact — so the network call
 * and the inter-call pause are both injectable, letting the diff-and-render logic be driven
 * over synthetic usage blocks without a live key. Mirrors `mcpProbe`'s `IMcpProbeDeps`.
 * @public
 */
export interface IXaiCacheProbeDeps {
  /** POSTs a JSON body and returns the parsed response. */
  readonly postJson: (url: string, apiKey: string, body: JsonObject) => Promise<Result<JsonValue>>;
  /** Pause between the cold and warm calls, in milliseconds. */
  readonly delayMs: number;
}

/**
 * Posts one JSON body and returns the parsed response. Uses the repo's own `saferFetchJson`
 * rather than bare `fetch` per the testbed's first tenet; `allowAnyAddress` is correct here
 * because the address is the registry's own provider `baseUrl`, not caller-supplied input,
 * and blocking private networks would only matter for a URL we did not choose.
 */

/** Pulls the `usage` member out of a provider response, if there is one. */
function usageOf(response: JsonValue): JsonValue {
  if (response !== null && typeof response === 'object' && !Array.isArray(response)) {
    return response.usage ?? null;
  }
  return null;
}

async function probeRoute(
  route: IRouteProbe,
  baseUrl: string,
  model: string,
  apiKey: string,
  prefix: string,
  context: IScenarioContext,
  deps: IXaiCacheProbeDeps
): Promise<IRouteResult> {
  const url = `${baseUrl}${route.path}`;
  const body = route.body(model, prefix);
  context.logger.info(`[${route.label}] POST ${url} (${route.why})`);

  const cold = await deps.postJson(url, apiKey, body);
  if (cold.isFailure()) {
    // A failure here is a finding, not an error: a 404 on /responses settles half of OQ-1.
    context.logger.info(`[${route.label}] unreachable: ${cold.message}`);
    return {
      label: route.label,
      unreachable: cold.message,
      usageKeys: [],
      deltas: [],
      cacheReadFields: []
    };
  }

  // The warm call must be byte-identical and prompt — every provider's shortest documented
  // TTL is minutes, so a short pause is ample and keeps the probe quick.
  await new Promise<void>((resolve) => setTimeout(resolve, deps.delayMs));

  const warm = await deps.postJson(url, apiKey, body);
  if (warm.isFailure()) {
    context.logger.info(`[${route.label}] warm call failed: ${warm.message}`);
    return {
      label: route.label,
      unreachable: `warm call failed: ${warm.message}`,
      usageKeys: [],
      deltas: [],
      cacheReadFields: [],
      rawCold: usageOf(cold.value)
    };
  }

  const coldUsage = usageOf(cold.value);
  const warmUsage = usageOf(warm.value);
  const coldFlat = flattenNumbers(coldUsage);
  const warmFlat = flattenNumbers(warmUsage);
  const deltas = diffUsage(coldFlat, warmFlat);

  return {
    label: route.label,
    usageKeys: [...new Set([...coldFlat.keys(), ...warmFlat.keys()])].sort(),
    deltas,
    cacheReadFields: deltas.filter(looksLikeCacheRead).map((d) => d.path),
    rawCold: coldUsage,
    rawWarm: warmUsage
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

/**
 * Renders the durable record. This is the artifact the run exists to produce — it is meant to
 * be pasted verbatim into the stream's `result.md`, so it states the negative cases explicitly
 * rather than leaving them as an absence the reader has to notice.
 */
export function formatXaiCacheProbeReport(model: string, results: ReadonlyArray<IRouteResult>): string {
  const lines: string[] = [
    '=== xAI prompt-cache wire probe (OQ-1) ===',
    `model: ${model}`,
    `stable prefix: ${FILLER_PARAGRAPHS} paragraphs`,
    ''
  ];

  for (const r of results) {
    lines.push(`--- ${r.label} ---`);
    if (r.unreachable !== undefined) {
      lines.push(`  UNREACHABLE: ${r.unreachable}`);
      lines.push('');
      continue;
    }
    lines.push(
      r.usageKeys.length > 0
        ? `  usage numeric keys: ${r.usageKeys.join(', ')}`
        : '  usage block absent or carried no numeric fields'
    );
    if (r.deltas.length === 0) {
      lines.push('  NO FIELDS CHANGED between cold and warm — no cache hit observed.');
      lines.push('    Ambiguous: xAI may not cache, or the prefix may be under its minimum.');
      lines.push('    Raise FILLER_PARAGRAPHS and re-run before concluding; record the size that failed.');
    } else {
      for (const d of r.deltas) {
        const flag = looksLikeCacheRead(d) ? '  <== CACHE READ' : '';
        lines.push(`  ${d.path}: cold=${d.cold ?? '-'} warm=${d.warm ?? '-'}${flag}`);
      }
    }
    if (r.cacheReadFields.length > 0) {
      lines.push(`  CACHED-TOKEN FIELD: ${r.cacheReadFields.join(', ')}`);
    }
    lines.push(`  raw cold usage: ${JSON.stringify(r.rawCold)}`);
    lines.push(`  raw warm usage: ${JSON.stringify(r.rawWarm)}`);
    lines.push('');
  }

  // Deliberately lower-case: 'CACHED-TOKEN FIELD' is the marker a reader greps this report
  // for, so the closing instruction must not collide with it.
  lines.push('Record the cached-token field rows (or their absence) in');
  lines.push('.ai/tasks/active/ai-assist-prompt-caching/design.md §8, and close OQ-1.');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

/**
 * Runs the probe against both routes and returns the report.
 * @public
 */
export async function runXaiCacheProbe(
  context: IScenarioContext,
  deps: IXaiCacheProbeDeps,
  providerId: AiAssist.AiProviderId = 'xai-grok'
): Promise<Result<string>> {
  const keyResult = await resolveProviderApiKey(context, providerId);
  if (keyResult.isFailure()) {
    return fail(`${providerId} API key unavailable: ${keyResult.message}`);
  }

  // Descriptor + concrete model in one chain. Resolving the tier alias matters: passing an
  // alias to a wire call is the defect `resolveImageCapability` once had, and the registry's
  // own comment names it.
  const setup = AiAssist.getProviderDescriptor(providerId)
    .onSuccess((descriptor) =>
      AiAssist.resolveProviderModel(descriptor, undefined, 'base').onSuccess((model) =>
        succeed({ descriptor, model })
      )
    )
    .withErrorFormat((message) => `${providerId} registry lookup: ${message}`);
  if (setup.isFailure()) {
    return fail(setup.message);
  }
  const { descriptor, model } = setup.value;

  const prefix = buildStablePrefix();
  const results: IRouteResult[] = [];
  for (const route of ROUTES) {
    results.push(await probeRoute(route, descriptor.baseUrl, model, keyResult.value, prefix, context, deps));
  }

  const report = formatXaiCacheProbeReport(model, results);
  context.logger.info(report);

  return captureResult(() => report);
}
