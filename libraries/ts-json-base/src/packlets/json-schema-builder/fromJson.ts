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

import {
  Converter,
  Converters,
  Result,
  Validators,
  captureResult,
  fail,
  mapResults,
  succeed
} from '@fgv/ts-utils';
import { JsonObject, JsonValue, isJsonObject } from '../json';
import {
  NumberConstraints,
  SchemaAnnotations,
  StringConstraints,
  annotationFields,
  annotationsConverter,
  numberConstraintsConverter,
  stringConstraintsConverter
} from './constraints';
import {
  anyValue,
  array,
  boolean,
  booleanEnumOf,
  enumOf,
  integer,
  integerEnumOf,
  number,
  numberEnumOf,
  object,
  optional,
  record,
  string
} from './factories';
import {
  schemaAnnotationKeywords,
  schemaLengthConstraintKeywords,
  schemaNumberConstraintKeywords
} from './keywordAdaptation';
import { INumberSchemaOptions } from './options';
import {
  ValidatedSchemaOptions,
  integerOptions,
  numberOptions,
  schemaOptions,
  stringOptions
} from './validatedOptions';
import { ILlmProperties, ISchemaValidator } from './types';

/**
 * Compositional / assertive keywords outside the LLM-tool subset. Their presence cannot be honored
 * faithfully — silently dropping them would produce a converter looser than the schema describes.
 *
 * Constraint keywords are carried rather than refused: `minimum`, `maximum`, `exclusiveMinimum`,
 * `exclusiveMaximum` and `multipleOf` on a number or integer node, and `minLength` and `maxLength` on
 * a string node, are enforced by the derived validator and emitted by `toJson()`. The annotations
 * `description`, `title`, `default` and `examples` (every node) and `format` (string nodes) are
 * emitted and never enforced. A keyword on a node kind it does not apply to (`minimum` on a string)
 * constrains nothing under JSON Schema and is not emitted.
 *
 * A scalar `const` is carried as a single-value enum of its type, and enforced. `pattern` is refused
 * because enforcing it would run a server-supplied regular expression on a backtracking engine
 * against model-supplied strings (see `docs/FUTURE.md`).
 *
 * The list is still not complete against the rule above: object-key keywords beside an open object
 * (`patternProperties`, `propertyNames`, …) and array keywords (`minItems`, `prefixItems`,
 * `contains`, …) are accepted and ignored, so for them the converter is looser than the schema.
 * Tracked in `docs/TECH_DEBT.md`.
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
 * wrapper (or sit on its `{ type: 'null' }` branch) or a `$ref`, without changing what the node
 * accepts; a node made only of them is `{}`, the schema every value matches. Anything else beside
 * a wrapper or a `$ref` is refused rather than guessed at.
 */
const _NON_VALIDATING_KEYWORDS: ReadonlySet<string> = new Set([
  'description',
  // `format` is an annotation too, but it applies only to strings, so it is not admitted beside a
  // wrapper or a `$ref` whose target need not be one.
  ...schemaAnnotationKeywords.filter((keyword) => keyword !== 'format'),
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
 * The most schema nodes one conversion may build, counting the re-conversions `_reshape` performs.
 * `MAX_REF_EXPANSIONS` alone counts references, not what each inlines, so a wide definition
 * referenced many times could still describe millions of nodes from a small payload. Far above
 * any real tool schema, which has tens to hundreds of nodes.
 */
const MAX_SCHEMA_NODES: number = 100000;

/**
 * The deepest a schema may nest, counting every level of `items`, `properties`,
 * `additionalProperties`, union branches and `$ref` expansions from the root (depth 0). The
 * conversion recurses once per level, so a server-supplied chain thousands deep would otherwise
 * exhaust the stack, which `MAX_SCHEMA_NODES` does not prevent; this keeps it well below where
 * that happens. Far deeper than any real tool schema.
 */
const MAX_SCHEMA_DEPTH: number = 128;

/** The most characters of a server-supplied reference echoed back in an error message. */
const MAX_ECHOED_REF_LENGTH: number = 120;

/**
 * Object keywords that constrain a record's key set, which a record converter would otherwise
 * ignore: which keys the value schema governs (`patternProperties`, `unevaluatedProperties`), what a
 * key may be (`propertyNames`), which keys require others (`dependentRequired`, `dependentSchemas`,
 * draft-07 `dependencies`), and how many keys there may be (`minProperties`, `maxProperties`). A
 * record carrying one would be looser than its source, so it is refused instead.
 */
const RECORD_KEY_KEYWORDS: readonly string[] = [
  'patternProperties',
  'propertyNames',
  'unevaluatedProperties',
  'dependentRequired',
  'dependentSchemas',
  'dependencies',
  'minProperties',
  'maxProperties'
];

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
  /** How many levels below the document root this node sits, `$ref` expansions included. */
  readonly depth: number;
  /** Reference expansions and schema nodes built so far by this conversion. */
  readonly budget: { expansions: number; nodes: number };
}

/** A fresh context for converting `root` as a whole document. */
function _rootContext(
  root: unknown,
  path: string,
  budget: { expansions: number; nodes: number } = { expansions: 0, nodes: 0 },
  depth: number = 0
): IParseContext {
  return { path, root, refs: [], rebased: false, depth, budget };
}

/** The same context, moved one level down to a child node. */
function _at(ctx: IParseContext, path: string): IParseContext {
  return { ...ctx, path, depth: ctx.depth + 1 };
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
 * The annotations every node carries, as `annotationsConverter` reads them, with a failure message
 * made printable — it quotes the offending value, which is server-supplied.
 */
const _annotationsField: Converter<SchemaAnnotations> = annotationsConverter.withFormattedError(
  (__from, message) => _printable(`${message}`)
);

/**
 * A number node's constraint keywords, as `numberConstraintsConverter` reads them. Coherence is
 * checked afterwards by `numberOptions` or `integerOptions`, the validated-options step every
 * declared range goes through too.
 */
const _numberConstraintsField: Converter<NumberConstraints> = numberConstraintsConverter.withFormattedError(
  (__from, message) => _printable(`${message}`)
);

/**
 * A string node's `minLength`, `maxLength` and `format`, as `stringConstraintsConverter` reads
 * them; `stringOptions` then requires non-negative integers in order.
 */
const _stringConstraintsField: Converter<StringConstraints> = stringConstraintsConverter.withFormattedError(
  (__from, message) => _printable(`${message}`)
);

/** A scalar an `enum` or `const` may list: a string, number or boolean — or `null`. */
// `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
// `JsonPrimitive` takes in this package's `json` packlet.
// eslint-disable-next-line @rushstack/no-new-null
type EnumMember = string | number | boolean | null;

/**
 * Extracts an `enum` list: an array of strings, numbers, booleans or `null`.
 *
 * @remarks
 * A nullable enum emitted by this package carries `null` in **both** `type` and `enum`,
 * because a reader consulting only one of them would otherwise disagree with a reader
 * consulting the other. This converter is what lets the `null` member through so the
 * enum arm can strip it and set nullability. Whether the remaining members share one type, and
 * whether that type agrees with `type`, is the arm's to judge.
 */
const _enumRawValuesField: Converter<EnumMember[]> = Converters.field(
  'enum',
  Converters.arrayOf(
    Converters.oneOf<EnumMember>([
      Converters.string,
      Validators.isA('number', (v): v is number => typeof v === 'number'),
      Validators.boolean,
      Converters.literal(null)
    ])
  )
).withFormattedError(() => "'enum' must be an array of strings, numbers, booleans or null");

/**
 * Checks that the input is a non-null, non-array object and returns it as
 * `Record<string, unknown>`. This is a safe narrowing after explicit runtime guards —
 * not an unsafe cast.
 */
const _plainObjectField: Converter<Record<string, unknown>> = Converters.generic(
  (v: unknown): Result<Record<string, unknown>> => (isJsonObject(v) ? succeed(v) : fail('expected an object'))
);

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Whether a node carries no keyword beyond annotations — `{}`, the schema every value matches. */
function _isAnySchema(raw: Record<string, unknown>): boolean {
  return Object.keys(raw).every((key) => _NON_VALIDATING_KEYWORDS.has(key));
}

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

/** Converts a node's annotations and nullability into `ISchemaOptions` form. */
function _nodeOpts(
  annotations: SchemaAnnotations,
  nullable: boolean
): SchemaAnnotations & { nullable?: true } {
  return { ...annotations, ...(nullable && { nullable: true as const }) };
}

/**
 * A node's annotations and nullability as validated options, for the factories that take them.
 *
 * @remarks
 * The annotations were already converted by `_annotationsField`, which runs the same JSON check, so
 * the factory-side check cannot fail here; its `Failure` is passed through unformatted rather than
 * given a path it will never need.
 */
function _validatedNodeOpts(
  annotations: SchemaAnnotations,
  nullable: boolean
): Result<ValidatedSchemaOptions<SchemaAnnotations & { nullable?: true }>> {
  return schemaOptions(_nodeOpts(annotations, nullable));
}

/** Whether any annotation is present, i.e. whether a wrapper or `$ref` sibling overrides any. */
function _hasAnnotations(annotations: SchemaAnnotations): boolean {
  return Object.keys(annotations).length > 0;
}

/** A node's annotations, with a failure naming the path. */
function _annotationsAt(from: unknown, path: string): Result<SchemaAnnotations> {
  return _annotationsField.convert(from).withErrorFormat((msg) => `${path}: ${msg}`);
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
 * Re-emits `node` with `null` admitted and, optionally, replacement annotations, then parses the
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
  { path, budget, depth }: IParseContext,
  nullable: boolean,
  annotations: SchemaAnnotations
): Result<ISchemaValidator<JsonValue>> {
  const json: JsonObject = { ...node.toJson() };
  if (nullable && typeof json.type === 'string') {
    json.type = [json.type, 'null'];
    if (Array.isArray(json.enum)) {
      json.enum = [...json.enum, null];
    }
  }
  // Each annotation present on the wrapper (or beside the `$ref`) replaces the inner node's; an
  // absent one leaves the inner node's in place.
  for (const [key, value] of Object.entries(annotationFields(annotations))) {
    json[key] = value;
  }
  // The re-emitted form has no references left to resolve, so it is its own document; it still
  // draws on the conversion's node budget and starts at this node's depth, since re-parsing a
  // subtree is work, and recursion, like any other.
  return _convertNode(json, _rootContext(json, path, budget, depth));
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
    return fail(`${unsupported} alongside '${_echo(sibling)}'`);
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
  return _annotationsAt(raw, path).onSuccess((annotations) =>
    _convertNode(members[valueIndex], _at(ctx, memberPath)).onSuccess((inner) =>
      keyword === 'oneOf' && inner.validate(null).isSuccess()
        ? fail(
            `${unsupported}: ${memberPath} also admits null, so exactly-one would reject null, ` +
              `which a nullable schema cannot express`
          )
        : _reshape(inner, ctx, true, annotations)
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
// Arms are typed as `Converter<ISchemaValidator<JsonValue>, IParseContext>`, whose
// context carries the current JSON Pointer path and what `$ref` resolution needs.
// `discriminatedObject` threads the context through to each arm automatically.
// ---------------------------------------------------------------------------

/**
 * String arm: extracts the annotations, `minLength`, `maxLength` and `format`, checks them as the
 * `string` factory does, and delegates to it.
 */
function _convertString(
  from: unknown,
  { path }: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  return _annotationsAt(from, path).onSuccess((annotations) =>
    _stringConstraintsField
      .convert(from)
      .onSuccess((constraints) => stringOptions({ ...constraints, ..._nodeOpts(annotations, nullable) }))
      .withErrorFormat((msg) => `${path}: ${msg}`)
      .onSuccess((opts) => succeed(string(opts) as unknown as ISchemaValidator<JsonValue>))
  );
}

/**
 * The unchecked options for a `number` or `integer` node: its annotations and range keywords, with
 * failures naming the path. The arm checks them through `numberOptions` or `integerOptions`.
 */
function _numberOpts(from: unknown, path: string, nullable: boolean): Result<INumberSchemaOptions> {
  return _annotationsAt(from, path).onSuccess((annotations) =>
    _numberConstraintsField
      .convert(from)
      .withErrorFormat((msg) => `${path}: ${msg}`)
      .onSuccess((constraints) => succeed({ ...constraints, ..._nodeOpts(annotations, nullable) }))
  );
}

/** Number arm: extracts and checks the node's options and delegates to the `number` factory. */
function _convertNumber(
  from: unknown,
  { path }: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  return _numberOpts(from, path, nullable).onSuccess((opts) =>
    numberOptions(opts)
      .withErrorFormat((msg) => `${path}: ${msg}`)
      .onSuccess((checked) => succeed(number(checked) as unknown as ISchemaValidator<JsonValue>))
  );
}

/** Integer arm: extracts and checks the node's options and delegates to the `integer` factory. */
function _convertInteger(
  from: unknown,
  { path }: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  return _numberOpts(from, path, nullable).onSuccess((opts) =>
    integerOptions(opts)
      .withErrorFormat((msg) => `${path}: ${msg}`)
      .onSuccess((checked) => succeed(integer(checked) as unknown as ISchemaValidator<JsonValue>))
  );
}

/** Boolean arm: extracts the annotations and delegates to the `boolean` factory. */
function _convertBoolean(
  from: unknown,
  { path }: IParseContext,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  return _annotationsAt(from, path).onSuccess((annotations) =>
    _validatedNodeOpts(annotations, nullable).onSuccess((opts) =>
      succeed(boolean(opts) as unknown as ISchemaValidator<JsonValue>)
    )
  );
}

/**
 * Array arm — uses `Converters.field` to extract `items` as a raw unknown value (no cast),
 * then recurses for the `items` sub-schema via `_convertNode`.
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

  return _annotationsAt(from, path).onSuccess((annotations) =>
    _convertNode(items, _at(ctx, `${path}/items`)).onSuccess((inner) =>
      _validatedNodeOpts(annotations, nullable).onSuccess((opts) =>
        succeed(array(inner, opts) as unknown as ISchemaValidator<JsonValue>)
      )
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

/** The JSON type every member of an enum shares, before `type` refines a number to an integer. */
type EnumMemberType = 'string' | 'number' | 'boolean';

/** The JSON type of one enum member. */
function _memberType(value: string | number | boolean): EnumMemberType {
  if (typeof value === 'string') {
    return 'string';
  }
  return typeof value === 'number' ? 'number' : 'boolean';
}

/** The type every member of a non-empty list shares, or `undefined` when they mix types. */
function _sharedMemberType(
  values: readonly [string | number | boolean, ...(string | number | boolean)[]]
): EnumMemberType | undefined {
  const first = _memberType(values[0]);
  return values.every((value) => _memberType(value) === first) ? first : undefined;
}

/** Whether a declared `type` admits members of `memberType`. */
function _typeAdmits(type: string, memberType: EnumMemberType): boolean {
  return type === memberType || (type === 'integer' && memberType === 'number');
}

/**
 * Builds the enum node for checked members: a string, number, integer or boolean enum. The numeric
 * and boolean factories re-check the members against the node type (finite numbers, integers for
 * `integer`) and return a `Failure`, which is given the path.
 */
function _buildEnum(
  type: string,
  members: ReadonlyArray<string | number | boolean>,
  annotations: SchemaAnnotations,
  nullable: boolean,
  path: string
): Result<ISchemaValidator<JsonValue>> {
  const opts = _nodeOpts(annotations, nullable);
  const strings = members.filter((v): v is string => typeof v === 'string');
  const numbers = members.filter((v): v is number => typeof v === 'number');
  const booleans = members.filter((v): v is boolean => typeof v === 'boolean');
  switch (type) {
    case 'string':
      return _validatedNodeOpts(annotations, nullable).onSuccess((validated) =>
        succeed(enumOf(strings, validated) as unknown as ISchemaValidator<JsonValue>)
      );
    case 'number':
    case 'integer':
      return (type === 'integer' ? integerEnumOf(numbers, opts) : numberEnumOf(numbers, opts))
        .withErrorFormat((msg) => `${path}: ${msg}`)
        .onSuccess((node) => succeed(node as unknown as ISchemaValidator<JsonValue>));
    default:
      return booleanEnumOf(booleans, opts).onSuccess((node) =>
        succeed(node as unknown as ISchemaValidator<JsonValue>)
      );
  }
}

/**
 * Enum arm — a closed set of strings, numbers or booleans, all of one type.
 *
 * @remarks
 * The members must share one JSON type (`[1, 'a']` is refused), and a declared `type` must admit
 * it: `string` for strings, `number` or `integer` for numbers (every member an integer for
 * `integer`), `boolean` for booleans. With no `type`, the members' type is used, and a numeric enum
 * is a `number` enum. A union `type` is admitted only as `[<type>, 'null']`, and only when `null`
 * is also among the members, since the node carries its nullability in both.
 *
 * An enum node carries no constraint: a length keyword beside it is refused, and so is a numeric
 * constraint beside a numeric enum, because dropping either would accept a member the schema
 * rejects. `format` beside a string enum is dropped.
 *
 * `keyword` names what the source said — `enum`, or a `const` the caller rewrote into a
 * single-member list — so a refusal names the keyword the server actually sent.
 */
function _convertEnum(
  from: Record<string, unknown>,
  { path }: IParseContext,
  keyword: 'enum' | 'const' = 'enum'
): Result<ISchemaValidator<JsonValue>> {
  const rawValuesResult = _enumRawValuesField.convert(from);
  if (rawValuesResult.isFailure()) {
    return fail(`${path}: ${rawValuesResult.message}`);
  }
  // An enum node carries its nullability in TWO places — `null` among the values and
  // `'null'` in the type union — so this arm reads both and requires them to agree,
  // rather than taking whichever it happens to look at first.
  const nullInValues: boolean = rawValuesResult.value.includes(null);
  const members = rawValuesResult.value.filter((v): v is string | number | boolean => v !== null);
  const [first, ...others] = members;
  if (first === undefined) {
    return fail(`${path}: 'enum' must be a non-empty array`);
  }
  const memberType = _sharedMemberType([first, ...others]);
  if (memberType === undefined) {
    return fail(`${path}: '${keyword}' values must all be of one type (strings, numbers or booleans)`);
  }

  const lengthKeyword = schemaLengthConstraintKeywords.find((k) => k in from);
  if (lengthKeyword !== undefined) {
    return fail(`${path}: unsupported JSON Schema keyword '${lengthKeyword}' beside '${keyword}'`);
  }
  const numberKeyword =
    memberType === 'number' ? schemaNumberConstraintKeywords.find((k) => k in from) : undefined;
  if (numberKeyword !== undefined) {
    return fail(`${path}: unsupported JSON Schema keyword '${numberKeyword}' beside '${keyword}'`);
  }

  // For enum nodes, `_convertNode`'s type pre-flight is skipped (the `!('enum' in raw)` gate), so
  // the type is validated here.
  const rawType: unknown = from.type;
  const split = _splitNullableType(rawType);
  if (split.isFailure()) {
    return fail(`${path}: ${split.message}`);
  }
  if (rawType !== undefined && split.value.type === undefined) {
    // e.g. type: 123 — the field exists but is not a string or a supported union.
    return fail(`${path}: enum schema 'type' field must be a string or absent`);
  }
  const declared: string = split.value.type ?? memberType;
  if (!_typeAdmits(declared, memberType)) {
    return fail(
      `${path}: enum schema declares conflicting 'type' '${_echo(declared)}' for ${memberType} values`
    );
  }
  if (split.value.nullable !== nullInValues) {
    return fail(
      `${path}: enum schema is nullable in its '${split.value.nullable ? 'type' : 'enum'}' but not its ` +
        `'${split.value.nullable ? 'enum' : 'type'}'`
    );
  }

  return _annotationsAt(from, path).onSuccess((annotations) =>
    _buildEnum(declared, members, annotations, nullInValues, path)
  );
}

/**
 * Const arm — a scalar `const` is the single-value enum of its type, and is enforced.
 *
 * @remarks
 * Rewritten into `enum: [value]` and converted by the enum arm, so every rule there applies: a
 * `type` must admit the value (`const: 'a'` beside `type: 'number'`, or `const: 1.5` beside
 * `type: 'integer'`, is refused), and a constraint keyword beside it is refused. `toJson()` emits
 * the enum spelling, which more provider wires accept than `const`.
 *
 * Refused: an object, array or `null` value (no node models one); `const` beside `enum`; and a
 * nullable `type` union, since the value excludes `null` and the node would carry a nullability
 * nothing could reach.
 */
function _convertConst(
  from: Record<string, unknown>,
  ctx: IParseContext
): Result<ISchemaValidator<JsonValue>> {
  const path = ctx.path;
  // A rest destructure copies own keys as data, so an own `__proto__` key cannot become a prototype.
  const { const: value, ...rest } = from;
  if ('enum' in from) {
    return fail(`${path}: unsupported JSON Schema keyword 'const' beside 'enum'`);
  }
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return fail(`${path}: 'const' is supported only with a string, number or boolean value`);
  }
  if (Array.isArray(from.type)) {
    return fail(`${path}: 'const' beside a union 'type' is not supported`);
  }
  return _convertEnum({ ...rest, enum: [value] }, ctx, 'const');
}

/**
 * Parses the body of an `object`-type schema using field converters, then recurses into
 * property sub-schemas via `_convertNode`.
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

  // Extract `additionalProperties` — a boolean or a schema if present.
  const addlPropsResult = Converters.optionalField(
    'additionalProperties',
    Converters.oneOf<boolean | Record<string, unknown>>([Converters.boolean, _plainObjectField])
  ).convert(from);
  if (addlPropsResult.isFailure()) {
    return fail(`${path}: 'additionalProperties' must be a boolean or a schema object`);
  }
  const additionalProperties = addlPropsResult.value;
  // `{}` (or annotations only) is the schema every value matches, so it means what `true` does.
  const valueSchema: Record<string, unknown> | undefined =
    typeof additionalProperties === 'object' && !_isAnySchema(additionalProperties)
      ? additionalProperties
      : undefined;

  // Extract the annotations; a present one of the wrong shape is refused.
  return _annotationsAt(from, path).onSuccess((annotations) => {
    const requiredSet = new Set<string>(rawRequired ?? []);
    const propEntries: [string, unknown][] = rawProps !== undefined ? Object.entries(rawProps) : [];

    // A property named `__proto__` cannot be held as an ordinary key by the object machinery
    // downstream (assignment sets the prototype instead), so it would silently lose its schema and
    // any requirement on it. Refused rather than dropped.
    if (propEntries.some(([key]) => key === '__proto__')) {
      return fail(`${path}: a property named '__proto__' is not supported`);
    }

    // Reject `required` keys with no matching property schema.
    const declared = new Set(propEntries.map(([k]) => k));
    for (const key of requiredSet) {
      if (!declared.has(key)) {
        return fail(`${path}: 'required' key '${_echo(key)}' has no matching entry in 'properties'`);
      }
    }

    if (valueSchema !== undefined) {
      return _parseRecordBody(from, valueSchema, propEntries.length > 0, ctx, annotations, nullable);
    }

    return mapResults(
      propEntries.map(([key, child]) =>
        // Thread the JSON Pointer path as context so nested errors are correctly attributed.
        _convertNode(child, _at(ctx, `${path}/properties/${_printable(_escapeToken(key))}`)).onSuccess(
          (node) => succeed([key, requiredSet.has(key) ? node : optional(node)] as const)
        )
      )
    ).onSuccess((built) => {
      const properties: ILlmProperties = {};
      for (const [key, node] of built) {
        properties[key] = node;
      }
      return schemaOptions({
        // JSON Schema's default (absent additionalProperties) permits extra fields;
        // only an explicit `false` produces a strict validator.
        additionalProperties: additionalProperties !== false,
        ..._nodeOpts(annotations, nullable)
      }).onSuccess((opts) => succeed(object(properties, opts) as unknown as ISchemaValidator<JsonValue>));
    });
  });
}

/**
 * Converts an object whose `additionalProperties` is a schema into a record: every property's value
 * must match that schema, and `toJson()` states it as `additionalProperties: <schema>`.
 *
 * @remarks
 * Not every provider receives that statement. The Gemini and Ollama formats in `@fgv/ts-extras`
 * strip `additionalProperties`, so those providers see an unconstrained object and the model is
 * not told the value type. The arguments are still validated against the full schema at call time
 * (`executeClientToolTurn` validates before `execute`), so a wrong value comes back to the model as
 * a tool error it can correct rather than reaching the tool.
 *
 * Only the map shape is admitted — no declared properties beside the value schema. Declared
 * properties plus a schema for the rest (zod `.catchall()`) would need the builder to type both at
 * once, and is refused with that reason rather than half-honoured.
 */
function _parseRecordBody(
  from: unknown,
  valueSchema: Record<string, unknown>,
  hasDeclaredProperties: boolean,
  ctx: IParseContext,
  annotations: SchemaAnnotations,
  nullable: boolean
): Result<ISchemaValidator<JsonValue>> {
  const keyKeyword = _plainObjectField
    .convert(from)
    .onSuccess((obj) => succeed(RECORD_KEY_KEYWORDS.find((keyword) => keyword in obj)))
    .orDefault(undefined);
  if (keyKeyword !== undefined) {
    return fail(
      `${ctx.path}: unsupported JSON Schema keyword '${keyKeyword}' beside a schema-valued 'additionalProperties'`
    );
  }
  if (hasDeclaredProperties) {
    return fail(
      `${ctx.path}: schema-valued 'additionalProperties' alongside declared 'properties' is not supported`
    );
  }
  return _convertNode(valueSchema, _at(ctx, `${ctx.path}/additionalProperties`)).onSuccess((values) =>
    _validatedNodeOpts(annotations, nullable).onSuccess((opts) =>
      succeed(record(values, opts) as unknown as ISchemaValidator<JsonValue>)
    )
  );
}

// ---------------------------------------------------------------------------
// Arm converter instances (built once, referenced by _convertNode's dispatch).
// Typed as `Converter<ISchemaValidator<JsonValue>, IParseContext>` so the parse
// context flows from _convertNode through discriminatedObject to each arm.
// ---------------------------------------------------------------------------

/** Arm body: the raw node, its parse context, and whether its `type` union carried `null`. */
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

/** Matches a `~` that does not begin a valid RFC 6901 escape (`~0` or `~1`). */
const _INVALID_ESCAPE: RegExp = /~(?![01])/;

/** Matches a JSON Pointer array index token: `0`, or digits without a leading zero. */
const _ARRAY_INDEX: RegExp = /^(?:0|[1-9][0-9]*)$/;

/**
 * Splits a local reference (`#` or `#/…`) into its decoded JSON Pointer tokens.
 *
 * @remarks
 * A URI fragment holds a JSON Pointer in URI-encoded form (RFC 6901 § 6), so the whole fragment is
 * percent-decoded first and only then split on `/` — `#/$defs/a%2Fb` is the pointer `/$defs/a/b`.
 * Each token is then unescaped `~1` → `/` before `~0` → `~` (§ 4), so `~01` is the literal `~1`. A
 * plain-name fragment (`#foo`, which names an `$anchor`) is refused.
 */
function _pointerTokens(ref: string): Result<string[]> {
  return captureResult(() => decodeURIComponent(ref.slice(1)))
    .withErrorFormat((msg) => `malformed reference: ${msg}`)
    .onSuccess((pointer) => {
      if (pointer === '') {
        return succeed([]);
      }
      if (!pointer.startsWith('/')) {
        return fail('only JSON Pointer fragments (#/…) are supported, not anchors');
      }
      const tokens = pointer.slice(1).split('/');
      // RFC 6901 allows `~` only as `~0` or `~1`; anything else is not a pointer, and guessing a
      // meaning for it could resolve a different node than the server intended.
      return tokens.some((token) => _INVALID_ESCAPE.test(token))
        ? fail("malformed reference: invalid '~' escape")
        : succeed(tokens.map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~')));
    });
}

/** Escapes a key as one JSON Pointer token (RFC 6901 § 3): `~` → `~0` first, then `/` → `~1`. */
function _escapeToken(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * One character, with a control character spelled `\uXXXX`: C0, DEL, C1, and the line and
 * paragraph separators U+2028/U+2029. A server-supplied string echoed raw could otherwise break a
 * log line, forge a new one, or drive a terminal.
 */
function _escapeChar(ch: string): string {
  const code = ch.charCodeAt(0);
  const control = code < 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029;
  return control ? `\\u${code.toString(16).padStart(4, '0')}` : ch;
}

/** A server-supplied string with every control character escaped (see `_escapeChar`). */
function _printable(value: string): string {
  return Array.from(value, _escapeChar).join('');
}

/**
 * A server-supplied string made safe to echo in an error message: control characters escaped, then
 * cut to `MAX_ECHOED_REF_LENGTH`. The cut is made between escaped characters, so it never splits an
 * escape sequence or a surrogate pair.
 */
function _echo(value: string): string {
  let out = '';
  for (const piece of Array.from(value, _escapeChar)) {
    if (out.length + piece.length > MAX_ECHOED_REF_LENGTH) {
      return `${out}…`;
    }
    out += piece;
  }
  return out;
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

/** Whether a node is a schema object declaring its own `$id`. */
function _hasId(node: unknown): boolean {
  return _plainObjectField
    .convert(node)
    .onSuccess((obj) => succeed('$id' in obj))
    .orDefault(false);
}

/**
 * Resolves decoded JSON Pointer tokens against `root`.
 *
 * @remarks
 * A pointer that passes *through* a subschema declaring its own `$id` reaches a target whose own
 * references are relative to that subschema, not to the document; it is refused. (A target that
 * itself declares `$id` is caught by `_convertNode`, which marks its context rebased.)
 */
function _resolvePointer(root: unknown, tokens: readonly string[]): Result<unknown> {
  let node: unknown = root;
  for (const [index, token] of tokens.entries()) {
    if (index > 0 && _hasId(node)) {
      return fail(`passes through a subschema with its own '$id'`);
    }
    node = _childAt(node, token);
    if (node === undefined) {
      return fail(`does not resolve: no '${_echo(token)}'`);
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
 * Siblings of `$ref` may be annotations only. A sibling `description`, `title`, `default` or
 * `examples` replaces the target's of the same name, which is what pydantic means by it; any
 * validation keyword beside `$ref` is refused, because draft-07 ignores such siblings while later
 * drafts apply them, and the two readings disagree. `format` is refused there too: it applies only
 * to strings, and the target need not be one.
 */
function _convertRef(raw: Record<string, unknown>, ctx: IParseContext): Result<ISchemaValidator<JsonValue>> {
  const path = ctx.path;
  const unsupported = `${path}: unsupported JSON Schema keyword '$ref'`;
  // A root `$id` names the document the references already resolve against, so it is harmless.
  const sibling = Object.keys(raw).find(
    (key) => key !== '$ref' && !_NON_VALIDATING_KEYWORDS.has(key) && !(key === '$id' && raw === ctx.root)
  );
  if (sibling !== undefined) {
    return fail(`${unsupported} alongside '${_echo(sibling)}'`);
  }
  const ref: unknown = raw.$ref;
  if (typeof ref !== 'string') {
    return fail(`${unsupported}: the reference must be a string`);
  }
  const shown = _echo(ref);
  if (!ref.startsWith('#')) {
    return fail(`${unsupported}: remote reference '${shown}' (only local '#/…' references are supported)`);
  }
  if (ctx.rebased) {
    return fail(`${unsupported}: '${shown}' sits inside a subschema with its own '$id'`);
  }
  return _pointerTokens(ref)
    .withErrorFormat((msg) => `${unsupported}: '${shown}': ${msg}`)
    .onSuccess((tokens) => {
      // Identity is the decoded pointer, so two spellings of one target are one cycle.
      const target = `#${tokens.map((t) => `/${_escapeToken(t)}`).join('')}`;
      if (ctx.refs.includes(target)) {
        return fail(`${unsupported}: '${shown}' is recursive, which cannot be inlined`);
      }
      if (ctx.refs.length >= MAX_REF_DEPTH) {
        return fail(`${unsupported}: '${shown}' exceeds the nesting limit of ${MAX_REF_DEPTH} references`);
      }
      if (ctx.budget.expansions >= MAX_REF_EXPANSIONS) {
        return fail(
          `${unsupported}: '${shown}' exceeds the limit of ${MAX_REF_EXPANSIONS} reference expansions`
        );
      }
      ctx.budget.expansions += 1;
      return _resolvePointer(ctx.root, tokens)
        .withErrorFormat((msg) => `${unsupported}: '${shown}' ${msg}`)
        .onSuccess((resolved) =>
          _annotationsAt(raw, path).onSuccess((annotations) =>
            // The full target stays the cycle identity in `refs`; the error path is cut, since a
            // server can make a reference arbitrarily long and every nested failure repeats it.
            _convertNode(resolved, {
              ...ctx,
              path: _echo(target),
              refs: [...ctx.refs, target],
              depth: ctx.depth + 1
            })
              .withErrorFormat((msg) => `${path}: via '$ref' '${shown}': ${msg}`)
              .onSuccess((node) =>
                _hasAnnotations(annotations) ? _reshape(node, ctx, false, annotations) : succeed(node)
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
  // Every node must be a non-array object; the rest of the checks read it as one.
  return _plainObjectField
    .convert(from)
    .withErrorFormat(() => `${nodeCtx.path}: expected a JSON Schema object`)
    .onSuccess((raw) => _convertSchemaObject(raw, nodeCtx));
}

/** The body of `_convertNode`, for a node already known to be a schema object. */
function _convertSchemaObject(
  raw: Record<string, unknown>,
  nodeCtx: IParseContext
): Result<ISchemaValidator<JsonValue>> {
  const path = nodeCtx.path;

  if (nodeCtx.depth > MAX_SCHEMA_DEPTH) {
    return fail(`${path}: the schema nests deeper than the limit of ${MAX_SCHEMA_DEPTH} levels`);
  }
  if (nodeCtx.budget.nodes >= MAX_SCHEMA_NODES) {
    return fail(`${path}: the schema exceeds the limit of ${MAX_SCHEMA_NODES} nodes`);
  }
  nodeCtx.budget.nodes += 1;

  // A nested `$id` rebases the references beneath it; those are refused rather than resolved
  // against the wrong document (see `_convertRef`).
  const ctx: IParseContext = raw !== nodeCtx.root && '$id' in raw ? { ...nodeCtx, rebased: true } : nodeCtx;

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
  // `const` first: beside an `enum` it is refused rather than letting the enum arm drop it.
  if ('const' in raw) {
    return _convertConst(raw, ctx);
  }

  if ('enum' in raw) {
    return _convertEnum(raw, ctx);
  }

  // Union type arrays: `[<type>, 'null']` is the nullable spelling and is admitted;
  // anything else gets a better error than discriminatedObject's generic message.
  const split = _splitNullableType(raw.type);
  if (split.isFailure()) {
    return fail(`${path}: ${split.message}`);
  }

  // `{}` (pydantic `Any`), or annotations alone: the schema every value matches. Its typeless wire
  // is refused by providers that require a `type` on every schema, which the provider adapters in
  // `@fgv/ts-extras` decide per wire.
  if (_isAnySchema(raw)) {
    return _annotationsAt(raw, path).onSuccess((annotations) =>
      schemaOptions(annotations).onSuccess((opts) =>
        succeed(anyValue(opts) as unknown as ISchemaValidator<JsonValue>)
      )
    );
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
  return _typeDispatchConverter.convert(raw, ctx);
}

/**
 * The main converter. Parses a raw JSON Schema object into a typed schema validator
 * for the LLM-tool subset.
 *
 * @remarks
 * Performs pre-flight checks (non-object root, nullable `anyOf`/`oneOf`, local `$ref`, union type
 * arrays, forbidden keywords, unknown types) before dispatching to the per-type arm converters.
 *
 * The public conversion context (`TC = string`) is the JSON Pointer path of the value being
 * converted (internally the recursion carries a richer context for `$ref` resolution), so that error messages from nested nodes name the actual failing node (e.g.
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
  ): Result<ISchemaValidator<JsonValue>> => {
    const path = context ?? '#';
    // A backstop: the conversion returns its failures as Results and bounds its own recursion, so
    // nothing in it is expected to throw — but it reads a caller-supplied value, which may carry
    // accessors, and must not let one escape as an exception.
    return captureResult(() => _convertNode(from, _rootContext(from, path)))
      .withErrorFormat((msg) => `${path}: ${_printable(msg)}`)
      .onSuccess((converted) => converted);
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
 * Nullability is read in both of its spellings: `type: [<t>, 'null']`, and an `anyOf` / `oneOf` of
 * exactly one supported schema plus `{ type: 'null' }` (pydantic's `Optional[T]`). The second is
 * normalized to the first, so `toJson()` always emits the type union. Every other union is refused.
 *
 * Local references (`$ref` to `#/$defs/…`, `#/definitions/…` or any other `#/…` pointer into the
 * same document) are resolved by inlining, so `toJson()` emits a reference-free schema. Remote
 * references, recursive schemas (which have no finite inline form) and expansions beyond fixed
 * depth and size bounds are refused.
 *
 * Out-of-subset structural features fail loudly (see `FORBIDDEN_KEYWORDS`). The numeric range
 * keywords, `multipleOf` and the string lengths are enforced and emitted; the annotations
 * `description`, `title`, `default`, `examples` and `format` are emitted and not enforced. An
 * incoherent constraint set (`minimum` above `maximum`, a negative `minLength`, …) is refused with the
 * path named, exactly as the factories refuse it. Beside a `$ref` or a nullable `anyOf`/`oneOf`, each
 * annotation replaces the inner node's of the same name. Some object-key and array keywords are
 * still accepted without being enforced or emitted, so for them the validator can accept a value the
 * source schema rejects.
 *
 * An `enum` may list strings, numbers or booleans, all of one type, and a `type` must admit them
 * (`integer` requires every member to be an integer). A scalar `const` becomes the single-value enum
 * of its type and is enforced; `toJson()` emits it as `enum: [value]`. An enum node carries no
 * constraint and refuses `minLength`/`maxLength`, and a numeric one refuses the numeric constraint
 * keywords; it does not carry `format` either, which is dropped there. A schema with no `type` and
 * nothing but annotations — `{}`, pydantic's `Any` — becomes an `anyValue` node, which accepts any
 * JSON value.
 *
 * @param json - The raw JSON Schema object to parse.
 * @returns `Success` with the parsed schema, or `Failure` describing the first out-of-subset feature.
 * @public
 */
export function fromJson(json: JsonObject): Result<ISchemaValidator<JsonValue>> {
  return jsonSchemaConverter.convert(json);
}
