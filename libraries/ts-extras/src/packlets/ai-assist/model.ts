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
 * Core types for AI assist: prompt class, provider descriptors, settings, and chat messages.
 * @packageDocumentation
 */

import { type Result } from '@fgv/ts-utils';

// ============================================================================
// AiPrompt
// ============================================================================

/**
 * A structured AI prompt with system/user split for direct API calls,
 * and a lazily-constructed combined version for copy/paste workflows.
 * @public
 */
export class AiPrompt {
  /** System instructions: schema documentation, format rules, general guidance. */
  public readonly system: string;
  /** User request: the specific entity generation request. */
  public readonly user: string;

  public constructor(user: string, system: string) {
    this.system = system;
    this.user = user;
  }

  /** Combined single-string version (user + system joined) for copy/paste. */
  public get combined(): string {
    return `${this.user}\n\n${this.system}`;
  }
}

// ============================================================================
// Chat Message
// ============================================================================

/**
 * A single chat message in OpenAI format.
 * @public
 */
export interface IChatMessage {
  /** Message role */
  readonly role: 'system' | 'user' | 'assistant';
  /** Message content */
  readonly content: string;
}

// ============================================================================
// Server-Side Tools
// ============================================================================

/**
 * Built-in server-side tool types supported across providers.
 * @public
 */
export type AiServerToolType = 'web_search';

/**
 * Configuration specific to web search tools.
 * @public
 */
export interface IAiWebSearchToolConfig {
  readonly type: 'web_search';
  /** Optional: restrict search to these domains. */
  readonly allowedDomains?: ReadonlyArray<string>;
  /** Optional: exclude these domains from search. */
  readonly blockedDomains?: ReadonlyArray<string>;
  /** Optional: max number of searches per request. */
  readonly maxUses?: number;
  /**
   * Optional: enable image understanding during web search.
   * When true, the model can view and analyze images found during search.
   * Currently supported by xAI only; ignored by other providers.
   */
  readonly enableImageUnderstanding?: boolean;
}

/**
 * Union of all server-side tool configurations. Discriminated on `type`.
 * @public
 */
export type AiServerToolConfig = IAiWebSearchToolConfig;

/**
 * Declares a tool as enabled/disabled in provider settings.
 * Tools are disabled by default — consuming apps must opt in explicitly.
 * @public
 */
export interface IAiToolEnablement {
  /** Which tool type. */
  readonly type: AiServerToolType;
  /** Whether this tool is enabled by default for this provider. */
  readonly enabled: boolean;
  /** Optional tool-specific configuration. */
  readonly config?: AiServerToolConfig;
}

// ============================================================================
// Model Specification
// ============================================================================

/**
 * Known context keys for model specification maps.
 * @public
 */
export type ModelSpecKey = 'base' | 'tools' | 'image';

/**
 * All valid {@link ModelSpecKey} values.
 * @public
 */
export const allModelSpecKeys: ReadonlyArray<ModelSpecKey> = ['base', 'tools', 'image'];

/**
 * Default context key used as fallback when resolving a {@link ModelSpec}.
 * @public
 */
export const MODEL_SPEC_BASE_KEY: ModelSpecKey = 'base';

/**
 * A model specification: either a simple model string or a record mapping
 * context keys to nested model specs.
 *
 * @remarks
 * A bare string is equivalent to `{ base: string }`. This keeps the simple
 * case simple while allowing context-aware model selection (e.g. different
 * models for tool-augmented vs. base completions).
 *
 * @example
 * ```typescript
 * // Simple — same model for all contexts:
 * const simple: ModelSpec = 'grok-4-1-fast';
 *
 * // Context-aware — reasoning model when tools are active:
 * const split: ModelSpec = { base: 'grok-4-1-fast', tools: 'grok-4-1-fast-reasoning' };
 *
 * // Future nested — per-tool model selection:
 * const nested: ModelSpec = { base: 'grok-fast', tools: { base: 'grok-r', image: 'grok-v' } };
 * ```
 * @public
 */
export interface IModelSpecMap {
  readonly [key: string]: ModelSpec;
}

/**
 * @public
 */
export type ModelSpec = string | IModelSpecMap;

/**
 * Resolves a {@link ModelSpec} to a concrete model string given an optional context key.
 *
 * @remarks
 * Resolution rules:
 * 1. If the spec is a string, return it directly (context is irrelevant).
 * 2. If the spec is an object and the context key exists, recurse into that branch.
 * 3. Otherwise, fall back to the {@link MODEL_SPEC_BASE_KEY | 'base'} key.
 * 4. If neither context nor `'base'` exists, use the first available value.
 *
 * @param spec - The model specification to resolve
 * @param context - Optional context key (e.g. `'tools'`)
 * @returns The resolved model string
 * @public
 */
export function resolveModel(spec: ModelSpec, context?: string): string {
  if (typeof spec === 'string') {
    return spec;
  }

  // Try the requested context key first
  if (context !== undefined && context in spec) {
    return resolveModel(spec[context]);
  }

  // Fall back to 'base'
  if (MODEL_SPEC_BASE_KEY in spec) {
    return resolveModel(spec[MODEL_SPEC_BASE_KEY]);
  }

  // Last resort: first value in the record
  const first = Object.values(spec)[0];
  /* c8 ignore next 3 - defensive: only reachable with empty object (prevented by converter) */
  if (first === undefined) {
    return '';
  }
  return resolveModel(first);
}

// ============================================================================
// Provider Descriptor
// ============================================================================

/**
 * All known AI provider identifiers.
 * @public
 */
export type AiProviderId =
  | 'copy-paste'
  | 'xai-grok'
  | 'openai'
  | 'anthropic'
  | 'google-gemini'
  | 'groq'
  | 'mistral';

/**
 * API format categories for provider routing.
 * @public
 */
export type AiApiFormat = 'openai' | 'anthropic' | 'gemini';

// ============================================================================
// Completion Response
// ============================================================================

/**
 * Result of an AI provider completion call.
 * @public
 */
export interface IAiCompletionResponse {
  /** The generated text content */
  readonly content: string;
  /** Whether the response was truncated due to token limits */
  readonly truncated: boolean;
}

/**
 * Describes a single AI provider — single source of truth for all metadata.
 * @public
 */
export interface IAiProviderDescriptor {
  /** Provider identifier (e.g. 'xai-grok', 'anthropic') */
  readonly id: AiProviderId;
  /** Human-readable label (e.g. "xAI Grok") */
  readonly label: string;
  /** Button label for action buttons (e.g. "AI Assist | Grok") */
  readonly buttonLabel: string;
  /** Whether this provider requires an API key secret */
  readonly needsSecret: boolean;
  /** Which API adapter format to use */
  readonly apiFormat: AiApiFormat;
  /** Base URL for the API (e.g. 'https://api.x.ai/v1') */
  readonly baseUrl: string;
  /** Default model specification — string or context-aware map. */
  readonly defaultModel: ModelSpec;
  /** Which server-side tools this provider supports (empty = none). */
  readonly supportedTools: ReadonlyArray<AiServerToolType>;
  /** Whether this provider's API enforces CORS restrictions that prevent direct browser calls. */
  readonly corsRestricted: boolean;
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Configuration for a single AI assist provider.
 * @public
 */
export interface IAiAssistProviderConfig {
  /** Which provider this configures */
  readonly provider: AiProviderId;
  /** For API-based providers: the keystore secret name holding the API key */
  readonly secretName?: string;
  /** Optional model override — string or context-aware map. */
  readonly model?: ModelSpec;
  /** Tool enablement/configuration. Tools are disabled unless explicitly enabled. */
  readonly tools?: ReadonlyArray<IAiToolEnablement>;
}

/**
 * AI assist settings — which providers are enabled and their configuration.
 * @public
 */
export interface IAiAssistSettings {
  /** Enabled providers and their configuration. */
  readonly providers: ReadonlyArray<IAiAssistProviderConfig>;
  /** Which enabled provider is the default for the main button. Falls back to first in list. */
  readonly defaultProvider?: AiProviderId;
  /** Optional proxy URL for routing API requests through a backend server (e.g. `http://localhost:3002`). */
  readonly proxyUrl?: string;
  /** When true, route all providers through the proxy. When false (default), only CORS-restricted providers use the proxy. */
  readonly proxyAllProviders?: boolean;
}

/**
 * Default AI assist settings (copy-paste only).
 * @public
 */
export const DEFAULT_AI_ASSIST: IAiAssistSettings = {
  providers: [{ provider: 'copy-paste' }]
};

// ============================================================================
// Keystore Interface
// ============================================================================

/**
 * Minimal keystore interface for AI assist API key resolution.
 * Satisfied structurally by the concrete `KeyStore` class from `@fgv/ts-extras`.
 * @public
 */
export interface IAiAssistKeyStore {
  /** Whether the keystore is currently unlocked */
  readonly isUnlocked: boolean;
  /** Check if a named secret exists */
  hasSecret(name: string): Result<boolean>;
  /** Get an API key by secret name */
  getApiKey(name: string): Result<string>;
}
