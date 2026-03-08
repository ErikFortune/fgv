[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / FieldInitializers

# Type Alias: FieldInitializers\<T\>

> **FieldInitializers**\<`T`\> = `{ [key in keyof T]: (state: Partial<T>) => Result<T[key]> }`

String-keyed record of initialization functions to be passed to [populateObject](../functions/populateObject.md)
or [populateObject](../functions/populateObject.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
