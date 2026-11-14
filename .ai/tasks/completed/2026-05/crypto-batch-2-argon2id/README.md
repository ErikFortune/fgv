# Stream: crypto-batch-2-argon2id

**Completed:** 2026-05-12  
**Branch:** `claude/crypto-batch-2-argon2id-impl-bOXwM`  
**PR target:** `claude/crypto-batch-2-features`  
**PRs:** [#344](https://github.com/ErikFortune/fgv/pull/344) (phase A design), [#346](https://github.com/ErikFortune/fgv/pull/346) (consolidated phase B briefs — **shared with the HPKE and WebAuthn sibling streams**), [#349](https://github.com/ErikFortune/fgv/pull/349) (implementation) *(added 2026-08-14; this file originally recorded no PR numbers)*

> **Amended 2026-08-14.** Two claims in this file need qualification and one shipped
> constraint was missed entirely. Corrected in place; originals in
> [Appendix A](#appendix-a--corrections-2026-08-14).

---

## What was delivered

### New packages

| Package | Purpose |
|---------|---------|
| `@fgv/ts-extras-argon2` | Node.js Argon2id provider — `NodeArgon2Provider` backed by `argon2` (kelektiv v0.44.0) |
| `@fgv/ts-web-extras-argon2` | Browser/WASM Argon2id provider — `BrowserArgon2Provider` backed by `hash-wasm` v4.12.0 |

Both implement `CryptoUtils.IArgon2idProvider` from `@fgv/ts-extras`. Output is byte-identical for the same inputs, verified by a t=3/m=32/p=4 parameter set test vector and a 7-case parameter sweep. **The vector is captured-from-implementation, not spec-anchored** — see [Appendix A.1](#a1--the-cross-runtime-vector-is-not-spec-anchored).

### Changes to `@fgv/ts-extras`

- **`crypto-utils/model.ts`**: Added `IArgon2idProvider`, `IArgon2idParams`, `ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE`; converted `IKeyDerivationParams` to a discriminated union (`'pbkdf2'` | `'argon2id'`)
- **`crypto-utils/converters.ts`**: Added `pbkdf2KeyDerivationParams`, `argon2idKeyDerivationParams`, `keyDerivationParams` converters
- **`crypto-utils/keystore/keyStore.ts`**: Added `addSecretFromPasswordArgon2id`, `verifySecretFromPasswordArgon2id`

### Documentation

- `LIBRARY_CAPABILITIES.md` updated with entries for both new packages, updated `crypto-utils` section, new `IArgon2idProvider` cross-runtime interface row, and Argon2id decision shortcuts

---

## Test coverage

All packages ship at 100% coverage (branches, functions, lines, statements).

| Package | Tests |
|---------|-------|
| `@fgv/ts-extras` | 100% — includes `keyStoreArgon2id.test.ts` (20 tests for new KeyStore methods) and `converters.test.ts` additions |
| `@fgv/ts-extras-argon2` | 13 NodeArgon2Provider unit tests + 8 cross-runtime equivalence tests |
| `@fgv/ts-web-extras-argon2` | 12 BrowserArgon2Provider unit tests |

---

## Cross-runtime equivalence

The parameter set t=3, m=32, p=4, password=32×0x01, salt=16×0x02, **no secret/AD** produces:

```
03aab965c12001c9d7d0d2de33192c0494b684bb148196d73c1df1acaf6d0c2e
```

Both `NodeArgon2Provider` and `BrowserArgon2Provider` agree on this output — which is the
cross-runtime property D3 asked for, and is what this test establishes. It does **not**
establish conformance to the published RFC vector; the "no secret/AD" qualifier above is
exactly why. See [Appendix A.1](#a1--the-cross-runtime-vector-is-not-spec-anchored).

---

## Key decisions

- **Node library:** `argon2` (kelektiv) v0.44.0 — native performance, raw bytes via `raw: true`. **Pinned `~0.44.0`, below the `v0.45.0+` floor `brief-phase-b.md` D1 set as binding** — see [Appendix A.2](#a2--the-shipped-dependency-pin-is-below-its-own-binding-floor).
- **Browser library:** `hash-wasm` v4.12.0 — pure WASM, no Web Crypto dependency, runs in Node (enabling plain Jest cross-runtime tests)
- **`IArgon2idProvider` is standalone** — not injected into `ICryptoProvider`; explicit opt-in at call sites. Note D2 had *illustrated* constructor injection (`new NodeCryptoProvider({ argon2: ... })`) while reserving the final shape for the design, so this is the design exercising its licence rather than overriding the decision — but it is not the shape a reader of the brief would predict.
- **OWASP preset constants** (`ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE`) exported for consumer guidance
- **`parallelism > 1` in WASM**: JSDoc warning only — no runtime log; output is still correct. Worth restating as a trap: because the engine never spawns threads, `parallelism` changes the hash *value* without changing execution, so two runtimes configured differently will silently disagree — the exact failure D3 exists to prevent.
- **D4 (ongoing version-sync is fgv's responsibility) landed nowhere actionable.** `design.md` §8 proposed a cadence (quarterly `rush update` + changelog review; immediate review on a security advisory). None of it was operationalized: `docs/TECH_DEBT.md` does not mention argon2, `docs/FUTURE.md` carries only a later unrelated API-surface ask, and `.github/dependabot.yml` is a generic weekly npm config that predates this stream and names neither library. *(Added 2026-08-14.)*

---

## Source artifacts

- [`brief.md`](./brief.md) — phase A kickoff brief
- [`brief-phase-b.md`](./brief-phase-b.md) — phase B binding contract
- [`design.md`](./design.md) — phase A design
- [`state.md`](./state.md) — implementing-agent terminal state
- [`meta.yaml`](./meta.yaml) — structured record (added 2026-08-14)

---

## Appendix A — corrections (2026-08-14)

Produced by a `/finalize-task retroactive` run whose antagonist pass commissioned an
independent reviewer against this stream's artifacts and the shipped source. Original
wording preserved verbatim. `brief.md`, `brief-phase-b.md`, `design.md` and `state.md` are
authored-in-flight records and are left untouched; this README is a synthesis read by
later agents as a statement of what shipped.

### A.1 — the cross-runtime vector is not spec-anchored

> **Original (New packages):** "Output is byte-identical for the same inputs, verified by
> RFC 9106 §B.3 parameter set test vector and a 7-case parameter sweep."
>
> **Original (Cross-runtime equivalence heading):** "RFC 9106 §B.3 parameter set (t=3,
> m=32, p=4, password=32×0x01, salt=16×0x02, no secret/AD) produces: ..."

The hex value is captured from these implementations, not taken from a published vector.
The test's own comment says so: *"Verified independently against both argon2 (kelektiv)
and hash-wasm."* That is a real check and it is the property D3 names as load-bearing —
keys derived in one runtime unwrap material in the other — but it is strictly weaker than
matching a published reference, because a shared upstream bug would agree with itself.

The reason it could not be spec-anchored is structural and visible in the original text's
own parenthetical: the official Argon2id KAT binds a **secret key (K)** and **associated
data (X)** alongside password and salt, and the shipped seam `argon2id(password, salt,
params)` exposed neither — so the published vector could not be run through it at all.
`docs/FUTURE.md` Ask A states this outright: *"the consumer's Argon2id vector is
captured-from-impl instead of spec-anchored."* PR
[#554](https://github.com/ErikFortune/fgv/pull/554) (2026-07-18) added optional `secret` /
`associatedData` params, and only then did any test here reproduce the published KAT.

**The "§B.3" citation is also probably wrong.** It appears in `design.md`,
`brief-phase-b.md`, this README twice, and the test file comment — the whole stream is
internally consistent and, it seems, consistently mistaken. Both `FUTURE.md` Ask A and
#554's commit message, written later and independently, cite **§5.3** for the Argon2id
KAT. Not corrected in the archived artifacts, and not settled here: confirming against the
RFC text needs network access this pass did not have. Flagged rather than guessed.

### A.2 — the shipped dependency pin is below its own binding floor

Not a wording correction — something no artifact recorded at all.

`brief-phase-b.md` D1 states the Node library as **`argon2` v0.45.0+**, in a document
whose own preamble declares that where it conflicts with `design.md`, the brief wins.
`libraries/ts-extras-argon2/package.json` ships `"argon2": "~0.44.0"` — a tilde range that
can never resolve to 0.45.0 or above. `state.md` records "v0.44.0" matter-of-factly with
no note that it is under the floor.

Separately, `design.md` §8 (Pin Strategy) recommends **caret** ranges (`^0.45.0`,
`^4.12.0`) reasoning that caret admits non-breaking patch and minor updates while the
pnpm lockfile pins exactly in CI. Both new packages shipped **tilde** instead. Neither the
version miss nor the style change is explained anywhere.

This compounds with D4 (see Key decisions): an accepted standing obligation to track
security updates in these two libraries, with no artifact recording it, and a pin sitting
below its own stated floor, is what that obligation looks like when nobody owns it.

### A.3 — this file recorded no PR numbers

The header gave a branch name and a PR *target* but no PR numbers; they survived only in
`docs/WORKSTREAMS.md`. Now added. Note **#346 is not this stream's own PR** — it is a
single consolidated phase-B-brief PR ("docs(crypto-batch-2): consolidated phase B briefs
for HPKE, Argon2id, WebAuthn") shared across three sibling streams, which is why the HPKE
entry cites the same number. Two independent antagonist passes flagged the duplicate
citation as a suspected ledger error; both resolved it the same way.

### Checked and unchanged

Verified accurate: the hex value itself, character-for-character against the test source;
the 7-case sweep and the 8-test count for `ts-extras-argon2` (1 vector test + 7 sweep
cases), both confirmed to predate #554 and so to belong to this stream; the `hash-wasm`
runs-in-Node rationale as genuinely artifact-sourced rather than inferred; the
`IKeyDerivationParams` discriminated union and its three converters; the composition-shape
account (neither `KeyStore` nor `NodeCryptoProvider` holds an Argon2id provider, and both
new `KeyStore` methods take one explicitly); and the `parallelism > 1` JSDoc warning,
present in source and documented in `LIBRARY_CAPABILITIES.md`. The 100%-coverage claim is
stronger than it looks: all three packages carry `coverageThreshold.global` at 100 in
their jest configs, so it is a standing gate rather than a one-time run.
