[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / ResourceCandidate

# Class: ResourceCandidate

A resource candidate represents a single possible
instance value for some resource, with the conditions under which it applies
and instructions on how to merge it with other instances.

## Implements

- [`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md)

## Constructors

### Constructor

> `protected` **new ResourceCandidate**(`params`): `ResourceCandidate`

Constructor for a ResourceCandidate object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceCandidateCreateParams`](../namespaces/Resources/interfaces/IResourceCandidateCreateParams.md) | Parameters to create a new ResourceCandidate. |

#### Returns

`ResourceCandidate`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="candidatevalue"></a> `candidateValue` | `readonly` | [`CandidateValue`](../namespaces/Resources/classes/CandidateValue.md) | The candidate value that contains the JSON representation of the instance data. |
| <a id="conditions"></a> `conditions` | `readonly` | [`ConditionSet`](../namespaces/Conditions/classes/ConditionSet.md) | The conditions under which this candidate applies. |
| <a id="id"></a> `id` | `readonly` | [`ResourceId`](../type-aliases/ResourceId.md) | The unique identifier of the resource for which this candidate is a possible instance. |
| <a id="ispartial"></a> `isPartial` | `readonly` | `boolean` | True if this candidate is a partial instance. |
| <a id="mergemethod"></a> `mergeMethod` | `readonly` | [`ResourceValueMergeMethod`](../type-aliases/ResourceValueMergeMethod.md) | The method to use when merging this candidate with other instances. |
| <a id="resourcetype"></a> `resourceType` | `readonly` | [`ResourceType`](ResourceType.md)\<`unknown`\> \| `undefined` | The [resource type](ResourceType.md) for the resource to which this candidate belongs. |

## Accessors

### completeness

#### Get Signature

> **get** **completeness**(): [`CandidateCompleteness`](../type-aliases/CandidateCompleteness.md)

The completeness of the candidate value.

##### Returns

[`CandidateCompleteness`](../type-aliases/CandidateCompleteness.md)

***

### json

#### Get Signature

> **get** **json**(): [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The JSON representation of the instance data to be applied.

##### Remarks

This property provides access to the JSON data from the underlying candidate value.

##### Returns

[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The JSON value for this candidate

#### Implementation of

[`IResourceCandidate`](../namespaces/Runtime/interfaces/IResourceCandidate.md).[`json`](../namespaces/Runtime/interfaces/IResourceCandidate.md#json)

## Methods

### canMatchPartialContext()

> **canMatchPartialContext**(`context`, `options?`): `boolean`

Determines if this candidate can match the supplied context (possibly partial).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The context to match. |
| `options?` | [`IContextMatchOptions`](../namespaces/Context/interfaces/IContextMatchOptions.md) | Options to use when matching. |

#### Returns

`boolean`

`true` if the candidate can match the context, `false` otherwise.

***

### toChildResourceCandidateDecl()

> **toChildResourceCandidateDecl**(`options?`): [`IChildResourceCandidateDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)

Gets the [child resource candidate declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)
for this candidate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ICandidateDeclOptions`](../namespaces/Resources/interfaces/ICandidateDeclOptions.md) | [options](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) to use when creating the declaration. |

#### Returns

[`IChildResourceCandidateDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)

The [child resource candidate declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md).

***

### toLooseResourceCandidateDecl()

> **toLooseResourceCandidateDecl**(`options?`): [`ILooseResourceCandidateDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md)

Gets the [loose resource candidate declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md)
for this candidate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ICandidateDeclOptions`](../namespaces/Resources/interfaces/ICandidateDeclOptions.md) | [options](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) to use when creating the declaration. |

#### Returns

[`ILooseResourceCandidateDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md)

The [loose resource candidate declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md).

***

### compare()

> `static` **compare**(`rc1`, `rc2`): `number`

Compares two ResourceCandidates for sorting purposes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rc1` | `ResourceCandidate` | The first candidate to compare. |
| `rc2` | `ResourceCandidate` | The second candidate to compare. |

#### Returns

`number`

A negative number if `rc1` should come before `rc2`, a positive number if `rc2` should come before `rc1`,
or zero if they are equivalent.

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceCandidate`\>

Creates a new ResourceCandidate object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceCandidateCreateParams`](../namespaces/Resources/interfaces/IResourceCandidateCreateParams.md) | Parameters to create a new ResourceCandidate. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceCandidate`\>

`Success` with the new ResourceCandidate object if successful,
or `Failure` with an error message if not.

***

### equal()

> `static` **equal**(`rc1`, `rc2`): `boolean`

Compares two ResourceCandidates for equality.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rc1` | `ResourceCandidate` | The first candidate to compare. |
| `rc2` | `ResourceCandidate` | The second candidate to compare. |

#### Returns

`boolean`

`true` if the candidates are equal, `false` otherwise.

***

### findReducibleQualifiers()

> `static` **findReducibleQualifiers**(`candidates`, `filterForContext`): `ReadonlySet`\<[`QualifierName`](../type-aliases/QualifierName.md)\> \| `undefined`

Finds the qualifiers that are made irrelevant by the supplied filterForContext.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidates` | readonly `ResourceCandidate`[] | The candidates to find the reducible qualifiers for. |
| `filterForContext` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The filter for context to use. |

#### Returns

`ReadonlySet`\<[`QualifierName`](../type-aliases/QualifierName.md)\> \| `undefined`

The qualifiers that are made irrelevant by the filterForContext.

#### Remarks

For any given set of candidates, qualifiers that match every candidate perfectly
are irrelevant to the filtered content and can be removed.  Qualifiers that do not
match, that are not in the filterForContext, or which partially match at least one
candidate remain relevant and must not be removed.

***

### validateResourceTypes()

> `static` **validateResourceTypes**(`candidates`, `expectedType?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceType`](ResourceType.md)\<`unknown`\> \| `undefined`\>

Extracts the [resource type](ResourceType.md) from a list of resource candidates,
if present.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidates` | readonly `ResourceCandidate`[] | The list of candidates from which to extract the resource type. |
| `expectedType?` | [`ResourceType`](ResourceType.md)\<`unknown`\> | - |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceType`](ResourceType.md)\<`unknown`\> \| `undefined`\>

`Success` with the resource type if successful, `Success` with `undefined` if none of the candidates
specify a resource tap, and `Failure` with an error message if clients specify conflicting resource types.
