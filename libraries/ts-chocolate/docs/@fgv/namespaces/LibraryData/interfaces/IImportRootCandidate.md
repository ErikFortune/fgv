[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IImportRootCandidate

# Interface: IImportRootCandidate

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:560](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L560)

A candidate import root with directory and resolution kind.
Used internally during BFS search and as the result of tryResolveAt.

## Extended by

- [`IResolvedImportRoot`](IResolvedImportRoot.md)

## Properties

### kind

> `readonly` **kind**: [`ImportRootKind`](../type-aliases/ImportRootKind.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:564](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L564)

How the resolution was achieved.

***

### root

> `readonly` **root**: [`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:562](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L562)

The directory that can be treated as the library root.
