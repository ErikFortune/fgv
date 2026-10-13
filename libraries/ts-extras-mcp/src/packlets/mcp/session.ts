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
 * Session lifecycle — connect / close, converting the throwing SDK calls into `Result<T>`.
 * @packageDocumentation
 */

import {
  type DetailedResult,
  type Logging,
  type Result,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';

import {
  type IConnectMcpSessionParams,
  type IMcpServerInfo,
  type IMcpSession,
  type McpFailureReason
} from './model';
import { errorText, printable, runSdkRequest, validateTimeoutMs } from './request';
import {
  type ISdkClient,
  type ISdkRequestOptions,
  type ISdkTransport,
  SDK_DEFAULT_TIMEOUT_MS,
  classifySdkError,
  makeClient,
  makeTimeoutError,
  onToolListChanged,
  terminateHttpSession
} from './sdk';
import { McpTransport } from './transports';

/** Default client name advertised during the initialize handshake. */
const DEFAULT_CLIENT_NAME: string = '@fgv/ts-extras-mcp';
/**
 * Default client version advertised during the initialize handshake.
 *
 * @remarks
 * Keep in sync with this package's `package.json` version on each release. It is informational
 * only — MCP servers use it for logging/telemetry, not for behavior — so a drift is low-impact,
 * but it should be bumped alongside the lockstep version. (Reading it from `package.json` at
 * runtime is avoided to keep the bundle free of a JSON import / `require` of the manifest.)
 */
const DEFAULT_CLIENT_VERSION: string = '5.1.0';

/**
 * How long {@link closeMcpSession} waits for a Streamable-HTTP server to answer the `DELETE` that
 * ends its session, in milliseconds, before closing the transport anyway.
 *
 * @remarks
 * Termination is a courtesy to the server, so it must not hold the close: two seconds covers a
 * loopback or same-region round trip with room to spare, and caps what an unresponsive server can
 * add to a close. Closing the transport aborts a `DELETE` still pending at that point.
 * @internal
 */
export const TERMINATE_TIMEOUT_MS: number = 2000;

/**
 * Records whether a session's connection has closed, and forwards the close to the consumer's
 * `onClose` once it is armed.
 *
 * @remarks
 * It is attached to the SDK client *before* the handshake, so a close that lands while the
 * handshake is still settling is recorded rather than missed; the consumer's callback is armed
 * only once the session is handed out, so a session whose connect failed never reports a close.
 * @internal
 */
export class McpCloseWatcher {
  private _closed: boolean = false;
  private _closing: boolean = false;
  private _listener: (() => void | Promise<void>) | undefined;
  private readonly _logger: Logging.ILogger | undefined;

  public constructor(logger?: Logging.ILogger) {
    this._logger = logger;
  }

  /** Whether the connection has closed. Never reverts to `false`. */
  public get closed(): boolean {
    return this._closed;
  }

  /**
   * Whether the consumer has entered `closeMcpSession`. Set before the Streamable-HTTP `DELETE`,
   * which can hold the close for up to two seconds before the connection is actually closed. Read
   * only to stop consumer notifications: it does **not** classify in-flight calls, which still
   * fail by what the server or the observed close says. Never reverts to `false`.
   */
  public get closing(): boolean {
    return this._closing;
  }

  /** Records that the consumer has started closing the session. */
  public beginClosing(): void {
    this._closing = true;
  }

  /** Arms the consumer's callback. Called once, synchronously after a successful handshake. */
  public arm(listener: (() => void | Promise<void>) | undefined): void {
    this._listener = listener;
  }

  /**
   * Records the close and calls the armed listener, at most once. A listener that throws is
   * contained: the SDK calls this before failing the session's in-flight requests, and a throw
   * escaping here would leave those requests unsettled.
   */
  public notifyClosed(): void {
    if (this._closed) {
      return;
    }
    this._closed = true;
    const listener = this._listener;
    if (listener === undefined) {
      return;
    }
    // Contained here: a throw escaping would stop the SDK from failing the session's in-flight
    // requests. It is not awaited: the SDK fails the in-flight requests straight after.
    invokeContained('onClose', listener, this._logger);
  }
}

/**
 * Calls a consumer callback so that nothing it does can escape: a throw is caught, and a rejection
 * of the promise an `async` callback returns is caught too, never left as an unhandled rejection.
 * Both are logged at `error` (the consumer's own bug), with the text read by `errorText` for this
 * package's fallback text. The returned promise is not awaited.
 * @internal
 */
export function invokeContained(
  name: string,
  listener: () => void | Promise<void>,
  logger: Logging.ILogger | undefined
): void {
  try {
    // A returned thenable whose `then` throws becomes a rejection of `Promise.resolve`'s promise,
    // so it is caught below with the other rejections.
    Promise.resolve(listener()).catch((err: unknown) => {
      logger?.error(`mcp: ${name} callback rejected: ${errorText(err)}`);
    });
  } catch (err: unknown) {
    logger?.error(`mcp: ${name} callback threw: ${errorText(err)}`);
  }
}

/**
 * Forwards the server's `notifications/tools/list_changed` to the consumer's `onToolsChanged`.
 *
 * @remarks
 * Its `notify` is registered on the SDK client before the handshake. A notification that lands
 * before the session is handed out is held, and delivered once on a later macrotask after
 * {@link McpToolsChangedWatcher.arm} — by then `connectMcpSession` has returned, so the consumer
 * holds the session it would re-list with. Nothing is delivered once `closeMcpSession` has been
 * entered or the connection has closed: the check runs at delivery time, after every `await` or
 * deferral, against the session's close watcher.
 * @internal
 */
export class McpToolsChangedWatcher {
  private readonly _listener: () => void | Promise<void>;
  private readonly _closeWatcher: McpCloseWatcher;
  private readonly _logger: Logging.ILogger | undefined;
  private _armed: boolean = false;
  private _pending: boolean = false;

  public constructor(
    listener: () => void | Promise<void>,
    closeWatcher: McpCloseWatcher,
    logger?: Logging.ILogger
  ) {
    this._listener = listener;
    this._closeWatcher = closeWatcher;
    this._logger = logger;
  }

  /**
   * Called by the SDK for each notification. Delivers it, or holds it until armed. Nothing is
   * delivered once the consumer has entered `closeMcpSession` (the HTTP `DELETE` can hold the
   * close open while the server still sends), or once the connection has closed.
   */
  public notify(): void {
    if (this._closeWatcher.closing || this._closeWatcher.closed) {
      return;
    }
    if (!this._armed) {
      this._pending = true;
      return;
    }
    invokeContained('onToolsChanged', this._listener, this._logger);
  }

  /** Starts delivery. Called once, synchronously after a successful handshake. */
  public arm(): void {
    this._armed = true;
    if (this._pending) {
      this._pending = false;
      setTimeout(() => this.notify(), 0);
    }
  }
}

/**
 * Concrete session handle. Packlet-internal — carries the live SDK client that the operations
 * layer recovers via {@link McpSession.fromHandle}. Not exported from the package barrel.
 * @internal
 */
export class McpSession implements IMcpSession {
  public readonly clientName: string;
  public readonly clientVersion: string;
  public readonly serverInfo: IMcpServerInfo | undefined;
  /** The live SDK client. */
  public readonly client: ISdkClient;
  /** The session's close state. */
  public readonly closeWatcher: McpCloseWatcher;
  /** The logger supplied to `connectMcpSession`, if any. */
  public readonly logger: Logging.ILogger | undefined;
  /** The Streamable-HTTP transport whose server session a close terminates; `undefined` for any other kind. */
  private readonly _httpTransport: ISdkTransport | undefined;
  private _terminating: Promise<void> | undefined;

  public constructor(
    client: ISdkClient,
    clientName: string,
    clientVersion: string,
    serverInfo: IMcpServerInfo | undefined,
    closeWatcher: McpCloseWatcher,
    httpTransport?: ISdkTransport,
    logger?: Logging.ILogger
  ) {
    this.client = client;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
    this.serverInfo = serverInfo;
    this.closeWatcher = closeWatcher;
    this._httpTransport = httpTransport;
    this.logger = logger;
  }

  /**
   * Ends the server's Streamable-HTTP session, best-effort and bounded by
   * {@link TERMINATE_TIMEOUT_MS}. Never rejects. Sends at most one `DELETE` per session, however
   * many closes are made, and none for a non-HTTP session.
   */
  public terminate(): Promise<void> {
    const transport = this._httpTransport;
    if (transport === undefined) {
      return Promise.resolve();
    }
    this._terminating ??= _terminateWithin(transport, TERMINATE_TIMEOUT_MS, this.logger);
    return this._terminating;
  }

  /**
   * Narrows a public {@link IMcpSession} handle back to the concrete {@link McpSession}. Fails
   * loudly when handed a foreign object that did not originate from {@link connectMcpSession}.
   */
  public static fromHandle(handle: IMcpSession): Result<McpSession> {
    if (handle instanceof McpSession) {
      return succeed(handle);
    }
    return fail('invalid MCP session: expected a handle from connectMcpSession');
  }
}

/**
 * Runs the SDK's `connect`, bounded by the caller's abort and an overall deadline.
 *
 * @remarks
 * The SDK applies the request options to the `initialize` request only. Its `connect` also awaits
 * `transport.start()` and sending `notifications/initialized` — over Streamable HTTP a POST whose
 * only signal is the transport's own — and neither is covered, so a server that answers
 * `initialize` and then stalls would hang the connect forever. This races the whole connect
 * against the abort (rejecting with the per-call abort reason, so `runSdkRequest` classifies it
 * `'aborted'` by identity) and a timer (rejecting with the SDK's own timeout error).
 *
 * **Every losing path closes the client** — the race lost to the deadline, and the SDK's own
 * connect failing. The SDK does not close on all of its own failures: `Client.connect` awaits
 * `transport.start()` before the `try` that runs `void this.close()`, so a transport whose
 * `start()` rejects is never closed by the SDK. Where the SDK has already closed, a second close
 * is a no-op once the first has completed (`Protocol._onclose` clears the transport); a transport
 * whose `close()` never completes can be asked twice. The close watcher is not yet armed, so the
 * consumer's `onClose` is not called.
 *
 * **The close is started, not awaited.** Closing can take seconds (a stdio child is given time to
 * exit) or, for a custom transport, never finish; awaiting it would let teardown stretch the
 * connect past its deadline. Teardown therefore completes after the failure has been returned.
 *
 * **No Streamable-HTTP `DELETE` is sent here**, unlike {@link closeMcpSession}: the `DELETE` must
 * precede the close (closing aborts it), so sending it would hold the close behind a server round
 * trip. A connect that lost before `initialize` was answered has no session id to terminate; one
 * that lost after it (an abort or deadline during `notifications/initialized`) leaves the server's
 * session to expire on the server's own idle timeout.
 */
async function _connectWithin(
  client: ISdkClient,
  transport: ISdkTransport,
  sdkOptions: ISdkRequestOptions,
  timeoutMs: number
): Promise<void> {
  const connecting = client.connect(transport, sdkOptions);
  // The deadline is itself an abort: whichever of the timer and the caller's signal fires first
  // aborts it, with that cause as its reason, and `lost.signal.aborted` records that it fired.
  const lost = new AbortController();
  const deadline = new Promise<never>((resolve, reject) => {
    lost.signal.addEventListener('abort', () => reject(lost.signal.reason), { once: true });
  });
  const timer = setTimeout(() => lost.abort(makeTimeoutError(timeoutMs)), timeoutMs);
  const stopListening =
    sdkOptions.signal !== undefined
      ? _onAbort(sdkOptions.signal, (reason) => lost.abort(reason))
      : (): void => undefined;
  // Whichever loses the race must not surface as an unhandled rejection.
  connecting.catch(() => undefined);
  deadline.catch(() => undefined);
  return Promise.race([connecting, deadline])
    .catch((err: unknown) => {
      client.close().catch(() => undefined);
      return Promise.reject(err);
    })
    .finally(() => {
      clearTimeout(timer);
      stopListening();
    });
}

/**
 * Sends the Streamable-HTTP `DELETE` for `transport`, waiting at most `timeoutMs` for it. Never
 * rejects.
 *
 * @remarks
 * A failure (a non-2xx answer other than 405, a network error, a dropped connection) and an
 * expired bound are each logged once, at `detail`: termination is a courtesy whose failure the
 * consumer cannot act on, and the close proceeds either way. The error text can carry the server's
 * HTTP reason phrase, so it is escaped for the log line. A `DELETE` still pending at the bound is
 * left to the close that follows, which aborts it; its eventual rejection is absorbed here.
 */
async function _terminateWithin(
  transport: ISdkTransport,
  timeoutMs: number,
  logger: Logging.ILogger | undefined
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const bound = new Promise<'timed-out'>((resolve) => {
    timer = setTimeout(() => resolve('timed-out'), timeoutMs);
  });
  const terminating = Promise.resolve()
    .then(() => terminateHttpSession(transport))
    .then(
      () => 'terminated' as const,
      (err: unknown) => ({ failed: err })
    );
  const outcome = await Promise.race([terminating, bound]);
  clearTimeout(timer);
  if (outcome === 'timed-out') {
    logger?.detail(`mcp: session termination did not finish within ${timeoutMs} ms; closing anyway`);
  } else if (outcome !== 'terminated') {
    logger?.detail(
      printable(`mcp: session termination failed; closing anyway: ${errorText(outcome.failed)}`)
    );
  }
}

/**
 * Calls `onAbort` with the signal's reason when it aborts — immediately, if it already has (the
 * SDK's `connect` runs synchronously up to its first `await`, so an abort can land before this
 * listener exists). Returns a function that stops listening.
 */
function _onAbort(signal: AbortSignal, onAbort: (reason: unknown) => void): () => void {
  const listener = (): void => onAbort(signal.reason);
  if (signal.aborted) {
    listener();
  } else {
    signal.addEventListener('abort', listener, { once: true });
  }
  return () => signal.removeEventListener('abort', listener);
}

/**
 * Whether a signal has already aborted. A function rather than an inline `signal?.aborted` check, so
 * the compiler does not carry the result past the handshake's `await`, where the signal can since
 * have aborted.
 */
function _alreadyAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

/**
 * Connects to an MCP server over the given transport and performs the initialize handshake.
 *
 * @param params - Transport plus optional client identity, logger and close observer.
 * @returns `Success` with an opaque {@link IMcpSession}, or `Failure` if the transport handle is
 * foreign or the connection/handshake fails. The failure's detail is a {@link McpFailureReason}.
 * @public
 */
export async function connectMcpSession(
  params: IConnectMcpSessionParams
): Promise<DetailedResult<IMcpSession, McpFailureReason>> {
  const { transport, clientName, clientVersion, logger, onClose, onToolsChanged, timeoutMs, signal } = params;

  // Validated before the handle is claimed, so a bad option does not consume the transport. The
  // connect race below also uses it as its own timer. runSdkRequest validates it again on this
  // path, where that check can no longer fail; it is kept because runSdkRequest owns validation for
  // every request, and skipping it here would need a connect-only bypass for no behavioural gain.
  const timeoutCheck = validateTimeoutMs('timeoutMs', timeoutMs);
  if (timeoutCheck.isFailure()) {
    return failWithDetail(`connectMcpSession: ${timeoutCheck.message}`, { kind: 'invalid-options' });
  }
  // Likewise an abort that has already happened: nothing would be started, so the transport stays
  // unclaimed and the caller can retry with it. runSdkRequest still catches an abort that lands
  // after the claim.
  if (_alreadyAborted(signal)) {
    return failWithDetail('connectMcpSession: aborted before the request was sent', { kind: 'aborted' });
  }
  const claimed = McpTransport.fromHandle(transport).onSuccess((handle) => handle.claim());
  if (claimed.isFailure()) {
    return failWithDetail(`connectMcpSession: ${claimed.message}`, { kind: 'invalid-handle' });
  }

  const name = clientName ?? DEFAULT_CLIENT_NAME;
  const version = clientVersion ?? DEFAULT_CLIENT_VERSION;
  const client = makeClient(name, version);
  const closeWatcher = new McpCloseWatcher(logger);
  client.onclose = () => closeWatcher.notifyClosed();
  // Registered before the handshake, so a notification sent straight after `initialize` is held
  // rather than missed. Only when asked for, so a session without the callback is unchanged.
  const toolsChangedWatcher =
    onToolsChanged !== undefined
      ? new McpToolsChangedWatcher(onToolsChanged, closeWatcher, logger)
      : undefined;
  if (toolsChangedWatcher !== undefined) {
    onToolListChanged(client, () => toolsChangedWatcher.notify());
  }

  logger?.info(`mcp: connecting (client ${name}@${version}, transport ${transport.transportKind})`);

  const handshake = await runSdkRequest(
    'connectMcpSession',
    { timeoutMs, signal },
    (err) => classifySdkError(err, { phase: 'connect' }),
    (sdkOptions) => _connectWithin(client, claimed.value, sdkOptions, timeoutMs ?? SDK_DEFAULT_TIMEOUT_MS)
  );
  if (handshake.isFailure()) {
    return failWithDetail(handshake.message, handshake.detail);
  }
  // Every check below runs synchronously before `arm`, so a close that landed during the handshake
  // is already recorded and none can land between the checks and arming.
  if (closeWatcher.closed) {
    return failWithDetail('connectMcpSession: the connection closed during the handshake', {
      kind: 'not-connected'
    });
  }
  if (signal?.aborted === true) {
    // The abort landed after the server answered `initialize` but before the SDK's connect returned
    // (it still awaits sending `notifications/initialized`), so the SDK did not cancel anything.
    // Close what it opened rather than hand an aborting caller a live session to leak. The watcher
    // is unarmed, so this close is not reported to `onClose`. As on every other losing path the
    // close is started, not awaited, so a close that never settles cannot hold the abort.
    client.close().catch(() => undefined);
    return failWithDetail('connectMcpSession: aborted by the caller', { kind: 'aborted' });
  }
  closeWatcher.arm(onClose);
  toolsChangedWatcher?.arm();
  const raw = client.getServerVersion();
  const serverInfo: IMcpServerInfo | undefined =
    raw !== undefined ? { name: raw.name, version: raw.version } : undefined;
  logger?.info(
    serverInfo !== undefined
      ? `mcp: connected to server ${serverInfo.name}@${serverInfo.version}`
      : 'mcp: connected (server did not report identity)'
  );
  const httpTransport = transport.transportKind === 'http' ? claimed.value : undefined;
  return succeedWithDetail(
    new McpSession(client, name, version, serverInfo, closeWatcher, httpTransport, logger)
  );
}

/**
 * Closes an MCP session, tearing down the transport (and any spawned subprocess).
 *
 * @remarks
 * The session's `onClose` callback, when one was supplied, fires as part of this close.
 *
 * **Streamable HTTP.** Before closing the transport, the close ends the session on the server by
 * sending the Streamable-HTTP `DELETE` (the SDK's `terminateSession()`), so the server can free it
 * rather than wait for its own idle timeout. This is best-effort and bounded: a server that answers
 * 405 (it does not support termination), fails, drops the connection or never answers does not
 * fail the close, and delays it by at most two seconds. A termination failure is logged at `detail`
 * to the session's `logger`. Only the first close of a session sends the `DELETE`. Stdio and custom
 * transports are closed exactly as before.
 *
 * A call still in flight when the `DELETE` lands may be failed by the server before the transport
 * closes, so it can report the server's answer (`'protocol'`, `'session-expired'`) rather than
 * `'not-connected'`.
 *
 * @param session - A session from {@link connectMcpSession}.
 * @returns `Success(true)`, or `Failure` if the handle is foreign or the close call throws.
 * @public
 */
export async function closeMcpSession(session: IMcpSession): Promise<Result<true>> {
  const sessionResult = McpSession.fromHandle(session);
  if (sessionResult.isFailure()) {
    return fail(`closeMcpSession: ${sessionResult.message}`);
  }
  const mcpSession = sessionResult.value;

  // Entered before the first `await`, so no notification is delivered from here on.
  mcpSession.closeWatcher.beginClosing();

  // Converted with errorText, for this package's fallback text on a rejection value that cannot be
  // read (see errorText). `terminate` never rejects, so only the close can fail the result.
  return Promise.resolve()
    .then(() => mcpSession.terminate())
    .then(() => mcpSession.client.close())
    .then(
      () => succeed(true as const),
      (err: unknown) => fail<true>(`closeMcpSession: ${errorText(err)}`)
    );
}
