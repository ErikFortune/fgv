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

import { type Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import { Converters, type JsonObject } from '@fgv/ts-json-base';

import { type IMcpSession, type IMcpToolCallResult, type IMcpToolDescriptor } from './model';
import { type ISdkContentBlock, type ISdkToolDescriptor } from './sdk';
import { McpSession } from './session';

/**
 * Projects a single SDK tool descriptor into a public {@link IMcpToolDescriptor}. The
 * `inputSchema` field is validated as a `JsonValue`; an absent/non-JSON schema becomes `null`
 * (which {@link adaptMcpTools} then reports as un-adaptable rather than offering it to the model).
 */
function _toDescriptor(tool: ISdkToolDescriptor): IMcpToolDescriptor {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: Converters.jsonValue.convert(tool.inputSchema).orDefault(null)
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
 * Lists every tool a connected MCP server advertises, following the SDK's `nextCursor`
 * pagination until the full catalog is accumulated.
 *
 * @param session - A session from `connectMcpSession`.
 * @returns `Success` with the full tool catalog, or `Failure` on a foreign handle or a
 * transport/protocol error.
 * @public
 */
export async function listMcpTools(session: IMcpSession): Promise<Result<ReadonlyArray<IMcpToolDescriptor>>> {
  const sessionResult = McpSession.fromHandle(session);
  if (sessionResult.isFailure()) {
    return fail(`listMcpTools: ${sessionResult.message}`);
  }
  const { client } = sessionResult.value;

  const all: IMcpToolDescriptor[] = [];
  let cursor: string | undefined;

  // Cursor-paginated loop: fetch each page, accumulate, advance until nextCursor is absent.
  do {
    const pageResult = await captureAsyncResult(() =>
      client.listTools(cursor !== undefined ? { cursor } : undefined)
    ).withErrorFormat((msg) => `listMcpTools: ${msg}`);
    if (pageResult.isFailure()) {
      return fail(pageResult.message);
    }
    for (const tool of pageResult.value.tools) {
      all.push(_toDescriptor(tool));
    }
    cursor = pageResult.value.nextCursor;
  } while (cursor !== undefined);

  return succeed(all);
}

/**
 * Calls a named tool on a connected MCP server.
 *
 * @remarks
 * The SDK `CallToolResult` is projected to {@link IMcpToolCallResult} (text-block concatenation;
 * non-text blocks summarized). A result flagged `isError: true` is mapped to `Result.fail` with
 * the projected content — it is never swallowed, so `executeClientToolTurn` routes it back to the
 * model as a provider-native error tool-result.
 *
 * @param session - A session from `connectMcpSession`.
 * @param name - The tool name to invoke.
 * @param args - The tool arguments (a JSON object).
 * @returns `Success` with the projected content, or `Failure` on tool error / transport error /
 * foreign handle.
 * @public
 */
export async function callMcpTool(
  session: IMcpSession,
  name: string,
  args: JsonObject
): Promise<Result<IMcpToolCallResult>> {
  const sessionResult = McpSession.fromHandle(session);
  if (sessionResult.isFailure()) {
    return fail(`callMcpTool: ${sessionResult.message}`);
  }
  // The `withErrorFormat` wraps only transport/throw failures (it transforms the failure flowing
  // out of `captureAsyncResult`); the `isError` failure created in the later `onSuccess` is
  // downstream and stays clean, so the model-facing tool-error text is the server's verbatim
  // content rather than a doubly-prefixed message.
  return captureAsyncResult(() => sessionResult.value.client.callTool({ name, arguments: args }))
    .withErrorFormat((msg) => `callMcpTool '${name}': ${msg}`)
    .onSuccess((raw): Result<IMcpToolCallResult> => {
      const content = _projectContent(raw.content);
      if (raw.isError === true) {
        return fail(content.length > 0 ? content : `tool '${name}' reported an error`);
      }
      return succeed({ content });
    });
}
