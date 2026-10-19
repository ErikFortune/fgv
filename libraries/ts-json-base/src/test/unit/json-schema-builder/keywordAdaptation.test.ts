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
  pattern: 'pass',
  format: 'pass',
  title: 'pass',
  default: 'pass',
  examples: 'pass',
  nonStringEnum: 'pass',
  untyped: 'pass'
};

describe('JsonSchema.adaptSchemaKeywords', () => {
  test('the fold text is pinned verbatim: constraints in one sentence, each annotation in its own', () => {
    expect(
      JsonSchema.foldedKeywordsText([
        ['examples', ['a', 'b']],
        ['default', null],
        ['maximum', 10],
        ['title', 'Count'],
        ['format', 'email'],
        ['minimum', 1]
      ])
    ).toBe(
      'Constraints: minimum 1; maximum 10. Format: email. Title: Count. Default: null. Examples: ["a","b"].'
    );
    expect(JsonSchema.foldedKeywordsText([['default', 'x']])).toBe('Default: "x".');
    expect(JsonSchema.foldedKeywordsText([])).toBe('');
  });

  test('a dropped annotation is removed and not restated', () => {
    expect(
      JsonSchema.adaptSchemaKeywords(
        { type: 'string', title: 'Name' },
        JsonSchema.unverifiedWireSchemaKeywords
      )
    ).toSucceedWith({ type: 'string' });
    const caps: JsonSchema.SchemaKeywordCapabilities = { ...passAll, default: 'drop', examples: 'drop' };
    expect(
      JsonSchema.adaptSchemaKeywords({ type: 'number', default: 1, examples: [2], minimum: 0 }, caps)
    ).toSucceedWith({ type: 'number', minimum: 0 });
  });

  test('a folded title reads as a title, not a constraint', () => {
    const caps: JsonSchema.SchemaKeywordCapabilities = { ...passAll, title: 'fold' };
    expect(JsonSchema.adaptSchemaKeywords({ type: 'string', title: 'Name' }, caps)).toSucceedWith({
      type: 'string',
      description: 'Title: Name.'
    });
  });

  test('a pass-everything table leaves the schema unchanged', () => {
    const schema = JsonSchema.number(
      JsonSchema.numberOptions({ minimum: 1, title: 'N', description: 'n' }).shouldNotFail('number options')
    ).toJson();
    expect(JsonSchema.adaptSchemaKeywords(schema, passAll)).toSucceedWith(schema);
  });

  test('folding removes the keywords and appends one sentence, in fixed keyword order', () => {
    // Authored out of order: the sentence follows `schemaConstraintKeywords`, not the input.
    const raw: JsonObject = { type: 'integer', maximum: 10, default: 3, minimum: 1 };
    expect(JsonSchema.adaptSchemaKeywords(raw, JsonSchema.unverifiedWireSchemaKeywords)).toSucceedWith({
      type: 'integer',
      description: 'Constraints: minimum 1; maximum 10. Default: 3.'
    });
  });

  test('an existing description keeps its text and position, the sentence after it', () => {
    const raw: JsonObject = { type: 'string', description: 'A name.', minLength: 1, title: 'Name' };
    const adapted = JsonSchema.adaptSchemaKeywords(
      raw,
      JsonSchema.unverifiedWireSchemaKeywords
    ).orThrow() as JsonObject;
    expect(Object.keys(adapted)).toEqual(['type', 'description']);
    // The title is dropped, not folded: it restates the property name.
    expect(adapted.description).toBe('A name. Constraints: minLength 1.');
  });

  test('an empty description is replaced by the sentence alone', () => {
    expect(
      JsonSchema.adaptSchemaKeywords(
        { type: 'string', description: '', maxLength: 2 },
        JsonSchema.unverifiedWireSchemaKeywords
      )
    ).toSucceedWith({ type: 'string', description: 'Constraints: maxLength 2.' });
  });

  test('passValues sends a listed value and folds any other', () => {
    const caps: JsonSchema.SchemaKeywordCapabilities = {
      ...JsonSchema.unverifiedWireSchemaKeywords,
      format: { passValues: ['date', 'uuid'] }
    };
    expect(JsonSchema.adaptSchemaKeywords({ type: 'string', format: 'uuid' }, caps)).toSucceedWith({
      type: 'string',
      format: 'uuid'
    });
    expect(JsonSchema.adaptSchemaKeywords({ type: 'string', format: 'hostname' }, caps)).toSucceedWith({
      type: 'string',
      description: 'Format: hostname.'
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
    expect(JsonSchema.adaptSchemaKeywords({ type: 'integer', exclusiveMinimum: 0 }, caps)).toSucceedWith({
      type: 'integer',
      minimum: 1
    });
    expect(JsonSchema.adaptSchemaKeywords({ type: 'number', exclusiveMinimum: 0 }, caps)).toSucceedWith({
      type: 'number',
      description: 'Constraints: exclusiveMinimum 0.'
    });
  });

  test('adapts nested properties, items and schema-valued additionalProperties', () => {
    const schema = JsonSchema.object({
      tags: JsonSchema.array(
        JsonSchema.string(JsonSchema.stringOptions({ maxLength: 5 }).shouldNotFail('string options'))
      ),
      scores: JsonSchema.record(
        JsonSchema.number(JsonSchema.numberOptions({ minimum: 0 }).shouldNotFail('number options'))
      ),
      n: JsonSchema.optional(
        JsonSchema.integer(JsonSchema.integerOptions({ multipleOf: 2 }).shouldNotFail('integer options'))
      )
    }).toJson();
    expect(JsonSchema.adaptSchemaKeywords(schema, JsonSchema.unverifiedWireSchemaKeywords)).toSucceedWith({
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
        ...JsonSchema.unverifiedWireSchemaKeywords,
        default: 'pass',
        examples: 'pass'
      })
    ).toSucceedWith(raw);
  });

  test('a non-object value is returned as it is, and the input is never modified', () => {
    expect(JsonSchema.adaptSchemaKeywords(true, JsonSchema.unverifiedWireSchemaKeywords)).toSucceedWith(true);
    const raw: JsonObject = { type: 'number', minimum: 1 };
    JsonSchema.adaptSchemaKeywords(raw, JsonSchema.unverifiedWireSchemaKeywords);
    expect(raw).toEqual({ type: 'number', minimum: 1 });
  });

  test('a folded schema still validates as the authored one does: the validator stays authoritative', () => {
    const schema = JsonSchema.integer(
      JsonSchema.integerOptions({ minimum: 1, maximum: 10 }).shouldNotFail('integer options')
    );
    const folded = JsonSchema.adaptSchemaKeywords(schema.toJson(), JsonSchema.unverifiedWireSchemaKeywords);
    expect(folded).toSucceedWith({ type: 'integer', description: 'Constraints: minimum 1; maximum 10.' });
    expect(schema.validate(0)).toFailWith(/minimum/);
  });

  test('schemaConstraintKeywords lists every keyword of the table, in fold order', () => {
    const shapeRules: readonly string[] = ['nonStringEnum', 'untyped'];
    expect([...JsonSchema.schemaConstraintKeywords].sort()).toEqual(
      Object.keys(JsonSchema.unverifiedWireSchemaKeywords)
        .filter((key) => !shapeRules.includes(key))
        .sort()
    );
  });
});
