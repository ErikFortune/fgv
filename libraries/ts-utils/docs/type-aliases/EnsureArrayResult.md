[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / EnsureArrayResult

# Type Alias: EnsureArrayResult\<T\>

> **EnsureArrayResult**\<`T`\> = `T` *extends* readonly infer \_U[] ? `T` : `T`[]

Helper type to extract the element type and preserve readonly status.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
