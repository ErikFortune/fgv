[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IRequestHop

# Interface: IRequestHop

One hop in a redirect chain. Entry 0 is the caller's original request.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-connectedaddress"></a> `connectedAddress?` | `readonly` | `string` | The address actually connected to on this hop, when address pinning was in effect. **Remarks** Populated from the address guard's [SaferFetch.IGuardVerdict.pinnedAddress](IGuardVerdict.md#property-pinnedaddress) once the transport has accepted it — which is sound because a transport that cannot honor a pin is required to fail rather than connect by hostname, so a completed request with a pin set is evidence the pin held. **Undefined throughout this release**, since no shipped guard pins and [SaferFetch.platformFetchTransport](../variables/platformFetchTransport.md) cannot honor one; the field is where the rebinding defense's per-hop evidence will live. |
| <a id="property-status"></a> `status?` | `readonly` | `number` | The redirect status that produced the NEXT hop; absent on the current one. |
| <a id="property-url"></a> `url` | `readonly` | `URL` | The URL under consideration for this hop. |
