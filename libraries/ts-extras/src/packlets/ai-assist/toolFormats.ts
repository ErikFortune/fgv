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

import { type JsonObject, type JsonValue } from '@fgv/ts-json-base';
import { type Result, fail, mapResults, succeed } from '@fgv/ts-utils';

import { type IAiProviderDescriptor } from './model';
import { type ISchemaWireTarget, adaptWireSchema } from './schemaKeywords';
import {
  type AiServerToolConfig,
  type AiServerToolType,
  type AiToolConfig,
  type AiToolConflictPolicy,
  type IAiClientTool,
  type IAiClientToolConfig,
  type IAiToolConflictReport,
  type IAiToolEnablement,
  type IAiWebSearchToolConfig
} from './toolTypes';

/**
 * A client tool's parameter schema adapted for one wire, with a refusal naming the tool. The one
 * adaptation both the turn's pre-flight and the request formatters run.
 * @internal
 */
export function adaptClientToolParameters(
  config: IAiClientToolConfig,
  format: 'responses-tools' | 'anthropic-tools' | 'gemini',
  target: ISchemaWireTarget | undefined
): Result<JsonValue> {
  return adaptWireSchema(config.parametersSchema.toJson(), format, target).withErrorFormat(
    (msg) => `tool '${config.name}': ${msg}`
  );
}

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

/**
 * The default {@link AiAssist.AiToolConflictPolicy} applied when a caller passes none.
 *
 * @remarks
 * Keeping the client tools is the right default because they are what the host
 * registered explicitly for *this* turn, while a built-in server tool is a
 * per-provider nicety the same host would get on some providers and not others.
 * Dropping the nicety degrades a turn; dropping the client tools changes what the
 * turn can do.
 * @public
 */
export const defaultToolConflictPolicy: AiToolConflictPolicy = 'drop-server-tools';

/**
 * The outcome of {@link AiAssist.resolveToolConflicts}: the tools that survived,
 * plus the report of what did not.
 * @public
 */
export interface IAiResolvedToolConflicts {
  /** Server tools to send, after the policy was applied. */
  readonly serverTools: ReadonlyArray<AiServerToolConfig>;
  /** Client tools to send, after the policy was applied. */
  readonly clientTools: ReadonlyArray<IAiClientTool>;
  /** What the resolution did. Always populated; empty arrays mean nothing conflicted. */
  readonly report: IAiToolConflictReport;
}

/**
 * Applies a provider's declared server-tool/client-tool exclusions to one request's
 * tools.
 *
 * @remarks
 * The generic half of a rule that used to be a provider-identity branch. The
 * constraint is declared on the descriptor
 * (`IAiProviderDescriptor.serverToolsExclusiveWithClientTools`); this reads it
 * and applies `policy`, so no consumer needs to know *which* provider has the limit
 * or *what* the limit is. A descriptor that declares nothing, or a request with no
 * client tools, or one with no server tools, passes through untouched with an empty
 * report — the exclusion is about the *combination*, and either half alone is legal.
 *
 * Sibling to {@link AiAssist.resolveEffectiveTools} rather than an extension of it:
 * that function filters server tools against what the provider supports at all and
 * is used by every completion path, most of which have no client tools to weigh.
 *
 * @param descriptor - The provider descriptor carrying the declared exclusions.
 * @param serverTools - The server tools the caller wants to send, if any.
 * @param clientTools - The client tools the caller wants to send.
 * @param policy - What to do about a conflict. Defaults to
 * {@link AiAssist.defaultToolConflictPolicy}.
 * @returns `Success` with the surviving tools and a report, or `Failure` naming the
 * conflict when `policy` is `'fail'`.
 * @public
 */
export function resolveToolConflicts(
  descriptor: IAiProviderDescriptor,
  serverTools: ReadonlyArray<AiServerToolConfig> | undefined,
  clientTools: ReadonlyArray<IAiClientTool>,
  policy: AiToolConflictPolicy = defaultToolConflictPolicy
): Result<IAiResolvedToolConflicts> {
  const present = serverTools ?? [];
  const exclusive = new Set(descriptor.serverToolsExclusiveWithClientTools ?? []);
  const conflicting: ReadonlyArray<AiServerToolType> =
    clientTools.length > 0 ? present.filter((t) => exclusive.has(t.type)).map((t) => t.type) : [];

  if (conflicting.length === 0) {
    return succeed({
      serverTools: present,
      clientTools,
      report: { policy, droppedServerTools: [], droppedClientTools: [] }
    });
  }

  // Name every conflicting tool, not just the first: a host reading the message is
  // deciding what to send instead, and a partial list invites a second round.
  const named = conflicting.join(', ');
  switch (policy) {
    case 'fail':
      return fail(
        `provider "${descriptor.id}" cannot combine server tool(s) [${named}] with client (function) tools in the same request; send one or the other`
      );
    case 'prefer-server-tools':
      return succeed({
        serverTools: present,
        clientTools: [],
        report: {
          policy,
          droppedServerTools: [],
          droppedClientTools: clientTools.map((t) => t.config.name)
        }
      });
    case 'drop-server-tools':
      return succeed({
        serverTools: present.filter((t) => !exclusive.has(t.type)),
        clientTools,
        report: { policy, droppedServerTools: conflicting, droppedClientTools: [] }
      });
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = policy;
      return fail(`unknown tool conflict policy: ${JSON.stringify(_exhaustive)}`);
    }
  }
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
 * Formats a client tool config for the xAI/OpenAI Responses API.
 * @internal
 */
function clientToolToResponsesApi(
  config: IAiClientToolConfig,
  target: ISchemaWireTarget | undefined
): Result<JsonObject> {
  return adaptClientToolParameters(config, 'responses-tools', target).onSuccess((parameters) =>
    succeed({
      type: 'function',
      name: config.name,
      description: config.description,
      parameters
    } as JsonObject)
  );
}

/**
 * Formats server-side tools for the xAI/OpenAI Responses API. Infallible, unlike
 * {@link toResponsesApiTools}: only a client tool carries a schema a wire can refuse.
 * @internal
 */
export function serverToolsToResponsesApi(
  tools: ReadonlyArray<AiServerToolConfig>
): ReadonlyArray<JsonObject> {
  return tools.map(webSearchToResponsesApi);
}

/**
 * Formats tool configs for the xAI/OpenAI Responses API.
 *
 * @remarks
 * Each client tool's parameter schema has its constraint keywords adapted to what the provider
 * documents (see `schemaKeywords.ts`): the Responses wire is shared by every OpenAI-format
 * provider, so the table depends on which one is receiving it, and an unverified provider has every
 * constraint folded into the description. The tool's own validator is unchanged and still
 * enforces each one.
 * @param tools - The resolved tool configs (server-side and/or client-defined)
 * @param target - Who receives the request: the provider id (only when it goes to that
 * provider's own endpoint) and the model. Absent folds every keyword.
 * @returns Provider-native tool objects for the `tools` request field, or a `Failure` naming the
 * tool and the path of a parameter schema this wire cannot carry — one with no `type`
 * (`JsonSchema.anyValue`), which the OpenAI-family wires are not documented to accept.
 * @public
 */
export function toResponsesApiTools(
  tools: ReadonlyArray<AiToolConfig>,
  target?: ISchemaWireTarget
): Result<ReadonlyArray<JsonObject>> {
  return mapResults(
    tools.map((t) => {
      switch (t.type) {
        case 'web_search':
          return succeed(webSearchToResponsesApi(t));
        case 'client_tool':
          return clientToolToResponsesApi(t, target);
        /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
        default: {
          const _exhaustive: never = t;
          return succeed({ type: `unknown:${JSON.stringify(_exhaustive)}` } as JsonObject);
        }
      }
    })
  );
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
 * Formats a client tool config for the Anthropic Messages API.
 * Note: Anthropic client tools have no `type` field (unlike server tools).
 * @internal
 */
function clientToolToAnthropic(
  config: IAiClientToolConfig,
  target: ISchemaWireTarget | undefined
): Result<JsonObject> {
  return adaptClientToolParameters(config, 'anthropic-tools', target).onSuccess((inputSchema) =>
    succeed({
      name: config.name,
      description: config.description,
      input_schema: inputSchema
    } as JsonObject)
  );
}

/**
 * Formats server-side tools for the Anthropic Messages API. Infallible, unlike
 * {@link toAnthropicTools}: only a client tool carries a schema a wire can refuse.
 * @internal
 */
export function serverToolsToAnthropic(tools: ReadonlyArray<AiServerToolConfig>): ReadonlyArray<JsonObject> {
  return tools.map(webSearchToAnthropic);
}

/**
 * Formats tool configs for the Anthropic Messages API.
 * @param tools - The resolved tool configs (server-side and/or client-defined)
 * @param target - Who receives the request: the provider id (only when it goes to that
 * provider's own endpoint) and the model. Absent — an endpoint override — folds every keyword.
 * @returns Provider-native tool objects for the `tools` request field, or a `Failure` naming the
 * tool and the path of a parameter schema this wire cannot carry (a schema with no `type`, sent to
 * an unverified server).
 * @public
 */
export function toAnthropicTools(
  tools: ReadonlyArray<AiToolConfig>,
  target?: ISchemaWireTarget
): Result<ReadonlyArray<JsonObject>> {
  return mapResults(
    tools.map((t) => {
      switch (t.type) {
        case 'web_search':
          return succeed(webSearchToAnthropic(t));
        case 'client_tool':
          return clientToolToAnthropic(t, target);
        /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
        default: {
          const _exhaustive: never = t;
          return succeed({ type: `unknown:${JSON.stringify(_exhaustive)}` } as JsonObject);
        }
      }
    })
  );
}

// ============================================================================
// Gemini generateContent API format
// ============================================================================

/**
 * The non-`null` member of a draft-07 nullable `type` union, or `undefined` when `type` is
 * not one.
 *
 * @remarks
 * Deliberately narrow: only the two-member `[<type>, 'null']` shape `JsonSchema` emits is
 * recognised. A general union has no OpenAPI equivalent, so translating one would be
 * inventing a meaning — it is passed through unchanged and Gemini refuses it, which is the
 * honest outcome.
 * @internal
 */
function _nullableUnionMember(type: JsonValue | undefined): string | undefined {
  if (!Array.isArray(type) || type.length !== 2 || !type.includes('null')) {
    return undefined;
  }
  const other: JsonValue | undefined = type.find((member) => member !== 'null');
  return typeof other === 'string' ? other : undefined;
}

/**
 * Sanitizes a draft-07 JSON Schema (as emitted by `JsonSchema.object(...).toJson()`)
 * into the OpenAPI 3.0 Schema Object subset that Gemini's `function_declarations[].parameters`
 * accepts.
 *
 * @remarks
 * Gemini's function-declaration schema is **not** full JSON Schema — it is a subset of
 * the OpenAPI 3.0 Schema Object and **rejects** (rather than ignores) draft-07-only
 * keywords. `JsonSchema` objects are strict-by-default, so `.toJson()` emits
 * `additionalProperties: false` on every object node, which 400s the whole request on
 * Gemini. This helper recursively strips the unsupported keywords so any
 * `JsonSchema`-authored client tool works on Gemini without consumer awareness of the
 * dialect difference. Stripping is infallible, so it returns a plain value rather than a
 * `Result`.
 *
 * `additionalProperties` and `$schema` are stripped only where they appear as schema
 * *keywords* (siblings of `type`/`properties`/etc.). Inside a `properties` map the keys
 * are user-defined parameter names, not keywords, so they are preserved verbatim while
 * each property's subschema value is still recursively sanitized — a tool parameter
 * legitimately named `additionalProperties` survives.
 *
 * Only the **dialect** is translated: constraint and annotation keywords pass through as written.
 * `toGeminiTools` and the Gemini structured-output wire adapt those first, to what Gemini
 * documents; call this directly only to build a Gemini schema yourself — for example a wire probe
 * that must send a keyword unadapted to observe whether Gemini accepts it.
 * @param schema - A draft-07 JSON Schema.
 * @returns The schema in Gemini's OpenAPI 3.0 subset.
 * @public
 */
export function toGeminiParameterSchema(schema: JsonValue): JsonValue {
  if (Array.isArray(schema)) {
    return schema.map(toGeminiParameterSchema);
  }
  if (schema !== null && typeof schema === 'object') {
    const out: JsonObject = {};
    // Nullability is spelled differently in the two dialects and they are mutually
    // exclusive: draft-07 (and OpenAI strict mode) wants `type: ['string', 'null']`,
    // OpenAPI 3.0 (and Gemini) wants `type: 'string'` + `nullable: true` and rejects the
    // union array. This is the same class of translation as the `additionalProperties`
    // strip above — a dialect difference the consumer should not have to know about.
    const nullableType: string | undefined = _nullableUnionMember(schema.type);
    for (const [key, value] of Object.entries(schema)) {
      if (key === 'additionalProperties' || key === '$schema') {
        continue;
      }
      if (key === 'default' || key === 'examples' || key === 'const') {
        // Data, not a schema: a `default` object holding a key named `additionalProperties`, or a
        // nullable-looking `type` array, is a value and must reach the provider as written.
        out[key] = value;
        continue;
      }
      if (nullableType !== undefined && key === 'type') {
        out.type = nullableType;
        out.nullable = true;
        continue;
      }
      if (nullableType !== undefined && key === 'enum' && Array.isArray(value)) {
        // A nullable enum carries `null` among its values in draft-07. OpenAPI expresses
        // that with `nullable` alone, so the member is dropped rather than sent as a value
        // Gemini would reject.
        out.enum = value.filter((member) => member !== null);
        continue;
      }
      if (key === 'properties' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // `properties` maps user-defined parameter names to subschemas: recurse each
        // subschema value but never treat a parameter name as a strippable keyword.
        const properties: JsonObject = {};
        for (const [name, propSchema] of Object.entries(value)) {
          properties[name] = toGeminiParameterSchema(propSchema);
        }
        out[key] = properties;
      } else {
        out[key] = toGeminiParameterSchema(value);
      }
    }
    return out;
  }
  return schema;
}

/**
 * Formats server-side tools for the Gemini generateContent API — one `google_search` entry per
 * web-search tool, as {@link toGeminiTools} emits. Infallible: only a client tool carries a schema
 * a wire can refuse.
 * @internal
 */
export function serverToolsToGemini(tools: ReadonlyArray<AiServerToolConfig>): ReadonlyArray<JsonObject> {
  return tools.map(() => ({ google_search: {} } as JsonObject));
}

/**
 * Formats tool configs for the Gemini generateContent API.
 *
 * @remarks
 * Gemini uses `google_search` for search grounding (no per-tool config).
 * Client-defined tools are accumulated into a single `function_declarations` entry.
 * Each client tool's parameters schema has its constraint keywords adapted to what Gemini
 * documents (passed, translated or folded into the description — see `schemaKeywords.ts`),
 * then is sanitized to Gemini's OpenAPI-subset dialect via {@link toGeminiParameterSchema}
 * (the raw draft-07 `.toJson()` output carries `additionalProperties`, which Gemini rejects).
 *
 * @param tools - The resolved tool configs (server-side and/or client-defined)
 * @param target - Who receives the request: the provider id (only when it goes to that
 * provider's own endpoint) and the model. Absent — an endpoint override — folds every keyword.
 * @returns Provider-native tool objects for the `tools` request field, or a `Failure` naming the
 * tool and the path of a parameter schema Gemini cannot carry: one with no `type`
 * (`JsonSchema.anyValue`), since Gemini requires a `type` on every schema and the adapter will not
 * invent one.
 * @public
 */
export function toGeminiTools(
  tools: ReadonlyArray<AiToolConfig>,
  target?: ISchemaWireTarget
): Result<ReadonlyArray<JsonObject>> {
  const result: JsonObject[] = [];
  const declarations: Result<JsonObject>[] = [];

  for (const t of tools) {
    switch (t.type) {
      case 'web_search':
        result.push({ google_search: {} } as JsonObject);
        break;
      case 'client_tool':
        declarations.push(
          adaptClientToolParameters(t, 'gemini', target).onSuccess((parameters) =>
            succeed({
              name: t.name,
              description: t.description,
              parameters: toGeminiParameterSchema(parameters)
            } as JsonObject)
          )
        );
        break;
      /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
      default: {
        const _exhaustive: never = t;
        result.push({ type: `unknown:${JSON.stringify(_exhaustive)}` } as JsonObject);
      }
    }
  }

  return mapResults(declarations).onSuccess((functionDeclarations) =>
    succeed(
      functionDeclarations.length > 0
        ? [...result, { function_declarations: functionDeclarations } as JsonObject]
        : result
    )
  );
}
