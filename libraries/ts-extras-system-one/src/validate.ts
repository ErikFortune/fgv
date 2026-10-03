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
  Validator,
  Validators,
  fail,
  mapResults,
  succeed,
  type Result
} from '@fgv/ts-utils';
import type {
  ChoiceQuestion,
  ChoiceResponse,
  EntryType,
  ModelCard,
  NoulResponse,
  Question,
  Questions,
  ScoreQuestion,
  ScoreResponse
} from '@typesafe-ai/sdk';
import type { ISystemOneUsage, SystemOneAnswerResult } from './types';

/** How far a distribution's sum may be from 1. */
const sumTolerance: number = 1e-3;

type ProjectedChoice = Omit<ChoiceResponse, 'confidence'>;
type ProjectedScore = Omit<ScoreResponse, 'confidence'>;
type ProjectedAnswer = NoulResponse | ProjectedChoice | ProjectedScore;
type ProjectedAnswers = Readonly<Record<string, ProjectedAnswer>>;

/** A number that is finite and at least 0. */
function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/** A number that is finite and in `[0, 1]`. */
function isProbability(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

const nonNegativeCount: Validator<number> = Validators.number.withConstraint(isNonNegativeFinite);

/** `billing_units` is kept only when the server sends a finite number. */
const optionalBillingUnits: Converter<number | undefined> = Converters.generic((from: unknown) =>
  succeed(typeof from === 'number' && Number.isFinite(from) ? from : undefined)
).optional();

const usage: Converter<ISystemOneUsage> = Converters.object<ISystemOneUsage>({
  input_tokens: nonNegativeCount,
  output_tokens: nonNegativeCount,
  billing_units: optionalBillingUnits
});

const nonEmptyString: Converter<string> = Converters.string.withConstraint((s) => s.length > 0, {
  description: 'a non-empty string'
});

/** A legend entry: text, a JSON object or array, or `null`, as the SDK's `EntryType` declares. */
const legendEntry: Converter<EntryType> = Converters.isA(
  'a legend entry',
  (from: unknown): from is EntryType => from === null || typeof from === 'string' || typeof from === 'object'
);

const probabilities: Converter<Record<string, number>> = Converters.recordOf(Validators.number);

const noulAnswer: Converter<NoulResponse> = Converters.object<NoulResponse>({
  type: Converters.literal('noul'),
  noul: Validators.number
});

const choiceAnswer: Converter<ProjectedChoice> = Converters.object<ProjectedChoice>({
  type: Converters.literal('choice'),
  choice: Converters.string,
  probabilities
});

const scoreAnswer: Converter<ProjectedScore> = Converters.object<ProjectedScore>({
  type: Converters.literal('score'),
  score: Validators.number,
  legend: Converters.recordOf(legendEntry),
  probabilities
});

const answerType: Converter<{ type: Question['type'] }> = Converters.object({
  type: Converters.enumeratedValue<Question['type']>(['noul', 'choice', 'score'])
});

/**
 * Projects one answer by its own `type`, keeping only the fields the SDK declares. `confidence`
 * and any undeclared field are dropped by construction: the result is built by the converters,
 * never by spreading the server's object.
 */
const answer: Converter<ProjectedAnswer> = Converters.generic(
  (from: unknown): Result<ProjectedAnswer> =>
    answerType.convert(from).onSuccess(({ type }): Result<ProjectedAnswer> => {
      switch (type) {
        case 'noul':
          return noulAnswer.convert(from);
        case 'choice':
          return choiceAnswer.convert(from);
        default:
          return scoreAnswer.convert(from);
      }
    })
);

interface IProjectedBody {
  readonly model: string;
  readonly answers: ProjectedAnswers;
  readonly usage: ISystemOneUsage;
}

const body: Converter<IProjectedBody> = Converters.object<IProjectedBody>({
  model: nonEmptyString,
  answers: Converters.recordOf(answer),
  usage
});

/** The exact-set comparison every key rule uses. */
function sameKeys(actual: ReadonlyArray<string>, expected: ReadonlyArray<string>): boolean {
  const expectedSet = new Set(expected);
  return actual.length === expected.length && actual.every((key) => expectedSet.has(key));
}

/**
 * Whether the answers are exactly the questions' ids, each with its question's `type`. This is
 * the check that makes the answers the questions' answers, so it is also what narrows them to the
 * type the SDK declares for `Q`.
 */
function isAnswerSetFor<Q extends Questions>(
  questions: Q,
  answers: ProjectedAnswers
): answers is ProjectedAnswers & SystemOneAnswerResult<Q>['answers'] {
  const questionIds = Object.keys(questions);
  const answerIds = Object.keys(answers);
  const answerIdSet = new Set(answerIds);
  if (questionIds.length !== answerIds.length || !questionIds.every((id) => answerIdSet.has(id))) {
    return false;
  }
  return answerIds.every((id) => answers[id].type === questions[id].type);
}

/** Names the ids that are missing from, or extra to, the answers. */
function describeAnswerSet(questions: Questions, answers: ProjectedAnswers): string {
  const missing = Object.keys(questions).filter((id) => !Object.keys(answers).includes(id));
  const extra = Object.keys(answers).filter((id) => !Object.keys(questions).includes(id));
  const mistyped = Object.keys(answers).filter(
    (id) => Object.keys(questions).includes(id) && answers[id].type !== questions[id].type
  );
  return `answers do not match the questions (missing [${missing.join(', ')}], extra [${extra.join(
    ', '
  )}], wrong type [${mistyped.join(', ')}])`;
}

/** Checks a distribution's keys, values and sum. */
function checkDistribution(
  id: string,
  distribution: Readonly<Record<string, number>>,
  expectedKeys: ReadonlyArray<string>
): Result<true> {
  const keys = Object.keys(distribution);
  if (!sameKeys(keys, expectedKeys)) {
    return fail(`${id}: probability keys [${keys.join(', ')}] are not [${expectedKeys.join(', ')}]`);
  }
  const bad = keys.filter((key) => !isProbability(distribution[key]));
  if (bad.length > 0) {
    return fail(`${id}: probabilities for [${bad.join(', ')}] are not finite numbers in [0, 1]`);
  }
  const sum = keys.reduce((total, key) => total + distribution[key], 0);
  if (Math.abs(sum - 1) > sumTolerance) {
    return fail(`${id}: probabilities sum to ${sum}, not 1 within ${sumTolerance}`);
  }
  return succeed(true);
}

function checkChoice(id: string, question: ChoiceQuestion, choice: ProjectedChoice): Result<true> {
  const labels = Object.keys(question.criteria);
  return checkDistribution(id, choice.probabilities, labels).onSuccess(() =>
    labels.includes(choice.choice) ? succeed(true) : fail(`${id}: choice '${choice.choice}' is not a label`)
  );
}

function checkScore(id: string, question: ScoreQuestion, score: ProjectedScore): Result<true> {
  const levels = question.criteria.map((__level, index) => String(index));
  const top = levels.length - 1;
  return checkDistribution(id, score.probabilities, levels)
    .onSuccess(() =>
      sameKeys(Object.keys(score.legend), levels)
        ? succeed(true)
        : fail(`${id}: legend keys [${Object.keys(score.legend).join(', ')}] are not [${levels.join(', ')}]`)
    )
    .onSuccess(() =>
      Number.isFinite(score.score) && score.score >= 0 && score.score <= top
        ? succeed(true)
        : fail(`${id}: score ${score.score} is not in [0, ${top}]`)
    );
}

/**
 * Checks one answer against the question it answers. The answer's type has already been matched
 * to the question's by the answer-set check; a mismatch here fails.
 * @internal
 */
export function checkAnswer(id: string, question: Question, projected: ProjectedAnswer): Result<true> {
  if (projected.type === 'choice' && question.type === 'choice') {
    return checkChoice(id, question, projected);
  }
  if (projected.type === 'score' && question.type === 'score') {
    return checkScore(id, question, projected);
  }
  return projected.type === 'noul' && isProbability(projected.noul)
    ? succeed(true)
    : fail(`${id}: noul is not a finite number in [0, 1]`);
}

/**
 * A validated 2xx body: the projected result, and the usage with `billing_units` for `meta`.
 * @internal
 */
export interface IValidatedBody<Q extends Questions> {
  readonly result: SystemOneAnswerResult<Q>;
  readonly usage: ISystemOneUsage;
}

/**
 * Validates a 2xx body against the request's own questions and projects it.
 * @internal
 */
export function validateSystemOneBody<Q extends Questions>(
  questions: Q,
  data: unknown
): Result<IValidatedBody<Q>> {
  return body.convert(data).onSuccess((projected): Result<IValidatedBody<Q>> => {
    const { model, answers, usage: reported } = projected;
    if (!isAnswerSetFor(questions, answers)) {
      return fail(describeAnswerSet(questions, answers));
    }
    return mapResults(
      Object.keys(answers).map((id) => checkAnswer(id, questions[id], answers[id]))
    ).onSuccess(() =>
      succeed({
        result: {
          model,
          answers,
          usage: { input_tokens: reported.input_tokens, output_tokens: reported.output_tokens }
        },
        usage: reported
      })
    );
  });
}

/**
 * Validates `/v1/models` entries, keeping only the fields `ModelCard` declares.
 * @internal
 */
export const modelCards: Converter<ModelCard[]> = Converters.arrayOf(
  Converters.object<ModelCard>({
    name: Converters.string,
    description: Converters.string,
    release_date: Converters.string
  })
);
