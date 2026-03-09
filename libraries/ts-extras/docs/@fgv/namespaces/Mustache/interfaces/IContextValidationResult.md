[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Mustache](../README.md) / IContextValidationResult

# Interface: IContextValidationResult

Result of context validation, containing details about missing variables.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="isvalid"></a> `isValid` | `readonly` | `boolean` | Whether the context is valid (has all required variables) |
| <a id="missingdetails"></a> `missingDetails` | `readonly` | readonly [`IMissingVariableDetail`](IMissingVariableDetail.md)[] | Detailed information about each missing variable |
| <a id="missingvariables"></a> `missingVariables` | `readonly` | readonly `string`[] | Variables that are missing from the context |
| <a id="presentvariables"></a> `presentVariables` | `readonly` | readonly `string`[] | Variables that are present in the context |
