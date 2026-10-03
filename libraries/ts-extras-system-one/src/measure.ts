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

import { failWithDetail, succeedWithDetail, type DetailedResult } from '@fgv/ts-utils';
import type { EntryType, Question, Questions } from '@typesafe-ai/sdk';
import type {
  ISystemOneCriterionMeasure,
  ISystemOneInputMeasure,
  ISystemOneQuestionMeasure,
  SystemOneFailureReason,
  SystemOneInputLimit
} from './types';

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

/** The candidate texts CLM embeds for one question, measured. */
function measureCriteria(question: Question): ISystemOneCriterionMeasure[] {
  switch (question.type) {
    case 'choice':
      // A label with no description embeds the label itself.
      return Object.keys(question.criteria).map((key) => {
        const description = question.criteria[key];
        return { key, length: isEmptyDescription(description) ? key.length : lengthOf(description) };
      });
    case 'score':
      return question.criteria.map((level, index) => ({ key: String(index), length: lengthOf(level) }));
    default: {
      // noul: each outcome embeds `"<key>: "` and its description, or a default statement built
      // from the instructions, or (with neither) the key alone.
      const instructions = lengthOf(question.instructions);
      return (['true', 'false'] as const).map((key) => {
        const description = question.criteria?.[key];
        const body = !isEmptyDescription(description)
          ? lengthOf(description)
          : instructions > 0
          ? noulDefaults[key].length + instructions
          : key.length;
        return { key, length: key.length + 2 + body };
      });
    }
  }
}

/**
 * Measures, for each question, what an upstream CLM server embeds: the state plus the separator
 * plus the instructions, and each candidate text separately.
 * @remarks
 * Lengths are UTF-16 code units, and the texts are not trimmed as CLM trims them, so both
 * over-measure. Characters are a proxy for tokens, not a guarantee: the ratio varies with the content and with
 * each backend's tokenizer. A structured state is measured by its JSON serialization.
 * @param state - The state to be sent.
 * @param questions - The questions to be sent.
 * @returns The lengths the input bound compares against `maxChars`.
 * @public
 */
export function measureSystemOneInput(state: EntryType, questions: Questions): ISystemOneInputMeasure {
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

/**
 * Applies the input bound. Succeeds with the measure, or `undefined` for `'unchecked'`; fails with
 * the reason `invalid-request` or `input-over-limit` as its detail.
 * @internal
 */
export function checkInputLimit(
  state: EntryType,
  questions: Questions,
  inputLimit: SystemOneInputLimit
): DetailedResult<ISystemOneInputMeasure | undefined, SystemOneFailureReason> {
  if (inputLimit === 'unchecked') {
    return succeedWithDetail(undefined);
  }
  const { maxChars } = inputLimit;
  if (!Number.isInteger(maxChars) || maxChars <= 0) {
    return failWithDetail(
      `invalid-request: inputLimit.maxChars must be a positive integer, got ${maxChars}`,
      'invalid-request'
    );
  }
  const measure = measureSystemOneInput(state, questions);
  const over = firstOverLimit(measure, maxChars);
  if (over !== undefined) {
    return failWithDetail(
      `input-over-limit: question '${over.questionId}': ${over.part} measures ${over.length} characters, over the limit of ${maxChars}`,
      'input-over-limit'
    );
  }
  return succeedWithDetail(measure);
}
