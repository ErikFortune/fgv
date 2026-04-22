[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResourceTools](../README.md) / IResourceEditorFactory

# Interface: IResourceEditorFactory\<T, TV\>

Factory interface for creating type-specific resource editors.
Allows ResolutionView to provide custom editing experiences for different resource types.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
| `TV` *extends* [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> | [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |

## Methods

### createEditor()

> **createEditor**(`resourceId`, `resourceType`, `value`): [`ResourceEditorResult`](../type-aliases/ResourceEditorResult.md)\<`T`, `TV`\>

Attempts to create a resource editor for the given resource.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resourceId` | `string` | The ID of the resource to edit |
| `resourceType` | `string` | The type/key of the resource |
| `value` | `TV` | The current value of the resource |

#### Returns

[`ResourceEditorResult`](../type-aliases/ResourceEditorResult.md)\<`T`, `TV`\>

ResourceEditorResult indicating success/failure and the editor component or error message
