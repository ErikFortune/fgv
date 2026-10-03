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
  captureResult,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail,
  type DetailedResult,
  type Result
} from '@fgv/ts-utils';
import {
  TypeSafeClient,
  type ModelCard,
  type Questions,
  type SystemOneResult,
  type TypeSafeClientConfig,
  type WithResponse
} from '@typesafe-ai/sdk';
import { classifyError, failureMessage } from './classify';
import { sdkLogging } from './logging';
import { checkInputLimit } from './measure';
import type {
  ICreateSystemOneClientParams,
  ISystemOneAnswer,
  ISystemOneClient,
  ISystemOneMeta,
  ISystemOneRequest,
  ISystemOneTimingHeaders,
  SystemOneFailureReason
} from './types';
import { modelCards, validateSystemOneBody } from './validate';

/** The SDK client behind each {@link ISystemOneClient}, which the interface keeps opaque. */
const sdkClients: WeakMap<ISystemOneClient, TypeSafeClient> = new WeakMap();

/** Fails unless `baseUrl` is an absolute `http:` or `https:` URL. */
function checkBaseUrl(baseUrl: string): Result<string> {
  return captureResult(() => new URL(baseUrl))
    .onFailure(() => fail(`baseUrl must be an absolute http(s) URL, got '${baseUrl}'`))
    .onSuccess((url) =>
      url.protocol === 'http:' || url.protocol === 'https:'
        ? succeed(baseUrl)
        : fail(`baseUrl must be an absolute http(s) URL, got '${baseUrl}'`)
    );
}

/**
 * Creates a client for one System-1 server and model.
 * @remarks
 * The server URL, model, key and log level are always passed to the SDK, so no `TYPESAFE_*`
 * environment variable can take effect. There is no per-call URL.
 * @param params - The server, model, key and options.
 * @returns The client, or a failure naming the invalid parameter.
 * @public
 */
export function createSystemOneClient(params: ICreateSystemOneClientParams): Result<ISystemOneClient> {
  const model = params.model.trim();
  if (model.length === 0) {
    return fail('model must be a non-empty string');
  }
  return checkBaseUrl(params.baseUrl)
    .onSuccess((baseURL) => {
      const config: TypeSafeClientConfig = {
        baseURL,
        defaultModel: model,
        apiKey: params.apiKey,
        ...sdkLogging(params.logger),
        ...(params.timeoutMs !== undefined ? { timeout: params.timeoutMs } : {}),
        ...(params.retry !== undefined ? { retry: params.retry } : {}),
        ...(params.fetch !== undefined ? { fetch: params.fetch } : {})
      };
      return captureResult(() => new TypeSafeClient(config));
    })
    .onSuccess((sdk) => {
      const client: ISystemOneClient = { model };
      sdkClients.set(client, sdk);
      return succeed(client);
    });
}

/** The SDK client for a client from {@link createSystemOneClient}. */
function sdkFor(client: ISystemOneClient): Result<TypeSafeClient> {
  const sdk = sdkClients.get(client);
  return sdk !== undefined ? succeed(sdk) : fail('client was not created by createSystemOneClient');
}

/** The timing headers the response carried, unparsed, or `undefined` for neither. */
function timingHeadersOf(response: Response): ISystemOneTimingHeaders | undefined {
  const serverTiming = response.headers.get('server-timing');
  const clmLatency = response.headers.get('x-clm-latency-ms');
  if (serverTiming === null && clmLatency === null) {
    return undefined;
  }
  return {
    ...(serverTiming !== null ? { 'server-timing': serverTiming } : {}),
    ...(clmLatency !== null ? { 'x-clm-latency-ms': clmLatency } : {})
  };
}

type AskResult<Q extends Questions> = DetailedResult<ISystemOneAnswer<Q>, SystemOneFailureReason>;

/** Validates a 2xx response and builds the answer and its meta. */
function answerFrom<Q extends Questions>(
  questions: Q,
  received: WithResponse<SystemOneResult<Q>>,
  elapsedMs: number
): AskResult<Q> {
  const validated = validateSystemOneBody(questions, received.data);
  if (validated.isFailure()) {
    return failWithDetail(
      failureMessage('invalid-response', validated.message, received.response.status, received.requestId),
      'invalid-response'
    );
  }
  const { result, usage } = validated.value;
  const timingHeaders = timingHeadersOf(received.response);
  const meta: ISystemOneMeta = {
    model: result.model,
    usage,
    elapsedMs,
    requestId: received.requestId,
    ...(timingHeaders !== undefined ? { timingHeaders } : {})
  };
  return succeedWithDetail({ result, meta });
}

/**
 * Asks a System-1 server the given questions about a state.
 * @remarks
 * In order: the input bound (unless `'unchecked'`), with no request made when it refuses; the
 * call; failure classification; validation of the response against the request's own questions;
 * and projection, which drops `confidence` and any field the SDK does not declare.
 * @param client - A client from {@link createSystemOneClient}.
 * @param request - The state, the questions, the input bound and an optional signal.
 * @returns The validated answer and its meta, or a failure whose detail is the reason.
 * @public
 */
export async function askSystemOne<const Q extends Questions>(
  client: ISystemOneClient,
  request: ISystemOneRequest<Q>
): Promise<DetailedResult<ISystemOneAnswer<Q>, SystemOneFailureReason>> {
  const { state, questions, inputLimit, signal } = request;
  const bound = checkInputLimit(state, questions, inputLimit);
  if (bound.isFailure()) {
    return failWithDetail(bound.message, bound.detail);
  }
  const sdk = sdkFor(client);
  if (sdk.isFailure()) {
    return failWithDetail(failureMessage('invalid-request', sdk.message), 'invalid-request');
  }
  const started = Date.now();
  // The SDK checks its questions synchronously and throws before returning a promise.
  const call = captureResult(() =>
    sdk.value
      .systemOne({ state, questions, model: client.model }, signal !== undefined ? { signal } : {})
      .withResponse()
  );
  if (call.isFailure()) {
    return failWithDetail(failureMessage('invalid-request', call.message), 'invalid-request');
  }
  return call.value.then(
    (received) => answerFrom(questions, received, Date.now() - started),
    (err: unknown): AskResult<Q> => {
      const { reason, message } = classifyError(err, 'connection');
      return failWithDetail(message, reason);
    }
  );
}

/**
 * Lists the models the server offers.
 * @param client - A client from {@link createSystemOneClient}.
 * @returns The model cards, or a failure whose message starts with the reason
 * {@link askSystemOne} would have classified.
 * @public
 */
export async function listSystemOneModels(
  client: ISystemOneClient
): Promise<Result<ReadonlyArray<ModelCard>>> {
  return sdkFor(client)
    .withErrorFormat((message) => failureMessage('invalid-request', message))
    .thenOnSuccess((sdk) =>
      sdk.models.list().then(
        (models): Result<ReadonlyArray<ModelCard>> =>
          modelCards
            .convert(models)
            .withErrorFormat((message) => failureMessage('invalid-response', message)),
        // The SDK raises its base error after the response when the shape cannot be unwrapped.
        (err: unknown): Result<ReadonlyArray<ModelCard>> =>
          fail(classifyError(err, 'invalid-response').message)
      )
    );
}
