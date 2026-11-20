[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_resolveResultBoundary

# Function: \_resolveResultBoundary()

> **\_resolveResultBoundary**(): `object`

**`Internal`**

Returns the process-wide boundary state, creating it on first use. Every copy of `@fgv/ts-utils`
loaded into one process (two installed versions, or a bundle beside a dependency) resolves the
same object, so a converter from one copy nested inside a converter from another still sees the
true nesting depth.

## Returns

`object`

| Name | Type |
| ------ | ------ |
| `depth` | `number` |
