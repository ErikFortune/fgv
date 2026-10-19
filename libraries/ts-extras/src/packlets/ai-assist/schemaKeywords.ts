/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Keyword-capability tables: for each provider wire format that carries a JSON Schema, what it
 * does with each constraint and annotation keyword `JsonSchema` emits — pass, translate, or fold
 * into the description (`JsonSchema.adaptSchemaKeywords` in `@fgv/ts-json-base`).
 *
 * **Folding loosens the wire, never the validator.** The schema's validator still enforces every
 * folded constraint, so a model that ignores one gets a correctable validation error on a tool
 * call, and a validation failure on a structured-output reply. Folding is therefore always safe,
 * and every entry below that is not `'fold'` cites the provider documentation it was verified
 * against (fetched 2026-10-17). **An entry nobody could verify is `'fold'`** — an unverified
 * `'pass'` is the one way this table can be wrong in a harmful direction (a provider 400, or a
 * keyword silently honoured differently).
 *
 * Each table also states two shapes (fetched 2026-10-17): what the wire does with an `enum` of
 * numbers or booleans (`nonStringEnum`: pass, or fold into the description keeping the `type`), and
 * with a schema that has no `type` (`untyped`, from `JsonSchema.anyValue` / `{}`: pass, or refuse
 * the request). An untyped node is never given a `type`, because any type would narrow what the
 * model may send below what the validator accepts; where a wire requires one, or its documentation
 * does not say, the request fails naming the tool and the path.
 */

import { type Result } from '@fgv/ts-utils';
import { type JsonObject, type JsonValue, JsonSchema } from '@fgv/ts-json-base';
import type { IAiProviderDescriptor } from './model';

/**
 * The wire formats that carry a `JsonSchema`, each with its own keyword-capability table.
 * @internal
 */
export type SchemaWireFormat =
  | 'responses-tools'
  | 'openai-strict-output'
  | 'anthropic-tools'
  | 'anthropic-json-outputs'
  | 'gemini';

/**
 * Who receives a wire schema, as far as choosing its keyword table needs to know.
 *
 * @remarks
 * Both fields are optional and their absence is safe: a wire with no `providerId` — on any
 * format — gets the conservative table, and an OpenAI-family wire also needs a verified one. Set `providerId` only when the request goes to that
 * provider's own endpoint — a descriptor pointed at a caller-supplied endpoint (a gateway, LiteLLM,
 * vLLM) reaches a server whose keyword support nobody verified.
 * @internal
 */
export interface ISchemaWireTarget {
  /** The provider descriptor id, when the request goes to that provider's own endpoint. */
  readonly providerId?: string;
  /** The concrete model id. */
  readonly model?: string;
}

/**
 * The providers whose documentation verifies the OpenAI-family tables.
 *
 * @remarks
 * The Responses and Chat Completions wires are shared by every `apiFormat: 'openai'` provider —
 * Groq, Mistral, OpenAI-compatible servers and Ollama's compatibility endpoint as well as OpenAI
 * and xAI. Only OpenAI's and xAI's keyword support was verified (Mistral's documentation host was
 * unreachable; the others document none), so any other provider on those wires gets
 * `unverifiedWireSchemaKeywords`.
 * @internal
 */
const OPENAI_FAMILY_VERIFIED_PROVIDERS: ReadonlySet<string> = new Set(['openai', 'xai-grok']);

/**
 * The OpenAI-family table — the **intersection** of what OpenAI and xAI document, since one wire
 * serves both.
 *
 * @remarks
 * - Numeric range keywords pass. OpenAI lists `minimum`, `maximum`, `exclusiveMinimum` and
 *   `exclusiveMaximum` as supported number properties
 *   (https://developers.openai.com/api/docs/guides/structured-outputs § "Supported schemas");
 *   xAI lists the same four as enforced
 *   (https://docs.x.ai/docs/guides/structured-outputs). xAI states tool schemas "follow the same
 *   JSON Schema support rules".
 * - `multipleOf` folds: OpenAI supports it, xAI's page does not mention it.
 * - `minLength` / `maxLength` fold: xAI supports them, OpenAI does not list them as supported.
 * - `pattern` folds. OpenAI lists it ("A regular expression that the string must match"), but xAI
 *   (https://docs.x.ai/docs/guides/structured-outputs, fetched 2026-10-18) documents that "`^` and
 *   `$` are *implicit* — the pattern always matches the *entire string*", where JSON Schema patterns
 *   are unanchored. Sent there, an unanchored pattern would state a narrower constraint than the
 *   validator enforces, and one wire serves both providers.
 * - `format` passes only for the values both list: OpenAI's date-time, time, date, duration,
 *   email, hostname, ipv4, ipv6 and uuid, intersected with xAI's date, time, date-time, email,
 *   uuid, ipv4, ipv6 and uri.
 * - `default` and `examples` fold: neither page mentions them. `title` is dropped — it only
 *   restates the property name, and folding it put `Title: …` on every pydantic property.
 * - A numeric or boolean `enum` passes. OpenAI lists `Enum` among the supported types without
 *   restricting its members to strings, and states its size limits over "enum values", qualifying
 *   only one of them as "a single enum property with string values"; xAI lists `enum` as supported.
 *   Neither page restricts an enum to strings, as Gemini's does.
 * - A schema with no `type` is refused. Neither page lists one among the supported schemas, OpenAI
 *   requires the root to be "an object", and xAI does not address it. Unverified, so the safe choice:
 *   the request fails rather than sending a shape a strict-mode server may 400 on.
 *
 * OpenAI states that fine-tuned models support none of the string, number or array constraints, so
 * a fine-tuned model (an `ft:` id) gets `unverifiedWireSchemaKeywords` instead.
 *
 * OpenAI's Responses tools without `strict` are normalized to strict mode "when possible"
 * (https://developers.openai.com/api/docs/guides/function-calling), so the strict-mode subset is the
 * one that applies to tools as well.
 * @internal
 */
export const openAiFamilySchemaKeywords: JsonSchema.SchemaKeywordCapabilities = {
  minimum: 'pass',
  exclusiveMinimum: 'pass',
  maximum: 'pass',
  exclusiveMaximum: 'pass',
  multipleOf: 'fold',
  minLength: 'fold',
  maxLength: 'fold',
  pattern: 'fold',
  format: { passValues: ['date-time', 'time', 'date', 'email', 'ipv4', 'ipv6', 'uuid'] },
  title: 'drop',
  default: 'fold',
  examples: 'fold',
  nonStringEnum: 'pass',
  // Undocumented, so the conservative choice: the cited page covers strict structured outputs, not
  // non-strict Responses function tools, and neither says whether a schema with no `type` is
  // accepted. Refusing never sends a shape a strict-mode normalization could 400 on.
  untyped: 'refuse'
};

/**
 * Anthropic client tools (`input_schema`, no `strict`) — every keyword passes.
 *
 * @remarks
 * `input_schema` is "A JSON Schema object"
 * (https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools), and Anthropic's
 * JSON Schema limitations apply to "JSON outputs and strict tool use" only
 * (https://platform.claude.com/docs/en/build-with-claude/structured-outputs § "JSON Schema
 * limitations"). This adapter never sets `strict` on a tool, so the forced-tool structured-output
 * mechanism uses this table too. A numeric `enum` and a schema with no `type` are both ordinary JSON
 * Schema, so they pass.
 * @internal
 */
export const anthropicToolsSchemaKeywords: JsonSchema.SchemaKeywordCapabilities = {
  minimum: 'pass',
  exclusiveMinimum: 'pass',
  maximum: 'pass',
  exclusiveMaximum: 'pass',
  multipleOf: 'pass',
  minLength: 'pass',
  maxLength: 'pass',
  pattern: 'pass',
  format: 'pass',
  title: 'pass',
  default: 'pass',
  examples: 'pass',
  nonStringEnum: 'pass',
  untyped: 'pass'
};

/**
 * Anthropic JSON outputs (`output_config.format`).
 *
 * @remarks
 * From https://platform.claude.com/docs/en/build-with-claude/structured-outputs § "JSON Schema
 * limitations": `default` is supported "for all supported types", and the string formats
 * date-time, time, date, duration, email, hostname, uri, ipv4, ipv6 and uuid are supported.
 * "Numerical constraints (such as minimum, maximum, multipleOf)" and "String constraints
 * (minLength, maxLength)" are **not** supported, and "If you use an unsupported feature, you'll receive a 400
 * error" — so they fold, which is what Anthropic's own SDK helpers do. `exclusiveMinimum` /
 * `exclusiveMaximum` fall under "such as"; `examples` is not mentioned and folds; `title` is not
 * mentioned and is dropped, since it only restates the property name.
 *
 * `pattern` passes: the same page's "Pattern support (regex)" lists "Full matching (`^...$`) and
 * partial matching", quantifiers, character classes and groups as supported (fetched 2026-10-18),
 * so an unanchored pattern means what JSON Schema says. It also lists backreferences, lookarounds,
 * word boundaries and large `{n,m}` ranges as **not** supported, and "Complex patterns may result in
 * 400 errors": a host pattern using one fails the request loudly rather than being sent loosened.
 *
 * The same section supports "`enum` (strings, numbers, bools, or nulls only - no complex types)", so
 * a numeric or boolean enum passes. It lists the basic types and does not say whether a schema
 * with no `type` is accepted, so one is refused rather than risking the documented 400.
 * @internal
 */
export const anthropicJsonOutputsSchemaKeywords: JsonSchema.SchemaKeywordCapabilities = {
  minimum: 'fold',
  exclusiveMinimum: 'fold',
  maximum: 'fold',
  exclusiveMaximum: 'fold',
  multipleOf: 'fold',
  minLength: 'fold',
  maxLength: 'fold',
  pattern: 'pass',
  format: {
    passValues: ['date-time', 'time', 'date', 'duration', 'email', 'hostname', 'uri', 'ipv4', 'ipv6', 'uuid']
  },
  title: 'drop',
  default: 'pass',
  examples: 'fold',
  nonStringEnum: 'pass',
  untyped: 'refuse'
};

/** Whether a wire node's `type` is `integer`, alone or in a nullable union. */
function _isIntegerNode(node: JsonObject): boolean {
  const type: JsonValue | undefined = node.type;
  return type === 'integer' || (Array.isArray(type) && type.includes('integer'));
}

/**
 * Translates an exclusive bound on an **integer** node into the inclusive bound Gemini documents.
 *
 * @remarks
 * Exact, not approximate: for an integer `x`, `x > b` holds exactly when `x >= floor(b) + 1`, and
 * `x < b` exactly when `x <= ceil(b) - 1`. Where the node already carries the inclusive bound the
 * tighter of the two is kept, which is the conjunction both stated. A number node has no exact
 * inclusive equivalent, so the translator declines and the keyword folds.
 */
function _integerExclusiveBound(
  exclusive: 'exclusiveMinimum' | 'exclusiveMaximum'
): JsonSchema.SchemaKeywordTranslator {
  return (node: JsonObject): JsonObject | undefined => {
    const bound: JsonValue | undefined = node[exclusive];
    if (!_isIntegerNode(node) || typeof bound !== 'number') {
      return undefined;
    }
    const inclusive = exclusive === 'exclusiveMinimum' ? 'minimum' : 'maximum';
    const translated = exclusive === 'exclusiveMinimum' ? Math.floor(bound) + 1 : Math.ceil(bound) - 1;
    // Beyond 2^53 the arithmetic is not exact — `floor(b) + 1` can equal `b`, which would loosen
    // the bound — so there is no exact equivalent, and the keyword folds.
    if (!Number.isSafeInteger(translated)) {
      return undefined;
    }
    const existing: JsonValue | undefined = node[inclusive];
    const out: JsonObject = {};
    for (const [key, value] of Object.entries(node)) {
      if (key !== exclusive) {
        out[key] = value;
      }
    }
    out[inclusive] =
      typeof existing !== 'number'
        ? translated
        : exclusive === 'exclusiveMinimum'
        ? Math.max(existing, translated)
        : Math.min(existing, translated);
    return out;
  };
}

/**
 * Gemini function-declaration parameters and `responseSchema` — the OpenAPI 3.0 subset.
 *
 * @remarks
 * From the Schema object at https://ai.google.dev/api/generate-content § "Schema": `minimum` /
 * `maximum` (for `INTEGER` and `NUMBER`), `minLength` / `maxLength`, `format` ("Any value is
 * allowed"), `title` and `default` are fields, so they pass. `pattern` is a field too ("Pattern of
 * the Type.STRING to restrict a string to a regular expression", fetched 2026-10-18), but the page
 * names neither a regex dialect nor whether the pattern is anchored — the semantics that made the
 * OpenAI-family table fold it on xAI's account — so it **folds**: the validator still enforces it,
 * and an enforcement probe could justify passing it later. The object has **no**
 * `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf` or `examples`: the exclusive bounds are
 * translated on an integer node (see `_integerExclusiveBound`) and folded elsewhere; `multipleOf`
 * folds; `examples` folds, because Gemini's singular `example` is "populated only when the object
 * is the root" and is therefore no exact equivalent.
 *
 * The same object's `enum` holds "Possible values of the element of Type.STRING with enum format",
 * so a numeric or boolean enum folds into the description, keeping its `type`. Its `type` is
 * "Required", so a schema with no `type` is refused: Gemini cannot express "any value" in this
 * dialect (`parametersJsonSchema`, the full-JSON-Schema alternative to `parameters`, is a separate
 * field this adapter does not send).
 * @internal
 */
export const geminiSchemaKeywords: JsonSchema.SchemaKeywordCapabilities = {
  minimum: 'pass',
  exclusiveMinimum: { translate: _integerExclusiveBound('exclusiveMinimum') },
  maximum: 'pass',
  exclusiveMaximum: { translate: _integerExclusiveBound('exclusiveMaximum') },
  multipleOf: 'fold',
  minLength: 'pass',
  maxLength: 'pass',
  pattern: 'fold',
  format: 'pass',
  title: 'pass',
  default: 'pass',
  examples: 'fold',
  nonStringEnum: 'fold',
  untyped: 'refuse'
};

/**
 * The keyword-capability table a client tool's parameter schema is adapted with when it is sent to
 * `descriptor` — the table to hand to `@fgv/ts-extras-mcp`'s `adaptMcpTools` (its
 * `schemaKeywords` option) so it admits exactly the MCP tools that wire can carry.
 *
 * @remarks
 * The same table the request path uses: the wire follows `descriptor.apiFormat` (OpenAI-format
 * Responses tools, Anthropic tools, or Gemini function declarations), and the provider's own table
 * applies only when the request goes to its own endpoint — pass `endpoint` when the descriptor is
 * pointed at a caller-supplied one, and every keyword is then treated as unverified, as the
 * request path does.
 * @param descriptor - The provider the tools will be sent to.
 * @param options - The concrete `model` (an OpenAI fine-tuned `ft:` model gets the conservative
 * table) and any caller-supplied `endpoint`.
 * @returns The keyword-capability table.
 * @public
 */
export function clientToolSchemaKeywords(
  descriptor: IAiProviderDescriptor,
  options?: { readonly model?: string; readonly endpoint?: string }
): JsonSchema.SchemaKeywordCapabilities {
  const format: SchemaWireFormat =
    descriptor.apiFormat === 'anthropic'
      ? 'anthropic-tools'
      : descriptor.apiFormat === 'gemini'
      ? 'gemini'
      : 'responses-tools';
  return schemaKeywordsFor(format, {
    ...(options?.endpoint === undefined && { providerId: descriptor.id }),
    ...(options?.model !== undefined && { model: options.model })
  });
}

/** The provider-facing name of each wire format, for a refusal message. */
const WIRE_FORMAT_NAMES: Readonly<Record<SchemaWireFormat, string>> = {
  'responses-tools': 'OpenAI-format tools',
  'openai-strict-output': 'OpenAI strict structured output',
  'anthropic-tools': 'Anthropic tools',
  'anthropic-json-outputs': 'Anthropic JSON outputs',
  gemini: 'Gemini'
};

/**
 * The keyword-capability table for a wire format as one target receives it.
 * @param format - The wire format.
 * @param target - Who receives it. The OpenAI-family formats are shared by providers whose support
 * differs, so only a verified provider on its own endpoint gets their table, and not for a
 * fine-tuned (`ft:`) model. On every format, a target with no `providerId` — a caller-supplied
 * endpoint, or no target at all — is an unverified server and gets
 * `unverifiedWireSchemaKeywords`: the documentation a table cites describes the provider's own
 * endpoint, not a gateway that happens to speak its wire.
 * @internal
 */
export function schemaKeywordsFor(
  format: SchemaWireFormat,
  target?: ISchemaWireTarget
): JsonSchema.SchemaKeywordCapabilities {
  if (target?.providerId === undefined) {
    return JsonSchema.unverifiedWireSchemaKeywords;
  }
  switch (format) {
    case 'responses-tools':
    case 'openai-strict-output':
      return OPENAI_FAMILY_VERIFIED_PROVIDERS.has(target.providerId) &&
        target.model?.startsWith('ft:') !== true
        ? openAiFamilySchemaKeywords
        : JsonSchema.unverifiedWireSchemaKeywords;
    case 'anthropic-tools':
      return anthropicToolsSchemaKeywords;
    case 'anthropic-json-outputs':
      return anthropicJsonOutputsSchemaKeywords;
    case 'gemini':
      return geminiSchemaKeywords;
  }
}

/**
 * A client tool's or structured-output request's wire schema, adapted for `format` as `target`
 * receives it — see `schemaKeywordsFor`.
 * @returns The adapted schema, or a `Failure` naming the path of a node the wire cannot carry (a
 * schema with no `type` where the table refuses one) and the wire it was refused for.
 * @internal
 */
export function adaptWireSchema(
  schema: JsonValue,
  format: SchemaWireFormat,
  target?: ISchemaWireTarget
): Result<JsonValue> {
  return JsonSchema.adaptSchemaKeywords(schema, schemaKeywordsFor(format, target)).withErrorFormat(
    (msg) =>
      `${msg} (${WIRE_FORMAT_NAMES[format]}${target?.providerId === undefined ? ', unverified server' : ''})`
  );
}
