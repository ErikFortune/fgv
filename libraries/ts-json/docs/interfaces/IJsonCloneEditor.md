[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / IJsonCloneEditor

# Interface: IJsonCloneEditor

A specialized JSON editor which does a deep clone of a supplied `JsonValue`.

## Methods

### clone()

> **clone**(`src`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Returns a deep clone of a supplied `JsonValue`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` to be cloned. |
| `context?` | [`IJsonContext`](IJsonContext.md) | An optional [JSON context](IJsonContext.md) used for clone conversion operations. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>
