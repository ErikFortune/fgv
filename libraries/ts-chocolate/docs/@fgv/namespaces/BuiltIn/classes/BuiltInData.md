[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [BuiltIn](../README.md) / BuiltInData

# Class: BuiltInData

Defined in: [ts-chocolate/src/packlets/built-in/builtInData.ts:79](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/built-in/builtInData.ts#L79)

Provides access to built-in chocolate library data as an InMemoryFileTree.

## Constructors

### Constructor

> **new BuiltInData**(): `BuiltInData`

#### Returns

`BuiltInData`

## Methods

### getConfectionsDirectory()

> `static` **getConfectionsDirectory**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/built-in/builtInData.ts:166](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/built-in/builtInData.ts#L166)

Gets the confections directory from the built-in library tree.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the confections directory, or `Failure` if not found.

***

### getFillingsDirectory()

> `static` **getFillingsDirectory**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/built-in/builtInData.ts:134](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/built-in/builtInData.ts#L134)

Gets the recipes directory from the built-in library tree.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the recipes directory, or `Failure` if not found.

***

### getIngredientsDirectory()

> `static` **getIngredientsDirectory**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/built-in/builtInData.ts:126](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/built-in/builtInData.ts#L126)

Gets the ingredients directory from the built-in library tree.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the ingredients directory, or `Failure` if not found.

***

### getLibraryTree()

> `static` **getLibraryTree**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/built-in/builtInData.ts:104](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/built-in/builtInData.ts#L104)

Gets the full built-in library tree.
The tree is structured to mirror a real filesystem library:
```
/
└── data/
    ├── ingredients/
    │   ├── common.json
    │   ├── felchlin.json
    │   ├── cacao-barry.json
    │   └── guittard.json
    ├── fillings/
    │   └── common.json
    ├── molds/
    │   └── common.json
    ├── procedures/
    │   └── common.json
    ├── tasks/
    │   └── common.json
    └── confections/
        └── common.json
```

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the library tree root directory, or `Failure` with an error message.

***

### getMoldsDirectory()

> `static` **getMoldsDirectory**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/built-in/builtInData.ts:142](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/built-in/builtInData.ts#L142)

Gets the molds directory from the built-in library tree.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the molds directory, or `Failure` if not found.

***

### getProceduresDirectory()

> `static` **getProceduresDirectory**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/built-in/builtInData.ts:150](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/built-in/builtInData.ts#L150)

Gets the procedures directory from the built-in library tree.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the procedures directory, or `Failure` if not found.

***

### getTasksDirectory()

> `static` **getTasksDirectory**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/built-in/builtInData.ts:158](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/built-in/builtInData.ts#L158)

Gets the tasks directory from the built-in library tree.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the tasks directory, or `Failure` if not found.
