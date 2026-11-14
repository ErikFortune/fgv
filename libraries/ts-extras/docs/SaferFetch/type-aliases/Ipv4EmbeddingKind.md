[Home](../../README.md) > [SaferFetch](../README.md) > Ipv4EmbeddingKind

# Type Alias: Ipv4EmbeddingKind

The way an IPv6 address carried the IPv4 address whose classification was used.

Each of these is a documented SSRF bypass: an address such as
`::ffff:169.254.169.254` is an IPv6 address by family, but the address the
connection actually reaches is the embedded IPv4 one, so the embedded
address is what must be classified.

## Type

```typescript
type Ipv4EmbeddingKind = "ipv4-mapped" | "ipv4-compatible" | "nat64" | "6to4"
```
