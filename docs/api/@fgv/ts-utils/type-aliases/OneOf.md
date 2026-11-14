[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / OneOf

# Type Alias: OneOf\<T\>

> **OneOf**\<`T`\> = `T` *extends* readonly `unknown`[] ? `T`\[`number`\] : `never`

Union of all values in an array/tuple type, preserving literal types if possible.
If T is not an array/tuple, results in `never`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
