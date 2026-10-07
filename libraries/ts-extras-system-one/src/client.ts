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
  ISystemOneUsage,
  SystemOneFailureReason
} from './types';
import { modelCards, validateSystemOneBody } from './validate';

/** What a client stands for: the SDK client and the model it sends. */
interface IClientBinding {
  readonly sdk: TypeSafeClient;
  readonly model: string;
}

/**
 * The binding behind each {@link ISystemOneClient}. The interface stays opaque, and what is sent
 * never depends on the caller-held object.
 */
const bindings: WeakMap<ISystemOneClient, IClientBinding> = new WeakMap();

/**
 * Fails unless `baseUrl` is an absolute `http:` or `https:` URL with no query, fragment or
 * credentials. `?` and `#` are refused in the raw string, since the SDK appends paths to the string
 * as given, and a bare `?` or `#` parses to an empty `search` or `hash`.
 */
function checkBaseUrl(baseUrl: string): Result<string> {
  // The value is never echoed: a rejected URL can carry credentials, a token in its query, or both.
  const invalid = 'baseUrl must be an absolute http(s) URL with no query, fragment or credentials';
  return captureResult(() => new URL(baseUrl))
    .onFailure(() => fail(invalid))
    .onSuccess((url) =>
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !baseUrl.includes('?') &&
      !baseUrl.includes('#') &&
      url.username === '' &&
      url.password === ''
        ? succeed(baseUrl)
        : fail(invalid)
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
      const client: ISystemOneClient = Object.freeze({ model });
      bindings.set(client, { sdk, model });
      return succeed(client);
    });
}

/** The binding for a client from {@link createSystemOneClient}. */
function bindingFor(client: ISystemOneClient): Result<IClientBinding> {
  const binding = bindings.get(client);
  return binding !== undefined
    ? succeed(binding)
    : fail(failureMessage('invalid-request', 'client was not created by createSystemOneClient'));
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

/** Builds the meta for a validated response. */
function metaFor(
  model: string,
  usage: ISystemOneUsage,
  received: WithResponse<unknown>,
  elapsedMs: number
): ISystemOneMeta {
  const timingHeaders = timingHeadersOf(received.response);
  return {
    model,
    usage,
    elapsedMs,
    requestId: received.requestId,
    ...(timingHeaders !== undefined ? { timingHeaders } : {})
  };
}

/** Validates a 2xx response and builds the answer and its meta. */
function answerFrom<Q extends Questions>(
  questions: Q,
  received: WithResponse<SystemOneResult<Q>>,
  elapsedMs: number
): AskResult<Q> {
  return validateSystemOneBody(questions, received.data)
    .withErrorFormat((message) =>
      failureMessage('invalid-response', message, received.response.status, received.requestId)
    )
    .withFailureDetail<SystemOneFailureReason>('invalid-response')
    .onSuccess(({ result, usage }) =>
      succeedWithDetail({ result, meta: metaFor(result.model, usage, received, elapsedMs) })
    );
}

/** A request on its way: the SDK's pending response, and when it was sent. */
interface IPendingCall<Q extends Questions> {
  readonly pending: Promise<WithResponse<SystemOneResult<Q>>>;
  readonly started: number;
}

/** Sends the request. The SDK checks its questions synchronously and throws before any request. */
function startCall<Q extends Questions>(
  binding: IClientBinding,
  request: ISystemOneRequest<Q>
): DetailedResult<IPendingCall<Q>, SystemOneFailureReason> {
  const { state, questions, signal } = request;
  const started = Date.now();
  return captureResult(() =>
    binding.sdk
      .systemOne({ state, questions, model: binding.model }, signal !== undefined ? { signal } : {})
      .withResponse()
  )
    .withErrorFormat((message) => failureMessage('invalid-request', message))
    .withFailureDetail<SystemOneFailureReason>('invalid-request')
    .onSuccess((pending) => succeedWithDetail({ pending, started }));
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
  return checkInputLimit(request.state, request.questions, request.inputLimit)
    .onSuccess(() => bindingFor(client).withFailureDetail<SystemOneFailureReason>('invalid-request'))
    .onSuccess((binding) => startCall(binding, request))
    .thenOnSuccess(({ pending, started }) =>
      pending.then(
        (received) => answerFrom(request.questions, received, Date.now() - started),
        (err: unknown): AskResult<Q> => {
          const { reason, message } = classifyError(err, 'connection');
          return failWithDetail(message, reason);
        }
      )
    );
}

/**
 * Lists the models the server offers.
 * @param client - A client from {@link createSystemOneClient}.
 * @returns The model cards, or a failure whose message starts with the reason
 * {@link askSystemOne} would have classified, with the status and request id when there are any.
 * @public
 */
export async function listSystemOneModels(
  client: ISystemOneClient
): Promise<Result<ReadonlyArray<ModelCard>>> {
  return bindingFor(client).thenOnSuccess(({ sdk }) => {
    const listed = sdk.models.list();
    return listed.withResponse().then(
      (received): Result<ReadonlyArray<ModelCard>> =>
        modelCards
          .convert(received.data)
          .withErrorFormat((message) =>
            failureMessage('invalid-response', message, received.response.status, received.requestId)
          ),
      // The SDK raises its base error after a 2xx response whose shape it cannot unwrap; the
      // response itself is still available for its status and request id.
      (err: unknown): Promise<Result<ReadonlyArray<ModelCard>>> =>
        listed.asResponse().then(
          (response) =>
            fail(
              classifyError(
                err,
                'invalid-response',
                response.status,
                response.headers.get('x-typesafe-request-id') ?? undefined
              ).message
            ),
          () => fail(classifyError(err, 'invalid-response').message)
        )
    );
  });
}
