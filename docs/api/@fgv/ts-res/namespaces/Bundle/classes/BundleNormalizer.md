[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Bundle](../README.md) / BundleNormalizer

# Class: BundleNormalizer

Normalizes ResourceManagerBuilder instances to ensure consistent ordering
of internal entities, enabling order-independent bundle checksums.

The normalization process rebuilds the ResourceManagerBuilder from the ground up
in a canonical order to ensure identical index assignments regardless of
original construction order.

## Constructors

### Constructor

> **new BundleNormalizer**(): `BundleNormalizer`

#### Returns

`BundleNormalizer`

## Methods

### normalize()

> `static` **normalize**(`originalBuilder`, `systemConfig`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md)\>

Creates a normalized ResourceManagerBuilder from an existing builder.
The normalized builder will have identical entities but arranged in
canonical order to ensure consistent index assignments.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `originalBuilder` | [`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md) | The ResourceManagerBuilder to normalize |
| `systemConfig` | [`SystemConfiguration`](../../Config/classes/SystemConfiguration.md) | The SystemConfiguration used to create the original builder |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md)\>

Success with the normalized ResourceManagerBuilder if successful, Failure otherwise

***

### normalizeFromPredefined()

> `static` **normalizeFromPredefined**(`originalBuilder`, `configName`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md)\>

Creates a normalized ResourceManagerBuilder using a predefined system configuration.
This is a convenience method for the common case of using predefined configurations.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `originalBuilder` | [`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md) | The ResourceManagerBuilder to normalize |
| `configName` | [`PredefinedSystemConfiguration`](../../Config/type-aliases/PredefinedSystemConfiguration.md) | The name of the predefined system configuration used |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md)\>

Success with the normalized ResourceManagerBuilder if successful, Failure otherwise
