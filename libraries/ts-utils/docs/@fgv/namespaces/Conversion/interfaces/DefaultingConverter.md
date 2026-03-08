[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / DefaultingConverter

# Interface: DefaultingConverter\<T, TD, TC\>

## Extends

- [`Converter`](Converter.md)\<`T` \| `TD`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TD` | `T` |
| `TC` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="brand"></a> `brand?` | `readonly` | `string` | Returns the brand for a branded type. |
| <a id="defaultvalue"></a> `defaultValue` | `readonly` | `TD` | Default value to use if the conversion fails. |
| <a id="isoptional"></a> `isOptional` | `readonly` | `boolean` | Indicates whether this element is explicitly optional. |

## Methods

### convert()

> **convert**(`from`, `ctx?`): [`Success`](../../../../classes/Success.md)\<`T` \| `TD`\>

Convert the supplied `unknown` to `Success<T>` or to the `Success` with the default value
if conversion is not possible.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | the value to be converted. |
| `ctx?` | `TC` | optional context for the conversion. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`T` \| `TD`\>

#### Overrides

[`Converter`](Converter.md).[`convert`](Converter.md#convert)

***

### convertOptional()

> **convertOptional**(`from`, `context?`, `onError?`): [`Result`](../../../../type-aliases/Result.md)\<`T` \| `TD` \| `undefined`\>

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted |
| `context?` | `TC` | An optional conversion context of type `<TC>` to be used in the conversion. |
| `onError?` | [`OnError`](../type-aliases/OnError.md) | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`T` \| `TD` \| `undefined`\>

A [Result](../../../../type-aliases/Result.md) with a [Success](../../../../classes/Success.md) and a value on success or an
[Failure](../../../../classes/Failure.md) with a a message on failure.

#### Remarks

If `onError` is `failOnError`, the converter succeeds for
`undefined` or any convertible value, but reports an error
if it encounters a value that cannot be converted.

If `onError` is `ignoreErrors` (default) then values that
cannot be converted result in a successful return of `undefined`.

#### Inherited from

[`Converter`](Converter.md).[`convertOptional`](Converter.md#convertoptional)

***

### map()

> **map**\<`T2`\>(`mapper`): [`Converter`](Converter.md)\<`T2`, `TC`\>

Creates a [Converter](Converter.md) which applies a (possibly) mapping conversion to
the converted value of this [Converter](Converter.md).

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`T2`\> | A function which maps from the the result type `<T>` of this converter to a new result type `<T2>`. |

#### Returns

[`Converter`](Converter.md)\<`T2`, `TC`\>

A new [Converter](Converter.md) returning `<T2>`.

#### Inherited from

[`Converter`](Converter.md).[`map`](Converter.md#map)

***

### mapConvert()

> **mapConvert**\<`T2`\>(`mapConverter`): [`Converter`](Converter.md)\<`T2`, `TC`\>

Creates a [Converter](Converter.md) which applies an additional supplied
converter to the result of this converter.

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapConverter` | [`Converter`](Converter.md)\<`T2`, `unknown`\> | The [Converter](Converter.md) to be applied to the converted result from this [Converter](Converter.md). |

#### Returns

[`Converter`](Converter.md)\<`T2`, `TC`\>

A new [Converter](Converter.md) returning `<T2>`.

#### Inherited from

[`Converter`](Converter.md).[`mapConvert`](Converter.md#mapconvert)

***

### mapConvertItems()

> **mapConvertItems**\<`TI`\>(`mapConverter`): [`Converter`](Converter.md)\<`TI`[], `TC`\>

Creates a [Converter](Converter.md) which maps the individual items of a collection
resulting from this [Converter](Converter.md) using the supplied [Converter](Converter.md).

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapConverter` | [`Converter`](Converter.md)\<`TI`, `unknown`\> | The [Converter](Converter.md) to be applied to each element of the result of this [Converter](Converter.md). |

#### Returns

[`Converter`](Converter.md)\<`TI`[], `TC`\>

A new [Converter](Converter.md) returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

#### Inherited from

[`Converter`](Converter.md).[`mapConvertItems`](Converter.md#mapconvertitems)

***

### mapItems()

> **mapItems**\<`TI`\>(`mapper`): [`Converter`](Converter.md)\<`TI`[], `TC`\>

Creates a [Converter](Converter.md) which maps the individual items of a collection
resulting from this [Converter](Converter.md) using the supplied map function.

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`TI`\> | The map function to be applied to each element of the result of this [Converter](Converter.md). |

#### Returns

[`Converter`](Converter.md)\<`TI`[], `TC`\>

A new [Converter](Converter.md) returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

#### Inherited from

[`Converter`](Converter.md).[`mapItems`](Converter.md#mapitems)

***

### optional()

> **optional**(`onError?`): [`Converter`](Converter.md)\<`T` \| `TD` \| `undefined`, `TC`\>

Creates a [Converter](Converter.md) for an optional value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onError?` | [`OnError`](../type-aliases/OnError.md) | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

#### Returns

[`Converter`](Converter.md)\<`T` \| `TD` \| `undefined`, `TC`\>

A new [Converter](Converter.md) returning `<T|undefined>`.

#### Remarks

If `onError` is `failOnError`, the resulting converter will accept `undefined`
or a convertible value, but report an error if it encounters a value that cannot be
converted.

If `onError` is `ignoreErrors` (default) then values that cannot be converted will
result in a successful return of `undefined`.

#### Inherited from

[`Converter`](Converter.md).[`optional`](Converter.md#optional)

***

### or()

> **or**(`other`): [`Converter`](Converter.md)\<`T` \| `TD`, `TC`\>

Chains this converter with another of the same type, to be attempted if this
converter fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | [`Converter`](Converter.md)\<`T` \| `TD`, `TC`\> |  |

#### Returns

[`Converter`](Converter.md)\<`T` \| `TD`, `TC`\>

#### Inherited from

[`Converter`](Converter.md).[`or`](Converter.md#or)

***

### withAction()

> **withAction**\<`T2`\>(`action`): [`Converter`](Converter.md)\<`T2`, `TC`\>

Creates a [Converter](Converter.md) which applies a supplied action after
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

[`Converter`](Converter.md)\<`T2`, `TC`\>

#### Inherited from

[`Converter`](Converter.md).[`withAction`](Converter.md#withaction)

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): [`Converter`](Converter.md)\<[`Brand`](../../../../type-aliases/Brand.md)\<`T` \| `TD`, `B`\>, `TC`\>

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

[`Converter`](Converter.md)\<[`Brand`](../../../../type-aliases/Brand.md)\<`T` \| `TD`, `B`\>, `TC`\>

A [Converter](Converter.md) returning `Brand<T, B>`.

#### Inherited from

[`Converter`](Converter.md).[`withBrand`](Converter.md#withbrand)

***

### withConstraint()

> **withConstraint**(`constraint`, `options?`): [`Converter`](Converter.md)\<`T` \| `TD`, `TC`\>

Creates a [Converter](Converter.md) which applies an optional constraint to the result
of this conversion.  If this [Converter](Converter.md) (the base converter) succeeds, the new
converter calls a supplied constraint evaluation function with the conversion, which
fails the entire conversion if the constraint function returns either `false` or
[Failure\<T\>](../../../../classes/Failure.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | (`val`, `context?`) => `boolean` \| [`Result`](../../../../type-aliases/Result.md)\<`T` \| `TD`\> | Constraint evaluation function. |
| `options?` | [`ConstraintOptions`](ConstraintOptions.md) | [Options](ConstraintOptions.md) for constraint evaluation. |

#### Returns

[`Converter`](Converter.md)\<`T` \| `TD`, `TC`\>

A new [Converter](Converter.md) returning `<T>`.

#### Inherited from

[`Converter`](Converter.md).[`withConstraint`](Converter.md#withconstraint)

***

### withDefault()

> **withDefault**\<`TD`\>(`dflt`): `DefaultingConverter`\<`T` \| `TD`, `TD`, `TC`\>

Returns a Converter which always succeeds with a default value rather than failing.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TD` | `T` \| `TD` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dflt` | `TD` |

#### Returns

`DefaultingConverter`\<`T` \| `TD`, `TD`, `TC`\>

#### Inherited from

[`Converter`](Converter.md).[`withDefault`](Converter.md#withdefault)

***

### withFormattedError()

> **withFormattedError**(`formatter`): [`Converter`](Converter.md)\<`T` \| `TD`, `TC`\>

Creates a new [Converter](Converter.md) which is derived from this one but which returns an
error message formatted by the supplied formatter if the conversion fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ConversionErrorFormatter`](../type-aliases/ConversionErrorFormatter.md)\<`TC`\> | The formatter to be applied. |

#### Returns

[`Converter`](Converter.md)\<`T` \| `TD`, `TC`\>

A new [Converter](Converter.md) returning `<T>`.

#### Inherited from

[`Converter`](Converter.md).[`withFormattedError`](Converter.md#withformattederror)

***

### withItemTypeGuard()

> **withItemTypeGuard**\<`TI`\>(`guard`, `message?`): [`Converter`](Converter.md)\<`TI`[], `TC`\>

Creates a [Converter](Converter.md) which applies a supplied type guard to each member of
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

[`Converter`](Converter.md)\<`TI`[], `TC`\>

A new [Converter](Converter.md) returning `<TI>`.

#### Remarks

Fails if the conversion result is not an array or if any member fails the
type guard.

#### Inherited from

[`Converter`](Converter.md).[`withItemTypeGuard`](Converter.md#withitemtypeguard)

***

### withTypeGuard()

> **withTypeGuard**\<`TI`\>(`guard`, `message?`): [`Converter`](Converter.md)\<`TI`, `TC`\>

Creates a [Converter](Converter.md) which applies a supplied type guard to the conversion
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

[`Converter`](Converter.md)\<`TI`, `TC`\>

A new [Converter](Converter.md) returning `<TI>`.

#### Inherited from

[`Converter`](Converter.md).[`withTypeGuard`](Converter.md#withtypeguard)
