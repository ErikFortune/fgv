[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / IFromJsonOptions

# Interface: IFromJsonOptions

Options for `fromJson`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-patternvalidator"></a> `patternValidator?` | `readonly` | [`SchemaPatternValidator`](../type-aliases/SchemaPatternValidator.md) | Admits `pattern` on string nodes, compiled by this validator. Without it, `pattern` is refused wherever it appears, and nothing compiles it. |
