[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Mustache](../README.md) / IRenderedSegment

# Interface: IRenderedSegment

One contiguous run of the rendered output, attributed to what produced it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-escaped"></a> `escaped` | `readonly` | `boolean` | `false` for a triple-stash / `{{&}}` interpolation, which bypasses escaping. |
| <a id="property-kind"></a> `kind` | `readonly` | `"literal"` \| `"substitution"` | `'literal'` for template text; `'substitution'` for an interpolated value. |
| <a id="property-length"></a> `length` | `readonly` | `number` | Length in UTF-16 code units. May be `0` for a variable that rendered empty. |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Variable name, when `kind` is `'substitution'`. |
| <a id="property-start"></a> `start` | `readonly` | `number` | Offset into `IRenderedTemplate.text`, in UTF-16 code units. |
