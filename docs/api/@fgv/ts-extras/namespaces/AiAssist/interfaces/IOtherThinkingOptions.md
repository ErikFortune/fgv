[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IOtherThinkingOptions

# Interface: IOtherThinkingOptions

Escape-hatch options block for providers not covered by typed configs.

## Remarks

`models` is required — no implicit "all" for unknown providers.
`config` fields are merged verbatim into the wire request.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| <a id="property-models"></a> `models` | `readonly` | readonly `string`[] |
| <a id="property-provider"></a> `provider` | `readonly` | `"other"` |
