[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IEntityDescriptor

# Interface: IEntityDescriptor\<TEntity, TId\>

Describes how to extract display properties from an entity.
Consuming apps provide this to configure the list for their entity types.

## Extended by

- [`IEntityGroupDescriptor`](IEntityGroupDescriptor.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEntity` | - |
| `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="getid"></a> `getId` | `readonly` | (`entity`) => `TId` | Extract the unique ID from an entity |
| <a id="getlabel"></a> `getLabel` | `readonly` | (`entity`) => `string` | Extract the primary display label |
| <a id="getstatus"></a> `getStatus?` | `readonly` | (`entity`) => [`IEntityStatus`](IEntityStatus.md) \| `undefined` | Extract an optional status badge or indicator |
| <a id="getsublabel"></a> `getSublabel?` | `readonly` | (`entity`) => `string` \| `undefined` | Extract an optional secondary line (subtitle, description) |
