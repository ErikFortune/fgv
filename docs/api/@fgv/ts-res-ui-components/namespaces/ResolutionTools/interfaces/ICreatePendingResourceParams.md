[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / ICreatePendingResourceParams

# Interface: ICreatePendingResourceParams\<T, TV\>

Parameters for creating a pending resource atomically.

## Example

```typescript
const params: ICreatePendingResourceParams = {
  id: 'platform.languages.az-AZ',
  resourceTypeName: 'json',
  json: { text: 'Welcome', locale: 'az-AZ' }
};
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
| `TV` *extends* [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> | [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | Full resource ID (e.g., 'platform.languages.az-AZ') - must be unique |
| <a id="json"></a> `json?` | `TV` | JSON content for the resource candidate. If undefined, the resource type's base template will be used. |
| <a id="resourcetypename"></a> `resourceTypeName` | `string` | Name of the resource type to use for validation and template creation |
