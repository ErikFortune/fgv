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

import { Converter, Converters, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { JsonObject } from '../json';
import { array, boolean, enumOf, integer, number, object, optional, string } from './factories';
import { ILlmProperties, ISchemaValidator } from './types';

/**
 * Compositional / assertive keywords outside the LLM-tool subset. Their presence cannot be honored
 * faithfully — silently dropping them would produce a converter looser than the schema describes.
 * Pure annotations (`title`, `default`, `examples`, draft-07 `format`, `description`) carry no
 * validation semantics and are intentionally ignored.
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

/** The type values we can dispatch to; used for early error detection. */
const _SUPPORTED_TYPES: ReadonlySet<string> = new Set([
  'string',
  'number',
  'integer',
  'boolean',
  'array',
  'object'
]);

/**
 * Extracts `{ description? }` from a raw schema object.
 * Non-string description values are silently dropped (treated as absent),
 * consistent with the treatment of other harmless annotations.
 */
function _extractDescription(raw: Record<string, unknown>): { description?: string } {
  const desc = raw.description;
  return typeof desc === 'string' ? { description: desc } : {};
}

// ---------------------------------------------------------------------------
// Private helpers — defined as function declarations so they are hoisted and
// can be referenced by jsonSchemaConverter before their textual position.
// ---------------------------------------------------------------------------

/**
 * Checks for forbidden keywords in a raw schema object (already validated as non-null object).
 * Returns `succeed(true)` if clean; returns a `Failure` if a forbidden keyword is found.
 */
function _checkForbidden(raw: Record<string, unknown>): Result<true> {
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (keyword in raw) {
      return fail(`unsupported JSON Schema keyword '${keyword}'`);
    }
  }
  return succeed(true as const);
}

function _parseEnumBody(
  values: unknown,
  path: string,
  raw: Record<string, unknown>
): Result<ISchemaValidator<JsonObject>> {
  if (!Array.isArray(values) || values.length === 0) {
    return fail(`${path}: 'enum' must be a non-empty array`);
  }
  if (!values.every((v): v is string => typeof v === 'string')) {
    return fail(`${path}: only string 'enum' values are supported`);
  }
  return succeed(enumOf(values, _extractDescription(raw)) as unknown as ISchemaValidator<JsonObject>);
}

function _parseObjectBody(raw: Record<string, unknown>, path: string): Result<ISchemaValidator<JsonObject>> {
  const rawProps = raw.properties;
  if (
    rawProps !== undefined &&
    (typeof rawProps !== 'object' || Array.isArray(rawProps) || rawProps === null)
  ) {
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

  const requiredSet = new Set<string>(Array.isArray(rawRequired) ? (rawRequired as string[]) : []);
  const propEntries: [string, unknown][] =
    rawProps !== null && typeof rawProps === 'object' && !Array.isArray(rawProps)
      ? Object.entries(rawProps as Record<string, unknown>)
      : [];

  // Reject `required` keys with no matching property schema.
  const declared = new Set(propEntries.map(([k]) => k));
  for (const key of requiredSet) {
    if (!declared.has(key)) {
      return fail(`${path}: 'required' key '${key}' has no matching entry in 'properties'`);
    }
  }

  return mapResults(
    propEntries.map(([key, child]) =>
      // Forward reference to jsonSchemaConverter: safe because this lambda executes only
      // after the module is fully initialized (at parse time, not at module load).
      // Thread the JSON Pointer path as context so nested errors are correctly attributed.
      // No withErrorFormat wrapper: jsonSchemaConverter prefixes its own errors with the
      // path it receives as context, so errors are attributed exactly once.
      jsonSchemaConverter // eslint-disable-line @typescript-eslint/no-use-before-define
        .convert(child, `${path}/properties/${key}`)
        .onSuccess((node) => succeed([key, requiredSet.has(key) ? node : optional(node)] as const))
    )
  ).onSuccess((built) => {
    const properties: ILlmProperties = {};
    for (const [key, node] of built) {
      properties[key] = node;
    }
    return succeed(
      object(properties, {
        // JSON Schema's default (absent additionalProperties) permits extra fields;
        // only an explicit `false` produces a strict validator.
        additionalProperties: additionalProperties !== false,
        ..._extractDescription(raw)
      }) as unknown as ISchemaValidator<JsonObject>
    );
  });
}

// ---------------------------------------------------------------------------
// Per-arm converters (hoisted function declarations → no forward-reference issue).
// Each arm is reached only after the pre-flight checks in jsonSchemaConverter pass,
// so inputs are guaranteed to be non-null, non-array objects with no forbidden keywords
// and a valid (or enum) type tag.
//
// Arms are typed as Converter<ISchemaValidator<JsonObject>, string> where the context
// is the current JSON Pointer path. discriminatedObject and oneOf thread the context
// through to each arm, so the path is available without any additional wiring.
// ---------------------------------------------------------------------------

/** String arm: `{ type: 'string', description? }` */
function _convertString(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonObject>, string>
): Result<ISchemaValidator<JsonObject>> {
  const raw = from as Record<string, unknown>;
  return succeed(string(_extractDescription(raw)) as unknown as ISchemaValidator<JsonObject>);
}

/** Number arm */
function _convertNumber(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonObject>, string>
): Result<ISchemaValidator<JsonObject>> {
  const raw = from as Record<string, unknown>;
  return succeed(number(_extractDescription(raw)) as unknown as ISchemaValidator<JsonObject>);
}

/** Integer arm */
function _convertInteger(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonObject>, string>
): Result<ISchemaValidator<JsonObject>> {
  const raw = from as Record<string, unknown>;
  return succeed(integer(_extractDescription(raw)) as unknown as ISchemaValidator<JsonObject>);
}

/** Boolean arm */
function _convertBoolean(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonObject>, string>
): Result<ISchemaValidator<JsonObject>> {
  const raw = from as Record<string, unknown>;
  return succeed(boolean(_extractDescription(raw)) as unknown as ISchemaValidator<JsonObject>);
}

/**
 * Array arm — recurses for the `items` sub-schema via `jsonSchemaConverter`.
 * Forward-references `jsonSchemaConverter` by name, which is safe because this function
 * body only executes at parse-time (after the module is fully initialized).
 * Receives the current JSON Pointer path via `context` (threaded by discriminatedObject/oneOf).
 */
function _convertArray(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonObject>, string>,
  context?: string
): Result<ISchemaValidator<JsonObject>> {
  // Pre-flight in jsonSchemaConverter guarantees `from` is a non-null, non-array object.
  // context is always provided by jsonSchemaConverter (which never calls arms without a path),
  // but the ConverterFunc signature allows undefined; the '#' branch is defensive.
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  const path = context ?? '#';
  const raw = from as Record<string, unknown>;
  const items = raw.items;
  if (items === undefined) {
    return fail(`${path}: 'array' requires an 'items' schema`);
  }
  if (Array.isArray(items)) {
    return fail(`${path}: tuple-form 'items' arrays are not supported`);
  }
  return jsonSchemaConverter // eslint-disable-line @typescript-eslint/no-use-before-define
    .convert(items, `${path}/items`)
    .onSuccess((inner) =>
      succeed(array(inner, _extractDescription(raw)) as unknown as ISchemaValidator<JsonObject>)
    );
}

/**
 * Object arm — recurses for each property value via `jsonSchemaConverter`.
 * Receives the current JSON Pointer path via `context` (threaded by discriminatedObject/oneOf).
 */
function _convertObject(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonObject>, string>,
  context?: string
): Result<ISchemaValidator<JsonObject>> {
  // Pre-flight in jsonSchemaConverter guarantees `from` is a non-null, non-array object.
  const raw = from as Record<string, unknown>;
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  return _parseObjectBody(raw, context ?? '#');
}

/**
 * Enum arm — handles `{ enum: [...] }` inputs (no `type` discriminator).
 * Receives the current JSON Pointer path via `context` (threaded by oneOf).
 */
function _convertEnum(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonObject>, string>,
  context?: string
): Result<ISchemaValidator<JsonObject>> {
  // Pre-flight in jsonSchemaConverter guarantees `from` is a non-null, non-array object.
  // The pre-flight also ensures 'enum' is present before routing here (the missing-type
  // check short-circuits non-enum nodes without a type field), so no guard is needed.
  const raw = from as Record<string, unknown>;
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  return _parseEnumBody(raw.enum, context ?? '#', raw);
}

// ---------------------------------------------------------------------------
// Arm converter instances (built once, referenced by jsonSchemaConverter's dispatch).
// Typed as Converter<ISchemaValidator<JsonObject>, string> so the JSON Pointer path
// context flows from jsonSchemaConverter through oneOf/discriminatedObject to each arm.
// Defined AFTER the function declarations above (no forward-reference issue).
// ---------------------------------------------------------------------------

const _stringArm: Converter<ISchemaValidator<JsonObject>, string> = Converters.generic(_convertString);
const _numberArm: Converter<ISchemaValidator<JsonObject>, string> = Converters.generic(_convertNumber);
const _integerArm: Converter<ISchemaValidator<JsonObject>, string> = Converters.generic(_convertInteger);
const _booleanArm: Converter<ISchemaValidator<JsonObject>, string> = Converters.generic(_convertBoolean);
const _arrayArm: Converter<ISchemaValidator<JsonObject>, string> = Converters.generic(_convertArray);
const _objectArm: Converter<ISchemaValidator<JsonObject>, string> = Converters.generic(_convertObject);
const _enumArm: Converter<ISchemaValidator<JsonObject>, string> = Converters.generic(_convertEnum);

// ---------------------------------------------------------------------------
// Top-level dispatch: oneOf([enum, discriminatedObject]).
// Built once and reused by jsonSchemaConverter's generic callback.
// ---------------------------------------------------------------------------
const _dispatchConverter: Converter<ISchemaValidator<JsonObject>, string> = Converters.oneOf([
  _enumArm,
  Converters.discriminatedObject<ISchemaValidator<JsonObject>, string, string>('type', {
    string: _stringArm,
    number: _numberArm,
    integer: _integerArm,
    boolean: _booleanArm,
    array: _arrayArm,
    object: _objectArm
  })
]);

/**
 * The main converter. Parses a raw JSON Schema object into a typed
 * {@link ISchemaValidator | schema validator} for the LLM-tool subset.
 *
 * @remarks
 * Performs pre-flight checks (non-object root, union type arrays, forbidden keywords,
 * unknown types) before dispatching to the per-type arm converters.
 *
 * The conversion context (`TC = string`) carries the current JSON Pointer path so that
 * error messages from nested nodes name the actual failing node (e.g.
 * `#/properties/config/properties/inner: 'required' key '...'`) rather than always
 * reporting `#:`. The context defaults to `'#'` when absent (top-level call).
 *
 * Array and object arms reference `jsonSchemaConverter` by name from inside function
 * declarations (hoisted). By the time any arm is called at runtime, `jsonSchemaConverter`
 * is fully initialized, so recursive sub-schema calls also go through the pre-flight checks
 * and produce meaningful error messages.
 *
 * @public
 */
export const jsonSchemaConverter: Converter<ISchemaValidator<JsonObject>, string> = Converters.generic(
  (
    from: unknown,
    __self: Converter<ISchemaValidator<JsonObject>, string>,
    context?: string
  ): Result<ISchemaValidator<JsonObject>> => {
    const path = context ?? '#';

    // Guard: root must be a non-array object.
    if (typeof from !== 'object' || Array.isArray(from) || from === null) {
      return fail(`${path}: expected a JSON Schema object`);
    }
    const raw = from as Record<string, unknown>;

    // Union type arrays: give a better error than discriminatedObject's generic message.
    if (Array.isArray(raw.type)) {
      return fail(`${path}: union 'type' arrays are not supported`);
    }

    // Forbidden keywords: check before dispatching so inputs with no `type` (e.g. just
    // `{ $ref: '...' }`) get a specific error rather than a generic "no matching converter".
    const forbidden = _checkForbidden(raw);
    if (forbidden.isFailure()) {
      return fail(`${path}: ${forbidden.message}`);
    }

    // Missing/unknown type (not enum): give a better error than a generic "no matching converter".
    if (!('enum' in raw) && (typeof raw.type !== 'string' || !_SUPPORTED_TYPES.has(raw.type))) {
      return fail(`${path}: unsupported or missing 'type'`);
    }

    return _dispatchConverter.convert(from, path);
  }
);

/**
 * Parses a raw JSON Schema object (e.g. one discovered at an MCP tool boundary) into a typed schema
 * value within the LLM-tool subset.
 *
 * @remarks
 * Because the static type cannot be recovered from a runtime value, every node is pinned to the
 * opaque phantom `JsonObject` — the honest type when a schema arrives at runtime. The result is an
 * {@link ISchemaValidator | ISchemaValidator<JsonObject>} whose `validate()` method performs real
 * runtime validation; the derived static type is the opaque `JsonObject`.
 *
 * Consumers who need a narrower derived type must author the schema via the factories.
 *
 * Out-of-subset features fail loudly (see `FORBIDDEN_KEYWORDS`); harmless annotations are ignored.
 *
 * @param json - The raw JSON Schema object to parse.
 * @returns `Success` with the parsed schema, or `Failure` describing the first out-of-subset feature.
 * @public
 */
export function fromJson(json: JsonObject): Result<ISchemaValidator<JsonObject>> {
  return jsonSchemaConverter.convert(json);
}
