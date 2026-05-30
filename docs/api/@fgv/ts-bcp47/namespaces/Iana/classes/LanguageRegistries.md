[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Iana](../README.md) / LanguageRegistries

# Class: LanguageRegistries

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="extensions"></a> `extensions` | `readonly` | [`LanguageTagExtensionRegistry`](../namespaces/LanguageTagExtensions/classes/LanguageTagExtensionRegistry.md) |
| <a id="subtags"></a> `subtags` | `readonly` | [`LanguageSubtagRegistry`](../namespaces/LanguageSubtags/classes/LanguageSubtagRegistry.md) |

## Methods

### create()

> `static` **create**(`subtags`, `extensions`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subtags` | [`LanguageSubtagRegistry`](../namespaces/LanguageSubtags/classes/LanguageSubtagRegistry.md) |
| `extensions` | [`LanguageTagExtensionRegistry`](../namespaces/LanguageTagExtensions/classes/LanguageTagExtensionRegistry.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>

***

### loadDefault()

> `static` **loadDefault**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>

***

### loadDefaultCompressed()

> `static` **loadDefaultCompressed**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>

Loads language registries from embedded compressed data.
This method uses embedded compressed ZIP data that works in both Node.js and browser environments
without requiring polyfills. This is the preferred loading method for published packages.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>

A Result containing the loaded LanguageRegistries or an error.

***

### loadFromIanaOrg()

> `static` **loadFromIanaOrg**(): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>\>

Loads language registries from the IANA.org online registries.

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>\>

A Promise with a Result containing the loaded LanguageRegistries or an error.

***

### loadFromUrls()

> `static` **loadFromUrls**(`subtagsUrl`, `extensionsUrl`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>\>

Loads language registries from custom URLs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtagsUrl` | `string` | URL to the language subtags registry. |
| `extensionsUrl` | `string` | URL to the language tag extensions registry. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>\>

A Promise with a Result containing the loaded LanguageRegistries or an error.

***

### loadFromZipBuffer()

> `static` **loadFromZipBuffer**(`zipBuffer`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>

Loads language registries from a compressed ZIP buffer (web-compatible).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipBuffer` | `ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> | ArrayBuffer or Uint8Array containing the ZIP file data. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageRegistries`\>

A Result containing the loaded LanguageRegistries or an error.
