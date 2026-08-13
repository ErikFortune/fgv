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
 * Model-listing clients for AI assist. One provider dispatcher over
 * `IAiProviderDescriptor.apiFormat`, its adapters and response validators, the
 * capability-resolution helpers that turn a raw model id into an
 * `IAiModelInfo`, and the proxied variant.
 *
 * @packageDocumentation
 */

import { fail, type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import {
  type AiModelCapability,
  allModelCapabilities,
  type IAiModelCapabilityConfig,
  type IAiModelCapabilityRule,
  type IAiModelInfo,
  type IAiProviderDescriptor
} from './model';
import {} from './thinkingOptionsResolver';
import {} from './chatRequestBuilders';
import {
  anthropicAuthHeaders,
  bearerAuthHeader,
  geminiAuthHeader,
  resolveEffectiveBaseUrl
} from './endpoint';
import { type IAiApiConfig, fetchGetJson, fetchJson } from './http';
import { DEFAULT_MODEL_CAPABILITY_CONFIG } from './registry';
import {} from './imageOptionsResolver';

// ---- Proxied list-models response ----

/**
 * Wire shape for proxy list-models responses. `capabilities` arrives as an
 * array (Sets don't survive JSON), then gets reassembled into a `Set` in
 * {@link callProxiedListModels}.
 * @internal
 */
interface IProxiedListModelsEntry {
  id: string;
  capabilities: AiModelCapability[];
  displayName?: string;
}
/** @internal */
interface IProxiedListModelsBody {
  models: IProxiedListModelsEntry[];
}

const proxiedListModelsEntry: Validator<IProxiedListModelsEntry> = Validators.object<IProxiedListModelsEntry>(
  {
    id: Validators.string,
    capabilities: Validators.arrayOf(Validators.enumeratedValue<AiModelCapability>(allModelCapabilities)),
    displayName: Validators.string.optional()
  }
);
const proxiedListModelsResponse: Validator<IProxiedListModelsBody> =
  Validators.object<IProxiedListModelsBody>({
    models: Validators.arrayOf(proxiedListModelsEntry)
  });

// ============================================================================
// List models — request types
// ============================================================================

/**
 * Parameters for a list-models request.
 * @public
 */
export interface IProviderListModelsParams {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /** Optional capability filter; when set, only models declaring this capability are returned. */
  readonly capability?: AiModelCapability;
  /** Optional capability config override (defaults to {@link DEFAULT_MODEL_CAPABILITY_CONFIG}). */
  readonly capabilityConfig?: IAiModelCapabilityConfig;
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Optional abort signal for cancelling the in-flight request. */
  readonly signal?: AbortSignal;
  /** Optional override of the descriptor's base URL; per-format `/models` route is appended unchanged. */
  readonly endpoint?: string;
}

// ============================================================================
// List models — response validators
// ============================================================================

// ---- OpenAI / xAI / Groq / Mistral list format ----

/** @internal */
interface IOpenAiListEntry {
  id: string;
}
/** @internal */
interface IOpenAiListResponse {
  data: IOpenAiListEntry[];
}

const openAiListEntry: Validator<IOpenAiListEntry> = Validators.object<IOpenAiListEntry>({
  id: Validators.string
});
const openAiListResponse: Validator<IOpenAiListResponse> = Validators.object<IOpenAiListResponse>({
  data: Validators.arrayOf(openAiListEntry)
});

// ---- Anthropic list format ----

/** @internal */
interface IAnthropicListEntry {
  id: string;
  display_name?: string;
}
/** @internal */
interface IAnthropicListResponse {
  data: IAnthropicListEntry[];
}

const anthropicListEntry: Validator<IAnthropicListEntry> = Validators.object<IAnthropicListEntry>({
  id: Validators.string,
  display_name: Validators.string.optional()
});
const anthropicListResponse: Validator<IAnthropicListResponse> = Validators.object<IAnthropicListResponse>({
  data: Validators.arrayOf(anthropicListEntry)
});

// ---- Gemini list format ----

/** @internal */
interface IGeminiListEntry {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}
/** @internal */
interface IGeminiListResponse {
  models: IGeminiListEntry[];
}

const geminiListEntry: Validator<IGeminiListEntry> = Validators.object<IGeminiListEntry>({
  name: Validators.string,
  displayName: Validators.string.optional(),
  supportedGenerationMethods: Validators.arrayOf(Validators.string).optional()
});
const geminiListResponse: Validator<IGeminiListResponse> = Validators.object<IGeminiListResponse>({
  models: Validators.arrayOf(geminiListEntry)
});

// ============================================================================
// List models — capability resolution
// ============================================================================

/**
 * Translates Gemini's `supportedGenerationMethods` strings into our abstract
 * capability vocabulary. Methods without a mapping are ignored.
 * @internal
 */
function geminiMethodsToCapabilities(methods: ReadonlyArray<string>): ReadonlyArray<AiModelCapability> {
  const out: AiModelCapability[] = [];
  for (const m of methods) {
    if (m === 'generateContent') {
      out.push('chat');
    } else if (m === 'predict') {
      out.push('image-generation');
    }
  }
  return out;
}

/**
 * Strips the `models/` prefix Gemini includes on listed model names.
 * @internal
 */
function geminiBareId(name: string): string {
  /* c8 ignore next 1 - defensive: Gemini API always returns names prefixed with 'models/' */
  return name.startsWith('models/') ? name.substring('models/'.length) : name;
}

/**
 * Applies a capability config to a model id. Walks per-provider rules then
 * global rules; unions all matching rules' capabilities. Returns the union
 * and the first matching `displayName` (if any).
 * @internal
 */
function applyCapabilityConfig(
  config: IAiModelCapabilityConfig,
  providerId: string,
  modelId: string
): { capabilities: AiModelCapability[]; displayName: string | undefined } {
  const caps = new Set<AiModelCapability>();
  let displayName: string | undefined;

  const rulesets: ReadonlyArray<ReadonlyArray<IAiModelCapabilityRule>> = [
    config.perProvider?.[providerId as keyof typeof config.perProvider] ?? [],
    config.global ?? []
  ];

  for (const rules of rulesets) {
    for (const rule of rules) {
      rule.idPattern.lastIndex = 0;
      if (rule.idPattern.test(modelId)) {
        for (const cap of rule.capabilities) {
          caps.add(cap);
        }
        if (displayName === undefined && rule.displayName !== undefined) {
          displayName = typeof rule.displayName === 'function' ? rule.displayName(modelId) : rule.displayName;
        }
      }
    }
  }
  return { capabilities: Array.from(caps), displayName };
}

/**
 * Combines provider-native capability info (when supplied) and config-derived
 * capability info into a final {@link IAiModelInfo}.
 * @internal
 */
function buildModelInfo(
  providerId: string,
  id: string,
  nativeCapabilities: ReadonlyArray<AiModelCapability>,
  nativeDisplayName: string | undefined,
  config: IAiModelCapabilityConfig
): IAiModelInfo {
  const fromConfig = applyCapabilityConfig(config, providerId, id);
  const all = new Set<AiModelCapability>([...nativeCapabilities, ...fromConfig.capabilities]);
  return {
    id,
    capabilities: all,
    ...(nativeDisplayName !== undefined
      ? { displayName: nativeDisplayName }
      : fromConfig.displayName !== undefined
      ? { displayName: fromConfig.displayName }
      : {})
  };
}

// ============================================================================
// List models — adapters
// ============================================================================

/**
 * Calls the OpenAI-style `GET /models` endpoint. Used by openai, xai-grok,
 * groq, and mistral. Provider supplies no capability info — capabilities are
 * derived entirely from the config.
 * @internal
 */
async function callOpenAiListModels(
  config: IAiApiConfig,
  providerId: string,
  capabilityConfig: IAiModelCapabilityConfig,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const url = `${config.baseUrl}/models`;
  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);
  /* c8 ignore next 1 - optional logger */
  logger?.info(`List models: provider=${providerId}, format=openai`);
  const jsonResult = await fetchGetJson(url, headers, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return openAiListResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `OpenAI models API response: ${msg}`)
    .onSuccess((response) => {
      const models = response.data.map((entry) =>
        buildModelInfo(providerId, entry.id, [], undefined, capabilityConfig)
      );
      return succeed(models);
    });
}

/**
 * Calls the Anthropic `GET /models` endpoint. Provider supplies a
 * `display_name` but no native capability info.
 * @internal
 */
async function callAnthropicListModels(
  config: IAiApiConfig,
  providerId: string,
  capabilityConfig: IAiModelCapabilityConfig,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const url = `${config.baseUrl}/models`;
  const headers: Record<string, string> = anthropicAuthHeaders(config.apiKey);
  /* c8 ignore next 1 - optional logger */
  logger?.info(`List models: provider=${providerId}, format=anthropic`);
  const jsonResult = await fetchGetJson(url, headers, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return anthropicListResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Anthropic models API response: ${msg}`)
    .onSuccess((response) => {
      const models = response.data.map((entry) =>
        buildModelInfo(providerId, entry.id, [], entry.display_name, capabilityConfig)
      );
      return succeed(models);
    });
}

/**
 * Calls the Gemini `GET /models` endpoint. Provider supplies both a
 * `displayName` and `supportedGenerationMethods` — translated to native
 * capabilities and unioned with config-derived capabilities.
 * @internal
 */
async function callGeminiListModels(
  config: IAiApiConfig,
  providerId: string,
  capabilityConfig: IAiModelCapabilityConfig,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const url = `${config.baseUrl}/models`;
  const headers: Record<string, string> = geminiAuthHeader(config.apiKey);
  /* c8 ignore next 1 - optional logger */
  logger?.info(`List models: provider=${providerId}, format=gemini`);
  const jsonResult = await fetchGetJson(url, headers, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return geminiListResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Gemini models API response: ${msg}`)
    .onSuccess((response) => {
      const models = response.models.map((entry) => {
        const id = geminiBareId(entry.name);
        const native = entry.supportedGenerationMethods
          ? geminiMethodsToCapabilities(entry.supportedGenerationMethods)
          : [];
        return buildModelInfo(providerId, id, native, entry.displayName, capabilityConfig);
      });
      return succeed(models);
    });
}

// ============================================================================
// List models — dispatcher
// ============================================================================

/**
 * Lists models available from a provider, routing by `descriptor.apiFormat`.
 * Capabilities are resolved from native provider info and a configurable rule set.
 * @param params - Request parameters (descriptor, API key, optional capability filter)
 * @public
 */
export async function callProviderListModels(
  params: IProviderListModelsParams
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const { descriptor, apiKey, capability, capabilityConfig, logger, signal, endpoint } = params;

  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }

  const config: IAiApiConfig = {
    baseUrl: baseUrlResult.value,
    apiKey,
    model: '' // unused by listing
  };
  const effectiveConfig = capabilityConfig ?? DEFAULT_MODEL_CAPABILITY_CONFIG;

  let listResult: Result<ReadonlyArray<IAiModelInfo>>;
  switch (descriptor.apiFormat) {
    case 'openai':
      listResult = await callOpenAiListModels(config, descriptor.id, effectiveConfig, logger, signal);
      break;
    case 'anthropic':
      listResult = await callAnthropicListModels(config, descriptor.id, effectiveConfig, logger, signal);
      break;
    case 'gemini':
      listResult = await callGeminiListModels(config, descriptor.id, effectiveConfig, logger, signal);
      break;
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = descriptor.apiFormat;
      return fail(`unsupported API format: ${String(_exhaustive)}`);
    }
  }

  if (listResult.isFailure()) {
    return listResult;
  }
  if (capability === undefined) {
    return listResult;
  }
  return succeed(listResult.value.filter((m) => m.capabilities.has(capability)));
}

// ============================================================================
// Proxied list models
// ============================================================================

/**
 * Calls the model-listing endpoint on a proxy server. Endpoint:
 * `POST ${proxyUrl}/api/ai/list-models`. Capability config is not forwarded;
 * `capabilities` is serialized as a string array. Error body `{error: string}`
 * is surfaced as `proxy: ${error}`.
 * @public
 */
export async function callProxiedListModels(
  proxyUrl: string,
  params: IProviderListModelsParams
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const { descriptor, apiKey, capability, logger, signal } = params;

  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey
  };
  if (capability !== undefined) {
    body.capability = capability;
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI list-models proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);

  const url = `${proxyUrl}/api/ai/list-models`;
  const jsonResult = await fetchJson(url, {}, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const response = jsonResult.value as Record<string, unknown>;
  if (typeof response.error === 'string') {
    return fail(`proxy: ${response.error}`);
  }

  return proxiedListModelsResponse
    .validate(response)
    .withErrorFormat((msg) => `proxy returned invalid response: ${msg}`)
    .onSuccess((parsed) => {
      const models: IAiModelInfo[] = parsed.models.map((m) => ({
        id: m.id,
        capabilities: new Set<AiModelCapability>(m.capabilities),
        ...(m.displayName !== undefined ? { displayName: m.displayName } : {})
      }));
      return succeed(models);
    });
}
