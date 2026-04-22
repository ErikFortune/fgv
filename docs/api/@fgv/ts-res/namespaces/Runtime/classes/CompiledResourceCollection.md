[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / CompiledResourceCollection

# Class: CompiledResourceCollection

A compiled resource collection implements [IResourceManager](../../../interfaces/IResourceManager.md)
by reconstructing runtime objects from compiled data. This provides an efficient way to load
and use pre-compiled resource collections without rebuilding them from scratch.

## Implements

- [`IResourceManager`](../../../interfaces/IResourceManager.md)\<[`IResource`](../interfaces/IResource.md)\>

## Constructors

### Constructor

> `protected` **new CompiledResourceCollection**(`params`): `CompiledResourceCollection`

**`Internal`**

Constructor for a CompiledResourceCollection object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICompiledResourceCollectionCreateParams`](../interfaces/ICompiledResourceCollectionCreateParams.md) | Parameters to create a new CompiledResourceCollection. |

#### Returns

`CompiledResourceCollection`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_numcandidates"></a> `_numCandidates?` | `protected` | `number` | - |
| <a id="conditions"></a> `conditions` | `readonly` | [`ReadOnlyConditionCollector`](../../Conditions/type-aliases/ReadOnlyConditionCollector.md) | A [ReadOnlyConditionCollector](../../Conditions/type-aliases/ReadOnlyConditionCollector.md) which contains the [conditions](../../../classes/Condition.md) used by resource candidates. |
| <a id="conditionsets"></a> `conditionSets` | `readonly` | [`ReadOnlyConditionSetCollector`](../../Conditions/type-aliases/ReadOnlyConditionSetCollector.md) | A [ReadOnlyConditionSetCollector](../../Conditions/type-aliases/ReadOnlyConditionSetCollector.md) which contains the [condition sets](../../Conditions/classes/ConditionSet.md) used by resource candidates. |
| <a id="decisions"></a> `decisions` | `readonly` | [`ReadOnlyAbstractDecisionCollector`](../../Decisions/type-aliases/ReadOnlyAbstractDecisionCollector.md) | A [ReadOnlyAbstractDecisionCollector](../../Decisions/type-aliases/ReadOnlyAbstractDecisionCollector.md) which contains the [abstract decisions](../../../classes/Decision.md) used by resource candidates. |

## Accessors

### builtResources

#### Get Signature

> **get** **builtResources**(): [`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../../../type-aliases/ResourceId.md), [`IResource`](../interfaces/IResource.md)\>

A read-only result map of all built resources, keyed by resource ID.
Resources are built on-demand when accessed and returns Results for error handling.

##### Returns

[`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../../../type-aliases/ResourceId.md), [`IResource`](../interfaces/IResource.md)\>

A read-only result map of all built resources, keyed by resource ID.
Resources are built on-demand when accessed and returns Results for error handling.

#### Implementation of

[`IResourceManager`](../../../interfaces/IResourceManager.md).[`builtResources`](../../../interfaces/IResourceManager.md#builtresources)

***

### candidateValues

#### Get Signature

> **get** **candidateValues**(): readonly [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)[]

The candidate values in the collection.

##### Returns

readonly [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)[]

***

### numCandidates

#### Get Signature

> **get** **numCandidates**(): `number`

The number of candidates in this resource manager.

##### Returns

`number`

The number of candidates in this resource manager.

#### Implementation of

[`IResourceManager`](../../../interfaces/IResourceManager.md).[`numCandidates`](../../../interfaces/IResourceManager.md#numcandidates)

***

### numResources

#### Get Signature

> **get** **numResources**(): `number`

The number of resources in this resource manager.

##### Returns

`number`

The number of resources in this resource manager.

#### Implementation of

[`IResourceManager`](../../../interfaces/IResourceManager.md).[`numResources`](../../../interfaces/IResourceManager.md#numresources)

***

### qualifiers

#### Get Signature

> **get** **qualifiers**(): [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md)

A [ReadOnlyQualifierCollector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) which
contains the [qualifiers](../../../classes/Qualifier.md) used in this collection.

##### Returns

[`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md)

***

### qualifierTypes

#### Get Signature

> **get** **qualifierTypes**(): [`ReadOnlyQualifierTypeCollector`](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md)

A [ReadOnlyQualifierTypeCollector](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) which
contains the [qualifier types](../../../classes/QualifierType.md) used in this collection.

##### Returns

[`ReadOnlyQualifierTypeCollector`](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md)

***

### resourceIds

#### Get Signature

> **get** **resourceIds**(): readonly [`ResourceId`](../../../type-aliases/ResourceId.md)[]

The resource IDs contained in this compiled resource collection.

##### Returns

readonly [`ResourceId`](../../../type-aliases/ResourceId.md)[]

The resource IDs that this resource manager can resolve.

#### Implementation of

[`IResourceManager`](../../../interfaces/IResourceManager.md).[`resourceIds`](../../../interfaces/IResourceManager.md#resourceids)

***

### resourceTypes

#### Get Signature

> **get** **resourceTypes**(): [`ReadOnlyResourceTypeCollector`](../../ResourceTypes/type-aliases/ReadOnlyResourceTypeCollector.md)

A [ResourceTypeCollector](../../ResourceTypes/classes/ResourceTypeCollector.md) which
contains the [resource types](../../../classes/ResourceType.md) used in this collection.

##### Returns

[`ReadOnlyResourceTypeCollector`](../../ResourceTypes/type-aliases/ReadOnlyResourceTypeCollector.md)

## Methods

### getBuiltResource()

> **getBuiltResource**(`id`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IResource`](../interfaces/IResource.md)\>

Gets a built resource by ID for runtime resolution.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The resource identifier |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IResource`](../interfaces/IResource.md)\>

Success with the runtime resource if found, Failure otherwise

#### Implementation of

[`IResourceManager`](../../../interfaces/IResourceManager.md).[`getBuiltResource`](../../../interfaces/IResourceManager.md#getbuiltresource)

***

### getBuiltResourceTree()

> **getBuiltResourceTree**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ReadOnlyResourceTreeRoot`](../namespaces/ResourceTree/classes/ReadOnlyResourceTreeRoot.md)\<[`IResource`](../interfaces/IResource.md)\>\>

Gets a resource tree built from the resources in this collection.
The tree provides hierarchical access to resources based on their ResourceId structure.
For example, resources with IDs like "app.messages.welcome" create a tree structure
where "app" and "messages" are branch nodes, and "welcome" is a leaf containing the resource.

String-based validation is available through the `children.validating` property,
allowing callers to use `tree.children.validating.getById(stringId)` for validated access.

Uses lazy initialization with caching for performance.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ReadOnlyResourceTreeRoot`](../namespaces/ResourceTree/classes/ReadOnlyResourceTreeRoot.md)\<[`IResource`](../interfaces/IResource.md)\>\>

Result containing the resource tree root, or failure if tree construction fails

#### Implementation of

[`IResourceManager`](../../../interfaces/IResourceManager.md).[`getBuiltResourceTree`](../../../interfaces/IResourceManager.md#getbuiltresourcetree)

***

### validateContext()

> **validateContext**(`context`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md)\>

Validates a context declaration against the qualifiers managed by this resource manager.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IContextDecl`](../../Context/type-aliases/IContextDecl.md) | The context declaration to validate |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md)\>

Success with the validated context if successful, Failure otherwise

#### Implementation of

[`IResourceManager`](../../../interfaces/IResourceManager.md).[`validateContext`](../../../interfaces/IResourceManager.md#validatecontext)

***

### create()

> `static` **create**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CompiledResourceCollection`\>

Creates a new CompiledResourceCollection object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICompiledResourceCollectionCreateParams`](../interfaces/ICompiledResourceCollectionCreateParams.md) | Parameters to create a new CompiledResourceCollection. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CompiledResourceCollection`\>

`Success` with the new CompiledResourceCollection object if successful,
or `Failure` with an error message if not.
