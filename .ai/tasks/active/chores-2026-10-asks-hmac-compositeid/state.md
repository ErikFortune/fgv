# State: `chores-2026-10-asks-hmac-compositeid`

Worker-owned working surface. The brief is frozen; questions go here.

## Progress
- [x] Item 1 (#692) — `generateHmacKey` / `importHmacKey` on `ICryptoProvider`
- [x] Item 2 (#693) — `split: 'exact' | 'first' | 'last'` for composite ids
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

### Item 2
- The split mode is declared once in `validation/compositeId.ts` as
  `allCompositeIdSplitModes = ['exact', 'first', 'last'] as const` with
  `CompositeIdSplitMode = (typeof allCompositeIdSplitModes)[number]`, exported from the validation
  barrel (`Validation.CompositeIdSplitMode`) because the conversion packlet already imports from it
  and the reverse import would be circular.
- The converter options are a named interface, `Converters.ICompositeIdOptions { split?: CompositeIdSplitMode }`.
- **Deliberate duplication:** the ~15-line split helper exists as a module-private function in both
  `validation/compositeId.ts` and `conversion/advancedConverters.ts`. Sharing it across the packlet
  boundary would make it public API on an established surface, which the brief did not ask for. The
  two copies emit identical messages, and the tests pin both.
- `'exact'` keeps the existing behaviour and message order: "not found" for zero separators,
  "multiple separators" for more than one. The typo fix moves the period outside the quotes in both.
- The validator now wraps only part-validator failures in `invalid composite ID - …`, as before;
  the split failures were already returned unwrapped and still are.
- Downstream sweep: no test outside `ts-utils` pins the "multiple separators" message.
  `AggregatedResultMap` and `compositeIdString` keep the default split and are not changed.
- Nested composite pattern: documented on `CompositeIdSplitMode`'s remarks and in
  `ts-utils/CAPABILITIES.md`, and exercised by a converter test (`outer` with `split: 'first'` and a
  string item, then `.map` through an inner composite converter).
