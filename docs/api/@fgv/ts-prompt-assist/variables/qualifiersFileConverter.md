[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / qualifiersFileConverter

# Variable: qualifiersFileConverter

> `const` **qualifiersFileConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IQualifiersFileContents`](../interfaces/IQualifiersFileContents.md)\>

Converter for the `_qualifiers.yaml` body. Delegates per-declaration
validation to ts-res's own `qualifierDecl` Converter (does NOT shadow).
