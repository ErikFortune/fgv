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
 * `google-gemini-model-tiers`). Each resolves its provider's `base` / `advanced` / `frontier` tiers,
 * logs the `alias -> concrete` hop (matching the shipped `@google-gemini:flash -> …` line), and —
 * when the provider API key is present — fires a minimal live completion per tier to prove the id
 * answers. Without a key the run is the STOP-FLAG state: resolver verified, live canary pending the
 * orchestrator's keyed gate.
 *
 * The canary logic lives in the sibling `canary` module; these wrappers only build the spec and
 * (when a key is present) the live-completion seam. CLI-only — a live API key cannot be embedded in
 * the web bundle.
 *
 * @packageDocumentation
 */

import { fail } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import type { IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';
import { type CanaryTier, type ITierCanaryDeps, type ITierCanarySpec, runTierCanary } from './canary';

/** Minimal prompt used for the per-tier live completion — kept tiny to minimise token cost. */
const CANARY_PROMPT: string = 'Reply with the single word: pong.';

/**
 * Builds the live-completion seam for a provider: reads the API key from the environment (first
 * non-empty of `apiKeyEnvVars` wins) and, when present, returns a `complete` callback that fires a
 * minimal completion at the requested tier via the real `callProviderCompletion`; returns
 * `undefined` (→ the keyless STOP-FLAG resolver-only path) when no key is set.
 *
 * This whole function is the keyed live seam and is coverage-ignored: it needs a real API key, and
 * the canary logic (resolution / classification / report / verdict) plus the keyless (empty-deps)
 * path are covered via injected deps and keyless `cli.run` in `modelTiers.test.ts`.
 */
/* c8 ignore start - live completion seam: needs a real API key. */
function buildLiveComplete(
  descriptor: AiAssist.IAiProviderDescriptor,
  apiKeyEnvVars: ReadonlyArray<string>
): ITierCanaryDeps['complete'] {
  let apiKey: string | undefined;
  for (const name of apiKeyEnvVars) {
    const value = process.env[name];
    if (value !== undefined && value.trim().length > 0) {
      apiKey = value;
      break;
    }
  }
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
  /** API-key env vars, tried in order (first non-empty wins). */
  readonly apiKeyEnvVars: ReadonlyArray<string>;
  readonly tiers: ReadonlyArray<CanaryTier>;
  readonly imageTier?: boolean;
  readonly requiredSecrets: IScenario['requiredSecrets'];
}

/** Builds a CLI-only tier-canary scenario from the provider params. */
function makeTierScenario(params: ITierScenarioParams): IScenario {
  const cliImpl: ICliScenarioImpl = {
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

      // Live seam: `buildLiveComplete` returns `undefined` when no API key is set, which yields
      // the keyless STOP-FLAG resolver-only proof; a present key wires the orchestrator's gate.
      const deps: ITierCanaryDeps = { complete: buildLiveComplete(descriptor, params.apiKeyEnvVars) };

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
 * OpenAI model-tier canary — exercises `base` / `advanced` and a `frontier` request that now resolves
 * to `gpt-5.5-pro` (alias `@openai:pro`) and routes via the OpenAI Responses API (+ the `image` tier
 * resolution). gpt-5.5-pro is a Responses-API-only model; the completion path now routes it there via
 * the descriptor's `responsesOnlyModelPrefixes` marker, so the OpenAI `defaultModel` carries a real
 * `frontier` key again (no longer a cascade to gpt-5.5). This scenario is therefore the live
 * gpt-5.5-pro frontier canary — the principal runs the keyed half as the final gate. `image`
 * (`gpt-image-1.5`) is a flagged access risk: a resolver-correct + access-denied outcome is reported
 * BLOCKED, not a failure. Requires `OPENAI_API_KEY` for the live half.
 * @public
 */
export const openaiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'openai',
  title: 'OpenAI Model Tiers',
  description:
    'Resolves and (with OPENAI_API_KEY) live-canaries the OpenAI base/advanced tiers plus a frontier ' +
    'request that resolves to gpt-5.5-pro (@openai:pro) and routes via the Responses API — the ' +
    'restored-frontier proof — plus the image tier. Logs each alias -> concrete id. gpt-image-1.5 ' +
    '(image) may be access-gated — reported BLOCKED, not failed. CLI-only.',
  tags: ['openai'],
  apiKeyEnvVars: ['OPENAI_API_KEY'],
  tiers: ['base', 'advanced', 'frontier'],
  imageTier: true,
  requiredSecrets: [
    {
      id: 'openai-api-key',
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
    'alias -> concrete id. CLI-only.',
  tags: ['anthropic'],
  apiKeyEnvVars: ['ANTHROPIC_API_KEY'],
  tiers: ['base', 'advanced', 'frontier'],
  requiredSecrets: [
    {
      id: 'anthropic-api-key',
      envVarName: 'ANTHROPIC_API_KEY',
      description: 'Anthropic API key for the live tier canary'
    }
  ]
});

/**
 * Gemini model-tier canary — exercises `base` / `advanced` and a `frontier` request that cascades
 * to the `advanced` (pro) id. Requires `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) for the live half.
 * @public
 */
export const geminiModelTiersScenario: IScenario = makeTierScenario({
  providerId: 'google-gemini',
  title: 'Gemini Model Tiers',
  description:
    'Resolves and (with GEMINI_API_KEY/GOOGLE_API_KEY) live-canaries the Gemini base/advanced tiers ' +
    'plus a frontier request that cascades to the advanced (pro) id. Logs each alias -> concrete id. ' +
    'CLI-only.',
  tags: ['gemini', 'google'],
  apiKeyEnvVars: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
  tiers: ['base', 'advanced', 'frontier'],
  requiredSecrets: [
    {
      id: 'gemini-api-key',
      envVarName: 'GEMINI_API_KEY',
      description: 'Gemini API key for the live tier canary'
    },
    {
      id: 'google-api-key',
      envVarName: 'GOOGLE_API_KEY',
      description: 'Google API key for the live tier canary (alternative to GEMINI_API_KEY)'
    }
  ]
});
