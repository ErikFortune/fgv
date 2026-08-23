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
 * Extracts an `enum` list that may carry `null` among its string members.
 *
 * @remarks
 * A nullable enum emitted by this package carries `null` in **both** `type` and `enum`,
 * because a reader consulting only one of them would otherwise disagree with a reader
 * consulting the other. This converter is what lets the `null` member through so the
 * enum arm can strip it and set nullability; `_enumValuesField` still governs the
 * remaining values.
 */
// `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
// `JsonPrimitive` takes in this package's `json` packlet.
// eslint-disable-next-line @rushstack/no-new-null
const _enumRawValuesField: Converter<(string | null)[]> = Converters.field(
  'enum',
  Converters.arrayOf(Converters.oneOf<string | null>([Converters.string, Converters.literal(null)]))
);

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

/** Converts a description and nullability into `ISchemaOptions` form. */
function _nodeOpts(
  description: string | undefined,
  nullable: boolean
): { description?: string; nullable?: true } {
  return {
    ...(description !== undefined && { description }),
    ...(nullable && { nullable: true as const })
  };
}

/** A `type` field split into its scalar type and whether `null` was part of a union. */
interface ISplitType {
  readonly type: string | undefined;
  readonly nullable: boolean;
}

/**
 * Splits a raw `type` field into a scalar type plus nullability.
 *
 * @remarks
 * The subset admits exactly one union shape — `[<type>, 'null']`, in either order —
 * because that is the shape this package emits for a nullable node and the shape OpenAI
 * strict mode requires. **Every other union is still refused**: widening the parser to
 * general unions would let it accept schemas the rest of the subset cannot represent.
 *
 * This exists because `toJson()` can emit that union, and `callProxiedCompletion`
 * reconstitutes a forwarded schema through this converter. A parser that refused what the
 * emitter produces would break every nullable schema on the proxy path — our own code
 * refusing our own output.
 */
function _splitNullableType(rawType: unknown): Result<ISplitType> {
  if (!Array.isArray(rawType)) {
    return succeed({ type: typeof rawType === 'string' ? rawType : undefined, nullable: false });
  }
  const withoutNull: unknown[] = rawType.filter((member) => member !== 'null');
  if (rawType.length !== 2 || withoutNull.length !== 1 || typeof withoutNull[0] !== 'string') {
    return fail("union 'type' arrays are supported only as [<type>, 'null']");
  }
  return succeed({ type: withoutNull[0], nullable: true });
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
function _convertString(from: unknown, path: string, nullable: boolean): Result<ISchemaValidator<JsonValue>> {
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(string(_nodeOpts(description, nullable)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/** Number arm: extracts `description?` and delegates to the `number` factory. */
function _convertNumber(from: unknown, path: string, nullable: boolean): Result<ISchemaValidator<JsonValue>> {
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(number(_nodeOpts(description, nullable)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/** Integer arm: extracts `description?` and delegates to the `integer` factory. */
function _convertInteger(
  from: unknown,
  path: string,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(integer(_nodeOpts(description, nullable)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/** Boolean arm: extracts `description?` and delegates to the `boolean` factory. */
function _convertBoolean(
  from: unknown,
  path: string,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(boolean(_nodeOpts(description, nullable)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/**
 * Array arm — uses `Converters.field` to extract `items` as a raw unknown value (no cast),
 * then recurses for the `items` sub-schema via `jsonSchemaConverter`.
 * Receives the current JSON Pointer path via `context`.
 */
function _convertArray(from: unknown, path: string, nullable: boolean): Result<ISchemaValidator<JsonValue>> {
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
          succeed(array(inner, _nodeOpts(description, nullable)) as unknown as ISchemaValidator<JsonValue>)
        )
    );
}

/**
 * Object arm — delegates to `_parseObjectBody` for recursive property processing.
 * Receives the current JSON Pointer path via `context`.
 */
function _convertObject(from: unknown, path: string, nullable: boolean): Result<ISchemaValidator<JsonValue>> {
  return _parseObjectBody(from, path, nullable);
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
function _convertEnum(from: unknown, path: string): Result<ISchemaValidator<JsonValue>> {
  // An enum node carries its nullability in TWO places — `null` among the values and
  // `'null'` in the type union — so this arm reads both and requires them to agree,
  // rather than taking whichever it happens to look at first.
  const rawValuesResult = _enumRawValuesField.convert(from);
  if (rawValuesResult.isFailure()) {
    // Fall back to the strings-only extractor for its sharper message (non-array, wrong
    // member type, and so on); it fails on exactly the inputs this one does, minus `null`.
    return fail(`${path}: ${_enumValuesField.convert(from).message}`);
  }
  const nullInValues: boolean = rawValuesResult.value.includes(null);

  // L1: reject conflicting `type`. For enum nodes, `jsonSchemaConverter`'s type pre-flight
  // is skipped (the `!('enum' in raw)` gate). Validate here instead.
  const rawType: unknown = (from as Record<string, unknown>).type;
  const split = _splitNullableType(rawType);
  if (split.isFailure()) {
    return fail(`${path}: ${split.message}`);
  }
  if (rawType !== undefined && split.value.type === undefined) {
    // e.g. type: 123 — the field exists but is not a string or a supported union.
    return fail(`${path}: enum schema 'type' field must be a string or absent`);
  }
  if (split.value.type !== undefined && split.value.type !== 'string') {
    return fail(
      `${path}: enum schema declares conflicting 'type' '${split.value.type}' (must be 'string' or absent)`
    );
  }
  if (split.value.nullable !== nullInValues) {
    return fail(
      `${path}: enum schema is nullable in its '${split.value.nullable ? 'type' : 'enum'}' but not its ` +
        `'${split.value.nullable ? 'enum' : 'type'}'`
    );
  }

  // Now that `null` has been accounted for, the strings-only extractor governs the rest —
  // including the non-empty constraint, which a list of just `[null]` must still fail.
  const valuesResult = _enumValuesField.convert({
    ...(from as Record<string, unknown>),
    enum: rawValuesResult.value.filter((v): v is string => v !== null)
  });
  if (valuesResult.isFailure()) {
    return fail(`${path}: ${valuesResult.message}`);
  }

  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(
        enumOf(
          valuesResult.value,
          _nodeOpts(description, nullInValues)
        ) as unknown as ISchemaValidator<JsonValue>
      )
    );
}

/**
 * Parses the body of an `object`-type schema using field converters, then recurses into
 * property sub-schemas via `jsonSchemaConverter`.
 * Called after pre-flight guarantees `from` is a non-null, non-array object.
 */
function _parseObjectBody(
  from: unknown,
  path: string,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
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
        ..._nodeOpts(description, nullable)
      }) as unknown as ISchemaValidator<JsonValue>
    );
  });
}

// ---------------------------------------------------------------------------
// Arm converter instances (built once, referenced by jsonSchemaConverter's dispatch).
// Typed as `Converter<ISchemaValidator<JsonValue>, string>` so the JSON Pointer path
// context flows from jsonSchemaConverter through oneOf/discriminatedObject to each arm.
// ---------------------------------------------------------------------------

/** Arm body: the raw node, its JSON Pointer path, and whether its `type` union carried `null`. */
type ArmBody = (from: unknown, path: string, nullable: boolean) => Result<ISchemaValidator<JsonValue>>;

/**
 * Binds an arm body to a nullability, since `Converters.generic` has no channel for it —
 * its context slot already carries the path. Hence two dispatch tables rather than one:
 * `jsonSchemaConverter` decides nullability from the `type` union and picks the table.
 */
function _arm(body: ArmBody, nullable: boolean): Converter<ISchemaValidator<JsonValue>, string> {
  return Converters.generic(
    (
      from: unknown,
      __self: Converter<ISchemaValidator<JsonValue>, string>,
      context?: string
      /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
    ): Result<ISchemaValidator<JsonValue>> => body(from, context ?? '#', nullable)
  );
}

const _enumArm: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(
  (
    from: unknown,
    __self: Converter<ISchemaValidator<JsonValue>, string>,
    context?: string
    /* c8 ignore next 1 - defensive default; jsonSchemaConverter always supplies the path */
  ): Result<ISchemaValidator<JsonValue>> => _convertEnum(from, context ?? '#')
);

// ---------------------------------------------------------------------------
// Type-dispatched converter (non-enum nodes only).
// ---------------------------------------------------------------------------
function _typeDispatch(nullable: boolean): Converter<ISchemaValidator<JsonValue>, string> {
  return Converters.discriminatedObject<ISchemaValidator<JsonValue>, string, string>('type', {
    string: _arm(_convertString, nullable),
    number: _arm(_convertNumber, nullable),
    integer: _arm(_convertInteger, nullable),
    boolean: _arm(_convertBoolean, nullable),
    array: _arm(_convertArray, nullable),
    object: _arm(_convertObject, nullable)
  });
}

const _typeDispatchConverter: Converter<ISchemaValidator<JsonValue>, string> = _typeDispatch(false);
const _nullableTypeDispatchConverter: Converter<ISchemaValidator<JsonValue>, string> = _typeDispatch(true);

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

    // Forbidden keywords: check before dispatching so inputs with no `type` (e.g. just
    // `{ $ref: '...' }`) get a specific error rather than a generic "no matching converter".
    const forbidden = _checkForbidden(raw);
    if (forbidden.isFailure()) {
      return fail(`${path}: ${forbidden.message}`);
    }

    // Enum nodes route directly to the enum arm so that validation failures (invalid enum values,
    // conflicting type) propagate immediately — not through oneOf, which would silently try the
    // type-dispatched arm and produce a confusing "no matching converter" message. That arm owns
    // enum type validation entirely, including the union rule, because an enum's nullability is
    // declared in two places and only it can check that they agree.
    if ('enum' in raw) {
      return _enumArm.convert(from, path);
    }

    // Union type arrays: `[<type>, 'null']` is the nullable spelling and is admitted;
    // anything else gets a better error than discriminatedObject's generic message.
    const split = _splitNullableType(raw.type);
    if (split.isFailure()) {
      return fail(`${path}: ${split.message}`);
    }

    // Missing/unknown type: give a better error than a generic "no matching converter".
    if (split.value.type === undefined || !_SUPPORTED_TYPES.has(split.value.type)) {
      return fail(`${path}: unsupported or missing 'type'`);
    }

    if (split.value.nullable) {
      // `discriminatedObject` dispatches on a scalar `type`, so the union is collapsed for
      // the lookup and the nullability travels in the table choice instead.
      return _nullableTypeDispatchConverter.convert({ ...raw, type: split.value.type }, path);
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
