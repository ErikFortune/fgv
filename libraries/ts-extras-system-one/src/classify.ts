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

import {
  APIConnectionError,
  APIError,
  APITimeoutError,
  APIUserAbortError,
  TypeSafeError
} from '@typesafe-ai/sdk';
import type { SystemOneFailureReason } from './types';

/**
 * A classified failure: the reason, and a message that names it.
 * @internal
 */
export interface IClassifiedFailure {
  readonly reason: SystemOneFailureReason;
  readonly message: string;
}

/** The reason for a non-2xx status. */
function reasonForStatus(status: number): SystemOneFailureReason {
  if (status === 401 || status === 403) {
    return 'unauthorized';
  }
  if (status === 408) {
    return 'timeout';
  }
  if (status === 429) {
    return 'rate-limited';
  }
  if (status >= 400 && status < 500) {
    return 'invalid-request';
  }
  return 'server';
}

/**
 * A failure message carrying the reason, the status and the request id when there are any, and
 * the original message.
 * @internal
 */
export function failureMessage(
  reason: SystemOneFailureReason,
  message: string,
  status?: number,
  requestId?: string
): string {
  const statusPart = status === undefined ? '' : ` (status ${status})`;
  const requestPart = requestId === undefined ? '' : ` (request ${requestId})`;
  return `${reason}${statusPart}${requestPart}: ${message}`;
}

/** The reason for an SDK error that is not a base `TypeSafeError`, or `undefined`. */
function reasonForSdkError(err: unknown): SystemOneFailureReason | undefined {
  if (err instanceof APIUserAbortError) {
    return 'aborted';
  }
  // A timeout is a kind of connection error, so it is tested first.
  if (err instanceof APITimeoutError) {
    return 'timeout';
  }
  if (err instanceof APIConnectionError) {
    return 'connection';
  }
  return undefined;
}

/**
 * Classifies anything the SDK threw or rejected with, by its class and HTTP status. Never by body
 * text, which differs between backends, and a non-2xx body never reaches the message.
 * @param err - What was thrown.
 * @param baseErrorReason - The reason for a base `TypeSafeError`, which the SDK raises for a
 * request it refuses to send or a response shape it cannot unwrap.
 * @param status - The response status, when a response arrived and the error does not carry it.
 * @param requestId - The response's request id, likewise.
 * @internal
 */
export function classifyError(
  err: unknown,
  baseErrorReason: SystemOneFailureReason,
  status?: number,
  requestId?: string
): IClassifiedFailure {
  if (err instanceof APIError) {
    // The SDK builds an APIError's message from the response body, which a server may use to echo
    // the request, state included; so the message names only the error class.
    const reason = reasonForStatus(err.status);
    return { reason, message: failureMessage(reason, err.name, err.status, err.requestId) };
  }
  const message = err instanceof Error ? err.message : String(err);
  const sdkReason = reasonForSdkError(err);
  if (sdkReason !== undefined) {
    return { reason: sdkReason, message: failureMessage(sdkReason, message) };
  }
  // The SDK funnels every fetch failure into APIConnectionError, so anything else that is not one
  // of its own errors is not expected; it is reported as a connection failure with its message.
  const reason = err instanceof TypeSafeError ? baseErrorReason : 'connection';
  return { reason, message: failureMessage(reason, message, status, requestId) };
}
