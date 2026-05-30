# ks-encoding — result

## Request shape
Add a top-level `--encoding <text|base64|hex>` flag on `ks get` and `ks export`. Default `text` preserves today's behavior exactly. Enables binary-safe display + pipe-friendly output for secrets that may contain control characters and for keeping keys opaque in shell history.

## Design call
- **Generic `--encoding` over a single `--base64`.** The brief explicitly framed the option as extensible (text/base64/hex). A boolean `--base64` would have collapsed under the first request for hex; the open-ended flag form scales without a follow-up CLI break.
- **Flag, not template directive.** `ks export` substitutes secret values verbatim into the rendered shell template — there's no template-side way to declare per-variable encoding without inventing new template syntax (Mustache-style `{{xai|base64}}`), which the codebase explicitly rejects (only simple variable substitutions are supported). A top-level flag that encodes the value before substitution stays inside the existing template grammar and applies uniformly to every variable in the rendered output.

## Implementation notes
- **Raw-byte capture.** Since `KeyStore.importApiKey` UTF-8-encodes the supplied string at store time, every api-key value retrieved via `getApiKey` round-trips to a valid UTF-8 string. Encoding the UTF-8 bytes of that string (`new TextEncoder().encode(value)` → `CryptoUtils.toBase64` or `Buffer.from(...).toString('hex')`) yields the base64/hex of the originally-stored byte sequence — no deeper refactoring of `readSecret` or `getApiKey` was required.
- **Template substitution.** The encoded value is injected into the per-variable context map *before* `renderShellTemplate` substitutes it; the existing `shellEscape` wraps the resulting opaque token in single quotes, which is safe for both `=` padding (base64) and lowercase hex characters. No escaping changes were needed in `template.ts`.
- **Persist-missing isolation.** `collectTemplateContext` now keeps the unencoded plaintext in the `missing` array (which feeds `--persist-missing` back into the keystore) while seeding the encoded value into the rendering context, so the encoding flag never contaminates what gets persisted.
- **Helper module.** Encoding lives in a new `tools/ks/src/encoding.ts` (`parseEncoding`, `encodeSecret`, `ENCODINGS`, `Encoding`) — pure functions, fully unit-tested at 100%.
- **`CryptoUtils.toBase64`** is the canonical primitive used for base64 (already in `ks`'s dependency tree via `@fgv/ts-extras`); hex falls back to Node's `Buffer.toString('hex')` since there is no fgv-canonical hex primitive (`ks` is a Node CLI tool, so the stdlib import is fine).
- **Validation.** `parseEncoding` rejects unknown values with a `Result.fail` shaped error message; the action handler surfaces it to stderr and exits non-zero before any keystore work.

## Gates
- `rush build -t @fgv/ks` clean.
- `rushx lint` clean (separate gate; `rushx fixlint` was a no-op on the new code).
- `rushx test` 83 passes (existing 72 + 11 new on encoding/get/export with encoding).
- New code in `encoding.ts` has 100% coverage on all four metrics; new branches in `app.ts` are exercised by the added `get`/`export` tests. Pre-existing `app.ts` coverage (which never reached 100% for the put/list/remove paths) is unchanged.
- No `any`; no unsafe casts; no `Result<void>`.
- `tools/ks/README.md` documents the new flag with usage examples; `help.ts` template-topic text mentions the flag.
- Rush change file `common/changes/@fgv/ks/ks-encoding_2026-05-28-12-00.json` (`minor`).

## Open question (surfaced, not decided)
Whether `ks get` / `ks export` should ever auto-detect non-UTF-8 secret bytes and default to base64 (instead of always defaulting to `text`). With the current keystore surface (`importApiKey` accepts only string), every stored api-key is UTF-8 by construction, so the auto-detect default would only matter once the keystore supports raw-byte secret types via the CLI. Deferred until that surface lands.
