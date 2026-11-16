[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IJsonObjectStructuredOutputRequest

# Interface: IJsonObjectStructuredOutputRequest

Ask the provider for syntactically valid JSON of arbitrary shape.

## Remarks

The weaker floor, and worth having on its own: the failure that motivated this
surface (`Expected ',' or '}' after property value` — an unescaped quote closing
a string early) is **syntactic**, so a JSON-mode guarantee removes it. Schema
constraint is what additionally buys shape. It is also the only mode some
model/provider pairs support.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-mode"></a> `mode` | `readonly` | `"json-object"` |
| <a id="property-onunsupported"></a> `onUnsupported?` | `readonly` | [`StructuredOutputFallback`](../type-aliases/StructuredOutputFallback.md) |
