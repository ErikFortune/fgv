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

import '@fgv/ts-utils-jest';
import { JsonObject } from '../../../packlets/json';
import { JsonSchema } from '../../..';

const passAll: JsonSchema.SchemaKeywordCapabilities = {
  minimum: 'pass',
  exclusiveMinimum: 'pass',
  maximum: 'pass',
  exclusiveMaximum: 'pass',
  multipleOf: 'pass',
  minLength: 'pass',
  maxLength: 'pass',
  format: 'pass',
  title: 'pass',
  default: 'pass',
  examples: 'pass'
};

describe('JsonSchema.adaptSchemaKeywords', () => {
  test('the fold sentence is pinned verbatim', () => {
    expect(
      JsonSchema.foldedConstraintsSentence([
        ['minimum', 1],
        ['maximum', 10],
        ['format', 'email'],
        ['default', null],
        ['examples', [1, 2]]
      ])
    ).toBe('Constraints: minimum 1; maximum 10; format "email"; default null; examples [1,2].');
  });

  test('a pass-everything table leaves the schema unchanged', () => {
    const schema = JsonSchema.number({ minimum: 1, title: 'N', description: 'n' }).toJson();
    expect(JsonSchema.adaptSchemaKeywords(schema, passAll)).toEqual(schema);
  });

  test('folding removes the keywords and appends one sentence, in fixed keyword order', () => {
    // Authored out of order: the sentence follows `schemaConstraintKeywords`, not the input.
    const raw: JsonObject = { type: 'integer', maximum: 10, default: 3, minimum: 1 };
    expect(JsonSchema.adaptSchemaKeywords(raw, JsonSchema.foldAllSchemaKeywords)).toEqual({
      type: 'integer',
      description: 'Constraints: minimum 1; maximum 10; default 3.'
    });
  });

  test('an existing description keeps its text and position, the sentence after it', () => {
    const raw: JsonObject = { type: 'string', description: 'A name.', minLength: 1, title: 'Name' };
    const adapted = JsonSchema.adaptSchemaKeywords(raw, JsonSchema.foldAllSchemaKeywords) as JsonObject;
    expect(Object.keys(adapted)).toEqual(['type', 'description']);
    expect(adapted.description).toBe('A name. Constraints: minLength 1; title "Name".');
  });

  test('an empty description is replaced by the sentence alone', () => {
    expect(
      JsonSchema.adaptSchemaKeywords(
        { type: 'string', description: '', maxLength: 2 },
        JsonSchema.foldAllSchemaKeywords
      )
    ).toEqual({ type: 'string', description: 'Constraints: maxLength 2.' });
  });

  test('passValues sends a listed value and folds any other', () => {
    const caps: JsonSchema.SchemaKeywordCapabilities = {
      ...JsonSchema.foldAllSchemaKeywords,
      format: { passValues: ['date', 'uuid'] }
    };
    expect(JsonSchema.adaptSchemaKeywords({ type: 'string', format: 'uuid' }, caps)).toEqual({
      type: 'string',
      format: 'uuid'
    });
    expect(JsonSchema.adaptSchemaKeywords({ type: 'string', format: 'hostname' }, caps)).toEqual({
      type: 'string',
      description: 'Constraints: format "hostname".'
    });
  });

  test('a translator replaces the keyword where it can, and the keyword folds where it cannot', () => {
    const caps: JsonSchema.SchemaKeywordCapabilities = {
      ...passAll,
      exclusiveMinimum: {
        translate: (node) => {
          if (node.type !== 'integer' || typeof node.exclusiveMinimum !== 'number') {
            return undefined;
          }
          const { exclusiveMinimum, ...rest } = node;
          return { ...rest, minimum: Math.floor(exclusiveMinimum) + 1 };
        }
      }
    };
    expect(JsonSchema.adaptSchemaKeywords({ type: 'integer', exclusiveMinimum: 0 }, caps)).toEqual({
      type: 'integer',
      minimum: 1
    });
    expect(JsonSchema.adaptSchemaKeywords({ type: 'number', exclusiveMinimum: 0 }, caps)).toEqual({
      type: 'number',
      description: 'Constraints: exclusiveMinimum 0.'
    });
  });

  test('adapts nested properties, items and schema-valued additionalProperties', () => {
    const schema = JsonSchema.object({
      tags: JsonSchema.array(JsonSchema.string({ maxLength: 5 })),
      scores: JsonSchema.record(JsonSchema.number({ minimum: 0 })),
      n: JsonSchema.optional(JsonSchema.integer({ multipleOf: 2 }))
    }).toJson();
    expect(JsonSchema.adaptSchemaKeywords(schema, JsonSchema.foldAllSchemaKeywords)).toEqual({
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string', description: 'Constraints: maxLength 5.' } },
        scores: {
          type: 'object',
          properties: {},
          additionalProperties: { type: 'number', description: 'Constraints: minimum 0.' }
        },
        n: { type: 'integer', description: 'Constraints: multipleOf 2.' }
      },
      required: ['tags', 'scores'],
      additionalProperties: false
    });
  });

  test('a property named like a keyword is a name, and data values are copied untouched', () => {
    const raw: JsonObject = {
      type: 'object',
      properties: { minimum: { type: 'number' }, title: { type: 'string' } },
      default: { minimum: 1, properties: { maximum: 2 } },
      examples: [{ title: 'x' }]
    };
    expect(
      JsonSchema.adaptSchemaKeywords(raw, {
        ...JsonSchema.foldAllSchemaKeywords,
        default: 'pass',
        examples: 'pass'
      })
    ).toEqual(raw);
  });

  test('a non-object value is returned as it is, and the input is never modified', () => {
    expect(JsonSchema.adaptSchemaKeywords(true, JsonSchema.foldAllSchemaKeywords)).toBe(true);
    const raw: JsonObject = { type: 'number', minimum: 1 };
    JsonSchema.adaptSchemaKeywords(raw, JsonSchema.foldAllSchemaKeywords);
    expect(raw).toEqual({ type: 'number', minimum: 1 });
  });

  test('a folded schema still validates as the authored one does: the validator stays authoritative', () => {
    const schema = JsonSchema.integer({ minimum: 1, maximum: 10 });
    const folded = JsonSchema.adaptSchemaKeywords(schema.toJson(), JsonSchema.foldAllSchemaKeywords);
    expect(folded).toEqual({ type: 'integer', description: 'Constraints: minimum 1; maximum 10.' });
    expect(schema.validate(0)).toFailWith(/minimum/);
  });

  test('schemaConstraintKeywords lists every keyword of the table, in fold order', () => {
    expect([...JsonSchema.schemaConstraintKeywords].sort()).toEqual(
      Object.keys(JsonSchema.foldAllSchemaKeywords).sort()
    );
  });
});
