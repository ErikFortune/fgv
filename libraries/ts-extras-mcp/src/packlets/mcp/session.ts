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
  captureAsyncResult,
  captureResult,
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
import { runSdkRequest } from './request';
import { type ISdkClient, classifySdkError, makeClient } from './sdk';
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
  private _listener: (() => void) | undefined;
  private readonly _logger: Logging.ILogger | undefined;

  public constructor(logger?: Logging.ILogger) {
    this._logger = logger;
  }

  /** Whether the connection has closed. Never reverts to `false`. */
  public get closed(): boolean {
    return this._closed;
  }

  /** Arms the consumer's callback. Called once, synchronously after a successful handshake. */
  public arm(listener: (() => void) | undefined): void {
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
    if (listener !== undefined) {
      captureResult(listener).onFailure((msg) => {
        this._logger?.error(`mcp: onClose callback threw: ${msg}`);
        return fail(msg);
      });
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

  public constructor(
    client: ISdkClient,
    clientName: string,
    clientVersion: string,
    serverInfo: IMcpServerInfo | undefined,
    closeWatcher: McpCloseWatcher
  ) {
    this.client = client;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
    this.serverInfo = serverInfo;
    this.closeWatcher = closeWatcher;
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
  const { transport, clientName, clientVersion, logger, onClose, timeoutMs, signal } = params;

  const transportResult = McpTransport.fromHandle(transport);
  if (transportResult.isFailure()) {
    return failWithDetail(`connectMcpSession: ${transportResult.message}`, { kind: 'invalid-handle' });
  }

  const name = clientName ?? DEFAULT_CLIENT_NAME;
  const version = clientVersion ?? DEFAULT_CLIENT_VERSION;
  const client = makeClient(name, version);
  const closeWatcher = new McpCloseWatcher(logger);
  client.onclose = () => closeWatcher.notifyClosed();

  logger?.info(
    `mcp: connecting (client ${name}@${version}, transport ${transportResult.value.transportKind})`
  );

  const handshake = await runSdkRequest(
    'connectMcpSession',
    { timeoutMs, signal },
    (err) => classifySdkError(err, 'connect'),
    (sdkOptions) => client.connect(transportResult.value.sdkTransport, sdkOptions)
  );
  return handshake.onSuccess(() => {
    // Check-then-arm with no await between: a close that landed during the handshake is already
    // recorded, and none can land between this check and `arm`.
    if (closeWatcher.closed) {
      return failWithDetail<IMcpSession, McpFailureReason>(
        'connectMcpSession: the connection closed during the handshake',
        { kind: 'not-connected' }
      );
    }
    closeWatcher.arm(onClose);
    const raw = client.getServerVersion();
    const serverInfo: IMcpServerInfo | undefined =
      raw !== undefined ? { name: raw.name, version: raw.version } : undefined;
    logger?.info(
      serverInfo !== undefined
        ? `mcp: connected to server ${serverInfo.name}@${serverInfo.version}`
        : 'mcp: connected (server did not report identity)'
    );
    return succeedWithDetail<IMcpSession, McpFailureReason>(
      new McpSession(client, name, version, serverInfo, closeWatcher)
    );
  });
}

/**
 * Closes an MCP session, tearing down the transport (and any spawned subprocess).
 *
 * @remarks
 * The session's `onClose` callback, when one was supplied, fires as part of this close.
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
  return captureAsyncResult(() => sessionResult.value.client.close())
    .onSuccess(() => succeed(true as const))
    .withErrorFormat((msg) => `closeMcpSession: ${msg}`);
}
