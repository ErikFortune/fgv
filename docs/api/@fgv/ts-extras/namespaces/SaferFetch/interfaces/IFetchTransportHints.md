[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IFetchTransportHints

# Interface: IFetchTransportHints

Out-of-band information a transport may need that `RequestInit` cannot express.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-pinnedaddress"></a> `pinnedAddress?` | `readonly` | `string` | The address the address guard validated, to which this connection must be pinned. A transport that cannot pin MUST fail rather than connect by hostname. |
