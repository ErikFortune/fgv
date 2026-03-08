[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / KeyedConverterOptions

# Interface: KeyedConverterOptions\<T, TC\>

Options for [recordOf](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) and
[mapOf](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
helper functions.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `string` | `string` |
| `TC` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="keyconverter"></a> `keyConverter?` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | If present, `keyConverter` is used to convert the source object property names to keys in the resulting map or record. **Remarks** Can be used to coerce key names to supported values and/or strong types. |
| <a id="onerror"></a> `onError?` | `"fail"` \| `"ignore"` | if `onError` is `'fail'` (default), then the entire conversion fails if any key or element cannot be converted. If `onError` is `'ignore'`, failing elements are silently ignored. |
