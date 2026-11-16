[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IEdge

# Interface: IEdge

An attributed link between two records. Carries the relation type, the
scope-qualified [target](IEdgeTarget.md), and optional confidence /
provenance / world-truth validity. Replaces bare string references (e.g.
PersonAIlity's `IMtmRef` becomes an `IEdge` with `type: LinkType('mtm-ref')`).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | Optional confidence in `[0, 1]`. |
| <a id="property-invalid_at"></a> `invalid_at?` | `readonly` | `number` \| `null` | World-truth validity end (epoch ms). `null` = still valid; absent = no temporal extent. |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`IProvenance`](IProvenance.md) | Optional structured provenance for the link itself. |
| <a id="property-target"></a> `target` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | The scope-qualified address of the linked-to record. |
| <a id="property-type"></a> `type` | `readonly` | [`LinkType`](../type-aliases/LinkType.md) | Open-vocabulary relation type. |
| <a id="property-valid_at"></a> `valid_at?` | `readonly` | `number` | World-truth validity start (epoch ms). Present only on temporal edges. |
