[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Bundle](../README.md) / IBundleLoaderCreateParams

# Interface: IBundleLoaderCreateParams

Parameters for creating a BundleLoader.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bundle"></a> `bundle` | [`IBundle`](IBundle.md) | The bundle to load. |
| <a id="hashnormalizer"></a> `hashNormalizer?` | [`HashingNormalizer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional hash normalizer for verifying checksums. If not provided, a CRC32 normalizer will be used for browser compatibility. Must match the normalizer used during bundle creation. |
| <a id="skipchecksumverification"></a> `skipChecksumVerification?` | `boolean` | Whether to skip checksum verification during loading. Default is false - checksum verification is performed. |
