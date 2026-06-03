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
import { JsonObject, JsonValue } from '../json';
import { array, boolean, enumOf, integer, number, object, optional, string } from './factories';
import { ILlmProperties, ISchemaValidator } from './types';

/**
 * Compositional / assertive keywords outside the LLM-tool subset. Their presence cannot be honored
 * faithfully — silently dropping them would produce a converter looser than the schema describes.
 * Pure annotations (`title`, `default`, `examples`, draft-07 `format`) carry no validation semantics
 * and are intentionally ignored. `description` IS preserved on every node (see `_descriptionField`).
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

// ---------------------------------------------------------------------------
// Field-level converters — extract individual fields declaratively, eliminating
// `from as Record<string, unknown>` in the arm bodies.
// ---------------------------------------------------------------------------

/**
 * Extracts an optional `description` string. Absent values succeed as `undefined`.
 * When present, `description` must be a string — a non-string value (e.g. a number or object)
 * produces a descriptive failure. Pure annotations with no validation semantics are accepted;
 * non-string values that cannot be used as a description are rejected with a clear error.
 */
const _descriptionField: Converter<string | undefined> = Converters.optionalField(
  'description',
  Converters.string
);

/**
 * Extracts and validates the `enum` field: must be a non-empty array of strings.
 * Non-array input or non-string element → descriptive failure; empty array → failure.
 */
const _enumValuesField: Converter<string[]> = Converters.field(
  'enum',
  Converters.arrayOf(Converters.string).withConstraint(
    (values) => values.length > 0 || fail("'enum' must be a non-empty array")
  )
);

/**
 * Extracts an optional `type` field as a raw string. Used by the enum arm to detect
 * conflicting type declarations; the pre-flight in `jsonSchemaConverter` validates type
 * values for non-enum nodes.
 */
const _typeOptionalField: Converter<string | undefined> = Converters.optionalField('type', Converters.string);

/**
 * Checks that the input is a non-null, non-array object and returns it as
 * `Record<string, unknown>`. This is a safe narrowing after explicit runtime guards —
 * not an unsafe cast.
 */
const _plainObjectField: Converter<Record<string, unknown>> = Converters.generic(
  (v: unknown): Result<Record<string, unknown>> => {
    if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
      return succeed(v as Record<string, unknown>);
    }
    return fail('expected an object');
  }
);

// ---------------------------------------------------------------------------
// Private helpers
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

/** Converts an optional description string to `ISchemaOptions` form. */
function _descriptionOpts(description: string | undefined): { description?: string } {
  return description !== undefined ? { description } : {};
}

// ---------------------------------------------------------------------------
// Per-arm converter functions — defined as function declarations so they are
// hoisted and can be referenced before their textual position. Each arm uses
// Converters.field / Converters.optionalField to extract fields declaratively
// rather than casting `from` to `Record<string, unknown>` and reading properties
// manually (the anti-pattern called out in CODING_STANDARDS §Type-Safe Validation).
//
// Arms are typed as `Converter<ISchemaValidator<JsonValue>, string>` where the
// context string is the current JSON Pointer path. `discriminatedObject` and `oneOf`
// thread the context through to each arm automatically.
// ---------------------------------------------------------------------------

/** String arm: extracts `description?` and delegates to the `string` factory. */
function _convertString(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonValue>, string>,
  context?: string
): Result<ISchemaValidator<JsonValue>> {
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  const path = context ?? '#';
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(string(_descriptionOpts(description)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/** Number arm: extracts `description?` and delegates to the `number` factory. */
function _convertNumber(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonValue>, string>,
  context?: string
): Result<ISchemaValidator<JsonValue>> {
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  const path = context ?? '#';
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(number(_descriptionOpts(description)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/** Integer arm: extracts `description?` and delegates to the `integer` factory. */
function _convertInteger(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonValue>, string>,
  context?: string
): Result<ISchemaValidator<JsonValue>> {
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  const path = context ?? '#';
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(integer(_descriptionOpts(description)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/** Boolean arm: extracts `description?` and delegates to the `boolean` factory. */
function _convertBoolean(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonValue>, string>,
  context?: string
): Result<ISchemaValidator<JsonValue>> {
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  const path = context ?? '#';
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(boolean(_descriptionOpts(description)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/**
 * Array arm — uses `Converters.field` to extract `items` as a raw unknown value (no cast),
 * then recurses for the `items` sub-schema via `jsonSchemaConverter`.
 * Receives the current JSON Pointer path via `context`.
 */
function _convertArray(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonValue>, string>,
  context?: string
): Result<ISchemaValidator<JsonValue>> {
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  const path = context ?? '#';

  // Extract `items` as an opaque unknown value — the field extractor verifies only that
  // the key exists and that `from` is an object; type validation happens via jsonSchemaConverter.
  const itemsResult = Converters.field(
    'items',
    Converters.generic((v: unknown): Result<unknown> => succeed(v))
  ).convert(from);
  if (itemsResult.isFailure()) {
    return fail(`${path}: 'array' requires an 'items' schema`);
  }
  const items = itemsResult.value;
  if (Array.isArray(items)) {
    return fail(`${path}: tuple-form 'items' arrays are not supported`);
  }

  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      // Forward reference to jsonSchemaConverter; safe — called at runtime, not module load.
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      jsonSchemaConverter
        .convert(items, `${path}/items`)
        .onSuccess((inner) =>
          succeed(array(inner, _descriptionOpts(description)) as unknown as ISchemaValidator<JsonValue>)
        )
    );
}

/**
 * Object arm — delegates to `_parseObjectBody` for recursive property processing.
 * Receives the current JSON Pointer path via `context`.
 */
function _convertObject(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonValue>, string>,
  context?: string
): Result<ISchemaValidator<JsonValue>> {
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  return _parseObjectBody(from, context ?? '#');
}

/**
 * Enum arm — extracts `type?`, `enum`, and `description?` declaratively via field converters.
 *
 * L1 rejection: rejects a `type` field that conflicts with enum semantics. An enum schema's only
 * valid type declarations are absent or `'string'`; any other value — including a union array like
 * `['string', 'null']` that would have been caught by the union-type pre-flight for non-enum nodes —
 * produces a descriptive failure.
 *
 * Receives the current JSON Pointer path via `context`.
 */
function _convertEnum(
  from: unknown,
  __self: Converter<ISchemaValidator<JsonValue>, string>,
  context?: string
): Result<ISchemaValidator<JsonValue>> {
  /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  const path = context ?? '#';

  // Extract enum values declaratively — fails if not an array, not all strings, or empty.
  const enumResult = _enumValuesField.convert(from);
  if (enumResult.isFailure()) {
    return fail(`${path}: ${enumResult.message}`);
  }
  const values = enumResult.value;

  // L1: reject conflicting `type`. For enum nodes, `jsonSchemaConverter`'s union-type pre-flight
  // is skipped (the `!('enum' in raw)` gate). Validate here instead.
  const typeResult = _typeOptionalField.convert(from);
  if (typeResult.isFailure()) {
    // e.g. type: 123 — the field exists but is not a string.
    return fail(`${path}: enum schema 'type' field must be a string or absent`);
  }
  if (typeResult.value !== undefined && typeResult.value !== 'string') {
    return fail(
      `${path}: enum schema declares conflicting 'type' '${typeResult.value}' (must be 'string' or absent)`
    );
  }

  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(enumOf(values, _descriptionOpts(description)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/**
 * Parses the body of an `object`-type schema using field converters, then recurses into
 * property sub-schemas via `jsonSchemaConverter`.
 * Called after pre-flight guarantees `from` is a non-null, non-array object.
 */
function _parseObjectBody(from: unknown, path: string): Result<ISchemaValidator<JsonValue>> {
  // Extract `properties` — must be a non-array object if present.
  const propsResult = Converters.optionalField('properties', _plainObjectField).convert(from);
  if (propsResult.isFailure()) {
    return fail(`${path}: 'properties' must be an object`);
  }
  const rawProps = propsResult.value;

  // Extract `required` — must be an array of strings if present.
  const requiredResult = Converters.optionalField('required', Converters.arrayOf(Converters.string)).convert(
    from
  );
  if (requiredResult.isFailure()) {
    return fail(`${path}: 'required' must be an array of strings`);
  }
  const rawRequired = requiredResult.value;

  // Extract `additionalProperties` — must be boolean if present (schema-valued not supported).
  const addlPropsResult = Converters.optionalField('additionalProperties', Converters.boolean).convert(from);
  if (addlPropsResult.isFailure()) {
    return fail(`${path}: schema-valued 'additionalProperties' is not supported`);
  }
  const additionalProperties = addlPropsResult.value;

  // Extract optional description; _descriptionField always succeeds (optional string).
  const descResult = _descriptionField.convert(from);
  /* c8 ignore next 3 - _descriptionField always succeeds */
  if (descResult.isFailure()) {
    return fail(`${path}: ${descResult.message}`);
  }
  const description = descResult.value;

  const requiredSet = new Set<string>(rawRequired ?? []);
  const propEntries: [string, unknown][] = rawProps !== undefined ? Object.entries(rawProps) : [];

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
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      jsonSchemaConverter
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
        ..._descriptionOpts(description)
      }) as unknown as ISchemaValidator<JsonValue>
    );
  });
}

// ---------------------------------------------------------------------------
// Arm converter instances (built once, referenced by jsonSchemaConverter's dispatch).
// Typed as `Converter<ISchemaValidator<JsonValue>, string>` so the JSON Pointer path
// context flows from jsonSchemaConverter through oneOf/discriminatedObject to each arm.
// ---------------------------------------------------------------------------

const _stringArm: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(_convertString);
const _numberArm: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(_convertNumber);
const _integerArm: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(_convertInteger);
const _booleanArm: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(_convertBoolean);
const _arrayArm: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(_convertArray);
const _objectArm: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(_convertObject);
const _enumArm: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(_convertEnum);

// ---------------------------------------------------------------------------
// Type-dispatched converter (non-enum nodes only).
// ---------------------------------------------------------------------------
const _typeDispatchConverter: Converter<ISchemaValidator<JsonValue>, string> = Converters.discriminatedObject<
  ISchemaValidator<JsonValue>,
  string,
  string
>('type', {
  string: _stringArm,
  number: _numberArm,
  integer: _integerArm,
  boolean: _booleanArm,
  array: _arrayArm,
  object: _objectArm
});

/**
 * The main converter. Parses a raw JSON Schema object into a typed schema validator
 * for the LLM-tool subset.
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
export const jsonSchemaConverter: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(
  (
    from: unknown,
    __self: Converter<ISchemaValidator<JsonValue>, string>,
    context?: string
  ): Result<ISchemaValidator<JsonValue>> => {
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

    // Enum nodes route directly to the enum arm so that validation failures (invalid enum values,
    // conflicting type) propagate immediately — not through oneOf, which would silently try the
    // type-dispatched arm and produce a confusing "no matching converter" message.
    if ('enum' in raw) {
      return _enumArm.convert(from, path);
    }
    return _typeDispatchConverter.convert(from, path);
  }
);

/**
 * Parses a raw JSON Schema object (e.g. one discovered at an MCP tool boundary) into a typed schema
 * value within the LLM-tool subset.
 *
 * @remarks
 * Because the static type cannot be recovered from a runtime value, the result is typed as the
 * opaque supertype `ISchemaValidator<JsonValue>` — the honest type when a schema arrives at runtime,
 * since schemas may validate strings, numbers, booleans, arrays, or objects. The `validate()` method
 * performs real runtime validation; the derived static type is the opaque `JsonValue`.
 *
 * Consumers who need a narrower derived type must author the schema via the factories.
 *
 * Out-of-subset features fail loudly (see `FORBIDDEN_KEYWORDS`); `description` is preserved on every
 * node; other annotations (`title`, `default`, `format`, `examples`) are silently ignored.
 *
 * @param json - The raw JSON Schema object to parse.
 * @returns `Success` with the parsed schema, or `Failure` describing the first out-of-subset feature.
 * @public
 */
export function fromJson(json: JsonObject): Result<ISchemaValidator<JsonValue>> {
  return jsonSchemaConverter.convert(json);
}
