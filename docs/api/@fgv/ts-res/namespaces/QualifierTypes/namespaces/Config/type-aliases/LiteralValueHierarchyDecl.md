[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [QualifierTypes](../../../README.md) / [Config](../README.md) / LiteralValueHierarchyDecl

# Type Alias: LiteralValueHierarchyDecl\<T\>

> **LiteralValueHierarchyDecl**\<`T`\> = `Record`\<`T`, `T`\>

Declares a hierarchy of literal values. The keys are the names of the values, and the
values are the names of their parents.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |

## Remarks

The hierarchy is defined as a tree, where each value can have multiple children but
only one parent. The root of the tree has no parent. The hierarchy is used to
determine the relationship between values when matching conditions and contexts.
