[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Validate](../../../README.md) / [RegularExpressions](../README.md) / conditionKey

# Variable: conditionKey

> `const` **conditionKey**: `RegExp`

**`Internal`**

The format of a [condition key](../../../../../type-aliases/ConditionKey.md) is:
<qualifierName>-[<value>][@<priority>](<scoreAsDefault>) where operator is `matches`, or
<qualifierName>-<operator>-[<value>][@<priority>](<scoreAsDefault>)
