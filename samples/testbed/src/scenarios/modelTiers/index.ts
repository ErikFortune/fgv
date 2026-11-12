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
 * Per-provider model-tier canary scenarios (`openai-model-tiers`, `anthropic-model-tiers`,
 * `google-gemini-model-tiers`, `xai-grok-model-tiers`). Each resolves its provider's
 * `base` / `advanced` / `frontier` tiers,
 * logs the `alias -> concrete` hop (matching the shipped `@google-gemini:flash -> …` line), and —
 * when the provider API key is present — fires a minimal live completion per tier to prove the id
 * answers. Without a key the run is the STOP-FLAG state: resolver verified, live canary pending the
 * orchestrator's keyed gate.
 *
 * The canary logic lives in the sibling `canary` module; these wrappers only build the spec and
 * (when a key resolves) the live-completion seam. Web-runnable (Phase B) via the shell's generic
 * runner panel — the API key is resolved through `context.resolveSecret` (KeyStore → session
 * secrets store → env var), which works identically on the CLI and in the browser.
 *
 * @packageDocumentation
 */

import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import type { ISecretSpec, IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';
import {
  type CanaryThinkingEffort,
  type CanaryTier,
  type ICanaryCompleteOptions,
  type ICanaryTemperatureProbe,
  type ITierCanaryDeps,
  type ITierCanarySpec,
  runTierCanary
} from './canary';

/** Minimal prompt used for the per-tier live completion — kept tiny to minimise token cost. */
const CANARY_PROMPT: string = 'Reply with the single word: pong.';

/** Minimal prompt for the live image probe. */
const IMAGE_PROMPT: string = 'A single red circle on a white background.';

/**
 * Thinking efforts probed on every tier of the rotated providers. `'none'` is the value most
 * likely to be refused (the 2026-09 rotation's `gpt-6-astra` documents no off level); `'low'` is
 * the control that shows thinking itself is accepted.
 */
const THINKING_PROBE_EFFORTS: ReadonlyArray<CanaryThinkingEffort> = ['none', 'low'];

/**
 * Anthropic temperature probes, on every tier and extra model. Every Claude 5.x model rejects a
 * *non-default* temperature with or without thinking, and ai-assist pins an API version under which
 * the default, 1, is still accepted (`samplingParamsAcceptedTemperature`). So 1 must answer with
 * and without thinking, and 0.3 must be refused before anything is sent.
 */
const ANTHROPIC_TEMPERATURE_PROBES: ReadonlyArray<ICanaryTemperatureProbe> = [
  { temperature: 1, expect: 'accepted' },
  { temperature: 1, effort: 'low', expect: 'accepted' },
  { temperature: 0.3, expect: 'refused-locally' }
];

/**
 * OpenAI temperature probes. GPT-6 accepts a non-default `temperature` only when reasoning effort
 * is `'none'`. `gpt-6-luna` (base) has a `'none'` effort but defaults to `medium`; it is on
 * `samplingParamsRejectedWithThinkingModelPrefixes`, so a temperature with effort `'none'` answers,
 * its default, 1, answers with no effort and beside an effort (live, 2026-11-11), and 0.3 beside an
 * effort or with no effort is refused before the wire. `gpt-6.1-sol` and `gpt-6-astra` have no `'none'`: they accept
 * their default, 1, with and without an effort (live, 2026-11-10;
 * `samplingParamsAcceptedTemperature`), and the library refuses any other value before the wire.
 *
 * One luna row still sends 0.3 beside effort `low` raw, past the library's gate, and expects the
 * provider's own rejection: it keeps the rule the local refusal stands in for visible, and fails if
 * the provider ever starts accepting the value.
 */
const OPENAI_TEMPERATURE_PROBES: ReadonlyArray<ICanaryTemperatureProbe> = [
  { temperature: 0.3, effort: 'none', models: ['gpt-6-luna'], expect: 'accepted' },
  { temperature: 1, models: ['gpt-6-luna'], expect: 'accepted' },
  { temperature: 0.3, models: ['gpt-6-luna'], expect: 'refused-locally' },
  { temperature: 1, effort: 'low', models: ['gpt-6-luna'], expect: 'accepted' },
  { temperature: 0.3, effort: 'low', models: ['gpt-6-luna'], expect: 'refused-locally' },
  {
    temperature: 0.3,
    effort: 'low',
    models: ['gpt-6-luna'],
    raw: true,
    expect: 'expected-reject',
    rejectPattern: /only the default \(1\) value is supported/i
  },
  { temperature: 1, models: ['gpt-6.1-sol', 'gpt-6-astra'], expect: 'accepted' },
  { temperature: 1, effort: 'low', models: ['gpt-6.1-sol', 'gpt-6-astra'], expect: 'accepted' },
  { temperature: 0.3, models: ['gpt-6.1-sol', 'gpt-6-astra'], expect: 'refused-locally' }
];

/**
 * Resolves the provider's API key via `context.resolveSecret`, trying each of the scenario's
 * `requiredSecrets` in order (first success wins). Uses the shared KeyStore/session-store/
 * env-var resolution chain, so the scenario works identically on the CLI and the web runner
 * panel (Phase B) — unlike a direct `process.env` read, which browsers have no equivalent of.
 */
export async function resolveTierApiKey(
  context: IScenarioContext,
  specs: ReadonlyArray<ISecretSpec>
): Promise<string | undefined> {
  for (const spec of specs) {
    const result = await context.resolveSecret(spec);
    if (result.isSuccess()) {
      return result.value;
    }
  }
  return undefined;
}

/**
 * The explicit provider block that sends `concrete`'s default thinking-off value, bypassing the
 * library's `'none'` gate (an explicit block owns the wire). Used by the raw-`none` probe. Anthropic
 * has no typed off value, so its block is an `'other'` block carrying `thinking: { type: 'disabled' }`
 * for exactly that model — the provider's default off value, which a thinking-required model and a
 * model with its own off value (`between_tools` on `claude-sonnet-5-5`) both reject.
 * @public
 */
export function rawNoneBlock(
  descriptor: AiAssist.IAiProviderDescriptor,
  concrete: string
): Result<AiAssist.IThinkingProviderConfig> {
  switch (descriptor.id) {
    case 'openai':
      return succeed({ provider: 'openai', config: { effort: 'none' } });
    case 'xai-grok':
      return succeed({ provider: 'xai', config: { effort: 'none' } });
    case 'google-gemini':
      // A budget model's off value is budget 0. A level model's is 'minimal', which the library
      // refuses locally where the model does not declare it, so it travels in an 'other' block,
      // merged into generationConfig verbatim, for the provider itself to answer.
      if (AiAssist.resolveGeminiThinkingLevels(descriptor, concrete) !== undefined) {
        return succeed({
          provider: 'other',
          models: [concrete],
          config: { thinkingConfig: { thinkingLevel: 'minimal' } }
        });
      }
      return succeed({ provider: 'google', config: { thinkingBudget: 0 } });
    case 'anthropic':
      return succeed({ provider: 'other', models: [concrete], config: { thinking: { type: 'disabled' } } });
    default:
      // Sending no thinking config here would succeed and read as "the listing is stale".
      return fail(`${descriptor.id}: no raw 'none' block for this provider; add one to rawNoneBlock`);
  }
}

/**
 * The text each provider's rejection of its raw thinking-off value must match, so a `none raw` row
 * passes only on that rejection and not on a 400 for some other reason (a usage limit, say).
 * Anthropic's documented 400 for `disabled` on a model that rejects it names `thinking` and points
 * at `between_tools`; OpenAI's names `reasoning_effort`; Gemini's names the thinking budget.
 */
const RAW_NONE_REJECTIONS: Readonly<Record<string, RegExp>> = {
  anthropic: /thinking|disabled|between_tools/i,
  openai: /reasoning[_.]effort/i,
  'xai-grok': /reasoning|effort/i,
  'google-gemini': /budget|thinking/i
};

/**
 * Thinking efforts probed on every Gemini tier and extra model: `'none'` and `'low'` as elsewhere,
 * plus `'high'`, so each level model's top level is sent live too.
 */
const GEMINI_THINKING_PROBE_EFFORTS: ReadonlyArray<CanaryThinkingEffort> = ['none', 'low', 'high'];

/** The thinking config one canary request sends, or `undefined` for none. */
function canaryThinking(
  descriptor: AiAssist.IAiProviderDescriptor,
  tier: CanaryTier,
  options: ICanaryCompleteOptions
): Result<AiAssist.IThinkingConfig | undefined> {
  if (options.rawTemperature !== undefined) {
    const temperature = options.rawTemperature;
    return AiAssist.resolveProviderModel(
      descriptor,
      options.modelOverride,
      tier === 'base' ? undefined : tier
    ).onSuccess((concrete) =>
      succeed({
        ...(options.effort !== undefined ? { effort: options.effort } : {}),
        providers: [{ provider: 'other' as const, models: [concrete], config: { temperature } }]
      })
    );
  }
  if (options.thinkingLevel !== undefined) {
    return succeed({ providers: [{ provider: 'google', config: { thinkingLevel: options.thinkingLevel } }] });
  }
  if (options.rawNone === true) {
    return AiAssist.resolveProviderModel(
      descriptor,
      options.modelOverride,
      tier === 'base' ? undefined : tier
    )
      .onSuccess((concrete) => rawNoneBlock(descriptor, concrete))
      .onSuccess((block) => succeed({ providers: [block] }));
  }
  if (options.effort === undefined) {
    return succeed(undefined);
  }
  return succeed({
    effort: options.effort,
    ...(options.onUnsupported !== undefined ? { onUnsupported: options.onUnsupported } : {})
  });
}

/**
 * The exact `callProviderCompletion` parameters the live seam sends for one canary request: the
 * tiny prompt, the tier (`base` sent as `undefined`, as the completion path expects), and each
 * option the request sets. Pure — the live seam only adds the call — so the request a probe makes
 * is unit-tested here, including that a `refused-locally` request is refused before `fetch`.
 * @public
 */
export function buildCanaryCompletionParams(
  descriptor: AiAssist.IAiProviderDescriptor,
  apiKey: string,
  tier: CanaryTier,
  options: ICanaryCompleteOptions = {}
): Result<AiAssist.IProviderCompletionParams> {
  return canaryThinking(descriptor, tier, options).onSuccess((thinking) =>
    succeed({
      descriptor,
      apiKey,
      messages: [{ role: 'user', content: CANARY_PROMPT }],
      // The completion path takes `tier` verbatim (`undefined` = base).
      tier: tier === 'base' ? undefined : tier,
      ...(options.modelOverride !== undefined ? { modelOverride: options.modelOverride } : {}),
      ...(thinking !== undefined ? { thinking } : {}),
      ...(options.structuredOutput !== undefined ? { structuredOutput: options.structuredOutput } : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.maxTokens !== undefined ? { maxTokens: options.maxTokens } : {})
    })
  );
}

/**
 * Builds the live-completion seam for a provider: given an already-resolved `apiKey` (or
 * `undefined`), returns a `complete` callback that sends {@link buildCanaryCompletionParams}
 * through the real `callProviderCompletion`; returns `undefined` (→ the keyless STOP-FLAG
 * resolver-only path) when no key was resolved.
 *
 * The keyed path is unit-tested with a dummy key against a stubbed `fetch`
 * (`modelTiersRequests.test.ts`); only a live run shows what the provider itself answers.
 */
function buildLiveComplete(
  descriptor: AiAssist.IAiProviderDescriptor,
  apiKey: string | undefined
): ITierCanaryDeps['complete'] {
  if (apiKey === undefined) {
    return undefined;
  }
  const key = apiKey;
  return async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
    buildCanaryCompletionParams(descriptor, key, tier, options).thenOnSuccess((params) =>
      AiAssist.callProviderCompletion(params)
    );
}

/**
 * Builds the live image seam: one generation at the descriptor's `image` tier, with the given
 * quality when set. `undefined` when no key resolved (→ the probe reports `not-run`).
 */
function buildLiveImage(
  descriptor: AiAssist.IAiProviderDescriptor,
  apiKey: string | undefined,
  quality: AiAssist.AiImageQuality | undefined
): ITierCanaryDeps['generateImage'] {
  if (apiKey === undefined) {
    return undefined;
  }
  const key = apiKey;
  return () =>
    AiAssist.callProviderImageGeneration({
      descriptor,
      apiKey: key,
      params: { prompt: IMAGE_PROMPT, options: quality !== undefined ? { quality } : undefined }
    });
}
/** Parameters describing one provider's tier canary. */
interface ITierScenarioParams {
  readonly providerId: string;
  readonly title: string;
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
  readonly tiers: ReadonlyArray<CanaryTier>;
  readonly imageTier?: boolean;
  readonly thinkingEfforts?: ReadonlyArray<CanaryThinkingEffort>;
  readonly extraModels?: ReadonlyArray<string>;
  readonly strictNoneProbe?: boolean;
  readonly structuredOutputProbe?: boolean;
  readonly structuredOutputEfforts?: ReadonlyArray<CanaryThinkingEffort>;
  readonly explicitLevelProbe?: boolean;
  readonly temperatureProbes?: ReadonlyArray<ICanaryTemperatureProbe>;
  readonly maxOutputProbe?: boolean;
  /** Fire one live image generation at the `image` tier; `quality` is sent when set. */
  readonly liveImage?: { readonly quality?: AiAssist.AiImageQuality };
  readonly requiredSecrets: readonly ISecretSpec[];
}

/** Builds a web-runnable tier-canary scenario from the provider params. */
function makeTierScenario(params: ITierScenarioParams): IScenario {
  const cliImpl: ICliScenarioImpl = {
    webRunnable: true,
    async run(context: IScenarioContext): Promise<Result<string>> {
      // Resolve the descriptor inside run() (returning a Result failure gracefully), matching the
      // sibling client-tool scenarios in this directory.
      const descriptorResult = AiAssist.getProviderDescriptor(params.providerId);
      /* c8 ignore start - unreachable for the hardcoded builtin provider ids; mirrors the sibling
         scenarios' isFailure guard rather than throwing at import time. */
      if (descriptorResult.isFailure()) {
        return fail(`Failed to get ${params.providerId} descriptor: ${descriptorResult.message}`);
      }
      /* c8 ignore stop */
      const descriptor = descriptorResult.value;

      const spec: ITierCanarySpec = {
        providerId: params.providerId,
        descriptor,
        tiers: params.tiers,
        imageTier: params.imageTier,
        thinkingEfforts: params.thinkingEfforts,
        extraModels: params.extraModels,
        strictNoneProbe: params.strictNoneProbe,
        rawNoneRejection: RAW_NONE_REJECTIONS[params.providerId],
        structuredOutputProbe: params.structuredOutputProbe,
        structuredOutputEfforts: params.structuredOutputEfforts,
        explicitLevelProbe: params.explicitLevelProbe,
        temperatureProbes: params.temperatureProbes,
        maxOutputProbe: params.maxOutputProbe,
        liveImage: params.liveImage !== undefined
      };

      // Live seam: `buildLiveComplete` returns `undefined` when no API key resolves, which
      // yields the keyless STOP-FLAG resolver-only proof; a resolved key wires the live gate.
      const apiKey = await resolveTierApiKey(context, params.requiredSecrets);
      const deps: ITierCanaryDeps = {
        complete: buildLiveComplete(descriptor, apiKey),
        generateImage:
          params.liveImage !== undefined
            ? buildLiveImage(descriptor, apiKey, params.liveImage.quality)
            : undefined
      };

      return runTierCanary(spec, deps, context.logger);
    }
  };

  return {
    id: `${params.providerId}-model-tiers`,
    title: params.title,
    description: params.description,
    category: 'ai',
    tags: ['model-tiers', 'ai-assist', 'live-api', ...params.tags],
    requiredSecrets: params.requiredSecrets,
    cli: cliImpl
  };
}

/**
 * OpenAI model-tier canary — exercises `base` / `advanced` / `frontier` (all three tiers now resolve
 * to the gpt-6 line: gpt-6-luna / gpt-6.1-sol / gpt-6-astra) plus the `image` tier resolution (`gpt-image-2.5-sunburst`). The
 * gpt-6 family works on chat completions, so the frontier tier needs no Responses-only routing
 * (the earlier `gpt-5.5-pro` remains reachable via `modelOverride` and still routes via
 * `responsesOnlyModelPrefixes`). Each tier is also probed with thinking effort `none` and `low`,
 * and the image tier gets one live generation. Temperature probes: on `gpt-6-luna`, 0.3 with
 * effort `none` and 1 with no effort or beside effort `low` answer, 0.3 with no effort or beside
 * effort `low` is `refused-locally`, and 0.3 beside effort `low` sent raw is an `expected-reject` (the provider's
 * own 400); on `gpt-6.1-sol` and `gpt-6-astra`, `temperature: 1` answers with and without effort
 * `low` and `0.3` is `refused-locally`. Max-output probes
 * send each tier its recorded `resolveMaxOutputTokens` limit, which must be accepted. `image` is a
 * flagged access risk: a
 * resolver-correct + access-denied outcome is reported BLOCKED, not a failure. Requires
 * `OPENAI_API_KEY` for the live half.
 * @public
 */
export const openaiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'openai',
  title: 'OpenAI Model Tiers',
  description:
    'Resolves and (with OPENAI_API_KEY) live-canaries the OpenAI base/advanced/frontier tiers ' +
    '(gpt-6-luna / gpt-6.1-sol / gpt-6-astra), probes each with thinking effort none and low (and none with onUnsupported fail), ' +
    'probes temperature (gpt-6-luna: 0.3 accepted with effort none, 1 accepted with and without effort low, 0.3 refused ' +
    'locally with no effort or beside effort low, and 0.3 beside effort low sent raw for the provider 400; gpt-6.1-sol / ' +
    'gpt-6-astra: 1 accepted with and without effort low, 0.3 refused locally), sends each tier its recorded max output tokens, and ' +
    'fires one live image generation (gpt-image-2.5-sunburst, quality low). Logs each alias -> ' +
    'concrete id. The image may be access-gated — reported BLOCKED, not failed. Web-runnable.',
  tags: ['openai'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
  thinkingEfforts: THINKING_PROBE_EFFORTS,
  strictNoneProbe: true,
  temperatureProbes: OPENAI_TEMPERATURE_PROBES,
  maxOutputProbe: true,
  liveImage: { quality: 'low' },
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('openai'),
      envVarName: 'OPENAI_API_KEY',
      description: 'OpenAI API key for the live tier canary'
    }
  ]
});

/**
 * Anthropic model-tier canary — exercises `base` / `advanced` and a `frontier` request that
 * cascades to the `advanced` (opus) id (the log line for that request is the live cascade proof),
 * plus live rows for the `modelOverride`-only `@anthropic:fable` and `@anthropic:haiku` aliases.
 * Every one of those also gets a structured-output probe: the two Anthropic formats split by line
 * (`claude-haiku-5-5` forces a tool; `claude-sonnet-5-5`, `claude-opus-5-5` and `claude-fable-5-2`
 * send `output_config.format`), so the run exercises both mechanisms live, not only the ids. Each probe is repeated with thinking effort
 * `low`, so `output_config` carries `effort` and `format` together on the adaptive successors.
 *
 * Every tier and extra model is also probed with:
 * - thinking effort `none` and `low`. `'none'` on `claude-haiku-5-5` sends
 *   `thinking: { type: 'disabled' }` and must answer; on `claude-sonnet-5-5` it sends
 *   `thinking: { type: 'between_tools' }` (that model's off value) and must answer; on
 *   `claude-opus-5-5` and `claude-fable-5-2` (thinking-required) it is degraded to `'low'` and must
 *   answer. `'low'` is adaptive everywhere and must answer.
 * - `'none'` with `onUnsupported: 'fail'`: `refused-locally` on the two thinking-required models,
 *   answered on sonnet and haiku. Each thinking-required model, and sonnet, also gets a raw
 *   `thinking: { type: 'disabled' }` row, which must be the provider's 400 (`expected-reject`); an
 *   answer means the listing (or sonnet's off value) is stale.
 * - temperature 1 without and with effort `low` (both answer) and temperature 0.3
 *   (`refused-locally`).
 * - `maxTokens` at the recorded output limit, which must be accepted.
 *
 * Requires `ANTHROPIC_API_KEY` for the live half.
 * @public
 */
export const anthropicModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'anthropic',
  title: 'Anthropic Model Tiers',
  description:
    'Resolves and (with ANTHROPIC_API_KEY) live-canaries the Anthropic base/advanced tiers plus a ' +
    'frontier request that cascades to the advanced (opus) id — the cascade proof — and ' +
    '@anthropic:fable and @anthropic:haiku, and fires a schema structured-output probe on each (forced tool on ' +
    'claude-haiku-5-5, output_config.format on claude-sonnet-5-5 / claude-opus-5-5 / claude-fable-5-2), with and ' +
    'without thinking effort low. Probes each with thinking effort none and low (none is between_tools on ' +
    'claude-sonnet-5-5), none with onUnsupported fail (refused locally on the thinking-required models), and a raw ' +
    'thinking-disabled row the provider must reject on those models and on claude-sonnet-5-5, ' +
    'temperature 1 with and without effort low (accepted) and 0.3 (refused locally), and its recorded max output ' +
    'tokens. Logs each alias -> concrete id. Web-runnable.',
  tags: ['anthropic'],
  tiers: ['base', 'advanced', 'frontier'],
  extraModels: ['@anthropic:fable', '@anthropic:haiku'],
  structuredOutputProbe: true,
  // Repeat each schema probe with an effort: on claude-sonnet-5-5 / claude-opus-5-5 / claude-fable-5-2
  // that sends output_config { effort, format } together; on claude-haiku-5-5 it sends a forced tool
  // with adaptive thinking, which Anthropic's thinking page says works ("incompatible with manual
  // extended thinking but works with adaptive thinking").
  structuredOutputEfforts: ['low'],
  thinkingEfforts: THINKING_PROBE_EFFORTS,
  strictNoneProbe: true,
  temperatureProbes: ANTHROPIC_TEMPERATURE_PROBES,
  maxOutputProbe: true,
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('anthropic'),
      envVarName: 'ANTHROPIC_API_KEY',
      description: 'Anthropic API key for the live tier canary'
    }
  ]
});

/**
 * Gemini model-tier canary — exercises `base` / `advanced` and a `frontier` request that cascades
 * to the `advanced` (pro) id, `gemini-4-argon`, plus the `image` tier (`@google-gemini:flash-image` →
 * `gemini-nano-banana-2.1`), which gets one live generation. Each tier and the `modelOverride`-only
 * `@google-gemini:flash-lite` alias is probed with thinking effort `none`, `low` and `high`.
 * `gemini-3.8-flash` (base) stays on the `thinkingBudget` wire and turns thinking off with budget 0,
 * so `'none'` sends it and `none+fail` answers. `gemini-3.5-flash-lite` and `gemini-4-argon` are sent
 * `thinkingLevel`: `'none'` is `minimal` on flash-lite (and `none+fail` answers); Argon cannot turn
 * thinking off, so `'none'` degrades to `low` there and `none+fail` is refused locally, and its raw
 * row sends `thinkingLevel: 'minimal'`, which it must reject. Each level model also gets one
 * explicit-level row sending its lowest declared level verbatim, which must be accepted. Max-output
 * probes send each tier and flash-lite its recorded `resolveMaxOutputTokens` limit. Requires
 * `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) for the live half.
 * @public
 */
export const geminiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'google-gemini',
  title: 'Gemini Model Tiers',
  description:
    'Resolves and (with GEMINI_API_KEY/GOOGLE_API_KEY) live-canaries the Gemini base/advanced tiers ' +
    'plus a frontier request that cascades to the advanced (gemini-4-argon) id, probes each with thinking ' +
    'effort none, low and high (thinkingLevel on flash-lite and argon, where none is minimal on flash-lite ' +
    'and degrades to low on argon; none with onUnsupported fail is refused locally on argon, and a raw ' +
    'minimal row must be rejected there), sends each level model its lowest level explicitly, ' +
    'live-canaries @google-gemini:flash-lite, sends each its recorded max output tokens, and resolves the ' +
    'image tier (gemini-nano-banana-2.1) with one live generation. Logs each alias -> concrete id. The ' +
    'image may be access-gated — reported BLOCKED, not failed. Web-runnable.',
  tags: ['gemini', 'google'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
  thinkingEfforts: GEMINI_THINKING_PROBE_EFFORTS,
  strictNoneProbe: true,
  explicitLevelProbe: true,
  extraModels: ['@google-gemini:flash-lite'],
  maxOutputProbe: true,
  liveImage: {},
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('google-gemini'),
      envVarName: 'GEMINI_API_KEY',
      fallbackEnvVarNames: ['GOOGLE_API_KEY'],
      description: 'Gemini API key for the live tier canary (GEMINI_API_KEY or GOOGLE_API_KEY)'
    }
  ]
});

/**
 * xAI model-tier canary — exercises `base` / `advanced` and a `frontier` request that cascades to
 * the `advanced` (grok-4.7) id, plus the `image` tier resolution (`@xai-grok:imagine` →
 * `grok-imagine-image-2.0`). Added with the xAI alias-registry adoption to provide the first
 * live proof that the `@xai-grok:flagship` target answers — once run with `XAI_API_KEY`; the
 * keyless run is the STOP-FLAG resolver-only state. Each tier is probed with thinking effort `none`
 * and `low`, and the image tier gets one live generation with `quality: 'medium'` (the parameter
 * only `grok-imagine-image-2.0` accepts). Requires `XAI_API_KEY` for the live half.
 * @public
 */
export const xaiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'xai-grok',
  title: 'xAI Model Tiers',
  description:
    'Resolves and (with XAI_API_KEY) live-canaries the xAI base/advanced tiers (grok-4.3 / ' +
    'grok-4.7) plus a frontier request that cascades to the advanced (grok-4.7) id, and resolves ' +
    'the image tier (grok-imagine-image-2.0), probes each tier with thinking effort none and low (and none with onUnsupported fail), ' +
    'and fires one live image generation with quality medium. Logs each alias -> concrete id. ' +
    'Web-runnable.',
  tags: ['xai', 'grok'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
  thinkingEfforts: THINKING_PROBE_EFFORTS,
  strictNoneProbe: true,
  liveImage: { quality: 'medium' },
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('xai-grok'),
      envVarName: 'XAI_API_KEY',
      description: 'xAI API key for the live tier canary'
    }
  ]
});
