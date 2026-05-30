[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [EditorRules](../README.md) / IConditionalJsonDeferredObject

# Interface: IConditionalJsonDeferredObject

On a successful match, the [ConditionalJsonEditorRule](../classes/ConditionalJsonEditorRule.md)
stores a IConditionalJsonDeferredObject describing the
matching result, to be resolved at finalization time.

## Extends

- [`IConditionalJsonKeyResult`](IConditionalJsonKeyResult.md)

## Indexable

\[`key`: `string`\]: [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="matchtype"></a> `matchType` | `"match"` \| `"default"` \| `"unconditional"` |
| <a id="value"></a> `value` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |
