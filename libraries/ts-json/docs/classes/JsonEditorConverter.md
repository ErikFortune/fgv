[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / JsonEditorConverter

# Class: JsonEditorConverter

A thin wrapper to allow an arbitrary [JsonEditor](JsonEditor.md) to be used via the
@fgv/ts-utils `Converter` pattern.

## Extends

- [`BaseConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

## Extended by

- [`JsonConverter`](JsonConverter.md)
- [`TemplatedJsonConverter`](TemplatedJsonConverter.md)
- [`ConditionalJsonConverter`](ConditionalJsonConverter.md)
- [`RichJsonConverter`](RichJsonConverter.md)

## Constructors

### Constructor

> **new JsonEditorConverter**(`editor`): `JsonEditorConverter`

Constructs a new [JsonEditor](JsonEditor.md)Converter which uses the supplied editor

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `editor` | [`JsonEditor`](JsonEditor.md) |  |

#### Returns

`JsonEditorConverter`

#### Overrides

`Conversion.BaseConverter<JsonValue, IJsonContext>.constructor`

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

`Conversion.BaseConverter.brand`

***

### isOptional

#### Get Signature

> **get** **isOptional**(): `boolean`

Converter.isOptional

##### Returns

`boolean`

#### Inherited from

`Conversion.BaseConverter.isOptional`

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

***

### array()

> **array**(): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Gets a derived converter which fails if the resulting converted
`JsonValue` is not a `JsonArray`.

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

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

`Conversion.BaseConverter.convert`

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

`Conversion.BaseConverter.convertOptional`

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

`Conversion.BaseConverter.map`

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

`Conversion.BaseConverter.mapConvert`

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

`Conversion.BaseConverter.mapConvertItems`

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

`Conversion.BaseConverter.mapItems`

***

### object()

> **object**(): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

Gets a derived converter which fails if the resulting converted
`JsonValue` is not a `JsonObject`.

#### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IJsonContext`](../interfaces/IJsonContext.md)\>

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

`Conversion.BaseConverter.optional`

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

`Conversion.BaseConverter.or`

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

`Conversion.BaseConverter.withAction`

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

`Conversion.BaseConverter.withBrand`

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

`Conversion.BaseConverter.withConstraint`

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

`Conversion.BaseConverter.withDefault`

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

`Conversion.BaseConverter.withFormattedError`

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

`Conversion.BaseConverter.withItemTypeGuard`

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

`Conversion.BaseConverter.withTypeGuard`

***

### createWithEditor()

> `static` **createWithEditor**(`editor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonEditorConverter`\>

Constructs a new [JsonEditor](JsonEditor.md)Converter which uses the supplied editor

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `editor` | [`JsonEditor`](JsonEditor.md) |  |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonEditorConverter`\>
