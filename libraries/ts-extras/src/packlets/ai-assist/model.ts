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
 * Core types for AI assist: prompt class, provider descriptors, and chat messages.
 * @packageDocumentation
 */

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
 * API format categories for provider routing.
 * @public
 */
export type AiApiFormat = 'openai' | 'anthropic' | 'gemini';

/**
 * Describes a single AI provider — single source of truth for all metadata.
 * @public
 */
export interface IAiProviderDescriptor {
  /** Provider identifier (e.g. 'xai-grok', 'anthropic') */
  readonly id: string;
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
