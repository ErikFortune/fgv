[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / fromJson

# Function: fromJson()

> **fromJson**(`json`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>\>

Parses a raw JSON Schema object (e.g. one discovered at an MCP tool boundary) into a typed schema
value within the LLM-tool subset.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonObject`](../../../interfaces/JsonObject.md) | The raw JSON Schema object to parse. |
| `options?` | [`IFromJsonOptions`](../interfaces/IFromJsonOptions.md) | How to treat keywords that are refused by default; see `IFromJsonOptions`. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>\>

`Success` with the parsed schema, or `Failure` describing the first out-of-subset feature.

## Remarks

Because the static type cannot be recovered from a runtime value, the result is typed as the
opaque supertype `ISchemaValidator<JsonValue>` — the honest type when a schema arrives at runtime,
since schemas may validate strings, numbers, booleans, arrays, or objects. The `validate()` method
performs real runtime validation; the derived static type is the opaque `JsonValue`.

Consumers who need a narrower derived type must author the schema via the factories.

Nullability is read in both of its spellings: `type: [<t>, 'null']`, and an `anyOf` / `oneOf` of
exactly one supported schema plus `{ type: 'null' }` (pydantic's `Optional[T]`). The second is
normalized to the first, so `toJson()` always emits the type union. Every other union is refused.

Local references (`$ref` to `#/$defs/…`, `#/definitions/…` or any other `#/…` pointer into the
same document) are resolved by inlining, so `toJson()` emits a reference-free schema. Remote
references, recursive schemas (which have no finite inline form) and expansions beyond fixed
depth and size bounds are refused.

Out-of-subset structural features fail loudly (see `FORBIDDEN_KEYWORDS`). The numeric range
keywords, `multipleOf` and the string lengths are enforced and emitted; the annotations
`description`, `title`, `default`, `examples` and `format` are emitted and not enforced. An
incoherent constraint set (`minimum` above `maximum`, a negative `minLength`, …) is refused with the
path named, exactly as the factories refuse it. Beside a `$ref` or a nullable `anyOf`/`oneOf`, each
annotation replaces the inner node's of the same name. Some object-key and array keywords are
still accepted without being enforced or emitted, so for them the validator can accept a value the
source schema rejects.

An `enum` may list strings, numbers or booleans, all of one type, and a `type` must admit them
(`integer` requires every member to be an integer). A scalar `const` becomes the single-value enum
of its type and is enforced; `toJson()` emits it as `enum: [value]`. An enum node carries no
constraint and refuses `minLength`/`maxLength`, and a numeric one refuses the numeric constraint
keywords; it does not carry `format` either, which is dropped there. A schema with no `type` and
nothing but annotations — `{}`, pydantic's `Any` — becomes an `anyValue` node, which accepts any
JSON value.

`pattern` is refused unless `options.patternValidator` is supplied, and this function never
compiles one itself: with a validator, a string node's `pattern` is compiled by it, enforced by
the predicate it returns, and emitted as the original source. A validator failure refuses the
schema with the node's path. `pattern` beside an `enum` or `const` is refused, and on a node that
is not a string it constrains nothing and is not emitted (nor compiled).
`jsonSchemaConverter` takes no options, so it always refuses `pattern`.
