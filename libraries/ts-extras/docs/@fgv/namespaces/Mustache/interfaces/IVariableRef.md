[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Mustache](../README.md) / IVariableRef

# Interface: IVariableRef

Represents a variable reference extracted from a Mustache template.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="issection"></a> `isSection` | `readonly` | `boolean` | Whether this variable is used in a section context (# or ^) Section variables may reference arrays/objects for iteration |
| <a id="name"></a> `name` | `readonly` | `string` | The raw variable name as it appears in the template (e.g., 'user.name') |
| <a id="path"></a> `path` | `readonly` | readonly `string`[] | The path segments parsed from the variable name (e.g., ['user', 'name']) |
| <a id="tokentype"></a> `tokenType` | `readonly` | [`MustacheTokenType`](../type-aliases/MustacheTokenType.md) | The type of token this variable was extracted from |
