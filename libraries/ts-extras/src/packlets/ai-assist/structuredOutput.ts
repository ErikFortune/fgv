/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import type { JsonObject, JsonValue } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';
import type { AiServerToolConfig, IAiProviderDescriptor } from './model';
import type {
  IAiStructuredOutputCapability,
  StructuredOutputEnforcement,
  StructuredOutputFallback,
  StructuredOutputRequest
} from './structuredOutputTypes';
import { toGeminiParameterSchema } from './toolFormats';

/**
 * The name the Anthropic forced-tool path gives its synthetic tool.
 *
 * @remarks
 * Anthropic has no `response_format`; its structured-output mechanism is forced
 * tool use, so a tool must exist to be forced. The name is fgv-owned and never
 * reaches the caller — the structured-output resolver re-serializes the tool's
 * `input` back into `IAiCompletionResponse.content`, so a caller's converter sees
 * a JSON string exactly as it does on every other provider.
 * @public
 */
export const ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME: string = 'fgv_structured_output';

/**
 * A resolved structured-output decision: what will be enforced, and the wire
 * fields that enforce it.
 * @internal
 */
export interface IResolvedStructuredOutput {
  /** What to report on the response. */
  readonly enforcement: StructuredOutputEnforcement;
  /**
   * Fields to merge into the request, **at the location the format dictates** —
   * the request body for the OpenAI and Anthropic formats, `generationConfig` for
   * Gemini. Empty when `enforcement` is `'none'`.
   */
  readonly wire: JsonObject;
}

/** The `'none'` decision: nothing sent, nothing enforced. @internal */
export const NO_STRUCTURED_OUTPUT: IResolvedStructuredOutput = { enforcement: 'none', wire: {} };

/**
 * Wire fields for a schema-constrained request. Every format can express this —
 * a structured-output capability that could not carry a schema would have nothing
 * to declare.
 * @internal
 */
function schemaWire(
  format: IAiStructuredOutputCapability['format'],
  raw: JsonValue
): IResolvedStructuredOutput {
  switch (format) {
    case 'openai-json-schema':
      return {
        enforcement: 'schema',
        wire: {
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'response', strict: true, schema: raw }
          }
        }
      };
    case 'openai-responses-format':
      // The Responses API nests the same choice under `text.format` and flattens the
      // schema onto the format object rather than a `json_schema` sub-object.
      return {
        enforcement: 'schema',
        wire: { text: { format: { type: 'json_schema', name: 'response', strict: true, schema: raw } } }
      };
    case 'gemini-response-schema':
      // Merged into `generationConfig`, not the body. Gemini's schema is an
      // OpenAPI-3.0 subset that REJECTS draft-07 keywords rather than ignoring them,
      // and `JsonSchema` is strict-by-default so `.toJson()` emits
      // `additionalProperties: false` on every object node — hence the same sanitizer
      // the tool path uses.
      return {
        enforcement: 'schema',
        wire: { responseMimeType: 'application/json', responseSchema: toGeminiParameterSchema(raw) }
      };
    case 'anthropic-tool-forced':
      // Anthropic has no response-format field. The schema becomes a synthetic
      // tool's `input_schema` and `tool_choice` forces it, which is why this is a
      // distinct enforcement value rather than a spelling of `'schema'`: the reply
      // arrives in a `tool_use` block, not as text.
      return {
        enforcement: 'tool-forced',
        wire: {
          tools: [
            {
              name: ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME,
              description: 'Return the response as structured data matching the supplied schema.',
              input_schema: raw
            }
          ],
          tool_choice: { type: 'tool', name: ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME }
        }
      };
    /* c8 ignore next 4 - defensive: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = format;
      throw new Error(`unsupported structured-output format: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Wire fields for a bare JSON-object request, or `undefined` when the format
 * cannot express one.
 *
 * @remarks
 * The `undefined` return **is** the capability table — there is deliberately no
 * separate `supportsJsonObject` flag anywhere, because a second declaration of
 * what a format can do could only ever disagree with this function.
 * @internal
 */
function jsonObjectWire(
  format: IAiStructuredOutputCapability['format']
): IResolvedStructuredOutput | undefined {
  switch (format) {
    case 'openai-json-schema':
      return { enforcement: 'json-mode', wire: { response_format: { type: 'json_object' } } };
    case 'openai-responses-format':
      return { enforcement: 'json-mode', wire: { text: { format: { type: 'json_object' } } } };
    case 'gemini-response-schema':
      return { enforcement: 'json-mode', wire: { responseMimeType: 'application/json' } };
    case 'anthropic-tool-forced':
      // A forced tool needs an input schema to be forced *to*, so there is no
      // schema-less form of this mechanism.
      return undefined;
    /* c8 ignore next 4 - defensive: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = format;
      throw new Error(`unsupported structured-output format: ${String(_exhaustive)}`);
    }
  }
}

/**
 * The wire format actually in force, given which OpenAI endpoint the dispatcher
 * will use.
 *
 * @remarks
 * **The OpenAI route is not a function of the model alone.** `callProviderCompletion`
 * sends a request to `/responses` when it carries server tools **or** when the model
 * is Responses-only, and to `/chat/completions` otherwise — so the same model takes
 * different endpoints on different calls, and those endpoints spell structured output
 * differently (`response_format` vs `text.format`). A capability declaration keyed on
 * the model therefore cannot name the right one by itself, and emitting
 * `response_format` into a `/responses` body would be silently ignored by the
 * provider: the request would look constrained and the reply would not be, with the
 * report confidently saying `'schema'`.
 *
 * The declaration still names each family's *support*; this is the one axis it cannot
 * carry, so it is supplied by the dispatcher that makes the routing decision.
 * @internal
 */
function effectiveFormat(
  declared: IAiStructuredOutputCapability['format'],
  usesResponsesApi: boolean
): IAiStructuredOutputCapability['format'] {
  if (usesResponsesApi && declared === 'openai-json-schema') {
    return 'openai-responses-format';
  }
  return declared;
}

/**
 * Resolve a caller's structured-output request against the concrete model that
 * will serve it.
 *
 * @param descriptor - The provider descriptor.
 * @param model - The **concrete** model id, already through `resolveProviderModel`.
 * Passing an alias here would be a bug of the class `resolveImageCapability` once
 * had, where an unresolved alias fell through to a catch-all `modelPrefix: ''` and
 * returned a confidently wrong capability.
 * @param request - The caller's intent, or `undefined` for no request at all.
 * @param serverTools - Server-side tools on the same request, which conflict with
 * structured output on two of the four formats.
 * @param usesResponsesApi - Whether the dispatcher will send this request to the
 * OpenAI Responses API rather than Chat Completions. See {@link effectiveFormat} —
 * the route is not a function of the model alone, so the capability declaration
 * cannot carry it.
 * @returns The decision, or `Failure` when the caller asked to fail rather than
 * degrade — or when the request conflicts with server tools, which is never
 * degradable because the caller asked for two things the provider cannot both do.
 * @internal
 */
export function resolveStructuredOutput(
  descriptor: IAiProviderDescriptor,
  model: string,
  request: StructuredOutputRequest | undefined,
  serverTools: ReadonlyArray<AiServerToolConfig> | undefined,
  usesResponsesApi: boolean,
  resolveCapability: (
    descriptor: IAiProviderDescriptor,
    model: string
  ) => IAiStructuredOutputCapability | undefined
): Result<IResolvedStructuredOutput> {
  if (request === undefined) {
    return succeed(NO_STRUCTURED_OUTPUT);
  }
  const fallback: StructuredOutputFallback = request.onUnsupported ?? 'degrade';
  const capability = resolveCapability(descriptor, model);
  if (capability === undefined) {
    return fallback === 'fail'
      ? fail(
          `provider '${descriptor.id}' model '${model}' declares no structured-output capability; ` +
            `pass onUnsupported: 'degrade' to send the request unconstrained`
        )
      : succeed(NO_STRUCTURED_OUTPUT);
  }

  // Two formats cannot carry structured output and server-side tools at once, for
  // DIFFERENT reasons — worth separating, because a reader who assumes one
  // mechanism will reason wrongly about the other.
  //
  //   anthropic-tool-forced: a wire-level clash. The constraint IS `tools` +
  //     `tool_choice`, so server tools would be overwritten (and `tool_choice`
  //     forces ours, which disables theirs anyway).
  //   gemini-response-schema: NOT a wire clash — `responseMimeType` /
  //     `responseSchema` live in `generationConfig`, nowhere near `tools`. It is
  //     an API-level mutual exclusivity Gemini enforces, the same restriction the
  //     client-tool path already pre-empts.
  //
  // Neither is degradable: silently dropping either half would give the caller
  // something they did not ask for, and `onUnsupported` speaks to what a model can
  // enforce, not to a caller asking for two incompatible things.
  if (serverTools !== undefined && serverTools.length > 0) {
    if (capability.format === 'anthropic-tool-forced') {
      return fail(
        `Anthropic enforces structured output by forcing a tool, so it cannot be combined with ` +
          `server-side tools (${serverTools.map((t) => t.type).join(', ')}) in the same request; ` +
          `send one or the other`
      );
    }
    if (capability.format === 'gemini-response-schema') {
      return fail(
        `Gemini cannot combine a response schema with server-side tools ` +
          `(${serverTools.map((t) => t.type).join(', ')}) in the same request; send one or the other`
      );
    }
  }

  const format = effectiveFormat(capability.format, usesResponsesApi);
  if (request.mode === 'schema') {
    return succeed(schemaWire(format, request.schema.toJson()));
  }
  const jsonObject = jsonObjectWire(format);
  if (jsonObject !== undefined) {
    return succeed(jsonObject);
  }

  // The requested mode has no expression on this format. Today that is only
  // `'json-object'` on Anthropic.
  if (fallback === 'fail') {
    return fail(
      `provider '${descriptor.id}' model '${model}' cannot enforce '${request.mode}' structured output; ` +
        `pass onUnsupported: 'degrade' to send the request unconstrained`
    );
  }
  return succeed(NO_STRUCTURED_OUTPUT);
}

/** Every valid {@link StructuredOutputEnforcement}, for the wire-shape guard below. @internal */
const ENFORCEMENTS: ReadonlySet<string> = new Set<StructuredOutputEnforcement>([
  'none',
  'json-mode',
  'schema',
  'tool-forced'
]);

/**
 * Whether an untyped value off a proxy response is a valid
 * {@link StructuredOutputEnforcement}.
 * @internal
 */
export function isStructuredOutputEnforcement(value: unknown): value is StructuredOutputEnforcement {
  return typeof value === 'string' && ENFORCEMENTS.has(value);
}
