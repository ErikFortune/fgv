[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IEntityGroupDescriptor

# Interface: IEntityGroupDescriptor\<TEntity, TId\>

Extends [IEntityDescriptor](IEntityDescriptor.md) with grouping support.

## Extends

- [`IEntityDescriptor`](IEntityDescriptor.md)\<`TEntity`, `TId`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEntity` | - |
| `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="comparegroups"></a> `compareGroups?` | `readonly` | (`a`, `b`) => `number` | Optional sort comparator for group ordering. Receives group keys. |
| <a id="getgroupkey"></a> `getGroupKey` | `readonly` | (`entity`) => `string` | Extract a group key from an entity. Entities with the same key are grouped together. |
| <a id="getgrouplabel"></a> `getGroupLabel` | `readonly` | (`entity`) => `string` | Extract a display label for a group. Called on the first entity in each group. |
| <a id="getid"></a> `getId` | `readonly` | (`entity`) => `TId` | Extract the unique ID from an entity |
| <a id="getlabel"></a> `getLabel` | `readonly` | (`entity`) => `string` | Extract the primary display label |
| <a id="getstatus"></a> `getStatus?` | `readonly` | (`entity`) => [`IEntityStatus`](IEntityStatus.md) \| `undefined` | Extract an optional status badge or indicator |
| <a id="getsublabel"></a> `getSublabel?` | `readonly` | (`entity`) => `string` \| `undefined` | Extract an optional secondary line (subtitle, description) |
