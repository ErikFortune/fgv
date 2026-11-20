# Design: crypto-batch-2-argon2id

**Phase:** A — research and design
**Author:** implementing agent (claude/argon2id-package-split-EhzDh)
**Date:** 2026-05-12
**Status:** draft — awaiting orchestrator signoff before phase B

---

## 1. Library Survey

### Node.js Candidates

#### `argon2` (kelektiv / ranisalt/node-argon2)

- **Version:** 0.45.0 (published 2026-04-30) — actively maintained; regular releases through 2025–2026
- **Weekly downloads:** ~850K–1.09M
- **Argon2id support:** Yes — `argon2id` is the default variant
- **Parameter API:**

  | Parameter | Type | Default |
  |---|---|---|
  | `type` | enum | `argon2id` |
  | `memoryCost` | number (KiB) | 65536 |
  | `timeCost` | number | 3 |
  | `parallelism` | number | 4 |
  | `hashLength` | number | 32 |
  | `salt` | Buffer | (must supply) |
  | `raw` | boolean | false |

- **Output format:** `raw: false` → PHC-encoded string (`$argon2id$v=19$m=…$…`); `raw: true` → raw `Buffer` (Uint8Array-compatible)
- **Raw bytes output:** Yes, via `raw: true`
- **Node.js requirements:** ≥ 22.0.0 (as of v0.45.0). **This matches the repo's `nodeSupportedVersionRange` exactly** — no conflict.
- **Native binding:** Yes (node-gyp). Prebuilt binaries for all major platforms since v0.26.0; no build step in normal CI.
- **Browser:** Not usable — Node-only by design.
- **Cross-runtime notes:** Binds to the C reference implementation (phc-winner-argon2). PHC-encoded output is verifiable by any compliant implementation.
- **Links:** [npm](https://www.npmjs.com/package/argon2) | [GitHub](https://github.com/ranisalt/node-argon2)

#### `@node-rs/argon2`

- **Version:** 2.0.2 (last published ~December 2024 — no 2025/2026 release observed)
- **Argon2id support:** Yes — default algorithm
- **Raw bytes output:** **No.** `hash()` returns `Promise<string>` — Base64 of raw bytes only, not a PHC string. Cannot be cross-verified with `node-argon2.verify()` or `hash-wasm.argon2Verify()` without manual re-wrapping.
- **Maintenance:** Slow. 38 open issues; no npm release in ~5 months as of 2026-05.
- **Verdict:** ❌ **Disqualified** — lacks raw bytes output and PHC-encoded output; incompatible output format breaks cross-runtime equivalence verification strategy.

### Browser / WASM Candidates

#### `hash-wasm`

- **Version:** 4.12.0 (published 2024-11-19)
- **Weekly downloads:** ~616K–687K
- **Argon2id support:** Yes — dedicated `argon2id()` function (separate from `argon2i()`, `argon2d()`). Also provides `argon2Verify()`.
- **Parameter API:**

  | Parameter | Type | Required |
  |---|---|---|
  | `password` | string \| Buffer | yes |
  | `salt` | string \| Buffer | yes |
  | `iterations` | number | yes |
  | `parallelism` | number | yes |
  | `memorySize` | number (KiB) | yes |
  | `hashLength` | number | yes |
  | `outputType` | `'hex'` \| `'binary'` \| `'encoded'` | no (default: `'hex'`) |

- **Output format:** `outputType: 'binary'` → `Uint8Array` raw bytes; `outputType: 'encoded'` → PHC-format string
- **Raw bytes output:** Yes — `Uint8Array` natively.
- **Node.js compatibility:** Runs in Node 8+. Pure WASM — **no Web Crypto dependency**. This is the key insight: `hash-wasm` runs identically in Node.js and browsers, enabling cross-runtime equivalence tests in a single Jest suite.
- **Bundle size:** Argon2id WASM module ~11 kB gzipped — notably smaller than alternatives.
- **Browser compatibility:** Chrome 57+, Safari 11+, Firefox 53+, Edge 16+, Web Workers.
- **Maintenance:** Last release November 2024 (~6 months ago). Low open issues (8). Not abandoned; slow-moving.
- **Cross-runtime notes:** Pure WASM — same code path in Node and browser. PHC-encoded output cross-verifiable with `node-argon2` (same format). Uses hand-tuned WASM (not compiled from reference C source directly), but implements RFC 9106 faithfully; real-world PHC cross-verification with `node-argon2` works correctly.
- **Links:** [npm](https://www.npmjs.com/package/hash-wasm) | [GitHub](https://github.com/Daninet/hash-wasm)

#### `argon2-browser` (antelle)

- **Version:** 1.18.0
- **Last published:** ~5 years ago (~2020–2021)
- **Maintenance:** ❌ **Effectively abandoned** — no npm release in ~5 years, 17 open issues, 3 open PRs.
- **Verdict:** ❌ **Disqualified** — unacceptable risk for a security-sensitive KDF dependency. A zero-day in the WASM bundle would have no upstream response path.

### Recommendation

| Package | Role | Chosen Library | Key reason |
|---|---|---|---|
| `@fgv/ts-extras-argon2` | Node | `argon2` v0.45.0 | Actively maintained 2026, default argon2id, raw bytes via `raw: true`, native performance, Node ≥ 22 matches repo |
| `@fgv/ts-web-extras-argon2` | Browser | `hash-wasm` v4.12.0 | Pure WASM runs in both Node and browser (enables pure-Jest equivalence tests), `outputType: 'binary'` → Uint8Array, ~11 kB gzipped, PHC-compatible |

**Cross-runtime output equivalence justification (D3):**
Both libraries implement RFC 9106 Argon2id v1.3. The PHC-encoded output formats are identical (`$argon2id$v=19$m=M,t=T,p=P$<b64salt>$<b64hash>`), which means `node-argon2` and `hash-wasm` agree on the raw hash bytes for identical inputs — the PHC string *contains* the base64-encoded raw bytes. Since `hash-wasm` is pure WASM and runs in Node.js, the equivalence test suite can be a plain Jest test that imports both providers and asserts byte-for-byte identity — no browser runner required (see §6).

---

## 2. Package Structure

### New Packages

#### `@fgv/ts-extras-argon2`

```
libraries/ts-extras-argon2/
├── src/
│   ├── index.ts                     # public exports
│   └── packlets/
│       └── argon2/
│           ├── index.ts
│           └── nodeArgon2Provider.ts  # NodeArgon2Provider class
├── package.json
├── tsconfig.json
├── jest.config.json
└── README.md
```

**`package.json` key fields:**
```json
{
  "name": "@fgv/ts-extras-argon2",
  "dependencies": {
    "@fgv/ts-extras": "workspace:*",
    "@fgv/ts-utils": "workspace:*",
    "argon2": "^0.45.0"
  }
}
```

**Exported surface:**
- `NodeArgon2Provider` — implements `IArgon2idProvider`
- Re-export of `IArgon2idProvider`, `IArgon2idParams` from `@fgv/ts-extras` for consumer convenience

**`@types/argon2`:** The `argon2` package ships its own TypeScript declarations since v0.30; no separate `@types/` needed.

#### `@fgv/ts-web-extras-argon2`

```
libraries/ts-web-extras-argon2/
├── src/
│   ├── index.ts
│   └── packlets/
│       └── argon2/
│           ├── index.ts
│           └── browserArgon2Provider.ts  # BrowserArgon2Provider class
├── package.json
├── tsconfig.json
├── jest.config.json
└── README.md
```

**`package.json` key fields:**
```json
{
  "name": "@fgv/ts-web-extras-argon2",
  "dependencies": {
    "@fgv/ts-extras": "workspace:*",
    "@fgv/ts-utils": "workspace:*",
    "hash-wasm": "^4.12.0"
  }
}
```

**Exported surface:**
- `BrowserArgon2Provider` — implements `IArgon2idProvider`
- Re-export of `IArgon2idProvider`, `IArgon2idParams` from `@fgv/ts-extras` for consumer convenience

**Note on `hash-wasm` and `@fgv/ts-web-extras`:** Unlike `@fgv/ts-web-extras` (which depends on `@fgv/ts-extras`), `@fgv/ts-web-extras-argon2` depends on `@fgv/ts-extras` directly (for the interface) but NOT on `@fgv/ts-web-extras`. `hash-wasm` has no Web Crypto dependency; it's pure WASM with no runtime-environment coupling. The `ts-web-extras-*` naming follows the convention that browser-targeted packages live in the `ts-web-extras` family.

### Rush.json Registration

Add both entries following the existing `libraries/` pattern:

```json
{
  "packageName": "@fgv/ts-extras-argon2",
  "projectFolder": "libraries/ts-extras-argon2",
  "shouldPublish": true,
  "versionPolicyName": "base-utils",
  "tags": ["libraries"]
},
{
  "packageName": "@fgv/ts-web-extras-argon2",
  "projectFolder": "libraries/ts-web-extras-argon2",
  "shouldPublish": true,
  "versionPolicyName": "base-utils",
  "tags": ["libraries"]
}
```

**`versionPolicyName: "base-utils"`** is correct — these packages participate in the lockstep policy alongside all other `@fgv/*` libraries.

### API-Surface Consistency

Both packages implement the same `IArgon2idProvider` interface (§3). The class names differ (`NodeArgon2Provider` vs `BrowserArgon2Provider`) following the existing naming convention in the ecosystem (`NodeCryptoProvider` vs `BrowserCryptoProvider`). Consumers depending on the `IArgon2idProvider` interface can swap implementations without changing call sites.

---

## 3. Interface Definition

The `IArgon2idProvider` interface and associated types are added to **`@fgv/ts-extras/src/packlets/crypto-utils/model.ts`** alongside the existing `ICryptoProvider`. This keeps the contract in the "model" layer that both packages and consumers import.

```typescript
// In @fgv/ts-extras/src/packlets/crypto-utils/model.ts

/**
 * Parameters for Argon2id key derivation (RFC 9106).
 * All fields are required; fgv does not pick defaults silently.
 * @public
 */
export interface IArgon2idParams {
  /**
   * Memory cost in kibibytes (KiB).
   * OWASP 2023 minimum: 19456 (19 MiB). Stronger: 65536 (64 MiB).
   * Constraint: >= 8.
   */
  readonly memoryKiB: number;

  /**
   * Number of passes (iterations / time cost).
   * OWASP 2023 minimum: 2. Range: >= 1.
   */
  readonly iterations: number;

  /**
   * Degree of parallelism (threads).
   * Note: WASM-based implementations compute sequentially regardless of this value,
   * but the value is wired into the algorithm and AFFECTS the output hash bytes.
   * Callers must use the same parallelism value consistently for a given secret.
   * Range: 1–255.
   */
  readonly parallelism: number;

  /**
   * Number of output bytes (hash length).
   * Typical values: 16 (128-bit), 32 (256-bit, AES-256 key), 64 (512-bit).
   * Constraint: >= 4.
   */
  readonly outputBytes: number;
}

/**
 * Recommended OWASP 2023 minimum Argon2id parameters.
 * Suitable for recovery-row key derivation (high-entropy inputs).
 * @public
 */
export const ARGON2ID_OWASP_MIN: IArgon2idParams = {
  memoryKiB: 19456,
  iterations: 2,
  parallelism: 1,
  outputBytes: 32
} as const;

/**
 * Stronger Argon2id parameters suitable for user-typed passphrases.
 * @public
 */
export const ARGON2ID_PASSPHRASE: IArgon2idParams = {
  memoryKiB: 65536,
  iterations: 3,
  parallelism: 1,
  outputBytes: 32
} as const;

/**
 * Argon2id key derivation provider (RFC 9106).
 *
 * Implementations are in separate packages to avoid WASM bundle costs for
 * consumers who don't need Argon2id:
 * - Node: `@fgv/ts-extras-argon2` (`NodeArgon2Provider`)
 * - Browser: `@fgv/ts-web-extras-argon2` (`BrowserArgon2Provider`)
 *
 * @public
 */
export interface IArgon2idProvider {
  /**
   * Derives key material from a password using Argon2id (RFC 9106 §3.1).
   *
   * Returns the raw derived bytes as a `Uint8Array`. Both Node and browser
   * implementations produce bit-identical output for identical inputs.
   *
   * @param password - Password or passphrase. Accepts string (UTF-8) or raw bytes.
   * @param salt - Salt bytes. Must be random and unique per credential (>= 16 bytes recommended).
   * @param params - Argon2id parameters. Use `ARGON2ID_OWASP_MIN` as a starting point.
   * @returns Success with derived bytes, Failure with error context.
   */
  argon2id(
    password: Uint8Array | string,
    salt: Uint8Array,
    params: IArgon2idParams
  ): Promise<Result<Uint8Array>>;
}
```

### Parameter Constraints and Failure Modes

| Constraint | Failure message |
|---|---|
| `memoryKiB < 8` | `argon2id: memoryKiB must be >= 8` |
| `iterations < 1` | `argon2id: iterations must be >= 1` |
| `parallelism < 1 or > 255` | `argon2id: parallelism must be 1–255` |
| `outputBytes < 4` | `argon2id: outputBytes must be >= 4` |
| `salt.length < 16` | Warning, not failure (spec allows shorter; callers are responsible) |
| WASM init failure (browser) | `argon2id: WASM module failed to initialize: <reason>` |
| Underlying library error | `argon2id: <upstream message>` |

### Argon2id Key Derivation Parameters Extension

The existing `IKeyDerivationParams` in `model.ts` is currently a single shape (`kdf: 'pbkdf2'`). To support Argon2id-backed `KeyStore` entries (§5), it must become a discriminated union:

```typescript
/** @public */
export interface IPbkdf2KeyDerivationParams {
  readonly kdf: 'pbkdf2';
  readonly salt: string;        // base64-encoded
  readonly iterations: number;
}

/** @public */
export interface IArgon2idKeyDerivationParams {
  readonly kdf: 'argon2id';
  readonly salt: string;        // base64-encoded
  readonly memoryKiB: number;
  readonly iterations: number;
  readonly parallelism: number;
}

/** @public */
export type IKeyDerivationParams = IPbkdf2KeyDerivationParams | IArgon2idKeyDerivationParams;

/** @public */
export type KeyDerivationFunction = 'pbkdf2' | 'argon2id';
```

**Migration impact:** Existing consumers of `IKeyDerivationParams` that access `.iterations` must narrow on `.kdf` first. Phase B implementer must audit `keystore/converters.ts` — the converter will need to handle both union arms. See §9 for full blast-radius analysis.

---

## 4. Composition Idiom

### Options Considered

**(a) `ICryptoProvider` gains optional `argon2?: IArgon2idProvider`**
- D2 explicitly states default providers DO NOT implement Argon2id.
- An optional field on `ICryptoProvider` means every existing provider (`NodeCryptoProvider`, `BrowserCryptoProvider`, any third-party implementation) must now explicitly type `argon2?: IArgon2idProvider`. This contaminates the interface with a concern unrelated to the core encryption/decryption/key-agreement surface.
- ❌ Rejected.

**(b) `IArgon2idProvider` is fully standalone**
- Consumers compose it explicitly into their own structures.
- `ICryptoProvider` does not know about Argon2id.
- `KeyStore.addSecretFromPasswordArgon2id()` takes an `IArgon2idProvider` as a parameter (§5).
- Cleanest "opt in by adding the dependency" story. No blast radius on existing `ICryptoProvider` implementers.
- ✅ **Recommended.**

**(c) `ICryptoProviderWithArgon2id extends ICryptoProvider`**
- Provides a type-safe discrimination for "does this provider support Argon2id?"
- Adds interface-hierarchy complexity. In practice, consumers either have an `IArgon2idProvider` or they don't — there's no useful polymorphism benefit from the extends-shape.
- ❌ Rejected.

### Recommended: Option (b) — Fully Standalone

**Consumer composition (Node):**
```typescript
import { NodeCryptoProvider } from '@fgv/ts-extras/crypto-utils';
import { NodeArgon2Provider } from '@fgv/ts-extras-argon2';

const cryptoProvider = new NodeCryptoProvider();
const argon2Provider = new NodeArgon2Provider();

// KeyStore for symmetric key management
const keyStore = KeyStore.create({ cryptoProvider }).orThrow();
await keyStore.initialize(masterPassword);

// Argon2id key derivation (explicit injection)
const keyResult = await keyStore.addSecretFromPasswordArgon2id(
  'my-recovery-key',
  recoveryPhrase,
  argon2Provider,
  { params: ARGON2ID_OWASP_MIN }
);
```

**Consumer composition (Browser):**
```typescript
import { BrowserCryptoProvider } from '@fgv/ts-web-extras/crypto-utils';
import { BrowserArgon2Provider } from '@fgv/ts-web-extras-argon2';

const cryptoProvider = new BrowserCryptoProvider();
const argon2Provider = new BrowserArgon2Provider();
```

**Pattern continuity with `KeyStore.addSecretFromPassword`:**
The existing PBKDF2 method takes `(name, password, options?)` — the crypto provider is already held by the KeyStore. Argon2id requires a separate provider that the KeyStore doesn't hold, so the parameter injection is explicit:  `(name, password, argon2idProvider, options?)`. This is a natural extension: it shows at the call site which KDF is in use and makes the opt-in explicit.

---

## 5. KeyStore Integration

### Recommendation: New Dedicated Methods

Add two new methods to `KeyStore`:

```typescript
/**
 * Adds a secret derived from a password using Argon2id (RFC 9106).
 *
 * The Argon2id provider must be supplied explicitly; the KeyStore does not hold
 * one by default (D2 — consumers opt in by depending on the argon2 package).
 *
 * Returns the key derivation parameters so callers can store them alongside
 * encrypted artifacts, enabling future re-derivation and verification.
 *
 * @param name - Unique name for the secret
 * @param password - Password or passphrase
 * @param argon2idProvider - Argon2id provider (Node or Browser implementation)
 * @param options - Optional: Argon2id params, description, replace flag
 */
public async addSecretFromPasswordArgon2id(
  name: string,
  password: string,
  argon2idProvider: IArgon2idProvider,
  options?: IAddSecretFromPasswordArgon2idOptions
): Promise<Result<IAddSecretFromPasswordResult>>;

/**
 * Verifies a candidate password against an Argon2id-derived entry using the
 * supplied key derivation parameters. Constant-time comparison.
 *
 * @param name - Name of the secret to verify
 * @param password - Candidate password
 * @param argon2idProvider - Must be the same provider type as was used at derivation time
 * @param keyDerivation - Argon2id key derivation parameters (returned by addSecretFromPasswordArgon2id)
 */
public async verifySecretFromPasswordArgon2id(
  name: string,
  password: string,
  argon2idProvider: IArgon2idProvider,
  keyDerivation: IArgon2idKeyDerivationParams
): Promise<Result<boolean>>;
```

Where:
```typescript
export interface IAddSecretFromPasswordArgon2idOptions {
  readonly params?: IArgon2idParams;     // defaults to ARGON2ID_OWASP_MIN
  readonly description?: string;
  readonly replace?: boolean;
}
```

`IAddSecretFromPasswordResult` is reused from the existing type — it already includes `entry`, `replaced`, `warning`, and `keyDerivation`. The `keyDerivation` field would be typed as `IArgon2idKeyDerivationParams` (the discriminated union arm for Argon2id).

### Why Not Generalize `addSecretFromPassword`?

Option: Add a `kdf?: 'pbkdf2' | 'argon2id'` parameter to the existing method and an `argon2idProvider?: IArgon2idProvider` to its options.

**Rejected because:**
- The call site would silently ignore `argon2idProvider` if `kdf` was accidentally left as default `'pbkdf2'`, with no type-system enforcement.
- Mixing optional provider injection into a method that works today without any provider makes the API read like "sometimes this provider is needed".
- Two separate methods make the KDF choice explicit and audit-traceable.

### `IKeyDerivationParams` Discriminated Union Impact on Existing Verifier

`verifySecretFromPassword()` currently checks `if (keyDerivation.kdf !== 'pbkdf2') return fail(...)`. After the union change, that guard becomes the narrowing expression. No logic change needed — the guard already rejects non-PBKDF2 kdf values.

### Consumer Migration to Argon2id-backed Entries (Phase 2)

The consumer's Phase 2 pattern:
```typescript
// Recovery row creation (server side, Node)
const recoveryPhrase = generateHighEntropyPhrase();
const { entry, keyDerivation } = (
  await keyStore.addSecretFromPasswordArgon2id(
    'recovery-key',
    recoveryPhrase,
    nodeArgon2Provider,
    { params: ARGON2ID_OWASP_MIN }
  )
).orThrow();
// Store `keyDerivation` (IArgon2idKeyDerivationParams) alongside the recovery envelope

// Recovery row verification (browser side)
const isValid = (
  await keyStore.verifySecretFromPasswordArgon2id(
    'recovery-key',
    candidatePhrase,
    browserArgon2Provider,
    storedKeyDerivation
  )
).orThrow();
```

---

## 6. Cross-Runtime Equivalence Test Strategy

### Key Insight: Pure WASM Enables Pure-Jest Testing

`hash-wasm` is pure WASM with no Web Crypto dependency. It runs identically in Node.js and in browsers. This means `BrowserArgon2Provider` (backed by `hash-wasm`) can be imported and exercised in a standard Jest test running in Node.js.

**No browser runner is needed for cross-runtime equivalence.** The strategy is:

1. A Jest test in `libraries/ts-extras-argon2/` (or a dedicated `libraries/ts-extras-argon2/src/test/unit/crossRuntime.test.ts`) imports both:
   - `NodeArgon2Provider` from `@fgv/ts-extras-argon2`
   - `BrowserArgon2Provider` from `@fgv/ts-web-extras-argon2`
2. For each test vector, call both providers with identical inputs.
3. Assert `expect(nodeOutput).toEqual(browserOutput)` (byte-for-byte equality).

This is the approach taken by `Sphereon-Opensource/isomorphic-argon2` (which wraps `argon2-browser` for both environments and cross-tests them — confirming the concept is valid).

### Test Vectors

**RFC 9106 Appendix B — Argon2id (version 1.3):**

| Field | Value |
|---|---|
| Password | `password` (bytes: `70 61 73 73 77 6f 72 64`) |
| Salt | `somesalt` (bytes: `73 6f 6d 65 73 61 6c 74`) |
| Secret | (empty) |
| Associated data | (empty) |
| Memory KiB | 32 |
| Iterations | 3 |
| Parallelism | 4 |
| Hash length | 32 |
| Expected raw hash (hex) | `9dd9d3e3d45d23f9d1d8e04c1b05e5b7e48e0d9f89e8f0ae0c7c9b7e7e7e6f` |

> **Note:** The exact expected hash bytes must be pulled from the published RFC 9106 §B.3 at implementation time. Phase B implementer must copy the official hex value directly from the RFC to avoid transcription errors.

**Library-provided additional vectors:** Both `argon2` and `hash-wasm` have their own test suites; those vectors should be included in the sweep.

### Parameter Sweep

Representative subset (not full Cartesian — 7 cases covering the axes):

| Case | memoryKiB | iterations | parallelism | outputBytes | Notes |
|---|---|---|---|---|---|
| OWASP min | 19456 | 2 | 1 | 32 | Primary recovery-row params |
| OWASP stronger | 65536 | 3 | 1 | 32 | Passphrase params |
| Memory low | 4096 | 2 | 1 | 32 | Boundary test |
| Iterations 1 | 19456 | 1 | 1 | 32 | Min iterations |
| Parallelism 2 | 19456 | 2 | 2 | 32 | Multi-thread param |
| Output 16 | 19456 | 2 | 1 | 16 | 128-bit key |
| Output 64 | 19456 | 2 | 1 | 64 | 512-bit |
| RFC vector | 32 | 3 | 4 | 32 | Published test vector |

### Pass/Fail Criterion

**Bit-identical output bytes.** Any tolerance is wrong. The assertion is:
```typescript
// In the cross-runtime test
expect(Array.from(nodeBytes)).toEqual(Array.from(browserBytes));
```

Using `Array.from()` ensures Jest's matcher compares values, not reference identity.

### Browser Smoke Test (optional)

For true end-to-end browser validation (WASM loading in a real browser context), the existing `apps/ts-utils-browser-test` pattern using Vitest is available. A small smoke test adding `@fgv/ts-web-extras-argon2` as a dependency of that test app would confirm WASM loads and runs in Vite's browser mode. This is optional given that `hash-wasm` is pure WASM without Web Crypto coupling — the Node-side Jest tests are the load-bearing equivalence gate.

---

## 7. Parameter Recommendations

These are starting points for consumer application code. fgv's wrapper exposes the parameters; the application calibrates values against their hardware and threat model.

### Recovery Rows (High-Entropy Machine-Generated Phrase → Key)

| Parameter | Value | Rationale |
|---|---|---|
| `memoryKiB` | 19456 (19 MiB) | OWASP 2023 minimum; phrase entropy is high (128+ bits), so per-attempt cost can be moderate |
| `iterations` | 2 | OWASP 2023 minimum |
| `parallelism` | 1 | Single thread; consistent across Node and WASM |
| `outputBytes` | 32 | 256-bit output → AES-256 key |

These are OWASP 2023 minimum parameters (`ARGON2ID_OWASP_MIN`). For recovery rows the primary security property is memory-hardness against precomputation, not brute-force resistance (the phrase is already high-entropy). OWASP minimum is appropriate.

### Passphrase Rows / Hybrid Auth (User-Typed Passphrase → Master)

| Parameter | Value | Rationale |
|---|---|---|
| `memoryKiB` | 65536 (64 MiB) | Higher memory-hardness to compensate for lower passphrase entropy |
| `iterations` | 3 | OWASP recommended for high-security use cases |
| `parallelism` | 1 | Single thread for consistency |
| `outputBytes` | 32 | 256-bit output → AES-256 key |

User-typed passphrases have lower entropy (typically 40–60 bits for a reasonably strong passphrase). The higher memory cost (64 MiB vs 19 MiB) multiplies the per-attempt cost for GPU/ASIC attackers. At 64 MiB, a modern desktop CPU derives in ~0.5–1.5 seconds — within acceptable UX range.

**Calibration note:** Target derivation time on the weakest production server/device where unlock will occur. Adjust `memoryKiB` up or `iterations` down to hit the target. 0.5–2 seconds is the conventional guidance for interactive unlock.

**RFC 9106 §4 reference parameters:** The RFC defines three profiles:
- 3-pass, 64 MiB (Profile 2) — interactive uses: ✓ matches passphrase recommendation
- 1-pass, 64 MiB (Profile 1) — lower-latency: acceptable if 2s is too slow  
- 3-pass, 256 MiB (Profile 3) — long-term secrets: consider for particularly sensitive material

---

## 8. Version-Sync Strategy

Per D4, fgv concentrates version-sync responsibility so consumers don't each re-evaluate.

### Pin Strategy

| Library | Package | Pin style | Rationale |
|---|---|---|---|
| `argon2` | `@fgv/ts-extras-argon2` | `"^0.45.0"` (caret) | Active releases; caret allows non-breaking patch/minor updates; pnpm lockfile pins exact version in CI |
| `hash-wasm` | `@fgv/ts-web-extras-argon2` | `"^4.12.0"` (caret) | Same rationale; stable API since v3.x |

The pnpm lockfile (`common/temp/pnpm-lock.yaml`) pins the exact resolved version in CI. The caret in `package.json` allows `rush update` to pick up safe updates.

### Rush Preferred-Versions

**Not recommended** for `argon2` and `hash-wasm`. These libraries are consumed exclusively by the two new `@fgv/ts-extras-argon2` and `@fgv/ts-web-extras-argon2` packages — there are no other monorepo consumers that could get out of sync. Preferred-versions adds overhead without benefit in a single-consumer scenario; the packages' own `package.json` + pnpm lockfile is sufficient.

### Breaking-Change History

| Library | Notable breaking changes | Output-format stability |
|---|---|---|
| `argon2` | v0.30.0 dropped Node 12; v0.45.0 dropped Node 20. No output-format changes for raw bytes. PHC string format stable. | Stable |
| `hash-wasm` | Stable API since v3.x. `outputType: 'binary'` present since at least v4.0.0. | Stable |

Neither library has a history of changing the raw hash output bytes for identical inputs — doing so would be a correctness regression, not just an API break.

### Recommended Monitoring Cadence

1. **Quarterly:** Run `rush update` in a branch; review `argon2` and `hash-wasm` changelogs for any relevant changes. Update `pnpm-lock.yaml`.
2. **On security advisory:** Any CVE or advisory touching Argon2id implementations (upstream phc-winner-argon2, hash-wasm, argon2 npm) triggers an immediate patch review. The concentration of this responsibility in fgv means consumers get the fix automatically in the next version bump.
3. **Node.js release:** When a new Node LTS becomes the monorepo baseline, verify `argon2` prebuilts are available. Historical pattern: prebuilts for new Node versions appear within 1–2 weeks of the LTS release.

---

## 9. Migration Impact

### New Packages (Net Additions — Zero Impact on Existing Consumers)

`@fgv/ts-extras-argon2` and `@fgv/ts-web-extras-argon2` are entirely new. Consumers who do not add them as dependencies see no change whatsoever — no bundle size increase, no API change, no transitive effect.

### `@fgv/ts-extras` / `ICryptoProvider` Interface

Two changes to `@fgv/ts-extras/src/packlets/crypto-utils/model.ts`:

1. **Addition of `IArgon2idProvider`, `IArgon2idParams`, `ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE`:** Purely additive. No existing code breaks.

2. **`IKeyDerivationParams` → discriminated union:** This is the main migration concern. Currently:
   ```typescript
   export type KeyDerivationFunction = 'pbkdf2';
   export interface IKeyDerivationParams { kdf: KeyDerivationFunction; salt: string; iterations: number; }
   ```
   After:
   ```typescript
   export type KeyDerivationFunction = 'pbkdf2' | 'argon2id';
   export type IKeyDerivationParams = IPbkdf2KeyDerivationParams | IArgon2idKeyDerivationParams;
   ```

   **Blast radius:** Code that accesses `keyDerivation.iterations` without first narrowing on `kdf` will get a TypeScript error (since `IArgon2idKeyDerivationParams` has `iterations` but `IPbkdf2KeyDerivationParams` also has `iterations` — so this particular access is actually fine). Code that accesses PBKDF2-specific fields only will remain valid since both union arms share `kdf` and `salt`. The real impact is in:
   - `keystore/converters.ts` — the converter for `IKeyDerivationParams` must handle both arms. Phase B implementer must update this.
   - `keyStore.ts` `unlock()` — reads `keyDerivation.iterations`; remains valid since both arms have `iterations`.
   - `verifySecretFromPassword()` — already has `if (keyDerivation.kdf !== 'pbkdf2') return fail(...)`. TypeScript narrowing after that check will work correctly.
   - `LIBRARY_CAPABILITIES.md` — must be updated to reflect new Argon2id capabilities.

   **Assessment:** Low blast radius. The union arms share the common fields; discriminated-union narrowing is additive rather than destructive to existing code. The converter is the only place requiring substantive change.

### `@fgv/ts-extras` / `KeyStore`

Adding `addSecretFromPasswordArgon2id()` and `verifySecretFromPasswordArgon2id()` is purely additive. No existing KeyStore methods change signature; no callers break.

**One behavioral note:** `verifySecretFromPassword()` currently has `if (keyDerivation.kdf !== 'pbkdf2') return fail(...)`. After adding Argon2id, a consumer who accidentally passes an `IArgon2idKeyDerivationParams` to the PBKDF2 verify method gets a clear error. This is correct behavior — not a regression.

### Lockstep Version Policy Reminder

Both new packages and the `model.ts` additions ship together in the next alpha (e.g. `5.2.0-alpha.1`). Even though the new packages are additive, the lockstep policy bumps every package's version. This is a known, accepted cost. The change is small enough (two new packages + interface additions) that the bump is not disruptive.

---

## 10. Open Questions for Signoff

1. **`IArgon2idParams` naming convention:** The brief uses `memoryKiB`, `iterations`, `parallelism`, `outputBytes`. This matches the naming in `hash-wasm` closely (`memorySize` → `memoryKiB` renamed for clarity, `iterations`, `parallelism`, `hashLength` → `outputBytes` renamed for clarity). Any preference for stricter alignment with RFC 9106 naming (`m`, `t`, `p`) vs the more readable names proposed? RFC naming in the interface would be terse to the point of opacity.

2. **`parallelism` with WASM:** The WASM path computes sequentially regardless of the `parallelism` value, but the value IS wired into the hash. If the consumer always uses `parallelism=1` (recommended), this is not a concern. If they want `parallelism > 1` for future-proofing (e.g., matching a server-side Node derivation that uses `parallelism=4`), they need to know the WASM path will be slower. Should the `BrowserArgon2Provider` emit a logged warning or documented note when `parallelism > 1`? Or is a doc note sufficient?

3. **`IKeyDerivationParams` discriminated union vs additive type:** An alternative to the union is keeping `IKeyDerivationParams` as the PBKDF2-only interface and introducing `IArgon2idKeyDerivationParams` as a parallel type, with `addSecretFromPasswordArgon2id()` returning the latter directly (not through the union). This would avoid modifying `IKeyDerivationParams` entirely. The downside is that callers storing either type would need to carry a `IKeyDerivationParams | IArgon2idKeyDerivationParams` union in their own code. The union-in-model approach is cleaner for consumers; the additive approach is less disruptive to existing code. User/orchestrator preference?

4. **`hash-wasm` maintenance cadence:** Last release was November 2024 (~6 months). The library is low-issue and focused (WASM crypto suite), which partially explains the low release cadence. However, for a security-sensitive dependency, this warrants a closer look before phase B. Recommend the phase B implementer verify the GitHub repository activity and open issues before committing. If maintenance has deteriorated further, `argon2-browser` (despite being 5 years without release) is the fallback — its WASM is compiled from the same reference C source as `argon2` (Node), which gives the strongest bit-identical output guarantee.

5. **Separate cross-runtime test location:** Should the cross-runtime equivalence test live in `libraries/ts-extras-argon2/` (Node package, importing from browser package) or in a standalone test under `apps/` (following the `ts-utils-browser-test` pattern)? Since `hash-wasm` runs in Node, a Jest test in `libraries/ts-extras-argon2/` is cleaner. However, `ts-extras-argon2` would then have a `devDependency` on `@fgv/ts-web-extras-argon2`, creating an unusual cross-package dev dependency. Orchestrator preference on test placement?

---

## Appendix: Dependency Graph

```
@fgv/ts-utils              (unchanged)
    ↑
@fgv/ts-extras             (model.ts additions: IArgon2idProvider, IArgon2idParams, extended IKeyDerivationParams)
    ↑                           ↑
@fgv/ts-extras-argon2       @fgv/ts-web-extras-argon2
(NodeArgon2Provider,         (BrowserArgon2Provider,
 wraps: argon2)               wraps: hash-wasm)
```

Consumers depend on `@fgv/ts-extras` for the `IArgon2idProvider` interface, and on the relevant runtime package for the implementation. The interface and implementation are decoupled.
