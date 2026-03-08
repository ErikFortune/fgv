[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / PopulateObjectOptions

# Interface: PopulateObjectOptions\<T\>

Options for the [populateObject](../functions/populateObject.md) function.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="order"></a> `order?` | keyof `T`[] | If present, specifies the order in which property values should be evaluated. Any keys not listed are evaluated after all listed keys in indeterminate order. If 'order' is not present, keys are evaluated in indeterminate order. |
| <a id="suppressundefined"></a> `suppressUndefined?` | `boolean` \| keyof `T`[] | Specify handling of `undefined` values. By default, successful `undefined` results are written to the result object. If this value is `true` then `undefined` results are suppressed for all properties. If this value is an array of property keys then `undefined` results are suppressed for those properties only. |
