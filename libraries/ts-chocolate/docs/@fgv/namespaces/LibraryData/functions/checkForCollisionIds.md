[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / checkForCollisionIds

# Function: checkForCollisionIds()

> **checkForCollisionIds**\<`TCollectionId`\>(`collectionSets`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:270](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L270)

Checks for duplicate collection IDs across multiple sources.

## Type Parameters

### TCollectionId

`TCollectionId` *extends* `string`

## Parameters

### collectionSets

readonly [`ICollectionSet`](../interfaces/ICollectionSet.md)\<`TCollectionId`\>[]

Array of collection sets to check

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Success(true) if no collisions, Failure with details if collision found
