[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / ISchemaStructuredOutputRequest

# Interface: ISchemaStructuredOutputRequest

Ask the provider for JSON constrained to a schema.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-adaptoptionaltonullable"></a> `adaptOptionalToNullable?` | `readonly` | `boolean` | On a format that requires every property to be `required`, send an optional property as required when its node **already admits `null`**, instead of refusing the whole schema. **Remarks** `JsonSchema.optional(...)` emits its inner node verbatim — optionality lives only in the parent's `required` array — so for a property authored as `optional(string({ nullable: true }))` the wire node is already `['string', 'null']`, and adding the key to `required` narrows what the model may send from *absent-or-null-or-value* to *null-or-value*. **Every reply the narrowed schema permits, the original schema already accepted**, so the one-object-cannot-drift property is preserved rather than traded away. That is why this is not the caller asserting its validator tolerates `null`. An assertion could be false; this is read off the schema. A property authored as plain `optional(string())` rejects `null`, is therefore **not** hoistable, and the schema still refuses through `onUnsupported` exactly as before — with an error naming the properties that blocked it. Setting this flag can never produce a wire schema the supplied schema would reject. Opt-in because it is still a **semantic** change to the reply: the model must now emit `null` where it could previously omit the key. A caller that distinguishes those two — rather than treating them alike, as `optional(nullable)` says it does — should leave this off. Defaults to `false`. The enforcement report is unaffected: a schema that goes out reports `'schema'` whether or not any property was hoisted. |
| <a id="property-mode"></a> `mode` | `readonly` | `"schema"` | - |
| <a id="property-onunsupported"></a> `onUnsupported?` | `readonly` | [`StructuredOutputFallback`](../type-aliases/StructuredOutputFallback.md) | - |
| <a id="property-schema"></a> `schema` | `readonly` | [`ISchemaValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`unknown`\> | The schema to constrain generation to — **the same object you validate the reply with**, so the wire schema and the check cannot drift. **Remarks** Author it with `JsonSchema.object({...})` from `@fgv/ts-json-base`. This is the property `@fgv/ts-extras-ollama`'s `chatStructured` already has; this surface is its cloud sibling. |
