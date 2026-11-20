[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IContextUnresolvedReference

# Type Alias: IContextUnresolvedReference

> **IContextUnresolvedReference** = `Omit`\<[`IUnresolvedTaskReference`](../interfaces/IUnresolvedTaskReference.md), `"binding"`\> & `object`

An unresolved reference as the renderer accepts it: an [IUnresolvedTaskReference](../interfaces/IUnresolvedTaskReference.md) whose
source binding is optional.

## Type Declaration

| Name | Type |
| ------ | ------ |
| `binding?` | [`ISourceBinding`](../interfaces/ISourceBinding.md) |

## Remarks

The renderer never presents a binding, so it does not require one. A host holding the full
reference passes it as it is; a bound view, which never emits a binding, passes its projected
reference without inventing one. The binding is optional here only: a stored reference still
requires it.
