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

import { fail } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import type { ISecretSpec, IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';
import {
  type CanaryThinkingEffort,
  type CanaryTier,
  type ICanaryCompleteOptions,
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
 * likely to be refused (the 2026-09 rotation's `gpt-6-astra` and `gemini-3.8-flash` document no
 * off level); `'low'` is the control that shows thinking itself is accepted.
 */
const THINKING_PROBE_EFFORTS: ReadonlyArray<CanaryThinkingEffort> = ['none', 'low'];

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
 * The explicit provider block that sends each rotated provider's thinking-off value, bypassing the
 * library's `'none'` gate (an explicit block owns the wire). Used by the raw-`none` probe.
 */
const RAW_NONE_BLOCKS: Readonly<Record<string, AiAssist.IThinkingProviderConfig>> = {
  openai: { provider: 'openai', config: { effort: 'none' } },
  'xai-grok': { provider: 'xai', config: { effort: 'none' } },
  'google-gemini': { provider: 'google', config: { thinkingBudget: 0 } }
};

/**
 * Builds the live-completion seam for a provider: given an already-resolved `apiKey` (or
 * `undefined`), returns a `complete` callback that fires a minimal completion at the requested
 * tier via the real `callProviderCompletion`; returns `undefined` (→ the keyless STOP-FLAG
 * resolver-only path) when no key was resolved.
 *
 * This whole function is the keyed live seam and is coverage-ignored: it needs a real API key, and
 * the canary logic (resolution / classification / report / verdict) plus the keyless (empty-deps)
 * path are covered via injected deps and keyless `cli.run` in `modelTiers.test.ts`.
 */
/* c8 ignore start - live completion seam: needs a real API key. */
function buildLiveComplete(
  descriptor: AiAssist.IAiProviderDescriptor,
  apiKey: string | undefined
): ITierCanaryDeps['complete'] {
  if (apiKey === undefined) {
    return undefined;
  }
  const key = apiKey;
  const rawNone = RAW_NONE_BLOCKS[descriptor.id];
  return (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
    AiAssist.callProviderCompletion({
      descriptor,
      apiKey: key,
      messages: [{ role: 'user', content: CANARY_PROMPT }],
      // The completion path takes `tier` verbatim (`undefined` = base).
      tier: tier === 'base' ? undefined : tier,
      ...(options?.modelOverride !== undefined ? { modelOverride: options.modelOverride } : {}),
      ...(options?.effort !== undefined
        ? {
            thinking: {
              effort: options.effort,
              ...(options.onUnsupported !== undefined ? { onUnsupported: options.onUnsupported } : {})
            }
          }
        : {}),
      ...(options?.rawNone === true && rawNone !== undefined ? { thinking: { providers: [rawNone] } } : {})
    });
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
/* c8 ignore stop */

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
 * to the gpt-6 family: luna / sol / astra) plus the `image` tier resolution (`gpt-image-2.5-sunburst`). The
 * gpt-6 family works on chat completions, so the frontier tier needs no Responses-only routing
 * (the earlier `gpt-5.5-pro` remains reachable via `modelOverride` and still routes via
 * `responsesOnlyModelPrefixes`). Each tier is also probed with thinking effort `none` and `low`,
 * and the image tier gets one live generation. `image` is a flagged access risk: a
 * resolver-correct + access-denied outcome is reported BLOCKED, not a failure. Requires
 * `OPENAI_API_KEY` for the live half.
 * @public
 */
export const openaiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'openai',
  title: 'OpenAI Model Tiers',
  description:
    'Resolves and (with OPENAI_API_KEY) live-canaries the OpenAI base/advanced/frontier tiers ' +
    '(gpt-6-luna / gpt-6-sol / gpt-6-astra), probes each with thinking effort none and low (and none with onUnsupported fail), and ' +
    'fires one live image generation (gpt-image-2.5-sunburst, quality low). Logs each alias -> ' +
    'concrete id. The image may be access-gated — reported BLOCKED, not failed. Web-runnable.',
  tags: ['openai'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
  thinkingEfforts: THINKING_PROBE_EFFORTS,
  strictNoneProbe: true,
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
 * cascades to the `advanced` (opus) id (the log line for that request is the live cascade proof).
 * Requires `ANTHROPIC_API_KEY` for the live half.
 * @public
 */
export const anthropicModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'anthropic',
  title: 'Anthropic Model Tiers',
  description:
    'Resolves and (with ANTHROPIC_API_KEY) live-canaries the Anthropic base/advanced tiers plus a ' +
    'frontier request that cascades to the advanced (opus) id — the cascade proof. Logs each ' +
    'alias -> concrete id. Web-runnable.',
  tags: ['anthropic'],
  tiers: ['base', 'advanced', 'frontier'],
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
 * to the `advanced` (pro) id, plus the `image` tier resolution (`@google-gemini:flash-image` →
 * `gemini-3.1-flash-image` — the GA id that replaced the retired preview id). The image tier is
 * offline-resolved and logged only (it was not rotated). Each tier is probed with thinking effort
 * `none` and `low`, and the `modelOverride`-only `@google-gemini:flash-lite` alias gets its own
 * live row. Requires `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) for the live half.
 * @public
 */
export const geminiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'google-gemini',
  title: 'Gemini Model Tiers',
  description:
    'Resolves and (with GEMINI_API_KEY/GOOGLE_API_KEY) live-canaries the Gemini base/advanced tiers ' +
    'plus a frontier request that cascades to the advanced (pro) id, probes each with thinking ' +
    'effort none and low (and none with onUnsupported fail), live-canaries @google-gemini:flash-lite, and resolves the image tier ' +
    '(gemini-3.1-flash-image). Logs each alias -> concrete id. Web-runnable.',
  tags: ['gemini', 'google'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
  thinkingEfforts: THINKING_PROBE_EFFORTS,
  strictNoneProbe: true,
  extraModels: ['@google-gemini:flash-lite'],
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
