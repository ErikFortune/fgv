[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Experimental](../README.md) / RangeOf

# Class: RangeOf\<T\>

Simple implementation of a possibly open-ended range of some comparable
type `<T>` with test and formatting.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`RangeOfProperties`](../interfaces/RangeOfProperties.md)\<`T`\>

## Constructors

### Constructor

> **new RangeOf**\<`T`\>(`min?`, `max?`): `RangeOf`\<`T`\>

Creates a new RangeOf\<T\>.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `min?` | `T` | Optional minimum extent of the range. |
| `max?` | `T` | Optional maximum extent of the range. |

#### Returns

`RangeOf`\<`T`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="max"></a> `max?` | `readonly` | `T` | Maximum extent of the range. |
| <a id="min"></a> `min?` | `readonly` | `T` | Minimum extent of the range. |

## Methods

### check()

> **check**(`t`): `"less"` \| `"greater"` \| `"included"`

Checks if a supplied value is within this range.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t` | `T` | The value to be tested. |

#### Returns

`"less"` \| `"greater"` \| `"included"`

`'included'` if `t` falls within the range, `'less'` if `t` falls
below the minimum extent of the range and `'greater'` if `t` is above the
maximum extent.

***

### findTransition()

> **findTransition**(`t`): `T` \| `undefined`

Finds the transition value that would bring a supplied value `t` into
range.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t` | `T` | The value to be tested. |

#### Returns

`T` \| `undefined`

The minimum extent of the range if `t` is below the range or
the maximum extent of the range if `t` is above the range.  Returns
`undefined` if `t` already falls within the range.

***

### format()

> **format**(`format`, `formats?`): `string` \| `undefined`

Formats this range using the supplied format function.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `format` | (`value`) => `string` \| `undefined` | Format function used to format minimum and maximum extent values. |
| `formats?` | [`RangeOfFormats`](../interfaces/RangeOfFormats.md) | The [format strings](../interfaces/RangeOfFormats.md) used to format the range (default [Experimental.DEFAULT\_RANGEOF\_FORMATS](../variables/DEFAULT_RANGEOF_FORMATS.md)). |

#### Returns

`string` \| `undefined`

Returns a formatted representation of this range.

***

### includes()

> **includes**(`t`): `boolean`

Determines if a supplied value is within this range.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t` | `T` | The value to be tested. |

#### Returns

`boolean`

Returns `true` if `t` falls within the range, `false` otherwise.

***

### toFormattedProperties()

> **toFormattedProperties**(`format`): [`RangeOfProperties`](../interfaces/RangeOfProperties.md)\<`string`\>

Formats the minimum and maximum values of this range.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `format` | (`value`) => `string` \| `undefined` | A format function used to format the values. |

#### Returns

[`RangeOfProperties`](../interfaces/RangeOfProperties.md)\<`string`\>

A [RangeOfProperties\<string\>](../interfaces/RangeOfProperties.md) containing the
formatted representation of the [minimum](#min) and
[maximum](#max)
extent of the range, or `undefined` for an extent that is not present.

***

### createRange()

> `static` **createRange**\<`T`\>(`init?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RangeOf`\<`T`\>\>

Static constructor for a RangeOf\<T\>.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init?` | [`RangeOfProperties`](../interfaces/RangeOfProperties.md)\<`T`\> | [Range initializer](../interfaces/RangeOfProperties.md). |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RangeOf`\<`T`\>\>

A new RangeOf\<T\>.

***

### propertiesToString()

> `static` **propertiesToString**\<`T`\>(`range`, `formats?`, `emptyValue?`): `string` \| `undefined`

Gets a formatted description of a [RangeOfProperties\<T\>](../interfaces/RangeOfProperties.md) given an
optional set of formats and 'empty' value to use.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `range` | [`RangeOfProperties`](../interfaces/RangeOfProperties.md)\<`T`\> | The [RangeOfProperties\<T\>](../interfaces/RangeOfProperties.md) to be formatted. |
| `formats?` | [`RangeOfFormats`](../interfaces/RangeOfFormats.md) | Optional [formats](../interfaces/RangeOfFormats.md) to use. Default is [DEFAULT\_RANGEOF\_FORMATS](../variables/DEFAULT_RANGEOF_FORMATS.md). |
| `emptyValue?` | `T` | Value which represents unbounded minimum or maximum for this range. Default is `undefined`. |

#### Returns

`string` \| `undefined`

A string representation of the range.
