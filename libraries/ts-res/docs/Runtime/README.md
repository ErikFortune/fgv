[Home](../README.md) > Runtime

# Namespace: Runtime

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Context](./Context/README.md)

</td><td>



</td></tr>
<tr><td>

[ResourceTree](./ResourceTree/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[CompiledResourceCollection](./classes/CompiledResourceCollection.md)

</td><td>

A compiled resource collection implements Runtime.IResourceManager | IResourceManager
by reconstructing runtime objects from compiled data.

</td></tr>
<tr><td>

[SimpleContextQualifierProvider](./classes/SimpleContextQualifierProvider.md)

</td><td>

Simple concrete implementation of Runtime.Context.IContextQualifierProvider | IContextQualifierProvider

</td></tr>
<tr><td>

[ValidatingSimpleContextQualifierProvider](./classes/ValidatingSimpleContextQualifierProvider.md)

</td><td>

A Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider with a
Runtime.Context.MutableContextQualifierProviderValidator | validator property that enables
validated use of the underlying provider with string keys and values.

</td></tr>
<tr><td>

[ResourceTreeResolver](./classes/ResourceTreeResolver.md)

</td><td>

Specialized resolver for resource tree operations, providing enhanced APIs for
resolving entire resource trees from either resource IDs or pre-built tree nodes.

</td></tr>
<tr><td>

[ConditionSetResolutionResult](./classes/ConditionSetResolutionResult.md)

</td><td>

Represents the result of resolving a condition set.

</td></tr>
<tr><td>

[NoOpResourceResolverCacheListener](./classes/NoOpResourceResolverCacheListener.md)

</td><td>

A no-op implementation of Runtime.IResourceResolverCacheListener.

</td></tr>
<tr><td>

[AggregateCacheMetrics](./classes/AggregateCacheMetrics.md)

</td><td>

Aggregate cache metrics for a specific cache type.

</td></tr>
<tr><td>

[ResourceResolverCacheMetricsListener](./classes/ResourceResolverCacheMetricsListener.md)

</td><td>

A metrics implementation of Runtime.IResourceResolverCacheListener that tracks

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ICompiledResourceCollectionCreateParams](./interfaces/ICompiledResourceCollectionCreateParams.md)

</td><td>

Interface for parameters to create a Runtime.CompiledResourceCollection | CompiledResourceCollection.

</td></tr>
<tr><td>

[IResourceCandidate](./interfaces/IResourceCandidate.md)

</td><td>

Runtime representation of a resource candidate with the minimal data needed for resolution.

</td></tr>
<tr><td>

[IResource](./interfaces/IResource.md)

</td><td>

Interface for a resource that can be used in the runtime layer.

</td></tr>
<tr><td>

[ISimpleContextQualifierProviderCreateParams](./interfaces/ISimpleContextQualifierProviderCreateParams.md)

</td><td>

Parameters for creating a Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider.

</td></tr>
<tr><td>

[IValidatingSimpleContextQualifierProviderCreateParams](./interfaces/IValidatingSimpleContextQualifierProviderCreateParams.md)

</td><td>

Parameters for creating a Runtime.ValidatingSimpleContextQualifierProvider | ValidatingSimpleContextQualifierProvider.

</td></tr>
<tr><td>

[IResourceResolverOptions](./interfaces/IResourceResolverOptions.md)

</td><td>

Options for configuring a Runtime.ResourceResolver | ResourceResolver.

</td></tr>
<tr><td>

[IResourceResolverCreateParams](./interfaces/IResourceResolverCreateParams.md)

</td><td>

Parameters for creating a Runtime.ResourceResolver | ResourceResolver.

</td></tr>
<tr><td>

[IResolveResourceTreeOptions](./interfaces/IResolveResourceTreeOptions.md)

</td><td>

Options for configuring resource tree resolution.

</td></tr>
<tr><td>

[IConditionMatchResult](./interfaces/IConditionMatchResult.md)

</td><td>

Represents a single condition match result with priority and outcome.

</td></tr>
<tr><td>

[IResourceResolverCacheListener](./interfaces/IResourceResolverCacheListener.md)

</td><td>

A listener for Runtime.ResourceResolver | ResourceResolver cache activity.

</td></tr>
<tr><td>

[ICacheMetrics](./interfaces/ICacheMetrics.md)

</td><td>

Cache metrics interface for tracking cache performance.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[DecisionResolutionResult](./type-aliases/DecisionResolutionResult.md)

</td><td>

Represents the cached result of resolving a decision.

</td></tr>
<tr><td>

[ResourceErrorHandler](./type-aliases/ResourceErrorHandler.md)

</td><td>

Type for handling resource resolution errors during tree traversal.

</td></tr>
<tr><td>

[EmptyBranchHandler](./type-aliases/EmptyBranchHandler.md)

</td><td>

Type for handling empty branch nodes during tree composition.

</td></tr>
<tr><td>

[ConditionMatchType](./type-aliases/ConditionMatchType.md)

</td><td>

The outcome of a condition match.

</td></tr>
<tr><td>

[ResourceResolverCacheType](./type-aliases/ResourceResolverCacheType.md)

</td><td>

Type indicating which Runtime.ResourceResolver | ResourceResolver cache is affected.

</td></tr>
<tr><td>

[ResourceResolverCacheActivity](./type-aliases/ResourceResolverCacheActivity.md)

</td><td>

Type indicating the action performed on a Runtime.ResourceResolver | ResourceResolver cache.

</td></tr>
<tr><td>

[OverallCacheMetrics](./type-aliases/OverallCacheMetrics.md)

</td><td>

Overall cache metrics across all cache types.

</td></tr>
</tbody></table>
