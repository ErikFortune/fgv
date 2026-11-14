[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiClientToolConfig

# Interface: IAiClientToolConfig\<TParams\>

Configuration for a client-defined (harness-supplied) tool.

## Remarks

The `parametersSchema` is the single source of truth for both the wire-format
JSON Schema sent to the provider (via `.toJson()`) and the runtime argument
validation (via `.validate(rawArgs)`). Use `JsonSchema.object(...)` from
`@fgv/ts-json-base` to author the schema as a const (e.g. `const mySchema = JsonSchema.object({...})`);
the static type `TParams` is then derived via `JsonSchema.Static<typeof mySchema>` —
no drift between wire schema and runtime validation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tparams"></a> `TParams` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-annotations"></a> `annotations?` | `readonly` | [`IAiToolAnnotations`](IAiToolAnnotations.md) | Optional host-advisory behavior annotations (read-only / destructive / idempotent / open-world hints + display title). Consumed by the host's tool loop; never serialized to the model. See [AiAssist.IAiToolAnnotations](IAiToolAnnotations.md). |
| <a id="property-description"></a> `description` | `readonly` | `string` | Human-readable description of what the tool does, shown to the model. |
| <a id="property-name"></a> `name` | `readonly` | `string` | Tool name sent to the model (must be unique within a call). |
| <a id="property-parametersschema"></a> `parametersSchema` | `readonly` | [`ISchemaValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TParams`\> | JSON Schema validator for the tool's parameters. Emits wire format via `.toJson()` and validates model-returned args via `.validate(rawArgs)`. |
| <a id="property-type"></a> `type` | `readonly` | `"client_tool"` | Discriminator — always `'client_tool'`. |
