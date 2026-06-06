[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / BundleBuilder

# Class: BundleBuilder

Builder for creating resource bundles from a ResourceManagerBuilder.
Handles the compilation, configuration extraction, and integrity verification
needed to create a complete, portable bundle.

## Constructors

### Constructor

> **new BundleBuilder**(): `BundleBuilder`

#### Returns

`BundleBuilder`

## Methods

### create()

> `static` **create**(`builder`, `systemConfig`, `params?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundle`](../namespaces/Bundle/interfaces/IBundle.md)\>

Creates a resource bundle from a ResourceManagerBuilder.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `builder` | [`ResourceManagerBuilder`](ResourceManagerBuilder.md) | The ResourceManagerBuilder containing the resources to bundle |
| `systemConfig` | [`SystemConfiguration`](../namespaces/Config/classes/SystemConfiguration.md) | The SystemConfiguration used to create the builder |
| `params?` | [`IBundleCreateParams`](../namespaces/Bundle/interfaces/IBundleCreateParams.md) | Optional parameters for bundle creation |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundle`](../namespaces/Bundle/interfaces/IBundle.md)\>

Success with the created bundle if successful, Failure with error message otherwise

***

### createFromPredefined()

> `static` **createFromPredefined**(`builder`, `configName`, `params?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundle`](../namespaces/Bundle/interfaces/IBundle.md)\>

Creates a resource bundle from a ResourceManagerBuilder using a predefined system configuration.
This is a convenience method for the common case of using predefined configurations.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `builder` | [`ResourceManagerBuilder`](ResourceManagerBuilder.md) | The ResourceManagerBuilder containing the resources to bundle |
| `configName` | [`PredefinedSystemConfiguration`](../namespaces/Config/type-aliases/PredefinedSystemConfiguration.md) | The name of the predefined system configuration used |
| `params?` | [`IBundleCreateParams`](../namespaces/Bundle/interfaces/IBundleCreateParams.md) | Optional parameters for bundle creation |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundle`](../namespaces/Bundle/interfaces/IBundle.md)\>

Success with the created bundle if successful, Failure with error message otherwise
