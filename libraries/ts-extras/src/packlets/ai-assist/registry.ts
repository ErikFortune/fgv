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

import {
  type AiProviderId,
  type IAiEmbeddingModelCapability,
  type IAiImageModelCapability,
  type IAiModelCapabilityConfig,
  type IAiProviderDescriptor
} from './model';

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
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'unsupported'
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    buttonLabel: 'AI Assist | Claude',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: {
      base: '@anthropic:sonnet', // claude-sonnet-5 (was 'claude-sonnet-4-5-20250929')
      advanced: '@anthropic:opus' // claude-opus-4-8
      // no frontier key → a frontier request cascades advanced → opus (see resolveModel)
    },
    aliases: {
      '@anthropic:sonnet': 'claude-sonnet-5', // base tier
      '@anthropic:opus': 'claude-opus-4-8', // advanced tier
      '@anthropic:haiku': 'claude-haiku-4-5-20251001', // NON-tier alias; modelOverride only
      '@anthropic:fable': 'claude-fable-5' // NON-tier alias; modelOverride only
      // NOTE: no thinking/image/embedding keys — Anthropic completions are all text; base
      // (sonnet-5) and advanced (opus-4-8) are both thinking-capable, so a thinking-context
      // call flat-falls to base safely.
    },
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    thinkingMode: 'optional'
  },
  {
    id: 'google-gemini',
    label: 'Google Gemini',
    buttonLabel: 'AI Assist | Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: {
      base: '@google-gemini:flash',
      image: '@google-gemini:flash-image',
      embedding: '@google-gemini:embedding'
    },
    aliases: {
      // NOTE: the base flash line is at 3.5 while pro / flash-lite / flash-image are at 3.1 — this is
      // NOT a typo. The targets come verbatim from Google's official deprecation table: the flash base
      // line advanced to 3.5 while the other roles are on the 3.1 generation. The per-role version
      // split is exactly why the alias layer exists — consumers never see these numbers.
      '@google-gemini:flash': 'gemini-3.5-flash', // base (was gemini-2.5-flash, shutdown 2026-10-16)
      '@google-gemini:pro': 'gemini-3.1-pro-preview', // advanced-tier role (wired to the 'advanced' defaultModel key in B4); reachable via modelOverride until then (was gemini-2.5-pro, 2026-10-16)
      '@google-gemini:flash-lite': 'gemini-3.1-flash-lite', // cheaper thinking-capable line; available via modelOverride only (was gemini-2.5-flash-lite, 2026-10-16)
      '@google-gemini:flash-image': 'gemini-3.1-flash-image-preview', // image (was gemini-2.5-flash-image, 2026-10-02)
      '@google-gemini:embedding': 'gemini-embedding-001' // NOT deprecated — aliased for uniformity only
    },
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    thinkingMode: 'optional',
    embedding: [
      {
        modelPrefix: '',
        format: 'gemini-embeddings',
        supportsDimensions: true,
        supportsTaskType: true,
        defaultDimensions: 3072
      }
    ],
    imageGeneration: [
      {
        // Gemini Flash Image: chat-style generateContent
        modelPrefix: '',
        format: 'gemini-image-out',
        acceptsImageReferenceInput: true,
        supportsQualityParam: false,
        maxCount: 1,
        outputParamStyle: 'none',
        defaultOutputMimeType: 'image/jpeg'
      }
    ]
  },
  {
    id: 'groq',
    label: 'Groq',
    buttonLabel: 'AI Assist | Groq',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'unsupported'
  },
  {
    id: 'mistral',
    label: 'Mistral',
    buttonLabel: 'AI Assist | Mistral',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: { base: 'mistral-large-latest', embedding: 'mistral-embed' },
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'unsupported',
    embedding: [{ modelPrefix: '', format: 'openai-embeddings' }]
  },
  {
    id: 'ollama',
    label: 'Ollama (self-hosted)',
    buttonLabel: 'AI Assist | Ollama',
    needsSecret: false,
    apiFormat: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: '',
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'unsupported',
    embedding: [{ modelPrefix: '', format: 'openai-embeddings' }]
  },
  {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'AI Assist | OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: {
      base: '@openai:mini', // gpt-5.4-mini (was 'gpt-4o' — EOL-behind)
      advanced: '@openai:flagship', // gpt-5.5
      frontier: '@openai:pro', // gpt-5.5-pro (may be access-gated — canary)
      image: '@openai:image', // gpt-image-1.5 (was 'dall-e-3' — EOL 2026-05-12)
      embedding: '@openai:embedding' // text-embedding-3-small (unchanged, aliased for uniformity)
    },
    aliases: {
      '@openai:mini': 'gpt-5.4-mini', // base tier
      '@openai:flagship': 'gpt-5.5', // advanced tier
      '@openai:pro': 'gpt-5.5-pro', // frontier tier (may be access-gated — canary)
      '@openai:nano': 'gpt-5.4-nano', // NON-tier alias; modelOverride only
      '@openai:image': 'gpt-image-1.5', // image (matches the gpt-image- capability prefix)
      '@openai:embedding': 'text-embedding-3-small' // NOT deprecated — aliased for uniformity
      // NOTE: gpt-5.1 deliberately absent — retired March 2026.
    },
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    thinkingMode: 'optional',
    embedding: [
      {
        modelPrefix: 'text-embedding-3',
        format: 'openai-embeddings',
        supportsDimensions: true,
        maxBatchSize: 2048
      },
      {
        modelPrefix: '',
        format: 'openai-embeddings'
      }
    ],
    imageGeneration: [
      {
        modelPrefix: 'gpt-image-',
        format: 'openai-images',
        acceptsImageReferenceInput: true,
        acceptedSizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],
        supportsQualityParam: true,
        acceptedQualities: ['low', 'medium', 'high', 'auto'],
        maxCount: 10,
        outputParamStyle: 'output-format',
        defaultOutputMimeType: 'image/png'
      },
      {
        modelPrefix: '',
        format: 'openai-images',
        outputParamStyle: 'response-format',
        defaultOutputMimeType: 'image/png'
      }
    ]
  },
  {
    id: 'openai-compat',
    label: 'OpenAI-compatible (self-hosted)',
    buttonLabel: 'AI Assist | OpenAI-compat',
    needsSecret: false,
    apiFormat: 'openai',
    baseUrl: '',
    defaultModel: '',
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'unsupported',
    embedding: [{ modelPrefix: '', format: 'openai-embeddings' }]
  },
  {
    id: 'xai-grok',
    label: 'xAI Grok',
    buttonLabel: 'AI Assist | Grok',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: {
      base: 'grok-4.3',
      image: 'grok-imagine-image-quality'
    },
    supportedTools: ['web_search'],
    corsRestricted: true,
    streamingCorsRestricted: true,
    acceptsImageInput: true,
    thinkingMode: 'optional',
    imageGeneration: [
      {
        // grok-imagine models use JSON edits with image_url objects (different wire format)
        modelPrefix: 'grok-imagine-',
        format: 'xai-images-edits',
        acceptsImageReferenceInput: true,
        supportsQualityParam: false,
        maxCount: 10,
        outputParamStyle: 'response-format',
        defaultOutputMimeType: 'image/jpeg'
      },
      {
        // catch-all for other xai image models
        modelPrefix: '',
        format: 'xai-images',
        acceptsImageReferenceInput: false,
        supportsQualityParam: false,
        maxCount: 10,
        outputParamStyle: 'response-format',
        defaultOutputMimeType: 'image/jpeg'
      }
    ]
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

/**
 * Whether a provider declares any image-generation capability at all.
 *
 * @param descriptor - The provider descriptor
 * @returns `true` when {@link IAiProviderDescriptor.imageGeneration} has at
 *   least one entry; `false` otherwise.
 * @public
 */
export function supportsImageGeneration(descriptor: IAiProviderDescriptor): boolean {
  return (descriptor.imageGeneration?.length ?? 0) > 0;
}

/**
 * Resolve the image-generation capability that applies to a given model id
 * for a provider. Returns the entry from
 * {@link IAiProviderDescriptor.imageGeneration} whose `modelPrefix` is the
 * longest prefix of `modelId`. Ties are broken by first-encountered, so rule
 * order does not matter for correctness — only for tie-breaking among rules
 * with identical-length prefixes (an unusual case).
 *
 * @param descriptor - The provider descriptor
 * @param modelId - The resolved image model id
 * @returns The matching capability, or `undefined` when no rule matches or
 *   the provider declares no image-generation capabilities.
 * @public
 */
export function resolveImageCapability(
  descriptor: IAiProviderDescriptor,
  modelId: string
): IAiImageModelCapability | undefined {
  return (descriptor.imageGeneration ?? [])
    .filter((cap) => modelId.startsWith(cap.modelPrefix))
    .reduce<IAiImageModelCapability | undefined>(
      (best, cap) => (best && best.modelPrefix.length >= cap.modelPrefix.length ? best : cap),
      undefined
    );
}

/**
 * Whether a provider declares any embedding capability at all.
 *
 * @param descriptor - The provider descriptor
 * @returns `true` when {@link IAiProviderDescriptor.embedding} has at least one
 *   entry; `false` otherwise.
 * @public
 */
export function supportsEmbedding(descriptor: IAiProviderDescriptor): boolean {
  return (descriptor.embedding?.length ?? 0) > 0;
}

/**
 * Resolve the embedding capability that applies to a given model id for a
 * provider. Returns the entry from {@link IAiProviderDescriptor.embedding} whose
 * `modelPrefix` is the longest prefix of `modelId`. Ties are broken by
 * first-encountered.
 *
 * @param descriptor - The provider descriptor
 * @param modelId - The resolved embedding model id
 * @returns The matching capability, or `undefined` when no rule matches or the
 *   provider declares no embedding capabilities.
 * @public
 */
export function resolveEmbeddingCapability(
  descriptor: IAiProviderDescriptor,
  modelId: string
): IAiEmbeddingModelCapability | undefined {
  return (descriptor.embedding ?? [])
    .filter((cap) => modelId.startsWith(cap.modelPrefix))
    .reduce<IAiEmbeddingModelCapability | undefined>(
      (best, cap) => (best && best.modelPrefix.length >= cap.modelPrefix.length ? best : cap),
      undefined
    );
}

// ============================================================================
// Default model capability config
// ============================================================================

/**
 * Default capability config used by `callProviderListModels` when callers
 * don't supply their own. Patterns are intentionally narrow — false
 * positives are worse than missing a model. Caller can override per call
 * via {@link IProviderListModelsParams.capabilityConfig}.
 *
 * @public
 */
export const DEFAULT_MODEL_CAPABILITY_CONFIG: IAiModelCapabilityConfig = {
  perProvider: {
    openai: [
      { idPattern: /^gpt-image/, capabilities: ['image-generation'] },
      { idPattern: /^text-embedding/, capabilities: ['embedding'] },
      { idPattern: /^gpt-5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^gpt-4/, capabilities: ['chat', 'tools', 'vision'] },
      { idPattern: /^gpt-3\.5/, capabilities: ['chat'] },
      { idPattern: /^o\d/, capabilities: ['chat', 'tools', 'thinking'] }
    ],
    'xai-grok': [
      { idPattern: /-image/, capabilities: ['image-generation'] },
      { idPattern: /^grok-4\.3/, capabilities: ['chat', 'tools', 'thinking'] },
      { idPattern: /^grok-4$/, capabilities: ['chat', 'tools', 'thinking'] },
      { idPattern: /^grok-4/, capabilities: ['chat', 'tools', 'vision'] },
      { idPattern: /^grok-3-mini/, capabilities: ['chat', 'tools', 'thinking'] },
      { idPattern: /^grok-3/, capabilities: ['chat', 'tools'] },
      { idPattern: /^grok-2/, capabilities: ['chat', 'vision'] }
    ],
    'google-gemini': [
      { idPattern: /^imagen/, capabilities: ['image-generation'] },
      { idPattern: /^gemini-.*-image/, capabilities: ['image-generation'] },
      { idPattern: /embedding/, capabilities: ['embedding'] },
      { idPattern: /^gemini-3/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^gemini-2\.5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^gemini-/, capabilities: ['chat', 'tools', 'vision'] }
    ],
    anthropic: [
      // Broadened from /^claude-opus-4/ and /^claude-sonnet-4/ so the sonnet-5+ / opus-5+ lines
      // are detected as thinking-capable. Detection accumulates across matching rules, so this is
      // purely additive: every existing opus-4 / sonnet-4 id still matches. The sonnet broadening
      // is required (claude-sonnet-5 otherwise hits only /^claude-/ and loses thinking); the opus
      // broadening is future-proofing (claude-opus-4-8 already matches /^claude-opus-4/).
      { idPattern: /^claude-opus-/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^claude-sonnet-/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^claude-/, capabilities: ['chat', 'tools', 'vision'] }
    ],
    groq: [{ idPattern: /./, capabilities: ['chat'] }],
    mistral: [
      { idPattern: /embed/, capabilities: ['embedding'] },
      { idPattern: /./, capabilities: ['chat'] }
    ],
    // Self-hosted OpenAI-compatible servers (Ollama, LM Studio, llama.cpp) serve
    // arbitrary, caller-chosen models whose ids we can't enumerate ahead of time.
    // The catch-all `/./` intentionally departs from the "narrow patterns" rule
    // above: assume `chat` for everything and let the caller override via
    // `capabilityConfig` when they know their deployment serves image/embedding models.
    ollama: [{ idPattern: /./, capabilities: ['chat'] }],
    'openai-compat': [{ idPattern: /./, capabilities: ['chat'] }]
  }
};
