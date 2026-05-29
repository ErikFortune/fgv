# Stream state: `private-key-storage`

**Status:** 🟢 ready to commission — substrate prep in flight
**Integration branch:** `private-key-storage` (off `release`)
**Last updated:** 2026-05-28 (orchestrator — substrate prep)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | 🟢 ready | Single-PR feature; both impls + JSDoc fix + tests + capabilities doc together. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Ship both impls in one PR | Same feature (close the IPrivateKeyStorage gap); each impl is small + bounded; one PR keeps the JSDoc fix coherent with the impls it points at. |
| **IDB impl (browser)** with `supportsNonExtractable: true` | IDB structured-clones `CryptoKey` directly — no JWK round-trip required — so non-extractable keys are preserved. Max-security on browsers that support it. |
| **Encrypted-file impl (Node)** with `supportsNonExtractable: false` | Node `CryptoKey` isn't structured-cloneable to disk; must round-trip via JWK, which requires `extractable: true`. Documented limit. |
| Consumer-supplied encryption `CryptoKey` for the file impl (not in-band password derivation) | Decouples the impl from KeyStore's password lifecycle; consumer derives once (typically the same key the KeyStore vault uses) and passes it in. Keeps the impl Result-pattern-clean and lifecycle-agnostic. |
| FileTree I/O for the file impl | Consistent with the rest of fgv (`/filetree-io` skill); enables in-memory testing without touching disk. Default `FsTree`; overridable. |
| Single-process / single-tab assumption | v1 scope. Multi-tab IDB and inter-process file locking are out of scope; documented limits. |
| Interface unchanged | `IPrivateKeyStorage` is canonical and existing-consumer-facing; both impls satisfy the existing contract verbatim. If the agent surfaces a real interface gap, that's a separate (heavier) discussion. |
| JSDoc fix in same PR | Closes the L18 gap that surfaced this stream — the existing JSDoc points at impls that don't exist in fgv. Updating it alongside the impls keeps the docs and code in sync from day one. Removes the now-incorrect `@fgv/ts-chocolate` reference. |
| Integration branch + squash to release | Clean release history (same as recent streams: logging-observability, messages-log-levels, local-summarization). |

---

## Origin

Cross-repo gap surfaced 2026-05-28 by a personaility agent investigating agent/hub private-key persistence: `KeyStore.addKeyPair` fails with `'No private key storage configured'` unless a backend is supplied, and ts-extras ships only the interface. The `IPrivateKeyStorage` JSDoc claims impls live in `@fgv/ts-web-extras` (false — no IDB impl ships) and `@fgv/ts-chocolate` (not in this monorepo). Textbook L18 (docs describe design intent, not shipped behavior). Erik confirmed the gap and commissioned this stream to close it.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-28 | Gap verified against code | personaility agent's claim confirmed: ts-extras has interface only; `addKeyPair` requires a backend; `ts-web-extras` ships no IDB impl; `@fgv/ts-chocolate` not in this monorepo. |
| 2026-05-28 | Stream commissioned + substrate prep | brief + state + WORKSTREAMS + integration branch + substrate PR. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → integration branch |
| Implementation | TBD | not yet commissioned |
