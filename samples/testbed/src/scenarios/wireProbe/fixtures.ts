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
 * The fixture schemas the wire probe sends: a fixed, small set with one fixture per row of the
 * keyword-capability tables (`schemaKeywords.ts` in `@fgv/ts-extras`, `keywordAdaptation.ts` in
 * `@fgv/ts-json-base`).
 *
 * Each fixture is the JSON a host would author, read through `JsonSchema.fromJson` — so the raw
 * schema the probe sends is exactly what `toJson()` emits for it, and the adapted request is built
 * from the same validator. Every fixture but the untyped root is an object with one required
 * property `v` and `additionalProperties: false`, the shape OpenAI strict output requires, so a
 * rejection names the keyword under test rather than the envelope.
 *
 * @packageDocumentation
 */

import type { JsonObject } from '@fgv/ts-json-base';

/**
 * One fixture schema.
 * @public
 */
export interface IWireProbeFixture {
  /** Stable id, printed in the report. */
  readonly id: string;
  /** The table row it exercises. */
  readonly row: string;
  /** The schema as a host authors it; read through `JsonSchema.fromJson`. */
  readonly schema: JsonObject;
}

/**
 * The fixture every wire sends first. It carries no keyword under test, so if the provider rejects
 * it the request envelope (model, key, endpoint) is wrong and no other row on that wire means
 * anything.
 * @public
 */
export const CONTROL_FIXTURE_ID: string = 'control';

/** An object with one required property `v` of the given schema. */
function oneProperty(v: JsonObject): JsonObject {
  return { type: 'object', properties: { v }, required: ['v'], additionalProperties: false };
}

/**
 * The fixtures, control first.
 * @public
 */
export const WIRE_PROBE_FIXTURES: ReadonlyArray<IWireProbeFixture> = [
  { id: CONTROL_FIXTURE_ID, row: 'no keyword under test', schema: oneProperty({ type: 'string' }) },
  { id: 'minimum', row: 'minimum', schema: oneProperty({ type: 'number', minimum: 1 }) },
  {
    id: 'exclusiveMinimum-number',
    row: 'exclusiveMinimum (number)',
    schema: oneProperty({ type: 'number', exclusiveMinimum: 0 })
  },
  {
    // Separate from the number case: Gemini translates an exclusive bound on an integer.
    id: 'exclusiveMinimum-integer',
    row: 'exclusiveMinimum (integer)',
    schema: oneProperty({ type: 'integer', exclusiveMinimum: 0 })
  },
  { id: 'maximum', row: 'maximum', schema: oneProperty({ type: 'number', maximum: 10 }) },
  {
    id: 'exclusiveMaximum-number',
    row: 'exclusiveMaximum (number)',
    schema: oneProperty({ type: 'number', exclusiveMaximum: 10 })
  },
  {
    id: 'exclusiveMaximum-integer',
    row: 'exclusiveMaximum (integer)',
    schema: oneProperty({ type: 'integer', exclusiveMaximum: 10 })
  },
  { id: 'multipleOf', row: 'multipleOf', schema: oneProperty({ type: 'number', multipleOf: 0.5 }) },
  { id: 'minLength', row: 'minLength', schema: oneProperty({ type: 'string', minLength: 2 }) },
  { id: 'maxLength', row: 'maxLength', schema: oneProperty({ type: 'string', maxLength: 8 }) },
  {
    // In every table's pass list.
    id: 'format-date-time',
    row: 'format (date-time)',
    schema: oneProperty({ type: 'string', format: 'date-time' })
  },
  {
    // Passes on Anthropic JSON outputs; outside the OpenAI/xAI intersection.
    id: 'format-uri',
    row: 'format (uri)',
    schema: oneProperty({ type: 'string', format: 'uri' })
  },
  {
    // OpenAI documents it and xAI does not, so the shared table folds it.
    id: 'format-duration',
    row: 'format (duration)',
    schema: oneProperty({ type: 'string', format: 'duration' })
  },
  { id: 'title', row: 'title', schema: oneProperty({ type: 'string', title: 'Value' }) },
  { id: 'default', row: 'default', schema: oneProperty({ type: 'string', default: 'x' }) },
  { id: 'examples', row: 'examples', schema: oneProperty({ type: 'string', examples: ['a', 'b'] }) },
  {
    id: 'enum-integer',
    row: 'nonStringEnum (integer)',
    schema: oneProperty({ type: 'integer', enum: [1, 2, 3] })
  },
  {
    id: 'enum-number',
    row: 'nonStringEnum (number)',
    schema: oneProperty({ type: 'number', enum: [0.5, 1.5] })
  },
  {
    id: 'enum-boolean',
    row: 'nonStringEnum (boolean)',
    schema: oneProperty({ type: 'boolean', enum: [true] })
  },
  { id: 'untyped-property', row: 'untyped (in properties)', schema: oneProperty({}) },
  {
    id: 'untyped-items',
    row: 'untyped (in items)',
    schema: oneProperty({ type: 'array', items: {} })
  },
  { id: 'untyped-root', row: 'untyped (root)', schema: {} }
];
