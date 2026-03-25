[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / JsonConverter

# Class: JsonConverter

An @fgv/ts-utils `Converter` from `unknown` to type-safe JSON, optionally
rendering any string property names or values using mustache with a supplied view.

## Extends

- [`JsonEditorConverter`](JsonEditorConverter.md)

## Constructors

### Constructor

> **new JsonConverter**(`options?`): `JsonConverter`

Constructs a new JsonConverter with
supplied or default options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`IJsonConverterOptions`](../interfaces/IJsonConverterOptions.md)\> | Optional partial [options](../interfaces/IJsonConverterOptions.md) to configure the converter. |

#### Returns

`JsonConverter`

#### Overrides

[`JsonEditorConverter`](JsonEditorConverter.md).[`constructor`](JsonEditorConverter.md#constructor)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="editor"></a> `editor` | `readonly` | [`JsonEditor`](JsonEditor.md) |

## Accessors

### brand

#### Get Signature

> **get** **brand**(): `string` \| `undefined`

Converter.brand

##### Returns

`string` \| `undefined`

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`brand`](JsonEditorConverter.md#brand)

***

### isOptional

#### Get Signature

> **get** **isOptional**(): `boolean`

Converter.isOptional

##### Returns

`boolean`

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`isOptional`](JsonEditorConverter.md#isoptional)

## Methods

### \_convert()

> `protected` **\_convert**(`from`, `context?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`_convert`](JsonEditorConverter.md#_convert)

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

> **convert**(`from`, `context?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Converter.convert

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`convert`](JsonEditorConverter.md#convert)

***

### convertOptional()

> **convertOptional**(`from`, `context?`, `onError?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`\>

Converter.convertOptional

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) |
| `onError?` | [`OnError`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`convertOptional`](JsonEditorConverter.md#convertoptional)

***

### map()

> **map**\<`T2`\>(`mapper`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.map

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`\> |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`map`](JsonEditorConverter.md#map)

***

### mapConvert()

> **mapConvert**\<`T2`\>(`mapConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.mapConvert

#### Type Parameters

| Type Parameter |
| ------ |
| `T2` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mapConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`\> |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T2`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`mapConvert`](JsonEditorConverter.md#mapconvert)

***

### mapConvertItems()

> **mapConvertItems**\<`TI`\>(`mapConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.mapConvertItems

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mapConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, `unknown`\> |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`mapConvertItems`](JsonEditorConverter.md#mapconvertitems)

***

### mapItems()

> **mapItems**\<`TI`\>(`mapper`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.mapItems

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mapper` | (`from`, `context?`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`\> |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

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

> **optional**(`onError?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.optional

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `onError?` | [`OnError`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`optional`](JsonEditorConverter.md#optional)

***

### or()

> **or**(`other`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Chains this converter with another of the same type, to be attempted if this
converter fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\> |  |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`or`](JsonEditorConverter.md#or)

***

### withAction()

> **withAction**\<`TI`\>(`action`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.withAction

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | (`result`, `context?`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`\> |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withAction`](JsonEditorConverter.md#withaction)

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), `B`\>, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.withBrand

#### Type Parameters

| Type Parameter |
| ------ |
| `B` *extends* `string` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `brand` | `B` |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), `B`\>, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withBrand`](JsonEditorConverter.md#withbrand)

***

### withConstraint()

> **withConstraint**(`constraint`, `options?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.withConstraint

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `constraint` | (`val`, `context?`) => `boolean` \| [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> |
| `options?` | [`ConstraintOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withConstraint`](JsonEditorConverter.md#withconstraint)

***

### withDefault()

> **withDefault**\<`TD`\>(`defaultValue`): [`DefaultingConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), `TD`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.withDefault

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TD` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `defaultValue` | `TD` |

#### Returns

[`DefaultingConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), `TD`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withDefault`](JsonEditorConverter.md#withdefault)

***

### withFormattedError()

> **withFormattedError**(`formatter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.withFormattedError

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `formatter` | [`ConversionErrorFormatter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md)\> |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withFormattedError`](JsonEditorConverter.md#withformattederror)

***

### withItemTypeGuard()

> **withItemTypeGuard**\<`TI`\>(`guard`, `message?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.withItemTypeGuard

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `guard` | (`from`, `context?`) => `from is TI` |
| `message?` | `string` |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`[], [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withItemTypeGuard`](JsonEditorConverter.md#withitemtypeguard)

***

### withTypeGuard()

> **withTypeGuard**\<`TI`\>(`guard`, `message?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

Converter.withTypeGuard

#### Type Parameters

| Type Parameter |
| ------ |
| `TI` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `guard` | (`from`, `context?`) => `from is TI` |
| `message?` | `string` |

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TI`, [`IJsonContext`](../interfaces/IJsonContext.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`withTypeGuard`](JsonEditorConverter.md#withtypeguard)

***

### create()

> `static` **create**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonConverter`\>

Creates a new JsonConverter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`IJsonConverterOptions`](../interfaces/IJsonConverterOptions.md)\> | Optional partial [options](../interfaces/IJsonConverterOptions.md) to configure the converter. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonConverter`\>

`Success` with a new JsonConverter, or `Failure`
with an informative message if an error occurs.

***

### createWithEditor()

> `static` **createWithEditor**(`editor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonEditorConverter`](JsonEditorConverter.md)\>

Constructs a new [JsonEditor](JsonEditor.md)Converter which uses the supplied editor

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `editor` | [`JsonEditor`](JsonEditor.md) |  |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonEditorConverter`](JsonEditorConverter.md)\>

#### Inherited from

[`JsonEditorConverter`](JsonEditorConverter.md).[`createWithEditor`](JsonEditorConverter.md#createwitheditor)
