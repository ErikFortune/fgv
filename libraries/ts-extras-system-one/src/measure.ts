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
  Converter,
  Converters,
  Validators,
  failWithDetail,
  succeed,
  succeedWithDetail,
  type DetailedResult,
  type Result
} from '@fgv/ts-utils';
import type { EntryType, Question, Questions } from '@typesafe-ai/sdk';
import type {
  ISystemOneCriterionMeasure,
  ISystemOneInputMeasure,
  ISystemOneQuestionMeasure,
  SystemOneFailureReason,
  SystemOneInputLimit
} from './types';
import { checkInput, safeConvert } from './shapes';

/** CLM joins state and instructions with `"\n\n"`. */
const separatorLength: number = 2;

/** What CLM embeds for a `noul` outcome with no description, before the instructions. */
const noulDefaults: Readonly<Record<'true' | 'false', string>> = {
  true: 'Yes. This is true: ',
  false: 'No. This is false: '
};

/**
 * The measured length of a state, instructions or description: a string is its length, an absent
 * or `null` value is 0, and anything else is the length of its JSON serialization.
 */
function lengthOf(value: EntryType | undefined): number {
  if (value === undefined || value === null) {
    return 0;
  }
  return typeof value === 'string' ? value.length : JSON.stringify(value).length;
}

/** A description CLM treats as absent, so that it embeds a default in its place. */
function isEmptyDescription(value: EntryType | undefined): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * The measured length of a candidate whose description may be absent. CLM treats only `null` and
 * `''` as absent, so a whitespace-only description is embedded as written; but CLM also trims what
 * it embeds. That one is measured as the larger of its own length and the default's, which
 * over-measures whichever CLM does.
 */
function candidateLength(description: EntryType | undefined, defaultLength: number): number {
  if (isEmptyDescription(description)) {
    return defaultLength;
  }
  const length = lengthOf(description);
  return typeof description === 'string' && description.trim() === ''
    ? Math.max(length, defaultLength)
    : length;
}

/** The candidate texts CLM embeds for one question, measured. */
function measureCriteria(question: Question): ISystemOneCriterionMeasure[] {
  switch (question.type) {
    case 'choice':
      // A label with no description embeds the label itself.
      return Object.keys(question.criteria).map((key) => {
        const description = question.criteria[key];
        return { key, length: candidateLength(description, key.length) };
      });
    case 'score':
      return question.criteria.map((level, index) => ({ key: String(index), length: lengthOf(level) }));
    default: {
      // noul: each outcome embeds `"<key>: "` and its description, or a default statement built
      // from the instructions, or (with neither) the key alone.
      const instructions = lengthOf(question.instructions);
      return (['true', 'false'] as const).map((key) => {
        const defaultLength = instructions > 0 ? noulDefaults[key].length + instructions : key.length;
        return { key, length: key.length + 2 + candidateLength(question.criteria?.[key], defaultLength) };
      });
    }
  }
}

/**
 * Measures, for each question, what an upstream CLM server embeds: the state plus the separator
 * plus the instructions, and each candidate text separately.
 * @remarks
 * Lengths are UTF-16 code units, and the texts are not trimmed as CLM trims them, so both
 * over-measure. Characters are a proxy for tokens, not a guarantee: the ratio varies with the
 * content and with each backend's tokenizer. A structured state is measured by its JSON
 * serialization.
 *
 * Input outside the declared types — a question with missing or mis-shaped `criteria`, a state
 * or entry that is not JSON (a cycle, a `bigint`, a `Map`, a `Date`, an `undefined`) — fails
 * `invalid-request` rather than throws, and the message never quotes the input.
 * @param state - The state to be sent.
 * @param questions - The questions to be sent.
 * @returns The lengths the input bound compares against `maxChars`, or a failure naming why the
 * input could not be measured.
 * @public
 */
export function measureSystemOneInput(
  state: EntryType,
  questions: Questions
): Result<ISystemOneInputMeasure> {
  return checkInput(state, questions).onSuccess((checked) =>
    succeed(measureChecked(checked.state, checked.questions))
  );
}

/** Measures converted input: a state and questions that the gates have already converted. */
function measureChecked(state: EntryType, questions: Questions): ISystemOneInputMeasure {
  const stateLength = lengthOf(state);
  return {
    questions: Object.keys(questions).map(
      (questionId): ISystemOneQuestionMeasure => ({
        questionId,
        stateAndInstructions: stateLength + separatorLength + lengthOf(questions[questionId].instructions),
        criteria: measureCriteria(questions[questionId])
      })
    )
  };
}

/** One part of a question that is over the bound. */
interface IOverLimit {
  readonly questionId: string;
  readonly part: string;
  readonly length: number;
}

/** The first part of the measure that exceeds `maxChars`, if any. */
function firstOverLimit(measure: ISystemOneInputMeasure, maxChars: number): IOverLimit | undefined {
  for (const question of measure.questions) {
    if (question.stateAndInstructions > maxChars) {
      return {
        questionId: question.questionId,
        part: 'state+instructions',
        length: question.stateAndInstructions
      };
    }
    for (const criterion of question.criteria) {
      if (criterion.length > maxChars) {
        return {
          questionId: question.questionId,
          part: `criterion ${criterion.key}`,
          length: criterion.length
        };
      }
    }
  }
  return undefined;
}

/** `'unchecked'`, or `{ maxChars }` with a number, which is then checked to be a positive integer. */
const maxCharsShape: Converter<{ readonly maxChars: number }> = Converters.object<{
  readonly maxChars: number;
}>({ maxChars: Validators.number });

/**
 * `'unchecked'`, or `{ maxChars }`. Not a `oneOf`: a failed alternative formats the value it was
 * given, reading the caller's getters once before the matching alternative reads them again.
 */
const inputLimitShape: Converter<SystemOneInputLimit> = Converters.generic(
  (from: unknown): Result<SystemOneInputLimit> =>
    from === 'unchecked' ? succeed('unchecked') : maxCharsShape.convert(from)
);

/** Measures the input and compares every part with `maxChars`. */
function bound(
  state: EntryType,
  questions: Questions,
  maxChars: number
): DetailedResult<ISystemOneInputMeasure | undefined, SystemOneFailureReason> {
  if (!Number.isInteger(maxChars) || maxChars <= 0) {
    return failWithDetail(
      `invalid-request: inputLimit.maxChars must be a positive integer, got ${maxChars}`,
      'invalid-request'
    );
  }
  const measure = measureChecked(state, questions);
  const over = firstOverLimit(measure, maxChars);
  return over === undefined
    ? succeedWithDetail(measure)
    : failWithDetail(
        `input-over-limit: question '${over.questionId}': ${over.part} measures ${over.length} characters, over the limit of ${maxChars}`,
        'input-over-limit'
      );
}

/**
 * Applies the input bound to a converted state and questions. Succeeds with the measure, or
 * `undefined` for `'unchecked'`; fails with the reason `invalid-request` or `input-over-limit` as
 * its detail. A malformed limit is `invalid-request`, never a throw.
 * @param inputLimit - The limit the caller's request held, read once; converted here.
 * @internal
 */
export function checkInputLimit(
  state: EntryType,
  questions: Questions,
  inputLimit: unknown
): DetailedResult<ISystemOneInputMeasure | undefined, SystemOneFailureReason> {
  // `askSystemOne` has already converted the state and every question (`checkRequest`), in either
  // mode, so a malformed question is `invalid-request` in 'unchecked' mode too and nothing is sent.
  return safeConvert(inputLimitShape, inputLimit)
    .withErrorFormat(() => `invalid-request: inputLimit must be 'unchecked' or { maxChars: number }`)
    .withFailureDetail<SystemOneFailureReason>('invalid-request')
    .onSuccess((limit) =>
      limit === 'unchecked' ? succeedWithDetail(undefined) : bound(state, questions, limit.maxChars)
    );
}
