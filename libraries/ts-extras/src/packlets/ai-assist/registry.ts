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
 * Centralized provider registry — single source of truth for all AI provider metadata.
 * @packageDocumentation
 */

import { fail, Result, succeed } from '@fgv/ts-utils';

import { type AiProviderId, type IAiProviderDescriptor } from './model';

// ============================================================================
// Built-in providers
// ============================================================================

/**
 * All known AI provider descriptors. Copy-paste first, then alphabetical.
 * @internal
 */
const BUILTIN_PROVIDERS: ReadonlyArray<IAiProviderDescriptor> = [
  {
    id: 'copy-paste',
    label: 'Copy / Paste',
    buttonLabel: 'AI Assist | Copy',
    needsSecret: false,
    apiFormat: 'openai',
    baseUrl: '',
    defaultModel: '',
    supportedTools: []
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    buttonLabel: 'AI Assist | Claude',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-5-20250929',
    supportedTools: ['web_search']
  },
  {
    id: 'google-gemini',
    label: 'Google Gemini',
    buttonLabel: 'AI Assist | Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    supportedTools: ['web_search']
  },
  {
    id: 'groq',
    label: 'Groq',
    buttonLabel: 'AI Assist | Groq',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    supportedTools: []
  },
  {
    id: 'mistral',
    label: 'Mistral',
    buttonLabel: 'AI Assist | Mistral',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    supportedTools: []
  },
  {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'AI Assist | OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    supportedTools: ['web_search']
  },
  {
    id: 'xai-grok',
    label: 'xAI Grok',
    buttonLabel: 'AI Assist | Grok',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: { base: 'grok-4-1-fast', tools: 'grok-4-1-fast-reasoning' },
    supportedTools: ['web_search']
  }
];

/**
 * Index for O(1) lookup by id.
 * @internal
 */
const PROVIDER_BY_ID: ReadonlyMap<string, IAiProviderDescriptor> = new Map(
  BUILTIN_PROVIDERS.map((d) => [d.id, d])
);

// ============================================================================
// Public API
// ============================================================================

/**
 * All valid provider ID values, in the same order as the registry.
 * @public
 */
export const allProviderIds: ReadonlyArray<AiProviderId> = BUILTIN_PROVIDERS.map((d) => d.id);

/**
 * Get all known provider descriptors. Copy-paste first, then alphabetical.
 * @returns All built-in provider descriptors
 * @public
 */
export function getProviderDescriptors(): ReadonlyArray<IAiProviderDescriptor> {
  return BUILTIN_PROVIDERS;
}

/**
 * Get a provider descriptor by id.
 * @param id - The provider identifier
 * @returns The descriptor, or a failure if the provider is unknown
 * @public
 */
export function getProviderDescriptor(id: string): Result<IAiProviderDescriptor> {
  const descriptor = PROVIDER_BY_ID.get(id);
  if (!descriptor) {
    return fail(`unknown AI provider: ${id}`);
  }
  return succeed(descriptor);
}
