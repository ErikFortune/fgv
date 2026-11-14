[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IOtherModelOptions

# Interface: IOtherModelOptions

Escape-hatch options block for models not covered by a named family.

## Remarks

`models` is required — there is no implicit "all" for unknown model families.
`config` is `JsonObject` — passed verbatim to the wire request with no validation.
This is the "trust me, I know what I'm doing" path for callers who need to send
wire params our typed configs don't yet expose.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| <a id="property-models"></a> `models` | `readonly` | `string`[] |
| <a id="property-provider"></a> `provider` | `readonly` | `"other"` |
