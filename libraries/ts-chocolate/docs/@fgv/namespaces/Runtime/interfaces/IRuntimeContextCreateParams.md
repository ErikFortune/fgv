[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Runtime](../README.md) / IRuntimeContextCreateParams

# Interface: IRuntimeContextCreateParams

Defined in: [ts-chocolate/src/packlets/runtime/runtimeContext.ts:46](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/runtimeContext.ts#L46)

Parameters for creating a RuntimeContext with a new library

## Properties

### libraryParams?

> `readonly` `optional` **libraryParams**: [`IChocolateLibraryCreateParams`](../../LibraryRuntime/interfaces/IChocolateLibraryCreateParams.md)

Defined in: [ts-chocolate/src/packlets/runtime/runtimeContext.ts:50](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/runtimeContext.ts#L50)

Parameters for creating the underlying ChocolateLibrary

***

### preWarm?

> `readonly` `optional` **preWarm**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/runtimeContext.ts:56](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/runtimeContext.ts#L56)

Whether to pre-warm the reverse index on context creation.

#### Default Value

```ts
false
```
