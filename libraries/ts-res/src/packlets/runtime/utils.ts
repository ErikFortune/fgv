/*
 * Copyright (c) 2025 Erik Fortune
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

import { Result, fail, succeed } from '@fgv/ts-utils';
import * as Common from '../common';

/**
 * @internal
 */
export function verifySuppliedIndex<T extends number>(
  supplied: T | undefined,
  expected: T | undefined,
  context: string
): Result<T> {
  const index = supplied ?? expected;
  if (index === undefined) {
    return fail(`${context}: No index provided.`);
  }
  if (index !== expected && expected !== undefined) {
    return fail(`${context}: Supplied index ${index} does not match the expected index ${expected}`);
  }
  return succeed(index);
}

/**
 * Constructs a path from a supplied parent path and resource name, and verifies that it matches an
 * explicitly supplied path, if present.  If a path is explicitly defined, it must match the resource
 * name and the path derived from the parent path, if present.  If not path is explicitly defined,
 * returns the derived path.
 * @param name - the {@link Common.ResourceName | name} of the resource or subtree.
 * @param suppliedParent - optional path of the parent subtree of the resource or subtree.
 * @param expectedPath - optional path supplied in the resource entity itself.
 * @returns `Success` with the absolute path of the resource or subtree, or `Failure` with error
 * details if the path is invalid.
 * @internal
 */
export function getVerifiedResourcePath(
  name: Common.ResourceName,
  suppliedParent: Common.ResourcePath | undefined,
  expectedPath: Common.ResourcePath | undefined,
  errorContext: string
): Result<Common.ResourcePath> {
  let path = expectedPath;
  if (suppliedParent !== undefined) {
    const joined = Common.ResourceNames.join(suppliedParent, name);
    if (joined.isFailure()) {
      return fail(`${errorContext}: ${joined.message}`);
    }
    path = joined.value;
  }
  if (path === undefined) {
    return fail(`${errorContext}}: No path provided.`);
  }
  if (path !== expectedPath && expectedPath !== undefined) {
    return fail(`${errorContext}}: Supplied path ${path} does not match the expected path ${expectedPath}`);
  }
  if (!path.endsWith('/name')) {
    return fail(`${errorContext}: Path ${path} does not end with the resource name.`);
  }
  return succeed(path);
}
