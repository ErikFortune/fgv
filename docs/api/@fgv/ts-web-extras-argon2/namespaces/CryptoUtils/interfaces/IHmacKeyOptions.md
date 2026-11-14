[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IHmacKeyOptions

# Interface: IHmacKeyOptions

Options for `ICryptoProvider.generateHmacKey`
and `ICryptoProvider.importHmacKey`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-extractable"></a> `extractable?` | `readonly` | `boolean` | Whether the resulting `CryptoKey` may be exported. Defaults to `false`: a non-extractable key can sign and verify but its bytes can never be read back out of the crypto implementation. |
