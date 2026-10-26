# Result: `chores-2026-10-asks-hmac-compositeid`

**Shipped:** `ICryptoProvider` can now generate and import HMAC-SHA256 keys itself, non-extractable by default, so callers no longer reach past the provider to `crypto.subtle.importKey`; and composite ids can split at the first or last separator, so one part may itself contain the separator.

Origin: personaility#692 and #693 (fgv-asks). Base / target: `integration/asks`. One PR (#TBD), two
commits, one per item.

## Item 1 (#692): HMAC keys on `ICryptoProvider`

### What changed
- `libraries/ts-extras/src/packlets/crypto-utils/model.ts`:
  - Adds the required members `generateHmacKey(options?)` and `importHmacKey(raw, options?)`, both
    returning `Promise<Result<CryptoKey>>`.
  - Adds the named options interface `IHmacKeyOptions { readonly extractable?: boolean }`.
  - Rewrites the `hmacSha256` doc. It used to say "derived via PBKDF2 or imported with
    `crypto.subtle.importKey`". It now points to `generateHmacKey`, and to `importHmacKey` for raw
    bytes. It also says that `deriveKey` returns a `Uint8Array`, so its output goes through
    `importHmacKey`.
- `libraries/ts-extras/src/packlets/crypto-utils/constants.ts` adds
  `HMAC_SHA256_KEY_SIZE = 32` (RFC 2104's `L` for SHA-256). This one constant sets both the
  generated key length (256 bits) and the minimum length `importHmacKey` accepts.
- `NodeCryptoProvider` and `BrowserCryptoProvider` both implement the two members against WebCrypto:
  - HMAC with SHA-256.
  - Usages `['sign', 'verify']`.
  - `extractable` defaults to `false`.
  - `importHmacKey` returns a `Failure` for a key shorter than 32 bytes without calling subtle, with
    the message `importHmacKey: key must be at least 32 bytes, got N`.
  - Subtle failures carry the context `generateHmacKey failed: …` or `importHmacKey failed: …`.
- The existing key parameter is not widened, as the brief requires. `hmacSha256` and
  `verifyHmacSha256` still take only a `CryptoKey`.
- Change files: `ts-extras` and `ts-web-extras`, both `minor`, both prefixed
  `BREAKING (implementers only):`.
- Docs:
  - `libraries/ts-extras/CAPABILITIES.md`: the packlet row and the HMAC decision shortcut.
  - `.ai/instructions/LIBRARY_CAPABILITIES.md`: the HMAC shortcut now names `generateHmacKey` and
    `importHmacKey`.

### Implementer sweep
I searched `libraries/ tools/ samples/ apps/` for:
- `ICryptoProvider`;
- the HMAC members `timingSafeEqual` and `verifyHmacSha256`, which any structural double would have
  to carry;
- `extends NodeCryptoProvider|BrowserCryptoProvider`;
- `as unknown as …CryptoProvider` and `Partial<…ICryptoProvider>`.

**Result:** the only implementations are `NodeCryptoProvider` and `BrowserCryptoProvider`. There are
no subclasses and no structural or partial doubles. Every other hit is a consumer that holds an
`ICryptoProvider`. This matches the assessment in the brief.

### Tests
The tests are in `nodeCryptoProvider.signVerify.test.ts` and `browserCryptoProvider.signVerify.test.ts`.
The same 13 cases run against each provider:

- **Generate:**
  - The default key has type `secret`, is non-extractable, uses HMAC/SHA-256 with length 256, and
    has usages `sign` and `verify`.
  - With `extractable: true`, the key exports 32 raw bytes.
  - A non-extractable key refuses export.
  - A sign/verify round trip succeeds, including the tampered-data case.
  - Two generated keys differ.
- **Import:**
  - The default key has the same properties as a generated one.
  - An extractable import exports the same bytes.
  - A 64-byte key is accepted.
  - 31-byte and 0-byte keys are refused.
  - A MAC verifies across two separate imports of the same bytes.
  - `deriveKey` output imports and round-trips.
- **Subtle failure:** each method reports a rejected subtle call with context.
  - Browser: the test injects a rejecting `subtle` through the constructor.
  - Node: the provider has no injection seam, so the test uses `jest.spyOn(webcrypto.subtle, …)`
    with `mockRejectedValueOnce` and restores the spy afterwards.

The browser test reuses the existing browser-provider setup (`new BrowserCryptoProvider()` over
Node's global WebCrypto). The ts-web-extras export-parity and browser-barrel tests pass unchanged.

## Item 2 (#693): first/last split for composite ids

### What changed
- `libraries/ts-utils/src/packlets/validation/compositeId.ts`:
  - The split mode is declared once, as
    `allCompositeIdSplitModes = ['exact', 'first', 'last'] as const` with
    `CompositeIdSplitMode = (typeof allCompositeIdSplitModes)[number]`.
  - Both are exported from the validation barrel, as `Validation.CompositeIdSplitMode` and
    `Validation.allCompositeIdSplitModes`.
  - `CompositeIdValidatorConstructorParams` gains `split?: CompositeIdSplitMode`.
  - The type's TSDoc remarks document the nested-composite pattern.
- `libraries/ts-utils/src/packlets/conversion/advancedConverters.ts`:
  - `compositeIdFromString` and `compositeId` take a trailing
    `options?: ICompositeIdOptions { split?: CompositeIdSplitMode }`.
  - `compositeId` applies the split only to the string form.
- Split semantics:
  - `'exact'` is the default and behaves exactly as before, including the order of the messages.
  - `'first'` splits with `indexOf` and `'last'` with `lastIndexOf`. The remainder goes untouched to
    the item or collection part.
- The message typo is fixed in both places: `multiple separators ':.' found` now reads
  `multiple separators ':' found.`
- Change file: `ts-utils`, `minor`, with no `BREAKING` prefix because the change is additive.
- Docs: `libraries/ts-utils/CAPABILITIES.md` gains a decision shortcut for two-part ids whose part
  contains the separator, including the nested-composite pattern.

### Deliberate duplication
The ~15-line split helper is a module-private function in both `compositeId.ts` and
`advancedConverters.ts`. The conversion packlet imports from validation, so the helper can only be
shared by exporting it from the validation barrel. That would make it public API on an established
surface, which the brief did not ask for. The two copies emit identical messages, and the tests pin
both.

### Tests
The tests are in `converters.advanced.test.ts` and `validation/compositeId.test.ts`.
- **Converter:** each of these cases runs in every split mode:
  - The remainder contains the separator. `'exact'` refuses it; `'first'` and `'last'` split at the
    right place.
  - The separator is a multi-character string.
  - The separator is missing, including an empty input.
  - One part is empty: `':b'`, `'a:'`, `'a::'`, `'::b'`.
  - The part converters still validate what the split hands them.
- **Converter, nested composite:** an outer `'first'` split with a string item is mapped through an
  inner composite converter. The test covers both success and failure.
- **`compositeId`:** split modes apply to the string form, and the object form is unaffected.
- **Validator:** the same set of cases. With `first`, the remainder fails in the item validator;
  with `last`, it fails in the collection validator.

### Downstream sweep
No test outside `ts-utils` pins the "multiple separators" message. `AggregatedResultMap` and
`compositeIdString` keep the default split and are not changed.

## Gates
Logs are in `.gate-logs/` in the worktree.

| gate | result |
|---|---|
| `rushx build` / `lint` / `test` in `ts-utils`, `ts-extras`, `ts-web-extras` | All pass with 0 warnings. Coverage is 100% in each package. |
| `rush change --verify --target-branch origin/integration/asks` | Passes. It finds all 3 change files. |
| prettier 2.8.8 `--check` on every touched file | Clean |
| `verify-capability-docs` | 0 failed |
| `rush rebuild` (repo-wide) | Passes: `SUCCESS: 39 operations`, with 0 matches for the failure greps and no warning except the Git-tracked symlink notice. Log: `rebuild.log`. |
| `rush test` (repo-wide) | 38 of 39 operations pass with 0 `not met` and no warnings. The one failure was `@fgv/ts-res-cli`: 5 integration tests (`cli-configuration` and `cli-integration`), every one a 5000 ms timeout. That package is on the known load-sensitive list. Re-run alone, it passes 67/67 with 0 failures and full coverage. Logs: `test.log`, `ts-res-cli-rerun.log`. |

## Review follow-up
The orchestrator's review found no P1s and one P2. All of it is applied:

- **P2: an empty separator changed `'exact'` behaviour.** The first version took `'exact'`'s parts
  from `indexOf`/`slice`, so with `separator === ''` the input `'ab'` became `{'', 'ab'}` instead
  of `{a, b}`, and the inputs `'a'` and `''` succeeded instead of failing.
  - `'exact'` again uses the old `value.split(separator)` logic, byte-identical to the original:
    `< 2` parts gives "not found", `> 2` gives "multiple", and otherwise it returns
    `[parts[0], parts[1]]`.
  - `'first'` and `'last'` now refuse an empty separator with
    `split '<mode>' requires a non-empty separator`. The doc for `CompositeIdSplitMode` says so.
  - Both copies of the helper are changed.
  - New tests cover `''` in every mode, for both the converter and the validator.
- **P3:**
  - Each `splitCompositeIdString` copy now carries a comment naming its twin.
  - New tests pin an overlapping separator: `'aa'` on `'aaa'` splits to `['', 'a']` under
    `first` and to `['a', '']` under `last`.
  - A multi-character separator test was added for the validator.
  - Both provider suites now assert the imported HMAC key's `algorithm.length`: 32 bytes gives 256
    bits and 64 bytes gives 512.
- **Re-gated:** package build, lint and test for `ts-utils` (1802 tests pass, 100% coverage, 0
  warnings). `ts-extras` and `ts-web-extras` tests were re-run for the HMAC assertion: 0 failures,
  100% coverage.

## Observations
- **TSDoc links.** In `ts-extras/crypto-utils`, both the `{@link CryptoUtils.…}` form and the
  `{@link ICryptoProvider.…}` form bake an `ae-unresolved-link` warning into `etc/*.api.md`. My first
  draft of the new TSDoc added ten such warnings. I replaced those links with code spans, and the
  final `api.md` diffs carry no new warnings. The pre-existing warnings in that file are unchanged.
- **Brief accuracy.** Nothing in the brief was wrong. Its line references held: `model.ts`
  ~812-834, `advancedConverters.ts` ~85-111, `compositeId.ts` ~81-85. The `compositeId` it places at
  ~123 is the converter in `advancedConverters.ts`, not anything in `compositeId.ts`.
