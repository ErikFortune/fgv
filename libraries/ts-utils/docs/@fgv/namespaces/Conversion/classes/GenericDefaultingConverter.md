[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / GenericDefaultingConverter

# Class: GenericDefaultingConverter\<T, TD, TC\>

Generic [DefaultingConverter](../interfaces/DefaultingConverter.md), which wraps another converter
to substitute a supplied default value for any errors returned by the inner converter.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TD` | `T` |
| `TC` | `unknown` |

## Implements

- [`DefaultingConverter`](../interfaces/DefaultingConverter.md)\<`T`, `TD`, `TC`\>

## Constructors

### Constructor

> **new GenericDefaultingConverter**\<`T`, `TD`, `TC`\>(`converter`, `defaultValue`): `GenericDefaultingConverter`\<`T`, `TD`, `TC`\>

Constructs a new generic defaulting converter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Converter`](../interfaces/Converter.md)\<`T`, `TC`\> | inner [Converter](../interfaces/Converter.md) used for the base conversion. |
| `defaultValue` | `TD` | default value to be supplied if the inner conversion fails. |

#### Returns

`GenericDefaultingConverter`\<`T`, `TD`, `TC`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="defaultvalue"></a> `defaultValue` | `public` | `TD` | Default value to use if the conversion fails. |

## Accessors

### brand

#### Get Signature

> **get** **brand**(): `string` \| `undefined`

Indicates whether this element is explicitly optional.

##### Returns

`string` \| `undefined`

Returns the brand for a branded type.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`brand`](../interfaces/DefaultingConverter.md#brand)

***

### isOptional

#### Get Signature

> **get** **isOptional**(): `boolean`

Indicates whether this element is explicitly optional.

##### Returns

`boolean`

Indicates whether this element is explicitly optional.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`isOptional`](../interfaces/DefaultingConverter.md#isoptional)

## Methods

### convert()

> **convert**(`from`, `ctx?`): [`Success`](../../../../classes/Success.md)\<`T` \| `TD`\>

Converts from `unknown` to `<T>`.  For objects and arrays, is guaranteed
to return a new entity, with any unrecognized properties removed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted |
| `ctx?` | `TC` | An optional conversion context of type `<TC>` to be used in the conversion. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`T` \| `TD`\>

A [Result](../../../../type-aliases/Result.md) with a [Success](../../../../classes/Success.md) and a value on success or an
[Failure](../../../../classes/Failure.md) with a a message on failure.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`convert`](../interfaces/DefaultingConverter.md#convert)

***

### convertOptional()

> **convertOptional**(`from`, `context?`, `onError?`): [`Result`](../../../../type-aliases/Result.md)\<`T` \| `TD` \| `undefined`\>

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted |
| `context?` | `TC` | An optional conversion context of type `<TC>` to be used in the conversion. |
| `onError?` | `"failOnError"` \| `"ignoreErrors"` | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

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

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`convertOptional`](../interfaces/DefaultingConverter.md#convertoptional)

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
| `mapper` | (`from`) => [`Result`](../../../../type-aliases/Result.md)\<`T2`\> | A function which maps from the the result type `<T>` of this converter to a new result type `<T2>`. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T2`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T2>`.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`map`](../interfaces/DefaultingConverter.md#map)

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
| `mapConverter` | [`Converter`](../interfaces/Converter.md)\<`T2`, `unknown`\> | The [Converter](../interfaces/Converter.md) to be applied to the converted result from this [Converter](../interfaces/Converter.md). |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T2`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T2>`.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`mapConvert`](../interfaces/DefaultingConverter.md#mapconvert)

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

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`mapConvertItems`](../interfaces/DefaultingConverter.md#mapconvertitems)

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
| `mapper` | (`from`) => [`Result`](../../../../type-aliases/Result.md)\<`TI`\> | The map function to be applied to each element of the result of this [Converter](../interfaces/Converter.md). |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`TI`[], `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`mapItems`](../interfaces/DefaultingConverter.md#mapitems)

***

### optional()

> **optional**(`onError?`): [`Converter`](../interfaces/Converter.md)\<`T` \| `TD` \| `undefined`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) for an optional value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onError?` | `"failOnError"` \| `"ignoreErrors"` | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T` \| `TD` \| `undefined`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T|undefined>`.

#### Remarks

If `onError` is `failOnError`, the resulting converter will accept `undefined`
or a convertible value, but report an error if it encounters a value that cannot be
converted.

If `onError` is `ignoreErrors` (default) then values that cannot be converted will
result in a successful return of `undefined`.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`optional`](../interfaces/DefaultingConverter.md#optional)

***

### or()

> **or**(`__converter`): [`DefaultingConverter`](../interfaces/DefaultingConverter.md)\<`T`, `TD`, `TC`\>

Chains this converter with another of the same type, to be attempted if this
converter fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__converter` | [`Converter`](../interfaces/Converter.md)\<`T`, `TC`\> |  |

#### Returns

[`DefaultingConverter`](../interfaces/DefaultingConverter.md)\<`T`, `TD`, `TC`\>

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`or`](../interfaces/DefaultingConverter.md#or)

***

### withAction()

> **withAction**\<`T2`\>(`action`): [`Converter`](../interfaces/Converter.md)\<`T2`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) which applies a supplied action after
conversion.  The supplied action is always called regardless of success or failure
of the base conversion and is allowed to mutate the return type.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T2` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | (`result`) => [`Result`](../../../../type-aliases/Result.md)\<`T2`\> | The action to be applied. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T2`, `TC`\>

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`withAction`](../interfaces/DefaultingConverter.md#withaction)

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): [`Converter`](../interfaces/Converter.md)\<[`Brand`](../../../../type-aliases/Brand.md)\<`T` \| `TD`, `B`\>, `TC`\>

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

[`Converter`](../interfaces/Converter.md)\<[`Brand`](../../../../type-aliases/Brand.md)\<`T` \| `TD`, `B`\>, `TC`\>

A [Converter](../interfaces/Converter.md) returning `Brand<T, B>`.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`withBrand`](../interfaces/DefaultingConverter.md#withbrand)

***

### withConstraint()

> **withConstraint**(`constraint`, `options?`): [`Converter`](../interfaces/Converter.md)\<`T` \| `TD`, `TC`\>

Creates a [Converter](../interfaces/Converter.md) which applies an optional constraint to the result
of this conversion.  If this [Converter](../interfaces/Converter.md) (the base converter) succeeds, the new
converter calls a supplied constraint evaluation function with the conversion, which
fails the entire conversion if the constraint function returns either `false` or
[Failure\<T\>](../../../../classes/Failure.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | (`val`) => `boolean` \| [`Result`](../../../../type-aliases/Result.md)\<`T` \| `TD`\> | Constraint evaluation function. |
| `options?` | [`ConstraintOptions`](../interfaces/ConstraintOptions.md) | [Options](../interfaces/ConstraintOptions.md) for constraint evaluation. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T` \| `TD`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T>`.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`withConstraint`](../interfaces/DefaultingConverter.md#withconstraint)

***

### withDefault()

> **withDefault**\<`TD2`\>(`dflt`): [`DefaultingConverter`](../interfaces/DefaultingConverter.md)\<`T`, `TD2`, `TC`\>

Returns a Converter which always succeeds with the supplied default value rather
than failing.

Note that the supplied default value *overrides* the default value of this
[DefaultingConverter](../interfaces/DefaultingConverter.md).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TD2` | `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dflt` | `TD2` |

#### Returns

[`DefaultingConverter`](../interfaces/DefaultingConverter.md)\<`T`, `TD2`, `TC`\>

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`withDefault`](../interfaces/DefaultingConverter.md#withdefault)

***

### withFormattedError()

> **withFormattedError**(`formatter`): [`Converter`](../interfaces/Converter.md)\<`T` \| `TD`, `TC`\>

Creates a new [Converter](../interfaces/Converter.md) which is derived from this one but which returns an
error message formatted by the supplied formatter if the conversion fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ConversionErrorFormatter`](../type-aliases/ConversionErrorFormatter.md)\<`TC`\> | The formatter to be applied. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`T` \| `TD`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<T>`.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`withFormattedError`](../interfaces/DefaultingConverter.md#withformattederror)

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
| `guard` | (`from`) => `from is TI` | The type guard function to apply to each element. |
| `message?` | `string` | Optional message to be reported if the type guard fails. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`TI`[], `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<TI>`.

#### Remarks

Fails if the conversion result is not an array or if any member fails the
type guard.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`withItemTypeGuard`](../interfaces/DefaultingConverter.md#withitemtypeguard)

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
| `guard` | (`from`) => `from is TI` | The type guard function to apply. |
| `message?` | `string` | Optional message to be reported if the type guard fails. |

#### Returns

[`Converter`](../interfaces/Converter.md)\<`TI`, `TC`\>

A new [Converter](../interfaces/Converter.md) returning `<TI>`.

#### Implementation of

[`DefaultingConverter`](../interfaces/DefaultingConverter.md).[`withTypeGuard`](../interfaces/DefaultingConverter.md#withtypeguard)
