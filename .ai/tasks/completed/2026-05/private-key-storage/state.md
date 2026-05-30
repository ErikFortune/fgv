# Stream state: `private-key-storage`

**Status:** ✅ implemented + reviewed — gates green, approved-to-merge round; ready for squash to `release`
**Integration branch:** `private-key-storage` (off `release`)
**Work branch:** `claude/epic-hawking-4FMka` → PR **#427** targets `private-key-storage`
**Last updated:** 2026-05-30 (review complete, merge round)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | ✅ done | Both impls + JSDoc fix + tests + capabilities doc + `minor` rush change files. Full `rush build` clean; `rushx lint` clean both packages; 100% coverage on both new files. See `result.md` for signature deltas, id-sanitization (reject), delete-missing (fail, consistent), and the `fake-indexeddb` / `structuredClone` test notes. |
| Review | ✅ done | PR #427: ~7 Copilot rounds + 1 `code-reviewer` agent pass. All substantive findings resolved (browser-barrel `node:crypto` isolation, `./crypto`+`./crypto/keystore` per-condition export/types split, IDB durability + version-bump + stale-handle + sync-throw capture, JWK `key_ops` round-trip, unsafe-cast cleanups, store/load chaining refactor). Final round was minor hygiene → merge. |

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

Cross-repo gap surfaced 2026-05-28 by a hardback agent investigating agent/hub private-key persistence: `KeyStore.addKeyPair` fails with `'No private key storage configured'` unless a backend is supplied, and ts-extras ships only the interface. The `IPrivateKeyStorage` JSDoc claims impls live in `@fgv/ts-web-extras` (false — no IDB impl ships) and `@fgv/ts-chocolate` (not in this monorepo). Textbook L18 (docs describe design intent, not shipped behavior). Erik confirmed the gap and commissioned this stream to close it.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-28 | Gap verified against code | hardback agent's claim confirmed: ts-extras has interface only; `addKeyPair` requires a backend; `ts-web-extras` ships no IDB impl; `@fgv/ts-chocolate` not in this monorepo. |
| 2026-05-28 | Stream commissioned + substrate prep | brief + state + WORKSTREAMS + integration branch + substrate PR (#426). |
| 2026-05-29 | Implementation PR opened | PR #427 → `private-key-storage`. Both impls + JSDoc fix + docs + tests; gates green at open. |
| 2026-05-29 | Review rounds (Copilot ×~7) | Resolved: browser-barrel `node:crypto` isolation (new `keystore/index.browser.ts`); `./crypto/keystore` per-condition JS+types split (mirror `./crypto`, drop top-level `types`); IDB write durability (`oncomplete`), version-bump-on-missing-store + `onversionchange` stale-handle clear, sync-throw capture; unsafe-cast cleanups; doc-accuracy (Node-only). |
| 2026-05-30 | `code-reviewer` agent pass | Surfaced store/load imperative-block density → flattened into Result chains with named helpers; `key.type`-before-`_algorithmOf` ordering; `importPublicKey` doc-accuracy; resolvable api-link warnings. |
| 2026-05-30 | JWK `key_ops` round-trip fix | `_importUsagesFor` intersects algorithm private usages with the stored JWK's `key_ops` (fallback when absent), so narrower-usage keys re-import. |
| 2026-05-30 | Final hygiene round → merge | Scoped the encrypt error-formatter to its stage; plain-text private-method doc ref (drops an api warning). Erik: minor hygiene = merge after this round. |

---

## Follow-ups (recorded in `result.md` for orchestrator triage)

- **TECH_DEBT candidate:** `captureAsyncResult` should return `AsyncResult<T>` (chainable) rather than `Promise<Result<T>>` — type-compatible; deferred to its own ts-utils PR with a full-repo sweep.
- **Process:** add "evidence of code-reviewer run + resolution" as a required PR-description gate (a single pre-push `code-reviewer` pass would have pre-empted several Copilot rounds here).

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | #426 | ✅ merged → integration branch |
| Implementation | #427 | ✅ reviewed, gates green → awaiting merge to `private-key-storage`, then squash to `release` |
