[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Mustache](../README.md) / IRenderedTemplate

# Interface: IRenderedTemplate

A render plus the map of which part of the output came from where.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-segments"></a> `segments` | `readonly` | readonly [`IRenderedSegment`](IRenderedSegment.md)[] | Document-ordered, contiguous and gapless: every code unit of `text` belongs to exactly one segment, so concatenating them reproduces `text` exactly. That identity is verified before this is returned. |
| <a id="property-text"></a> `text` | `readonly` | `string` | The rendered output — identical to what `MustacheTemplate.render` returns. |
