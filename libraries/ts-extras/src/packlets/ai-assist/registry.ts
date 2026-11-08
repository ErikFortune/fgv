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
  type IAiProviderDescriptor,
  type ModelSpec,
  type ModelSpecKey,
  resolveModelAlias,
  resolveProviderModel
} from './model';
import type { IAiStructuredOutputCapability } from './structuredOutputTypes';

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
    acceptsImageInput: false
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    buttonLabel: 'AI Assist | Claude',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: {
      base: '@anthropic:sonnet', // claude-sonnet-5-5 (was claude-sonnet-5; before that 'claude-sonnet-4-5-20250929')
      advanced: '@anthropic:opus' // claude-opus-5-5
      // no frontier key → a frontier request cascades advanced → opus (see resolveModel)
    },
    aliases: {
      // base tier (was claude-sonnet-5, same price and still Active, retirement not sooner than
      // 2027-06-30). claude-sonnet-5-5 rejects a forced tool_choice, so it is on the
      // `anthropic-output-format` line below.
      '@anthropic:sonnet': 'claude-sonnet-5-5',
      // advanced tier (was claude-opus-5, held there in 2026-09 because claude-opus-5-5 400s on a
      // forced tool_choice; rotated once `anthropic-output-format` below gave it a non-forcing
      // structured-output mechanism. claude-opus-5 stays Active, retirement not sooner than 2027-07-24)
      '@anthropic:opus': 'claude-opus-5-5',
      // NON-tier alias; modelOverride only (was claude-haiku-4-5-20251001, still Active but past its
      // "not sooner than 2026-10-15" retirement date). claude-haiku-5-5 is adaptive-only and accepts
      // a forced tool_choice.
      '@anthropic:haiku': 'claude-haiku-5-5',
      // NON-tier alias; modelOverride only (was claude-fable-5, held for the same forced-tool_choice
      // reason and rotated with opus; claude-fable-5 stays Active, not sooner than 2027-06-09)
      '@anthropic:fable': 'claude-fable-5-1'
      // NOTE: no thinking/image/embedding keys — Anthropic completions are all text; base
      // (sonnet-5-5) and advanced (opus-5-5) are both thinking-capable, so a thinking-context
      // call flat-falls to base safely.
    },
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    // Claude 5 family requires the adaptive thinking wire shape (thinking.type: 'adaptive' +
    // output_config.effort) and 400s on the legacy thinking.type: 'enabled' + budget_tokens
    // shape; see AiAssist.isAdaptiveThinkingModel. The dash-bounded match also covers
    // claude-opus-5-5, claude-fable-5-1 and claude-sonnet-5-5, which are adaptive-only as well.
    // claude-haiku-5-5 ("Manual extended thinking returns an error",
    // https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5, fetched 2026-11-08) is
    // listed by its own id: claude-haiku-4-5 keeps the budget shape, and no page states a family rule.
    // claude-mythos-5 (and so claude-mythos-5-1): the per-model table on
    // https://platform.claude.com/docs/en/build-with-claude/thinking (fetched 2026-11-08) lists both
    // Mythos 5 and Mythos 5.1 as "Adaptive thinking" with no `thinking` field and a "400 error" for
    // "enabled" with budget_tokens.
    adaptiveThinkingModelPrefixes: [
      'claude-sonnet-5',
      'claude-opus-5',
      'claude-fable-5',
      'claude-mythos-5',
      'claude-haiku-5-5'
    ],
    // A generic effort 'none' sends `thinking: {type: 'disabled'}` to an adaptive model, because it
    // thinks by default. These reject 'disabled' ("400 error" in the "disabled" column of the
    // per-model table, https://platform.claude.com/docs/en/build-with-claude/thinking, fetched
    // 2026-11-08: "Claude Fable 5.1, Claude Mythos 5.1, Claude Fable 5, Claude Mythos 5, Claude Opus
    // 5.5, and Claude Mythos Preview reject `thinking: {type: "disabled"}`", and Claude Sonnet 5.5
    // "rejects `thinking: {type: "disabled"}` with a 400 error"), so 'none' is sent as 'low' there,
    // or refused. claude-opus-5, claude-sonnet-5 and claude-haiku-5-5 accept it (Opus 5 and Haiku 5.5
    // "at `high` effort or below"; a 'none' sends no effort, and their defaults are high and medium).
    thinkingRequiredModelPrefixes: [
      'claude-opus-5-5',
      'claude-sonnet-5-5',
      'claude-fable-5',
      'claude-mythos-5'
    ],
    // "On Claude Fable 5.1, Claude Mythos 5.1, Claude Fable 5, Claude Mythos 5, Claude Mythos Preview,
    // Claude Opus 5.5, Claude Opus 5, Claude Opus 4.8, Claude Opus 4.7, Claude Sonnet 5.5, Claude
    // Sonnet 5, and Claude Haiku 5.5, non-default `temperature`, `top_p`, or `top_k` values return a
    // 400 error on every request, regardless of whether thinking is used"
    // (https://platform.claude.com/docs/en/build-with-claude/thinking, fetched 2026-11-08). The
    // dash-bounded entries cover each 5.x point release named there.
    samplingParamsRejectedModelPrefixes: [
      'claude-fable-5',
      'claude-mythos-5',
      'claude-opus-5',
      'claude-opus-4-8',
      'claude-opus-4-7',
      'claude-sonnet-5',
      'claude-haiku-5-5'
    ],
    // Two mechanisms, split by what each line accepts. claude-opus-5-5, claude-fable-5-1,
    // claude-mythos-5-1 and claude-sonnet-5-5 return a 400 on a forced tool_choice ({type:'any'} /
    // {type:'tool'}): "Forced tool use is not supported",
    // https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5 and
    // https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1 ("Claude Fable
    // 5.1 and Claude Mythos 5.1 don't support forced tool use") (fetched 2026-09-25), and
    // https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5 ("Claude Sonnet 5.5
    // doesn't support forced tool use", fetched 2026-11-08). They get JSON outputs
    // (`output_config.format`), which all four are listed as supporting on
    // https://platform.claude.com/docs/en/build-with-claude/structured-outputs. Every other line
    // keeps forced tool use under the catch-all, including claude-haiku-5-5 ("accepts a forced
    // `tool_choice`", its migration guide, fetched 2026-11-08): the '' entry is only correct because
    // the longer prefixes win for the lines that reject it (longest prefix wins; array order does
    // not matter).
    // A future line that rejects forcing must be added here, or it inherits the catch-all's 400.
    structuredOutput: [
      { modelPrefix: 'claude-opus-5-5', format: 'anthropic-output-format' },
      { modelPrefix: 'claude-fable-5-1', format: 'anthropic-output-format' },
      { modelPrefix: 'claude-mythos-5-1', format: 'anthropic-output-format' },
      { modelPrefix: 'claude-sonnet-5-5', format: 'anthropic-output-format' },
      { modelPrefix: '', format: 'anthropic-tool-forced' }
    ],
    // Synchronous Messages API limits ("Max output: 128K tokens"; Haiku 4.5 "64K tokens"), each from
    // the model's page under platform.claude.com/docs/en/models, or for Sonnet 5.5 and Haiku 5.5 the
    // models overview, fetched 2026-11-08. K is read as 1,000, as those docs use it. The 300k
    // Batch-API limit needs a beta header on a batch endpoint ai-assist does not use, so it is not
    // recorded. One entry per model id a page names: limits are never inherited by a sibling id
    // or a snapshot.
    maxOutputTokens: [
      { modelId: 'claude-fable-5-1', maxOutputTokens: 128000 },
      { modelId: 'claude-fable-5', maxOutputTokens: 128000 },
      { modelId: 'claude-mythos-5-1', maxOutputTokens: 128000 },
      { modelId: 'claude-mythos-5', maxOutputTokens: 128000 },
      { modelId: 'claude-opus-5-5', maxOutputTokens: 128000 },
      { modelId: 'claude-opus-5', maxOutputTokens: 128000 },
      { modelId: 'claude-sonnet-5-5', maxOutputTokens: 128000 },
      { modelId: 'claude-sonnet-5', maxOutputTokens: 128000 },
      { modelId: 'claude-haiku-5-5', maxOutputTokens: 128000 },
      // the page names both the alias claude-haiku-4-5 and the snapshot claude-haiku-4-5-20251001
      { modelId: 'claude-haiku-4-5', maxOutputTokens: 64000 },
      { modelId: 'claude-haiku-4-5-20251001', maxOutputTokens: 64000 }
    ]
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
      advanced: '@google-gemini:pro', // reuses the existing @google-gemini:pro alias (no new alias entry)
      image: '@google-gemini:flash-image',
      embedding: '@google-gemini:embedding'
      // no frontier key → a frontier request cascades advanced → pro (see resolveModel)
    },
    aliases: {
      // NOTE: the base flash line is at 3.8, flash-lite at 3.5 and pro at 3.1 — this is NOT a typo.
      // Google's models page recommends "3.5 Flash-Lite or 3.8 Flash" for new projects and lists no
      // Pro newer than 3.1. Its newer flagship, gemini-4-argon, is not the pro target yet: Gemini 4
      // requires `thinkingLevel` and deprecates the `thinkingBudget` field this adapter sends
      // (https://ai.google.dev/gemini-api/docs/thinking?generate-content=true, fetched 2026-11-08).
      // The per-role version split is exactly why the alias layer exists — consumers never see
      // these numbers.
      // The 2026-10-16 shutdown recorded below for the 2.5 line has since been withdrawn: Google now
      // lists 2.5 as "not deprecated", served to existing users only (as of 2026-09-24).
      '@google-gemini:flash': 'gemini-3.8-flash', // base (was gemini-3.5-flash, no shutdown announced as of 2026-09-24; before that gemini-2.5-flash, then slated for 2026-10-16). NOTE: 3.8 Flash thinking levels are low/medium/high — no 'minimal'
      '@google-gemini:pro': 'gemini-3.1-pro-preview', // advanced-tier role (wired to the 'advanced' defaultModel key); also the frontier cascade target (was gemini-2.5-pro, then slated for 2026-10-16)
      '@google-gemini:flash-lite': 'gemini-3.5-flash-lite', // cheaper thinking-capable line; available via modelOverride only (was gemini-3.1-flash-lite, shutdown 2027-05-07; before that gemini-2.5-flash-lite)
      // image (was gemini-3.1-flash-image, Stable; before that gemini-3.1-flash-image-preview, retired
      // 2026-06-25). Nano Banana 2.1 is "An update to Nano Banana 2 (Gemini 3.1 Flash Image)" with
      // "Flash-level speed and cost efficiency", on the same generateContent image-out wire.
      '@google-gemini:flash-image': 'gemini-nano-banana-2.1',
      '@google-gemini:embedding': 'gemini-embedding-001' // NOT deprecated — aliased for uniformity only
    },
    supportedTools: ['web_search'],
    // `generateContent` HTTP-400s (INVALID_ARGUMENT) when built-in grounding
    // (`web_search` → `google_search`) and `function_declarations` are combined in
    // one request. The only descriptor in the registry that declares an exclusion;
    // keep it that way deliberately — a new entry here changes what a host gets
    // back without the host changing anything, so it wants the same evidence a
    // capability claim wants.
    serverToolsExclusiveWithClientTools: ['web_search'],
    // Reject thinkingBudget 0. gemini-3.1-pro-preview: live 400 "Budget 0 is invalid. This model
    // only works in thinking mode." (2026-09-25); Google's thinking page lists its levels as
    // low/medium/high. gemini-2.5-pro: IGeminiThinkingConfig.thinkingBudget documents 0 as
    // erroring on Pro.
    thinkingRequiredModelPrefixes: ['gemini-3.1-pro-preview', 'gemini-2.5-pro'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    // Gemini carries the constraint inside `generationConfig`
    // (responseMimeType + responseSchema), uniform across the family.
    structuredOutput: [{ modelPrefix: '', format: 'gemini-response-schema' }],
    // "Output token limit 65,536" on each model's page under ai.google.dev/gemini-api/docs/models
    // (served from aistudio.google.com/docs/models), fetched 2026-11-08. Completion alias targets only.
    maxOutputTokens: [
      { modelId: 'gemini-3.8-flash', maxOutputTokens: 65536 },
      { modelId: 'gemini-3.5-flash-lite', maxOutputTokens: 65536 },
      { modelId: 'gemini-3.1-pro-preview', maxOutputTokens: 65536 }
    ],
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
    // Was llama-3.3-70b-versatile, shut down 2026-08-16 for free and developer tiers; Groq's
    // deprecations page names openai/gpt-oss-120b as its replacement (https://console.groq.com/docs/deprecations,
    // fetched 2026-11-08). Text in and out, so acceptsImageInput stays false.
    defaultModel: 'openai/gpt-oss-120b',
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    // "MAX OUTPUT TOKENS 65,536" on https://console.groq.com/docs/model/openai/gpt-oss-120b, fetched
    // 2026-11-08.
    maxOutputTokens: [{ modelId: 'openai/gpt-oss-120b', maxOutputTokens: 65536 }]
  },
  {
    id: 'mistral',
    label: 'Mistral',
    buttonLabel: 'AI Assist | Mistral',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    // base was mistral-large-latest, which Mistral's Large 3 page still lists as a name of the
    // deprecated mistral-large-2512 (retires 2027-04-30, alternative Mistral Large 4). mistral-large-4
    // is the GA "model-name-major" alias the Large 4 page sends (https://docs.mistral.ai/models/mistral-large-4-0,
    // fetched 2026-11-08). That page states no maximum output, so no limit is recorded.
    defaultModel: { base: 'mistral-large-4', embedding: 'mistral-embed' },
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }],
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
      base: '@openai:mini', // gpt-6-luna (was gpt-5.6-luna; before that gpt-5.4-mini, and 'gpt-4o' — EOL-behind)
      advanced: '@openai:flagship', // gpt-6.1-sol
      // The gpt-6 family, like gpt-5.6 before it, works on BOTH Chat Completions and the
      // Responses API, so the frontier tier needs no Responses-only routing. gpt-5.5-pro (an
      // earlier frontier target) remains Responses-API-only and reachable via modelOverride; the
      // `responsesOnlyModelPrefixes` marker below still routes it correctly.
      frontier: '@openai:pro', // gpt-6-astra
      image: '@openai:image', // gpt-image-2.5-sunburst (was gpt-image-2; before that gpt-image-1.5, and 'dall-e-3' — EOL 2026-05-12)
      embedding: '@openai:embedding' // text-embedding-3-small (unchanged, aliased for uniformity)
    },
    aliases: {
      // The GPT-6 line reuses the 5.6 names (sol, luna) at DIFFERENT rungs: 5.6 ran luna < terra < sol,
      // 6 runs luna < sol < astra, and 6.1 adds gpt-6.1-terra ($1/$5) between luna and sol, with no
      // alias. So `@openai:flagship` names the Sol rung (now gpt-6.1-sol) and `@openai:pro` names
      // gpt-6-astra. The alias names are role names, not OpenAI's labels — OpenAI itself calls
      // gpt-6-astra "our flagship model".
      '@openai:mini': 'gpt-6-luna', // base tier (was gpt-5.6-luna, no shutdown announced as of 2026-09-24; before that gpt-5.4-mini)
      // advanced tier (was gpt-6-sol, same $2/$10 rung and not deprecated — its page says "See GPT-6.1
      // Sol for the newer Sol model"; before that gpt-5.6-terra, then gpt-5.5). NOTE: gpt-6.1-sol's
      // reasoning.effort is low..max — it has no 'none'
      '@openai:flagship': 'gpt-6.1-sol',
      '@openai:pro': 'gpt-6-astra', // frontier tier (was gpt-5.6-sol, no shutdown announced as of 2026-09-24; before that gpt-5.5-pro, Responses-API-only). NOTE: astra's reasoning.effort is low..max — it has no 'none'
      // NON-tier alias; modelOverride only (was gpt-5.4-nano, deprecated 2026-10-01 with shutdown
      // 2027-04-01 and gpt-6-luna named as its replacement). GPT-6 has nothing below Luna, so this
      // now names the same model as `@openai:mini`.
      '@openai:nano': 'gpt-6-luna',
      '@openai:image': 'gpt-image-2.5-sunburst', // image (matches the gpt-image- capability prefix; was gpt-image-2 — itself not deprecated; before that gpt-image-1.5, which shuts down 2026-12-01)
      '@openai:embedding': 'text-embedding-3-small' // NOT deprecated — aliased for uniformity
      // NOTE: gpt-5.1 deliberately absent — deprecated, shutdown 2027-04-01.
    },
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    responsesOnlyModelPrefixes: ['gpt-5.5-pro'],
    // Reject reasoning_effort 'none'. gpt-6-astra: model page lists effort low..max, and a live
    // call returned 400 "'reasoning_effort' does not support 'none' with this model" (2026-09-25).
    // gpt-6.1-sol: its page lists "reasoning.effort supports low, medium (default), high, xhigh, and
    // max" (fetched 2026-11-08); gpt-6-sol, which lists 'none', is not matched.
    thinkingRequiredModelPrefixes: ['gpt-6-astra', 'gpt-6.1-sol'],
    // "When reasoning effort is not none, remove temperature, top_p, and top_logprobs"
    // (https://developers.openai.com/api/docs/guides/latest-model, fetched 2026-11-08). These two
    // have no 'none' effort, so they reject temperature on every request. gpt-6-luna and gpt-6-sol
    // accept it only when the call sets effort 'none' (their default is medium), which is not a
    // per-model rule and is not declared here.
    samplingParamsRejectedModelPrefixes: ['gpt-6-astra', 'gpt-6.1-sol'],
    // Declared once for the whole line. The Chat-Completions-vs-Responses split is
    // NOT declared here on purpose: the route depends on whether the call carries
    // server tools as well as on the model, so the same model takes both endpoints
    // on different calls. The dispatcher supplies that axis; a second declaration
    // of it here could only ever disagree.
    structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }],
    // "128,000 max output tokens" on each model's page at developers.openai.com/api/docs/models,
    // fetched 2026-11-08. One entry per completion model id the pages name, including
    // gpt-5.4-nano's listed snapshot gpt-5.4-nano-2026-03-17.
    maxOutputTokens: [
      { modelId: 'gpt-6-luna', maxOutputTokens: 128000 },
      { modelId: 'gpt-6.1-sol', maxOutputTokens: 128000 },
      { modelId: 'gpt-6-sol', maxOutputTokens: 128000 },
      { modelId: 'gpt-6-astra', maxOutputTokens: 128000 },
      { modelId: 'gpt-5.4-nano', maxOutputTokens: 128000 },
      { modelId: 'gpt-5.4-nano-2026-03-17', maxOutputTokens: 128000 }
    ],
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
      base: '@xai-grok:standard', // grok-4.3 (was the raw id; the cheap line + retirement-wave redirect target)
      advanced: '@xai-grok:flagship', // grok-4.7 ($2/$6, same advanced band as grok-4.5 before it)
      image: '@xai-grok:imagine' // grok-imagine-image-2.0 (was grok-imagine-image-quality; before that the raw id)
      // no frontier key → a frontier request cascades advanced → grok-4.7 (see resolveModel)
    },
    aliases: {
      '@xai-grok:standard': 'grok-4.3', // base tier; NOT deprecated (as of 2026-09-24) — superseded as flagship by grok-4.5, then grok-4.7
      '@xai-grok:flagship': 'grok-4.7', // advanced tier; reasoning effort low..xhigh, default high (was grok-4.5, no retirement announced as of 2026-09-24)
      '@xai-grok:imagine': 'grok-imagine-image-2.0' // image tier (was grok-imagine-image-quality, retired 2026-11-02 — after that its slug redirects to grok-imagine-image-2.0 at quality 'low')
    },
    supportedTools: ['web_search'],
    corsRestricted: true,
    streamingCorsRestricted: true,
    acceptsImageInput: true,
    // Reject reasoning_effort 'none'. All three model pages list efforts low..xhigh; grok-4.7 also
    // returned a live 400 "This model does not support `reasoning_effort` value `none`"
    // (2026-09-25). grok-4.3 lists 'none' and accepts it.
    thinkingRequiredModelPrefixes: ['grok-4.7', 'grok-4.6', 'grok-4.5'],
    structuredOutput: [{ modelPrefix: '', format: 'openai-json-schema' }],
    imageGeneration: [
      {
        // grok-imagine-image-2.0 is the only xAI image model that accepts `quality`
        // (low | medium | auto; auto is the default when omitted). Otherwise identical to the
        // grok-imagine- family entry below.
        modelPrefix: 'grok-imagine-image-2.0',
        format: 'xai-images-edits',
        acceptsImageReferenceInput: true,
        supportsQualityParam: true,
        acceptedQualities: ['low', 'medium', 'auto'],
        maxCount: 10,
        outputParamStyle: 'response-format',
        defaultOutputMimeType: 'image/jpeg'
      },
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
 * Shared longest-prefix capability match, alias-guarded.
 *
 * @remarks
 * `modelId` is resolved through `resolveModelAlias` **before** any prefix
 * matching, so an fgv alias (`@<provider>:<role>`) and the concrete id it names
 * select the same capability. Without this step an alias would fall through to
 * the `modelPrefix: ''` catch-all every provider declares and yield a
 * confidently wrong capability rather than no capability.
 *
 * An unresolvable alias (sigil-prefixed but unregistered, or cyclic) names no
 * model, so no capability applies and the match is skipped entirely — it must
 * never be prefix-matched verbatim. Callers already treat `undefined` as "this
 * provider has no capability for this model" and fail with that message.
 *
 * A concrete (non-sigil) id passes through `resolveModelAlias` verbatim, so
 * behavior for every raw provider id is unchanged.
 * @internal
 */
function resolveCapabilityForModel<TCapability extends { readonly modelPrefix: string }>(
  descriptor: IAiProviderDescriptor,
  modelId: string,
  capabilities: ReadonlyArray<TCapability> | undefined
): TCapability | undefined {
  const concreteModelId = resolveModelAlias(descriptor, modelId).orDefault();
  if (concreteModelId === undefined) {
    return undefined;
  }
  return (capabilities ?? [])
    .filter((cap) => concreteModelId.startsWith(cap.modelPrefix))
    .reduce<TCapability | undefined>(
      (best, cap) => (best && best.modelPrefix.length >= cap.modelPrefix.length ? best : cap),
      undefined
    );
}

/**
 * Resolve the image-generation capability that applies to a given model id
 * for a provider. Returns the entry from
 * {@link IAiProviderDescriptor.imageGeneration} whose `modelPrefix` is the
 * longest prefix of `modelId`. Ties are broken by first-encountered, so rule
 * order does not matter for correctness — only for tie-breaking among rules
 * with identical-length prefixes (an unusual case).
 *
 * @remarks
 * `modelId` may be either a concrete provider model id or an fgv model alias
 * (`@<provider>:<role>`, see `MODEL_ALIAS_SIGIL`) — it is resolved via
 * `resolveModelAlias` against `descriptor.aliases` before prefix matching,
 * so both forms select the same capability. A raw provider id passes through
 * unchanged. An alias that is not registered on `descriptor` (or is cyclic)
 * names no model and yields `undefined` rather than falling through to the
 * `modelPrefix: ''` catch-all.
 *
 * @param descriptor - The provider descriptor
 * @param modelId - The image model id — concrete or an fgv alias
 * @returns The matching capability, or `undefined` when no rule matches, the
 *   provider declares no image-generation capabilities, or `modelId` is an
 *   unresolvable alias.
 * @public
 */
export function resolveImageCapability(
  descriptor: IAiProviderDescriptor,
  modelId: string
): IAiImageModelCapability | undefined {
  return resolveCapabilityForModel(descriptor, modelId, descriptor.imageGeneration);
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
 * The structured-output capability for `modelId` under `descriptor`, or
 * `undefined` when the model can enforce nothing.
 *
 * @remarks
 * Alias-first, exactly like its `imageGeneration` / `embedding` siblings — an
 * unresolved alias returns `undefined` rather than prefix-matching a catch-all
 * `modelPrefix: ''`, which is the defect this helper was written to prevent.
 *
 * @param descriptor - The provider descriptor.
 * @param modelId - A concrete model id or an `@provider:role` alias.
 * @public
 */
export function resolveStructuredOutputCapability(
  descriptor: IAiProviderDescriptor,
  modelId: string
): IAiStructuredOutputCapability | undefined {
  return resolveCapabilityForModel(descriptor, modelId, descriptor.structuredOutput);
}

/**
 * Whether `descriptor` declares any structured-output capability at all.
 * @public
 */
export function supportsStructuredOutput(descriptor: IAiProviderDescriptor): boolean {
  return (descriptor.structuredOutput?.length ?? 0) > 0;
}

/**
 * Exact-id match for per-model facts: an entry applies only to the concrete model id it names.
 * Deliberately not a prefix or snapshot match — see {@link IAiProviderDescriptor.maxOutputTokens}.
 * @internal
 */
function findModelEntry<TEntry extends { readonly modelId: string }>(
  entries: ReadonlyArray<TEntry> | undefined,
  concreteModelId: string
): TEntry | undefined {
  return entries?.find((e) => e.modelId === concreteModelId);
}

/**
 * The largest `maxTokens` the provider accepts for a completion on the model a call would use, or
 * `undefined` when that limit is unknown.
 *
 * @remarks
 * Takes the same model arguments as {@link resolveProviderModel}, and resolves through it: the
 * `ModelSpec` walk for `context` (falling back to `descriptor.defaultModel` when `modelOverride` is
 * absent), then alias resolution. So pass exactly what you pass to the completion call, and the
 * answer is the limit of the model that call will reach.
 *
 * The resolved id is matched against {@link IAiProviderDescriptor.maxOutputTokens} by exact
 * equality — never by prefix, and a dated snapshot gets a limit only from an entry of its own.
 * Returns `undefined` when no model resolves (an unregistered alias, an empty default), when the
 * provider declares no limits, and when no entry names the model.
 *
 * For a proxied call (`callProxiedCompletion` or the streaming proxy) with no tier and no override,
 * the proxy's own descriptor chooses the model, so pass the explicit spec or tier you want the
 * answer for. A model chosen outside the `ModelSpecKey` axis — say, a consumer's own
 * `resolveModel(spec, 'tools')` — is passed here as the resolved string.
 *
 * Nothing in ai-assist applies this limit to a caller's explicit `maxTokens`. Lowering an explicit
 * value would turn a loud refusal into a silent truncation, so the clamp is the caller's decision:
 *
 * ```ts
 * const limit = resolveMaxOutputTokens(descriptor, modelOverride, 'advanced');
 * const maxTokens = Math.min(myCap, limit ?? myCap);
 * ```
 *
 * @param descriptor - The provider descriptor.
 * @param modelOverride - The model spec the call will pass: a concrete id, an `@provider:role`
 *   alias, a context-keyed map, or `undefined` for the descriptor's default.
 * @param context - The model-spec key the call will pass (a tier such as `'advanced'`).
 * @returns The model's maximum output tokens, or `undefined` when unknown.
 * @public
 */
export function resolveMaxOutputTokens(
  descriptor: IAiProviderDescriptor,
  modelOverride?: ModelSpec,
  context?: ModelSpecKey
): number | undefined {
  return resolveProviderModel(descriptor, modelOverride, context)
    .onSuccess<number>((concreteModelId) => {
      const entry = findModelEntry(descriptor.maxOutputTokens, concreteModelId);
      return entry ? succeed(entry.maxOutputTokens) : fail(`${concreteModelId}: no recorded output limit`);
    })
    .orDefault();
}

/**
 * Resolve the embedding capability that applies to a given model id for a
 * provider. Returns the entry from {@link IAiProviderDescriptor.embedding} whose
 * `modelPrefix` is the longest prefix of `modelId`. Ties are broken by
 * first-encountered.
 *
 * @remarks
 * `modelId` may be either a concrete provider model id or an fgv model alias
 * (`@<provider>:<role>`, see `MODEL_ALIAS_SIGIL`) — it is resolved via
 * `resolveModelAlias` against `descriptor.aliases` before prefix matching,
 * so both forms select the same capability. A raw provider id passes through
 * unchanged. An alias that is not registered on `descriptor` (or is cyclic)
 * names no model and yields `undefined` rather than falling through to the
 * `modelPrefix: ''` catch-all.
 *
 * @param descriptor - The provider descriptor
 * @param modelId - The embedding model id — concrete or an fgv alias
 * @returns The matching capability, or `undefined` when no rule matches, the
 *   provider declares no embedding capabilities, or `modelId` is an
 *   unresolvable alias.
 * @public
 */
export function resolveEmbeddingCapability(
  descriptor: IAiProviderDescriptor,
  modelId: string
): IAiEmbeddingModelCapability | undefined {
  return resolveCapabilityForModel(descriptor, modelId, descriptor.embedding);
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
      // gpt-6 needs its own rule: no other rule matches it, so its ids would otherwise be detected
      // with no capabilities at all. Every gpt-6 model page lists text+image input, function
      // calling and reasoning.
      { idPattern: /^gpt-6/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^gpt-5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^gpt-4/, capabilities: ['chat', 'tools', 'vision'] },
      { idPattern: /^gpt-3\.5/, capabilities: ['chat'] },
      { idPattern: /^o\d/, capabilities: ['chat', 'tools', 'thinking'] }
    ],
    'xai-grok': [
      { idPattern: /-image/, capabilities: ['image-generation'] },
      // grok-4.5 needs its own rule: it would otherwise hit only /^grok-4/ and lose
      // thinking, yet it has configurable reasoning effort. Detection accumulates across
      // matching rules, so /^grok-4/ still contributes vision (same as grok-4.3).
      // grok-4.7 and grok-4.6 likewise: both list reasoning (effort low..xhigh).
      { idPattern: /^grok-4\.7/, capabilities: ['chat', 'tools', 'thinking'] },
      { idPattern: /^grok-4\.6/, capabilities: ['chat', 'tools', 'thinking'] },
      { idPattern: /^grok-4\.5/, capabilities: ['chat', 'tools', 'thinking'] },
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
      // gemini-nano-banana-2.1 is an image model whose id has no `-image` ("Image generation:
      // Supported", https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1, fetched
      // 2026-11-08); without this rule only /^gemini-/ matches it and image-generation is lost.
      { idPattern: /^gemini-nano-banana/, capabilities: ['image-generation'] },
      { idPattern: /embedding/, capabilities: ['embedding'] },
      { idPattern: /^gemini-3/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^gemini-2\.5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^gemini-/, capabilities: ['chat', 'tools', 'vision'] }
    ],
    anthropic: [
      // Broadened from /^claude-opus-4/ and /^claude-sonnet-4/ so the sonnet-5+ / opus-5+ lines
      // are detected as thinking-capable. Detection accumulates across matching rules, so this is
      // purely additive: every existing opus-4 / sonnet-4 id still matches. Both broadenings are
      // now load-bearing: claude-sonnet-5 and claude-opus-5-5 (the advanced-tier target) would
      // otherwise hit only /^claude-/ and lose thinking. The fable rule keeps the
      // AnthropicThinkingModelNames union honest — claude-fable-5 (modelOverride-only) would
      // otherwise fall to the /^claude-/ catch-all and be detected without thinking.
      { idPattern: /^claude-opus-/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^claude-sonnet-/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      { idPattern: /^claude-fable-/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      // claude-mythos-5-1 only: "Same capabilities as Claude Fable 5.1", adaptive thinking always on
      // (https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1, fetched 2026-09-25).
      // No fetched page states the other Mythos ids' capabilities, so the rule is not family-wide.
      { idPattern: /^claude-mythos-5-1/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
      // claude-haiku-5-5 only: adaptive thinking, text and image input, tool use (models overview and
      // https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5, fetched 2026-11-08).
      // claude-haiku-4-5 keeps the /^claude-/ catch-all.
      { idPattern: /^claude-haiku-5-5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
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
