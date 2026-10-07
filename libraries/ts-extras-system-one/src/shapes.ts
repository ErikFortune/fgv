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

import { Converter, Converters, Validator, Validators, fail, succeed, type Result } from '@fgv/ts-utils';
import type { EntryType, NoulQuestion } from '@typesafe-ai/sdk';

/*
 * Shape checks for what a JavaScript caller hands the public entry points. Each is a gate: it
 * decides whether the input has the declared shape, and its failure message is fixed text that
 * names fields or the caller's own ids, never a value (a value may be a key, a URL with
 * credentials, or the state). Every message starts with the reason, `invalid-request`.
 */

/** Any value, passed through; used where only the keys of a record matter. */
export const anyValue: Converter<unknown> = Converters.generic((from: unknown) => succeed(from));

/** A JSON object (not an array) of any values. */
export const jsonRecord: Converter<Record<string, unknown>> = Converters.recordOf(anyValue);

/** The names of the fields of an object that the given converters or validators reject. */
export function rejectedFields(
  record: Record<string, unknown>,
  fields: Record<string, Converter<unknown> | Validator<unknown>>
): string[] {
  return Object.keys(fields).filter((field) => fields[field].convert(record[field]).isFailure());
}

/** The SDK's `EntryType`: text, a JSON object or array, or `null`. */
const entry: Converter<EntryType> = Converters.isA(
  'text, a JSON object or array, or null',
  (from: unknown): from is EntryType => from === null || typeof from === 'string' || typeof from === 'object'
);

/** The SDK's own type for a noul's criteria: optional, `null`, or `true` / `false` descriptions. */
type NoulCriteria = NoulQuestion['criteria'];

interface INoulShape {
  readonly type: 'noul';
  readonly instructions?: EntryType;
  readonly criteria?: NoulCriteria;
}

interface IChoiceShape {
  readonly type: 'choice';
  readonly instructions?: EntryType;
  readonly criteria: Record<string, EntryType>;
}

interface IScoreShape {
  readonly type: 'score';
  readonly instructions?: EntryType;
  readonly criteria: EntryType[];
}

const noulCriteria: Converter<NoulCriteria> = Converters.oneOf<NoulCriteria>([
  Converters.literal(null),
  Converters.strictObject<NonNullable<NoulCriteria>>({ true: entry.optional(), false: entry.optional() })
]);

/**
 * A question's shape. A `score` question's arity is left to the SDK, whose own check refuses fewer
 * than two levels before any request is made.
 */
const question: Converter<INoulShape | IChoiceShape | IScoreShape> = Converters.discriminatedObject<
  INoulShape | IChoiceShape | IScoreShape
>('type', {
  noul: Converters.object<INoulShape>({
    type: Converters.literal('noul'),
    instructions: entry.optional(),
    criteria: noulCriteria.optional()
  }),
  choice: Converters.object<IChoiceShape>({
    type: Converters.literal('choice'),
    instructions: entry.optional(),
    criteria: Converters.recordOf(entry)
  }),
  score: Converters.object<IScoreShape>({
    type: Converters.literal('score'),
    instructions: entry.optional(),
    criteria: Converters.arrayOf(entry)
  })
});

/**
 * Fails unless `questions` is an object whose every value is a well-formed noul, choice or score
 * question; the failure names the caller's question ids at fault.
 */
export function checkQuestions(questions: unknown): Result<true> {
  return jsonRecord
    .convert(questions)
    .withErrorFormat(() => 'invalid-request: questions must be an object of named questions')
    .onSuccess((record) => {
      const bad = Object.keys(record).filter((id) => question.convert(record[id]).isFailure());
      return bad.length === 0
        ? succeed(true as const)
        : fail(`invalid-request: [${bad.join(', ')}] are not well-formed noul, choice or score questions`);
    });
}

const abortSignal: Validator<AbortSignal> = Validators.isA(
  'an AbortSignal',
  (from: unknown): from is AbortSignal => from instanceof AbortSignal
);

/**
 * Fails unless `request` is `{ state, questions, inputLimit, signal? }` with a well-formed state,
 * questions and signal. The input limit's own shape is checked by the bound.
 */
export function checkRequest(request: unknown): Result<true> {
  return jsonRecord
    .convert(request)
    .withErrorFormat(
      () => 'invalid-request: the request must be an object { state, questions, inputLimit, signal? }'
    )
    .onSuccess((record) => {
      const fields = rejectedFields(record, { state: entry, signal: abortSignal.optional() });
      return fields.length === 0
        ? checkQuestions(record.questions)
        : fail(`invalid-request: invalid [${fields.join(', ')}] in the request`);
    });
}

const aFunction: Converter<unknown> = Converters.isA(
  'a function',
  (from: unknown): from is (...args: never[]) => unknown => typeof from === 'function'
);

const loggerShape: Converter<unknown> = Converters.object<Record<string, unknown>>({
  logLevel: Converters.string,
  detail: aFunction,
  info: aFunction,
  warn: aFunction,
  error: aFunction
});

/** Retry overrides: an object, whose fields the SDK itself validates. */
const retryShape: Converter<unknown> = Converters.isA(
  'an object of retry overrides',
  (from: unknown): from is object => typeof from === 'object' && from !== null && !Array.isArray(from)
);

/**
 * Fails unless `params` is `{ baseUrl, model, apiKey, timeoutMs?, retry?, logger?, fetch? }` with
 * fields of the declared types, naming the fields at fault.
 */
export function checkClientParams(params: unknown): Result<true> {
  return jsonRecord
    .convert(params)
    .withErrorFormat(
      () =>
        'invalid-request: createSystemOneClient takes { baseUrl, model, apiKey, timeoutMs?, retry?, logger?, fetch? }'
    )
    .onSuccess((record) => {
      const fields = rejectedFields(record, {
        baseUrl: Converters.string,
        model: Converters.string,
        apiKey: Converters.string,
        timeoutMs: Validators.number.optional(),
        retry: retryShape.optional(),
        logger: loggerShape.optional(),
        fetch: aFunction.optional()
      });
      return fields.length === 0
        ? succeed(true as const)
        : fail(`invalid-request: invalid [${fields.join(', ')}] in the client parameters`);
    });
}
