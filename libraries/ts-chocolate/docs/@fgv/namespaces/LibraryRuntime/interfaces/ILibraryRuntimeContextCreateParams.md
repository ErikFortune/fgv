[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ILibraryRuntimeContextCreateParams

# Interface: ILibraryRuntimeContextCreateParams

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:69](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L69)

Parameters for creating a LibraryRuntimeContext with a new library

## Properties

### libraryParams?

> `readonly` `optional` **libraryParams**: [`IChocolateLibraryCreateParams`](IChocolateLibraryCreateParams.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:73](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L73)

Parameters for creating the underlying ChocolateLibrary

***

### preWarm?

> `readonly` `optional` **preWarm**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:79](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L79)

Whether to pre-warm the reverse index on context creation.

#### Default Value

```ts
false
```
