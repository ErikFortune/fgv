[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Qualifiers](../README.md) / IValidatedQualifierDecl

# Interface: IValidatedQualifierDecl

Validated declaration for a [Qualifier](../../../classes/Qualifier.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="defaultpriority"></a> `defaultPriority` | [`ConditionPriority`](../../../type-aliases/ConditionPriority.md) | The default [priority](../../../type-aliases/ConditionPriority.md) of conditions that depend on this qualifier. |
| <a id="defaultvalue"></a> `defaultValue?` | [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md) | Optional default value for the qualifier. |
| <a id="index"></a> `index` | [`QualifierIndex`](../../../type-aliases/QualifierIndex.md) \| `undefined` | Index of the qualifier. |
| <a id="name"></a> `name` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The name of the qualifier. |
| <a id="token"></a> `token` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The token used to identify the qualifier in the name or path of a resource being imported. |
| <a id="tokenisoptional"></a> `tokenIsOptional` | `boolean` | Indicates whether the token is optional when parsing a resource token. |
| <a id="type"></a> `type` | [`QualifierType`](../../../classes/QualifierType.md) | The [type](../../../classes/QualifierType.md) of the qualifier. |
