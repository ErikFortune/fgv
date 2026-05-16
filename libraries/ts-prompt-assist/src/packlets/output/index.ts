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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import type { IPromptDescriptor, ValidatorId } from '../types';
import type { IPromptRegistry } from '../registry';
import type { IOutputValidationContext } from '../registry/outputValidationRegistry';

/**
 * Processes the raw LLM output through the full output pipeline:
 *
 * - `'free-text'` output: returns `rawOutput` as-is (cast to `T`).
 * - `'json'` output:
 *   1. Strips Markdown fences with `AiAssist.extractJsonText`.
 *   2. Parses the result with `JSON.parse`.
 *   3. Runs the registered converter for `descriptor.output.converterId`.
 *   4. Runs each validator in `descriptor.outputValidations`.
 *
 * @param rawOutput - The raw LLM response string.
 * @param descriptor - The prompt descriptor specifying the output contract.
 * @param registry - Registry providing converters and validators.
 * @param validationContext - Context passed to output validators.
 * @public
 */
export function processOutput<T>(
  rawOutput: string,
  descriptor: IPromptDescriptor,
  registry: IPromptRegistry,
  validationContext: IOutputValidationContext
): Result<T> {
  if (descriptor.output.kind === 'free-text') {
    return succeed(rawOutput as unknown as T);
  }

  const { converterId } = descriptor.output;

  return AiAssist.extractJsonText(rawOutput)
    .withErrorFormat((msg) => `output: extractJsonText: ${msg}`)
    .onSuccess((jsonText) =>
      captureResult(() => JSON.parse(jsonText) as unknown).withErrorFormat(
        (msg) => `output: JSON.parse: ${msg}`
      )
    )
    .onSuccess((parsed) =>
      registry.converters
        .get<T>(converterId)
        .withErrorFormat((msg) => `output: converter '${converterId}': ${msg}`)
        .onSuccess((converter) =>
          converter.convert(parsed).withErrorFormat((msg) => `output: convert: ${msg}`)
        )
    )
    .onSuccess((converted) =>
      _runValidators<T>(converted, descriptor.outputValidations ?? [], registry, validationContext)
    );
}

function _runValidators<T>(
  value: T,
  validatorIds: ReadonlyArray<ValidatorId>,
  registry: IPromptRegistry,
  context: IOutputValidationContext
): Result<T> {
  let current = value;
  for (const validatorId of validatorIds) {
    const validatorResult = registry.outputValidations.get(validatorId);
    if (validatorResult.isFailure()) {
      return fail(`output: validator '${validatorId}': ${validatorResult.message}`);
    }
    const runResult = validatorResult.value.validate(current, context);
    if (runResult.isFailure()) {
      return fail(`output: validator '${validatorId}' failed: ${runResult.message}`);
    }
    current = runResult.value as T;
  }
  return succeed(current);
}
