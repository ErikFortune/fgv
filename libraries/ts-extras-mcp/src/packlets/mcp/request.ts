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
 * Runs one SDK request with the caller's {@link IMcpRequestOptions} applied, and converts its
 * outcome into a `DetailedResult` whose failure carries a {@link McpFailureReason}.
 * @packageDocumentation
 */

import {
  type DetailedResult,
  type Result,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';

import { type IMcpProgress, type IMcpRequestOptions, type McpFailureReason } from './model';
import { type ISdkProgress, type ISdkRequestOptions, makeAbortReason } from './sdk';

/**
 * The message of a thrown or rejected value.
 * @internal
 */
export function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * The largest delay `setTimeout` honours (2³¹−1 ms). Node fires a larger — or an infinite — delay
 * after 1 ms instead, so a caller asking for "no timeout" would get an immediate one.
 * @internal
 */
export const MAX_TIMEOUT_MS: number = 2147483647;

/**
 * Validates one timeout-shaped option: absent, or a positive finite number of milliseconds no
 * greater than {@link MAX_TIMEOUT_MS}.
 * @internal
 */
export function validateTimeoutMs(name: string, value: number | undefined): Result<number | undefined> {
  if (value === undefined || (Number.isFinite(value) && value > 0 && value <= MAX_TIMEOUT_MS)) {
    return succeed(value);
  }
  return fail(
    `${name} must be a positive number of milliseconds no greater than ${MAX_TIMEOUT_MS} (got ${value})`
  );
}

function _toProgress(raw: ISdkProgress): IMcpProgress {
  return {
    progress: raw.progress,
    ...(raw.total !== undefined ? { total: raw.total } : {}),
    ...(raw.message !== undefined ? { message: raw.message } : {})
  };
}

function _toSdkOptions(options: IMcpRequestOptions, signal: AbortSignal | undefined): ISdkRequestOptions {
  const { timeoutMs, onProgress, resetTimeoutOnProgress, maxTotalTimeoutMs } = options;
  return {
    ...(timeoutMs !== undefined ? { timeout: timeoutMs } : {}),
    ...(signal !== undefined ? { signal } : {}),
    // Only pass a progress callback when one was given: its presence is what makes the SDK ask
    // the server for progress.
    ...(onProgress !== undefined ? { onprogress: (raw: ISdkProgress) => onProgress(_toProgress(raw)) } : {}),
    ...(resetTimeoutOnProgress !== undefined ? { resetTimeoutOnProgress } : {}),
    ...(maxTotalTimeoutMs !== undefined ? { maxTotalTimeout: maxTotalTimeoutMs } : {})
  };
}

/**
 * Runs `request` with the caller's options mapped onto the SDK's, and classifies its failure.
 *
 * @remarks
 * **Abort.** The caller's signal is never handed to the SDK. Each call links it to a fresh
 * internal controller that aborts with a distinct reason object, and the failure is `'aborted'`
 * exactly when the SDK rejected with *that* object. Ordering is therefore decided by the SDK's own
 * settlement — whichever of the abort and the timeout fired first is what it rejected with — not
 * by re-reading `signal.aborted` after the `await`, which a later abort could have flipped. The
 * caller's listener is removed when the request settles, so a long-lived signal (a whole turn's)
 * does not accumulate one per call; the SDK's own listener lands on the per-call signal instead.
 *
 * @param prefix - Prepended to every failure message.
 * @param options - The caller's options, if any.
 * @param classify - Classifies any failure that is not this call's abort.
 * @param request - Issues the SDK request with the mapped options.
 * @internal
 */
export async function runSdkRequest<T>(
  prefix: string,
  options: IMcpRequestOptions | undefined,
  classify: (err: unknown) => McpFailureReason,
  request: (sdkOptions: ISdkRequestOptions) => Promise<T>
): Promise<DetailedResult<T, McpFailureReason>> {
  const invalid = validateTimeoutMs('timeoutMs', options?.timeoutMs).onSuccess(() =>
    validateTimeoutMs('maxTotalTimeoutMs', options?.maxTotalTimeoutMs)
  );
  if (invalid.isFailure()) {
    return failWithDetail(`${prefix}: ${invalid.message}`, { kind: 'invalid-options' });
  }

  const callerSignal = options?.signal;
  // Check-then-link with no await between: either the signal is already aborted (and nothing is
  // sent), or the listener is in place before the request can be issued.
  if (callerSignal?.aborted === true) {
    return failWithDetail(`${prefix}: aborted before the request was sent`, { kind: 'aborted' });
  }

  const abortReason = makeAbortReason();
  const controller = new AbortController();
  const onAbort = (): void => controller.abort(abortReason);
  callerSignal?.addEventListener('abort', onAbort, { once: true });

  const sdkOptions = _toSdkOptions(options ?? {}, callerSignal !== undefined ? controller.signal : undefined);
  return (
    Promise.resolve()
      .then(() => request(sdkOptions))
      .then(
        (value) => succeedWithDetail<T, McpFailureReason>(value),
        (err: unknown) =>
          err === abortReason
            ? failWithDetail<T, McpFailureReason>(`${prefix}: aborted by the caller`, { kind: 'aborted' })
            : failWithDetail<T, McpFailureReason>(`${prefix}: ${errorText(err)}`, classify(err))
      )
      // An abort that lands after the SDK settled but before this listener is removed still makes the
      // SDK send `notifications/cancelled` for a request that already completed. The protocol lets a
      // server ignore a cancellation for an unknown or finished request, so this is harmless.
      .finally(() => callerSignal?.removeEventListener('abort', onAbort))
  );
}
