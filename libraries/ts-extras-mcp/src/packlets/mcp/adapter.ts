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
 * The headline adapter — discovers an MCP server's tools and adapts each into an
 * `AiAssist.IAiClientTool`, gracefully degrading (Constraint 1) on any tool whose `inputSchema`
 * is outside the JSON Schema subset that `JsonSchema.fromJson` supports.
 * @packageDocumentation
 */

import { type DetailedResult, type Result, succeed, succeedWithDetail } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import { Converters, JsonSchema } from '@fgv/ts-json-base';

import {
  type IAdaptMcpToolsOptions,
  type IAdaptMcpToolsResult,
  type IMcpSession,
  type IMcpSkippedTool,
  type IMcpToolDescriptor,
  type McpFailureReason
} from './model';
import { callMcpTool, listMcpTools } from './operations';
import { printable } from './request';

/**
 * Per-tool adaptation outcome: either an adapted client tool, or a structurally-surfaced skip.
 * `adaptMcpTools` never short-circuits on a skip — degradation is structural, not a failure.
 */
type IAdaptOutcome =
  | { readonly kind: 'tool'; readonly tool: AiAssist.IAiClientTool }
  | { readonly kind: 'skipped'; readonly skipped: IMcpSkippedTool };

/**
 * Builds the `execute` callback for an adapted MCP tool. Args arrive already validated against
 * the tool's `parametersSchema` by `executeClientToolTurn`; here we narrow to a `JsonObject`
 * (MCP arguments are always an object) and forward to {@link callMcpTool}, returning the
 * projected text content. A tool error surfaces as a `Failure` (never swallowed). The turn's
 * abort signal, when it has one, is forwarded so that cancelling the turn cancels the MCP request.
 */
function _makeExecute(
  session: IMcpSession,
  name: string
): (args: unknown, context?: AiAssist.IAiClientToolExecuteContext) => Promise<Result<unknown>> {
  return async (args: unknown, context?: AiAssist.IAiClientToolExecuteContext): Promise<Result<unknown>> => {
    const objResult = Converters.jsonObject
      .convert(args)
      .withErrorFormat((msg) => `tool '${name}': arguments must be a JSON object: ${msg}`);
    if (objResult.isFailure()) {
      return objResult;
    }
    const signal = context?.signal;
    return (
      await callMcpTool(session, name, objResult.value, signal !== undefined ? { signal } : undefined)
    ).onSuccess((called) => succeedWithDetail<unknown, McpFailureReason>(called.content));
  };
}

/**
 * Adapts a single discovered tool. Returns a `skipped` outcome (never a failure) when the
 * tool's `inputSchema` is not a JSON object, is outside the `JsonSchema.fromJson` subset, or
 * cannot be carried by the target wire (`schemaKeywords`).
 */
function _adaptOne(
  session: IMcpSession,
  descriptor: IMcpToolDescriptor,
  schemaKeywords: JsonSchema.SchemaKeywordCapabilities
): IAdaptOutcome {
  const { name, description, inputSchema, annotations } = descriptor;

  const parsed = Converters.jsonObject
    .convert(inputSchema)
    .withErrorFormat((msg) => `inputSchema is not a JSON object (${msg})`)
    .onSuccess((asObject) => JsonSchema.fromJson(asObject))
    .onSuccess((schema) =>
      // Admission only: the target wire must be able to carry the schema, or one such tool would
      // fail every request it rides on. The adapted result is discarded — the request path adapts
      // the schema itself, once, when it is sent.
      JsonSchema.adaptSchemaKeywords(schema.toJson(), schemaKeywords)
        .withErrorFormat((msg) => `not sendable on the target wire: ${msg}`)
        .onSuccess(() => succeed(schema))
    );
  if (parsed.isFailure()) {
    return { kind: 'skipped', skipped: { name, reason: parsed.message, schema: inputSchema } };
  }

  const config: AiAssist.IAiClientToolConfig = {
    type: 'client_tool',
    name,
    description: description ?? name,
    parametersSchema: parsed.value,
    // IMcpToolAnnotations maps 1:1 onto AiAssist.IAiToolAnnotations. Only set the field when the
    // server provided usable annotations, so a tool without them stays exactly as before.
    ...(annotations !== undefined ? { annotations } : {})
  };
  return {
    kind: 'tool',
    tool: { config, execute: _makeExecute(session, name) }
  };
}

/**
 * Discovers an MCP server's tools and adapts each into an `AiAssist.IAiClientTool` that drops
 * directly into `AiAssist.executeClientToolTurn`.
 *
 * @remarks
 * **Constraint 1 — graceful degradation with NOISY warnings.** A tool whose `inputSchema` is
 * outside the JSON Schema subset supported by `JsonSchema.fromJson` is NOT adapted (the model
 * must never be offered a tool whose args we can't validate). Instead it is:
 * 1. excluded from {@link IAdaptMcpToolsResult.tools};
 * 2. surfaced structurally on {@link IAdaptMcpToolsResult.skipped} with the tool name, the
 *    JSON-pointer reason, and the raw failing schema; and
 * 3. logged as a NOISY `warning` (name + reason + raw schema) when an `options.logger` is
 *    supplied — so pointing this at a new server immediately reveals every subset feature to
 *    extend, with the schema in hand.
 *
 * A tool is also skipped, the same way, when the wire it will be sent on cannot carry its schema
 * (see {@link IAdaptMcpToolsOptions.schemaKeywords}; the default table is conservative and skips
 * a tool with an untyped `{}` parameter).
 *
 * The whole catalog never fails on a single bad schema; the only failure mode is an upstream
 * `listMcpTools` error.
 *
 * @param session - A connected session from `connectMcpSession`.
 * @param options - Optional logger for the NOISY skip warnings, and the target wire's keyword table.
 * @returns `Success` with `{ tools, skipped }`, or `Failure` only if tool discovery fails, with the
 * discovery failure's {@link McpFailureReason} as its detail.
 * @public
 */
export async function adaptMcpTools(
  session: IMcpSession,
  options?: IAdaptMcpToolsOptions
): Promise<DetailedResult<IAdaptMcpToolsResult, McpFailureReason>> {
  return (await listMcpTools(session))
    .onSuccess((descriptors) => {
      const tools: AiAssist.IAiClientTool[] = [];
      const skipped: IMcpSkippedTool[] = [];

      for (const descriptor of descriptors) {
        const outcome = _adaptOne(
          session,
          descriptor,
          options?.schemaKeywords ?? JsonSchema.unverifiedWireSchemaKeywords
        );
        if (outcome.kind === 'tool') {
          tools.push(outcome.tool);
        } else {
          skipped.push(outcome.skipped);
          // The skip warning carries server-supplied text (the tool name, and the raw schema, whose
          // `JSON.stringify` form still leaves DEL, C1 and U+2028/U+2029 raw); the structured
          // `skipped` record is left as the server sent it.
          options?.logger?.warn(
            printable(
              `mcp: skipping tool '${outcome.skipped.name}': inputSchema cannot be adapted: ` +
                `${outcome.skipped.reason}. ` +
                `Raw schema: ${JSON.stringify(outcome.skipped.schema)}`
            )
          );
        }
      }

      return succeedWithDetail<IAdaptMcpToolsResult, McpFailureReason>({ tools, skipped });
    })
    .withErrorFormat((msg) => `adaptMcpTools: ${msg}`);
}
