[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / StringOneOf

# Type Alias: StringOneOf\<T\>

> **StringOneOf**\<`T`\> = `Extract`\<[`OneOf`](OneOf.md)\<`T`\>, `string`\>

Union of all string values in an array/tuple type, preserving literal types if possible.
If T is not an array/tuple, results in `never`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
