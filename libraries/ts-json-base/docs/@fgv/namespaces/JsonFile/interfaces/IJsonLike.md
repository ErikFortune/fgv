[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [JsonFile](../README.md) / IJsonLike

# Interface: IJsonLike

## Methods

### parse()

> **parse**(`text`, `reviver?`, `options?`): [`JsonValue`](../../../../type-aliases/JsonValue.md) \| `undefined`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `reviver?` | [`JsonReviver`](../type-aliases/JsonReviver.md) |
| `options?` | `unknown` |

#### Returns

[`JsonValue`](../../../../type-aliases/JsonValue.md) \| `undefined`

***

### stringify()

> **stringify**(`value`, `replacer?`, `space?`): `string` \| `undefined`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`JsonValue`](../../../../type-aliases/JsonValue.md) |
| `replacer?` | [`JsonReplacer`](../type-aliases/JsonReplacer.md) |
| `space?` | `string` \| `number` |

#### Returns

`string` \| `undefined`
