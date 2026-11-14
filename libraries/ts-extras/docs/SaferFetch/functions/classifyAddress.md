[Home](../../README.md) > [SaferFetch](../README.md) > classifyAddress

# Function: classifyAddress

Classifies a single IP address literal.

The function is pure, synchronous, and deterministic — it performs no name
resolution and no I/O. Input that is not an IP address literal (a DNS
hostname, for instance) fails; callers that accept hostnames should treat a
failure here as "not a literal" and resolve the name, then classify each
resolved address.

Accepted forms:

- dotted-quad IPv4 (`169.254.169.254`)
- the shortened and non-decimal IPv4 forms the WHATWG URL parser accepts
  (`127.1`, `2130706433`, `0177.0.0.1`, `0x7f.1`)
- IPv6, with or without `::` compression, optionally bracketed as a URL
  `hostname` is (`[::1]`) and optionally carrying a zone id (`fe80::1%eth0`)
- IPv6 forms that embed an IPv4 address — IPv4-mapped, IPv4-compatible,
  NAT64 and 6to4 — which are classified by their embedded IPv4 address

A trailing dot is accepted on an IPv4 literal (`127.0.0.1.`), matching URL
hostname normalization.

**Classify a URL's `hostname`, never the raw URL text.** This function does
not apply IDNA/Unicode normalization, and that step is not cosmetic: the
platform's URL parser reads `http://１２７.０.０.１/`, `http://127。0。0。1/` and
even `http://⑫7.0.0.1/` as the host `127.0.0.1`, because IDNA normalizes
fullwidth digits, the ideographic full stop and circled numbers to their
ASCII equivalents. Handed one of those strings directly this function fails —
which is fail-closed, but only because the caller is then expected to treat
"not a literal" as "resolve it as a name". Reading `new URL(...).hostname`
gets the normalization for free and is the only supported use.

## Signature

```typescript
function classifyAddress(address: string): Result<IClassifiedAddress>
```
