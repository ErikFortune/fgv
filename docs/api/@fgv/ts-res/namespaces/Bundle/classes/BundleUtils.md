[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Bundle](../README.md) / BundleUtils

# Class: BundleUtils

Utility functions for working with resource bundles.
Provides reusable logic for bundle detection, parsing, and component extraction.

## Constructors

### Constructor

> **new BundleUtils**(): `BundleUtils`

#### Returns

`BundleUtils`

## Methods

### extractBundleComponents()

> `static` **extractBundleComponents**(`bundleData`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundleComponents`](../interfaces/IBundleComponents.md)\>

Extracts and validates components from a bundle for reuse.
Performs full validation of the bundle structure and creates typed components.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `bundleData` | `unknown` | The raw bundle data to extract components from |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundleComponents`](../interfaces/IBundleComponents.md)\>

Success with bundle components if valid, Failure with error message otherwise

***

### extractBundleMetadata()

> `static` **extractBundleMetadata**(`data`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundleMetadata`](../interfaces/IBundleMetadata.md)\>

Extracts just the metadata from potential bundle data without full validation.
Useful for displaying bundle information without processing the entire bundle.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `unknown` | The data to extract metadata from |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundleMetadata`](../interfaces/IBundleMetadata.md)\>

Success with metadata if found and valid, Failure otherwise

***

### isBundleFile()

> `static` **isBundleFile**(`data`): `boolean`

Checks if the given object appears to be a bundle file by examining its structure.
This is a lightweight check that doesn't perform full validation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `unknown` | The data to check |

#### Returns

`boolean`

True if the data appears to be a bundle structure

***

### isBundleFileName()

> `static` **isBundleFileName**(`fileName`): `boolean`

Checks if a file name suggests it might be a bundle file.
This is a heuristic check based on file naming conventions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileName` | `string` | The file name to check |

#### Returns

`boolean`

True if the file name suggests a bundle file

***

### parseBundleFromJson()

> `static` **parseBundleFromJson**(`jsonString`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundleComponents`](../interfaces/IBundleComponents.md)\>

Parses bundle data from a JSON string.
Convenience method that combines JSON parsing with bundle component extraction.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `jsonString` | `string` | The JSON string containing bundle data |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IBundleComponents`](../interfaces/IBundleComponents.md)\>

Success with bundle components if valid, Failure with error message otherwise
