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

import { JsonObject } from '../json';
import {
  ILlmArraySchema,
  ILlmEnumSchema,
  ILlmObjectSchema,
  ILlmOptional,
  ILlmProperties,
  ILlmSchema
} from './types';

/**
 * Emits the standard JSON Schema (draft-07 LLM-tool subset) wire form for a typed schema value.
 *
 * @remarks
 * Phantom fields exist only in the type system and never appear in the output. `optional` wrappers
 * are invisible in the emitted schema — they manifest as absent entries in the parent object's
 * `required` array, which is the correct JSON Schema representation of optionality. The result is a
 * `JsonObject` suitable for an LLM provider's function/tool `parameters` field.
 *
 * An unrecognized `_type` discriminant (only reachable when a node is hand-constructed via an unsafe
 * cast, since `SchemaNodeType` is a closed union) emits an empty object `{}` rather than throwing —
 * an unconstrained schema. Schema values from the factories or {@link fromJson} never hit this path.
 *
 * @param schema - A typed schema value produced by the factories (or by {@link fromJson}).
 * @returns The JSON Schema object describing `schema`.
 * @public
 */
export function toJson(schema: ILlmSchema<unknown>): JsonObject {
  switch (schema._type) {
    case 'string':
      return { type: 'string', ...description(schema) };
    case 'number':
      return { type: 'number', ...description(schema) };
    case 'integer':
      return { type: 'integer', ...description(schema) };
    case 'boolean':
      return { type: 'boolean', ...description(schema) };
    case 'enum': {
      const enumSchema = schema as ILlmEnumSchema<string>;
      return { type: 'string', enum: [...enumSchema.enum], ...description(schema) };
    }
    case 'optional':
      return toJson((schema as ILlmOptional<ILlmSchema<unknown>>)._schema);
    case 'array': {
      const arraySchema = schema as ILlmArraySchema<ILlmSchema<unknown>>;
      return { type: 'array', items: toJson(arraySchema._items), ...description(schema) };
    }
    case 'object':
      return _objectToJson(schema as ILlmObjectSchema<ILlmProperties>);
    default:
      // Unreachable for factory- or fromJson-produced nodes (closed `SchemaNodeType`). See @remarks.
      return {};
  }
}

function _objectToJson(schema: ILlmObjectSchema<ILlmProperties>): JsonObject {
  const properties: JsonObject = {};
  const required: string[] = [];
  for (const [key, prop] of Object.entries(schema._properties)) {
    const isOptional = prop._type === 'optional';
    const inner = isOptional ? (prop as ILlmOptional<ILlmSchema<unknown>>)._schema : prop;
    properties[key] = toJson(inner);
    if (!isOptional) {
      required.push(key);
    }
  }
  return {
    type: 'object',
    properties,
    ...(required.length > 0 && { required }),
    ...(schema.additionalProperties === false && { additionalProperties: false }),
    ...description(schema)
  };
}

function description(schema: ILlmSchema<unknown>): { description?: string } {
  return schema.description !== undefined ? { description: schema.description } : {};
}
