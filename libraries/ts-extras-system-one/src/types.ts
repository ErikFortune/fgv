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

import type { Logging } from '@fgv/ts-utils';
import type {
  ChoiceResponse,
  EntryType,
  Fetch,
  Questions,
  RetryPolicy,
  ScoreResponse,
  SystemOneResult
} from '@typesafe-ai/sdk';

/**
 * Parameters for {@link createSystemOneClient}.
 * @remarks
 * Every value that the SDK would otherwise read from a `TYPESAFE_*` environment variable is
 * passed explicitly, so the composition root, never the process environment, chooses the server,
 * the model, the key and the log level.
 * @public
 */
export interface ICreateSystemOneClientParams {
  /** Absolute `http:` or `https:` URL of the System-1 server (for example `http://127.0.0.1:8700`). */
  readonly baseUrl: string;
  /**
   * Model id sent with every request (for example `clm-latest`, `clm-v0.1` or `jev-latest`). It is
   * trimmed, and the trimmed value is what is sent.
   */
  readonly model: string;
  /** API key, sent as a bearer token. `''` is allowed, for a keyless local server. */
  readonly apiKey: string;
  /**
   * Timeout per attempt, in milliseconds; the SDK's default is 10,000. There is no total budget
   * across retries: with the SDK's default policy (2 retries, `Retry-After` honoured up to 60 s), one
   * call can take well over 30 seconds.
   */
  readonly timeoutMs?: number;
  /** Overrides for the SDK's retry policy. */
  readonly retry?: Partial<RetryPolicy>;
  /**
   * Logger for the SDK's request summaries. With no logger, the SDK logs nothing. This package
   * never sets the SDK's level to `debug`, at which the SDK logs request bodies. The SDK's level is
   * taken from `logger.logLevel` once, when the client is created.
   */
  readonly logger?: Logging.ILogger;
  /** A `fetch` implementation, in place of the global `fetch`. */
  readonly fetch?: Fetch;
}

/**
 * An opaque client for one System-1 server and model, from {@link createSystemOneClient}.
 * @public
 */
export interface ISystemOneClient {
  /** The model id sent with every request. */
  readonly model: string;
}

/**
 * The caller's input bound, in characters. `'unchecked'` sends without measuring, and is correct
 * only for a backend known to refuse an over-long input rather than truncate it.
 * @public
 */
export type SystemOneInputLimit = { readonly maxChars: number } | 'unchecked';

/**
 * A request to {@link askSystemOne}.
 * @public
 */
export interface ISystemOneRequest<Q extends Questions> {
  /** The state the questions are asked about. */
  readonly state: EntryType;
  /** The questions, keyed by the ids their answers are returned under. */
  readonly questions: Q;
  /** The input bound. Required: there is no default. */
  readonly inputLimit: SystemOneInputLimit;
  /** Cancels the request and any pending retry. */
  readonly signal?: AbortSignal;
}

/**
 * An SDK answer type with `confidence` removed, which every backend defines differently.
 * @public
 */
export type WithoutConfidence<T> = T extends ChoiceResponse<infer C>
  ? Omit<ChoiceResponse<C>, 'confidence'>
  : T extends ScoreResponse<infer S>
  ? Omit<ScoreResponse<S>, 'confidence'>
  : T;

/**
 * The SDK's `SystemOneResult` for questions `Q`, with `confidence` removed from every `choice`
 * and `score` answer.
 * @public
 */
export type SystemOneAnswerResult<Q extends Questions> = {
  readonly [K in keyof SystemOneResult<Q>]: K extends 'answers'
    ? {
        readonly [A in keyof SystemOneResult<Q>['answers']]: WithoutConfidence<
          SystemOneResult<Q>['answers'][A]
        >;
      }
    : SystemOneResult<Q>[K];
};

/**
 * Token usage as reported by the server.
 * @public
 */
export interface ISystemOneUsage {
  readonly input_tokens: number;
  readonly output_tokens: number;
  /** Present when the server sends a finite number (CLM does). */
  readonly billing_units?: number;
}

/**
 * Timing headers exactly as the response carried them, unparsed.
 * @public
 */
export interface ISystemOneTimingHeaders {
  /** The `Server-Timing` header (openjev). */
  readonly 'server-timing'?: string;
  /** The `X-CLM-Latency-Ms` header (CLM). */
  readonly 'x-clm-latency-ms'?: string;
}

/**
 * Per-call measurements. Nothing aggregates or acts on them.
 * @public
 */
export interface ISystemOneMeta {
  /** The model that answered, from the response body. */
  readonly model: string;
  /** Token usage, from the response body. */
  readonly usage: ISystemOneUsage;
  /** Client wall time, including the SDK's retries and back-off. */
  readonly elapsedMs: number;
  /** From `x-typesafe-request-id`, or `undefined` when the server sends none. */
  readonly requestId: string | undefined;
  /** Omitted when the response carried neither timing header. */
  readonly timingHeaders?: ISystemOneTimingHeaders;
}

/**
 * A validated answer to {@link askSystemOne}.
 * @public
 */
export interface ISystemOneAnswer<Q extends Questions> {
  readonly result: SystemOneAnswerResult<Q>;
  readonly meta: ISystemOneMeta;
}

/**
 * Every reason {@link askSystemOne} can fail, as an `as const` list.
 * @public
 */
export const allSystemOneFailureReasons = [
  'input-over-limit',
  'invalid-request',
  'unauthorized',
  'rate-limited',
  'server',
  'connection',
  'timeout',
  'aborted',
  'invalid-response'
] as const;

/**
 * Why a System-1 call failed. Classified from the SDK's error class and the HTTP status, never
 * from the body text.
 * @public
 */
export type SystemOneFailureReason = (typeof allSystemOneFailureReasons)[number];

/**
 * The measured length of one candidate text.
 * @public
 */
export interface ISystemOneCriterionMeasure {
  /** The criterion key: a `choice` label, a `score` level index, or `true` / `false`. */
  readonly key: string;
  /** The characters the backend will embed for this candidate. */
  readonly length: number;
}

/**
 * The measured lengths for one question.
 * @public
 */
export interface ISystemOneQuestionMeasure {
  readonly questionId: string;
  /** The state, the two-character separator and the instructions. */
  readonly stateAndInstructions: number;
  /** One entry per candidate, in the order the backend embeds them. */
  readonly criteria: ReadonlyArray<ISystemOneCriterionMeasure>;
}

/**
 * The measured lengths for a request, from {@link measureSystemOneInput}.
 * @public
 */
export interface ISystemOneInputMeasure {
  readonly questions: ReadonlyArray<ISystemOneQuestionMeasure>;
}
