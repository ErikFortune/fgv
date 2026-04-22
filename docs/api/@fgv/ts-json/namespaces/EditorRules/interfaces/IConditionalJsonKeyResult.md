[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [EditorRules](../README.md) / IConditionalJsonKeyResult

# Interface: IConditionalJsonKeyResult

Returned by [ConditionalJsonEditorRule.\_tryParseCondition](../classes/ConditionalJsonEditorRule.md#_tryparsecondition)
to indicate whether a successful match was due to a matching condition or a default value.

## Extends

- [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

## Extended by

- [`IConditionalJsonDeferredObject`](IConditionalJsonDeferredObject.md)

## Indexable

\[`key`: `string`\]: [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="matchtype"></a> `matchType` | `"match"` \| `"default"` \| `"unconditional"` |
