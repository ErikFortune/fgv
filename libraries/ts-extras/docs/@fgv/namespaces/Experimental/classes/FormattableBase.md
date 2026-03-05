[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Experimental](../README.md) / FormattableBase

# Class: FormattableBase

**`Beta`**

Base class which adds common formatting.

## Constructors

### Constructor

> **new FormattableBase**(): `FormattableBase`

**`Beta`**

#### Returns

`FormattableBase`

## Methods

### format()

> **format**(`template`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

**`Beta`**

Formats an object using the supplied mustache template.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | `string` | A mustache template used to format the object. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

`Success<string>` with the resulting string, or `Failure<string>`
with an error message if an error occurs.
