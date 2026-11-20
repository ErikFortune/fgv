[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IGuardVerdict

# Interface: IGuardVerdict

An address guard's decision about a hop.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-pinnedaddress"></a> `pinnedAddress?` | `readonly` | `string` | The address the guard validated and to which the connection SHOULD be pinned. **Remarks** **Always `undefined` in this release** — reserved for the pinned-connect work that closes the DNS-rebinding hole. A transport that receives a defined value it cannot honor MUST fail rather than connect by hostname; [SaferFetch.platformFetchTransport](../variables/platformFetchTransport.md) does exactly that. Ignoring the hint would give a deployment that wired a pinning guard but forgot the matching transport precisely the rebinding exposure it believed it had closed, silently. |
| <a id="property-url"></a> `url` | `readonly` | `URL` | The URL cleared for request. Guards may **normalize** it — lowercase the host, strip a trailing dot, punycode an IDN — and the normalized URL is what gets requested. Guards must not **retarget** it to a different destination. **Remarks** That contract is documented rather than enforced: origin-equality enforcement would reject exactly the normalizations the guard is supposed to perform. Guards are trusted first-party code; a malicious in-process caller is out of this primitive's threat model. The one check that is enforced is the scheme — a verdict URL whose scheme is not `http:` or `https:` is rejected. |
