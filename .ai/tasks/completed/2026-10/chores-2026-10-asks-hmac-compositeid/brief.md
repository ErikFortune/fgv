# Brief: `chores-2026-10-asks-hmac-compositeid` — HMAC keys on ICryptoProvider; first/last split for composite ids

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#692 and #693 (fgv-asks). The long forms are on personaility `working`:
- `.ai/notes/fgv-share/ASK-2026-10-21-crypto-hmac-key.md`
- `.ai/notes/fgv-share/ASK-2026-10-21-composite-id-first-split.md`

**Base / PR target:** `integration/asks`. This is one PR with two commits, one per item.

## Item 1 (#692): HMAC key generation and import on `ICryptoProvider`

**Verified:**
- `hmacSha256` and `verifyHmacSha256` (`libraries/ts-extras/src/packlets/crypto-utils/model.ts` ~820/834) accept only a `CryptoKey`.
- `ICryptoProvider` has no way to generate or import an HMAC key.
- The doc at ~812-814 tells callers to use `crypto.subtle.importKey`, which is exactly the bypass the provider exists to close. It also says "derived via PBKDF2", but `deriveKey` returns a `Uint8Array`, so that claim is false.
- Implementers: `NodeCryptoProvider` (`libraries/ts-extras/.../nodeCryptoProvider.ts`) and `BrowserCryptoProvider` (`libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts`).

**Decisions:**
- Add two methods. Both create HMAC/SHA-256 keys with usages `['sign','verify']` that are **non-extractable by default**:
  - `generateHmacKey(options?: { extractable?: boolean }): Promise<Result<CryptoKey>>`. Pin the length to 256 bits.
  - `importHmacKey(raw: Uint8Array, options?: { extractable?: boolean }): Promise<Result<CryptoKey>>`. Reject a key shorter than 32 bytes, per RFC 2104's L.
- Do **not** widen the existing key parameter to `CryptoKey | Uint8Array`. Accepting raw bytes on every call discards non-extractability and hides a re-import.
- Fix the misleading doc at ~812-814 so it points to `importHmacKey`, including for `deriveKey` output.
- Implement in both providers. The interface member is required, so the change file is `BREAKING (implementers only):`, typed `minor`, for both `ts-extras` and `ts-web-extras`.
- Sweep `libraries/ tools/ samples/` for structural `ICryptoProvider` doubles. The assessment found none; record the result.
- Check that the browser barrel and the export-parity test still pass.
- Add the new methods to the HMAC decision shortcut in `CAPABILITIES.md` and the index.

## Item 2 (#693): first/last split for composite ids

**Verified:**
- `compositeIdFromString` (`libraries/ts-utils/src/packlets/conversion/advancedConverters.ts` ~85-111) calls `split(separator)` and fails when there are more than two parts.
- The same restriction exists in the sibling `CompositeIdValidator` (`libraries/ts-utils/src/packlets/validation/compositeId.ts` ~81-85), and `compositeId` (~123) inherits it.
- Both error messages render `'${separator}.'` with the period inside the quotes.

**Decisions:**
- Add an optional trailing `options?: { split?: 'exact' | 'first' | 'last' }` to `compositeIdFromString` and `compositeId`, and a matching optional `split` on `CompositeIdValidatorConstructorParams`.
  - The default `'exact'` keeps current behaviour.
  - `'first'` uses `indexOf` and `'last'` uses `lastIndexOf`. The remainder goes untouched to the item or collection converter.
- Declare the split mode once as a named type, from an `as const` array.
- Fix the message typo in both places.
- Document the pattern for a nested composite: validate as a string, then re-parse.
- `ts-utils` is an established surface. This is additive, so the change file is `minor`.

## Acceptance
- [ ] Tests for both items, using Result matchers:
  - Item 1: generate, import, too-short refusal, extractable/non-extractable, and sign/verify round-trip with the new keys, in both providers. Use the existing browser-provider test setup.
  - Item 2: every split mode, with a remainder containing the separator, a missing separator, and an empty part; the same set for the validator.
- [ ] Gates:
  - package build, lint and test at 100% in each touched package;
  - repo-wide `rush rebuild` and `rush test`;
  - `change --verify --target-branch origin/integration/asks`;
  - prettier 2.8;
  - `verify-capability-docs`.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-10/chores-2026-10-asks-hmac-compositeid/`, with a ledger entry (`#TBD`) and the feed.

## Mechanics
Work in your own worktree. Push only to `chores-2026-10-asks-hmac-compositeid`, and open no PR. Commit before running gates. Run gates in the foreground, with log paths specific to your worktree. No sub-agents.
