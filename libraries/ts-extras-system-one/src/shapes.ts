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

import { Converters as JsonConverters, isJsonArray, isJsonObject } from '@fgv/ts-json-base';
import {
  Converter,
  Converters,
  Logging,
  MessageAggregator,
  Validator,
  Validators,
  captureResult,
  fail,
  mapResults,
  populateObject,
  succeed,
  type Result
} from '@fgv/ts-utils';
import type {
  ChoiceQuestion,
  EntryType,
  Fetch,
  NoulQuestion,
  Question,
  Questions,
  RetryPolicy,
  ScoreQuestion
} from '@typesafe-ai/sdk';
import type { ISdkLogTarget } from './logging';

/*
 * Shape checks for what a JavaScript caller hands the public entry points. Each is a gate: it
 * converts the input into a fresh value of the declared shape, and its failure message is fixed
 * text that names fields or the caller's own ids, never a value (a value may be a key, a URL with
 * credentials, or the state). Every message starts with the reason, `invalid-request`.
 *
 * Each gate reads the caller's input once. The callers use only the converted value afterwards, so
 * a getter or a Proxy that answers differently on a second read is never asked twice: what is
 * checked is what is sent or measured. A caller's object is snapshotted (`callerRecord`) before its
 * fields are converted, and every converted value is a new object, except where noted below.
 */

/**
 * Converts without throwing. A converter formats its failure by quoting what it rejected with
 * `JSON.stringify`, which throws on a cycle or a `bigint`, and a recursive JSON check overflows the
 * stack on a cycle, so any conversion of a caller's or a server's value can throw. A throw becomes a
 * failure; every caller replaces the message with fixed text, so the thrown text is never shown.
 */
export function safeConvert<T>(converter: Converter<T> | Validator<T>, from: unknown): Result<T> {
  return captureResult(() => converter.convert(from)).onSuccess((result) => result);
}

/** Any value, passed through; used where only the keys of a record matter. */
export const anyValue: Converter<unknown> = Converters.generic((from: unknown) => succeed(from));

/** A JSON object (not an array) of any values, for describing what was received. */
export const jsonRecord: Converter<Record<string, unknown>> = Converters.recordOf(anyValue);

/**
 * Whether a value is an object with an own `__proto__` key, as `JSON.parse` can produce. The probe
 * is a property lookup, which a Proxy's `getOwnPropertyDescriptor` trap can make throw, so it is a
 * `Result`.
 */
export function reservedKeyIn(from: unknown): Result<boolean> {
  return captureResult(
    () => typeof from === 'object' && from !== null && Object.prototype.hasOwnProperty.call(from, '__proto__')
  );
}

/**
 * `Converters.recordOf`, refusing an object with an own `__proto__` key. `recordOf` writes each key
 * into a plain object, where `__proto__` sets the prototype instead of creating a key, so the key
 * would vanish and an exact-key check after the conversion could not see it.
 */
export function ownRecordOf<T>(inner: Converter<T> | Validator<T>): Converter<Record<string, T>> {
  const record = Converters.recordOf(inner);
  return Converters.generic((from: unknown) =>
    reservedKeyIn(from).onSuccess((reserved) =>
      reserved ? fail('"__proto__" is a reserved key') : record.convert(from)
    )
  );
}

/**
 * A snapshot of a caller's object: a new object holding each own enumerable value, read once.
 * Refuses a reserved key, whose value would otherwise be read as a prototype. The values are passed
 * through (`anyValue`); each one the gates use is then converted, and the rest are never read.
 */
const callerRecord: Converter<Record<string, unknown>> = ownRecordOf(anyValue);

/** The names of the fields of an object that the given converters or validators reject. */
export function rejectedFields(
  record: Record<string, unknown>,
  fields: Record<string, Converter<unknown> | Validator<unknown>>
): string[] {
  return Object.keys(fields).filter((field) => safeConvert(fields[field], record[field]).isFailure());
}

/**
 * A snapshot of a JSON-shaped value that refuses an own `__proto__` key at any depth. The JSON
 * converter copies each key by assignment, where `__proto__` sets the copy's prototype instead of
 * creating a key, so a nested reserved key would vanish from what is sent. The walk descends exactly
 * where the JSON converter does (its own `isJsonArray` / `isJsonObject`), reads each value once, and
 * builds the snapshot with `Object.fromEntries`, which creates keys rather than assigning them;
 * anything else is passed through for the JSON converter to judge. A cycle overflows the stack and a
 * Proxy trap can throw, so it runs only inside `safeConvert`.
 */
function withoutReservedKeys(from: unknown): Result<unknown> {
  if (isJsonArray(from)) {
    return mapResults(from.map(withoutReservedKeys));
  }
  if (!isJsonObject(from)) {
    return succeed(from);
  }
  const entries = Object.entries(from);
  return entries.some(([key]) => key === '__proto__')
    ? fail('"__proto__" is a reserved key')
    : mapResults(
        entries.map(([key, value]) =>
          withoutReservedKeys(value).onSuccess(
            (snapshot): Result<[string, unknown]> => succeed([key, snapshot])
          )
        )
      ).onSuccess((snapshot) => succeed(Object.fromEntries(snapshot)));
}

/**
 * The SDK's `EntryType`: text, a JSON object or array, or `null`, checked recursively as JSON, so a
 * `Map`, a `Date`, a `bigint`, an `undefined`, a cycle or a reserved `__proto__` key anywhere inside
 * is refused rather than serialized into something else. A bare number or boolean is JSON but not an
 * `EntryType`.
 */
const entry: Converter<EntryType> = Converters.generic((from: unknown) =>
  withoutReservedKeys(from)
    .onSuccess((snapshot) => JsonConverters.jsonValue.convert(snapshot))
    .onSuccess(
      (value): Result<EntryType> =>
        typeof value === 'number' || typeof value === 'boolean'
          ? fail('not text, a JSON object or array, or null')
          : succeed(value)
    )
);

/** The SDK's own type for a noul's criteria: optional, `null`, or `true` / `false` descriptions. */
type NoulCriteria = NoulQuestion['criteria'];

const noulOutcomes: Converter<NonNullable<NoulCriteria>> = Converters.strictObject<NonNullable<NoulCriteria>>(
  {
    true: entry.optional(),
    false: entry.optional()
  }
);

/**
 * `null`, or the outcomes object. Not a `oneOf`: a failed alternative formats the value it was given,
 * reading the caller's getters once before the matching alternative reads them again.
 */
const noulCriteria: Converter<NoulCriteria> = Converters.generic(
  (from: unknown): Result<NoulCriteria> => (from === null ? succeed(null) : noulOutcomes.convert(from))
);

/** A score rubric: at least two levels, as the SDK's type declares. */
const scoreLevels: Converter<ScoreQuestion['criteria']> = Converters.arrayOf(entry).map(
  (levels): Result<ScoreQuestion['criteria']> => {
    const [first, second, ...rest] = levels;
    return first !== undefined && second !== undefined
      ? succeed([first, second, ...rest])
      : fail('a score needs at least two levels');
  }
);

/** A question, converted into a new object of the SDK's own type. */
const question: Converter<Question> = Converters.discriminatedObject<Question>('type', {
  noul: Converters.object<NoulQuestion>({
    type: Converters.literal('noul'),
    instructions: entry.optional(),
    criteria: noulCriteria.optional()
  }),
  choice: Converters.object<ChoiceQuestion>({
    type: Converters.literal('choice'),
    instructions: entry.optional(),
    criteria: ownRecordOf(entry)
  }),
  score: Converters.object<ScoreQuestion>({
    type: Converters.literal('score'),
    instructions: entry.optional(),
    criteria: scoreLevels
  })
});

const questionsShape: string = 'invalid-request: questions must be an object of named questions';

/** One question, snapshotted and then converted; the failure is the caller's question id. */
function questionEntry(id: string, from: unknown): Result<[string, Question]> {
  return safeConvert(callerRecord, from)
    .onSuccess((snapshot) => safeConvert(question, snapshot))
    .onSuccess((converted): Result<[string, Question]> => succeed([id, converted]))
    .withErrorFormat(() => id);
}

/**
 * Converts `questions` into a new object of well-formed noul, choice and score questions; the
 * failure names the caller's question ids at fault.
 */
export function checkQuestions(questions: unknown): Result<Questions> {
  const bad = new MessageAggregator();
  return reservedKeyIn(questions)
    .withErrorFormat(() => questionsShape)
    .onSuccess(
      (reserved): Result<Record<string, unknown>> =>
        reserved
          ? fail('invalid-request: [__proto__] is a reserved key and cannot be a question id')
          : safeConvert(callerRecord, questions).withErrorFormat(() => questionsShape)
    )
    .onSuccess((record) =>
      mapResults(
        Object.keys(record).map((id) => questionEntry(id, record[id])),
        bad
      ).withErrorFormat(
        () =>
          `invalid-request: [${bad.messages.join(', ')}] are not well-formed noul, choice or score questions`
      )
    )
    .onSuccess((entries) => succeed(Object.fromEntries(entries)));
}

/** The measure's input, converted. */
export interface ICheckedInput {
  readonly state: EntryType;
  readonly questions: Questions;
}

/** Converts the measure's state and questions, for the measure, which has no request object. */
export function checkInput(state: unknown, questions: unknown): Result<ICheckedInput> {
  return safeConvert(entry, state)
    .withErrorFormat(() => 'invalid-request: the state is not text, a JSON object or array, or null')
    .onSuccess((converted) =>
      checkQuestions(questions).onSuccess((checked) => succeed({ state: converted, questions: checked }))
    );
}

/**
 * An `AbortSignal`, passed through: a signal is the caller's channel for cancelling, not data, and
 * the SDK is meant to observe it changing.
 */
const abortSignal: Validator<AbortSignal> = Validators.isA(
  'an AbortSignal',
  (from: unknown): from is AbortSignal => from instanceof AbortSignal
);

/** Converts one field, failing with only its name, for a message that names fields and no values. */
function named<T>(name: string, converter: Converter<T> | Validator<T>, from: unknown): Result<T> {
  return safeConvert(converter, from).withErrorFormat(() => name);
}

/**
 * A request, converted: everything `askSystemOne` uses after its gate. The input limit is the
 * value the caller's request held, read once; the bound converts it.
 */
export interface ICheckedRequest {
  readonly state: EntryType;
  readonly questions: Questions;
  readonly inputLimit: unknown;
  readonly signal?: AbortSignal;
}

/**
 * Converts `request` (`{ state, questions, inputLimit, signal? }`) into a new request with a
 * converted state and questions, naming the fields at fault.
 */
export function checkRequest(request: unknown): Result<ICheckedRequest> {
  return safeConvert(callerRecord, request)
    .withErrorFormat(
      () => 'invalid-request: the request must be an object { state, questions, inputLimit, signal? }'
    )
    .onSuccess((record) => {
      const rejected = new MessageAggregator();
      return populateObject<{ state: EntryType; signal?: AbortSignal }>(
        {
          state: () => named('state', entry, record.state),
          signal: () => named('signal', abortSignal.optional(), record.signal)
        },
        { suppressUndefined: true },
        rejected
      )
        .withErrorFormat(() => `invalid-request: invalid [${rejected.messages.join(', ')}] in the request`)
        .onSuccess((fields) =>
          checkQuestions(record.questions).onSuccess((questions) =>
            succeed({ ...fields, questions, inputLimit: record.inputLimit })
          )
        );
    });
}

/**
 * A function, passed through: `fetch` is called, never read, and calling it is what it is for.
 */
const aFetch: Converter<Fetch> = Converters.isA(
  'a function',
  (from: unknown): from is Fetch => typeof from === 'function'
);

type LogMethod = (message?: unknown, ...parameters: unknown[]) => unknown;

const logMethod: Converter<LogMethod> = Converters.isA(
  'a function',
  (from: unknown): from is LogMethod => typeof from === 'function'
);

const loggerFields: Converter<ISdkLogTarget> = Converters.object<ISdkLogTarget>({
  logLevel: Logging.reporterLogLevel,
  detail: logMethod,
  info: logMethod,
  warn: logMethod,
  error: logMethod
});

/**
 * A logger, converted: its level, and each method read once and bound to the caller's logger. The
 * logger is read directly rather than snapshotted, because its methods are usually inherited; the
 * caller's logger is then held only as each method's `this`.
 */
const loggerShape: Converter<ISdkLogTarget> = Converters.generic((from: unknown) =>
  loggerFields.convert(from).onSuccess((fields) =>
    succeed({
      logLevel: fields.logLevel,
      detail: fields.detail.bind(from),
      info: fields.info.bind(from),
      warn: fields.warn.bind(from),
      error: fields.error.bind(from)
    })
  )
);

/** A set of HTTP statuses, copied into a new set; its members the SDK validates. */
const statusSet: Converter<ReadonlySet<number>> = Converters.generic((from: unknown) =>
  Validators.isA('a Set', (value: unknown): value is ReadonlySet<unknown> => value instanceof Set)
    .validate(from)
    .onSuccess((set) => Converters.arrayOf(Validators.number).convert([...set]))
    .onSuccess((statuses) => succeed(new Set(statuses)))
);

/**
 * Retry overrides, converted into a new object of the SDK's declared fields. Their ranges the SDK
 * validates; an undeclared field, which the SDK would ignore, is dropped.
 */
const retryShape: Converter<Partial<RetryPolicy>> = Converters.object<Partial<RetryPolicy>>({
  maxRetries: Validators.number.optional(),
  backoffInitialMs: Validators.number.optional(),
  backoffMaxMs: Validators.number.optional(),
  backoffJitter: Validators.number.optional(),
  httpStatuses: statusSet.optional(),
  respectRetryAfter: Validators.boolean.optional(),
  maxRetryAfterMs: Validators.number.optional(),
  apiConnectionError: Validators.boolean.optional(),
  apiTimeoutError: Validators.boolean.optional()
});

/**
 * Client parameters, converted: everything `createSystemOneClient` uses after its gate.
 */
export interface ICheckedClientParams {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
  readonly timeoutMs?: number;
  readonly retry?: Partial<RetryPolicy>;
  readonly logger?: ISdkLogTarget;
  readonly fetch?: Fetch;
}

/**
 * Converts `params` (`{ baseUrl, model, apiKey, timeoutMs?, retry?, logger?, fetch? }`) into new
 * parameters of the declared types, naming the fields at fault.
 */
export function checkClientParams(params: unknown): Result<ICheckedClientParams> {
  return safeConvert(callerRecord, params)
    .withErrorFormat(
      () =>
        'invalid-request: createSystemOneClient takes { baseUrl, model, apiKey, timeoutMs?, retry?, logger?, fetch? }'
    )
    .onSuccess((record) => {
      const rejected = new MessageAggregator();
      return populateObject<ICheckedClientParams>(
        {
          baseUrl: () => named('baseUrl', Converters.string, record.baseUrl),
          model: () => named('model', Converters.string, record.model),
          apiKey: () => named('apiKey', Converters.string, record.apiKey),
          timeoutMs: () => named('timeoutMs', Validators.number.optional(), record.timeoutMs),
          retry: () => named('retry', retryShape.optional(), record.retry),
          logger: () => named('logger', loggerShape.optional(), record.logger),
          fetch: () => named('fetch', aFetch.optional(), record.fetch)
        },
        { suppressUndefined: true },
        rejected
      ).withErrorFormat(
        () => `invalid-request: invalid [${rejected.messages.join(', ')}] in the client parameters`
      );
    });
}
