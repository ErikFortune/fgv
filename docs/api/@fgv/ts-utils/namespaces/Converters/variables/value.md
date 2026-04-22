[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Converters](../README.md) / value

# ~~Variable: value()~~

> `const` **value**: \<`T`, `TC`\>(`value`) => [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> = `literal`

**`Internal`**

Deprecated alias for

Helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which converts `unknown` to some supplied literal value. Succeeds with
the supplied value if an identity comparison succeeds, fails otherwise.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to be compared. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which returns the supplied value on success.

## See

literal

## Param

The value to be compared.

## Deprecated

Use [Converters.literal](../functions/literal.md) instead.
