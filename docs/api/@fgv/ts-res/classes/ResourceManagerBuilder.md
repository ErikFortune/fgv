[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / ResourceManagerBuilder

# Class: ResourceManagerBuilder

Builder for a collection of [resources](Resource.md). Collects
[candidates](ResourceCandidate.md) for each resource into a
[ResourceBuilder](../namespaces/Resources/classes/ResourceBuilder.md) per resource, validates them against each other,
and builds a collection of [resources](Resource.md) once all candidates are collected.

## Implements

- [`IResourceManager`](../interfaces/IResourceManager.md)\<[`Resource`](Resource.md)\>

## Constructors

### Constructor

> `protected` **new ResourceManagerBuilder**(`params`): `ResourceManagerBuilder`

Constructor for a ResourceManagerBuilder object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceManagerBuilderCreateParams`](../namespaces/Resources/interfaces/IResourceManagerBuilderCreateParams.md) | Parameters to create a new ResourceManagerBuilder. |

#### Returns

`ResourceManagerBuilder`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_built"></a> `_built` | `protected` | `boolean` | **`Internal`** Whether the resources have been built. |
| <a id="_builtresources"></a> `_builtResources` | `readonly` | [`ValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), [`Resource`](Resource.md)\> | **`Internal`** The [resources](Resource.md) built by this resource manager. |
| <a id="_cachedresourcetree"></a> `_cachedResourceTree?` | `protected` | [`IReadOnlyResourceTreeRoot`](../namespaces/Runtime/namespaces/ResourceTree/interfaces/IReadOnlyResourceTreeRoot.md)\<[`Resource`](Resource.md)\> | **`Internal`** The cached resource tree for this resource manager. |
| <a id="_candidatevalues"></a> `_candidateValues` | `readonly` | [`CandidateValueCollector`](../namespaces/Resources/classes/CandidateValueCollector.md) | **`Internal`** The candidate value collector used by this resource manager. |
| <a id="_conditions"></a> `_conditions` | `readonly` | [`ConditionCollector`](../namespaces/Conditions/classes/ConditionCollector.md) | **`Internal`** The [condition collector](../namespaces/Conditions/classes/ConditionCollector.md) used by this resource manager. |
| <a id="_conditionsets"></a> `_conditionSets` | `readonly` | [`ConditionSetCollector`](../namespaces/Conditions/classes/ConditionSetCollector.md) | **`Internal`** The [condition set collector](../namespaces/Conditions/classes/ConditionSetCollector.md) used by this resource manager. |
| <a id="_decisions"></a> `_decisions` | `readonly` | [`AbstractDecisionCollector`](../namespaces/Decisions/classes/AbstractDecisionCollector.md) | **`Internal`** The [abstract decision collector](../namespaces/Decisions/classes/AbstractDecisionCollector.md) used by this resource manager. |
| <a id="_numcandidates"></a> `_numCandidates?` | `protected` | `number` | The number of candidates in this resource manager. |
| <a id="_resources"></a> `_resources` | `readonly` | [`ValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), [`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md)\> | **`Internal`** The [resource builders](../namespaces/Resources/classes/ResourceBuilder.md) used by this resource manager. |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../namespaces/Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifiers](../namespaces/Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used by this resource manager. |
| <a id="resourcetypes"></a> `resourceTypes` | `readonly` | [`ReadOnlyResourceTypeCollector`](../namespaces/ResourceTypes/type-aliases/ReadOnlyResourceTypeCollector.md) | The [resource types](../namespaces/ResourceTypes/type-aliases/ReadOnlyResourceTypeCollector.md) used by this resource manager. |

## Accessors

### builtResources

#### Get Signature

> **get** **builtResources**(): [`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), [`Resource`](Resource.md)\>

A read-only result map of all built resources, keyed by resource ID.
Resources are built on-demand when accessed and returns Results for error handling.

##### Returns

[`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), [`Resource`](Resource.md)\>

A read-only result map of all built resources, keyed by resource ID.
Resources are built on-demand when accessed and returns Results for error handling.

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`builtResources`](../interfaces/IResourceManager.md#builtresources)

***

### conditions

#### Get Signature

> **get** **conditions**(): [`ReadOnlyConditionCollector`](../namespaces/Conditions/type-aliases/ReadOnlyConditionCollector.md)

A [ConditionCollector](../namespaces/Conditions/classes/ConditionCollector.md) which
contains the [conditions](Condition.md) used so far by
the [resource candidates](ResourceCandidate.md) in this manager.

##### Returns

[`ReadOnlyConditionCollector`](../namespaces/Conditions/type-aliases/ReadOnlyConditionCollector.md)

A [ReadOnlyConditionCollector](../namespaces/Conditions/type-aliases/ReadOnlyConditionCollector.md) which
contains the [conditions](Condition.md) used by resource candidates.

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`conditions`](../interfaces/IResourceManager.md#conditions)

***

### conditionSets

#### Get Signature

> **get** **conditionSets**(): [`ReadOnlyConditionSetCollector`](../namespaces/Conditions/type-aliases/ReadOnlyConditionSetCollector.md)

A [ConditionSetCollector](../namespaces/Conditions/classes/ConditionSetCollector.md) which
contains the [condition sets](../namespaces/Conditions/classes/ConditionSet.md) used so far by
the [resource candidates](ResourceCandidate.md) in this manager.

##### Returns

[`ReadOnlyConditionSetCollector`](../namespaces/Conditions/type-aliases/ReadOnlyConditionSetCollector.md)

A [ReadOnlyConditionSetCollector](../namespaces/Conditions/type-aliases/ReadOnlyConditionSetCollector.md) which
contains the [condition sets](../namespaces/Conditions/classes/ConditionSet.md) used by resource candidates.

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`conditionSets`](../interfaces/IResourceManager.md#conditionsets)

***

### decisions

#### Get Signature

> **get** **decisions**(): [`ReadOnlyAbstractDecisionCollector`](../namespaces/Decisions/type-aliases/ReadOnlyAbstractDecisionCollector.md)

A [AbstractDecisionCollector](../namespaces/Decisions/classes/AbstractDecisionCollector.md) which
contains the [abstract decisions](Decision.md) used so far by
the [resource candidates](ResourceCandidate.md) in this manager.

##### Returns

[`ReadOnlyAbstractDecisionCollector`](../namespaces/Decisions/type-aliases/ReadOnlyAbstractDecisionCollector.md)

A [ReadOnlyAbstractDecisionCollector](../namespaces/Decisions/type-aliases/ReadOnlyAbstractDecisionCollector.md) which
contains the [abstract decisions](Decision.md) used by resource candidates.

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`decisions`](../interfaces/IResourceManager.md#decisions)

***

### numCandidates

#### Get Signature

> **get** **numCandidates**(): `number`

The number of candidates in this resource manager.

##### Returns

`number`

The number of candidates in this resource manager.

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`numCandidates`](../interfaces/IResourceManager.md#numcandidates)

***

### numResources

#### Get Signature

> **get** **numResources**(): `number`

The number of resources in this resource manager.

##### Returns

`number`

The number of resources in this resource manager.

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`numResources`](../interfaces/IResourceManager.md#numresources)

***

### qualifierTypes

#### Get Signature

> **get** **qualifierTypes**(): [`ReadOnlyQualifierTypeCollector`](../namespaces/QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md)

The [qualifier types](../namespaces/QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) used by this resource manager.

##### Returns

[`ReadOnlyQualifierTypeCollector`](../namespaces/QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md)

***

### resourceIds

#### Get Signature

> **get** **resourceIds**(): readonly [`ResourceId`](../type-aliases/ResourceId.md)[]

The resource IDs that this resource manager can resolve.

##### Returns

readonly [`ResourceId`](../type-aliases/ResourceId.md)[]

The resource IDs that this resource manager can resolve.

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`resourceIds`](../interfaces/IResourceManager.md#resourceids)

***

### resources

#### Get Signature

> **get** **resources**(): [`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), [`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md)\>

A read-only map of [resource builders](../namespaces/Resources/classes/ResourceBuilder.md) used by the manager.

##### Returns

[`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), [`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md)\>

***

### size

#### Get Signature

> **get** **size**(): `number`

The number of [resources](Resource.md) contained by the manager.

##### Returns

`number`

## Methods

### \_performBuild()

> **\_performBuild**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), [`Resource`](Resource.md)\>\>

**`Internal`**

Internal helper method that performs the actual building of resources.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), [`Resource`](Resource.md)\>\>

`Success` with the built resources if all resources were built successfully, `Failure` otherwise.

***

### addCondition()

> **addCondition**(`decl`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Condition`](Condition.md)\>

Adds a condition to the manager.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`ILooseConditionDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md) | The condition declaration to add. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Condition`](Condition.md)\>

`Success` with the condition if successful, or `Failure` with an error message if not.

***

### addConditionSet()

> **addConditionSet**(`conditions`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSet`](../namespaces/Conditions/classes/ConditionSet.md)\>

Adds a condition set to the manager.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `conditions` | [`ConditionSetDecl`](../namespaces/ResourceJson/namespaces/Normalized/type-aliases/ConditionSetDecl.md) | The [condition set declaration](../namespaces/ResourceJson/namespaces/Normalized/type-aliases/ConditionSetDecl.md) to add. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSet`](../namespaces/Conditions/classes/ConditionSet.md)\>

`Success` with the condition set if successful, or `Failure` with an error message if not.

***

### addLooseCandidate()

> **addLooseCandidate**(`decl`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceCandidate`](ResourceCandidate.md), [`ResourceBuilderResultDetail`](../namespaces/Resources/type-aliases/ResourceBuilderResultDetail.md)\>

Given a [resource candidate declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md), builds and adds
a [candidate](ResourceCandidate.md) to the manager.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`ILooseResourceCandidateDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md) | The [loose resource candidate declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md) to add. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceCandidate`](ResourceCandidate.md), [`ResourceBuilderResultDetail`](../namespaces/Resources/type-aliases/ResourceBuilderResultDetail.md)\>

`Success` with the candidate if successful, or `Failure` with an error message if not.

***

### addResource()

> **addResource**(`decl`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md), [`ResourceBuilderResultDetail`](../namespaces/Resources/type-aliases/ResourceBuilderResultDetail.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `decl` | [`ILooseResourceDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md) |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md), [`ResourceBuilderResultDetail`](../namespaces/Resources/type-aliases/ResourceBuilderResultDetail.md)\>

***

### build()

> **build**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

Builds the [resources](Resource.md) from the collected [candidates](ResourceCandidate.md).

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

`Success` with the ResourceManagerBuilder object if successful,
or `Failure` with an error message if not.

***

### clone()

> **clone**(`options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

Creates a clone of this ResourceManagerBuilder with optional configuration overrides.
This method creates a new ResourceManagerBuilder that can optionally use different
qualifiers and/or resource types than the original. It can also be filtered to include
only candidates that match the provided context and apply candidate edits.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IResourceManagerCloneOptions`](../namespaces/Resources/interfaces/IResourceManagerCloneOptions.md) | Options for the cloning operation: - `qualifiers`: Optional qualifier collector to use instead of the original - `resourceTypes`: Optional resource type collector to use instead of the original - `filterForContext`: Optional context filter for candidates - `candidates`: Optional candidate edits to apply during cloning |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

A Result containing the new ResourceManagerBuilder with the specified configuration.

***

### getAllBuiltCandidates()

> **getAllBuiltCandidates**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ResourceCandidate`](ResourceCandidate.md)[]\>

Gets a read-only array of all [built resources](Resource.md) in the manager.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ResourceCandidate`](ResourceCandidate.md)[]\>

`Success` with an array of resources if successful, or `Failure` with an error message if not.

***

### getAllBuiltResources()

> **getAllBuiltResources**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`Resource`](Resource.md)[]\>

Gets a read-only array of all [built resources](Resource.md) in the manager.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`Resource`](Resource.md)[]\>

`Success` with an array of resources if successful, or `Failure` with an error message if not.

***

### getAllCandidates()

> **getAllCandidates**(): readonly [`ResourceCandidate`](ResourceCandidate.md)[]

Gets a read-only array of all [resource candidates](ResourceCandidate.md) present in the manager.

#### Returns

readonly [`ResourceCandidate`](ResourceCandidate.md)[]

***

### getAllResources()

> **getAllResources**(): readonly [`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md)[]

Gets a read-only array of all [resource builders](../namespaces/Resources/classes/ResourceBuilder.md) present in the manager.

#### Returns

readonly [`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md)[]

`Success` with the [resource builder](../namespaces/Resources/classes/ResourceBuilder.md) if successful,
or `Failure` with an error message if not.

***

### getBuiltCandidatesForContext()

> **getBuiltCandidatesForContext**(`context`, `options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ResourceCandidate`](ResourceCandidate.md)[]\>

Gets a read-only array of all [built resource candidates](ResourceCandidate.md) that can match the supplied context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The [context](../namespaces/Context/type-aliases/IValidatedContextDecl.md) to match against. |
| `options?` | [`IContextMatchOptions`](../namespaces/Context/interfaces/IContextMatchOptions.md) | [options](../namespaces/Context/interfaces/IContextMatchOptions.md) for the context match. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ResourceCandidate`](ResourceCandidate.md)[]\>

`Success` with an array of [candidates](ResourceCandidate.md) if successful, or `Failure` with an error message if not.

***

### getBuiltResource()

> **getBuiltResource**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Resource`](Resource.md)\>

Gets an individual [built resource](Resource.md) from the manager.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The [id](../type-aliases/ResourceId.md) of the resource to get. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Resource`](Resource.md)\>

`Success` with the resource if successful, or `Failure` with an error message if not.

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`getBuiltResource`](../interfaces/IResourceManager.md#getbuiltresource)

***

### getBuiltResourcesForContext()

> **getBuiltResourcesForContext**(`context`, `options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`Resource`](Resource.md)[]\>

Gets a read-only array of all [built resources](Resource.md) that have at least one candidate
that can match the supplied context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The [context](../namespaces/Context/type-aliases/IValidatedContextDecl.md) to match against. |
| `options?` | [`IContextMatchOptions`](../namespaces/Context/interfaces/IContextMatchOptions.md) | [options](../namespaces/Context/interfaces/IContextMatchOptions.md) for the context match. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`Resource`](Resource.md)[]\>

`Success` with an array of [resources](Resource.md) if successful, or `Failure` with an error message if not.

***

### getBuiltResourceTree()

> **getBuiltResourceTree**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeRoot`](../namespaces/Runtime/namespaces/ResourceTree/interfaces/IReadOnlyResourceTreeRoot.md)\<[`Resource`](Resource.md)\>\>

Builds and returns a hierarchical tree representation of all resources managed by this builder.
Resources are organized based on their dot-separated resource IDs (e.g., "app.messages.welcome"
becomes a tree with "app" as root, "messages" as branch, and "welcome" as leaf).

String-based validation is available through the `children.validating` property,
allowing callers to use `tree.children.validating.getById(stringId)` for validated access.

Uses lazy initialization with caching for performance.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeRoot`](../namespaces/Runtime/namespaces/ResourceTree/interfaces/IReadOnlyResourceTreeRoot.md)\<[`Resource`](Resource.md)\>\>

Result containing the resource tree root, or failure if tree construction fails

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`getBuiltResourceTree`](../interfaces/IResourceManager.md#getbuiltresourcetree)

***

### getCandidatesForContext()

> **getCandidatesForContext**(`context`, `options?`): readonly [`ResourceCandidate`](ResourceCandidate.md)[]

Gets a read-only array of all [resource candidates](ResourceCandidate.md) that can match the supplied context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The [context](../namespaces/Context/type-aliases/IValidatedContextDecl.md) to match against. |
| `options?` | [`IContextMatchOptions`](../namespaces/Context/interfaces/IContextMatchOptions.md) | [options](../namespaces/Context/interfaces/IContextMatchOptions.md) for the context match. |

#### Returns

readonly [`ResourceCandidate`](ResourceCandidate.md)[]

A read-only array of [candidates](ResourceCandidate.md) that can match the context.

***

### getCompiledResourceCollection()

> **getCompiledResourceCollection**(`options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICompiledResourceCollection`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceCollection.md)\>

Gets a compiled resource collection from the current state of the resource manager builder.
This method generates an optimized, index-based representation of all resources, conditions,
and decisions that can be used for serialization or efficient runtime processing.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ICompiledResourceOptions`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceOptions.md) | Optional compilation options controlling the output format. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICompiledResourceCollection`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceCollection.md)\>

Success with the compiled resource collection if successful, Failure otherwise.

***

### getResourceCollectionDecl()

> **getResourceCollectionDecl**(`options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceCollectionDecl`](../namespaces/ResourceJson/namespaces/Normalized/interfaces/IResourceCollectionDecl.md)\>

Gets a resource collection declaration containing all built resources in a flat array structure.
This method returns all built resources as an [IResourceCollectionDecl](../namespaces/ResourceJson/namespaces/Normalized/interfaces/IResourceCollectionDecl.md)
that can be used for serialization, export, or re-import. Resources are sorted by ID for consistent ordering.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IResourceDeclarationOptions`](../namespaces/Resources/interfaces/IResourceDeclarationOptions.md) | Optional [declaration options](../namespaces/Resources/interfaces/IResourceDeclarationOptions.md) controlling the output format. If `options.normalized` is `true`, applies hash-based normalization for additional consistency guarantees. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceCollectionDecl`](../namespaces/ResourceJson/namespaces/Normalized/interfaces/IResourceCollectionDecl.md)\>

Success with the resource collection declaration if successful, Failure otherwise.

***

### getResourcesForContext()

> **getResourcesForContext**(`context`, `options?`): readonly [`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md)[]

Gets a read-only array of all [resource builders](../namespaces/Resources/classes/ResourceBuilder.md) that have at least one candidate
that can match the supplied context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The [context](../namespaces/Context/type-aliases/IValidatedContextDecl.md) to match against. |
| `options?` | [`IContextMatchOptions`](../namespaces/Context/interfaces/IContextMatchOptions.md) | [options](../namespaces/Context/interfaces/IContextMatchOptions.md) for the context match. |

#### Returns

readonly [`ResourceBuilder`](../namespaces/Resources/classes/ResourceBuilder.md)[]

A read-only array of [resource builders](../namespaces/Resources/classes/ResourceBuilder.md) with matching candidates.

***

### validateContext()

> **validateContext**(`context`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md)\>

Validates a context declaration against the qualifiers managed by this resource manager.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IContextDecl`](../namespaces/Context/type-aliases/IContextDecl.md) | The context declaration to validate |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md)\>

Success with the validated context if successful, Failure otherwise

#### Implementation of

[`IResourceManager`](../interfaces/IResourceManager.md).[`validateContext`](../interfaces/IResourceManager.md#validatecontext)

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

Creates a new ResourceManagerBuilder object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceManagerBuilderCreateParams`](../namespaces/Resources/interfaces/IResourceManagerBuilderCreateParams.md) | Parameters to create a new ResourceManagerBuilder. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

`Success` with the new ResourceManagerBuilder object if successful,
or `Failure` with an error message if not.

***

### createFromCompiledResourceCollection()

> `static` **createFromCompiledResourceCollection**(`compiledCollection`, `systemConfig`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

Creates a new ResourceManagerBuilder from a
[compiled resource collection](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceCollection.md).
This method reconstructs an exactly equivalent builder where all qualifier, condition,
condition set, and decision indices match the original compiled collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `compiledCollection` | [`ICompiledResourceCollection`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceCollection.md) | The compiled resource collection to reconstruct from. |
| `systemConfig` | [`SystemConfiguration`](../namespaces/Config/classes/SystemConfiguration.md) | The system configuration containing qualifiers and resource types. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

`Success` with the new manager if successful, or `Failure` with an error message if not.

***

### createPredefined()

> `static` **createPredefined**(`name`, `qualifierDefaultValues?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

Creates a new ResourceManagerBuilder object from a predefined system configuration.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`PredefinedSystemConfiguration`](../namespaces/Config/type-aliases/PredefinedSystemConfiguration.md) | The name of the predefined system configuration to use. |
| `qualifierDefaultValues?` | `Record`\<`string`, `string` \| `null`\> | Optional default values for qualifiers. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceManagerBuilder`\>

`Success` with the new ResourceManagerBuilder object if successful,
or `Failure` with an error message if not.
