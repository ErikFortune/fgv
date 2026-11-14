[Home](../../README.md) > [SaferFetch](../README.md) > blockPrivateNetworksPolicy

# Function: blockPrivateNetworksPolicy

Creates the recommended address policy: every address must be a globally
routable public unicast address.

Rejected, in both their plain and their IPv6-embedded encodings: loopback,
the link-local range that carries the cloud instance-metadata endpoint
(`169.254.169.254`), RFC 1918 private ranges, IPv6 unique-local, carrier-grade
NAT (`100.64.0.0/10`), the unspecified address, multicast, broadcast,
benchmarking, documentation and every other reserved range. The encoding
bypasses covered are IPv4-mapped IPv6 (`::ffff:169.254.169.254`),
IPv4-compatible IPv6, NAT64 (`64:ff9b::a9fe:a9fe`), 6to4 (`2002:a9fe:a9fe::`)
and the shortened / octal / hexadecimal / decimal IPv4 literal forms
(`127.1`, `0177.0.0.1`, `0x7f.1`, `2130706433`).

**What this does not protect against.** The policy classifies addresses a
caller has already resolved; it cannot see the address the connection
ultimately uses. A hostile DNS server that answers the resolution with a
public address and the connect with a private one is not stopped by this
policy — closing that requires connecting to a pinned address. The policy
also says nothing about scheme, host, port, redirects or response content.

This is the **policy-layer** factory. It is not what a safer-fetch call's
`addressGuard` option takes: an entry point takes an `IAddressGuard`, which is
the asynchronous, hop-chain-aware, name-resolving half. `blockPrivateNetworks`
(Node only) is the guard that resolves a hostname and delegates every resolved
address to this policy; reach for that unless you are classifying an address
list you already hold.

## Signature

```typescript
function blockPrivateNetworksPolicy(options: IBlockPrivateNetworksOptions): IAddressPolicy
```
