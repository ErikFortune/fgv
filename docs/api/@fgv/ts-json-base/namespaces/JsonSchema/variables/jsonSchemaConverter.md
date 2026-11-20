[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / jsonSchemaConverter

# Variable: jsonSchemaConverter

> `const` **jsonSchemaConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>, `string`\>

The main converter. Parses a raw JSON Schema object into a typed schema validator
for the LLM-tool subset.

## Remarks

Performs pre-flight checks (non-object root, nullable `anyOf`/`oneOf`, local `$ref`, union type
arrays, forbidden keywords, unknown types) before dispatching to the per-type arm converters.

The public conversion context (`TC = string`) is the JSON Pointer path of the value being
converted (internally the recursion carries a richer context for `$ref` resolution), so that error messages from nested nodes name the actual failing node (e.g.
`#/properties/config/properties/inner: 'required' key '...'`) rather than always
reporting `#:`. The context defaults to `'#'` when absent (top-level call).

The value converted is the document: local references (`#/$defs/…`, `#/definitions/…`, or any
other `#/…` pointer) resolve against it, and are inlined.
