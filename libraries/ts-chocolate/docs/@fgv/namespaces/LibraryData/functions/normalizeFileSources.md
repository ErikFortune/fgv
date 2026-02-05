[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / normalizeFileSources

# Function: normalizeFileSources()

> **normalizeFileSources**\<`T`\>(`sources`): readonly `T`[]

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:302](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L302)

Normalizes a file sources parameter to an array.

Accepts either a single source or an array of sources,
and always returns a readonly array.

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### sources

Single source, array of sources, or undefined

`T` | readonly `T`[] | `undefined`

## Returns

readonly `T`[]

Readonly array of sources (empty if undefined)
