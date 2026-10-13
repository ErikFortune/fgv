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
 * Tool discovery (`listMcpTools`, paginated) and invocation (`callMcpTool`, with `CallToolResult`
 * projection), converting the throwing SDK calls into `Result<T>`.
 * @packageDocumentation
 */

import {
  type DetailedResult,
  type Logging,
  Converters as UtilsConverters,
  fail,
  failWithDetail,
  succeedWithDetail
} from '@fgv/ts-utils';
import { Converters, type JsonObject, type JsonValue } from '@fgv/ts-json-base';

import { line, projectContent, receivedJson, toContentBlocks } from './content';
import {
  type IMcpCallToolOptions,
  type IMcpSession,
  type IMcpToolAnnotations,
  type IMcpToolCallResult,
  type IMcpRequestOptions,
  type IMcpToolDescriptor,
  type McpFailureReason
} from './model';
import { runSdkRequest } from './request';
import { type ISdkToolDescriptor, SDK_RAW_RESULT_SCHEMA, classifySdkError } from './sdk';
import { McpSession } from './session';

/**
 * Validates/normalizes a raw (untrusted) MCP `Tool.annotations` blob into an
 * {@link IMcpToolAnnotations}, keeping only the five known fields that convert cleanly.
 *
 * @remarks
 * Each known field is converted independently with its own Converter, so a present-but-malformed
 * field is dropped (never failing the whole blob) and unknown keys are ignored. Returns
 * `undefined` when the blob is absent, not a JSON object, or normalizes to no usable known
 * fields — so a tool with no (usable) annotations leaves {@link IMcpToolDescriptor.annotations}
 * absent. The raw server value is never propagated verbatim (per the MCP untrusted-server
 * warning).
 */
function _normalizeAnnotations(raw: unknown): IMcpToolAnnotations | undefined {
  const objResult = Converters.jsonObject.convert(raw);
  if (objResult.isFailure()) {
    return undefined;
  }
  const obj = objResult.value;
  const title = UtilsConverters.string.convert(obj.title).orDefault();
  const readOnlyHint = UtilsConverters.boolean.convert(obj.readOnlyHint).orDefault();
  const destructiveHint = UtilsConverters.boolean.convert(obj.destructiveHint).orDefault();
  const idempotentHint = UtilsConverters.boolean.convert(obj.idempotentHint).orDefault();
  const openWorldHint = UtilsConverters.boolean.convert(obj.openWorldHint).orDefault();

  const normalized: IMcpToolAnnotations = {
    ...(title !== undefined ? { title } : {}),
    ...(readOnlyHint !== undefined ? { readOnlyHint } : {}),
    ...(destructiveHint !== undefined ? { destructiveHint } : {}),
    ...(idempotentHint !== undefined ? { idempotentHint } : {}),
    ...(openWorldHint !== undefined ? { openWorldHint } : {})
  };
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/** `value` when it is a single line of printable text (see `line`); otherwise `undefined`. */
function _line(value: unknown): string | undefined {
  return line.convert(value).orDefault();
}

/**
 * `value` as JSON ({@link receivedJson}), or `undefined` when it is absent or refused. A refusal is
 * logged at `info`, in fixed text: nothing server-supplied (a tool name, the value) is echoed.
 */
function _receivedJsonOrOmit(
  value: unknown,
  what: string,
  logger: Logging.ILogger | undefined
): JsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  return receivedJson(value)
    .onFailure((message) => {
      logger?.info(`mcp: ${what} was refused and omitted: ${message}`);
      return fail(message);
    })
    .orDefault();
}

/**
 * Projects a single SDK tool descriptor into a public {@link IMcpToolDescriptor}. The
 * `inputSchema` field is validated as a `JsonValue`; an absent/non-JSON schema becomes `null`
 * (which {@link adaptMcpTools} then reports as un-adaptable rather than offering it to the model).
 * The raw `annotations` blob is validated/normalized (never propagated raw) per the MCP
 * untrusted-server warning. The `title` falls back to the annotations' title, each taken only when
 * it is a single line; the `outputSchema` is carried as raw JSON, or omitted (and the refusal logged
 * at `info`) when it is not JSON or holds a reserved key.
 */
function _toDescriptor(tool: ISdkToolDescriptor, logger: Logging.ILogger | undefined): IMcpToolDescriptor {
  const annotations = _normalizeAnnotations(tool.annotations);
  const title = _line(tool.title) ?? _line(annotations?.title);
  const outputSchema = _receivedJsonOrOmit(tool.outputSchema, "a tool's outputSchema", logger);
  return {
    name: tool.name,
    ...(title !== undefined ? { title } : {}),
    description: tool.description,
    inputSchema: Converters.jsonValue.convert(tool.inputSchema).orDefault(null),
    ...(outputSchema !== undefined ? { outputSchema } : {}),
    ...(annotations !== undefined ? { annotations } : {})
  };
}

/**
 * Classifies a request failure on an established session, against the session's observed close.
 */
function _classify(session: McpSession, err: unknown): McpFailureReason {
  return classifySdkError(err, { phase: 'session', closed: session.closeWatcher.closed });
}

/**
 * Lists every tool a connected MCP server advertises, following the SDK's `nextCursor`
 * pagination until the full catalog is accumulated.
 *
 * @param session - A session from `connectMcpSession`.
 * @param options - Optional timeout, abort signal and progress callback, applied to each page.
 * @returns `Success` with the full tool catalog, or `Failure` on a foreign handle or a
 * transport/protocol error. The failure's detail is a {@link McpFailureReason}.
 * @public
 */
export async function listMcpTools(
  session: IMcpSession,
  options?: IMcpRequestOptions
): Promise<DetailedResult<ReadonlyArray<IMcpToolDescriptor>, McpFailureReason>> {
  const sessionResult = McpSession.fromHandle(session);
  if (sessionResult.isFailure()) {
    return failWithDetail(`listMcpTools: ${sessionResult.message}`, { kind: 'invalid-handle' });
  }
  const mcpSession = sessionResult.value;
  const { client } = mcpSession;

  const all: IMcpToolDescriptor[] = [];
  let cursor: string | undefined;

  // Cursor-paginated loop: fetch each page, accumulate, advance until nextCursor is absent.
  do {
    const params = cursor !== undefined ? { cursor } : undefined;
    const pageResult = await runSdkRequest(
      'listMcpTools',
      options,
      (err) => _classify(mcpSession, err),
      (sdkOptions) => client.listTools(params, sdkOptions)
    );
    if (pageResult.isFailure()) {
      return failWithDetail(pageResult.message, pageResult.detail);
    }
    for (const tool of pageResult.value.tools) {
      all.push(_toDescriptor(tool, mcpSession.logger));
    }
    cursor = pageResult.value.nextCursor;
  } while (cursor !== undefined);

  return succeedWithDetail(all);
}

/**
 * Calls a named tool on a connected MCP server.
 *
 * @remarks
 * The SDK `CallToolResult` is projected to {@link IMcpToolCallResult}: every content block,
 * converter-validated, as `blocks`; their text projection as `content`; and `structuredContent`
 * when it is JSON. An unknown or malformed block becomes an `unknown` block and never fails the
 * call. Media data (image, audio, blob) is carried only when `options.includeMediaData` is `true`.
 * A `resource_link` is reported, never followed.
 *
 * The result is read with the SDK's generic result schema rather than its `CallToolResult` schema,
 * which rejects the whole response over one block of a type it does not know; this package
 * validates the result itself. The SDK still checks `structuredContent` against the tool's
 * `outputSchema` when an earlier `listMcpTools` gave it one.
 *
 * A result flagged `isError: true` is mapped to a failure whose message is the text projection
 * **verbatim** and whose detail is `'tool-error'` — it is never swallowed, so
 * `executeClientToolTurn` routes the server's own words back to the model as a provider-native
 * error tool-result. Every other failure is prefixed `callMcpTool '<name>':` and classified per
 * {@link McpFailureReason}.
 *
 * @param session - A session from `connectMcpSession`.
 * @param name - The tool name to invoke.
 * @param args - The tool arguments (a JSON object).
 * @param options - Optional timeout, abort signal, progress callback and media opt-in for this call.
 * @returns `Success` with the projected result, or `Failure` on tool error / transport error /
 * foreign handle. The failure's detail is a {@link McpFailureReason}.
 * @public
 */
export async function callMcpTool(
  session: IMcpSession,
  name: string,
  args: JsonObject,
  options?: IMcpCallToolOptions
): Promise<DetailedResult<IMcpToolCallResult, McpFailureReason>> {
  const sessionResult = McpSession.fromHandle(session);
  if (sessionResult.isFailure()) {
    return failWithDetail(`callMcpTool: ${sessionResult.message}`, { kind: 'invalid-handle' });
  }
  const mcpSession = sessionResult.value;
  const includeData = options?.includeMediaData === true;
  // Only request failures are prefixed; the `isError` failure built in `onSuccess` is the server's
  // verbatim content, so the model-facing tool-error text is exactly what the tool said.
  return (
    await runSdkRequest(
      `callMcpTool '${name}'`,
      options,
      (err) => _classify(mcpSession, err),
      (sdkOptions) => mcpSession.client.callTool({ name, arguments: args }, SDK_RAW_RESULT_SCHEMA, sdkOptions)
    )
  ).onSuccess((raw) => {
    const blocks = toContentBlocks(raw.content, includeData);
    const content = projectContent(blocks);
    if (raw.isError === true) {
      return failWithDetail<IMcpToolCallResult, McpFailureReason>(
        content.length > 0 ? content : `tool '${name}' reported an error`,
        { kind: 'tool-error' }
      );
    }
    const structuredContent = _receivedJsonOrOmit(
      raw.structuredContent,
      "a tool result's structuredContent",
      mcpSession.logger
    );
    return succeedWithDetail<IMcpToolCallResult, McpFailureReason>({
      content,
      blocks,
      ...(structuredContent !== undefined ? { structuredContent } : {})
    });
  });
}
