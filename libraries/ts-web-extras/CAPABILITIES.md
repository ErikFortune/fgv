# `@fgv/ts-web-extras` — browser-only utilities

> **This file is authoritative for what ``@fgv/ts-web-extras`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-web-extras](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras)

| Packlet | Use for |
|---|---|
| [`crypto-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/crypto-utils) | **`BrowserCryptoProvider`** — Web Crypto API implementation of `ICryptoProvider` (the same interface `NodeCryptoProvider` implements). `BrowserHashProvider` for SHA-family hashing. **`HpkeProvider`** re-exported from `@fgv/ts-extras` for browser consumers; use `HpkeProvider.create(globalThis.crypto.subtle)` in the browser. **`IdbPrivateKeyStorage`** — IndexedDB-backed `IPrivateKeyStorage` implementation that stores `CryptoKey` objects directly (structured-clone, no JWK round-trip; `supportsNonExtractable: true`); `create({ databaseName?, storeName?, indexedDB? })`; lazy DB open + per-call transactions; single-tab assumption. Use it to back `KeyStore.addKeyPair` in the browser. **Use these to back `KeyStore`, `DirectEncryptionProvider`, or any other ts-extras `crypto-utils` consumer in the browser without touching `node:crypto`.** |
| [`file-tree`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/file-tree), [`file-api-types`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/file-api-types) | `FileTree` over the browser File System Access API — drop-in implementation of the same `FileTree` interface used by `FsTree` (Node) and `ZipFileTreeAccessors` (zip). This packlet's three accessors (`FileSystemAccessTreeAccessors`, `LocalStorageTreeAccessors`, `HttpTreeAccessors`) all support the read half of the optional binary capability (`getFileBytes`, inherited from the shared in-memory base) — no byte writes, since each persists text. **`HttpTreeAccessors` is binary-safe only when you ask it to be** — pass **`contentEncoding: 'base64'`** to `fromHttp`. Under the default `'utf8'` it preloads from a JSON REST API whose `contents` field is a `string`, so the "bytes" `getFileBytes` returns are a UTF-8 encode of an already-decoded string, not the original bytes (fine for text corpora; wrong for images, PDFs, or other real binary payloads), and the inherited **strict-text** capability **fails every file** — the honest answer, since a strict decode over re-encoded text can never fail and so guarantees nothing. Under `'base64'` the server sends the file's bytes, the tree is seeded with them verbatim, and both `getFileBytes` and `getFileTextStrict` become truthful; costs ~33% more payload, which is why it is opt-in. **The client branches on the response's `encoding` field, never on what it requested**, so a server that does not implement base64 degrades to text rather than corrupting every file — meaning "asked for base64, got no `encoding` back" is itself the signal that the server didn't honour it. Requires a server implementing the `@fgv/ts-http-storage` contract at that version. `LocalStorageTreeAccessors` and `FileSystemAccessTreeAccessors` have no such option and always refuse strict text; narrow with `isStrictTextAccessors` and read a refusal as *"this store cannot tell you"*, not *"this file is corrupt"*. Byte **writes** remain unsupported on all three — `syncToDisk()` still sends text. |
| [`safer-fetch`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/safer-fetch) | **`SaferFetch.browserSaferFetchBytes` / `browserSaferFetchText` / `browserSaferFetchJson`** — the browser entry points for `@fgv/ts-extras`'s safer-fetch primitive. The runtime-agnostic core is shared verbatim (deadlines, streaming size cap, content-type gate, scheme refusal, failure taxonomy, retry). **Three guarantees are structurally absent and are stated rather than degraded**: no resolved-address (private-IP) guard (no browser API returns a hostname's A/AAAA records), no per-hop redirect revalidation (a manual redirect is opaque — `type` `'opaqueredirect'`, `status` `0`, no readable `Location`), and cross-origin credential stripping is the platform's rather than this code's. Accordingly **`redirectPolicy: 'validate-each-hop'` is refused at option resolution** with a message naming the runtime, instead of being accepted and failing at the first redirect — a caller whose URLs never redirect would otherwise ship believing per-hop revalidation was in force. `addressGuard` stays **required** here too: `allowAnyAddress()` is the honest browser posture and spelling it at the call site is what keeps the absence visible. The browser's real controls are CORS and network position. **See the guarantee table in both READMEs before adopting.** |
| [`helpers`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/helpers) | Browser file-tree convenience helpers. |
| [`url-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/url-utils) | `urlParams` parsing/serialization. |

---

## Decision shortcuts

- **Fetching a URL from a browser?** → `SaferFetch.browserSaferFetchJson` (and siblings) from **`@fgv/ts-web-extras`**, with `addressGuard: allowAnyAddress()` — the honest posture, named at the call site. The shared core's deadlines, size cap, content-type gate, taxonomy and retry all apply; the resolved-address guard and per-hop redirect revalidation **do not and cannot**, and `'validate-each-hop'` is refused up front rather than degraded. Read the guarantee table in either README before relying on it.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-08** — Closed out the safer-fetch series. ([#601](https://github.com/ErikFortune/fgv/pull/601))
- **2026-05** — **PR:** [#322](https://github.com/ErikFortune/fgv/pull/322) — `feat(auth-primitives-batch1): X25519 keypair, SPKI helpers, RFC 8785 canonicalize` ([#322](https://github.com/ErikFortune/fgv/pull/322))
- **2026-05** — **Status:** Completed 2026-05 ([#343](https://github.com/ErikFortune/fgv/pull/343))

<!-- END GENERATED: recent-additions -->
