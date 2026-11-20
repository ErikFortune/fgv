<div align="center">
  <h1>ts-extras</h1>
  Assorted TypeScript Utilities
</div>

<hr/>

## Summary

Assorted less-developed or more specialized utilities borrowed from various projects - much less polished and more likely to change or disappear:

* **ExtendedArray\<T\>** - adds useful operations to the built-in Array
* **Formattable\<T\>** - simple helpers to create mustache wrappers for objects and make them easily printable  
* **Logger** - A very basic logger suitable for hobby projects
* **RangeOf\<T\>** - Generic open or closed ranges of orderable items (numbers, dates, etc)
* **ZIP FileTree** - FileTree implementation for reading from ZIP archives (Node.js)
* **Converters** - Type-safe data conversion utilities
* **CSV Helpers** - Utilities for CSV processing
* **Hash Utilities** - MD5 normalization and hashing utilities
* **RecordJar Helpers** - Utilities for record collection management

---

- [Summary](#summary)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Overview](#overview)
- [API](#api)
  - [ExtendedArray\<T\>](#extendedarrayt)
  - [Formattable\<T\>](#formattablet)
  - [Logger](#logger)
  - [RangeOf\<T\>](#rangeoft)
  - [ZIP FileTree](#zip-filetree)
  - [Converters](#converters)
  - [Other Utilities](#other-utilities)

## Installation

With npm:
```sh
npm install @fgv/ts-extras
```

## API Documentation
Extracted API documentation is [here](./docs/ts-extras.md).

## Overview

This package provides various utility functions and classes that are commonly needed across TypeScript projects, particularly those working with data processing, file handling, and type-safe operations.

## API

### ExtendedArray\<T\>

Extended array functionality with additional operations beyond the built-in Array methods.

### Formattable\<T\>

Simple helpers for creating mustache-style wrappers around objects to make them easily printable and templatable.

### Logger

A basic logging utility suitable for development and hobby projects.

### RangeOf\<T\>

Generic implementation for representing open or closed ranges of orderable items like numbers, dates, or other comparable values.

### ZIP FileTree

**Node.js-compatible** FileTree implementation for reading from ZIP archives using AdmZip:

```typescript
import { ZipFileTree } from '@fgv/ts-extras';
import { FileTree } from '@fgv/ts-utils';

// Create ZIP FileTree from buffer
const zipAccessors = ZipFileTree.ZipFileTreeAccessors.fromBuffer(zipBuffer);
const fileTree = FileTree.FileTree.create(zipAccessors.value);

// Access files and directories
const file = fileTree.value.getFile('/path/to/file.json');
const contents = file.value.getContents(); // Parsed JSON
const rawContents = file.value.getRawContents(); // Raw string
```

**Note**: This implementation uses Node.js-specific dependencies (AdmZip, Buffer). For browser environments, see the browser-specific implementations in individual projects.

### Safer Fetch

An HTTP fetch primitive with an explicit threat model, exported from `@fgv/ts-extras/safer-fetch`.
It is deliberately **not** a thin boundary over an upstream library — `fetch` is a platform global
and there is nothing to wrap. The opinion is the product: the deadlines, the scheme refusal, the
streaming size cap, the redirect posture, and the required address guard are the deliverable.

```typescript
import {
  saferFetchJson,
  blockPrivateNetworks,
  allowContentTypes
} from '@fgv/ts-extras/safer-fetch';

const result = await saferFetchJson('https://api.example.com/thing', {
  // Required, with no default: omitting it is a compile error, so no call site can inherit a
  // guarantee it was never given. Every call site's posture is greppable in one search.
  addressGuard: blockPrivateNetworks(),
  responseHeadersGuard: allowContentTypes(['application/json']).orThrow(),
  timeoutMs: 10_000,
  maxResponseBytes: 1024 * 1024,
  retry: { attempts: 2 }   // off unless asked for
});
```

`addressGuard` has no default. `allowAnyAddress()` is the named, deliberately uncomfortable
opt-out, and it is the only honest choice in a browser.

#### The guarantee table

This table is the artifact that keeps the primitive honest. It is reproduced verbatim in
`@fgv/ts-web-extras`'s README.

| Property | Node (`@fgv/ts-extras/safer-fetch`) | Browser (`@fgv/ts-web-extras`) |
|---|---|---|
| Overall + headers deadline | ✅ | ✅ |
| Streaming size cap, enforced during read | ✅ | ✅ |
| Content-type gate before body read | ✅ | ✅ |
| Structured failure taxonomy | ✅ | ✅ |
| Retry with idempotency + budget rules | ✅ | ✅ |
| Scheme allowlist on URL₀ | ✅ | ✅ |
| Host / port allowlist on URL₀ | ✅ (`blockPrivateNetworks({ allowHosts, allowPorts })`) | ✅ (caller-supplied guard) |
| **Resolved-address (private-IP) guard** | ✅ | ❌ **impossible** — no DNS API |
| **Per-hop revalidation of redirects** | ✅ | ❌ **impossible** — opaque redirect |
| **Credential stripping on cross-origin hop** | ✅ | n/a — platform does it |
| Reject-all-redirects mode | ✅ | ✅ (enforced; surfaces as `'redirect-opaque'`) |
| DNS-rebinding resistance | ❌ **documented limit** | ❌ |

Two rows differ from the design document they came from, and the difference is deliberate:

- **Host / port allowlist.** `blockPrivateNetworks` takes `allowHosts` / `allowPorts` /
  `allowInsecureHttp`. A host allowlist is the *recommended* posture, because it shrinks the
  DNS-rebinding exposure below to "an allowlisted host's own resolver is hostile". `https:` is
  required unless `allowInsecureHttp` is set; there is no default port restriction, since a
  default of `{443}` would reject the very common `:8443` public endpoint with a failure that
  reads as an SSRF block.
- **Reject-all-redirects.** Both runtimes use `redirect: 'manual'` and reject the redirect
  themselves. The *guarantee* is identical; the failure **reason** is not — Node reports
  `'redirect-rejected'` with the status, a browser reports `'redirect-opaque'` because an opaque
  response has no status to report. Callers branching on the reason under `'reject'` must handle
  both.

#### Stated limits

Each of these is a hole in a guarantee this package makes, and each is documented rather than
implied.

- **DNS rebinding** — the guard validates a resolved address and the transport then re-resolves,
  so hostile DNS can answer the two lookups differently. Closing it needs a pinning transport;
  the seam (`IGuardVerdict.pinnedAddress` + `IFetchTransport`) exists, and
  `platformFetchTransport` **fails** rather than silently ignoring a pin it cannot honor. A
  strict `allowHosts` list is the recommended mitigation.
- **The browser has no SSRF guard at all** — not a partial guarantee, an absent one. See the
  table.
- **Time-of-check/time-of-use beyond DNS** — the guard authorizes a *destination*, never the
  *content* that comes back.
- **The failure taxonomy is an information-disclosure surface** — a `'blocked-by-guard'` detail
  names the URL, the hop and the guard, which is an internal-network scanning oracle if echoed
  to an untrusted caller. Log it; return a coarse code.
- **No egress accounting** — no per-host rate limiting or quota. A retry policy is not a rate
  limiter.
- **Loopback is blocked by default**, including for this repo's own local-development path. A
  caller who wants it says so, and every deviation is independently greppable:
  `blockPrivateNetworks({ allowLoopback: true, allowInsecureHttp: true, allowHosts: ['localhost'], allowPorts: [11434] })`.
- **HTTP semantics not implemented** — no cookie jar, no cache, no conditional requests, no
  proxy configuration beyond what the platform picks up from the environment.

If your deployment has an egress proxy or firewall, that control is strictly stronger than this
one; this is defense in depth for deployments that do not.

### Converters  

Type-safe data conversion utilities for transforming between different data formats while maintaining type safety.

### Other Utilities

- **CSV Helpers**: Utilities for processing CSV data
- **Hash Utilities**: MD5 normalization and hashing functions
- **RecordJar Helpers**: Utilities for managing record collections and data structures

## Dependencies

This package depends on:
- `@fgv/ts-utils` - Core utilities and Result pattern
- `adm-zip` - ZIP file processing (Node.js only)
- Various other utility packages for specific functionality

## Platform Notes

- **ZIP FileTree**: Node.js only (uses AdmZip and Buffer)  
- **Other utilities**: Cross-platform compatible
- **Browser usage**: Most utilities work in browsers, but ZIP functionality requires browser-specific implementations
