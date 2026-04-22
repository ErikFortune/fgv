[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Conditions](../README.md) / IConditionSetDeclOptions

# Interface: IConditionSetDeclOptions

Options for creating a [ConditionSet](../classes/ConditionSet.md) declaration.

## Remarks

This interface extends the [declaration options](../../ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md)
interface to include a `reduceQualifiers` option.

## Extends

- [`IDeclarationOptions`](../../ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="normalized"></a> `normalized?` | `boolean` | If `true`, the output will be normalized using hash-based ordering for consistent structure. If omitted or `false`, no normalization will be applied. Defaults to `false`. |
| <a id="qualifierstoreduce"></a> `qualifiersToReduce?` | `ReadonlySet`\<[`QualifierName`](../../../type-aliases/QualifierName.md)\> | If provided, reduces the qualifiers of the condition set by removing qualifiers that are made irrelevant by the filterForContext. |
| <a id="showdefaults"></a> `showDefaults?` | `boolean` | If `true`, properties with default values will be included in the output. If omitted or `false`, properties with default values will be omitted. |
