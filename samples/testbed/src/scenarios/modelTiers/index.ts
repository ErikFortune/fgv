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
import { type CanaryTier, type ITierCanaryDeps, type ITierCanarySpec, runTierCanary } from './canary';

/** Minimal prompt used for the per-tier live completion — kept tiny to minimise token cost. */
const CANARY_PROMPT: string = 'Reply with the single word: pong.';

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
  return (tier: CanaryTier) =>
    AiAssist.callProviderCompletion({
      descriptor,
      apiKey: key,
      messages: [{ role: 'user', content: CANARY_PROMPT }],
      // The completion path takes `tier` verbatim (`undefined` = base).
      tier: tier === 'base' ? undefined : tier
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
        imageTier: params.imageTier
      };

      // Live seam: `buildLiveComplete` returns `undefined` when no API key resolves, which
      // yields the keyless STOP-FLAG resolver-only proof; a resolved key wires the live gate.
      const apiKey = await resolveTierApiKey(context, params.requiredSecrets);
      const deps: ITierCanaryDeps = { complete: buildLiveComplete(descriptor, apiKey) };

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
 * to the gpt-5.6 family: luna / terra / sol) plus the `image` tier resolution (`gpt-image-2`). The
 * 5.6 family works on chat completions, so the frontier tier no longer needs the Responses-only
 * routing its predecessor `gpt-5.5-pro` required (that id remains reachable via `modelOverride` and
 * still routes via `responsesOnlyModelPrefixes`). `image` is a flagged access risk: a
 * resolver-correct + access-denied outcome is reported BLOCKED, not a failure. Requires
 * `OPENAI_API_KEY` for the live half.
 * @public
 */
export const openaiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'openai',
  title: 'OpenAI Model Tiers',
  description:
    'Resolves and (with OPENAI_API_KEY) live-canaries the OpenAI base/advanced/frontier tiers ' +
    '(gpt-5.6-luna / gpt-5.6-terra / gpt-5.6-sol) plus the image tier (gpt-image-2). Logs each ' +
    'alias -> concrete id. gpt-image-2 (image) may be access-gated — reported BLOCKED, not failed. ' +
    'Web-runnable.',
  tags: ['openai'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
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
 * offline-resolved and logged only (no live image call — image generation is a separate call
 * path). Requires `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) for the live half.
 * @public
 */
export const geminiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'google-gemini',
  title: 'Gemini Model Tiers',
  description:
    'Resolves and (with GEMINI_API_KEY/GOOGLE_API_KEY) live-canaries the Gemini base/advanced tiers ' +
    'plus a frontier request that cascades to the advanced (pro) id, and resolves the image tier ' +
    '(gemini-3.1-flash-image). Logs each alias -> concrete id. Web-runnable.',
  tags: ['gemini', 'google'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
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
 * the `advanced` (grok-4.5) id, plus the `image` tier resolution (`@xai-grok:imagine` →
 * `grok-imagine-image-quality`). Added with the xAI alias-registry adoption — the first live proof
 * that `@xai-grok:flagship` → `grok-4.5` answers. Requires `XAI_API_KEY` for the live half.
 * @public
 */
export const xaiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'xai-grok',
  title: 'xAI Model Tiers',
  description:
    'Resolves and (with XAI_API_KEY) live-canaries the xAI base/advanced tiers (grok-4.3 / ' +
    'grok-4.5) plus a frontier request that cascades to the advanced (grok-4.5) id, and resolves ' +
    'the image tier (grok-imagine-image-quality). Logs each alias -> concrete id. Web-runnable.',
  tags: ['xai', 'grok'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('xai-grok'),
      envVarName: 'XAI_API_KEY',
      description: 'xAI API key for the live tier canary'
    }
  ]
});
