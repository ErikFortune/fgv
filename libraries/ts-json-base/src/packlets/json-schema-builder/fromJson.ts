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

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { JsonObject, JsonValue, isJsonObject } from '../json';
import { array, boolean, enumOf, integer, number, object, optional, string } from './factories';
import { ILlmProperties, ILlmSchema } from './types';

/**
 * Compositional / assertive keywords outside the LLM-tool subset. Their presence cannot be honored
 * faithfully, so {@link fromJson} fails rather than silently producing a looser converter.
 *
 * @remarks
 * The structural keywords (`$ref`, `oneOf`, `anyOf`, `allOf`, `not`, `if`, `then`, `else`) change
 * composition; `pattern` is an always-assertive string constraint. Pure annotations (`title`,
 * `default`, `examples`, draft-07 `format`, a spurious `description` on any node) are intentionally
 * ignored — they carry no validation semantics in this subset.
 */
const FORBIDDEN_KEYWORDS: readonly string[] = [
  '$ref',
  'oneOf',
  'anyOf',
  'allOf',
  'not',
  'if',
  'then',
  'else',
  'pattern'
];

/**
 * Parses a raw JSON Schema object (e.g. one discovered at an MCP tool boundary) into a typed schema
 * value within the LLM-tool subset.
 *
 * @remarks
 * Because the static type cannot be recovered from a runtime value, every node is pinned to the
 * opaque phantom `JsonObject` — the honest type when a schema arrives at runtime. The result can be
 * passed to {@link toConverter} (yielding a `Converter<JsonObject>` that performs real runtime
 * validation) or {@link toJson} (re-emitting the normalized wire form). Consumers who need a
 * narrower static type must author the schema via the factories.
 *
 * Out-of-subset features fail loudly with a path (see {@link FORBIDDEN_KEYWORDS}); harmless
 * annotations are passed through.
 *
 * @param json - The raw JSON Schema object to parse.
 * @returns `Success` with the parsed schema, or `Failure` describing the first out-of-subset feature.
 * @public
 */
export function fromJson(json: JsonObject): Result<ILlmSchema<JsonObject>> {
  // The parser works in terms of `ILlmSchema<unknown>` (every factory result is assignable to it).
  // At the boundary the root is pinned to the opaque `JsonObject` phantom — the only honest static
  // type for a schema reconstructed from runtime data (see feasibility doc §A.8).
  return _parseNode(json, '#').onSuccess((node) => succeed(node as unknown as ILlmSchema<JsonObject>));
}

function _parseNode(raw: JsonValue, path: string): Result<ILlmSchema<unknown>> {
  if (!isJsonObject(raw)) {
    return fail(`${path}: expected a JSON Schema object`);
  }
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (keyword in raw) {
      return fail(`${path}: unsupported JSON Schema keyword '${keyword}'`);
    }
  }
  const opts = typeof raw.description === 'string' ? { description: raw.description } : undefined;

  if ('enum' in raw) {
    return _parseEnum(raw.enum, path, opts);
  }

  const type = raw.type;
  if (Array.isArray(type)) {
    return fail(`${path}: union 'type' arrays are not supported`);
  }
  switch (type) {
    case 'string':
      return succeed(string(opts));
    case 'number':
      return succeed(number(opts));
    case 'integer':
      return succeed(integer(opts));
    case 'boolean':
      return succeed(boolean(opts));
    case 'array':
      return _parseArray(raw, path, opts);
    case 'object':
      return _parseObject(raw, path, opts);
    default:
      return fail(`${path}: unsupported or missing 'type' (${JSON.stringify(type)})`);
  }
}

function _parseEnum(
  values: JsonValue,
  path: string,
  opts?: { description: string }
): Result<ILlmSchema<unknown>> {
  if (!Array.isArray(values) || values.length === 0) {
    return fail(`${path}: 'enum' must be a non-empty array`);
  }
  if (!values.every((v): v is string => typeof v === 'string')) {
    return fail(`${path}: only string 'enum' values are supported`);
  }
  return succeed(enumOf(values, opts));
}

function _parseArray(
  raw: JsonObject,
  path: string,
  opts?: { description: string }
): Result<ILlmSchema<unknown>> {
  const items = raw.items;
  if (items === undefined) {
    return fail(`${path}: 'array' requires an 'items' schema`);
  }
  if (Array.isArray(items)) {
    return fail(`${path}: tuple-form 'items' arrays are not supported`);
  }
  return _parseNode(items, `${path}/items`).onSuccess((inner) => succeed(array(inner, opts)));
}

function _parseObject(
  raw: JsonObject,
  path: string,
  opts?: { description: string }
): Result<ILlmSchema<unknown>> {
  const rawProps = raw.properties;
  if (rawProps !== undefined && !isJsonObject(rawProps)) {
    return fail(`${path}: 'properties' must be an object`);
  }
  const rawRequired = raw.required;
  if (
    rawRequired !== undefined &&
    (!Array.isArray(rawRequired) || !rawRequired.every((r) => typeof r === 'string'))
  ) {
    return fail(`${path}: 'required' must be an array of strings`);
  }
  const additionalProperties = raw.additionalProperties;
  if (additionalProperties !== undefined && typeof additionalProperties !== 'boolean') {
    return fail(`${path}: schema-valued 'additionalProperties' is not supported`);
  }

  const requiredSet = new Set<string>(
    Array.isArray(rawRequired) ? rawRequired.filter((r): r is string => typeof r === 'string') : []
  );
  const propEntries = isJsonObject(rawProps) ? Object.entries(rawProps) : [];

  // Reject `required` keys with no matching property schema. JSON Schema permits this, but for the
  // LLM-tool subset it is almost always a mistake — and silently dropping the key would emit a
  // schema looser than the input declared (the "required" field would vanish entirely).
  const declared = new Set(propEntries.map(([key]) => key));
  for (const key of requiredSet) {
    if (!declared.has(key)) {
      return fail(`${path}: 'required' key '${key}' has no matching entry in 'properties'`);
    }
  }

  return mapResults(
    propEntries.map(([key, child]) =>
      _parseNode(child, `${path}/properties/${key}`).onSuccess((node) =>
        succeed([key, requiredSet.has(key) ? node : optional(node)] as const)
      )
    )
  ).onSuccess((built) => {
    const properties: ILlmProperties = {};
    for (const [key, node] of built) {
      properties[key] = node;
    }
    return succeed(
      object(properties, {
        // JSON Schema's default (absent `additionalProperties`) permits extra fields; only an
        // explicit `false` produces a strict object.
        additionalProperties: additionalProperties !== false,
        ...opts
      })
    );
  });
}
