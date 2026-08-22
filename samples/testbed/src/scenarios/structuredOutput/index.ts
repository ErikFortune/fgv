/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Live structured-output verification, one scenario per provider
 * (`openai-structured-output`, `anthropic-structured-output`,
 * `google-gemini-structured-output`, `xai-grok-structured-output`).
 *
 * @remarks
 * This is the gate `ai-assist-structured-output` left open on purpose. Unit tests
 * pin each request body against the wire shape *as documented*; only a live call
 * can tell "the provider honoured it" from "the provider accepted the field and
 * ignored it", and the second reads as success everywhere else.
 *
 * Each scenario runs every route its provider actually has:
 *
 * - **OpenAI / xAI** run **twice** — once without tools (`/chat/completions`,
 *   `response_format`) and once with (`/responses`, `text.format`). That pair is
 *   the live half of the route-coercion bug found during implementation, where the
 *   same model takes different endpoints and `response_format` in a `/responses`
 *   body is silently ignored.
 * - **OpenAI** additionally probes `json-object` mode, the weaker floor.
 * - **Anthropic** probes `tool-forced`, whose reply arrives in a `tool_use` block
 *   and is re-serialized — the one path where the response *shape* differs.
 * - **Gemini** probes its `generationConfig` route.
 *
 * Web-runnable; the key resolves through `context.resolveSecret` (KeyStore →
 * session store → env var), so it behaves identically on the CLI and in the browser.
 * @packageDocumentation
 */

import { fail } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import type { ISecretSpec, IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';
import {
  PROBE_SCHEMA,
  type IProbeOutcome,
  type IProbeSpec,
  type ProbeComplete,
  runProbe,
  summarize
} from './probe';
import { resolveTierApiKey } from '../modelTiers';

/** One provider's probe set. */
interface IStructuredScenarioParams {
  readonly providerId: string;
  readonly title: string;
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
  readonly requiredSecrets: readonly ISecretSpec[];
  /** Builds the provider's probes once its descriptor and key are in hand. */
  readonly probes: (
    descriptor: AiAssist.IAiProviderDescriptor,
    apiKey: string | undefined
  ) => ReadonlyArray<IProbeSpec>;
}

/**
 * The real completion call. Coverage-ignored because it needs a live API key; the
 * probe's own logic is exercised through an injected `ProbeComplete` in
 * `structuredOutput.test.ts`, exactly as `modelTiers` does.
 */
/* c8 ignore next 3 - live seam: needs a real API key */
const liveComplete: ProbeComplete = (p) => AiAssist.callProviderCompletion(p);

function makeStructuredScenario(params: IStructuredScenarioParams): IScenario {
  const cliImpl: ICliScenarioImpl = {
    webRunnable: true,
    async run(context: IScenarioContext): Promise<Result<string>> {
      const descriptorResult = AiAssist.getProviderDescriptor(params.providerId);
      /* c8 ignore next 3 - unreachable for a hardcoded builtin id; mirrors the sibling scenarios */
      if (descriptorResult.isFailure()) {
        return fail(`Failed to get ${params.providerId} descriptor: ${descriptorResult.message}`);
      }
      const apiKey = await resolveTierApiKey(context, params.requiredSecrets);
      const outcomes: IProbeOutcome[] = [];
      for (const spec of params.probes(descriptorResult.value, apiKey)) {
        outcomes.push(await runProbe(spec, context.logger, liveComplete));
      }
      return summarize(outcomes);
    }
  };

  return {
    id: `${params.providerId}-structured-output`,
    title: params.title,
    description: params.description,
    category: 'ai',
    tags: ['structured-output', 'ai-assist', 'live-api', ...params.tags],
    requiredSecrets: params.requiredSecrets,
    cli: cliImpl
  };
}

const SCHEMA_REQUEST: AiAssist.StructuredOutputRequest = {
  mode: 'schema',
  schema: PROBE_SCHEMA,
  // Strict on purpose: a probe that degraded would report a green run for a
  // provider whose constraint never reached the wire.
  onUnsupported: 'fail'
};

/**
 * OpenAI structured output — both routes plus json-object mode.
 * @public
 */
export const openaiStructuredOutputScenario: IScenario = makeStructuredScenario({
  providerId: 'openai',
  title: 'OpenAI Structured Output',
  description:
    'Live-verifies OpenAI structured output on BOTH routes: /chat/completions (response_format) ' +
    'and /responses (text.format, forced by requesting a server tool). Also probes json-object ' +
    'mode. Requires OPENAI_API_KEY. Web-runnable.',
  tags: ['openai'],
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('openai'),
      envVarName: 'OPENAI_API_KEY',
      description: 'OpenAI API key for the live structured-output probe'
    }
  ],
  probes: (descriptor, apiKey) => [
    {
      label: 'openai schema (chat completions)',
      descriptor,
      apiKey,
      request: SCHEMA_REQUEST,
      expect: 'schema'
    },
    {
      // The live half of the route-coercion fix: same model, different endpoint,
      // different field name. A regression here reports 'schema' while the reply
      // is unconstrained — which is why the probe validates the reply, not the call.
      label: 'openai schema (responses API, via server tool)',
      descriptor,
      apiKey,
      tools: [{ type: 'web_search' }],
      request: SCHEMA_REQUEST,
      expect: 'schema'
    },
    {
      label: 'openai json-object',
      descriptor,
      apiKey,
      request: { mode: 'json-object', onUnsupported: 'fail' },
      expect: 'json-mode'
    }
  ]
});

/**
 * Anthropic structured output — the forced-tool path, whose reply shape differs.
 * @public
 */
export const anthropicStructuredOutputScenario: IScenario = makeStructuredScenario({
  providerId: 'anthropic',
  title: 'Anthropic Structured Output',
  description:
    'Live-verifies Anthropic structured output via forced tool use — the one path where the reply ' +
    'arrives in a tool_use block rather than as text and is re-serialized into content. Requires ' +
    'ANTHROPIC_API_KEY. Web-runnable.',
  tags: ['anthropic'],
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('anthropic'),
      envVarName: 'ANTHROPIC_API_KEY',
      description: 'Anthropic API key for the live structured-output probe'
    }
  ],
  probes: (descriptor, apiKey) => [
    { label: 'anthropic tool-forced', descriptor, apiKey, request: SCHEMA_REQUEST, expect: 'tool-forced' }
  ]
});

/**
 * Gemini structured output — the `generationConfig` route, with the draft-07 sanitizer.
 * @public
 */
export const geminiStructuredOutputScenario: IScenario = makeStructuredScenario({
  providerId: 'google-gemini',
  title: 'Gemini Structured Output',
  description:
    'Live-verifies Gemini structured output via generationConfig.responseSchema — the path that ' +
    'depends on the draft-07 sanitizer, since Gemini REJECTS the keywords JsonSchema emits by ' +
    'default rather than ignoring them. Requires GEMINI_API_KEY. Web-runnable.',
  tags: ['gemini'],
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('google-gemini'),
      envVarName: 'GEMINI_API_KEY',
      description: 'Gemini API key for the live structured-output probe'
    }
  ],
  probes: (descriptor, apiKey) => [
    { label: 'gemini schema', descriptor, apiKey, request: SCHEMA_REQUEST, expect: 'schema' },
    {
      label: 'gemini json-object',
      descriptor,
      apiKey,
      request: { mode: 'json-object', onUnsupported: 'fail' },
      expect: 'json-mode'
    }
  ]
});

/**
 * xAI structured output — both routes, same as OpenAI (it shares the `openai` apiFormat).
 * @public
 */
export const xaiStructuredOutputScenario: IScenario = makeStructuredScenario({
  providerId: 'xai-grok',
  title: 'xAI Structured Output',
  description:
    'Live-verifies xAI structured output on both routes (/chat/completions and /responses), which ' +
    'it reaches through the same openai apiFormat. Requires XAI_API_KEY. Web-runnable.',
  tags: ['xai'],
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('xai-grok'),
      envVarName: 'XAI_API_KEY',
      description: 'xAI API key for the live structured-output probe'
    }
  ],
  probes: (descriptor, apiKey) => [
    { label: 'xai schema (chat completions)', descriptor, apiKey, request: SCHEMA_REQUEST, expect: 'schema' },
    {
      label: 'xai schema (responses API, via server tool)',
      descriptor,
      apiKey,
      tools: [{ type: 'web_search' }],
      request: SCHEMA_REQUEST,
      expect: 'schema'
    }
  ]
});
