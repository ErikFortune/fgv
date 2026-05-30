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
 * Provider-specific tool format translation and tool resolution logic.
 * @packageDocumentation
 */

import { type JsonObject } from '@fgv/ts-json-base';

import {
  type AiServerToolConfig,
  type IAiProviderDescriptor,
  type IAiToolEnablement,
  type IAiWebSearchToolConfig
} from './model';

// ============================================================================
// Tool resolution
// ============================================================================

/**
 * Resolves the effective tools for a completion call.
 *
 * - If per-call tools are provided, they override settings-level tools entirely.
 * - Otherwise, settings-level enabled tools are used.
 * - Only tools supported by the provider are included.
 * - Returns an empty array if no tools are enabled (= no tools sent).
 *
 * @param descriptor - The provider descriptor (used to filter by supported tools)
 * @param settingsTools - Tool enablement from provider settings (optional)
 * @param perCallTools - Per-call tool override (optional)
 * @returns The resolved list of tool configs to include in the request
 * @public
 */
export function resolveEffectiveTools(
  descriptor: IAiProviderDescriptor,
  settingsTools?: ReadonlyArray<IAiToolEnablement>,
  perCallTools?: ReadonlyArray<AiServerToolConfig>
): ReadonlyArray<AiServerToolConfig> {
  const supported = new Set(descriptor.supportedTools);

  if (perCallTools !== undefined) {
    return perCallTools.filter((t) => supported.has(t.type));
  }

  if (settingsTools === undefined) {
    return [];
  }

  return settingsTools
    .filter((e) => e.enabled && supported.has(e.type))
    .map((e): AiServerToolConfig => e.config ?? { type: e.type });
}

// ============================================================================
// OpenAI / xAI Responses API format
// ============================================================================

/**
 * Formats a web search tool config for the xAI/OpenAI Responses API.
 * @internal
 */
function webSearchToResponsesApi(config: IAiWebSearchToolConfig): JsonObject {
  const tool: Record<string, unknown> = { type: 'web_search' };

  if (config.allowedDomains || config.blockedDomains) {
    const filters: Record<string, unknown> = {};
    if (config.allowedDomains) {
      filters.allowed_domains = [...config.allowedDomains];
    }
    if (config.blockedDomains) {
      filters.excluded_domains = [...config.blockedDomains];
    }
    tool.filters = filters;
  }

  if (config.enableImageUnderstanding) {
    tool.enable_image_understanding = true;
  }

  return tool as JsonObject;
}

/**
 * Formats tool configs for the xAI/OpenAI Responses API.
 * @param tools - The resolved tool configs
 * @returns Provider-native tool objects for the `tools` request field
 * @public
 */
export function toResponsesApiTools(tools: ReadonlyArray<AiServerToolConfig>): ReadonlyArray<JsonObject> {
  return tools.map((t) => {
    switch (t.type) {
      case 'web_search':
        return webSearchToResponsesApi(t);
      /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
      default: {
        const _exhaustive: never = t.type;
        return { type: String(_exhaustive) } as JsonObject;
      }
    }
  });
}

// ============================================================================
// Anthropic Messages API format
// ============================================================================

/**
 * Formats a web search tool config for the Anthropic Messages API.
 * @internal
 */
function webSearchToAnthropic(config: IAiWebSearchToolConfig): JsonObject {
  const tool: Record<string, unknown> = {
    type: 'web_search_20250305',
    name: 'web_search'
  };

  if (config.maxUses !== undefined) {
    tool.max_uses = config.maxUses;
  }
  if (config.allowedDomains) {
    tool.allowed_domains = [...config.allowedDomains];
  }
  if (config.blockedDomains) {
    tool.blocked_domains = [...config.blockedDomains];
  }

  return tool as JsonObject;
}

/**
 * Formats tool configs for the Anthropic Messages API.
 * @param tools - The resolved tool configs
 * @returns Provider-native tool objects for the `tools` request field
 * @public
 */
export function toAnthropicTools(tools: ReadonlyArray<AiServerToolConfig>): ReadonlyArray<JsonObject> {
  return tools.map((t) => {
    switch (t.type) {
      case 'web_search':
        return webSearchToAnthropic(t);
      /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
      default: {
        const _exhaustive: never = t.type;
        return { type: String(_exhaustive) } as JsonObject;
      }
    }
  });
}

// ============================================================================
// Gemini generateContent API format
// ============================================================================

/**
 * Formats tool configs for the Gemini generateContent API.
 * Gemini uses `google_search` for search grounding — no per-tool config options.
 * @param tools - The resolved tool configs
 * @returns Provider-native tool objects for the `tools` request field
 * @public
 */
export function toGeminiTools(tools: ReadonlyArray<AiServerToolConfig>): ReadonlyArray<JsonObject> {
  const result: JsonObject[] = [];

  for (const t of tools) {
    switch (t.type) {
      case 'web_search':
        result.push({ google_search: {} } as JsonObject);
        break;
      /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
      default: {
        const _exhaustive: never = t.type;
        result.push({ type: String(_exhaustive) } as JsonObject);
      }
    }
  }

  return result;
}
