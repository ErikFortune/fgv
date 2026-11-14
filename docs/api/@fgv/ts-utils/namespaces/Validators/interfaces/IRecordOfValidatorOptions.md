[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Validators](../README.md) / IRecordOfValidatorOptions

# Interface: IRecordOfValidatorOptions\<TK, TC\>

Options for [Validators.recordOf](../functions/recordOf.md) helper function.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tk"></a> `TK` *extends* `string` | `string` |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-keyvalidator"></a> `keyValidator?` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TK`, `TC`\> | If present, `keyValidator` is used to validate the source object property names. **Remarks** Can be used to validate key names to supported values and/or strong types. |
| <a id="property-onerror"></a> `onError?` | `"fail"` \| `"ignore"` | If `onError` is `'fail'` (default), then the entire validation fails if any key or element cannot be validated. If `onError` is `'ignore'`, failing elements are silently ignored. |
