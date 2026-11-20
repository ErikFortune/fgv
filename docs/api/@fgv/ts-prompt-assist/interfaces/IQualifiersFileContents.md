[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IQualifiersFileContents

# Interface: IQualifiersFileContents

Shape of the YAML body of `_qualifiers.yaml`. The store carries the
declarations; the library converts them into a `QualifierCollector` via
ts-res's `qualifierDecl` Converter at `PromptLibrary.create` time.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-qualifiers"></a> `qualifiers` | `readonly` | readonly [`IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] |
