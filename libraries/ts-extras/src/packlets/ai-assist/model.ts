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
  /** Default model identifier (e.g. 'grok-4-1-fast') */
  readonly defaultModel: string;
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
  /** Optional model override (provider has a default) */
  readonly model?: string;
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
