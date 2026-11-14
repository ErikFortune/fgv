[Home](../../README.md) > [SaferFetch](../README.md) > [IClassifiedAddress](./IClassifiedAddress.md) > canonical

## IClassifiedAddress.canonical property

A canonical textual form of the address: dotted-quad for IPv4, and
lowercase RFC 5952 hex-group form (with `::` run compression) for IPv6.
Note that IPv6 addresses embedding an IPv4 address canonicalize to their
hex-group form (`::ffff:a9fe:a9fe`), not to the dotted-quad mixed form;
`embeddedIpv4` carries the readable IPv4 value.

**Signature:**

```typescript
readonly canonical: string;
```
