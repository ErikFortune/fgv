[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceRevision

# Interface: ISourceRevision

An opaque source revision. `epoch` identifies the source's incarnation; `token`
orders revisions within it.

## Remarks

Tokens are never sorted lexically or by observation time — only the source's own
comparator orders them, and an epoch change is incomparable until an explicit
source reset establishes a new baseline.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-epoch"></a> `epoch` | `readonly` | `string` |
| <a id="property-token"></a> `token` | `readonly` | `string` |
