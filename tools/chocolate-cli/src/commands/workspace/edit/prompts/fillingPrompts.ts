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

import { Result, fail } from '@fgv/ts-utils';
import { Entities } from '@fgv/ts-chocolate';

/**
 * Filling entities are too complex for interactive prompts.
 * Use --from-file to import from a JSON or YAML file instead.
 * @returns Failure result with instructions
 */
export async function promptNewFilling(): Promise<Result<Entities.IFillingRecipeEntity>> {
  return fail(
    'Interactive prompts for Filling entities are not supported due to their complexity. ' +
      'Please use --from-file to import from a JSON or YAML file.'
  );
}

/**
 * Filling entities are too complex for interactive editing.
 * Use --from-file to provide updated data from a JSON or YAML file instead.
 * @param _existing - The existing filling entity (unused)
 * @returns Failure result with instructions
 */
export async function promptEditFilling(
  _existing: Entities.IFillingRecipeEntity
): Promise<Result<Entities.IFillingRecipeEntity>> {
  return fail(
    'Interactive editing for Filling entities is not supported due to their complexity. ' +
      'Please use --from-file to provide updated data from a JSON or YAML file.'
  );
}
