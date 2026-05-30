[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Import](../README.md) / ImportContext

# Class: ImportContext

Class to accumulate context for a resource import operation.

## Implements

- [`IValidatedImportContext`](../interfaces/IValidatedImportContext.md)

## Constructors

### Constructor

> `protected` **new ImportContext**(`params`): `ImportContext`

Protected import context for derived classes.
Public consumers use [create](#create) to create new instances.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IImportContext`](../interfaces/IImportContext.md) | The [import context](../interfaces/IImportContext.md) parameters including the base ID and conditions to be applied to resources imported in this context. |

#### Returns

`ImportContext`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="baseid"></a> `baseId` | `readonly` | [`ResourceId`](../../../type-aliases/ResourceId.md) \| `undefined` | Base ID for the import context for resources imported in this context. |
| <a id="conditions"></a> `conditions` | `readonly` | readonly [`ILooseConditionDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md)[] | Conditions to be applied to resources imported in this context. |

## Methods

### extend()

> **extend**(`context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext`\>

Extends the import context with additional name segments and conditions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context?` | [`IValidatedImportContext`](../interfaces/IValidatedImportContext.md) | The [import context](../interfaces/IImportContext.md) to extend this context with. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext`\>

`Success` with a new import context
containing the extended context if successful, or `Failure` with an error
message if the operation fails.

***

### withConditions()

> **withConditions**(`conditions`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext`\>

Adds conditions to the import context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `conditions` | [`ILooseConditionDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md)[] | Conditions to be added to the import context. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext`\>

`Success` with a new import context containing the added conditions
if successful, or `Failure` with an error message if the operation fails.

***

### withName()

> **withName**(...`names`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext`\>

Appends names to the base ID of the import context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`names` | `string`[] | The name segments to append to the base ID. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext`\>

`Success` with a new import context containing the new base ID
if successful, or `Failure` with an error message if the operation fails.

***

### create()

> `static` **create**(`context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext`\>

Factory method to create a new import context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context?` | [`IImportContext`](../interfaces/IImportContext.md) | The [import context](../interfaces/IImportContext.md) to create the new context from. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext`\>

`Success` with the new import context
if successful, or `Failure` with an error message if creation fails.

***

### forContainerImport()

> `static` **forContainerImport**(`container?`, `importer?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext` \| `undefined`\>

Creates a new import context to import resources from a
container with the specified [container context declaration](../../ResourceJson/namespaces/Normalized/interfaces/IContainerContextDecl.md)e

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `container?` | [`IContainerContextDecl`](../../ResourceJson/namespaces/Normalized/interfaces/IContainerContextDecl.md) | The [container context declaration](../../ResourceJson/namespaces/Normalized/interfaces/IContainerContextDecl.md) to consider when creating the new context. |
| `importer?` | `ImportContext` | The base import context to adjust for the container context. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportContext` \| `undefined`\>

`Success` with the new import context if successful,
or `Failure` with an error message if the operation fails.

#### Remarks

A container context declaration may specify a merge method, which determines how the
container context is merged with the base context. The merge method can be one of the following:
- `augment`: The base context is augmented with the container context. This is the default behavior.
- `replace`: The base context is selectively replaced with the container context. If the container context
  specifies a base ID or conditions, the corresponding values in the base context are ignored.
- `delete`: The base context is deleted. This means that the container context is not used at all.
