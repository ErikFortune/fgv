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
  Converters as UtilsConverters,
  failWithDetail,
  succeedWithDetail
} from '@fgv/ts-utils';
import { Converters, type JsonObject } from '@fgv/ts-json-base';

import {
  type IMcpSession,
  type IMcpToolAnnotations,
  type IMcpToolCallResult,
  type IMcpToolDescriptor,
  type McpFailureReason
} from './model';
import { type ISdkContentBlock, type ISdkToolDescriptor, classifySdkError } from './sdk';
import { McpSession, errorText } from './session';

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

/**
 * Projects a single SDK tool descriptor into a public {@link IMcpToolDescriptor}. The
 * `inputSchema` field is validated as a `JsonValue`; an absent/non-JSON schema becomes `null`
 * (which {@link adaptMcpTools} then reports as un-adaptable rather than offering it to the model).
 * The raw `annotations` blob is validated/normalized (never propagated raw) per the MCP
 * untrusted-server warning.
 */
function _toDescriptor(tool: ISdkToolDescriptor): IMcpToolDescriptor {
  const annotations = _normalizeAnnotations(tool.annotations);
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: Converters.jsonValue.convert(tool.inputSchema).orDefault(null),
    ...(annotations !== undefined ? { annotations } : {})
  };
}

/**
 * Projects the SDK `CallToolResult` content blocks to a single string: `text` blocks are
 * concatenated; every other block type becomes a one-line `[<type> block]` summary.
 */
function _projectContent(blocks: ReadonlyArray<ISdkContentBlock> | undefined): string {
  if (blocks === undefined || blocks.length === 0) {
    return '';
  }
  return blocks
    .map((block) =>
      block.type === 'text' && block.text !== undefined ? block.text : `[${block.type} block]`
    )
    .join('\n');
}

/**
 * Runs one SDK request on a session and converts its outcome into a `DetailedResult` whose failure
 * carries a {@link McpFailureReason}. `prefix` is prepended to the failure message.
 */
async function _request<T>(
  session: McpSession,
  prefix: string,
  request: () => Promise<T>
): Promise<DetailedResult<T, McpFailureReason>> {
  return Promise.resolve()
    .then(request)
    .then(
      (value) => succeedWithDetail<T, McpFailureReason>(value),
      (err: unknown) =>
        failWithDetail<T, McpFailureReason>(`${prefix}: ${errorText(err)}`, _classify(session, err))
    );
}

/**
 * Classifies a request failure. The SDK raises an untyped `Error` when a request is made on a
 * client whose transport has already closed; the session's observed close is what identifies it,
 * so a `'transport'` classification on a closed session is reported as `'not-connected'`.
 */
function _classify(session: McpSession, err: unknown): McpFailureReason {
  const reason = classifySdkError(err, 'session');
  return reason.kind === 'transport' && session.closeWatcher.closed ? { kind: 'not-connected' } : reason;
}

/**
 * Lists every tool a connected MCP server advertises, following the SDK's `nextCursor`
 * pagination until the full catalog is accumulated.
 *
 * @param session - A session from `connectMcpSession`.
 * @returns `Success` with the full tool catalog, or `Failure` on a foreign handle or a
 * transport/protocol error. The failure's detail is a {@link McpFailureReason}.
 * @public
 */
export async function listMcpTools(
  session: IMcpSession
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
    const pageResult = await _request(mcpSession, 'listMcpTools', () => client.listTools(params));
    if (pageResult.isFailure()) {
      return failWithDetail(pageResult.message, pageResult.detail);
    }
    for (const tool of pageResult.value.tools) {
      all.push(_toDescriptor(tool));
    }
    cursor = pageResult.value.nextCursor;
  } while (cursor !== undefined);

  return succeedWithDetail(all);
}

/**
 * Calls a named tool on a connected MCP server.
 *
 * @remarks
 * The SDK `CallToolResult` is projected to {@link IMcpToolCallResult} (text-block concatenation;
 * non-text blocks summarized). A result flagged `isError: true` is mapped to a failure whose
 * message is the projected content **verbatim** and whose detail is `'tool-error'` — it is never
 * swallowed, so `executeClientToolTurn` routes the server's own words back to the model as a
 * provider-native error tool-result. Every other failure is prefixed `callMcpTool '<name>':` and
 * classified per {@link McpFailureReason}.
 *
 * @param session - A session from `connectMcpSession`.
 * @param name - The tool name to invoke.
 * @param args - The tool arguments (a JSON object).
 * @returns `Success` with the projected content, or `Failure` on tool error / transport error /
 * foreign handle. The failure's detail is a {@link McpFailureReason}.
 * @public
 */
export async function callMcpTool(
  session: IMcpSession,
  name: string,
  args: JsonObject
): Promise<DetailedResult<IMcpToolCallResult, McpFailureReason>> {
  const sessionResult = McpSession.fromHandle(session);
  if (sessionResult.isFailure()) {
    return failWithDetail(`callMcpTool: ${sessionResult.message}`, { kind: 'invalid-handle' });
  }
  const mcpSession = sessionResult.value;
  // Only request failures are prefixed; the `isError` failure built in `onSuccess` is the server's
  // verbatim content, so the model-facing tool-error text is exactly what the tool said.
  return (
    await _request(mcpSession, `callMcpTool '${name}'`, () =>
      mcpSession.client.callTool({ name, arguments: args })
    )
  ).onSuccess((raw) => {
    const content = _projectContent(raw.content);
    if (raw.isError === true) {
      return failWithDetail<IMcpToolCallResult, McpFailureReason>(
        content.length > 0 ? content : `tool '${name}' reported an error`,
        { kind: 'tool-error' }
      );
    }
    return succeedWithDetail<IMcpToolCallResult, McpFailureReason>({ content });
  });
}
