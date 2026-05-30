[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / IResolveResourceTreeOptions

# Interface: IResolveResourceTreeOptions

Options for configuring resource tree resolution.

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="onemptybranch"></a> `onEmptyBranch?` | `"omit"` \| [`EmptyBranchHandler`](../type-aliases/EmptyBranchHandler.md) \| `"allow"` | `'allow'` | Controls how empty branch nodes are handled during tree composition. - 'allow': Include empty branches as empty objects in the result - 'omit': Exclude empty branches from the parent object - callback: Custom handler that can provide alternate values or recovery logic |
| <a id="onresourceerror"></a> `onResourceError?` | `"fail"` \| `"ignore"` \| [`ResourceErrorHandler`](../type-aliases/ResourceErrorHandler.md) | `'fail'` | Controls how errors are handled when resolving individual resources in the tree. - 'fail': Aggregate all errors and fail if any resource fails to resolve - 'ignore': Skip failed resources and omit them from the result - callback: Custom error handler that can provide alternate values or propagate errors |
