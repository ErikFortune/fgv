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

/**
 * @internal
 */
export const identifier: RegExp = /^[a-zA-Z_][a-zA-Z0-9_\-]*$/;

/**
 * @internal
 */
export const segmentedIdentifier: RegExp = /^[a-zA-Z_][a-zA-Z0-9_\-]*(\.[a-zA-Z_][a-zA-Z0-9_\-]*)*$/;

/**
 * @internal
 */
export const identifierList: RegExp = /^[a-zA-Z_][a-zA-Z0-9_\-]*(,[a-zA-Z_][a-zA-Z0-9_\-]*)*$/;

/**
 * The format of a {@link ConditionKey | condition key} is:
 * <qualifierName>-[<value>][\@<priority>](<scoreAsDefault>) where operator is `matches`, or
 * <qualifierName>-<operator>-[<value>][\@<priority>](<scoreAsDefault>)
 * @internal
 */
export const conditionKey: RegExp =
  /^[a-zA-Z_][a-zA-Z0-9_\-]*(-matches)?-\[.*\](?:@[0-9]{1,4})?(?:\([01](?:\.[0-9]+)?\))?$/;

/**
 * A {@link ConditionToken | condition token} is a comma-separated list of one or more
 * condition specifiers, where a condition specifier has either the form
 * `<qualifierName>=<value>` or `<value>`.
 * @internal
 */
export const conditionToken: RegExp = /^[a-zA-Z_][a-zA-Z0-9_\-]*(?:=[a-zA-Z0-9_\-]+)?$/;

/**
 * A {@link ContextToken | context token} has the form `<qualifierName>=<value>` or `<value>`.
 * Context tokens allow broader character set including commas for comma-separated values.
 * @internal
 */
export const contextToken: RegExp = /^[a-zA-Z_][a-zA-Z0-9_\-]*(?:=[a-zA-Z0-9_\-,\s]+)?$/;

/**
 * @internal
 */
export const conditionSetHash: RegExp = /^[a-zA-Z0-9]{8}$/;

/**
 * @internal
 */
export const decisionKey: RegExp = /^[a-zA-Z0-9]{8}(?:\+[a-zA-Z0-9]{8})*(?:\|[a-zA-Z0-9]{8})?$/;

/**
 * @internal
 */
export const territoryCode: RegExp = /^[a-zA-Z]{2}$/;
