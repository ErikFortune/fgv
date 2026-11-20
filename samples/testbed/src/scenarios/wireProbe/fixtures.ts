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
 * `pattern` has two fixtures, one per way a pattern reaches a schema: built by the host's
 * `stringOptions` from a trusted `RegExp`, and read by `fromJson` with an injected
 * `patternValidator`, as an MCP server's would be. Both send the same JSON, so a difference between
 * their rows would be a difference in what the library builds, not in what the provider does.
 *
 * @packageDocumentation
 */

import { fail, succeed, type Result } from '@fgv/ts-utils';
import { JsonSchema, type JsonObject } from '@fgv/ts-json-base';

/**
 * One fixture schema.
 * @public
 */
export interface IWireProbeFixture {
  /** Stable id, printed in the report. */
  readonly id: string;
  /** The table row it exercises. */
  readonly row: string;
  /** The schema as a host authors it; read through `JsonSchema.fromJson` unless `build` is given. */
  readonly schema: JsonObject;
  /**
   * Builds the validator another way — through the host factories, or `fromJson` with options — for
   * the fixtures whose path through the library is itself under test. Its `toJson()` is `schema`.
   */
  readonly build?: () => Result<JsonSchema.ISchemaValidator<unknown>>;
}

/** The pattern both `pattern` fixtures carry: anchored, and within every documented dialect. */
const PROBE_PATTERN_SOURCE: string = '^[a-z]+$';

/**
 * The probe's `patternValidator`. It compiles only the probe's own fixture pattern, from a literal,
 * so nothing here turns a string into a regular expression; a host reading untrusted schemas should
 * use an engine that is safe on hostile input.
 * @public
 */
export const probePatternValidator: JsonSchema.SchemaPatternValidator = (source) =>
  source === PROBE_PATTERN_SOURCE
    ? succeed((value: string) => /^[a-z]+$/u.test(value))
    : fail(`the wire probe compiles only its own pattern, not ${JSON.stringify(source)}`);

/**
 * Reads a fixture into the validator the probe sends: `build` when it has one, otherwise
 * `JsonSchema.fromJson` over its JSON.
 * @public
 */
export function readFixture(fixture: IWireProbeFixture): Result<JsonSchema.ISchemaValidator<unknown>> {
  return fixture.build?.() ?? JsonSchema.fromJson(fixture.schema);
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
    // A host's own `RegExp`, through `stringOptions`.
    id: 'pattern-host',
    row: 'pattern (host stringOptions)',
    schema: oneProperty({ type: 'string', pattern: PROBE_PATTERN_SOURCE }),
    build: () =>
      JsonSchema.stringOptions({ pattern: /^[a-z]+$/u }).onSuccess((opts) =>
        succeed(JsonSchema.object({ v: JsonSchema.string(opts) }))
      )
  },
  {
    // A server's pattern, through `fromJson` with an injected validator.
    id: 'pattern-fromJson',
    row: 'pattern (fromJson + patternValidator)',
    schema: oneProperty({ type: 'string', pattern: PROBE_PATTERN_SOURCE }),
    build: () =>
      JsonSchema.fromJson(oneProperty({ type: 'string', pattern: PROBE_PATTERN_SOURCE }), {
        patternValidator: probePatternValidator
      })
  },
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
