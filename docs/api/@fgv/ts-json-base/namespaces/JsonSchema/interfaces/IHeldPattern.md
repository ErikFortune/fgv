[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / IHeldPattern

# Interface: IHeldPattern

**`Internal`**

A pattern a string node enforces and emits: the source the wire receives, and the one predicate
that enforces it. Held immutably, so the validator and `toJson()` cannot come to disagree.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-matches"></a> `matches` | `readonly` | (`value`) => [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\> | Whether a string matches, or a `Failure` when the match could not be made. |
| <a id="property-source"></a> `source` | `readonly` | `string` | The ECMAScript source emitted as `pattern`. |
