[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / StringConverter

# Class: StringConverter\<T, TC\>

The StringConverter class extends
[BaseConverter](BaseConverter.md) to provide string-specific
helper methods.

## Extends

- [`BaseConverter`](BaseConverter.md)\<`T`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `string` | `string` |
| `TC` | `unknown` |

## Constructors

### Constructor

> **new StringConverter**\<`T`, `TC`\>(`defaultContext?`, `traits?`, `converter?`): `StringConverter`\<`T`, `TC`\>

Construct a new StringConverter.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `defaultContext?` | `TC` | `undefined` | Optional context used by the conversion. |
| `traits?` | [`ConverterTraits`](../interfaces/ConverterTraits.md) | `undefined` | Optional traits to be applied to the conversion. |
| `converter?` | (`from`, `self`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`T`\> | `StringConverter._convert` | Optional conversion function to be used for the conversion. |

#### Returns

`StringConverter`\<`T`, `TC`\>

#### Overrides

[`BaseConverter`](BaseConverter.md).[`constructor`](BaseConverter.md#constructor)

## Accessors

### brand

#### Get Signature

> **get** **brand**(): `string` \| `undefined`

Returns the brand for a branded type.

##### Returns

`string` \| `undefined`

Returns the brand for a branded type.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`brand`](BaseConverter.md#brand)

***

### isOptional

#### Get Signature

> **get** **isOptional**(): `boolean`

Indicates whether this element is explicitly optional.

##### Returns

`boolean`

Indicates whether this element is explicitly optional.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`isOptional`](BaseConverter.md#isoptional)

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

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`convert`](BaseConverter.md#convert)

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

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`convertOptional`](BaseConverter.md#convertoptional)

***

### map()

> **map**\<`T2`\>(`mapper`): [`Converter`](../interfaces/Converter.md)\<`T2`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) which applies a (possibly) mapping conversion to
the converted value of this [Converter](../interfaces/Converter.md).

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T2` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`T2`\> | A function which maps from the the result type `<T>` of this converter to a new result type `<T2>`. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T2`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T2>`.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`map`](BaseConverter.md#map)

***

### mapConvert()

> **mapConvert**\<`T2`\>(`mapConverter`): [`Converter`](../interfaces/Converter.md)\<`T2`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) which applies an additional supplied
converter to the result of this converter.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T2` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapConverter` | [`Converter`](../interfaces/Converter.md)\<`T2`\> | The [Converter](../interfaces/Converter.md) to be applied to the converted result from this [Converter](../interfaces/Converter.md). |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T2`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T2>`.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`mapConvert`](BaseConverter.md#mapconvert)

***

### mapConvertItems()

> **mapConvertItems**\<`TI`\>(`mapConverter`): [`Converter`](../interfaces/Converter.md)\<`TI`[], `TC`\>

Creates a [Converter](../interfaces/Converter.md) which maps the individual items of a collection
resulting from this [Converter](../interfaces/Converter.md) using the supplied [Converter](../interfaces/Converter.md).

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TI` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapConverter` | [`Converter`](../interfaces/Converter.md)\<`TI`, `unknown`\> | The [Converter](../interfaces/Converter.md) to be applied to each element of the result of this [Converter](../interfaces/Converter.md). |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`TI`[], `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`mapConvertItems`](BaseConverter.md#mapconvertitems)

***

### mapItems()

> **mapItems**\<`TI`\>(`mapper`): [`Converter`](../interfaces/Converter.md)\<`TI`[], `TC`\>

Creates a [Converter](../interfaces/Converter.md) which maps the individual items of a collection
resulting from this [Converter](../interfaces/Converter.md) using the supplied map function.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TI` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`TI`\> | The map function to be applied to each element of the result of this [Converter](../interfaces/Converter.md). |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`TI`[], `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`mapItems`](BaseConverter.md#mapitems)

***

### optional()

> **optional**(`onError?`): [`Converter`](../interfaces/Converter.md)\<`T` \| `undefined`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) for an optional value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onError?` | [`OnError`](../type-aliases/OnError.md) | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T` \| `undefined`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T|undefined>`.

#### Remarks

If `onError` is `failOnError`, the resulting converter will accept `undefined`
or a convertible value, but report an error if it encounters a value that cannot be
converted.

If `onError` is `ignoreErrors` (default) then values that cannot be converted will
result in a successful return of `undefined`.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`optional`](BaseConverter.md#optional)

***

### or()

> **or**(`other`): [`Converter`](../interfaces/Converter.md)\<`T`, `TC`\>

Chains this converter with another of the same type, to be attempted if this
converter fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | [`Converter`](../interfaces/Converter.md)\<`T`, `TC`\> |  |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T`, `TC`\>

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`or`](BaseConverter.md#or)

***

### withAction()

> **withAction**\<`TI`\>(`action`): [`Converter`](../interfaces/Converter.md)\<`TI`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) which applies a supplied action after
conversion.  The supplied action is always called regardless of success or failure
of the base conversion and is allowed to mutate the return type.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TI` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | (`result`, `context?`) => [`Result`](../../../../type-aliases/Result.md)\<`TI`\> | The action to be applied. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`TI`, `TC`\>

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`withAction`](BaseConverter.md#withaction)

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): [`Converter`](../interfaces/Converter.md)\<[`Brand`](../../../../type-aliases/Brand.md)\<`T`, `B`\>, `TC`\>

returns a converter which adds a brand to the type to prevent mismatched usage
of simple types.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `B` *extends* `string` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `brand` | `B` | The brand to be applied to the result value. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<[`Brand`](../../../../type-aliases/Brand.md)\<`T`, `B`\>, `TC`\>

A [Converter](../interfaces/Converter.md) returning `Brand<T, B>`.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`withBrand`](BaseConverter.md#withbrand)

***

### withConstraint()

> **withConstraint**(`constraint`, `options?`): [`Converter`](../interfaces/Converter.md)\<`T`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) which applies an optional constraint to the result
of this conversion.  If this [Converter](../interfaces/Converter.md) (the base converter) succeeds, the new
converter calls a supplied constraint evaluation function with the conversion, which
fails the entire conversion if the constraint function returns either `false` or
[Failure\<T\>](../../../../classes/Failure.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | (`val`, `context?`) => `boolean` \| [`Result`](../../../../type-aliases/Result.md)\<`T`\> | Constraint evaluation function. |
| `options?` | [`ConstraintOptions`](../interfaces/ConstraintOptions.md) | [Options](../interfaces/ConstraintOptions.md) for constraint evaluation. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T>`.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`withConstraint`](BaseConverter.md#withconstraint)

***

### withDefault()

> **withDefault**\<`TD`\>(`defaultValue`): [`DefaultingConverter`](../interfaces/DefaultingConverter.md)\<`T`, `TD`, `TC`\>

Returns a Converter which always succeeds with a default value rather than failing.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TD` | `T` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `defaultValue` | `TD` |  |

#### Returns

[`DefaultingConverter`](../interfaces/DefaultingConverter.md)\<`T`, `TD`, `TC`\>

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`withDefault`](BaseConverter.md#withdefault)

***

### withFormattedError()

> **withFormattedError**(`formatter`): [`Converter`](../interfaces/Converter.md)\<`T`, `TC`\>

Creates a new [Converter](../interfaces/Converter.md) which is derived from this one but which returns an
error message formatted by the supplied formatter if the conversion fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ConversionErrorFormatter`](../type-aliases/ConversionErrorFormatter.md)\<`TC`\> | The formatter to be applied. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T>`.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`withFormattedError`](BaseConverter.md#withformattederror)

***

### withItemTypeGuard()

> **withItemTypeGuard**\<`TI`\>(`guard`, `message?`): [`Converter`](../interfaces/Converter.md)\<`TI`[], `TC`\>

Creates a [Converter](../interfaces/Converter.md) which applies a supplied type guard to each member of
the conversion result from this converter.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TI` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `guard` | (`from`, `context?`) => `from is TI` | The type guard function to apply to each element. |
| `message?` | `string` | Optional message to be reported if the type guard fails. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`TI`[], `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<TI>`.

#### Remarks

Fails if the conversion result is not an array or if any member fails the
type guard.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`withItemTypeGuard`](BaseConverter.md#withitemtypeguard)

***

### withTypeGuard()

> **withTypeGuard**\<`TI`\>(`guard`, `message?`): [`Converter`](../interfaces/Converter.md)\<`TI`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) which applies a supplied type guard to the conversion
result.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TI` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `guard` | (`from`, `context?`) => `from is TI` | The type guard function to apply. |
| `message?` | `string` | Optional message to be reported if the type guard fails. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`TI`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<TI>`.

#### Inherited from

[`BaseConverter`](BaseConverter.md).[`withTypeGuard`](BaseConverter.md#withtypeguard)
