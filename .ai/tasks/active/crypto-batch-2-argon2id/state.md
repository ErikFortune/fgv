# Stream State: crypto-batch-2-argon2id

**Status:** 🟢 phase A signed off; phase B ready to start
**Last updated:** 2026-05-12 (orchestrator — phase B brief authored)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ done | design.md merged into `claude/crypto-batch-2-features` |
| B — implementation | 🟢 ready | `brief-phase-b.md` is the binding contract; assignable to implementing agent |

---

## Phase A signoff summary (orchestrator)

Design approved **as designed**. Open question resolutions:

- **OQ1 (parameter naming):** keep readable form (`memoryKiB` / `iterations` / `parallelism` / `outputBytes`). Do not collapse to RFC's `m`/`t`/`p`.
- **OQ2 (parallelism > 1 on WASM):** JSDoc warning is sufficient — no runtime logged warning.
- **OQ3 (discriminated union for `IKeyDerivationParams`):** proceed with the union approach. Phase B audits `keystore/converters.ts` and `keyStore.ts` access sites.
- **OQ5 (cross-runtime test placement):** in `libraries/ts-extras-argon2/` with a `devDependency` on `@fgv/ts-web-extras-argon2`. Plain Jest in Node — no browser runner needed because `hash-wasm` is pure WASM.

Orchestrator-flagged precondition (B.0): live `hash-wasm` GitHub activity check before kickoff. If maintenance has materially deteriorated, STOP and surface — do not pivot to `argon2-browser` unilaterally.

Phase B contract is baked into `.ai/tasks/active/crypto-batch-2-argon2id/brief-phase-b.md`. Where the brief conflicts with the design, the brief wins.

---

## Design summary (one paragraph)

Recommend `argon2` (kelektiv, v0.45.0, Node ≥ 22 — matches repo baseline) for the Node package and `hash-wasm` (v4.12.0, pure WASM) for the browser package. Both are placed in new, separate packages (`@fgv/ts-extras-argon2` and `@fgv/ts-web-extras-argon2`) to keep the WASM bundle out of consumers who don't need Argon2id. The `IArgon2idProvider` interface lives in `@fgv/ts-extras/crypto-utils/model.ts` alongside `ICryptoProvider`; the two providers implement it independently (composition idiom option b — fully standalone, not injected into `ICryptoProvider`). `KeyStore` gains two new methods (`addSecretFromPasswordArgon2id`, `verifySecretFromPasswordArgon2id`) that take an `IArgon2idProvider` as an explicit parameter. Cross-runtime equivalence tests run as plain Jest tests in Node: since `hash-wasm` is pure WASM with no Web Crypto dependency, both `NodeArgon2Provider` and `BrowserArgon2Provider` can be imported and called side-by-side in the same Jest test, asserting byte-for-byte output equality across a representative parameter sweep plus RFC 9106 test vectors.

---

## Decisions log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Node library | `argon2` (kelektiv v0.45.0) | Actively maintained (2026), default argon2id, raw bytes via `raw: true`, native performance, Node ≥ 22 matches repo |
| Browser library | `hash-wasm` v4.12.0 | Pure WASM (no Web Crypto dep), runs in Node — enables pure-Jest equivalence tests; `outputType: 'binary'` → Uint8Array; ~11 kB gzipped; PHC-compatible output |
| Disqualified: @node-rs/argon2 | Rejected | No raw bytes output path; Base64-only string output not cross-verifiable via PHC strings |
| Disqualified: argon2-browser | Rejected | ~5 years without release; security dependency cannot be abandoned |
| Composition idiom | Option (b) — fully standalone IArgon2idProvider | D2 binding: default providers do not include Argon2id; no contamination of ICryptoProvider |
| Interface location | @fgv/ts-extras/crypto-utils/model.ts | Consumers can type against IArgon2idProvider without depending on implementation packages |
| KeyStore integration | Two new methods (addSecretFromPasswordArgon2id, verifySecretFromPasswordArgon2id) | Explicit opt-in; PBKDF2 path unchanged; call site shows which KDF is in use |
| IKeyDerivationParams | Extend as discriminated union ('pbkdf2' \| 'argon2id') | Clean model; converters can switch on kdf field; existing PBKDF2 code needs only narrowing guard |
| Cross-runtime test runner | Plain Jest (Node) | hash-wasm is pure WASM running identically in Node — no browser runner needed |
| Rush preferred-versions | Not used | argon2 + hash-wasm each have a single monorepo consumer; pnpm lockfile is sufficient |
| Parameter defaults exported | ARGON2ID_OWASP_MIN + ARGON2ID_PASSPHRASE | Published constants for consumer guidance without hardcoding |

---

## Open questions / blockers

| # | Question | Blocking phase B? |
|---|----------|-------------------|
| OQ1 | IArgon2idParams naming: `memoryKiB/iterations/parallelism/outputBytes` vs RFC naming (`m/t/p/l`)? | No — can proceed with readable names; change is trivial if preference differs |
| OQ2 | BrowserArgon2Provider: emit warning or doc note when `parallelism > 1`? | No — doc note is sufficient for v1 |
| OQ3 | IKeyDerivationParams as discriminated union vs parallel independent types? | Weakly blocking — union is cleaner but affects converter blast radius; phase B implementer should confirm before touching converters |
| OQ4 | hash-wasm maintenance: verify GitHub activity is adequate before phase B kickoff | Weakly blocking — if stale, fallback is argon2-browser (reference C source → strongest bit-identical guarantee with node-argon2) |
| OQ5 | Cross-runtime test placement: ts-extras-argon2/ (devDep on browser package) vs apps/ (Vite/Vitest browser runner)? | No — pure-Jest in ts-extras-argon2/ is recommended; orchestrator can override |

---

## PR

- **Branch:** `claude/argon2id-package-split-EhzDh`
- **Target:** `claude/crypto-batch-2-features`
- **Contents:** `design.md` + `state.md` (no production code)

---

## Research dead-ends and surprising findings

1. **`@node-rs/argon2` output format:** Surprising — its `hash()` returns Base64 of raw bytes only, not a PHC string. This is underdocumented and breaks cross-library verifiability without manual re-wrapping. Disqualified on this basis.

2. **`argon2-browser` abandonment:** The library is referenced in many current tutorials and was historically the browser Argon2id choice, but has had zero npm releases since ~2020. Disqualified — a security dependency that is 5 years stale is not acceptable regardless of historical reputation.

3. **hash-wasm runs in Node:** The key simplifying insight. Since `hash-wasm` is pure WASM with no Web Crypto dependency, cross-runtime equivalence can be tested in a standard Jest suite rather than requiring a Vite/browser runner. This substantially simplifies the phase B test infrastructure.

4. **Node >= 22 requirement for argon2:** `argon2` v0.45.0 dropped Node 20 from CI. This was a potential concern but is a non-issue since the repo already requires Node >= 22.22.0.

---

## Resume protocol

Read `brief.md` (binding) then this file to resume.
