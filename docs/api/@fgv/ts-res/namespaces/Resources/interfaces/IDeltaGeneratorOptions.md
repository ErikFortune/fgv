[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / IDeltaGeneratorOptions

# Interface: IDeltaGeneratorOptions

Interface for options controlling delta generation behavior.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="context"></a> `context?` | [`IContextDecl`](../../Context/type-aliases/IContextDecl.md) | Context to use when resolving resources. If not provided, uses empty context. |
| <a id="resourceids"></a> `resourceIds?` | readonly `string`[] | Array of specific resource IDs to include in delta generation. If not provided, generates deltas for all resources in the delta resolver. |
| <a id="skipunchanged"></a> `skipUnchanged?` | `boolean` | Whether to skip resources that haven't changed. Default: true. |
