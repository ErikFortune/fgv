[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCommandDescriptor

# Interface: ITaskCommandDescriptor\<P\>

A registered command: one schema that is both the runtime validator and the wire
schema a model is offered — for an externally executed kind. A native kind's descriptor
provides the wire schema only: the broker validates and canonicalizes native commands
with its own converter, and runs neither this schema nor `encode`.

## Remarks

`conditional` states whether the command can carry a source precondition, so a host
can refuse weaker dispatch. `idempotency: 'source-key'` states that the source itself
deduplicates the same key, which is what makes a safe resend possible after an
uncertain dispatch.

For an externally executed kind, `encode` produces the canonical parameters that are stored,
deduplicated against and dispatched, and because `parameters` is also the wire schema, the
encoded form must validate against it again: a descriptor whose encoder changes shape is
refused when a command is validated.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p"></a> `P` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-conditional"></a> `conditional` | `readonly` | `boolean` |
| <a id="property-encode"></a> `encode` | `readonly` | (`parameters`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\> |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | `"none"` \| `"source-key"` |
| <a id="property-name"></a> `name` | `readonly` | `string` |
| <a id="property-parameters"></a> `parameters` | `readonly` | [`ISchemaValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`P`\> |
