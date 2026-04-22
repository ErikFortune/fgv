[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / ResourceResolver

# Class: ResourceResolver

High-performance runtime resource resolver with O(1) condition caching.
Resolves resources for a given context by evaluating conditions against qualifier values
and caching results for optimal performance.

## Implements

- [`IResourceResolver`](../interfaces/IResourceResolver.md)

## Constructors

### Constructor

> `protected` **new ResourceResolver**(`params`): `ResourceResolver`

Constructor for a ResourceResolver object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceResolverCreateParams`](../namespaces/Runtime/interfaces/IResourceResolverCreateParams.md) | [Parameters](../namespaces/Runtime/interfaces/IResourceResolverCreateParams.md) used to create the resolver. |

#### Returns

`ResourceResolver`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="contextqualifierprovider"></a> `contextQualifierProvider` | `readonly` | [`IContextQualifierProvider`](../namespaces/Runtime/namespaces/Context/type-aliases/IContextQualifierProvider.md) | The context qualifier provider that resolves qualifier values. |
| <a id="options"></a> `options` | `readonly` | [`IResourceResolverOptions`](../namespaces/Runtime/interfaces/IResourceResolverOptions.md) | The configuration options for this resource resolver. |
| <a id="qualifiertypes"></a> `qualifierTypes` | `readonly` | [`ReadOnlyQualifierTypeCollector`](../namespaces/QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) | The readonly qualifier type collector that provides qualifier implementations. |
| <a id="resourcemanager"></a> `resourceManager` | `readonly` | [`IResourceManager`](../interfaces/IResourceManager.md) | The resource manager that defines available resources and provides condition access. |

## Accessors

### conditionCache

#### Get Signature

> **get** **conditionCache**(): readonly ([`IConditionMatchResult`](../namespaces/Runtime/interfaces/IConditionMatchResult.md) \| `undefined`)[]

The cache array for resolved conditions, indexed by condition index for O(1) lookup.
Each entry stores the resolved [condition match result](../namespaces/Runtime/interfaces/IConditionMatchResult.md) for
the corresponding condition.

##### Returns

readonly ([`IConditionMatchResult`](../namespaces/Runtime/interfaces/IConditionMatchResult.md) \| `undefined`)[]

***

### conditionCacheSize

#### Get Signature

> **get** **conditionCacheSize**(): `number`

Gets the current size of the condition cache array.

##### Returns

`number`

The size of the condition cache array.

***

### conditionSetCache

#### Get Signature

> **get** **conditionSetCache**(): readonly ([`ConditionSetResolutionResult`](../namespaces/Runtime/classes/ConditionSetResolutionResult.md) \| `undefined`)[]

The cache array for resolved condition sets, indexed by condition set index for O(1) lookup.
Each entry stores the resolved ConditionSetResolutionResult for the corresponding condition set.

##### Returns

readonly ([`ConditionSetResolutionResult`](../namespaces/Runtime/classes/ConditionSetResolutionResult.md) \| `undefined`)[]

***

### conditionSetCacheSize

#### Get Signature

> **get** **conditionSetCacheSize**(): `number`

Gets the current size of the condition set cache array.

##### Returns

`number`

The size of the condition set cache array.

***

### decisionCache

#### Get Signature

> **get** **decisionCache**(): readonly ([`DecisionResolutionResult`](../namespaces/Runtime/type-aliases/DecisionResolutionResult.md) \| `undefined`)[]

The cache array for resolved decisions, indexed by decision index for O(1) lookup.
Each entry stores the resolved DecisionResolutionResult for the corresponding decision.

##### Returns

readonly ([`DecisionResolutionResult`](../namespaces/Runtime/type-aliases/DecisionResolutionResult.md) \| `undefined`)[]

***

### decisionCacheSize

#### Get Signature

> **get** **decisionCacheSize**(): `number`

Gets the current size of the decision cache array.

##### Returns

`number`

The size of the decision cache array.

***

### qualifiers

#### Get Signature

> **get** **qualifiers**(): [`IReadOnlyQualifierCollector`](../namespaces/Qualifiers/interfaces/IReadOnlyQualifierCollector.md)

The readonly qualifier collector that provides qualifier implementations.

##### Returns

[`IReadOnlyQualifierCollector`](../namespaces/Qualifiers/interfaces/IReadOnlyQualifierCollector.md)

***

### resourceIds

#### Get Signature

> **get** **resourceIds**(): readonly [`ResourceId`](../type-aliases/ResourceId.md)[]

The resource IDs that this resolver can resolve.

##### Returns

readonly [`ResourceId`](../type-aliases/ResourceId.md)[]

The resource IDs that this resolver can resolve.

#### Implementation of

[`IResourceResolver`](../interfaces/IResourceResolver.md).[`resourceIds`](../interfaces/IResourceResolver.md#resourceids)

## Methods

### clearConditionCache()

> **clearConditionCache**(): `void`

Clears all caches (condition, condition set, and decision), forcing all cached items
to be re-evaluated on next access. This should be called when the context changes and cached
results are no longer valid.

#### Returns

`void`

***

### resolveAllResourceCandidates()

#### Call Signature

> **resolveAllResourceCandidates**(`resource`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)[]\>

Resolves all matching resource candidates in priority order.
Uses the resource's associated decision to determine all matching candidates based on the current context.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | [`IResource`](../namespaces/Runtime/interfaces/IResource.md) | The [resource](Resource.md) to resolve. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)[]\>

`Success` with an array of all matching candidates in priority order if successful,
or `Failure` with an error message if no candidates match or resolution fails.

#### Call Signature

> **resolveAllResourceCandidates**(`resource`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)[]\>

Resolves all matching resource candidates in priority order.
Uses the resource's associated decision to determine all matching candidates based on the current context.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | `string` | The string id of the resource to resolve. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)[]\>

`Success` with an array of all matching candidates in priority order if successful,
or `Failure` with an error message if no candidates match or resolution fails.

***

### resolveComposedResourceValue()

#### Call Signature

> **resolveComposedResourceValue**(`resource`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

Resolves a resource to a composed value by merging matching candidates according to their merge methods.
Starting from the highest priority candidates, finds the first "full" candidate and merges all higher
priority "partial" candidates into it in ascending order of priority.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | [`IResource`](../namespaces/Runtime/interfaces/IResource.md) | The [resource](Resource.md) to resolve. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

`Success` with the composed JsonValue if successful,
or `Failure` with an error message if no candidates match or resolution fails.

##### Implementation of

[`IResourceResolver`](../interfaces/IResourceResolver.md).[`resolveComposedResourceValue`](../interfaces/IResourceResolver.md#resolvecomposedresourcevalue)

#### Call Signature

> **resolveComposedResourceValue**(`resource`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

Resolves a resource to a composed value by merging matching candidates according to their merge methods.
Starting from the highest priority candidates, finds the first "full" candidate and merges all higher
priority "partial" candidates into it in ascending order of priority.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | `string` | The string id of the resource to resolve. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

`Success` with the composed JsonValue if successful,
or `Failure` with an error message if no candidates match or resolution fails.

##### Implementation of

`IResourceResolver.resolveComposedResourceValue`

***

### resolveCondition()

> **resolveCondition**(`condition`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IConditionMatchResult`](../namespaces/Runtime/interfaces/IConditionMatchResult.md)\>

Resolves a condition by evaluating it against the current context.
Uses O(1) caching based on the condition's globally unique sequential index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | [`Condition`](Condition.md) | The [condition](Condition.md) to resolve. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IConditionMatchResult`](../namespaces/Runtime/interfaces/IConditionMatchResult.md)\>

`Success` with the [match score](../type-aliases/QualifierMatchScore.md) if successful,
or `Failure` with an error message if the condition cannot be resolved.

***

### resolveConditionSet()

> **resolveConditionSet**(`conditionSet`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetResolutionResult`](../namespaces/Runtime/classes/ConditionSetResolutionResult.md)\>

Resolves a condition set by evaluating all its constituent conditions against the current context.
Uses O(1) caching based on the condition set's globally unique sequential index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `conditionSet` | [`ConditionSet`](../namespaces/Conditions/classes/ConditionSet.md) | The [condition set](../namespaces/Conditions/classes/ConditionSet.md) to resolve. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetResolutionResult`](../namespaces/Runtime/classes/ConditionSetResolutionResult.md)\>

`Success` with the [resolution result](../namespaces/Runtime/classes/ConditionSetResolutionResult.md) if successful,
or `Failure` with an error message if the condition set cannot be resolved.

***

### resolveDecision()

> **resolveDecision**(`decision`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionResolutionResult`](../namespaces/Runtime/type-aliases/DecisionResolutionResult.md)\>

Resolves a decision by evaluating all its constituent condition sets against the current context.
Uses O(1) caching based on the decision's globally unique sequential index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decision` | [`AbstractDecision`](../namespaces/Decisions/classes/AbstractDecision.md) | The [abstract decision](../namespaces/Decisions/classes/AbstractDecision.md) to resolve. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionResolutionResult`](../namespaces/Runtime/type-aliases/DecisionResolutionResult.md)\>

`Success` with the [resolution result](../namespaces/Runtime/type-aliases/DecisionResolutionResult.md) if successful,
or `Failure` with an error message if the decision cannot be resolved.

***

### resolveResource()

#### Call Signature

> **resolveResource**(`resource`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)\>

Resolves a resource by finding the best matching candidate.
Uses the resource's associated decision to determine the best match based on the current context.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | [`IResource`](../namespaces/Runtime/interfaces/IResource.md) | The [resource](Resource.md) to resolve. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)\>

`Success` with the best matching candidate if successful,
or `Failure` with an error message if no candidates match or resolution fails.

#### Call Signature

> **resolveResource**(`resource`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)\>

Resolves a resource by finding the best matching candidate.
Uses the resource's associated decision to determine the best match based on the current context.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | `string` | The string id of the resource to resolve. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)\>

`Success` with the best matching candidate if successful,
or `Failure` with an error message if no candidates match or resolution fails.

***

### withContext()

> **withContext**(`context`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceResolver`\>

Creates a new [resource resolver](../interfaces/IResourceResolver.md) with the given context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `Record`\<`string`, `string`\> | The context to use for the new resource resolver. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceResolver`\>

`Success` with the new resource resolver if successful,
or `Failure` with an error message if the context is invalid.

#### Implementation of

[`IResourceResolver`](../interfaces/IResourceResolver.md).[`withContext`](../interfaces/IResourceResolver.md#withcontext)

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceResolver`\>

Creates a new ResourceResolver object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceResolverCreateParams`](../namespaces/Runtime/interfaces/IResourceResolverCreateParams.md) | [Parameters](../namespaces/Runtime/interfaces/IResourceResolverCreateParams.md) used to create the resolver. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceResolver`\>

`Success` with the new ResourceResolver object if successful,
or `Failure` with an error message if not.
