[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / FullLibraryLoadSpec

# Type Alias: FullLibraryLoadSpec

> **FullLibraryLoadSpec** = `boolean` \| `Partial`\<`Record`\<[`SubLibraryId`](SubLibraryId.md) \| `"default"`, [`LibraryLoadSpec`](LibraryLoadSpec.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:267](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L267)

Controls loading for each sub-library within a library source.

- `true`: Load all sub-libraries with default settings (all collections)
- `false`: Load no sub-libraries
- `Record<SubLibraryId | 'default', LibraryLoadSpec>`: Per-sub-library control
  - Named sub-libraries get their specific spec
  - 'default' applies to unspecified sub-libraries
