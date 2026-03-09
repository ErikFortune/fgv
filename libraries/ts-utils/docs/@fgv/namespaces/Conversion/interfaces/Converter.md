[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / Converter

# Interface: Converter\<T, TC\>

Generic converter to convert unknown to a templated type `<T>`, using
intrinsic rules or as modified by an optional conversion context
of optional templated type `<TC>` (default `undefined`).

## Extends

- [`ConverterTraits`](ConverterTraits.md)

## Extended by

- [`DefaultingConverter`](DefaultingConverter.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="brand"></a> `brand?` | `readonly` | `string` | Returns the brand for a branded type. |
| <a id="isoptional"></a> `isOptional` | `readonly` | `boolean` | Indicates whether this element is explicitly optional. |

## Methods

### convert()

> **convert**(`from`, `context?`): [`Result`](../../../../type-aliases/Result.md)\<`T`\>

Converts from `unknown` to `<T>`.  For objects and arrays, is guaranteed
to return a new entity, with any unrecognized properties removed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted |
| `context?` | `TC` | An optional conversion context of type `<TC>` to be used in the conversion. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`T`\>

A [Result](../../../../type-aliases/Result.md) with a [Success](../../../../classes/Success.md) and a value on success or an
[Failure](../../../../classes/Failure.md) with a a message on failure.

***

### convertOptional()

> **convertOptional**(`from`, `context?`, `onError?`): [`Result`](../../../../type-aliases/Result.md)\<`T` \| `undefined`\>

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted |
| `context?` | `TC` | An optional conversion context of type `<TC>` to be used in the conversion. |
| `onError?` | [`OnError`](../type-aliases/OnError.md) | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`T` \| `undefined`\>

A [Result](../../../../type-aliases/Result.md) with a [Success](../../../../classes/Success.md) and a value on success or an
[Failure](../../../../classes/Failure.md) with a a message on failure.

#### Remarks

If `onError` is `failOnError`, the converter succeeds for
`undefined` or any convertible value, but reports an error
if it encounters a value that cannot be converted.

If `onError` is `ignoreErrors` (default) then values that
cannot be converted result in a successful return of `undefined`.

***

### map()

> **map**\<`T2`\>(`mapper`): `Converter`\<`T2`, `TC`\>

Creates a Converter which applies a (possibly) mapping conversion to
the converted value of this Converter.

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`T2`\> | A function which maps from the the result type `<T>` of this converter to a new result type `<T2>`. |

#### Returns

`Converter`\<`T2`, `TC`\>

A new Converter returning `<T2>`.

***

### mapConvert()

> **mapConvert**\<`T2`\>(`mapConverter`): `Converter`\<`T2`, `TC`\>

Creates a Converter which applies an additional supplied
converter to the result of this converter.

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapConverter` | `Converter`\<`T2`, `unknown`\> | The Converter to be applied to the converted result from this Converter. |

#### Returns

`Converter`\<`T2`, `TC`\>

A new Converter returning `<T2>`.

***

### mapConvertItems()

> **mapConvertItems**\<`TI`\>(`mapConverter`): `Converter`\<`TI`[], `TC`\>

Creates a Converter which maps the individual items of a collection
resulting from this Converter using the supplied Converter.

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapConverter` | `Converter`\<`TI`, `unknown`\> | The Converter to be applied to each element of the result of this Converter. |

#### Returns

`Converter`\<`TI`[], `TC`\>

A new Converter returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

***

### mapItems()

> **mapItems**\<`TI`\>(`mapper`): `Converter`\<`TI`[], `TC`\>

Creates a Converter which maps the individual items of a collection
resulting from this Converter using the supplied map function.

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`TI`\> | The map function to be applied to each element of the result of this Converter. |

#### Returns

`Converter`\<`TI`[], `TC`\>

A new Converter returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

***

### optional()

> **optional**(`onError?`): `Converter`\<`T` \| `undefined`, `TC`\>

Creates a Converter for an optional value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onError?` | [`OnError`](../type-aliases/OnError.md) | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

#### Returns

`Converter`\<`T` \| `undefined`, `TC`\>

A new Converter returning `<T|undefined>`.

#### Remarks

If `onError` is `failOnError`, the resulting converter will accept `undefined`
or a convertible value, but report an error if it encounters a value that cannot be
converted.

If `onError` is `ignoreErrors` (default) then values that cannot be converted will
result in a successful return of `undefined`.

***

### or()

> **or**(`other`): `Converter`\<`T`, `TC`\>

Chains this converter with another of the same type, to be attempted if this
converter fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | `Converter`\<`T`, `TC`\> |  |

#### Returns

`Converter`\<`T`, `TC`\>

***

### withAction()

> **withAction**\<`T2`\>(`action`): `Converter`\<`T2`, `TC`\>

Creates a Converter which applies a supplied action after
conversion.  The supplied action is always called regardless of success or failure
of the base conversion and is allowed to mutate the return type.

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | (`result`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`T2`\> | The action to be applied. |

#### Returns

`Converter`\<`T2`, `TC`\>

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): `Converter`\<[`Brand`](../../../../type-aliases/Brand.md)\<`T`, `B`\>, `TC`\>

returns a converter which adds a brand to the type to prevent mismatched usage
of simple types.

#### Type Parameters

| Type Parameter |
| ------ |
| `B` *extends* `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `brand` | `B` | The brand to be applied to the result value. |

#### Returns

`Converter`\<[`Brand`](../../../../type-aliases/Brand.md)\<`T`, `B`\>, `TC`\>

A Converter returning `Brand<T, B>`.

***

### withConstraint()

> **withConstraint**(`constraint`, `options?`): `Converter`\<`T`, `TC`\>

Creates a Converter which applies an optional constraint to the result
of this conversion.  If this Converter (the base converter) succeeds, the new
converter calls a supplied constraint evaluation function with the conversion, which
fails the entire conversion if the constraint function returns either `false` or
[Failure\<T\>](../../../../classes/Failure.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | (`val`, `context?`) => `boolean` \| [`Result`](../../../../type-aliases/Result.md)\<`T`\> | Constraint evaluation function. |
| `options?` | [`ConstraintOptions`](ConstraintOptions.md) | [Options](ConstraintOptions.md) for constraint evaluation. |

#### Returns

`Converter`\<`T`, `TC`\>

A new Converter returning `<T>`.

***

### withDefault()

> **withDefault**\<`TD`\>(`dflt`): [`DefaultingConverter`](DefaultingConverter.md)\<`T`, `TD`, `TC`\>

Returns a Converter which always succeeds with a default value rather than failing.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TD` | `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dflt` | `TD` |

#### Returns

[`DefaultingConverter`](DefaultingConverter.md)\<`T`, `TD`, `TC`\>

***

### withFormattedError()

> **withFormattedError**(`formatter`): `Converter`\<`T`, `TC`\>

Creates a new Converter which is derived from this one but which returns an
error message formatted by the supplied formatter if the conversion fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ConversionErrorFormatter`](../type-aliases/ConversionErrorFormatter.md)\<`TC`\> | The formatter to be applied. |

#### Returns

`Converter`\<`T`, `TC`\>

A new Converter returning `<T>`.

***

### withItemTypeGuard()

> **withItemTypeGuard**\<`TI`\>(`guard`, `message?`): `Converter`\<`TI`[], `TC`\>

Creates a Converter which applies a supplied type guard to each member of
the conversion result from this converter.

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `guard` | (`from`, `context?`) => `from is TI` | The type guard function to apply to each element. |
| `message?` | `string` | Optional message to be reported if the type guard fails. |

#### Returns

`Converter`\<`TI`[], `TC`\>

A new Converter returning `<TI>`.

#### Remarks

Fails if the conversion result is not an array or if any member fails the
type guard.

***

### withTypeGuard()

> **withTypeGuard**\<`TI`\>(`guard`, `message?`): `Converter`\<`TI`, `TC`\>

Creates a Converter which applies a supplied type guard to the conversion
result.

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `guard` | (`from`, `context?`) => `from is TI` | The type guard function to apply. |
| `message?` | `string` | Optional message to be reported if the type guard fails. |

#### Returns

`Converter`\<`TI`, `TC`\>

A new Converter returning `<TI>`.
