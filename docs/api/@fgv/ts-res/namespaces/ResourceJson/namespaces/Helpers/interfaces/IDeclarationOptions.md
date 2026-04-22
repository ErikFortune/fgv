[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Helpers](../README.md) / IDeclarationOptions

# Interface: IDeclarationOptions

Common options when creating or displaying declarations.

## Extended by

- [`IConditionSetDeclOptions`](../../../../Conditions/interfaces/IConditionSetDeclOptions.md)
- [`ICandidateDeclOptions`](../../../../Resources/interfaces/ICandidateDeclOptions.md)
- [`IResourceDeclarationOptions`](../../../../Resources/interfaces/IResourceDeclarationOptions.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="normalized"></a> `normalized?` | `boolean` | If `true`, the output will be normalized using hash-based ordering for consistent structure. If omitted or `false`, no normalization will be applied. Defaults to `false`. |
| <a id="showdefaults"></a> `showDefaults?` | `boolean` | If `true`, properties with default values will be included in the output. If omitted or `false`, properties with default values will be omitted. |
