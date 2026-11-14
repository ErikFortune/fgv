[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCommandHandle

# Interface: ITaskCommandHandle

A command descriptor whose parameter type has been erased for storage in a registry.

## Remarks

Erasure is by converter closure, never a cast: [ITaskCommandHandle.validate](#validate)
closes over the descriptor's own schema and encoder, so the parameter type never
escapes the registration call that knew it.

`parameters` is the registered schema itself, readable so a model can be offered it
(I1c's generated command tools compose it into their wire schema). Reading it produces
no canonical parameters: for an externally executed kind, what is stored, deduplicated against
and dispatched is only ever `validate`'s output, and the broker runs `validate` on every request
it is handed — whatever a caller did with the schema first. The broker's own native kinds are the
exception: their commands are converted by the broker's authoritative tracked-command converter,
never through a registered handle, so for `fgv.tracked@1` the registered schema is the wire schema
only, and its agreement with that converter is a fixture obligation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-conditional"></a> `conditional` | `readonly` | `boolean` | - |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | `"none"` \| `"source-key"` | - |
| <a id="property-name"></a> `name` | `readonly` | `string` | - |
| <a id="property-parameters"></a> `parameters` | `readonly` | [`ISchemaValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`unknown`\> | The registered parameter schema: the wire schema a model is offered, and a validator. |

## Methods

### validate()

> **validate**(`parameters`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

Validates caller-supplied parameters through the registered schema and re-encodes
them. For an externally executed kind this is the canonical JSON form the broker
deduplicates and stores. For a native kind (`fgv.tracked@1`) the broker never calls it:
a value it accepts can still be refused by the broker's own converter, so it is not
the broker's validator there.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `unknown` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>
