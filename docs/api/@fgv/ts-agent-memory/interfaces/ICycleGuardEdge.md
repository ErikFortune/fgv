[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ICycleGuardEdge

# Interface: ICycleGuardEdge

A directed edge in the link graph the cycle guard reasons over: scope-qualified
`source` links to scope-qualified `target` under relation `type`.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-source"></a> `source` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) |
| <a id="property-target"></a> `target` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) |
| <a id="property-type"></a> `type` | `readonly` | [`LinkType`](../type-aliases/LinkType.md) |
