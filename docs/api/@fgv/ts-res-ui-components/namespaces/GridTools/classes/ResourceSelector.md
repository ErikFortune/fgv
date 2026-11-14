[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / ResourceSelector

# Class: ResourceSelector

Resource selector utility for filtering resources based on various criteria.
Supports built-in selector types and extensible custom selectors.

## Example

```typescript
const selector = new ResourceSelector();

// Use built-in selectors
const prefixResult = selector.select(
  { type: 'prefix', prefix: 'user.' },
  processedResources
);

// Register and use custom selector
selector.registerSelector('byMetadata', (config, resources) => {
  return succeed(resources.summary.resourceIds.filter(id =>
    hasMetadata(id, config.key, config.value)
  ));
});
```

## Constructors

### Constructor

> **new ResourceSelector**(): `ResourceSelector`

#### Returns

`ResourceSelector`

## Methods

### getRegisteredTypes()

> **getRegisteredTypes**(): `string`[]

Get all registered selector types (useful for debugging/tooling).

#### Returns

`string`[]

***

### registerSelector()

> **registerSelector**(`type`, `handler`): `void`

Register a new selector type that can be used in grid configurations.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | `string` | Unique identifier for the selector type |
| `handler` | `SelectorHandler` | Function that implements the selection logic |

#### Returns

`void`

***

### select()

> **select**(`selector`, `resources`): [`Result`](../../../type-aliases/Result.md)\<`string`[]\>

Select resources based on the provided selector configuration.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `selector` | [`GridResourceSelector`](../type-aliases/GridResourceSelector.md) | Resource selector configuration |
| `resources` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) | Processed resources to select from |

#### Returns

[`Result`](../../../type-aliases/Result.md)\<`string`[]\>

Result containing array of selected resource IDs
