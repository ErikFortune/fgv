[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / FieldValidators

# Type Alias: FieldValidators\<T, TC\>

> **FieldValidators**\<`T`, `TC`\> = `{ [key in keyof T]: Validator<T[key], TC> }`

Per-property [validators](../../../interfaces/Validator.md) for each of the properties in `<T>`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
