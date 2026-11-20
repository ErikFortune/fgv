[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Conditions](../../../README.md) / [Convert](../README.md) / conditionSetDecl

# Variable: conditionSetDecl

> `const` **conditionSetDecl**: [`ObjectConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConditionSetDecl`](../../../interfaces/IConditionSetDecl.md)\<`string`\>, `unknown`\>

Converter which converts to a [condition set declaration](../../../interfaces/IConditionSetDecl.md).

## Remarks

Accepts any string as the qualifier name of each contained condition. Use
`typedConditionSetDecl` to narrow the accepted set of qualifier names to a literal-string union.
