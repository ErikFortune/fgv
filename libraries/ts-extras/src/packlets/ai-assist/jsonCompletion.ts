// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * `generateJsonCompletion<T>` — request a JSON-shaped completion from any
 * provider supported by AiAssist and validate it against a caller-supplied
 * `Converter<T>` or `Validator<T>`. Wraps fence/preamble tolerance + parsing +
 * validation into a single call so consumers don't reinvent the pipeline.
 *
 * @packageDocumentation
 */

import { type Converter, fail, Result, succeed, type Validator } from '@fgv/ts-utils';

import { callProviderCompletion, type IProviderCompletionParams } from './apiClient';
import { fencedStringifiedJson } from './jsonResponse';
import { type IAiCompletionResponse } from './model';

/**
 * Default system-prompt suffix appended when {@link AiAssist.IGenerateJsonCompletionParams.promptHint}
 * is `'smart'` (the default). Designed to discourage code fences and prose in
 * the model's response while still tolerating them via the read-side extractor.
 * @public
 */
export const SMART_JSON_PROMPT_HINT: string =
  'Respond with raw JSON only — no Markdown code fences, no explanatory prose, ' +
  'no preamble or trailing commentary. The response must parse with JSON.parse.';

/**
 * Controls the optional system-prompt augmentation applied by
 * {@link AiAssist.generateJsonCompletion}.
 *
 * - `'smart'` (default): append {@link AiAssist.SMART_JSON_PROMPT_HINT}.
 * - `'none'`: do not modify the prompt.
 * - A string: append the supplied text verbatim.
 *
 * @remarks
 * The `string & {}` branch is the standard TypeScript trick that prevents
 * the literal members from being widened away — callers still get
 * autocomplete for `'smart'` and `'none'` while accepting any string.
 *
 * @public
 */
export type JsonPromptHint = 'smart' | 'none' | (string & {});

/**
 * Parameters for {@link AiAssist.generateJsonCompletion}. Extends
 * {@link AiAssist.IProviderCompletionParams} with JSON-validation knobs.
 * @public
 */
export interface IGenerateJsonCompletionParams<T> extends IProviderCompletionParams {
  /**
   * Caller-supplied `Converter<T>` or `Validator<T>` applied to the parsed
   * JSON value. Wrapped internally in {@link AiAssist.fencedStringifiedJson}
   * unless {@link AiAssist.IGenerateJsonCompletionParams.jsonConverter} is
   * provided.
   */
  readonly converter?: Converter<T> | Validator<T>;

  /**
   * Full string-to-`T` pipeline override. When supplied, takes precedence over
   * {@link AiAssist.IGenerateJsonCompletionParams.converter} and lets the
   * caller plug in a custom extractor or skip the default fence tolerance
   * entirely.
   */
  readonly jsonConverter?: Converter<T>;

  /**
   * Controls the optional system-prompt augmentation. Defaults to `'smart'`.
   * Pass `'none'` to disable, or a string to append custom guidance.
   */
  readonly promptHint?: JsonPromptHint;
}

/**
 * Successful result of {@link AiAssist.generateJsonCompletion}.
 * @public
 */
export interface IGenerateJsonCompletionResult<T> {
  /** The validated JSON value. */
  readonly value: T;
  /** The raw response text returned by the provider. */
  readonly raw: string;
  /** The full underlying completion response. */
  readonly response: IAiCompletionResponse;
}

function applyPromptHint(system: string | undefined, hint: JsonPromptHint): string | undefined {
  if (hint === 'none') {
    return system;
  }
  const suffix = hint === 'smart' ? SMART_JSON_PROMPT_HINT : hint;
  return system !== undefined && system.length > 0 ? `${system}\n\n${suffix}` : suffix;
}

/**
 * Calls {@link AiAssist.callProviderCompletion}, then runs the response text
 * through a tolerant JSON converter (default:
 * {@link AiAssist.fencedStringifiedJson}) and the caller's
 * `converter`/`validator`. Returns the validated value plus the raw text and
 * underlying completion response for diagnostics.
 *
 * @remarks
 * The default smart prompt hint asks the model to emit raw JSON. The read-side
 * extractor still tolerates fences and prose, so models that ignore the hint
 * are still handled.
 *
 * Either `converter` or `jsonConverter` must be provided; passing both lets
 * `jsonConverter` win.
 *
 * @param params - Provider parameters plus JSON validation options.
 * @returns The validated value, the raw text, and the underlying response.
 * @public
 */
export async function generateJsonCompletion<T>(
  params: IGenerateJsonCompletionParams<T>
): Promise<Result<IGenerateJsonCompletionResult<T>>> {
  const { converter, jsonConverter, promptHint = 'smart', system, ...rest } = params;

  if (jsonConverter === undefined && converter === undefined) {
    return fail('generateJsonCompletion: either converter or jsonConverter must be provided.');
  }

  const pipeline: Converter<T> = jsonConverter ?? fencedStringifiedJson<T>({ inner: converter! });
  const augmentedSystem = applyPromptHint(system, promptHint);

  const response = await callProviderCompletion({ ...rest, system: augmentedSystem });
  if (response.isFailure()) {
    return fail(response.message);
  }
  const completion = response.value;

  return pipeline
    .convert(completion.content)
    .withErrorFormat((msg) => `generateJsonCompletion: ${msg}`)
    .onSuccess((value) => succeed({ value, raw: completion.content, response: completion }));
}
