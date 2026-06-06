[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / ResourceBuilder

# Class: ResourceBuilder

Represents a builder for a single logical [resource](../../../classes/Resource.md).  Collects candidates
with a common resource ID, validates them against each other and builds a [resource](../../../classes/Resource.md)
object once all candidates are collected.

## Constructors

### Constructor

> `protected` **new ResourceBuilder**(`params`): `ResourceBuilder`

Constructor for a ResourceBuilder object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceBuilderCreateParams`](../interfaces/IResourceBuilderCreateParams.md) | Parameters to construct the new ResourceBuilder. |

#### Returns

`ResourceBuilder`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_candidates"></a> `_candidates` | `protected` | [`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, [`ResourceCandidate`](../../../classes/ResourceCandidate.md)\> | Map of [candidates](../../../classes/ResourceCandidate.md) for the resource being built. |
| <a id="_candidatevalues"></a> `_candidateValues` | `protected` | [`CandidateValueCollector`](CandidateValueCollector.md) | Collector for candidate values. |
| <a id="_conditionsets"></a> `_conditionSets` | `protected` | [`ConditionSetCollector`](../../Conditions/classes/ConditionSetCollector.md) | Common collector for [condition sets](../../Conditions/classes/ConditionSet.md). |
| <a id="_decisions"></a> `_decisions` | `protected` | [`AbstractDecisionCollector`](../../Decisions/classes/AbstractDecisionCollector.md) | Collector for [abstract decisions](../../Decisions/classes/AbstractDecision.md). |
| <a id="_resourcetype"></a> `_resourceType` | `protected` | [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\> \| `undefined` | The supplied or inferred [type](../../../classes/ResourceType.md) of the resource being built. |
| <a id="_resourcetypes"></a> `_resourceTypes` | `protected` | [`ReadOnlyResourceTypeCollector`](../../ResourceTypes/type-aliases/ReadOnlyResourceTypeCollector.md) | Map of all known [resource types](../../../classes/ResourceType.md). |
| <a id="id"></a> `id` | `readonly` | [`ResourceId`](../../../type-aliases/ResourceId.md) | The unique [id](../../../type-aliases/ResourceId.md) of the resource being built. |

## Accessors

### candidates

#### Get Signature

> **get** **candidates**(): readonly [`ResourceCandidate`](../../../classes/ResourceCandidate.md)[]

Array of [candidates](../../../classes/ResourceCandidate.md) for the resource being built.

##### Returns

readonly [`ResourceCandidate`](../../../classes/ResourceCandidate.md)[]

***

### resourceType

#### Get Signature

> **get** **resourceType**(): [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\> \| `undefined`

Supplied or inferred [type](../../../classes/ResourceType.md) of the resource being built.
If no type is supplied, the type will be inferred from the candidates - at least one candidate must
define resource type and all candidates must be of the same type.

##### Returns

[`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\> \| `undefined`

## Methods

### addChildCandidate()

> **addChildCandidate**(`childDecl`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceCandidate`](../../../classes/ResourceCandidate.md), [`ResourceBuilderResultDetail`](../type-aliases/ResourceBuilderResultDetail.md)\>

Given a [child resource candidate declaration](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md), creates and adds a
[candidate](../../../classes/ResourceCandidate.md) to the resource being built.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `childDecl` | [`IChildResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md) | The [IChildResourceCandidateDecl](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md) to add to the resource being built. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceCandidate`](../../../classes/ResourceCandidate.md), [`ResourceBuilderResultDetail`](../type-aliases/ResourceBuilderResultDetail.md)\>

`Success` with the added [candidate](../../../classes/ResourceCandidate.md) if successful,
or `Failure` with an error message if not.

***

### addLooseCandidate()

> **addLooseCandidate**(`decl`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceCandidate`](../../../classes/ResourceCandidate.md), [`ResourceBuilderResultDetail`](../type-aliases/ResourceBuilderResultDetail.md)\>

Given a [resource candidate declaration](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md), creates and adds a
[candidate](../../../classes/ResourceCandidate.md) to the resource being built.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`ILooseResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md) | The [IResourceCandidateDecl](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md) to add to the resource being built. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceCandidate`](../../../classes/ResourceCandidate.md), [`ResourceBuilderResultDetail`](../type-aliases/ResourceBuilderResultDetail.md)\>

`Success` with the added [candidate](../../../classes/ResourceCandidate.md) if successful,
or `Failure` with an error message if not. Fails with error detail 'type-mismatch' if the candidate
specifies a different resource type than previously added candidates, or with 'exists' if a candidate
already exists with the same conditions but different values.  Succeeds with 'exists' and returns the
existing candidate if the candidate to be added is identical to an existing candidate.

***

### build()

> **build**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Resource`](../../../classes/Resource.md)\>

Builds the [resource](../../../classes/Resource.md) object from this builder.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Resource`](../../../classes/Resource.md)\>

`Success` with the new [Resource](../../../classes/Resource.md) object if successful,
or `Failure` with an error message if not. Fails if no candidates have been added
or if the resource type is not defined.

***

### getCandidatesForContext()

> **getCandidatesForContext**(`context`, `options?`): readonly [`ResourceCandidate`](../../../classes/ResourceCandidate.md)[]

Gets the [candidates](../../../classes/ResourceCandidate.md) that match a given [context](../../Context/type-aliases/IValidatedContextDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md) | The [context](../../Context/type-aliases/IValidatedContextDecl.md) to get candidates for. |
| `options?` | [`IContextMatchOptions`](../../Context/interfaces/IContextMatchOptions.md) | Optional [context match options](../../Context/interfaces/IContextMatchOptions.md) to use when matching candidates. |

#### Returns

readonly [`ResourceCandidate`](../../../classes/ResourceCandidate.md)[]

An array of [candidates](../../../classes/ResourceCandidate.md) that match the given context.

***

### setResourceType()

> **setResourceType**(`resourceTypeName`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceBuilder`\>

Sets the resource type for the resource being built.  Fails if a resource type has already been set
and it does not match the new resource type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resourceTypeName` | `string` | The name of the resource type to set. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceBuilder`\>

`Success` with the updated ResourceBuilder object if successful,
or `Failure` with an error message if not.

***

### create()

> `static` **create**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceBuilder`\>

Creates a new ResourceBuilder object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceBuilderCreateParams`](../interfaces/IResourceBuilderCreateParams.md) | Parameters to create a new ResourceBuilder. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceBuilder`\>

`Success` with the new ResourceBuilder object if successful,
or `Failure` with an error message if not.
