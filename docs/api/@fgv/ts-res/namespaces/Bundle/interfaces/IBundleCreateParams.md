[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Bundle](../README.md) / IBundleCreateParams

# Interface: IBundleCreateParams

Optional parameters for bundle creation.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="datebuilt"></a> `dateBuilt?` | `string` | Optional custom build date. If not provided, the current date will be used. |
| <a id="description"></a> `description?` | `string` | Optional description to include in the bundle metadata. |
| <a id="hashnormalizer"></a> `hashNormalizer?` | [`HashingNormalizer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional hash normalizer for generating checksums. If not provided, a CRC32 normalizer will be used for browser compatibility. |
| <a id="normalize"></a> `normalize?` | `boolean` | Whether to normalize the ResourceManagerBuilder before bundle creation. When true, the builder is reconstructed in canonical order to ensure order-independent checksums. Defaults to false for Phase 1 compatibility. |
| <a id="version"></a> `version?` | `string` | Optional version identifier to include in the bundle metadata. |
