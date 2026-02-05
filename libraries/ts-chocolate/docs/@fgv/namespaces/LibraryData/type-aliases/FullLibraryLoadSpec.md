[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / FullLibraryLoadSpec

# Type Alias: FullLibraryLoadSpec

> **FullLibraryLoadSpec** = `boolean` \| `Partial`\<`Record`\<[`SubLibraryId`](SubLibraryId.md) \| `"default"`, [`LibraryLoadSpec`](LibraryLoadSpec.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:267](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L267)

Controls loading for each sub-library within a library source.

- `true`: Load all sub-libraries with default settings (all collections)
- `false`: Load no sub-libraries
- `Record<SubLibraryId | 'default', LibraryLoadSpec>`: Per-sub-library control
  - Named sub-libraries get their specific spec
  - 'default' applies to unspecified sub-libraries
