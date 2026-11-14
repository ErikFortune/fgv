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
 * A Result-integration boundary over `@typesafe-ai/sdk` for System-1 decision servers (CLM,
 * openjev, Jev): a mandatory input bound, response validation, and classified failures.
 *
 * @packageDocumentation
 */

export { askSystemOne, createSystemOneClient, listSystemOneModels } from './client';
export { measureSystemOneInput } from './measure';
export {
  allSystemOneFailureReasons,
  type ICreateSystemOneClientParams,
  type ISystemOneAnswer,
  type ISystemOneClient,
  type ISystemOneCriterionMeasure,
  type ISystemOneInputMeasure,
  type ISystemOneMeta,
  type ISystemOneQuestionMeasure,
  type ISystemOneRequest,
  type ISystemOneTimingHeaders,
  type ISystemOneUsage,
  type SystemOneAnswerResult,
  type SystemOneFailureReason,
  type SystemOneInputLimit,
  type WithoutConfidence
} from './types';

// The SDK's own question builders and types, re-exported rather than redeclared.
export {
  choice,
  noul,
  score,
  type ChoiceCriteria,
  type ChoiceQuestion,
  type ChoiceResponse,
  type Description,
  type EntryType,
  type Fetch,
  type JsonValue,
  type ModelCard,
  type NoulQuestion,
  type NoulResponse,
  type Question,
  type Questions,
  type ResultFor,
  type RetryPolicy,
  type ScoreCriteria,
  type ScoreLegend,
  type ScoreOf,
  type ScoreQuestion,
  type ScoreResponse,
  type SystemOneRequest,
  type SystemOneResult,
  type Usage
} from '@typesafe-ai/sdk';
