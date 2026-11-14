[Home](../../README.md) > [Runtime](../README.md) > ResourceResolverCacheMetricsListener

# Class: ResourceResolverCacheMetricsListener

A metrics implementation of Runtime.IResourceResolverCacheListener that tracks
hit counts and rates across all cache types.

**Implements:** [`IResourceResolverCacheListener`](../../interfaces/IResourceResolverCacheListener.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(factory)`

</td><td>



</td><td>



</td></tr>
</tbody></table>

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[numContextErrors](./ResourceResolverCacheMetricsListener.numContextErrors.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[metrics](./ResourceResolverCacheMetricsListener.metrics.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;[OverallCacheMetrics](../../type-aliases/OverallCacheMetrics.md)&gt;

</td><td>

Get the metrics for all cache types.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[onCacheHit(cache, index)](./ResourceResolverCacheMetricsListener.onCacheHit.md)

</td><td>



</td><td>

Called when a cache hit occurs.

</td></tr>
<tr><td>

[onCacheMiss(cache, index)](./ResourceResolverCacheMetricsListener.onCacheMiss.md)

</td><td>



</td><td>

Called when a cache miss occurs.

</td></tr>
<tr><td>

[onCacheError(cache, index)](./ResourceResolverCacheMetricsListener.onCacheError.md)

</td><td>



</td><td>

Called when a cache error occurs.

</td></tr>
<tr><td>

[onContextError(qualifier, error)](./ResourceResolverCacheMetricsListener.onContextError.md)

</td><td>



</td><td>

Called when a context error occurs.

</td></tr>
<tr><td>

[onCacheClear(cache)](./ResourceResolverCacheMetricsListener.onCacheClear.md)

</td><td>



</td><td>

Called when a cache is cleared.

</td></tr>
<tr><td>

[reset()](./ResourceResolverCacheMetricsListener.reset.md)

</td><td>



</td><td>

Reset all metrics to zero.

</td></tr>
</tbody></table>
