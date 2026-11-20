[Home](../../README.md) > [SaferFetch](../README.md) > AddressClassification

# Type Alias: AddressClassification

The security-relevant classification of an IP address.

`'public'` is the only classification that describes an address which is
globally routable on the public internet; every other value names a
special-purpose range that a server-side fetch reaching untrusted input
should not be able to reach by default.

## Type

```typescript
type AddressClassification = "public" | "unspecified" | "loopback" | "link-local" | "private" | "unique-local" | "carrier-grade-nat" | "benchmarking" | "documentation" | "protocol-assignment" | "multicast" | "broadcast" | "reserved"
```
