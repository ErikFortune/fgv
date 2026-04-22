[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / IResourceManager

# Interface: IResourceManager\<TR\>

Interface defining the read-only properties that the runtime resource resolver needs
from a resource manager. This abstraction allows the runtime to work with different
implementations without requiring the full ResourceManagerBuilder build mechanics.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TR` *extends* [`IResource`](../namespaces/Runtime/interfaces/IResource.md) | [`IResource`](../namespaces/Runtime/interfaces/IResource.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="builtresources"></a> `builtResources` | `readonly` | [`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceId`](../type-aliases/ResourceId.md), `TR`\> | A read-only result map of all built resources, keyed by resource ID. Resources are built on-demand when accessed and returns Results for error handling. |
| <a id="conditions"></a> `conditions` | `readonly` | [`ReadOnlyConditionCollector`](../namespaces/Conditions/type-aliases/ReadOnlyConditionCollector.md) | A [ReadOnlyConditionCollector](../namespaces/Conditions/type-aliases/ReadOnlyConditionCollector.md) which contains the [conditions](../classes/Condition.md) used by resource candidates. |
| <a id="conditionsets"></a> `conditionSets` | `readonly` | [`ReadOnlyConditionSetCollector`](../namespaces/Conditions/type-aliases/ReadOnlyConditionSetCollector.md) | A [ReadOnlyConditionSetCollector](../namespaces/Conditions/type-aliases/ReadOnlyConditionSetCollector.md) which contains the [condition sets](../namespaces/Conditions/classes/ConditionSet.md) used by resource candidates. |
| <a id="decisions"></a> `decisions` | `readonly` | [`ReadOnlyAbstractDecisionCollector`](../namespaces/Decisions/type-aliases/ReadOnlyAbstractDecisionCollector.md) | A [ReadOnlyAbstractDecisionCollector](../namespaces/Decisions/type-aliases/ReadOnlyAbstractDecisionCollector.md) which contains the [abstract decisions](../classes/Decision.md) used by resource candidates. |
| <a id="numcandidates"></a> `numCandidates` | `readonly` | `number` | The number of candidates in this resource manager. |
| <a id="numresources"></a> `numResources` | `readonly` | `number` | The number of resources in this resource manager. |
| <a id="resourceids"></a> `resourceIds` | `readonly` | readonly [`ResourceId`](../type-aliases/ResourceId.md)[] | The resource IDs that this resource manager can resolve. |

## Methods

### getBuiltResource()

> **getBuiltResource**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TR`\>

Gets a built resource by ID for runtime resolution.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The resource identifier |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TR`\>

Success with the runtime resource if found, Failure otherwise

***

### getBuiltResourceTree()

> **getBuiltResourceTree**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeRoot`](../namespaces/Runtime/namespaces/ResourceTree/interfaces/IReadOnlyResourceTreeRoot.md)\<`TR`\>\>

Gets a resource tree built from the resources in this resource manager.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeRoot`](../namespaces/Runtime/namespaces/ResourceTree/interfaces/IReadOnlyResourceTreeRoot.md)\<`TR`\>\>

Result containing the resource tree root, or failure if tree construction fails

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
