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

/** A `score` answer as received: the legend's values are replaced from the request (see below). */
interface IReceivedScore {
  readonly type: 'score';
  readonly score: number;
  readonly legend: Readonly<Record<string, unknown>>;
  readonly probabilities: Readonly<Record<string, number>>;
}
type ReceivedAnswer = NoulResponse | ProjectedChoice | IReceivedScore;

/** A number that is finite and at least 0. */
function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * A number in `[0, 1]`. The range alone rejects `Infinity`, `-Infinity` and `NaN`, and a JSON body
 * cannot carry anything else non-finite.
 */
function isProbability(value: number): boolean {
  return value >= 0 && value <= 1;
}

const nonNegativeCount: Validator<number> = Validators.number.withConstraint(isNonNegativeFinite);

const finiteNumber: Validator<number> = Validators.number.withConstraint(Number.isFinite);

/** `billing_units` is kept only when the server sends a finite number; anything else is dropped. */
const optionalBillingUnits: Converter<number | undefined> = Converters.generic((from: unknown) =>
  succeed(finiteNumber.validate(from).orDefault())
).optional();

const usage: Converter<ISystemOneUsage> = Converters.object<ISystemOneUsage>({
  input_tokens: nonNegativeCount,
  output_tokens: nonNegativeCount,
  billing_units: optionalBillingUnits
});

const nonEmptyString: Converter<string> = Converters.string.withConstraint((s) => s.length > 0, {
  description: 'a non-empty string'
});

const probabilities: Converter<Record<string, number>> = Converters.recordOf(Validators.number);

/** Legend values are only counted (their keys are checked); they are never returned. */
const anyLegendValue: Converter<unknown> = Converters.generic((from: unknown) => succeed(from));

/**
 * Converts one answer by its own `type`, keeping only the fields the SDK declares. `confidence` and
 * any undeclared field are dropped by construction: the converters build new objects, and nothing
 * spreads the server's object.
 */
const noulAnswer: Converter<NoulResponse> = Converters.object<NoulResponse>({
  type: Converters.literal('noul'),
  noul: Validators.number
});

const choiceAnswer: Converter<ProjectedChoice> = Converters.object<ProjectedChoice>({
  type: Converters.literal('choice'),
  choice: Converters.string,
  probabilities
});

const scoreAnswer: Converter<IReceivedScore> = Converters.object<IReceivedScore>({
  type: Converters.literal('score'),
  score: Validators.number,
  legend: Converters.recordOf(anyLegendValue),
  probabilities
});

const answer: Converter<ReceivedAnswer> = Converters.discriminatedObject<ReceivedAnswer>('type', {
  noul: noulAnswer,
  choice: choiceAnswer,
  score: scoreAnswer
});

interface IReceivedBody {
  readonly model: string;
  readonly answers: Readonly<Record<string, ReceivedAnswer>>;
  readonly usage: ISystemOneUsage;
}

const body: Converter<IReceivedBody> = Converters.object<IReceivedBody>({
  model: nonEmptyString,
  answers: Converters.recordOf(answer),
  usage
});

/** The exact-set comparison every key rule uses. */
function sameKeys(actual: ReadonlyArray<string>, expected: ReadonlyArray<string>): boolean {
  const expectedSet = new Set(expected);
  return actual.length === expected.length && actual.every((key) => expectedSet.has(key));
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
    return fail(`${id}: probabilities for [${bad.join(', ')}] are not numbers in [0, 1]`);
  }
  const sum = keys.reduce((total, key) => total + distribution[key], 0);
  if (Math.abs(sum - 1) > sumTolerance) {
    return fail(`${id}: probabilities sum to ${sum}, not 1 within ${sumTolerance}`);
  }
  return succeed(true);
}

function checkNoul(id: string, noul: NoulResponse): Result<ProjectedAnswer> {
  return isProbability(noul.noul)
    ? succeed(noul)
    : fail(`${id}: noul ${noul.noul} is not a number in [0, 1]`);
}

function checkChoice(id: string, question: ChoiceQuestion, choice: ProjectedChoice): Result<ProjectedAnswer> {
  const labels = Object.keys(question.criteria);
  return checkDistribution(id, choice.probabilities, labels).onSuccess(() =>
    labels.includes(choice.choice) ? succeed(choice) : fail(`${id}: choice '${choice.choice}' is not a label`)
  );
}

/**
 * Checks a `score` answer. Its `legend` is the request's rubric echoed back, keyed by level: the
 * server's keys are checked, and the values are taken from the request, so the legend has exactly
 * the type the SDK declares for the rubric whatever text the server rendered it as.
 */
function checkScore(id: string, question: ScoreQuestion, score: IReceivedScore): Result<ProjectedAnswer> {
  const levels = question.criteria.map((__level, index) => String(index));
  const top = levels.length - 1;
  return checkDistribution(id, score.probabilities, levels)
    .onSuccess(() =>
      sameKeys(Object.keys(score.legend), levels)
        ? succeed(true)
        : fail(`${id}: legend keys [${Object.keys(score.legend).join(', ')}] are not [${levels.join(', ')}]`)
    )
    .onSuccess(() =>
      score.score >= 0 && score.score <= top
        ? succeed({
            type: 'score' as const,
            score: score.score,
            legend: Object.fromEntries(question.criteria.map((level, index) => [String(index), level])),
            probabilities: score.probabilities
          })
        : fail(`${id}: score ${score.score} is not in [0, ${top}]`)
    );
}

/** An answer with no question, kept only so that the id check below can name it. */
function unmatched(received: ReceivedAnswer): ProjectedAnswer {
  return received.type === 'score' ? { ...received, legend: {} } : received;
}

/** Checks one answer against the question it answers, including that their types match. */
function checkAnswer(
  id: string,
  question: Question | undefined,
  received: ReceivedAnswer
): Result<ProjectedAnswer> {
  if (question === undefined) {
    // An extra id: the answer-set check rejects it.
    return succeed(unmatched(received));
  }
  if (received.type === 'choice' && question.type === 'choice') {
    return checkChoice(id, question, received);
  }
  if (received.type === 'score' && question.type === 'score') {
    return checkScore(id, question, received);
  }
  if (received.type === 'noul' && question.type === 'noul') {
    return checkNoul(id, received);
  }
  return fail(`${id}: a ${received.type} answer to a ${question.type} question`);
}

/**
 * The answer-set check: the answer ids are exactly the question ids. Every answer has by now been
 * checked against its own question (an extra id has none, and fails here), so passing this check
 * is what makes the answers the questions' answers, and it narrows them to the type the SDK
 * declares for `Q`. That type is a function of the caller's generic `Q`, which no runtime value can
 * name, so this predicate is the one place the link is asserted.
 */
function isAnswerSetFor<Q extends Questions>(
  questions: Q,
  answers: ProjectedAnswers
): answers is ProjectedAnswers & SystemOneAnswerResult<Q>['answers'] {
  const questionIds = Object.keys(questions);
  const answerIds = new Set(Object.keys(answers));
  return questionIds.length === answerIds.size && questionIds.every((id) => answerIds.has(id));
}

/** Names the ids missing from, or extra to, the answers. */
function describeAnswerSet(questions: Questions, answers: ProjectedAnswers): string {
  const questionIds = new Set(Object.keys(questions));
  const answerIds = new Set(Object.keys(answers));
  const missing = [...questionIds].filter((id) => !answerIds.has(id));
  const extra = [...answerIds].filter((id) => !questionIds.has(id));
  return `answer ids do not match the question ids (missing [${missing.join(', ')}], extra [${extra.join(
    ', '
  )}])`;
}

/**
 * A validated 2xx body: the projected result, and the usage with `billing_units` for `meta`.
 * @internal
 */
export interface IValidatedBody<Q extends Questions> {
  readonly result: SystemOneAnswerResult<Q>;
  readonly usage: ISystemOneUsage;
}

/** Assembles the validated body once every answer has been checked. */
function assemble<Q extends Questions>(
  questions: Q,
  model: string,
  reported: ISystemOneUsage,
  answers: ProjectedAnswers
): Result<IValidatedBody<Q>> {
  if (!isAnswerSetFor(questions, answers)) {
    return fail(describeAnswerSet(questions, answers));
  }
  return succeed({
    result: {
      model,
      answers,
      usage: { input_tokens: reported.input_tokens, output_tokens: reported.output_tokens }
    },
    usage: reported
  });
}

/**
 * Validates a 2xx body against the request's own questions and projects it.
 * @internal
 */
export function validateSystemOneBody<Q extends Questions>(
  questions: Q,
  data: unknown
): Result<IValidatedBody<Q>> {
  const questionFor = new Map<string, Question>(Object.entries(questions));
  return body
    .convert(data)
    .onSuccess(({ model, answers, usage: reported }) =>
      mapResults(
        Object.keys(answers).map((id) =>
          checkAnswer(id, questionFor.get(id), answers[id]).onSuccess(
            (checked): Result<[string, ProjectedAnswer]> => succeed([id, checked])
          )
        )
      ).onSuccess((entries) => assemble(questions, model, reported, Object.fromEntries(entries)))
    );
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
