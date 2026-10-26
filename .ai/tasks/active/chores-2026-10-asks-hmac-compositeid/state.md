# State: `chores-2026-10-asks-hmac-compositeid`

Worker-owned working surface. The brief is frozen; questions go here.

## Progress
- [x] Item 1 (#692) — `generateHmacKey` / `importHmacKey` on `ICryptoProvider`
- [ ] Item 2 (#693) — `split: 'exact' | 'first' | 'last'` for composite ids
- [ ] Gates
- [ ] Close-out

## Notes

### Item 1
- Options type is a named exported interface, `CryptoUtils.IHmacKeyOptions { extractable?: boolean }`,
  shared by both methods, rather than an inline object literal type.
- Added `CryptoUtils.Constants.HMAC_SHA256_KEY_SIZE = 32`, used for the generated length (×8 bits)
  and the import floor, alongside the existing `AES_256_KEY_SIZE`.
- New TSDoc uses code spans rather than `{@link}`: the `CryptoUtils.*` and `ICryptoProvider.*` link
  forms in this file each bake an `ae-unresolved-link` warning into `etc/ts-extras.api.md`, and the
  first draft added ten. The final `api.md` diff carries no new warnings.
- Subtle-failure branches: the browser provider takes an injected `Crypto`, so its tests use a
  rejecting `subtle` stub. The Node provider has no injection seam, so its tests spy on
  `crypto.webcrypto.subtle.generateKey` / `importKey` with `mockRejectedValueOnce` and restore after.
- **Implementer sweep** (`grep -rn ICryptoProvider` over `libraries/ tools/ samples/ apps/`, plus
  `timingSafeEqual` / `verifyHmacSha256` and `as unknown as …CryptoProvider` / `Partial<ICryptoProvider>`):
  two implementations (`NodeCryptoProvider`, `BrowserCryptoProvider`), no subclasses, no structural
  or partial test doubles. Every other hit is a consumer that holds an `ICryptoProvider`.
