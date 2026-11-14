[Home](../README.md) > ResourceResolver

# Class: ResourceResolver

High-performance runtime resource resolver with O(1) condition caching.
Resolves resources for a given context by evaluating conditions against qualifier values
and caching results for optimal performance.

**Implements:** [`IResourceResolver`](../interfaces/IResourceResolver.md)

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

[resourceManager](./ResourceResolver.resourceManager.md)

</td><td>

`readonly`

</td><td>

[IResourceManager](../interfaces/IResourceManager.md)

</td><td>

The resource manager that defines available resources and provides condition access.

</td></tr>
<tr><td>

[qualifierTypes](./ResourceResolver.qualifierTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyQualifierTypeCollector](../type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

The readonly qualifier type collector that provides qualifier implementations.

</td></tr>
<tr><td>

[contextQualifierProvider](./ResourceResolver.contextQualifierProvider.md)

</td><td>

`readonly`

</td><td>

[IContextQualifierProvider](../type-aliases/IContextQualifierProvider.md)

</td><td>

The context qualifier provider that resolves qualifier values.

</td></tr>
<tr><td>

[options](./ResourceResolver.options.md)

</td><td>

`readonly`

</td><td>

[IResourceResolverOptions](../interfaces/IResourceResolverOptions.md)

</td><td>

The configuration options for this resource resolver.

</td></tr>
<tr><td>

[qualifiers](./ResourceResolver.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The readonly qualifier collector that provides qualifier implementations.

</td></tr>
<tr><td>

[resourceIds](./ResourceResolver.resourceIds.md)

</td><td>

`readonly`

</td><td>

readonly [ResourceId](../type-aliases/ResourceId.md)[]

</td><td>

The resource IDs that this resolver can resolve.

</td></tr>
<tr><td>

[conditionCache](./ResourceResolver.conditionCache.md)

</td><td>

`readonly`

</td><td>

readonly ([IConditionMatchResult](../interfaces/IConditionMatchResult.md) | undefined)[]

</td><td>

The cache array for resolved conditions, indexed by condition index for O(1) lookup.

</td></tr>
<tr><td>

[conditionSetCache](./ResourceResolver.conditionSetCache.md)

</td><td>

`readonly`

</td><td>

readonly ([ConditionSetResolutionResult](ConditionSetResolutionResult.md) | undefined)[]

</td><td>

The cache array for resolved condition sets, indexed by condition set index for O(1) lookup.

</td></tr>
<tr><td>

[decisionCache](./ResourceResolver.decisionCache.md)

</td><td>

`readonly`

</td><td>

readonly ([DecisionResolutionResult](../type-aliases/DecisionResolutionResult.md) | undefined)[]

</td><td>

The cache array for resolved decisions, indexed by decision index for O(1) lookup.

</td></tr>
<tr><td>

[conditionCacheSize](./ResourceResolver.conditionCacheSize.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the current size of the condition cache array.

</td></tr>
<tr><td>

[conditionSetCacheSize](./ResourceResolver.conditionSetCacheSize.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the current size of the condition set cache array.

</td></tr>
<tr><td>

[decisionCacheSize](./ResourceResolver.decisionCacheSize.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the current size of the decision cache array.

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

[create(params)](./ResourceResolver.create.md)

</td><td>

`static`

</td><td>

Creates a new Runtime.ResourceResolver | ResourceResolver object.

</td></tr>
<tr><td>

[resolveCondition(condition)](./ResourceResolver.resolveCondition.md)

</td><td>



</td><td>

Resolves a condition by evaluating it against the current context.

</td></tr>
<tr><td>

[resolveConditionSet(conditionSet)](./ResourceResolver.resolveConditionSet.md)

</td><td>



</td><td>

Resolves a condition set by evaluating all its constituent conditions against the current context.

</td></tr>
<tr><td>

[resolveDecision(decision)](./ResourceResolver.resolveDecision.md)

</td><td>



</td><td>

Resolves a decision by evaluating all its constituent condition sets against the current context.

</td></tr>
<tr><td>

[resolveResource(resource)](./ResourceResolver.resolveResource.md)

</td><td>



</td><td>

Resolves a resource by finding the best matching candidate.

</td></tr>
<tr><td>

[resolveAllResourceCandidates(resource)](./ResourceResolver.resolveAllResourceCandidates.md)

</td><td>



</td><td>

Resolves all matching resource candidates in priority order.

</td></tr>
<tr><td>

[resolveComposedResourceValue(resource)](./ResourceResolver.resolveComposedResourceValue.md)

</td><td>



</td><td>

Resolves a resource to a composed value by merging matching candidates according to their merge methods.

</td></tr>
<tr><td>

[withContext(context)](./ResourceResolver.withContext.md)

</td><td>



</td><td>

Creates a new IResourceResolver | resource resolver with the given context.

</td></tr>
<tr><td>

[clearConditionCache()](./ResourceResolver.clearConditionCache.md)

</td><td>



</td><td>

Clears all caches (condition, condition set, and decision), forcing all cached items
to be re-evaluated on next access.

</td></tr>
</tbody></table>
