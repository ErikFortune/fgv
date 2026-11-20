# Stream: crypto-batch-2-hpke

**Status:** Completed 2026-05  
**Work branch:** `claude/crypto-batch-2-hpke-impl-pR3QU`  
**PR target:** `claude/crypto-batch-2-features`

---

## What was delivered

`HpkeProvider` — HPKE base mode (RFC 9180) for `@fgv/ts-extras`:

- **Cipher suite:** DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM
- **API:** Class-based factory pattern matching the existing `NodeCryptoProvider` / `BrowserCryptoProvider` / `KeyStore` shape
- **Public surface:** `sealBase`, `openBase`, `hkdf`, `encodeEnvelope`, `decodeEnvelope`
- **Cross-runtime:** Single implementation in `ts-extras`; re-exported from `ts-web-extras` for browser callers
- **Runtime requirements:** Node 20+; Chrome 113+, Safari 16.4+, Firefox 118+

### Files added / modified

| File | Change |
|---|---|
| `libraries/ts-extras/src/packlets/crypto-utils/hpkeProvider.ts` | New — full implementation |
| `libraries/ts-extras/src/packlets/crypto-utils/index.ts` | Export HpkeProvider, IHpkeSealResult |
| `libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts` | Export HpkeProvider, IHpkeSealResult |
| `libraries/ts-extras/src/test/unit/crypto/hpke-test-vectors.ts` | Shared test vectors (RFC 5869 + self-generated cross-runtime anchors) |
| `libraries/ts-extras/src/test/unit/crypto/hpkeProvider.test.ts` | Node.js tests (24 tests, 100% coverage) |
| `libraries/ts-web-extras/src/packlets/crypto-utils/index.ts` | Re-export HpkeProvider via CryptoUtils namespace |
| `libraries/ts-web-extras/src/test/unit/hpkeProvider.test.ts` | Browser tests (18 tests, cross-runtime anchor validation) |
| `.ai/instructions/LIBRARY_CAPABILITIES.md` | HpkeProvider entry + decision shortcuts |

---

## Key decisions

| Decision | Rationale |
|---|---|
| Class `HpkeProvider` (private ctor + `static create(subtle)`) | Matches fgv factory pattern: `NodeCryptoProvider`, `BrowserCryptoProvider`, `KeyStore`, `DirectEncryptionProvider` |
| `SubtleCrypto` captured at construction | Test injection trivial; no per-call overhead |
| `encodeEnvelope`/`decodeEnvelope` as static methods on class | Avoids `@typescript-eslint/no-namespace` lint; TypeScript class merges value+type |
| `"eae_prk"` label in ExtractAndExpand (B.0 correction) | RFC 9180 §4.1 uses `"eae_prk"`, not `"dh"` as design.md §1 stated — confirmed via OpenSSL happykey source and multiple independent implementations |
| `_toBufferView` on all `SubtleCrypto` inputs | TypeScript 5.x strict `Uint8Array<ArrayBuffer>` vs `Uint8Array<ArrayBufferLike>` — Web Crypto API rejects the latter; copy pattern from `browserCryptoProvider.ts` |
| Self-generated cross-runtime anchors for test vectors | RFC 9180 Appendix A has no DHKEM(X25519)+AES-256-GCM vectors; A.1 covers X25519+AES-128-GCM only |
| Re-export via `CryptoUtils.HpkeProvider` not `@fgv/ts-extras/crypto` subpath | `moduleResolution: node` (the monorepo rig default) doesn't resolve `exports` field subpaths; top-level namespace import is backward-compatible |

---

## Artifacts preserved

- `design.md` — Phase A design (note: uses "dh" label in §1 which was corrected in B.0)
- `state.md` — Full decision log including B.0 discrepancy resolution
- `brief.md` — Phase A brief
- `brief-phase-b.md` — Phase B implementation contract
- `meta.yaml` — structured record (added 2026-08-14)

---

## Appendix A — notes (2026-08-14)

Produced by a `/finalize-task retroactive` run whose antagonist pass commissioned an
independent reviewer against this stream's artifacts and the shipped source. Unlike its
sibling streams' READMEs, **no statement in this file was found to be wrong** — the notes
below add facts it did not carry. The `design.md` error it already flags is left in place
deliberately, per A.2.

### A.1 — browser coverage did not reach 100%, and that was a binding criterion

The test table above gives "100% coverage" for the Node row and no figure for the browser
row. That silence is accurate but easy to read as an omission rather than a distinction.
PR [#348](https://github.com/ErikFortune/fgv/pull/348)'s own description states it
plainly: *"Tests (100% coverage in ts-extras; 95%+ in ts-web-extras)."*
`brief-phase-b.md`'s acceptance criteria required 100% in **both** packages, so this is an
unmet binding criterion — disclosed at the time, never carried into any completion record.
Recorded here so it is not silently rounded up by a later reader. (A first pass at
`meta.yaml` did exactly that.)

### A.2 — the `design.md` "dh" error is intentionally left uncorrected

Worth stating explicitly because it looks like an oversight. `design.md` §1 still specifies
`LabeledExtract(kem_suite_id, empty_salt, "dh", dh)` in both Encap and Decap pseudocode,
where RFC 9180 §4.1 requires `"eae_prk"`. The shipped code uses `"eae_prk"` — verified in
current source and in the original squash-merge commit — and `state.md` records the B.0
resolution with its rationale.

This is the stream's best moment and the artifact should keep showing it: a signed-off
design was wrong on a cryptographic detail, step-zero verification caught it, and the
implementing agent stopped and surfaced rather than implementing the contract as written.
Correcting `design.md` in place would erase the evidence that the check worked. The
pointer in "Artifacts preserved" is the right treatment.

### A.3 — the HKDF vectors *are* externally anchored; only seal/open is self-anchored

The cross-runtime strategy is easy to describe too broadly. `HKDF_RFC5869_CASE1` in
`hpke-test-vectors.ts` comes from RFC 5869 Appendix A.1 and validates `hkdf` in both
suites. Only `SEAL_VECTORS` is self-generated, and necessarily so: RFC 9180 Appendix A
carries no DHKEM(X25519) + AES-256-GCM vectors (A.1 is AES-128-GCM). So the HKDF
sub-primitive is spec-conformant; the HPKE seal/open path is proven Node/browser-consistent
but not externally conformant.

### A.4 — the `moduleResolution` constraint still holds, unchanged

The `CryptoUtils.HpkeProvider` decision (rather than a `@fgv/ts-extras/crypto` subpath) is
sometimes assumed to have been overtaken by later module-resolution work. It has not.
`.claude/project/esm-emit-design.md` Amendment 2 found `moduleResolution: bundler` illegal
on a `module: commonjs` project — which all 29 rig-inheriting projects are — leaving
`node10` "the only legal value", and `libraries/ts-extras/tsconfig.json` still sets it.
`LIBRARY_CAPABILITIES.md` does mention the subpath, but that line was added by the
unrelated `private-key-storage` stream (#430), and the subpath resolves only under a
*consumer's* own `bundler` setting. The original reasoning stands.

### A.5 — unlogged duplication, and a dropped option

Two small omissions. `_toBufferView` in `hpkeProvider.ts` is a near-verbatim copy of
`toBufferView` in `browserCryptoProvider.ts` (its own comment says "Pattern follows
browserCryptoProvider.ts"), carried to satisfy TypeScript 5.x's `Uint8Array<ArrayBuffer>`
vs `ArrayBufferLike` strictness; it is in no debt ledger. And D2 offered three HKDF
placements — an `ICryptoProvider.hkdf` method, an HPKE-namespace export, or **both** — but
`design.md` §4 compares only the first two. "Both" was dropped rather than considered and
rejected, which is the shape that gets re-litigated later.

### A.6 — #346 is shared, and `openBase` has since gained a parameter

**#346 is not this stream's own PR.** It is a single consolidated phase-B-brief PR
covering HPKE, Argon2id and WebAuthn together, which is why the Argon2id ledger entry cites
the same number; two independent antagonist passes flagged the duplicate as a suspected
ledger error and both resolved it the same way. Separately, #536 later added an optional
sixth `recipientPublicKey?` parameter to `openBase`, so current source differs from the
#348 snapshot in that one respect.

### Checked and unchanged

Verified accurate: the public surface (`sealBase`, `openBase`, `hkdf`, `encodeEnvelope`,
`decodeEnvelope` exported; Encap/Decap/KeySchedule unexported), read against the full
source; the `"eae_prk"` correction in both `_kemEncap` and `_kemDecap`, in current HEAD and
at the original merge; the 24/18 test counts at ship time; and the D1 separate-namespace
decision as faithfully reflected. PRs #343 and #348 were confirmed as this stream's design
and implementation PRs respectively.
