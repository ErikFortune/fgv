[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / IEntityResolver

# Interface: IEntityResolver\<TEntity, TId\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:68](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L68)

Interface for resolving entity IDs to entities.
The orchestrator uses this to resolve any IDs returned by indexers.

## Type Parameters

### TEntity

`TEntity`

### TId

`TId`

## Methods

### isId()

> **isId**(`value`): `value is TId`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:81](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L81)

Type guard to check if a value is an ID (not an entity).

#### Parameters

##### value

The value to check

`TEntity` | `TId`

#### Returns

`value is TId`

True if the value is an ID

***

### resolve()

> **resolve**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TEntity`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:74](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L74)

Resolves an entity ID to an entity.

#### Parameters

##### id

`TId`

The entity ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TEntity`\>

Success with entity, or Failure if not found
