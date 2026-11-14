# Brief — crypto-utils base64url + branded multibase SPKI hardening (items 2 + 3)

**Branch:** `claude/crypto-utils-base64url-hardening` (off `release`).
**Surface:** `@fgv/ts-extras` → `src/packlets/crypto-utils` (**active** surface — additive/breaking OK per `.ai/instructions/ACTIVE_DEVELOPMENT.md`).
**Consumer:** PersonAIlity V2 identity/signing (RFC 9421 signatures + WebAuthn). Two V2 asks bundled — both additive on crypto-utils, tightly coupled (base64url + multibase).
**Ships under the now-enforced coverage gate** (item 4, #517/#518) — 100% coverage is real now; hit it for real.

## Item 3 — bare base64url-no-pad encode/decode (extract + refactor)

crypto-utils exposes `multibaseBase64UrlEncode`/`Decode` (multibase-`m`-prefixed) and `toBase64`/`fromBase64` (standard alphabet), but **nothing for plain base64url-no-pad** — RFC 9421 signatures and WebAuthn payloads both need it. The current V2 workaround (reviewer-flagged) is `multibaseBase64UrlEncode(bytes).slice(1)` with a prefix-strip comment.

**The primitive already exists inside `spkiHelpers.ts`:** `multibaseBase64UrlEncode` computes base64 → base64url-no-pad (`+→-`, `/→_`, strip `=`) then prepends `'m'`; `multibaseBase64UrlDecode` checks the `'m'` prefix then decodes the body with a shape guard (`/^[A-Za-z0-9_-]*$/` + `length % 4 !== 1`).

**Do:**
1. Add `base64UrlNoPadEncode(data: Uint8Array): string` and `base64UrlNoPadDecode(encoded: string): Result<Uint8Array>` — the base64url-no-pad body logic, **no** `'m'` prefix.
2. **Refactor the existing multibase functions to delegate** so there's one implementation, not two: `multibaseBase64UrlEncode(d) === 'm' + base64UrlNoPadEncode(d)`; `multibaseBase64UrlDecode(e)` = `'m'`-prefix check → `base64UrlNoPadDecode(e.slice(1))`. Preserve the existing multibase error messages/behavior exactly (they're the established public surface). Keep the `/* c8 ignore */` on the genuine browser-only `btoa`/`atob` branches.
3. Export both new helpers from `crypto-utils/index.ts` **and** `index.browser.ts` (the multibase siblings are exported from both).

## Item 2 — branded `MultibaseSpkiPublicKey` + validating converter + tightened signatures

`exportPublicKeyAsMultibaseSpki` / `importPublicKeyFromMultibaseSpki` traffic in plain `string`. PersonAIlity's keystore already declares this exact brand (`MultibaseSpkiPublicKey`, `isValidMultibaseSpkiPublicKey`) locally and would migrate to the ts-extras export (a separate V1-track consumer change — not in this stream, but match the shape so the migration is a drop-in).

**Do:**
1. **Brand type** `MultibaseSpkiPublicKey = Brand<string, 'MultibaseSpkiPublicKey'>` (use `Brand` from `@fgv/ts-utils`), placed with the other crypto-utils types (`model.ts`).
2. **Type guard** `isValidMultibaseSpkiPublicKey(v: unknown): v is MultibaseSpkiPublicKey` — validates: is a string, starts with `'m'`, and the body matches the base64url-no-pad shape (`/^[A-Za-z0-9_-]*$/` and `body.length % 4 !== 1`). Reuse the same shape rule the decoder uses — do NOT duplicate a divergent regex; factor the body-shape check so the guard and `base64UrlNoPadDecode` agree.
3. **Validating converter** `multibaseSpkiPublicKey: Converter<MultibaseSpkiPublicKey>` in `converters.ts` (follow the existing `Converter<T>` export pattern there), failing with context on a non-string / bad-prefix / malformed-body input, succeeding with the branded value otherwise.
4. **Tighten the helper signatures:**
   - `exportPublicKeyAsMultibaseSpki(...) : Promise<Result<MultibaseSpkiPublicKey>>` — its output is a freshly-built valid multibase SPKI string, so brand it on the way out (no re-validation needed; assert the brand at the construction site with a comment, or route through the guard).
   - `importPublicKeyFromMultibaseSpki(encoded: MultibaseSpkiPublicKey, algorithm, provider)` — accept the brand so validation-before-import is enforced by the type system. Callers obtain the brand via the converter / guard at their boundary. (Internal decode still runs; the brand narrows the contract.)
5. Export the brand type, guard, and converter from `index.ts` + `index.browser.ts` (the converter likely rides the existing `Converters` namespace export — match how `encryptionAlgorithm` etc. are surfaced).

## Item 5 — file the RFC 9421 heads-up (docs only, no code)

Add a `docs/FUTURE.md` entry: **"RFC 9421 HTTP-message-signature packlet (prospective `@fgv/ts-extras`)"** — a strict Ed25519-only RFC 9421 profile (signer/verifier/signature-base over `ICryptoProvider`, framework-free, Result-shaped) that the V2 track is proving out in its own `signing` packlet and intends to propose upstream once Phase 0 lands. Note that this stream's `base64UrlNoPadEncode/Decode` (item 3) is the primitive it depends on. No action beyond the entry.

## Constraints

- No `any`; `Result<T>` for fallible ops; Converters/guards for validation (no manual-typeof-then-cast); `Brand<T>` for the branded id; `__`-prefix unused params (lint-mandated).
- Additive + the intentional signature tightenings (active surface). Don't remove/rename existing exports except the two tightened return/param types.
- Regenerate `etc/ts-extras.api.md`. **100% coverage — actually enforced now.**

## Tests

- `base64UrlNoPadEncode`/`Decode`: round-trip a range of byte lengths (incl. lengths that produce 0/1/2 `=` pads pre-strip, and empty); decode rejects malformed bodies (bad chars, `length % 4 === 1`); **cross-check** that `multibaseBase64UrlEncode(x) === 'm' + base64UrlNoPadEncode(x)` and the decode delegation round-trips, so the refactor is behavior-preserving.
- `isValidMultibaseSpkiPublicKey` / `multibaseSpkiPublicKey` converter: accepts a real exported key blob + valid synthetic values; rejects non-string, missing/wrong prefix, malformed body.
- `exportPublicKeyAsMultibaseSpki` returns a value the guard/converter accepts; `importPublicKeyFromMultibaseSpki` round-trips an exported branded key back to a usable `CryptoKey` (export → import → verify usable). Use `NodeCryptoProvider` in tests.

## Sequence

Implement → `code-reviewer` on the diff **before** coverage-chasing → `rushx build && lint` + `rushx test` @ 100% (the gate is live) + api-extractor regen → `rushx fixlint` → `rush change` (`--bulk --bump-type minor --target-branch origin/release`) → commit + push + open PR onto `release`.

## Proof of work

`git log --oneline -3`; build/lint/test tails (100%); the `etc/ts-extras.api.md` diff (new base64url helpers, brand, guard, converter, tightened signatures); the delegation-equivalence test output; `code-reviewer` findings + dispositions; the `docs/FUTURE.md` entry.
