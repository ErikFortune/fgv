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
  type Converter,
  type Logging,
  type Result,
  Converters as UtilsConverters,
  Validators,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { Converters, type JsonObject, type JsonValue } from '@fgv/ts-json-base';

import { line, projectContent, receivedJson, toContentBlocks } from './content';
import {
  type IListMcpToolsOptions,
  type IMcpCallToolOptions,
  type IMcpSession,
  type IMcpToolAnnotations,
  type IMcpToolCallResult,
  type IMcpToolDescriptor,
  type IMcpToolExecution,
  MCP_TASK_SUPPORT_VALUES,
  type McpFailureReason,
  type McpTaskSupport
} from './model';
import { runSdkRequest, validateTimeoutMs } from './request';
import { type ISdkListToolsResult, type ISdkToolDescriptor, SDK_RAW_RESULT_SCHEMA, classifySdkError } from './sdk';
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
  // The title is display text, validated like the descriptor's own title; one that is not a
  // single printable line is dropped.
  const title = _line(obj.title);
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

const _taskSupport: Converter<McpTaskSupport, ReadonlyArray<McpTaskSupport>> =
  UtilsConverters.enumeratedValue<McpTaskSupport>(MCP_TASK_SUPPORT_VALUES);

/**
 * Validates/normalizes a raw (untrusted) MCP `Tool.execution` blob into an {@link IMcpToolExecution}.
 *
 * @remarks
 * Like {@link _normalizeAnnotations}: a blob that is absent, or not a JSON object, and a
 * `taskSupport` outside the known vocabulary are dropped — never failing discovery, never propagated
 * raw — and `undefined` is returned when nothing usable remains. A present value that is dropped is
 * logged at `info`, in fixed text: nothing server-supplied is echoed. Through the SDK this only sees
 * values that passed the SDK's own `tools/list` parse: an unknown or malformed value fails the page
 * as `'protocol'` there, before it gets here.
 */
function _normalizeExecution(raw: unknown, logger: Logging.ILogger | undefined): IMcpToolExecution | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const taskSupport = Converters.jsonObject
    .convert(raw)
    .withErrorFormat(() => "a tool's execution metadata is not a JSON object")
    .onSuccess((obj) =>
      obj.taskSupport === undefined
        ? succeed(undefined)
        : _taskSupport
            .convert(obj.taskSupport)
            .withErrorFormat(
              () => `a tool's execution.taskSupport is not one of ${MCP_TASK_SUPPORT_VALUES.join(', ')}`
            )
    )
    .onFailure((message) => {
      logger?.info(`mcp: ${message}; it was dropped`);
      return fail(message);
    })
    .orDefault();
  return taskSupport !== undefined ? { taskSupport } : undefined;
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
 * at `info`) when it is not JSON or holds a reserved key. The `execution` blob is normalized like the
 * annotations (see {@link _normalizeExecution}).
 */
function _toDescriptor(tool: ISdkToolDescriptor, logger: Logging.ILogger | undefined): IMcpToolDescriptor {
  const annotations = _normalizeAnnotations(tool.annotations);
  const execution = _normalizeExecution(tool.execution, logger);
  const title = _line(tool.title) ?? annotations?.title;
  const outputSchema = _receivedJsonOrOmit(tool.outputSchema, "a tool's outputSchema", logger);
  return {
    name: tool.name,
    ...(title !== undefined ? { title } : {}),
    description: tool.description,
    inputSchema: Converters.jsonValue.convert(tool.inputSchema).orDefault(null),
    ...(outputSchema !== undefined ? { outputSchema } : {}),
    ...(annotations !== undefined ? { annotations } : {}),
    ...(execution !== undefined ? { execution } : {})
  };
}

/**
 * Classifies a request failure on an established session, against the session's observed close.
 */
function _classify(session: McpSession, err: unknown): McpFailureReason {
  return session.describe(classifySdkError(err, { phase: 'session', closed: session.closeWatcher.closed }));
}

/**
 * Validates a listing's bounds: `maxPages` a positive integer, `maxTotalMs` a positive finite number
 * no greater than the timer limit (see `validateTimeoutMs`). Either may be absent.
 */
function _validateListingBounds(options: IListMcpToolsOptions | undefined): Result<IListMcpToolsOptions> {
  const maxPages = options?.maxPages;
  if (maxPages !== undefined && !(Number.isSafeInteger(maxPages) && maxPages > 0)) {
    return fail(`maxPages must be a positive integer (got ${maxPages})`);
  }
  return validateTimeoutMs('maxTotalMs', options?.maxTotalMs).onSuccess(() => succeed(options ?? {}));
}

/**
 * The overall deadline of one paged listing: a signal that aborts when `maxTotalMs` elapses or the
 * caller's signal aborts, whichever happens first.
 *
 * @remarks
 * Every page request is issued with {@link _ListingDeadline.signal} in place of the caller's, so an
 * expiry aborts the page in flight exactly as a caller's abort would. Which of the two came first is
 * decided by the reason the signal carries — `AbortSignal.any` keeps the reason of the first source
 * to abort — never by re-reading a clock after the fact. `AbortSignal.any` holds its sources weakly,
 * so a long-lived caller signal does not accumulate one listener per listing.
 */
class _ListingDeadline {
  public readonly signal: AbortSignal;
  private readonly _expiry: Error = new Error('listMcpTools: maxTotalMs elapsed');
  private readonly _timer: ReturnType<typeof setTimeout>;

  public constructor(maxTotalMs: number, callerSignal: AbortSignal | undefined) {
    const expiry = new AbortController();
    this._timer = setTimeout(() => expiry.abort(this._expiry), maxTotalMs);
    this.signal = callerSignal === undefined ? expiry.signal : AbortSignal.any([callerSignal, expiry.signal]);
  }

  /** Whether the deadline, rather than the caller, is what aborted the listing. */
  public get expired(): boolean {
    return this.signal.reason === this._expiry;
  }

  public dispose(): void {
    clearTimeout(this._timer);
  }
}

/** Reads the pages of one listing, enforcing its bounds. See {@link listMcpTools}. */
async function _listPages(
  mcpSession: McpSession,
  options: IListMcpToolsOptions,
  deadline: _ListingDeadline | undefined
): Promise<DetailedResult<ReadonlyArray<IMcpToolDescriptor>, McpFailureReason>> {
  const { maxPages, maxTotalMs } = options;
  const pageOptions = deadline !== undefined ? { ...options, signal: deadline.signal } : options;
  const all: IMcpToolDescriptor[] = [];
  let cursor: string | undefined;
  let pages: number = 0;

  // Cursor-paginated loop: fetch each page, accumulate, advance until nextCursor is absent.
  do {
    const params = cursor !== undefined ? { cursor } : undefined;
    const pageResult = await runSdkRequest<ISdkListToolsResult>(
      'listMcpTools',
      pageOptions,
      (err) => _classify(mcpSession, err),
      (sdkOptions) => mcpSession.client.listTools(params, sdkOptions)
    );
    if (pageResult.isFailure()) {
      // A page that failed once the deadline had fired failed because of it: the expiry aborts the
      // page in flight, and the SDK rejects with that abort. (The check runs in the same microtask
      // chain as the failure, so no timer can fire between them.) A caller's abort that landed first
      // keeps its own reason, and so its own classification.
      return deadline?.expired === true
        ? failWithDetail(`listMcpTools: the listing did not complete within maxTotalMs (${maxTotalMs} ms)`, {
            kind: 'limit-exceeded',
            limit: 'maxTotalMs'
          })
        : failWithDetail(pageResult.message, pageResult.detail);
    }
    pages++;
    for (const tool of pageResult.value.tools) {
      all.push(_toDescriptor(tool, mcpSession.logger));
    }
    cursor = pageResult.value.nextCursor;
    if (cursor !== undefined && maxPages !== undefined && pages >= maxPages) {
      return failWithDetail(`listMcpTools: the server's tool list continues past maxPages (${maxPages})`, {
        kind: 'limit-exceeded',
        limit: 'maxPages'
      });
    }
  } while (cursor !== undefined);

  return succeedWithDetail(all);
}

/**
 * Lists every tool a connected MCP server advertises, following the SDK's `nextCursor`
 * pagination until the full catalog is accumulated.
 *
 * @remarks
 * The request options (`timeoutMs`, `signal`, progress) apply to each page. Two optional bounds
 * apply to the whole listing, and neither has a default: `maxPages` stops a server that pages
 * without end, and `maxTotalMs` stops one that pages slowly. Exceeding either fails the listing with
 * the `'limit-exceeded'` {@link McpFailureReason}, naming the bound; the pages already read are
 * discarded, never returned as a truncated catalog.
 *
 * @param session - A session from `connectMcpSession`.
 * @param options - Optional per-page request options, and the listing's bounds.
 * @returns `Success` with the full tool catalog, or `Failure` on a foreign handle, an invalid option,
 * an exceeded bound, or a transport/protocol error. The failure's detail is a {@link McpFailureReason}.
 * @public
 */
export async function listMcpTools(
  session: IMcpSession,
  options?: IListMcpToolsOptions
): Promise<DetailedResult<ReadonlyArray<IMcpToolDescriptor>, McpFailureReason>> {
  return McpSession.fromHandle(session)
    .withFailureDetail<McpFailureReason>({ kind: 'invalid-handle' })
    .onSuccess((mcpSession) =>
      _validateListingBounds(options)
        .withFailureDetail<McpFailureReason>({ kind: 'invalid-options' })
        .onSuccess((validated) => succeedWithDetail({ mcpSession, validated }))
    )
    .withErrorFormat((msg) => `listMcpTools: ${msg}`)
    .thenOnSuccess(async ({ mcpSession, validated }) => {
      const deadline =
        validated.maxTotalMs !== undefined
          ? new _ListingDeadline(validated.maxTotalMs, validated.signal)
          : undefined;
      try {
        return await _listPages(mcpSession, validated, deadline);
      } finally {
        deadline?.dispose();
      }
    });
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
    // The SDK's generic result schema leaves `isError` unchecked, so a value that is not a boolean
    // is refused here rather than read as success.
    // A strict check: `Converters.boolean` would also accept the string "true".
    const isError = Validators.boolean.optional().validate(raw.isError);
    if (isError.isFailure()) {
      return failWithDetail<IMcpToolCallResult, McpFailureReason>(
        `callMcpTool '${name}': the result's isError is not a boolean`,
        { kind: 'protocol' }
      );
    }
    const blocks = toContentBlocks(raw.content, includeData);
    const content = projectContent(blocks);
    if (isError.value === true) {
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
