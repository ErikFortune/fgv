[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Experimental](../README.md) / FormattableBase

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

> **format**(`template`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

**`Beta`**

Formats an object using the supplied mustache template.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | `string` | A mustache template used to format the object. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success<string>` with the resulting string, or `Failure<string>`
with an error message if an error occurs.

***

### \_tryAddDetail()

> `protected` `static` **\_tryAddDetail**(`details`, `label`, `value`): `void`

**`Internal`**

Helper enables derived classes to add named details to a formatted presentation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `details` | `string`[] | An array of detail description strings. |
| `label` | `string` | Label to use for the new detail. |
| `value` | `string` \| `undefined` | Value to use for the new detail. |

#### Returns

`void`
