[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_resultBoundary

# Variable: \_resultBoundary

> `const` **\_resultBoundary**: `object`

**`Internal`**

Shared state of the converter / validator `Result` boundary, resolved once from the process-wide
slot (see [\_resolveResultBoundary](../functions/resolveResultBoundary.md)).

## Type Declaration

| Name | Type |
| ------ | ------ |
| <a id="property-depth"></a> `depth` | `number` |

## Remarks

`depth` counts the guarded converter and validator calls on the stack. Each wrapper reads it into
a local, increments it before calling its function and decrements it in a `finally`. Both are
plain property arithmetic, so nothing that needs stack space stands between them, and the count
is restored even when the stack is too close to its limit for a call. The wrappers are written
out in `BaseConverter` and `GenericValidator` rather than sharing a helper, so the hot path
allocates nothing.
