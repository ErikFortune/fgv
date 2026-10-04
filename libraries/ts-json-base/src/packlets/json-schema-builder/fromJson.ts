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

import { Converter, Converters, Result, captureResult, fail, mapResults, succeed } from '@fgv/ts-utils';
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
  '$dynamicRef',
  '$recursiveRef',
  'allOf',
  'not',
  'if',
  'then',
  'else',
  'pattern'
];

/**
 * Keywords that carry no validation semantics. They may accompany a nullable `anyOf`/`oneOf`
 * wrapper, or sit on its `{ type: 'null' }` branch, without changing what the node accepts.
 * Anything else beside the wrapper is refused rather than guessed at.
 */
const _NON_VALIDATING_KEYWORDS: ReadonlySet<string> = new Set([
  'description',
  'title',
  'default',
  'examples',
  '$comment',
  'deprecated',
  'readOnly',
  'writeOnly',
  '$schema',
  '$defs',
  'definitions'
]);

/**
 * The most `$ref` expansions one conversion may perform. Local references are inlined, so a schema
 * whose definitions reference each other several times over describes a tree that grows
 * exponentially with its nesting; this bound keeps both the conversion and the emitted wire schema
 * finite. Generous for any real tool schema, which expands a handful of definitions.
 */
const MAX_REF_EXPANSIONS: number = 1000;

/** The deepest chain of nested `$ref` expansions one conversion may follow. */
const MAX_REF_DEPTH: number = 32;

/**
 * What a conversion threads through its recursion: where it is, and what `$ref` resolution needs.
 *
 * @remarks
 * `budget` is deliberately shared, not copied, between a node and its children, so that it counts
 * expansions across the whole conversion rather than per branch.
 */
interface IParseContext {
  /** The JSON Pointer path of the node being converted, for error messages. */
  readonly path: string;
  /** The document local references (`#/…`) resolve against. */
  readonly root: unknown;
  /** The `$ref` targets currently being expanded, outermost first, to detect cycles. */
  readonly refs: readonly string[];
  /** Whether a subschema with its own `$id` lies between the root and this node. */
  readonly rebased: boolean;
  /** Expansions performed so far by this conversion. */
  readonly budget: { expansions: number };
}

/** A fresh context for converting `root` as a whole document. */
function _rootContext(root: unknown, path: string): IParseContext {
  return { path, root, refs: [], rebased: false, budget: { expansions: 0 } };
}

/** The same context, moved to a child node. */
function _at(ctx: IParseContext, path: string): IParseContext {
  return { ...ctx, path };
}

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

/** The two union keywords admitted in their nullable spelling. */
type NullableUnionKeyword = 'anyOf' | 'oneOf';

/** Whether a union member is exactly `{ type: 'null' }`, give or take annotations. */
function _isNullBranch(member: unknown): boolean {
  return _plainObjectField
    .convert(member)
    .onSuccess((obj) =>
      succeed(
        obj.type === 'null' &&
          Object.keys(obj).every((key) => key === 'type' || _NON_VALIDATING_KEYWORDS.has(key))
      )
    )
    .orDefault(false);
}

/**
 * Re-emits `node` with `null` admitted and, optionally, a replacement description, then parses the
 * result back.
 *
 * @remarks
 * Goes through the wire form because that is the one representation every node shares: a
 * nullable node is `type: [<t>, 'null']` (plus `null` in the `enum` of an enum node), which is the
 * form `_splitNullableType` and the enum arm already read. A node that already admits `null`
 * keeps its union as it is. Round-tripping through `toJson()` is safe because every node this
 * converter builds re-parses to an equivalent validator — the property the round-trip tests pin.
 */
function _reshape(
  node: ISchemaValidator<JsonValue>,
  path: string,
  nullable: boolean,
  description: string | undefined
): Result<ISchemaValidator<JsonValue>> {
  const json: JsonObject = { ...node.toJson() };
  if (nullable && typeof json.type === 'string') {
    json.type = [json.type, 'null'];
    if (Array.isArray(json.enum)) {
      json.enum = [...json.enum, null];
    }
  }
  if (description !== undefined) {
    json.description = description;
  }
  // The re-emitted form has no references left to resolve, so it is its own document.

  return _convertNode(json, _rootContext(json, path));
}

/**
 * Converts an `anyOf` or `oneOf` node. The only union admitted is exactly one supported schema
 * plus `{ type: 'null' }`, in either order — pydantic's spelling of `Optional[T]` — which is
 * normalized to the nullable form (`type: [<t>, 'null']`) the rest of the subset already models.
 *
 * @remarks
 * For `anyOf` the meaning is "null, or a `T`", which is exactly a nullable `T`. For `oneOf` it is
 * the same **only while `T` itself rejects `null`**: if `T` admits `null` too, a `null` value
 * matches both branches and `oneOf` rejects it, which no nullable node can express — so that case
 * is refused. Every other union (two non-null schemas, more than two members, `anyOf` and `oneOf`
 * together, or a validation keyword beside the union) is refused as before.
 */
function _convertNullableUnion(
  raw: Record<string, unknown>,
  ctx: IParseContext
): Result<ISchemaValidator<JsonValue>> {
  const path = ctx.path;
  if ('anyOf' in raw && 'oneOf' in raw) {
    return fail(`${path}: unsupported JSON Schema keywords 'anyOf' and 'oneOf' on the same node`);
  }
  const keyword: NullableUnionKeyword = 'anyOf' in raw ? 'anyOf' : 'oneOf';
  const unsupported = `${path}: unsupported JSON Schema keyword '${keyword}'`;
  const sibling = Object.keys(raw).find((key) => key !== keyword && !_NON_VALIDATING_KEYWORDS.has(key));
  if (sibling !== undefined) {
    return fail(`${unsupported} alongside '${sibling}'`);
  }
  const members: unknown = raw[keyword];
  const nullIndex: number = Array.isArray(members) ? members.findIndex(_isNullBranch) : -1;
  const valueIndex: number = 1 - nullIndex;
  if (
    !Array.isArray(members) ||
    members.length !== 2 ||
    nullIndex < 0 ||
    _isNullBranch(members[valueIndex])
  ) {
    return fail(`${unsupported} (supported only as exactly one schema plus {"type": "null"})`);
  }
  const memberPath = `${path}/${keyword}/${valueIndex}`;
  return _descriptionField
    .convert(raw)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      _convertNode(members[valueIndex], _at(ctx, memberPath)).onSuccess((inner) =>
        keyword === 'oneOf' && inner.validate(null).isSuccess()
          ? fail(
              `${unsupported}: ${memberPath} also admits null, so exactly-one would reject null, ` +
                `which a nullable schema cannot express`
            )
          : _reshape(inner, path, true, description)
      )
    );
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
  { path }: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  return _descriptionField
    .convert(from)
    .withErrorFormat((msg) => `${path}: ${msg}`)
    .onSuccess((description) =>
      succeed(string(_nodeOpts(description, nullable)) as unknown as ISchemaValidator<JsonValue>)
    );
}

/** Number arm: extracts `description?` and delegates to the `number` factory. */
function _convertNumber(
  from: unknown,
  { path }: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
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
  { path }: IParseContext,
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
  { path }: IParseContext,
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
function _convertArray(
  from: unknown,
  ctx: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  const path = ctx.path;
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
      _convertNode(items, _at(ctx, `${path}/items`)).onSuccess((inner) =>
        succeed(array(inner, _nodeOpts(description, nullable)) as unknown as ISchemaValidator<JsonValue>)
      )
    );
}

/**
 * Object arm — delegates to `_parseObjectBody` for recursive property processing.
 * Receives the current JSON Pointer path via `context`.
 */
function _convertObject(
  from: unknown,
  ctx: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  return _parseObjectBody(from, ctx, nullable);
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
function _convertEnum(from: unknown, { path }: IParseContext): Result<ISchemaValidator<JsonValue>> {
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
  ctx: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  const path = ctx.path;
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
      // Thread the JSON Pointer path as context so nested errors are correctly attributed.
      _convertNode(child, _at(ctx, `${path}/properties/${key}`)).onSuccess((node) =>
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
type ArmBody = (from: unknown, ctx: IParseContext, nullable: boolean) => Result<ISchemaValidator<JsonValue>>;

/**
 * Binds an arm body to a nullability, since `Converters.generic` has no channel for it —
 * its context slot already carries the path. Hence two dispatch tables rather than one:
 * `jsonSchemaConverter` decides nullability from the `type` union and picks the table.
 */
function _arm(body: ArmBody, nullable: boolean): Converter<ISchemaValidator<JsonValue>, IParseContext> {
  return Converters.generic(
    (
      from: unknown,
      __self: Converter<ISchemaValidator<JsonValue>, IParseContext>,
      context?: IParseContext
      /* c8 ignore next 1 - defensive default; _convertNode always supplies the context */
    ): Result<ISchemaValidator<JsonValue>> => body(from, context ?? _rootContext(from, '#'), nullable)
  );
}

// ---------------------------------------------------------------------------
// Type-dispatched converter (non-enum nodes only).
// ---------------------------------------------------------------------------
function _typeDispatch(nullable: boolean): Converter<ISchemaValidator<JsonValue>, IParseContext> {
  return Converters.discriminatedObject<ISchemaValidator<JsonValue>, string, IParseContext>('type', {
    string: _arm(_convertString, nullable),
    number: _arm(_convertNumber, nullable),
    integer: _arm(_convertInteger, nullable),
    boolean: _arm(_convertBoolean, nullable),
    array: _arm(_convertArray, nullable),
    object: _arm(_convertObject, nullable)
  });
}

const _typeDispatchConverter: Converter<ISchemaValidator<JsonValue>, IParseContext> = _typeDispatch(false);
const _nullableTypeDispatchConverter: Converter<ISchemaValidator<JsonValue>, IParseContext> = _typeDispatch(
  true
);

// ---------------------------------------------------------------------------
// Local `$ref` resolution — references are inlined, so the parsed validator and
// its wire schema are reference-free.
// ---------------------------------------------------------------------------

/** Matches a JSON Pointer array index token: `0`, or digits without a leading zero. */
const _ARRAY_INDEX: RegExp = /^(?:0|[1-9][0-9]*)$/;

/**
 * Splits a local reference (`#` or `#/…`) into its decoded JSON Pointer tokens.
 *
 * @remarks
 * The fragment is URI-encoded first and JSON-Pointer-escaped second (RFC 6901 § 6), so tokens
 * are percent-decoded, then `~1` → `/` and `~0` → `~`, in that order. A plain-name fragment
 * (`#foo`, which names an `$anchor`) is refused.
 */
function _pointerTokens(ref: string): Result<string[]> {
  if (ref === '#') {
    return succeed([]);
  }
  if (!ref.startsWith('#/')) {
    return fail('only JSON Pointer fragments (#/…) are supported, not anchors');
  }
  return captureResult(() =>
    ref
      .slice(2)
      .split('/')
      .map((token) => decodeURIComponent(token).replace(/~1/g, '/').replace(/~0/g, '~'))
  ).withErrorFormat((msg) => `malformed reference: ${msg}`);
}

/** The value at one JSON Pointer token below `node`, or `undefined` when there is none. */
function _childAt(node: unknown, token: string): unknown {
  if (Array.isArray(node)) {
    return _ARRAY_INDEX.test(token) ? node[Number(token)] : undefined;
  }
  return _plainObjectField
    .convert(node)
    .onSuccess((obj) => succeed(Object.prototype.hasOwnProperty.call(obj, token) ? obj[token] : undefined))
    .orDefault(undefined);
}

/** Resolves decoded JSON Pointer tokens against `root`. */
function _resolvePointer(root: unknown, tokens: readonly string[]): Result<unknown> {
  let node: unknown = root;
  for (const token of tokens) {
    node = _childAt(node, token);
    if (node === undefined) {
      return fail(`does not resolve: no '${token}'`);
    }
  }
  return succeed(node);
}

/**
 * Converts a `$ref` node by inlining its local target.
 *
 * @remarks
 * Only local references into the document being converted are followed; a remote reference is
 * refused, as is a reference inside a subschema that declares its own `$id` (which would rebase
 * it). Inlining is bounded: a reference back into one already being expanded is a recursive
 * schema, which has no finite inline form and is refused, and `MAX_REF_DEPTH` and
 * `MAX_REF_EXPANSIONS` bound nesting and total size.
 *
 * Siblings of `$ref` may be annotations only. A sibling `description` replaces the target's,
 * which is what pydantic means by it; any validation keyword beside `$ref` is refused, because
 * draft-07 ignores such siblings while later drafts apply them, and the two readings disagree.
 */
function _convertRef(raw: Record<string, unknown>, ctx: IParseContext): Result<ISchemaValidator<JsonValue>> {
  const path = ctx.path;
  const unsupported = `${path}: unsupported JSON Schema keyword '$ref'`;
  const sibling = Object.keys(raw).find((key) => key !== '$ref' && !_NON_VALIDATING_KEYWORDS.has(key));
  if (sibling !== undefined) {
    return fail(`${unsupported} alongside '${sibling}'`);
  }
  const ref: unknown = raw.$ref;
  if (typeof ref !== 'string') {
    return fail(`${unsupported}: the reference must be a string`);
  }
  if (!ref.startsWith('#')) {
    return fail(`${unsupported}: remote reference '${ref}' (only local '#/…' references are supported)`);
  }
  if (ctx.rebased) {
    return fail(`${unsupported}: '${ref}' sits inside a subschema with its own '$id'`);
  }
  return _pointerTokens(ref)
    .withErrorFormat((msg) => `${unsupported}: '${ref}': ${msg}`)
    .onSuccess((tokens) => {
      // Identity is the decoded pointer, so two spellings of one target are one cycle.
      const target = `#${tokens.map((t) => `/${t.replace(/~/g, '~0').replace(/\//g, '~1')}`).join('')}`;
      if (ctx.refs.includes(target)) {
        return fail(`${unsupported}: '${ref}' is recursive, which cannot be inlined`);
      }
      if (ctx.refs.length >= MAX_REF_DEPTH) {
        return fail(`${unsupported}: '${ref}' exceeds the nesting limit of ${MAX_REF_DEPTH} references`);
      }
      if (ctx.budget.expansions >= MAX_REF_EXPANSIONS) {
        return fail(
          `${unsupported}: '${ref}' exceeds the limit of ${MAX_REF_EXPANSIONS} reference expansions`
        );
      }
      ctx.budget.expansions += 1;
      return _resolvePointer(ctx.root, tokens)
        .withErrorFormat((msg) => `${unsupported}: '${ref}' ${msg}`)
        .onSuccess((resolved) =>
          _descriptionField
            .convert(raw)
            .withErrorFormat((msg) => `${path}: ${msg}`)
            .onSuccess((description) =>
              _convertNode(resolved, { ...ctx, path: target, refs: [...ctx.refs, target] })
                .withErrorFormat((msg) => `${path}: via '$ref' '${ref}': ${msg}`)
                .onSuccess((node) =>
                  description === undefined ? succeed(node) : _reshape(node, path, false, description)
                )
            )
        );
    });
}

/**
 * Converts one schema node: pre-flight checks (non-object node, nullable `anyOf`/`oneOf`, local
 * `$ref`, forbidden keywords, union type arrays, unknown types), then dispatch to the per-type
 * arm converters, which recurse through here for their sub-schemas.
 */
function _convertNode(from: unknown, nodeCtx: IParseContext): Result<ISchemaValidator<JsonValue>> {
  const path = nodeCtx.path;

  // Guard: every node must be a non-array object.
  if (typeof from !== 'object' || Array.isArray(from) || from === null) {
    return fail(`${path}: expected a JSON Schema object`);
  }
  const raw = from as Record<string, unknown>;

  // A nested `$id` rebases the references beneath it; those are refused rather than resolved
  // against the wrong document (see `_convertRef`).
  const ctx: IParseContext = from !== nodeCtx.root && '$id' in raw ? { ...nodeCtx, rebased: true } : nodeCtx;

  // A union is admitted only in its nullable spelling; its handler refuses everything else
  // with the keyword and path named, like the forbidden-keyword check below.
  if ('anyOf' in raw || 'oneOf' in raw) {
    return _convertNullableUnion(raw, ctx);
  }

  if ('$ref' in raw) {
    return _convertRef(raw, ctx);
  }

  // Forbidden keywords: check before dispatching so inputs with no `type` (e.g. just
  // `{ allOf: [...] }`) get a specific error rather than a generic "no matching converter".
  const forbidden = _checkForbidden(raw);
  if (forbidden.isFailure()) {
    return fail(`${path}: ${forbidden.message}`);
  }

  // Enum nodes route directly to the enum arm so that validation failures (invalid enum values,
  // conflicting type) propagate immediately — not through a fallback that would try the
  // type-dispatched arm and produce a confusing "no matching converter" message. That arm owns
  // enum type validation entirely, including the union rule, because an enum's nullability is
  // declared in two places and only it can check that they agree.
  if ('enum' in raw) {
    return _convertEnum(from, ctx);
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
    return _nullableTypeDispatchConverter.convert({ ...raw, type: split.value.type }, ctx);
  }
  return _typeDispatchConverter.convert(from, ctx);
}

/**
 * The main converter. Parses a raw JSON Schema object into a typed schema validator
 * for the LLM-tool subset.
 *
 * @remarks
 * Performs pre-flight checks (non-object root, nullable `anyOf`/`oneOf`, local `$ref`, union type
 * arrays, forbidden keywords, unknown types) before dispatching to the per-type arm converters.
 *
 * The conversion context (`TC = string`) carries the JSON Pointer path of the value being
 * converted, so that error messages from nested nodes name the actual failing node (e.g.
 * `#/properties/config/properties/inner: 'required' key '...'`) rather than always
 * reporting `#:`. The context defaults to `'#'` when absent (top-level call).
 *
 * The value converted is the document: local references (`#/$defs/…`, `#/definitions/…`, or any
 * other `#/…` pointer) resolve against it, and are inlined.
 *
 * @public
 */
export const jsonSchemaConverter: Converter<ISchemaValidator<JsonValue>, string> = Converters.generic(
  (
    from: unknown,
    __self: Converter<ISchemaValidator<JsonValue>, string>,
    context?: string
  ): Result<ISchemaValidator<JsonValue>> => _convertNode(from, _rootContext(from, context ?? '#'))
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
 * Nullability is read in both of its spellings: `type: [<t>, 'null']`, and an `anyOf` / `oneOf` of
 * exactly one supported schema plus `{ type: 'null' }` (pydantic's `Optional[T]`). The second is
 * normalized to the first, so `toJson()` always emits the type union. Every other union is refused.
 *
 * Local references (`$ref` to `#/$defs/…`, `#/definitions/…` or any other `#/…` pointer into the
 * same document) are resolved by inlining, so `toJson()` emits a reference-free schema. Remote
 * references, recursive schemas (which have no finite inline form) and expansions beyond fixed
 * depth and size bounds are refused.
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
