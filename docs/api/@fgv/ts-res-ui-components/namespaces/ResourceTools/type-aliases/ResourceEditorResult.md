[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResourceTools](../README.md) / ResourceEditorResult

# Type Alias: ResourceEditorResult\<T, TV\>

> **ResourceEditorResult**\<`T`, `TV`\> = \{ `editor`: `React.ComponentType`\<[`IResourceEditorProps`](../interfaces/IResourceEditorProps.md)\<`T`, `TV`\>\>; `success`: `true`; \} \| \{ `message?`: `string`; `success`: `false`; \}

Result of attempting to create a resource editor for a specific resource.
Used by ResourceEditorFactory to provide type-specific editors.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
| `TV` *extends* [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> | [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |

## Type Declaration

\{ `editor`: `React.ComponentType`\<[`IResourceEditorProps`](../interfaces/IResourceEditorProps.md)\<`T`, `TV`\>\>; `success`: `true`; \}

| Name | Type | Description |
| ------ | ------ | ------ |
| `editor` | `React.ComponentType`\<[`IResourceEditorProps`](../interfaces/IResourceEditorProps.md)\<`T`, `TV`\>\> | The React component to render for editing this resource |
| `success` | `true` | Indicates whether the factory was able to create an editor for the resource |

\{ `message?`: `string`; `success`: `false`; \}

| Name | Type | Description |
| ------ | ------ | ------ |
| `message?` | `string` | Optional message explaining why no editor could be created |
| `success` | `false` | Indicates the factory could not create an editor for this resource |
