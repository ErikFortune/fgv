[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContextRendererCreateParams

# Interface: ITaskContextRendererCreateParams

Parameters for [TaskContextRenderer.create](../classes/TaskContextRenderer.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-converters"></a> `converters?` | `readonly` | [`TaskConverters`](../classes/TaskConverters.md) | Converters whose field bounds validate input. Defaults to `TaskConverters.create()`. |
| <a id="property-projection"></a> `projection?` | `readonly` | [`TaskContextProjection`](../type-aliases/TaskContextProjection.md) | The disclosure projection. Defaults to [defaultTaskContextProjection](../functions/defaultTaskContextProjection.md). |
| <a id="property-unresolvedprojection"></a> `unresolvedProjection?` | `readonly` | [`TaskContextUnresolvedProjection`](../type-aliases/TaskContextUnresolvedProjection.md) | The disclosure projection for unresolved references. Defaults to passing them through; their binding is never rendered either way. |
