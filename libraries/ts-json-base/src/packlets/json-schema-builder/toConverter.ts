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

import { Conversion, Converter, Converters, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import {
  ILlmArraySchema,
  ILlmEnumSchema,
  ILlmNumberSchema,
  ILlmObjectSchema,
  ILlmOptional,
  ILlmProperties,
  ILlmSchema,
  ObjectStatic,
  Static
} from './types';

/**
 * Builds a {@link Converter} that validates `unknown` input against the supplied typed schema,
 * producing the schema's derived static type.
 *
 * @remarks
 * The returned converter is assembled purely by composing existing `@fgv/ts-utils` `Converters.*`
 * primitives — no new combinators are introduced. The derived type `Static<S>` is recovered from
 * the schema value automatically; callers never supply `T`. Field-level error messages come from
 * the underlying `Converters.object` / `Converters.strictObject` reporting (the object converter
 * prefixes each failure with the property name).
 *
 * @param schema - A typed schema value produced by the {@link string}/{@link object}/etc. factories.
 * @returns `Success` with a `Converter<Static<S>>`, or `Failure` if the schema carries an
 * unsupported node type.
 * @public
 */
export function toConverter<S extends ILlmSchema<unknown>>(schema: S): Result<Converter<Static<S>>> {
  // Widen to the concrete base so the per-arm narrowing casts are base-to-derived assertions
  // rather than (rejected) generic-type-parameter casts. The final `as unknown as` casts bridge
  // each concrete arm's converter to the generic `Converter<Static<S>>` return — correctness-
  // preserving because `S` is narrowed to the matching subtype within each arm (feasibility §B.1).
  const node: ILlmSchema<unknown> = schema;
  switch (node._type) {
    case 'string':
      return succeed(Converters.string as unknown as Converter<Static<S>>);

    case 'number':
    case 'integer':
      return succeed(_numberConverter(node as ILlmNumberSchema) as unknown as Converter<Static<S>>);

    case 'boolean':
      return succeed(Converters.boolean as unknown as Converter<Static<S>>);

    case 'enum': {
      const enumSchema = node as ILlmEnumSchema<string>;
      return succeed(Converters.enumeratedValue(enumSchema.enum) as unknown as Converter<Static<S>>);
    }

    case 'array': {
      const arraySchema = node as ILlmArraySchema<ILlmSchema<unknown>>;
      return toConverter(arraySchema._items).onSuccess((inner) =>
        succeed(Converters.arrayOf(inner) as unknown as Converter<Static<S>>)
      );
    }

    case 'optional': {
      const optionalSchema = node as ILlmOptional<ILlmSchema<unknown>>;
      return toConverter(optionalSchema._schema).onSuccess((inner) =>
        succeed(inner.optional() as unknown as Converter<Static<S>>)
      );
    }

    case 'object':
      return _buildObjectConverter(node as ILlmObjectSchema<ILlmProperties>) as unknown as Result<
        Converter<Static<S>>
      >;

    default:
      return fail(`unsupported schema type: ${node._type}`);
  }
}

function _numberConverter(schema: ILlmNumberSchema): Converter<number> {
  const isInteger = schema._type === 'integer';
  if (schema.strict) {
    return isInteger
      ? Converters.isA('integer', (v): v is number => typeof v === 'number' && Number.isInteger(v))
      : Converters.isA('number', (v): v is number => typeof v === 'number' && !Number.isNaN(v));
  }
  return isInteger
    ? Converters.number.withConstraint((n) => Number.isInteger(n) || fail(`${n}: not an integer`))
    : Converters.number;
}

function _buildObjectConverter<P extends ILlmProperties>(
  schema: ILlmObjectSchema<P>
): Result<Converter<ObjectStatic<P>>> {
  const entries = Object.entries(schema._properties);
  return mapResults(entries.map(([key, prop]) => _buildField(key, prop))).onSuccess((built) => {
    const fields: Record<string, Converter<unknown>> = {};
    const optionalKeys: string[] = [];
    for (const { key, optional, converter } of built) {
      fields[key] = converter;
      if (optional) {
        optionalKeys.push(key);
      }
    }
    const options: Conversion.ObjectConverterOptions<ObjectStatic<P>> = {
      optionalFields: optionalKeys as (keyof ObjectStatic<P>)[],
      ...(schema.description !== undefined && { description: schema.description })
    };
    const fieldConverters = fields as unknown as Conversion.FieldConverters<ObjectStatic<P>>;
    const converter = schema.additionalProperties
      ? Converters.object(fieldConverters, options)
      : Converters.strictObject(fieldConverters, options);
    return succeed(converter);
  });
}

interface IBuiltField {
  key: string;
  optional: boolean;
  converter: Converter<unknown>;
}

function _buildField(key: string, prop: ILlmSchema<unknown>): Result<IBuiltField> {
  // `toConverter` of an `ILlmSchema<unknown>` resolves `Static<S>` to `unknown`, so this is already
  // `Result<Converter<unknown>>` — no cast needed to land in `IBuiltField.converter`.
  return toConverter(prop)
    .withErrorFormat((msg) => `${key}: ${msg}`)
    .onSuccess((converter) => succeed({ key, optional: prop._type === 'optional', converter }));
}
