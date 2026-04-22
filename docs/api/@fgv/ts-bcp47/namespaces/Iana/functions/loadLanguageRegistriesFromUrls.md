[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Iana](../README.md) / loadLanguageRegistriesFromUrls

# Function: loadLanguageRegistriesFromUrls()

> **loadLanguageRegistriesFromUrls**(`subtagsUrl`, `extensionsUrl`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>\>

Loads language registries from custom URLs.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtagsUrl` | `string` | URL to the language subtags registry. |
| `extensionsUrl` | `string` | URL to the language tag extensions registry. |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>\>

A Promise with a Result containing the loaded LanguageRegistries or an error.
