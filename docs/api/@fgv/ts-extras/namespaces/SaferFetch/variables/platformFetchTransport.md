[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / platformFetchTransport

# Variable: platformFetchTransport

> `const` **platformFetchTransport**: [`IFetchTransport`](../interfaces/IFetchTransport.md)

The [transport](../interfaces/IFetchTransport.md) that wraps `globalThis.fetch`.

## Remarks

**Fails loudly when asked to honor a `pinnedAddress`.** `globalThis.fetch` connects by
hostname and re-resolves DNS itself, so it cannot honor a pin. Ignoring the hint instead
would mean that a deployment which wired an address-pinning guard but forgot the matching
pinning transport gets exactly the DNS-rebinding exposure it believed it had closed, and
gets it silently. A primitive that advertises a guarantee it does not have is worse than no
primitive — and that applies to future versions of itself.

No guard in this release populates `pinnedAddress`, so the interlock is dormant. It is here
so that populating it later is an additive change that cannot be made unsafely.
