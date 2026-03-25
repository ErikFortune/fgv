[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [EditorRules](../README.md) / IConditionalJsonDeferredObject

# Interface: IConditionalJsonDeferredObject

On a successful match, the [ConditionalJsonEditorRule](../classes/ConditionalJsonEditorRule.md)
stores a IConditionalJsonDeferredObject describing the
matching result, to be resolved at finalization time.

## Extends

- [`IConditionalJsonKeyResult`](IConditionalJsonKeyResult.md)

## Indexable

\[`key`: `string`\]: [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="matchtype"></a> `matchType` | `"match"` \| `"default"` \| `"unconditional"` |
| <a id="value"></a> `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
