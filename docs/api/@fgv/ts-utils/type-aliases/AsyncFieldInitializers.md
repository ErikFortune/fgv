[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncFieldInitializers

# Type Alias: AsyncFieldInitializers\<T\>

> **AsyncFieldInitializers**\<`T`\> = `{ [key in keyof T]: (state: Partial<T>) => Promise<Result<T[key]>> }`

String-keyed record of asynchronous initialization functions to be passed to
[populateObjectAsync](../functions/populateObjectAsync.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
