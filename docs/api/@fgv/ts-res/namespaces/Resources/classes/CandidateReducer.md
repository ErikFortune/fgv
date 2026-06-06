[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / CandidateReducer

# Class: CandidateReducer

Manages candidate reduction logic for filtering and qualifier reduction operations.
Encapsulates the state and logic needed to consistently process candidates for reduction.

## Constructors

### Constructor

> **new CandidateReducer**(`candidates`, `filterForContext`): `CandidateReducer`

Constructor for CandidateReducer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidates` | readonly [`ResourceCandidate`](../../../classes/ResourceCandidate.md)[] | The set of candidates to potentially reduce |
| `filterForContext` | [`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md) | Context to filter candidates against |

#### Returns

`CandidateReducer`

## Methods

### reduceCandidate()

> **reduceCandidate**(`candidate`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReducedCandidate`](../interfaces/IReducedCandidate.md) \| `undefined`\>

Reduces a single candidate according to the configured reduction rules.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidate` | [`ResourceCandidate`](../../../classes/ResourceCandidate.md) | The candidate to reduce |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReducedCandidate`](../interfaces/IReducedCandidate.md) \| `undefined`\>

Either a reduced candidate declaration or an error if the candidate is not found

***

### reduceToChildResourceCandidateDecls()

> `static` **reduceToChildResourceCandidateDecls**(`candidates`, `filterForContext?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IChildResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)[]\>

Static convenience method to construct an array of properly reduced
[child resource candidate declarations](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)
from a set of [resource candidates](../../../classes/ResourceCandidate.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidates` | readonly [`ResourceCandidate`](../../../classes/ResourceCandidate.md)[] | The candidates to reduce |
| `filterForContext?` | [`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md) | Optional context to filter against |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IChildResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)[]\>

Result with array of reduced candidate declarations, or Failure if reduction fails

***

### reduceToLooseResourceCandidateDecls()

> `static` **reduceToLooseResourceCandidateDecls**(`id`, `candidates`, `filterForContext?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md)[]\>

Static convenience method to construct an array of properly reduced
[loose resource candidate declarations](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md)
from a set of [resource candidates](../../../classes/ResourceCandidate.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`ResourceId`](../../../type-aliases/ResourceId.md) | The id of the resource |
| `candidates` | readonly [`ResourceCandidate`](../../../classes/ResourceCandidate.md)[] | The candidates to reduce |
| `filterForContext?` | [`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md) | Optional context to filter against |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md)[]\>

Result with array of reduced candidate declarations, or Failure if reduction fails
