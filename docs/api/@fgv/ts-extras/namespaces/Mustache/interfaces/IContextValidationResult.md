[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Mustache](../README.md) / IContextValidationResult

# Interface: IContextValidationResult

Result of context validation, containing details about missing variables.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-isvalid"></a> `isValid` | `readonly` | `boolean` | Whether the context is valid (has all required variables) |
| <a id="property-missingdetails"></a> `missingDetails` | `readonly` | readonly [`IMissingVariableDetail`](IMissingVariableDetail.md)[] | Detailed information about each missing variable |
| <a id="property-missingvariables"></a> `missingVariables` | `readonly` | readonly `string`[] | Variables that are missing from the context |
| <a id="property-presentvariables"></a> `presentVariables` | `readonly` | readonly `string`[] | Variables that are present in the context |
