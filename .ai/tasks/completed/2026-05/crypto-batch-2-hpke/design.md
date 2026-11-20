# HPKE Base Mode Design
## Stream: crypto-batch-2-hpke — Phase A

**Cipher suite:** DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM  
**RFC:** 9180 (Hybrid Public Key Encryption), February 2022  
**Phase A agent note:** Direct web access to rfc-editor.org was blocked during this research session (HTTP 403). Protocol details are drawn from the agent's training corpus on RFC 9180. The phase B implementing agent **must** verify the algorithm pseudocode and test vector availability directly at https://www.rfc-editor.org/rfc/rfc9180 before writing code.

---

## 1. HPKE Base Mode — Protocol Summary

RFC 9180 defines HPKE as a KEM + KDF + AEAD composition. Base mode uses no pre-shared key and no sender authentication: the ciphertext is confidential (only the recipient's private key opens it) and the `info` parameter binds it to a specific context.

### Cipher suite identifiers

| Component | Value | ID |
|---|---|---|
| KEM | DHKEM(X25519, HKDF-SHA256) | KEM_ID = 0x0020 |
| KDF | HKDF-SHA256 | KDF_ID = 0x0001 |
| AEAD | AES-256-GCM | AEAD_ID = 0x0002 |

**suite_id** (used in key schedule labeled HKDF operations):
```
suite_id = concat("HPKE", I2OSP(0x0020, 2), I2OSP(0x0001, 2), I2OSP(0x0002, 2))
         = b"HPKE\x00\x20\x00\x01\x00\x02"  (10 bytes)
```

**kem_suite_id** (used in DHKEM's internal labeled HKDF operations):
```
kem_suite_id = concat("KEM", I2OSP(0x0020, 2))
             = b"KEM\x00\x20"  (5 bytes)
```

### Key constants

| Constant | Bytes | Meaning |
|---|---|---|
| Nsecret | 32 | KEM shared-secret length |
| Npk | 32 | X25519 public key (= enc) length |
| Nsk | 32 | X25519 private key length |
| Nh | 32 | HKDF-SHA256 hash output length |
| Nk | 32 | AES-256-GCM key length |
| Nn | 12 | AES-256-GCM nonce length |
| Nt | 16 | AES-256-GCM authentication tag length |

### DHKEM(X25519, HKDF-SHA256): Encap and Decap

The KEM step produces a shared secret and an encapsulated key (`enc`).

**enc format:** 32-byte raw X25519 public key (no DER/SPKI wrapper). Exported via `subtle.exportKey('raw', pkE)`.

**Encap(pkR):**
```
Generate ephemeral keypair (skE, pkE)
dh = X25519(skE, pkR)                     // 32-byte DH output
enc = SerializePublicKey(pkE)              // 32-byte raw export of pkE
pkRm = SerializePublicKey(pkR)             // 32-byte raw export of pkR
kem_context = concat(enc, pkRm)            // 64 bytes

prk = LabeledExtract(kem_suite_id, empty_salt, "dh", dh)
shared_secret = LabeledExpand(kem_suite_id, prk, "shared_secret", kem_context, Nsecret)
return (shared_secret, enc)
```

**Decap(enc, skR):**
```
pkE = DeserializePublicKey(enc)            // import raw 32 bytes as X25519 public key
dh = X25519(skR, pkE)                     // 32-byte DH output
pkRm = SerializePublicKey(pk(skR))         // export recipient's own public key (raw)
kem_context = concat(enc, pkRm)            // same kem_context as Encap

prk = LabeledExtract(kem_suite_id, empty_salt, "dh", dh)
shared_secret = LabeledExpand(kem_suite_id, prk, "shared_secret", kem_context, Nsecret)
return shared_secret
```

### Labeled HKDF operations

RFC 9180 wraps HKDF-SHA256 with suite-specific labels for domain separation. The `suite_id_param` passed to each call is either `kem_suite_id` (inside DHKEM) or `suite_id` (inside the key schedule).

**LabeledExtract(suite_id_param, salt, label, ikm):**
```
labeled_ikm = concat("HPKE-v1", suite_id_param, label, ikm)
return HKDF-Extract(salt, labeled_ikm)
// = HMAC-SHA256(key=salt_or_zero32, message=labeled_ikm)
```
If `salt` is empty, use 32 zero bytes as the HMAC key.

**LabeledExpand(suite_id_param, prk, label, info, L):**
```
labeled_info = concat(I2OSP(L, 2), "HPKE-v1", suite_id_param, label, info)
return HKDF-Expand(prk, labeled_info, L)
// = HMAC-SHA256 T(1)||T(2)||... where T(n)=HMAC(prk, T(n-1)||labeled_info||n)
```

**Critical Web Crypto constraint:** Web Crypto's HKDF only supports the combined Extract+Expand operation (not the individual steps). LabeledExtract requires calling HKDF-Extract (= HMAC) alone; LabeledExpand requires HKDF-Expand alone. The implementation must use HMAC-SHA256 directly via `subtle.sign({ name: 'HMAC' }, ...)` for both steps. This is the standard approach used by other Web Crypto-based HPKE implementations.

### Key schedule (base mode)

```
mode = 0 (base)
psk = b""     (empty bytes for base mode)
psk_id = b""  (empty bytes for base mode)

psk_id_hash = LabeledExtract(suite_id, b"", "psk_id_hash", psk_id)
info_hash    = LabeledExtract(suite_id, b"", "info_hash",  info)
ks_context   = concat(I2OSP(mode, 1), psk_id_hash, info_hash)
             = concat(0x00, psk_id_hash, info_hash)   // 65 bytes total

prk = LabeledExtract(suite_id, shared_secret, "secret", psk)
key        = LabeledExpand(suite_id, prk, "key",        ks_context, Nk)   // 32 bytes
base_nonce = LabeledExpand(suite_id, prk, "base_nonce", ks_context, Nn)   // 12 bytes
```

**The AEAD nonce is NOT randomly generated.** It is `base_nonce XOR I2OSP(seq, Nn)`. For single-message seal/open (our use case), `seq = 0`, so `nonce = base_nonce`. This is a critical difference from `wrapBytes` (which generates a random nonce). The determinism is intentional: the same `info` + same recipient key → same nonce, which is safe exactly because each distinct `info` value (e.g. unique session ID) yields a distinct key.

### SealBase and OpenBase

**SealBase(pkR, info, aad, plaintext):**
```
(shared_secret, enc) = Encap(pkR)
(key, base_nonce)    = KeySchedule(mode=0, shared_secret, info)
nonce                = base_nonce   // seq=0
ciphertext           = AES-256-GCM-Seal(key, nonce, aad, plaintext)
                     // includes 16-byte auth tag appended (Web Crypto behavior)
return (enc, ciphertext)
```

**OpenBase(enc, skR, info, aad, ciphertext):**
```
shared_secret     = Decap(enc, skR)
(key, base_nonce) = KeySchedule(mode=0, shared_secret, info)
nonce             = base_nonce   // seq=0
plaintext         = AES-256-GCM-Open(key, nonce, aad, ciphertext)
                 // returns error if auth tag fails
return plaintext
```

---

## 2. API Surface — Function Signatures and Namespace

### Namespace name: `Hpke`

**Rationale:** Single-word PascalCase matches the existing module-namespace idiom in `@fgv/ts-extras/crypto-utils` (`KeyStore`, `Converters`). The RFC acronym is `HPKE` (all-caps) but fgv namespaces use PascalCase. `Hpke` is preferred over `HPKE` for consistency. It does not conflict with any existing export.

The `Hpke` namespace is implemented as a TypeScript module (`hpke.ts`) and re-exported via the index files as `import * as Hpke from './hpke'; export { Hpke }`, following the identical pattern used for `KeyStore` and `Converters`.

### Types

```typescript
/**
 * Output of {@link Hpke.sealBase}. The `ciphertext` field includes the 16-byte
 * AES-256-GCM authentication tag appended by Web Crypto's encrypt() operation.
 * @public
 */
export interface IHpkeSealResult {
  /**
   * Encapsulated key — 32-byte raw X25519 ephemeral public key (enc in RFC 9180).
   * Must be transmitted to the recipient alongside `ciphertext`.
   */
  readonly enc: Uint8Array;

  /**
   * AES-256-GCM ciphertext with the 16-byte authentication tag appended.
   * Length = plaintext.length + 16 bytes.
   */
  readonly ciphertext: Uint8Array;
}
```

**Why `{ enc, ciphertext }` instead of `{ enc, ciphertext, tag }`:** RFC 9180 treats AEAD output as a single `ct` value inclusive of the auth tag. Web Crypto's `AES-GCM` encrypt returns ciphertext+tag concatenated. Separating tag at the API level would force the implementation to split the GCM output on every seal and recombine on every open, adding complexity with no consumer benefit. The `encodeEnvelope`/`decodeEnvelope` helpers handle the common serialization case.

### Functions

```typescript
/**
 * HPKE base-mode seal (sender side). RFC 9180 §6.1.
 *
 * Generates a fresh ephemeral X25519 keypair, runs DHKEM(X25519,HKDF-SHA256)
 * Encap to produce a shared secret and enc (32-byte raw public key), derives
 * AEAD key and nonce deterministically via the RFC 9180 key schedule, then
 * encrypts plaintext with AES-256-GCM.
 *
 * @param subtle - Web Crypto SubtleCrypto instance.
 *   Node: `crypto.webcrypto.subtle` (from `import * as crypto from 'crypto'`).
 *   Browser: `globalThis.crypto.subtle`.
 * @param recipientPublicKey - Recipient's X25519 public CryptoKey.
 *   Must have `algorithm.name === 'X25519'` and `type === 'public'`.
 * @param info - Context-binding bytes. **Load-bearing and first-class; no default.**
 *   Binds this ciphertext to a specific application context so it cannot be
 *   replayed in a different context (see §5 for discipline guidance).
 *   Callers MUST supply a unique context per use case (e.g. session ID bytes).
 * @param aad - Additional authenticated data. Integrity-protected but not encrypted.
 *   Empty Uint8Array is valid; pass empty when no AAD is needed.
 * @param plaintext - Bytes to encrypt. Empty Uint8Array is valid.
 * @returns `Success` with `{ enc, ciphertext }`, or `Failure` with error context.
 */
export async function sealBase(
  subtle: SubtleCrypto,
  recipientPublicKey: CryptoKey,
  info: Uint8Array,
  aad: Uint8Array,
  plaintext: Uint8Array
): Promise<Result<IHpkeSealResult>>

/**
 * HPKE base-mode open (recipient side). RFC 9180 §6.1.
 *
 * Decapsulates enc using the recipient's X25519 private key via DHKEM Decap,
 * derives the same AEAD key and nonce from the shared secret and info via the
 * RFC 9180 key schedule, then authenticates and decrypts ciphertext with
 * AES-256-GCM.
 *
 * Returns `Failure` on any of:
 * - Wrong private key (different DH output, different key derivation)
 * - Wrong `info` (different key schedule context, different AEAD key)
 * - Wrong `aad` (AES-GCM authentication fails)
 * - Tampered `ciphertext` or `enc` (authentication fails or DH fails)
 * - Malformed `enc`: not exactly 32 bytes
 * - `ciphertext` shorter than 16 bytes (no room for authentication tag)
 *
 * @param subtle - Web Crypto SubtleCrypto instance.
 * @param recipientPrivateKey - Recipient's X25519 private CryptoKey.
 *   Must have `algorithm.name === 'X25519'` and `type === 'private'` with
 *   `usages` including `'deriveBits'`.
 * @param info - Context-binding bytes. Must exactly match the `info` supplied at
 *   seal time. A mismatch produces a different AEAD key and open will fail.
 * @param aad - Must exactly match `aad` from seal time.
 * @param enc - The encapsulated key from `sealBase` — exactly 32 bytes.
 * @param ciphertext - The ciphertext from `sealBase` — plaintext.length + 16 bytes.
 * @returns `Success` with decrypted plaintext bytes, or `Failure` with error context.
 */
export async function openBase(
  subtle: SubtleCrypto,
  recipientPrivateKey: CryptoKey,
  info: Uint8Array,
  aad: Uint8Array,
  enc: Uint8Array,
  ciphertext: Uint8Array
): Promise<Result<Uint8Array>>

/**
 * HKDF-SHA256 key derivation (RFC 5869). Exposed here per D2.
 *
 * Wraps HKDF-Extract + HKDF-Expand using SHA-256, returning `length` bytes of
 * derived keying material. This is the underlying KDF used by HPKE; exposed for
 * callers who need standalone HKDF (e.g. PRF output → derived-master derivation).
 *
 * Does NOT use RFC 9180's labeled HKDF variants — this is raw RFC 5869 HKDF.
 *
 * @param subtle - Web Crypto SubtleCrypto instance.
 * @param secret - Input keying material (IKM). Any length.
 * @param salt - Optional randomness. Use `new Uint8Array(0)` if no salt is available.
 * @param info - Context/application binding bytes. Any length.
 * @param length - Number of output bytes to derive. Max 8160 bytes (255 * Nh).
 * @returns `Success` with derived bytes, or `Failure` with error context.
 */
export async function hkdf(
  subtle: SubtleCrypto,
  secret: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Result<Uint8Array>>

/**
 * Encodes an `IHpkeSealResult` as a single contiguous byte array for wire transport.
 *
 * Format: `enc` (32 bytes) || `ciphertext` (variable length).
 * The 32-byte `enc` length is fixed for X25519; the split point is unambiguous.
 *
 * @param result - The output of `sealBase`.
 * @returns Concatenated byte array: enc || ciphertext.
 */
export function encodeEnvelope(result: IHpkeSealResult): Uint8Array

/**
 * Decodes an envelope produced by `encodeEnvelope` back to `IHpkeSealResult`.
 *
 * Validates that the buffer is at least 48 bytes (32-byte enc + 16-byte minimum
 * ciphertext with auth tag; zero plaintext is the minimum meaningful case).
 *
 * @param envelope - The envelope bytes produced by `encodeEnvelope`.
 * @returns `Success` with `{ enc, ciphertext }`, or `Failure` if malformed.
 */
export function decodeEnvelope(envelope: Uint8Array): Result<IHpkeSealResult>
```

### Decision: not exposing lower-level primitives (encap/decap, key_schedule)

`Encap`, `Decap`, `KeySchedule`, and the labeled HKDF primitives are implementation details. Exposing them risks caller misuse — e.g. reusing a `shared_secret` across multiple seal calls (which would reuse the same AEAD key), or calling `KeySchedule` with incorrect mode flags. The seal/open pair is the safe, complete abstraction. Advanced consumers who genuinely need the internals can implement against RFC 9180 directly. Promoting internals to the public API is always possible later without breaking the public `sealBase`/`openBase` surface.

---

## 3. Package Placement

### Node-side: `@fgv/ts-extras/crypto-utils`

New file:
- `libraries/ts-extras/src/packlets/crypto-utils/hpke.ts`
  - No `import * as crypto from 'crypto'` — uses only `SubtleCrypto` (a global type in both Node 20+ and browsers)
  - Implements all `Hpke` exports: `sealBase`, `openBase`, `hkdf`, `encodeEnvelope`, `decodeEnvelope`, `IHpkeSealResult`
  - Internal helpers (not exported): `_labeledExtract`, `_labeledExpand`, `_kemEncap`, `_kemDecap`, `_keyScheduleBase`, `_checkX25519Key`

Modified files:
- `libraries/ts-extras/src/packlets/crypto-utils/index.ts` — add:
  ```typescript
  import * as Hpke from './hpke';
  export { Hpke };
  ```
- `libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts` — add the same Hpke export.
  The `hpke.ts` module has no Node-specific imports (no `'crypto'`), so it is safe in the browser entry point.

### Browser-side: `@fgv/ts-web-extras/crypto-utils`

No new implementation files required. HPKE logic is entirely in `ts-extras`.

Modified file:
- `libraries/ts-web-extras/src/packlets/crypto-utils/index.ts` — add:
  ```typescript
  export { Hpke } from '@fgv/ts-extras';
  ```
  This makes `Hpke` accessible to consumers who only import from `@fgv/ts-web-extras`.

Browser usage pattern (no wrapper needed beyond the re-export):
```typescript
// Consumer code in a browser context
import { CryptoUtils } from '@fgv/ts-web-extras';
const result = await CryptoUtils.Hpke.sealBase(
  globalThis.crypto.subtle,
  recipientPublicKey,
  info,
  aad,
  plaintext
);
```

### Runtime version requirements

Both required primitives — X25519 key generation/DH and HMAC-SHA256 — are native in:
- **Node.js**: 20 LTS or later (X25519 in `webcrypto` available since Node 20; HMAC and AES-GCM available since Node 18). No WASM bundling needed.
- **Browser**: Chrome 113+ (May 2023), Firefox 118+ (Sept 2023), Safari 16.4+ (Mar 2023). X25519 in Web Crypto is the binding constraint; it arrived in 2023 across all major browsers.

Note: X25519 platform availability is materially newer than AES-GCM (which is supported everywhere). Phase B should add explicit version notes in LIBRARY_CAPABILITIES.md.

No third-party WASM or npm dependency is needed for any HPKE primitive. All required operations are native Web Crypto.

---

## 4. HKDF Placement

**Recommendation: Option (b) — export as `Hpke.hkdf`, not as `ICryptoProvider.hkdf`.**

Rationale:

1. **`ICryptoProvider` is a breaking-change surface.** Adding a new method to `ICryptoProvider` is a breaking change for any third-party implementer of the interface. Per the lockstep version policy, that's a cost born by every consumer in the same publish. Adding `hkdf` to `ICryptoProvider` is not zero-cost.

2. **`Hpke` already has HKDF internally.** The HPKE implementation uses HMAC-SHA256 to implement HKDF Extract/Expand. Exposing `Hpke.hkdf` is natural — the implementation is already there, and exposing it as a raw HKDF function is minimal additional surface.

3. **The primary standalone use case is HPKE-adjacent.** The consumer's potential standalone HKDF need (PRF output → derived-master) lives in the WebAuthn flow. Whether that flow calls `Hpke.hkdf` or a future `ICryptoProvider.hkdf` is the WebAuthn stream's design decision. The WebAuthn stream can document the dependency on `Hpke.hkdf` and both stream agents agree; if the WebAuthn stream concludes it needs the provider interface, that's a follow-on change.

4. **Promotion is forward-compatible.** If a non-HPKE consumer needs HKDF and the `ICryptoProvider` route is preferred, adding `ICryptoProvider.hkdf` in a future stream is mechanical: add the method signature, implement in both providers, delegate `Hpke.hkdf` to `ICryptoProvider.hkdf`. The public `Hpke.hkdf` export stays; no call sites break.

**Coordination note (§9, Q4):** The WebAuthn stream should review this decision. If WebAuthn's design concludes it needs `ICryptoProvider.hkdf` for mock-provider testability, the orchestrator should reconcile before phase B begins on either stream.

---

## 5. `info` Parameter Convention

### Type: `Uint8Array`

The caller supplies raw bytes. This matches:
- RFC 9180 spec definition: `info` is a byte string
- The existing `IWrapBytesOptions.info: Uint8Array` convention in `wrapBytes`
- The general fgv pattern for binary crypto parameters

No implicit UTF-8 encoding from a `string` type. If the caller's context value is a string (e.g. a UUID), they encode it themselves: `new TextEncoder().encode(sessionId)`. This keeps the API honest about the encoding boundary.

### No fgv-provided helper for building canonical context bytes (v1)

Context-binding conventions are application-specific. A generic helper (`buildHpkeInfo(prefix: string, id: Uint8Array)`) would be under-specified: the consumer needs to decide the prefix scheme, separator bytes, and length encoding for structured fields. Rolling a helper without a consumer spec would be premature. Callers build canonical-context bytes using `TextEncoder` and `Uint8Array` concatenation.

### Documentation guidance for callers

The following text should appear in the `sealBase` JSDoc and in LIBRARY_CAPABILITIES.md:

> **`info` discipline — cross-context replay prevention.**
>
> The `info` parameter is incorporated into the HPKE key schedule (RFC 9180 §5). Any change to `info` produces different AEAD key and nonce derivations: a ciphertext sealed with `info = A` cannot be decrypted with `info = B`. This is a security property, not just tagging.
>
> **Domain separation is the caller's responsibility.** Two different call sites sharing the same recipient keypair MUST use non-overlapping `info` values or a captured ciphertext from one context could be submitted to another. The recommended pattern:
> ```typescript
> const info = concat(
>   new TextEncoder().encode('myapp/v1/use-case-name\x00'),  // type prefix
>   contextIdBytes                                            // per-instance unique value
> );
> ```
> The null byte (`\x00`) in the prefix prevents prefix-extension attacks if `contextIdBytes` happens to start with valid ASCII.
>
> **Never pass an empty `Uint8Array` as `info` in production.** Empty info provides no context binding: any ciphertext sealed with empty info from any call site with the same recipient keypair is valid, defeating replay protection. The API does not default `info` to empty precisely because silent defaulting hides protocol mistakes.
>
> **The API does not enforce non-empty `info`** at runtime (the RFC does not require it, and enforcement would prevent edge cases where a caller deliberately passes a context-free seal). Document, don't guard.

---

## 6. Cross-Runtime Equivalence

**Required property:** HPKE ciphertext sealed with browser's `globalThis.crypto.subtle` must be openable with Node's `crypto.webcrypto.subtle`, and vice versa. This is critical for the consumer's master-key delivery (browser seals, server opens) and per-session material delivery flows.

### Test strategy

**1. RFC 9180 test vectors (KEM+KDF validation)**

RFC 9180 Appendix A contains canonical test vectors for multiple cipher suite combinations. Based on phase A research (the draft repo `cfrg/draft-irtf-cfrg-hpke` test-vectors.json contained entries with AES-128-GCM for X25519, not AES-256-GCM), there may not be RFC 9180 test vectors for the exact cipher suite DHKEM(X25519)+HKDF-SHA256+AES-256-GCM. **The phase B implementing agent must verify** at https://www.rfc-editor.org/rfc/rfc9180#appendix-A and document the finding.

- **If exact test vectors exist**: Embed them as hardcoded constants in `hpke-test-vectors.ts` and assert them in both ts-extras and ts-web-extras unit tests.
- **If exact vectors don't exist**: Use a two-source approach:
  - The RFC 9180 Appendix A.1 vectors (base mode, DHKEM(X25519,HKDF-SHA256), HKDF-SHA256, AES-128-GCM) cover the KEM (shared_secret, enc) and key derivation steps. These can be verified in the AES-256-GCM implementation up to and including the `key` and `base_nonce` derivation, since those steps are independent of the AEAD algorithm.
  - For the AES-256-GCM AEAD step, generate reference test vectors by running the fully implemented Node-side `sealBase` against known inputs and recording outputs as constants. These self-generated vectors then become the cross-runtime anchor for the browser test suite.

**2. Shared test-vector constant file**

```
libraries/ts-extras/src/test/unit/crypto/hpke-test-vectors.ts
```

This file exports:
- Any applicable RFC 9180 vector constants (scalar fields: info, aad, plaintext, ciphertext, enc, key, base_nonce)
- Self-generated round-trip vectors (if RFC doesn't cover the exact suite)
- Shared across both `hpke.test.ts` and `browserHpke.test.ts`

**3. Both-runtime test suites**

```
// ts-extras — Node tests
libraries/ts-extras/src/test/unit/crypto/hpke.test.ts
  - Uses crypto.webcrypto.subtle
  - Applies test vectors
  - Round-trip tests (seal then open on same subtle)
  - All error-path tests

// ts-web-extras — Browser tests  
libraries/ts-web-extras/src/test/unit/browserHpke.test.ts
  - Also uses crypto.webcrypto.subtle (Node 20+ Jest environment)
  - Applies same test vectors from shared file
  - Cross-subtle round-trip: seal on a second SubtleCrypto ref, open on first (and vice versa)
```

Both suites use `crypto.webcrypto.subtle` in Jest (same value). The cross-runtime proof is: given that both Node 20+ and modern browsers expose Web Crypto to the same spec, and both suites pass the same vectors against the same API, the implementation is correct across runtimes. This is the established pattern for this codebase (see `ts-web-extras/src/test/unit/browserCryptoProvider.wrapBytes.test.ts`).

**4. Precedent in existing tests**

`browserCryptoProvider.wrapBytes.test.ts` uses `crypto.webcrypto.subtle` (Node 20+) to test browser-side logic. Same pattern applies: no separate browser runner is needed. The Node 20+ Web Crypto implementation is spec-compliant and produces identical outputs to browser Web Crypto for all primitives involved.

---

## 7. Implementation Plan

### Files to add

```
libraries/ts-extras/src/packlets/crypto-utils/
└── hpke.ts                                   NEW — core Hpke module

libraries/ts-extras/src/test/unit/crypto/
├── hpke-test-vectors.ts                      NEW — shared test vector constants
└── hpke.test.ts                              NEW — Node-side unit tests

libraries/ts-web-extras/src/test/unit/
└── browserHpke.test.ts                       NEW — browser-side unit tests
```

### Files to modify

```
libraries/ts-extras/src/packlets/crypto-utils/index.ts         — add Hpke export
libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts — add Hpke export
libraries/ts-web-extras/src/packlets/crypto-utils/index.ts     — re-export Hpke
.ai/instructions/LIBRARY_CAPABILITIES.md                       — update crypto-utils entry
```

### Order of work (recommended for phase B)

1. **Internal HKDF primitives** — `_hmacSha256(subtle, key, data)`, `_hkdfExtract(subtle, salt, ikm)`, `_hkdfExpand(subtle, prk, info, length)`. Unit-test each against RFC 5869 test vectors (https://www.rfc-editor.org/rfc/rfc5869#appendix-A — these ARE accessible).

2. **Labeled HKDF** — `_labeledExtract(subtle, suiteId, salt, label, ikm)` and `_labeledExpand(subtle, suiteId, prk, label, info, length)`. Unit-test against RFC 9180 KEM step vectors if available.

3. **DHKEM Encap/Decap** — ephemeral key generation, X25519 `deriveBits`, raw public key export, labeled extraction to shared_secret. Unit-test shared_secret value against RFC 9180 vectors.

4. **Key schedule** — `_keyScheduleBase(subtle, shared_secret, info)` → `{ key, base_nonce }`. Unit-test key and base_nonce against RFC 9180 vectors.

5. **sealBase** — wire together Encap + KeySchedule + AES-256-GCM encrypt. Unit-test round-trip. Add input validation guards (`enc` length, `ciphertext` minimum length, X25519 key type check).

6. **openBase** — wire together Decap + KeySchedule + AES-256-GCM decrypt. Unit-test round-trip and all error paths (wrong key, wrong info, wrong aad, tampered ciphertext).

7. **Hpke.hkdf** — raw HKDF-SHA256 (delegates to `_hkdfExtract` + `_hkdfExpand`). Unit-test against RFC 5869 vectors.

8. **encodeEnvelope / decodeEnvelope** — pure byte helpers. Unit-test round-trip and size validation.

9. **Exports** — wire `index.ts`, `index.browser.ts`, `ts-web-extras/index.ts`.

10. **Browser unit tests** — `browserHpke.test.ts` with shared vectors.

11. **LIBRARY_CAPABILITIES.md** — update crypto-utils entry.

### Test coverage strategy (100% required)

Coverage is required for all statements, branches, functions, and lines per repo convention. Strategy per code area:

| Area | Test approach |
|---|---|
| `_hmacSha256`, `_hkdfExtract`, `_hkdfExpand` | RFC 5869 vectors + known-bad inputs |
| `_labeledExtract`, `_labeledExpand` | RFC 9180 KEM/KDF vectors (if available) |
| `_kemEncap`, `_kemDecap` | Shared_secret match from Encap+Decap round-trip; vector if available |
| `_keyScheduleBase` | key+base_nonce vector assertions |
| `sealBase` + `openBase` | Round-trip × 5 plaintext lengths; RFC/generated vectors; each failure mode |
| `Hpke.hkdf` | RFC 5869 vectors + wrong-length output |
| `encodeEnvelope` + `decodeEnvelope` | Round-trip; malformed (too short); minimum valid |
| Defensive branches (e.g. `deriveBits` internal error) | `c8 ignore` with rationale — same pattern as existing `nodeCryptoProvider.ts` and `wrapBytes.ts` |

Error path coverage is non-negotiable: the consumer's security model depends on `openBase` failing cleanly when ciphertext is tampered or info mismatches. These are not defensive code — they are specified behavior.

### LIBRARY_CAPABILITIES.md update sketch

Under `@fgv/ts-extras — crypto-utils` → `crypto-utils` packlet, extend the table row for `crypto-utils` to add:

```
| Hpke namespace | RFC 9180 base mode (DHKEM(X25519,HKDF-SHA256), HKDF-SHA256, AES-256-GCM). sealBase(subtle,pkR,info,aad,pt), openBase(subtle,skR,info,aad,enc,ct), hkdf(subtle,...), encodeEnvelope/decodeEnvelope. Both Node (crypto.webcrypto.subtle) and browser (globalThis.crypto.subtle) via SubtleCrypto injection. Node 20+; Chrome 113+, Safari 16.4+, Firefox 118+ for browser. |
```

Also add to the decision shortcuts section:
```
- **HPKE seal/open (asymmetric envelope encryption)?** → `Hpke.sealBase` / `Hpke.openBase` from `@fgv/ts-extras/crypto-utils` (also re-exported from `@fgv/ts-web-extras/crypto-utils`). Do NOT use `wrapBytes`/`unwrapBytes` (those are ECIES P-256).
- **HKDF-SHA256 key derivation?** → `Hpke.hkdf` from `@fgv/ts-extras/crypto-utils`.
```

---

## 8. Migration Impact

HPKE is net-new. No existing API surface is modified. Confirmed:

- `ICryptoProvider` interface: **unchanged**. No new methods added.
- `wrapBytes` / `unwrapBytes` (ECIES P-256): **unchanged** (per D1 — HPKE is a separate primitive, not an extension of the ECIES surface).
- `keyPairAlgorithmParams`: **unchanged**. The `x25519` entry already exists; HPKE generates ephemeral X25519 keys inline using `subtle.generateKey` directly rather than routing through `keyPairAlgorithmParams`.
- No existing consumer migration required.
- The `x25519` entry in `keyPairAlgorithmParams` is available to the phase B implementer as a reference for the correct X25519 Web Crypto parameter objects, but HPKE's ephemeral key generation does not use the table (it needs `['deriveBits']` usage rather than `['deriveKey', 'deriveBits']`).

---

## 9. Open Questions for Signoff

**Q1 (Important — test vectors): RFC 9180 test vectors for exact cipher suite**

Phase A was unable to access rfc-editor.org (HTTP 403) or the tag `rfc9180` of the cfrg draft repo. Based on the master-branch `test-vectors.json` from cfrg/draft-irtf-cfrg-hpke (which only contains AES-128-GCM for X25519), the RFC may not include canonical test vectors for DHKEM(X25519)+HKDF-SHA256+**AES-256-GCM**.

Impact: if vectors don't exist, the cross-runtime correctness anchor is self-generated (Node implementation output → browser verification). This is still sound — it verifies cross-platform equivalence, just not against an independent reference. Phase B agent must resolve and document. If this is a blocker for signoff confidence, it should be noted.

**Q2 (Minor — output shape): `{ enc, ciphertext }` vs. `{ enc, ciphertext, tag }`**

The brief requested `{ enc, ciphertext, tag }`. The design uses `{ enc, ciphertext }` where `ciphertext` includes the 16-byte auth tag, matching RFC 9180's AEAD output convention and Web Crypto's AES-GCM behavior. If the consumer wire format requires tag to be separately addressable (e.g. a protocol field layout), this should be revisited before phase B. Otherwise: confirmed as designed.

**Q3 (Minor — platform requirements): Browser version floor documentation**

X25519 in Web Crypto is a 2023 addition (Chrome 113, Safari 16.4, Firefox 118). This is significantly newer than other crypto primitives in the codebase. The phase B agent should add explicit version floor documentation in LIBRARY_CAPABILITIES.md. No action needed before phase B starts; capturing here for the record.

**Q4 (Coordination): WebAuthn stream and `Hpke.hkdf`**

The parallel `crypto-batch-2-webauthn` stream may need HKDF for PRF output → derived-master derivation. This design surfaces `hkdf` as `Hpke.hkdf` (option b from the brief). If the WebAuthn stream design concludes `ICryptoProvider.hkdf` is needed (e.g. for test-provider mockability), the orchestrator should reconcile before phase B of either stream begins. The two streams' implementations are not blocked on each other, but the interface decision should be settled before implementation to avoid divergence.

---

## Appendix: Internal implementation notes (for phase B agent)

These are not design decisions — they are implementation guidance to reduce ramp-up time.

**X25519 key generation for Encap:**
```typescript
const ephemeral = await subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']) as CryptoKeyPair;
const enc = new Uint8Array(await subtle.exportKey('raw', ephemeral.publicKey));
const dhBits = await subtle.deriveBits({ name: 'X25519', public: recipientPublicKey }, ephemeral.privateKey, 256);
const dh = new Uint8Array(dhBits);
```

**X25519 Decap:**
```typescript
const pkE = await subtle.importKey('raw', enc, { name: 'X25519' }, true, []);
const dhBits = await subtle.deriveBits({ name: 'X25519', public: pkE }, recipientPrivateKey, 256);
const dh = new Uint8Array(dhBits);
```

**Recipient's own public key (needed for kem_context in Decap):**
```typescript
// X25519 private CryptoKey can export its paired public key via JWK (omit 'd' field),
// but this is awkward. Easier: require the caller to also pass pkR, OR extract from JWK.
// Alternative: derive kem_context from recipientPrivateKey via JWK export.
// This is an implementation-time decision; document the chosen approach in hpke.ts.
```
Note: RFC 9180 Decap requires `SerializePublicKey(pk(skR))` — the recipient's own public key in raw form. Web Crypto does not have a `getPublicKey(privateKey)` operation. The implementer should export the private key as JWK and reconstruct the public key from the JWK `x` coordinate (for X25519, the `x` field in JWK is the 32-byte raw public key in base64url encoding). This is a confirmed Web Crypto pattern.

**HMAC-SHA256 for HKDF Extract:**
```typescript
// Extract(salt, ikm) = HMAC-SHA256(key=salt, msg=ikm)
// salt of length 0 → use 32 zero bytes as HMAC key (RFC 5869 §2.2)
const saltKey = await subtle.importKey(
  'raw',
  salt.length === 0 ? new Uint8Array(32) : salt,
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign']
);
const prk = new Uint8Array(await subtle.sign('HMAC', saltKey, ikm));
```

**HKDF Expand:**
```typescript
// Standard iterative HMAC expansion
const prkKey = await subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
// T(1) = HMAC(prk, labeled_info || 0x01)
// T(2) = HMAC(prk, T(1) || labeled_info || 0x02)
// ...
// Output = T(1) || T(2) || ... truncated to length
```

**AES-256-GCM (nonce = base_nonce, seq=0):**
```typescript
const ct = await subtle.encrypt({ name: 'AES-GCM', iv: base_nonce, additionalData: aad }, aesKey, plaintext);
// ct is ArrayBuffer of (plaintext.length + 16) bytes — ciphertext || auth_tag
```

**Key import for AES-256-GCM:**
```typescript
const aesKey = await subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['encrypt']); // seal
const aesKey = await subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt']); // open
```
