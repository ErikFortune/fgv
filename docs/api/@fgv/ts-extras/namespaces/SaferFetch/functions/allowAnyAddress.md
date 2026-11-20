[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / allowAnyAddress

# Function: allowAnyAddress()

> **allowAnyAddress**(): [`IAddressGuard`](../interfaces/IAddressGuard.md)

An address guard that permits every address.

## Returns

[`IAddressGuard`](../interfaces/IAddressGuard.md)

## Remarks

**This is the absence of the SSRF guarantee, given a name.** It performs no address
classification, no DNS resolution, and no scheme or port narrowing beyond the core's
refusal of non-`http(s)` schemes. A call site using it is reachable at any address the
process can route to, including cloud metadata endpoints, loopback admin ports, and
RFC-1918 hosts.

It ships anyway, for two reasons. It is the honest and only possible choice in a browser,
where neither DNS resolution nor redirect interposition exists. And omitting it would not
make anyone safer — it would make consumers hand-roll something worse. It is deliberately
named to be uncomfortable in review and to grep as a distinct posture.

This is the **guard-layer** factory: it returns an [SaferFetch.IAddressGuard](../interfaces/IAddressGuard.md), which is
what an entry point's `addressGuard` option takes. A pure address *policy* — the synchronous,
address-list-in classifier a resolving guard delegates to — is a different layer and needs a
distinct name.
