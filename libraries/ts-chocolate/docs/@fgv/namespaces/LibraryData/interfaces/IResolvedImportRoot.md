[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IResolvedImportRoot

# Interface: IResolvedImportRoot

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:571](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L571)

Result of importing a directory for a specific sub-library.

## Extends

- [`IImportRootCandidate`](IImportRootCandidate.md)

## Properties

### kind

> `readonly` **kind**: [`ImportRootKind`](../type-aliases/ImportRootKind.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:564](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L564)

How the resolution was achieved.

#### Inherited from

[`IImportRootCandidate`](IImportRootCandidate.md).[`kind`](IImportRootCandidate.md#kind)

***

### matches

> `readonly` **matches**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:575](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L575)

Number of matching candidates found.

***

### root

> `readonly` **root**: [`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:562](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L562)

The directory that can be treated as the library root.

#### Inherited from

[`IImportRootCandidate`](IImportRootCandidate.md).[`root`](IImportRootCandidate.md#root)

***

### visited

> `readonly` **visited**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:573](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L573)

Number of directories visited during search.
