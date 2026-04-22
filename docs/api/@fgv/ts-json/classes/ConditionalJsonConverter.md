[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / ConditionalJsonConverter

# Class: ConditionalJsonConverter

An @fgv/ts-utils `Converter` from `unknown` to type-safe JSON with mustache
template rendering, multi-value property name and conditional property
name rules enabled regardless of initial context.

## Extends

- [`JsonEditorConverter`](JsonEditorConverter.md)

## Constructors

### Constructor

> **new ConditionalJsonConverter**(`options?`): `ConditionalJsonConverter`

Constructs a new ConditionalJsonConverter with supplied or
default options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`ConditionalJsonConverterOptions`](../type-aliases/ConditionalJsonConverterOptions.md)\> | Optional partial [configuration or context](../type-aliases/ConditionalJsonConverterOptions.md) for the converter. |

#### Returns

`ConditionalJsonConverter`

#### Overrides

[`JsonEditorConverter`](JsonEditorConverter.md).[`constructor`](JsonEditorConverter.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_brand"></a> `_brand?` | `protected` | `string` | **`Internal`** |
| <a id="_defaultcontext"></a> `_defaultContext?` | `readonly` | [`IJsonContext`](../interfaces/IJsonContext.md) | **`Internal`** |
| <a id="_isoptional"></a> `_isOptional` | `protected` | `boolean` | **`Internal`** |
| <a id="editor"></a> `editor` | `readonly` | [`JsonEditor`](JsonEditor.md) | - |
| <a id="conditionaloptions"></a> `conditionalOptions` | `readonly` | `Partial`\<[`IJsonConverterOptions`](../interfaces/IJsonConverterOptions.md)\> | Default [JSON converter options](../interfaces/IJsonConverterOptions.md) to enable conditional conversion. |

## Accessors

### brand

#### Get Signature

> **get** **brand**(): `string` \| `undefined`

Returns the brand for a branded type.

##### Returns

`string` \| `undefined`

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`brand`](JsonEditorConverter.md#brand)

***

### isOptional

#### Get Signature

> **get** **isOptional**(): `boolean`

Indicates whether this element is explicitly optional.

##### Returns

`boolean`

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`isOptional`](JsonEditorConverter.md#isoptional)

## Methods

### \_context()

> `protected` **\_context**(`supplied?`): [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `supplied?` | [`IJsonContext`](../interfaces/IJsonContext.md) |

#### Returns

[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`_context`](JsonEditorConverter.md#_context)

***

### \_convert()

> `protected` **\_convert**(`from`, `context?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`_convert`](JsonEditorConverter.md#_convert)

***

### \_traits()

> `protected` **\_traits**(`traits?`): [`ConverterTraits`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `traits?` | `Partial`\<[`ConverterTraits`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\> |

#### Returns

[`ConverterTraits`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`_traits`](JsonEditorConverter.md#_traits)

***

### \_with()

> `protected` **\_with**(`traits`): `this`

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `traits` | `Partial`\<[`ConverterTraits`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\> |

#### Returns

`this`

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`_with`](JsonEditorConverter.md#_with)

***

### array()

> **array**(): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Gets a derived converter which fails if the resulting converted
`JsonValue` is not a `JsonArray`.

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`array`](JsonEditorConverter.md#array)

***

### convert()

> **convert**(`from`, `context?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

Converts from `unknown` to `<T>`. For objects and arrays, is guaranteed
to return a new entity, with any unrecognized properties removed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional conversion context of type `<TC>` to be used in the conversion. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

A [Result](../../ts-res-ui-components/type-aliases/Result.md) with a [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) and a value on success or an
[Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with a a message on failure.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`convert`](JsonEditorConverter.md#convert)

***

### convertOptional()

> **convertOptional**(`from`, `context?`, `onError?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) \| `undefined`\>

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional conversion context of type `<TC>` to be used in the conversion. |
| `onError?` | [`OnError`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) \| `undefined`\>

A [Result](../../ts-res-ui-components/type-aliases/Result.md) with a [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) and a value on success or an
[Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with a a message on failure.

#### Remarks

If `onError` is `failOnError`, the converter succeeds for
`undefined` or any convertible value, but reports an error
if it encounters a value that cannot be converted.

If `onError` is `ignoreErrors` (default) then values that
cannot be converted result in a successful return of `undefined`.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`convertOptional`](JsonEditorConverter.md#convertoptional)

***

### map()

> **map**\<`T2`\>(`mapper`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which applies a (possibly) mapping conversion to
the converted value of this [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T2`\> | A function which maps from the the result type `<T>` of this converter to a new result type `<T2>`. |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<T2>`.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`map`](JsonEditorConverter.md#map)

***

### mapConvert()

> **mapConvert**\<`T2`\>(`mapConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which applies an additional supplied
converter to the result of this converter.

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`\> | The [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) to be applied to the converted result from this [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs). |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<T2>`.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`mapConvert`](JsonEditorConverter.md#mapconvert)

***

### mapConvertItems()

> **mapConvertItems**\<`TI`\>(`mapConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which maps the individual items of a collection
resulting from this [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) using the supplied [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, `unknown`\> | The [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) to be applied to each element of the result of this [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs). |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`mapConvertItems`](JsonEditorConverter.md#mapconvertitems)

***

### mapItems()

> **mapItems**\<`TI`\>(`mapper`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which maps the individual items of a collection
resulting from this [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) using the supplied map function.

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TI`\> | The map function to be applied to each element of the result of this [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs). |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<TI[]>`.

#### Remarks

Fails if `from` is not an array.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`mapItems`](JsonEditorConverter.md#mapitems)

***

### object()

> **object**(): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Gets a derived converter which fails if the resulting converted
`JsonValue` is not a `JsonObject`.

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`object`](JsonEditorConverter.md#object)

***

### optional()

> **optional**(`onError?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) \| `undefined`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) for an optional value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onError?` | [`OnError`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Specifies handling of values that cannot be converted (default `ignoreErrors`). |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) \| `undefined`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<T|undefined>`.

#### Remarks

If `onError` is `failOnError`, the resulting converter will accept `undefined`
or a convertible value, but report an error if it encounters a value that cannot be
converted.

If `onError` is `ignoreErrors` (default) then values that cannot be converted will
result in a successful return of `undefined`.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`optional`](JsonEditorConverter.md#optional)

***

### or()

> **or**(`other`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Chains this converter with another of the same type, to be attempted if this
converter fails.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `other` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`IJsonContext`](../interfaces/IJsonContext.md)\> |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`or`](JsonEditorConverter.md#or)

***

### withAction()

> **withAction**\<`TI`\>(`action`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which applies a supplied action after
conversion. The supplied action is always called regardless of success or failure
of the base conversion and is allowed to mutate the return type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | (`result`, `context?`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TI`\> | The action to be applied. |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withAction`](JsonEditorConverter.md#withaction)

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), `B`\>, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Returns a converter which adds a brand to the type to prevent mismatched usage
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

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), `B`\>, [`IJsonContext`](../interfaces/IJsonContext.md)\>

A [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `Brand<T, B>`.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withBrand`](JsonEditorConverter.md#withbrand)

***

### withConstraint()

> **withConstraint**(`constraint`, `options?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which applies an optional constraint to the result
of this conversion. If this [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) (the base converter) succeeds, the new
converter calls a supplied constraint evaluation function with the conversion, which
fails the entire conversion if the constraint function returns either `false` or
[Failure\<T\>](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | (`val`, `context?`) => `boolean` \| [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\> | Constraint evaluation function. |
| `options?` | [`ConstraintOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | [Options](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) for constraint evaluation. |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<T>`.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withConstraint`](JsonEditorConverter.md#withconstraint)

***

### withDefault()

> **withDefault**\<`TD`\>(`defaultValue`): [`DefaultingConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), `TD`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Returns a Converter which always succeeds with a default value rather than failing.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TD` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `defaultValue` | `TD` | The default value to use if conversion fails. |

#### Returns

[`DefaultingConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), `TD`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withDefault`](JsonEditorConverter.md#withdefault)

***

### withFormattedError()

> **withFormattedError**(`formatter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which is derived from this one but which returns an
error message formatted by the supplied formatter if the conversion fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ConversionErrorFormatter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md)\> | The formatter to be applied. |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<T>`.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withFormattedError`](JsonEditorConverter.md#withformattederror)

***

### withItemTypeGuard()

> **withItemTypeGuard**\<`TI`\>(`guard`, `message?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which applies a supplied type guard to each member of
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

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<TI>`.

#### Remarks

Fails if the conversion result is not an array or if any member fails the
type guard.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withItemTypeGuard`](JsonEditorConverter.md#withitemtypeguard)

***

### withTypeGuard()

> **withTypeGuard**\<`TI`\>(`guard`, `message?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Creates a [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which applies a supplied type guard to the conversion
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

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

A new [Converter](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) returning `<TI>`.

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withTypeGuard`](JsonEditorConverter.md#withtypeguard)

***

### create()

> `static` **create**(`options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonConverter`](JsonConverter.md)\>

Constructs a new ConditionalJsonConverter with supplied or
default options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`ConditionalJsonConverterOptions`](../type-aliases/ConditionalJsonConverterOptions.md)\> | Optional partial [configuration or context](../type-aliases/ConditionalJsonConverterOptions.md) for the converter. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonConverter`](JsonConverter.md)\>

***

### createWithEditor()

> `static` **createWithEditor**(`editor`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonEditorConverter`](JsonEditorConverter.md)\>

Constructs a new [JsonEditor](JsonEditor.md)Converter which uses the supplied editor

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `editor` | [`JsonEditor`](JsonEditor.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonEditorConverter`](JsonEditorConverter.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`createWithEditor`](JsonEditorConverter.md#createwitheditor)
