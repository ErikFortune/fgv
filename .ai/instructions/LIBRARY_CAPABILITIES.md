# FGV Library Capabilities Quick Reference

**Purpose:** Before writing new utility code, scan this guide. If a capability is listed here, use the existing library — do not reimplement it. Each entry links to the source on the `release` branch.

**Repository:** https://github.com/ErikFortune/fgv (release branch)

---

## How to use this guide

1. Find the capability area you need (parsing, validation, JSON, file trees, etc.).
2. Check the listed package/packlet for an existing implementation.
3. Follow the link to read the actual exports/API before coding.
4. Add the package via `rush add -p <name>` (see `MONOREPO_GUIDELINES.md`).

If you cannot find what you need here, ask before adding a new dependency or rolling your own.

---

## Foundational

### `@fgv/ts-utils` — core primitives
[libraries/ts-utils](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils)

| Packlet | Use for |
|---|---|
| [`base`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils/src/packlets/base) | `Result<T>` (`succeed`/`fail`/`captureResult`), `mapResults`/`mapSuccess`/`mapFailures`/`allSucceed`, `MessageAggregator`, branded types (`Brand<T>`), normalization helpers, `generateUuid()` / `Uuid` / `isValidUuid` (cross-runtime UUIDv4 via `globalThis.crypto.randomUUID`). **Always use `Result<T>` for fallible ops.** |
| [`conversion`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils/src/packlets/conversion) | `Converters.{string,number,boolean,object,arrayOf,enumeratedValue,optionalField,...}` for transforming/parsing untyped input into typed values. **Use instead of manual `typeof` checks + casts.** |
| [`validation`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils/src/packlets/validation) | `Validators.{object,arrayOf,isA,oneOf,...}` for in-place validation of class instances or already-constructed objects. |
| [`collections`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils/src/packlets/collections) | `ResultMap`, `ValidatingResultMap`, `Collector`, `ConvertingCollector`, `ValidatingCollector`, `KeyValueConverters`. **Result-friendly:** operations return `Result<T>` so they drop directly into `.onSuccess` chains. Use instead of raw `Map`/`Record` when keys/values need validation. |
| [`hash`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils/src/packlets/hash) | `Crc32Normalizer`, `HashingNormalizer` — deterministic hashing/normalization of arbitrary objects. `Normalizer.canonicalize(value)` — RFC 8785 canonical JSON serialization: sorts object keys lexicographically (not numerically), emits directly to string (bypasses JS engine integer-key reordering). Available on `HashingNormalizer`, `Crc32Normalizer`, or any `Normalizer` subclass. Use for stable JSON fingerprinting, signing, or any protocol requiring byte-identical canonical form. |
| [`logging`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils/src/packlets/logging) | `Logger`, `LogReporter` — Result-friendly logger that can be inserted into a Result chain to log success/failure values without breaking the chain. |

### `@fgv/ts-utils-jest` — Result-aware Jest matchers
[libraries/ts-utils-jest](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils-jest)

`toSucceed`, `toFail`, `toSucceedWith`, `toFailWith`, `toSucceedAndSatisfy`, `toFailWithDetail`, `toSucceedAndMatchSnapshot`, plus `toFailTest*` for testing custom matchers. **Always use these in tests instead of `.orThrow()` + assertions.** Includes ANSI color stripping for stable cross-env snapshots.

---

## JSON

### `@fgv/ts-json-base` — types, validation, file I/O
[libraries/ts-json-base](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json-base)

| Packlet | Use for |
|---|---|
| [`json`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json-base/src/packlets/json) | `JsonValue`/`JsonObject`/`JsonArray`/`JsonPrimitive` type definitions. |
| [`json-compatible`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json-base/src/packlets/json-compatible) | `JsonCompatibleType<T>` — compile-time check that a typed interface is JSON-serializable. |
| [`converters`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json-base/src/packlets/converters), [`validators`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json-base/src/packlets/validators) | JSON-shaped converters/validators (e.g. `Converters.jsonObject`, `Converters.jsonValue`, `Converters.stringifiedJson` — parses a JSON string then optionally validates with an inner `Converter<T>` or `Validator<T>`). |
| [`json-file`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json-base/src/packlets/json-file) | `JsonFsHelper`, `JsonTreeHelper` — load/save JSON files, walk JSON trees. |
| [`file-tree`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json-base/src/packlets/file-tree) | `FileTree`, `FsTree`, in-memory tree — abstract directory/file traversal that works across Node/browser/zip/in-memory backends. **Default to `FileTree` for any file/directory access — only fall back to raw `fs` if you have a concrete reason it cannot work.** |

### `@fgv/ts-json` — templating, conditionals, diff, edit
[libraries/ts-json](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json)

| Packlet | Use for |
|---|---|
| [`editor`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json/src/packlets/editor) | `JsonEditor` — deep merge JSON objects in-place, clone, with rule plugins. |
| [`converters`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json/src/packlets/converters) | `JsonConverter` with mustache templating + conditional property syntax (`?key`, `?[match]`, `?default`) and multi-value expansion. |
| [`context`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json/src/packlets/context) | `JsonContext`, `CompositeJsonMap` — context objects fed into the templating converter. |
| [`diff`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json/src/packlets/diff) | `detailedDiff`, `threeWayDiff` — structural JSON diffs. |

---

## Strings, language, locale

### `@fgv/ts-bcp47` — BCP-47 language tags
[libraries/ts-bcp47](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-bcp47)

`Bcp47.tag(...)`, `Bcp47.similarity(...)`, normalization to canonical/preferred form, IANA registry access (`iana` packlet), UN M.49 region data (`unsd` packlet). **Use this instead of regex-parsing language tags or hand-rolling locale fallback.** The language-distance/similarity scoring is designed to plug directly into `@fgv/ts-res` qualifier matching — prefer it over a custom locale-match function if you are working with ts-res.

---

## Resource management & i18n

### `@fgv/ts-res` — multidimensional resources
[libraries/ts-res](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res)

A full conditional-resource runtime: qualifier types, qualifiers, conditions, decisions, candidates, resources, bundles, zip archive packaging. Use when you need context-aware resource resolution (i18n, theming, A/B variants, environment overrides). Key packlets: [`runtime`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/runtime), [`bundle`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/bundle), [`config`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/config), [`import`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/import), [`resource-json`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/resource-json). See the project's own [CLAUDE.md](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/CLAUDE.md) for architecture details.

### `@fgv/ts-res-ui-components` — React UI for ts-res
[libraries/ts-res-ui-components](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res-ui-components)

`ResourceOrchestrator`, `ObservabilityProvider`, viewers/editors, import workflows (directory, zip, bundle). Tailwind + Heroicons. **Use this before building custom React UI for browsing/editing ts-res resources.**

### `@fgv/ts-prompt-assist` — conditional prompt resolution
[libraries/ts-prompt-assist](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-prompt-assist)

ts-res-driven prompt authoring, organisation, and resolution for LLM workflows. Built on `@fgv/ts-res` (qualifier-conditional candidate selection), `@fgv/ts-extras` (`MustacheTemplate.create(template, { escape: 'none' })` for verbatim render; `AiAssist.fencedStringifiedJson` for fence-tolerant JSON output parsing; `Yaml.yamlConverter` for descriptor / bindings / qualifier-config loading), and `@fgv/ts-json-base` (`FileTree` for storage). **One YAML file per `(scope, prompt-id)`** holds the descriptor + all candidates; scope-level `_bindings.yaml` carries slot bindings; root-level `_qualifiers.yaml` carries ts-res `IQualifierDecl[]`. Key exports: **`PromptLibrary.create`** (factory; takes `store`, `qualifiers`, optional `registry` / `safetyPolicy` / `cacheListener` / `logger`); **`PromptLibrary.resolve`** (chain-walks scopes, runs ts-res candidate selection on the supplied qualifier context, merges scope-level bindings cross-scope honouring `enforced` locks, recursively resolves resource bindings with RFC 8785 cycle-detection + depth cap, renders via Mustache with `escape: 'none'`, returns body + full `IPromptResolveTrace`); **`PromptLibrary.resolveJsonOutput<K>(req, rawOutput, expectedKind)`** (JSON pipeline strips fences → `JSON.parse` → typed Converter dispatched by `(id, kind)` → `outputValidations[]` chain narrowed by `value.kind`; runtime-verifies the descriptor's `output.kind === 'json'` AND that the descriptor's converter is registered to produce `expectedKind` before running the pipeline, so the return type `Extract<TResponse, { kind: K }>` is runtime-evidenced rather than caller-asserted); **`PromptLibrary.resolveFreeTextOutput(req, rawOutput)`** (runtime-verifies the descriptor's `output.kind === 'free-text'` and returns the raw output verbatim as `Result<string>` — no `TResponse` involvement); **`PromptLibrary.describe`** (descriptor lookup across scopes with cross-scope structural-equality check). Storage: **`FileTreePromptStore`** (read-only at v0.1; works against `FsTree` / in-memory / zip / browser FSA File Tree); **`PromptStoreFixture.build`** (seeds an in-memory FileTree from authored records — the canonical test/demo fixture; **no standalone `InMemoryPromptStore`**). Registry: **`PromptRegistry<TResponse>`** with three typed sub-registries (`converters` / `slotKinds` / `outputValidations`), parameterized by the consumer's response union (`TResponse extends { kind: string }`) so the JSON output pipeline flows the narrow Converter type end-to-end. Safety: **`IPromptSafetyPolicy`** carries `defaultMaxLength`, `screeners` (an ordered `IScreener[]` — pluggable, async, per-slot-value pre-render screening; each `screen(ctx)` returns `Promise<Result<ISafeguardFinding[]>>`), and `antiJailbreakPreface` (post-render seam — consumer supplies the framing). Screeners run sequentially in declaration order; a finding with `disposition: 'reject'` (or a screener returning `fail()`) fails the resolve and short-circuits the rest, while `'warn'` / `'info'` findings surface on `trace.safeguardFindings`. Findings carry open `kind`s (`SafeguardFindingKind = BuiltInFindingKind | (string & {})`), optional structured `metadata`, and `screener` attribution. **`createPatternScreener({ patterns, onMatch, screenedSources?, name? })`** is the built-in regex injection screener (reproduces the pre-pluggable semantics including `lastIndex` reset between values; `screenedSources` is the screener-owned source allowlist — omit it to screen every sourced slot). Custom screeners (ML classifiers, remote calls) implement `IScreener` directly. The descriptor-level `safeguards.skipInjectionScreening` still bypasses all screeners for a prompt; `defaultMaxLength` and `antiJailbreakPreface` stay policy-level primitives (not screeners). Branded ids: `PromptId` rejects `'::'`; `SlotName` matches the Mustache name production. **Use this for any LLM prompt that needs to vary on context (tenant, language, tone, region) or compose partial fragments over a shared base. Do not roll your own Mustache renderer for LLM prompts — the verbatim render + double-brace rejection are load-bearing.** v0.1 is **out of scope** for: write API (`put` / `putBindings` / `delete`), change notification (`watch`), LLM-call orchestration, editor UX, default anti-jailbreak content, free-text output validators. See the [README](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-prompt-assist#readme) for the quick-start.

---

## Specialized utilities

### `@fgv/ts-extras` — Node-flavored extras
[libraries/ts-extras](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras)

| Packlet | Use for |
|---|---|
| [`crypto-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/crypto-utils) | Cross-runtime crypto surface. **`ICryptoProvider`** interface with operations: `encrypt`/`decrypt` (AES-256-GCM), `deriveKey` (PBKDF2), `sha256`, `generateRandomBytes`, `generateUuid`, `toBase64`/`fromBase64`, `generateKeyPair`/`exportPublicKeyJwk`/`importPublicKeyJwk` (asymmetric keypairs), `wrapBytes`/`unwrapBytes` (ECIES), `sign`/`verify` (digital signatures — algorithm inferred from key; supports Ed25519 and ECDSA-P256), `hmacSha256`/`verifyHmacSha256` (HMAC-SHA256 MAC computation and constant-time verification), `timingSafeEqual` (constant-time byte comparison — browser impl uses XOR-walk accumulator, Node impl delegates to `crypto.timingSafeEqual`); **`NodeCryptoProvider`** (Node implementation — pair with `BrowserCryptoProvider` from `ts-web-extras` on the browser side). **`KeyPairAlgorithm`** union: `'ecdsa-p256'`, `'rsa-oaep-2048'`, `'ecdh-p256'`, `'ed25519'`, `'x25519'` (X25519 Diffie-Hellman key agreement — use `deriveBits`/`deriveKey` to produce a shared secret). **`IArgon2idProvider`** / **`IArgon2idParams`** — interface for Argon2id key derivation; **`ARGON2ID_OWASP_MIN`** and **`ARGON2ID_PASSPHRASE`** — OWASP-recommended parameter presets. Obtain an implementation from `@fgv/ts-extras-argon2` (Node) or `@fgv/ts-web-extras-argon2` (browser/WASM). **`IKeyDerivationParams`** — discriminated union (`'pbkdf2'` | `'argon2id'`) for serializable key-derivation metadata. **`KeyStore`** — **the answer for password hashing and key storage**: password-protected vault for symmetric keys, API keys, and asymmetric keypairs; `addSecretFromPassword` derives + stores a key from a password via PBKDF2; `verifySecretFromPassword` does constant-time verification; `addSecretFromPasswordArgon2id` / `verifySecretFromPasswordArgon2id` — same workflow via Argon2id (pass an `IArgon2idProvider`). Also supports `addSecret`, `addKeyPair`, lock/unlock/save/changePassword, with optional `IPrivateKeyStorage` backend for non-extractable private keys. **Multibase/SPKI helpers** (new): `exportPublicKeyAsMultibaseSpki`/`importPublicKeyFromMultibaseSpki` — export/import any `ICryptoProvider` public key as a multibase base64url-encoded SPKI blob (algorithm-agnostic, suitable for storage/transport); `multibaseBase64UrlEncode`/`multibaseBase64UrlDecode` — pure base64url helpers with the `'m'` multibase prefix. `DirectEncryptionProvider`, `createEncryptedFile`/`decryptFile`/`tryDecryptFile` for one-off encrypted JSON artifacts. **Use this for any password hashing, password-derived key, encrypted-at-rest artifact, named-key lookup, public-key export, digital signing/verification, or constant-time byte comparison; do not roll your own PBKDF2 / timing-safe compare / base64url.** |
| [`crypto-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/crypto-utils) | Cross-runtime crypto surface. **`ICryptoProvider`** interface with operations: `encrypt`/`decrypt` (AES-256-GCM), `deriveKey` (PBKDF2), `sha256`, `generateRandomBytes`, `generateUuid`, `toBase64`/`fromBase64`, `generateKeyPair`/`exportPublicKeyJwk`/`importPublicKeyJwk` (asymmetric keypairs), `wrapBytes`/`unwrapBytes` (ECIES), `sign`/`verify` (digital signatures — algorithm inferred from key; supports Ed25519 and ECDSA-P256), `hmacSha256`/`verifyHmacSha256` (HMAC-SHA256 MAC computation and constant-time verification), `timingSafeEqual` (constant-time byte comparison — browser impl uses XOR-walk accumulator, Node impl delegates to `crypto.timingSafeEqual`); **`NodeCryptoProvider`** (Node implementation — pair with `BrowserCryptoProvider` from `ts-web-extras` on the browser side). **`KeyPairAlgorithm`** union: `'ecdsa-p256'`, `'rsa-oaep-2048'`, `'ecdh-p256'`, `'ed25519'`, `'x25519'` (X25519 Diffie-Hellman key agreement — use `deriveBits`/`deriveKey` to produce a shared secret). **`KeyStore`** — **the answer for password hashing and key storage**: password-protected vault for symmetric keys, API keys, and asymmetric keypairs; `addSecretFromPassword` derives + stores a key from a password via PBKDF2; `verifySecretFromPassword` does constant-time verification. Also supports `addSecret`, `addKeyPair`, lock/unlock/save/changePassword, with optional `IPrivateKeyStorage` backend for non-extractable private keys. **Multibase/SPKI helpers** (new): `exportPublicKeyAsMultibaseSpki`/`importPublicKeyFromMultibaseSpki` — export/import any `ICryptoProvider` public key as a multibase base64url-encoded SPKI blob (algorithm-agnostic, suitable for storage/transport); `multibaseBase64UrlEncode`/`multibaseBase64UrlDecode` — pure base64url helpers with the `'m'` multibase prefix. `DirectEncryptionProvider`, `createEncryptedFile`/`decryptFile`/`tryDecryptFile` for one-off encrypted JSON artifacts. **`HpkeProvider`** — HPKE base mode (RFC 9180): `DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM`; `create(subtle)` factory; `sealBase(recipientPublicKey, info, aad, plaintext)` / `openBase(recipientPrivateKey, info, aad, enc, ciphertext)`; `HpkeProvider.encodeEnvelope` / `decodeEnvelope` for wire transport; `hkdf(secret, salt, info, length)` for standalone HKDF-SHA256. Works identically on Node.js 20+ and modern browsers via `SubtleCrypto` injection; re-exported from `@fgv/ts-web-extras` for browser callers. **Runtime requirements**: Node 20+; Chrome 113+, Safari 16.4+, Firefox 118+ (X25519 in Web Crypto). **Use this for any hybrid public-key encryption; do not roll your own KEM or HKDF.** **Use this for any password hashing, password-derived key, encrypted-at-rest artifact, named-key lookup, public-key export, digital signing/verification, or constant-time byte comparison; do not roll your own PBKDF2 / timing-safe compare / base64url.** |
| [`experimental`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/experimental) | `ExtendedArray<T>`, `RangeOf<T>` (open/closed orderable ranges), `Formattable<T>` (mustache-printable wrappers). |
| [`csv`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/csv) | CSV parse/format helpers (file + in-memory). |
| [`record-jar`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/record-jar) | Record-jar (RFC 5646 appendix-style) parsing. |
| [`hash`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/hash) | `Md5Normalizer` (Node + browser variants). |
| [`zip-file-tree`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/zip-file-tree) | `FileTree` accessors backed by a ZIP archive. |
| [`conversion`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/conversion) | Extra converters beyond ts-utils. |
| [`ai-assist`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/ai-assist) | LLM provider client + JSON-tolerant response handling. `callProviderCompletion`/`callProviderCompletionStream` (OpenAI, xAI, Anthropic, Gemini), provider/model registry, `AiPrompt`. **For JSON-shaped completions use `generateJsonCompletion<T>({ converter, ... })`** — it appends a smart "raw JSON only" prompt hint and runs the response through `fencedStringifiedJson`, which strips Markdown fences, leading preamble, and trailing prose before validating with the caller's `Converter<T>` or `Validator<T>`. The bare `extractJsonText` helper is exported for callers that just need wrapper-stripping; `fencedStringifiedJson({ extractor, inner })` is the extension point for custom extractors. **Don't reimplement fence-stripping in consumers.** **For image generation use `callProviderImageGeneration`/`callProxiedImageGeneration`** — supports OpenAI DALL-E 3 / gpt-image-1 (`openai-images`), xAI grok-imagine generations (`xai-images`) and edits (`xai-images-edits`), Google Imagen predict endpoint (`gemini-imagen`), and Gemini image-output via generateContent (`gemini-image-out`). The layered options system provides top-level keys (`size`, `quality`, `seed`, `count`) alongside per-provider `models` blocks for provider-specific params (e.g. `{ provider: 'openai', family: 'gpt-image', config: { outputFormat, background, moderation, outputCompression } }`). Provider capability is declared on `IAiProviderDescriptor.imageGeneration: IAiImageModelCapability[]`; `imageOptionsResolver` translates the layered options into a wire-ready `IResolvedImageOptions`. |

### `@fgv/ts-extras-argon2` — Node Argon2id provider
[libraries/ts-extras-argon2](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-argon2)

`NodeArgon2Provider` — Node.js implementation of `IArgon2idProvider` backed by the `argon2` (kelektiv) native binding. Use `NodeArgon2Provider.create()` and pass the instance to `KeyStore.addSecretFromPasswordArgon2id` / `verifySecretFromPasswordArgon2id`. Also re-exports `CryptoUtils` from `@fgv/ts-extras` for consumer convenience. **Node-only; for browser use `@fgv/ts-web-extras-argon2` instead.**

### `@fgv/ts-web-extras-argon2` — Browser/WASM Argon2id provider
[libraries/ts-web-extras-argon2](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras-argon2)

`BrowserArgon2Provider` — pure-WASM implementation of `IArgon2idProvider` backed by `hash-wasm`. No Web Crypto dependency; runs identically in browsers and Node.js. The WASM engine does not spawn threads — `parallelism` affects the hash value but execution is always sequential; recommend `parallelism: 1` for browser use unless you need server/client key-derivation agreement with a server that uses a different parallelism. **Output is byte-identical to `NodeArgon2Provider` for the same inputs and parameters**, verified by the cross-runtime test suite in `ts-extras-argon2`.

### `@fgv/ts-web-extras` — browser-only utilities
[libraries/ts-web-extras](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras)

| Packlet | Use for |
|---|---|
| [`crypto-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/crypto-utils) | **`BrowserCryptoProvider`** — Web Crypto API implementation of `ICryptoProvider` (the same interface `NodeCryptoProvider` implements). `BrowserHashProvider` for SHA-family hashing. **`HpkeProvider`** re-exported from `@fgv/ts-extras` for browser consumers; use `HpkeProvider.create(globalThis.crypto.subtle)` in the browser. **Use these to back `KeyStore`, `DirectEncryptionProvider`, or any other ts-extras `crypto-utils` consumer in the browser without touching `node:crypto`.** |
| [`file-tree`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/file-tree), [`file-api-types`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/file-api-types) | `FileTree` over the browser File System Access API — drop-in implementation of the same `FileTree` interface used by `FsTree` (Node) and `ZipFileTreeAccessors` (zip). |
| [`helpers`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/helpers) | Browser file-tree convenience helpers. |
| [`url-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/url-utils) | `urlParams` parsing/serialization. |

### `@fgv/ts-extras-webauthn` + `@fgv/ts-web-extras-webauthn` — WebAuthn Result boundary

[libraries/ts-extras-webauthn](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-webauthn)
[libraries/ts-web-extras-webauthn](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras-webauthn)

**These packages are a Result-integration boundary over `@simplewebauthn/server` and `@simplewebauthn/browser` — not an opinionated WebAuthn helper.** The upstream libraries are excellent; these packages add exactly one thing: converting `@simplewebauthn`'s throw-on-failure interface into `Promise<Result<T>>`.

**Six primitive operations. Nothing else.**

| Package | Function | Return |
|---|---|---|
| `@fgv/ts-extras-webauthn` | `generateRegistrationOptions(opts)` | `Promise<Result<PublicKeyCredentialCreationOptionsJSON>>` |
| `@fgv/ts-extras-webauthn` | `verifyRegistrationResponse(opts)` | `Promise<Result<VerifiedRegistrationResponse>>` |
| `@fgv/ts-extras-webauthn` | `generateAuthenticationOptions(opts)` | `Promise<Result<PublicKeyCredentialRequestOptionsJSON>>` |
| `@fgv/ts-extras-webauthn` | `verifyAuthenticationResponse(opts)` | `Promise<Result<VerifiedAuthenticationResponse>>` |
| `@fgv/ts-web-extras-webauthn` | `startRegistration(opts)` | `Promise<Result<RegistrationResponseJSON>>` |
| `@fgv/ts-web-extras-webauthn` | `startAuthentication(opts)` | `Promise<Result<AuthenticationResponseJSON>>` |

**Explicitly NOT in scope (these were considered and explicitly rejected):**
- Challenge generator helpers
- PRF salt helper / Uint8Array conversion helpers
- `browserAutofillInput` validator / `autocomplete` attribute helpers
- `WebAuthnCredential` builder from verification output
- Attestation policy presets
- Algorithm allowlist presets
- Challenge state management or challenge stores
- Session token issuance
- Registration or authentication ceremony orchestration
- Credential / user database abstractions

For anything not in the table above, **use `@simplewebauthn/server` or `@simplewebauthn/browser` directly** (with `captureAsyncResult` for your own Result wrapping). These packages are a thin boundary layer; build your opinionated ceremony orchestration on top.

**Version:** `^13.0.0` for both upstream packages.

---

### `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` — local transformers (HuggingFace) Result boundary

[libraries/ts-extras-transformers](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-transformers)
[libraries/ts-web-extras-transformers](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras-transformers)

**A Result-integration boundary over `@huggingface/transformers` (transformers.js) for running models locally — not an opinionated ML helper.** Like the WebAuthn pair, these add exactly one thing: thin `captureAsyncResult` wrappers that convert the upstream throw-on-failure calls into `Promise<Result<T>>`, with **no opinionated orchestration** (no pipeline cache, no model-download management, no device/quantization policy). The two packages expose an **identical surface**; pick the package at the composition root — Node uses the native ONNX backend, browser uses the WASM/WebGPU backend.

| Package | Function | Return |
|---|---|---|
| both | `loadPipeline(task, model?, options?)` | `Promise<Result<AllTasks[T]>>` (the upstream pipeline instance) |
| both | `classify(classifier, text, options?)` | `Promise<Result<TextClassificationOutput>>` (upstream default / top label unless `options.top_k` set) |
| both | `classifyAll(classifier, text, options?)` | `Promise<Result<TextClassificationOutput>>` — forces `top_k: null`, so the **full per-label vector** is returned; use when you compare every label against thresholds |
| both | `embed(extractor, text, options?)` | `Promise<Result<Tensor>>` — raw upstream `Tensor`, no pooling/normalisation applied (pass `{ pooling: 'mean', normalize: true }` via `options` for a sentence vector; extract a JS array with the Tensor's `.tolist()`) |

`Tensor`, `TextClassificationPipeline`, `TextClassificationOutput`, `FeatureExtractionPipeline`, `AllTasks`, `PipelineType` are re-exported from both packages. Get an extractor via `loadPipeline('feature-extraction', modelId)`, a classifier via `loadPipeline('text-classification', modelId)`.

**Explicitly NOT in scope:** pipeline cache / lifecycle / dispose, model registry or download management, GPU/CPU/WebGPU device-selection policy, quantization selection, embedding-store integration, classifier label allowlists, request batching, IndexedDB cache configuration. `generate` (text generation) is deferred until a concrete consumer needs it. For any of these, use `@huggingface/transformers` directly with `captureAsyncResult`.

**Consuming from a dual web/CLI bundle (load-bearing pattern):** when one module is reachable from a browser bundle, keep your reusable core **facade-agnostic** — take the facade function (`classify`/`classifyAll`/`embed`) as an injected parameter and import facade types as `import type` only (erased, so no runtime facade enters the bundle). Import the **browser** facade on the web path; load the **Node** facade on the CLI path via `import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers')` so its node-native deps never reach the browser graph. Validate the browser bundle with the real bundler (`webpack`/etc.) — type-check + jsdom tests do not exercise it. The `samples/testbed` `local-classifier-safety` and `local-embedding-search` scenarios are the reference consumers.

**Upstream:** `@huggingface/transformers` `~4.2.0` (a **peer dependency** of both packages — bring your own; `skipLibCheck` is required for its type definitions).

---

## Cross-runtime interfaces

Several core abstractions are defined once and have separate Node and browser implementations. Code against the interface; pick the implementation at the composition root.

| Interface | Node impl | Browser impl | Notes |
|---|---|---|---|
| `FileTree` (`@fgv/ts-json-base/file-tree`) | `FsTree` (`ts-json-base/file-tree`) | `FileTree` over File System Access API (`ts-web-extras/file-tree`) | Also: `ZipFileTreeAccessors` (`ts-extras/zip-file-tree`), in-memory tree (`ts-json-base/file-tree`). |
| `ICryptoProvider` (`@fgv/ts-extras/crypto-utils`) | `NodeCryptoProvider` (`ts-extras/crypto-utils`) | `BrowserCryptoProvider` (`ts-web-extras/crypto-utils`) | Same surface for AES-GCM, PBKDF2, SHA-256, random bytes, asymmetric key ops, ECIES wrap/unwrap, digital sign/verify, HMAC-SHA256, constant-time compare. |
| Hash normalizer | `Md5Normalizer` (`ts-extras/hash`), `Crc32Normalizer` (`ts-utils/hash`) | `Md5Normalizer.browser` (`ts-extras/hash`), `BrowserHashProvider` (`ts-web-extras/crypto-utils`) | `Crc32Normalizer` is pure JS and runs everywhere. |
| `IEncryptionProvider` (`@fgv/ts-extras/crypto-utils`) | `KeyStore`, `DirectEncryptionProvider` | same (back with `BrowserCryptoProvider`) | The provider is runtime-agnostic; only the underlying `ICryptoProvider` differs. |
| `IArgon2idProvider` (`@fgv/ts-extras/crypto-utils`) | `NodeArgon2Provider` (`ts-extras-argon2`) | `BrowserArgon2Provider` (`ts-web-extras-argon2`) | Pure-WASM browser impl is byte-identical to Node impl for same inputs. |
| Local transformers facade (`loadPipeline`/`classify`/`classifyAll`/`embed`) | `@fgv/ts-extras-transformers` (native ONNX) | `@fgv/ts-web-extras-transformers` (WASM/WebGPU) | Identical surface; thin `Result` boundary over `@huggingface/transformers`. In a browser bundle keep the core facade-agnostic and load the Node side via `webpackIgnore` dynamic import. |

---

## Decision shortcuts (start here)

- **Error handling / fallible function?** → `Result<T>` from `@fgv/ts-utils/base`. Never throw across module boundaries.
- **Validating untyped JSON / config input?** → `Converters.object` from `@fgv/ts-utils/conversion` or `@fgv/ts-json-base/converters`. Never write `typeof x === 'object' && ... as T`.
- **Validating an existing class instance?** → `Validators` from `@fgv/ts-utils/validation`.
- **Map/collection with validation?** → `ResultMap` / `Collector` family from `@fgv/ts-utils/collections`.
- **Aggregating multiple errors?** → `MessageAggregator` + `mapResults` from `@fgv/ts-utils/base`.
- **Reading files (Node, browser, or zip)?** → `FileTree` from `@fgv/ts-json-base/file-tree` (+ `ts-extras/zip-file-tree` or `ts-web-extras/file-tree` for the backend).
- **Loading/saving JSON files?** → `JsonFsHelper` from `@fgv/ts-json-base/json-file`.
- **JSON templating or conditional inclusion?** → `JsonConverter` from `@fgv/ts-json/converters`.
- **Deep-merging JSON?** → `JsonEditor.mergeObjectInPlace` from `@fgv/ts-json/editor`.
- **Diffing JSON?** → `@fgv/ts-json/diff`.
- **Branded ID type?** → `Brand<T>` from `@fgv/ts-utils/base`.
- **Generating a UUID?** → `generateUuid()` from `@fgv/ts-utils/base` for the call-site one-liner; `ICryptoProvider.generateUuid()` from `@fgv/ts-extras/crypto-utils` when you already hold a provider or want a deterministic test override. Never call `globalThis.crypto.randomUUID()` directly.
- **Hashing / canonical hash of an object?** → `Crc32Normalizer` (`ts-utils/hash`) or `Md5Normalizer` (`ts-extras/hash` / `ts-web-extras/crypto-utils`).
- **Symmetric encryption / decryption (AES-GCM)?** → `DirectEncryptionProvider` or `KeyStore.encryptByName` from `@fgv/ts-extras/crypto-utils`, backed by `NodeCryptoProvider` (Node) or `BrowserCryptoProvider` (browser).
- **Need AES-256-GCM encrypt/decrypt with a key you already hold (PBKDF2/HKDF output, raw bytes)?** → `ICryptoProvider.encrypt(plaintext, key)` / `ICryptoProvider.decrypt(data, key, iv, authTag)` from `@fgv/ts-extras/crypto-utils`. The higher-level `DirectEncryptionProvider` and `KeyStore.encryptByName` paths wrap these for named-key lookup workflows.
- **Password-protected vault for keys / API keys / keypairs?** → `KeyStore` from `@fgv/ts-extras/crypto-utils`. Use `addSecretFromPassword` to derive + store, `verifySecretFromPassword` for constant-time password verification.
- **PBKDF2 key derivation, ECIES wrap/unwrap, asymmetric keypairs (Ed25519, ECDSA-P256, ECDH-P256, RSA-OAEP, X25519)?** → `ICryptoProvider` from `@fgv/ts-extras/crypto-utils`. Never call `node:crypto` or `crypto.subtle` directly.
- **Need to hash / verify a password (PBKDF2)?** → `KeyStore.addSecretFromPassword` / `verifySecretFromPassword` from `@fgv/ts-extras/crypto-utils`. Never roll PBKDF2 directly.
- **Need to hash / verify a password with Argon2id?** → `KeyStore.addSecretFromPasswordArgon2id` / `verifySecretFromPasswordArgon2id` from `@fgv/ts-extras/crypto-utils`, passing a `NodeArgon2Provider` (`@fgv/ts-extras-argon2`) or `BrowserArgon2Provider` (`@fgv/ts-web-extras-argon2`). Use `ARGON2ID_OWASP_MIN` or `ARGON2ID_PASSPHRASE` presets from `CryptoUtils` for OWASP-compliant parameters.
- **Need an Argon2id provider (Node)?** → `NodeArgon2Provider.create()` from `@fgv/ts-extras-argon2`.
- **Need an Argon2id provider (browser / WASM)?** → `BrowserArgon2Provider.create()` from `@fgv/ts-web-extras-argon2`.
- **Need stable canonical JSON (RFC 8785)?** → `Normalizer.canonicalize()` (available on `HashingNormalizer`, `Crc32Normalizer`, or any `Normalizer` subclass) from `@fgv/ts-utils` hash packlet.
- **Need to encode/decode a public key as multibase SPKI?** → `exportPublicKeyAsMultibaseSpki(key, provider)` / `importPublicKeyFromMultibaseSpki(encoded, algorithm, provider)` from `@fgv/ts-extras/crypto-utils`. Pass the `ICryptoProvider` instance so the underlying SPKI export/import routes through the correct platform implementation.
- **Need hybrid public-key encryption (encrypt to a recipient's public key, one-shot)?** → `HpkeProvider` from `@fgv/ts-extras/crypto-utils` (Node) or `@fgv/ts-web-extras` (browser). `HpkeProvider.create(subtle).orThrow()` then `sealBase(recipientPub, info, aad, plaintext)` / `openBase(recipientPriv, info, aad, enc, ciphertext)`. Suite: DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM (RFC 9180 base mode). `info` is mandatory and must be application-specific context bytes — empty `info` provides no context binding. Use `HpkeProvider.encodeEnvelope` / `decodeEnvelope` for wire transport. Never roll your own KEM.
- **Need standalone HKDF-SHA256 key derivation?** → `HpkeProvider.create(subtle).orThrow().hkdf(secret, salt, info, length)` from `@fgv/ts-extras/crypto-utils` (or `@fgv/ts-web-extras` for browser). Raw RFC 5869 HKDF — unlabeled, suitable for application-level key derivation.
- **Need X25519 key agreement?** → `generateKeyPair('x25519', ...)` from `ICryptoProvider` (`@fgv/ts-extras/crypto-utils`) to produce the keypair; use `ICryptoProvider.exportPublicKeySpki` / `importPublicKeySpki` to exchange public keys. Raw `deriveBits` for the shared secret is not yet wrapped by `ICryptoProvider` — do not call `crypto.subtle` directly.
- **Need to sign data or verify a signature (Ed25519, ECDSA-P256)?** → `ICryptoProvider.sign(privateKey, data)` / `ICryptoProvider.verify(publicKey, signature, data)` from `@fgv/ts-extras/crypto-utils`. Algorithm is inferred from the key's `algorithm` property — generate keys with `generateKeyPair('ed25519', ...)` or `generateKeyPair('ecdsa-p256', ...)`. Both return `Promise<Result<...>>`.
- **Need HMAC-SHA256 authentication / MAC verification?** → `ICryptoProvider.hmacSha256(key, data)` / `ICryptoProvider.verifyHmacSha256(key, signature, data)` from `@fgv/ts-extras/crypto-utils`. The verify variant uses `timingSafeEqual` internally for constant-time comparison. Both return `Promise<Result<...>>`.
- **Need constant-time byte comparison?** → `ICryptoProvider.timingSafeEqual(a, b)` from `@fgv/ts-extras/crypto-utils`. Returns `boolean` directly (not `Result`). Node impl delegates to `crypto.timingSafeEqual`; browser impl uses XOR-walk accumulator. Never use `===` or loop with early return for security-sensitive comparisons.
- **Parsing a JSON-shaped string (with optional inner validation)?** → `Converters.stringifiedJson(inner?)` from `@fgv/ts-json-base/converters`.
- **Asking an LLM for JSON and getting a validated `T`?** → `AiAssist.generateJsonCompletion<T>({ converter, ... })` from `@fgv/ts-extras/ai-assist`. Tolerates Markdown fences, preamble, and trailing prose by default. Don't reimplement fence-stripping in consumers.
- **Stripping LLM Markdown fences from raw text?** → `AiAssist.extractJsonText` (default extractor) or `AiAssist.fencedStringifiedJson({ extractor, inner })` (extension point) from `@fgv/ts-extras/ai-assist`.
- **Generating images from an LLM provider?** → `AiAssist.callProviderImageGeneration({ descriptor, apiKey, params })` from `@fgv/ts-extras/ai-assist`. Use `callProxiedImageGeneration(proxyUrl, ...)` to route through a proxy when direct browser calls are CORS-restricted. Pass top-level options (`size`, `quality`, `seed`, `count`) and a `models` array for provider-specific config blocks.
- **Declaring image generation capability on a provider?** → Add `imageGeneration: IAiImageModelCapability[]` to `IAiProviderDescriptor`. Each capability entry carries `format` (`'openai-images' | 'xai-images' | 'xai-images-edits' | 'gemini-imagen' | 'gemini-image-out'`), `modelPrefix`, and optional flags like `acceptsImageReferenceInput`, `defaultOutputMimeType`, `outputParamStyle`, `supportsQualityParam`, `maxCount`.
- **Enabling extended thinking / reasoning on LLM completions?** → Pass `thinking: IThinkingConfig` to `callProviderCompletion` or `callProviderCompletionStream`. `IThinkingConfig` supports a cross-provider generic `effort?: 'low' | 'medium' | 'high'` shorthand and an optional `providers[]` array for per-provider config blocks. Provider-specific types: `IAnthropicThinkingConfig` (effort), `IOpenAiThinkingConfig` (effort, including `'none'` to re-enable temperature), `IGeminiThinkingConfig` (thinkingBudget integer), `IXAiThinkingConfig` (effort). Model-specific and `'other'` escape-hatch blocks let you override for individual models without affecting others. Merge precedence: generic effort → provider-generic blocks → model-specific/other blocks (later declaration wins within a tier). **Temperature + thinking conflicts**: Anthropic and OpenAI (non-`'none'` effort) and xAI return `Result.fail`; Gemini accepts both. Thinking content is discarded in this phase; caller-visible thinking-event surfacing is the scope of the followup stream `ai-assist-thinking-events`. Unknown/unsupported providers silently ignore the `thinking` field.
- **Running a HuggingFace model locally (text classification / embeddings) with a Result boundary?** → `loadPipeline` + `classify` / `classifyAll` / `embed` from `@fgv/ts-extras-transformers` (Node) or `@fgv/ts-web-extras-transformers` (browser). Thin `Result`-wrapped facade over `@huggingface/transformers` — no caching/device/quantization policy (use the upstream lib directly for that). Use `classifyAll` when you need the full per-label vector (it bakes in `top_k: null`); `embed` returns the raw `Tensor` (pass `{ pooling: 'mean', normalize: true }` for a sentence vector). **In a browser bundle, keep your core facade-agnostic (inject the fn, type-only imports) and load the Node facade only via `import(/* webpackIgnore: true */ ...)` on the CLI path** — see the `samples/testbed` `local-classifier-safety` / `local-embedding-search` scenarios.
- **Parsing / comparing language tags?** → `@fgv/ts-bcp47`.
- **Context-conditional resources?** → `@fgv/ts-res`.
- **Authoring, versioning, or resolving LLM prompts that need to vary on context (tenant / language / tone / region) or compose partial fragments?** → `PromptLibrary.create` from `@fgv/ts-prompt-assist`. One YAML file per `(scope, prompt-id)` carries the descriptor + ts-res-conditional candidates; scope-level `_bindings.yaml` supplies slot bindings; root-level `_qualifiers.yaml` (optional) carries the qualifier config. `PromptLibrary.resolve` chain-walks scopes, runs ts-res candidate selection, merges bindings, renders via Mustache with `escape: 'none'`, and returns body + full `IPromptResolveTrace`. **Do not roll your own LLM-prompt loader / renderer; the verbatim Mustache + double-brace rejection are load-bearing.**
- **Binding a prompt slot to the body of another prompt?** → Author a `SlotBinding` with `kind: 'resource', resourceId: '<inner-prompt-id>'` in `_bindings.yaml` or as the slot's `defaultBinding`. `PromptLibrary` resolves the inner prompt recursively (depth-capped via `IPromptLibraryCreateParams.resourceBindingDepthLimit`, default 5; cycle-detected via RFC 8785 canonical-JSON keys) and substitutes the inner body into the outer slot. The full inner trace surfaces in `trace.resourceBindingResolutions[].innerTrace`.
- **Validating a JSON-shaped LLM response against a typed `Converter<T>` + validator chain?** → `PromptLibrary.resolveJsonOutput<K>(req, rawOutput, expectedKind)` from `@fgv/ts-prompt-assist`. Build a `PromptRegistry<TResponse>` where `TResponse` is the consumer's response union (each member carries a `kind: '<discriminator>'` field). Register Converters via `registry.converters.register(id, kind, converter)` and validators via `registry.outputValidations.register(id, { appliesTo, validate })`. Caller passes `expectedKind` as a string literal (`'cited'`, `'classifier'`, etc.); `K` is inferred and the return type narrows to `Extract<TResponse, { kind: K }>` automatically. At the public-API entry, `resolveJsonOutput` runtime-verifies that the descriptor's `output.kind === 'json'` AND that `descriptor.output.converterId` is registered to produce `expectedKind` — a mismatch (caller asked for `'cited'` but the descriptor's converter produces `'classifier'`) rejects loudly with the prompt id + actual-vs-expected kinds, *before* the pipeline runs. After the entry check passes, the pipeline strips Markdown fences (via `AiAssist.fencedStringifiedJson`), `JSON.parse`s, dispatches to the Converter recorded under `(id, kind)` (no cast between the Converter type and validator inputs), then chains the validators (each narrowed by `value.kind ∈ appliesTo`). Loader-side checks reject incompatible descriptors at `describe()` / `resolve()` time (belt); the runtime path re-checks `value.kind` per validator (suspenders). The combined entry-check + belt + suspenders pin every degree of caller-asserted-`T` freedom that the previous `resolveAndValidateOutput<T>` API exposed — there is no longer a path where the return type's runtime kind diverges from what the descriptor declared. **Free-text output:** for descriptors whose `output.kind` is `'free-text'`, use `resolveFreeTextOutput(req, rawOutput)` — it runtime-verifies the descriptor's output kind and returns the raw output verbatim as `Result<string>`. No `TResponse` involvement; no Converter; no caller assertion.
- **Enforcing safety policies (length cap, pluggable value screeners, anti-jailbreak preface) on a resolved prompt?** → `IPromptLibraryCreateParams.safetyPolicy` from `@fgv/ts-prompt-assist`. Carries `defaultMaxLength`, `screeners` (ordered `IScreener[]`; each `screen(ctx)` is async and returns `Result<ISafeguardFinding[]>`), and `antiJailbreakPreface` (consumer-supplied post-render framing — library ships no default content). Use `createPatternScreener({ patterns, onMatch, screenedSources? })` for regex injection screening (`lastIndex` reset between values; `screenedSources` is the screener-owned source allowlist). Screeners run sequentially; the first `disposition: 'reject'` finding (or a screener `fail()`) fails the resolve and short-circuits the rest. Warn / info findings (screener findings under `'warn'` / `'info'`, plus `'enforced-override-ignored'` from the merge) surface in `trace.safeguardFindings`; reject paths (length-cap violations, reject findings, screener `fail()`s) fail the resolve with the rejection in the error message rather than on a trace. Findings carry open `kind`s, optional `metadata`, and `screener` attribution. Implement `IScreener` directly for ML-classifier or remote-call screeners.
- **Mustache rendering for LLM prompts (verbatim, no HTML escaping)?** → `MustacheTemplate.create(template, { escape: 'none' })` from `@fgv/ts-extras` (mustache packlet). The template string is the first argument; the options bag is second. Uses a per-instance `Mustache.Writer` — no mutation of the global `Mustache.escape`, so concurrent renderers with different escape strategies coexist. Default `'html'` preserves the existing back-compat behaviour; pass a `(value) => string` callback for a custom strategy. `@fgv/ts-prompt-assist` consumes the `'none'` strategy internally.
- **Jest matchers for `Result<T>`?** → `@fgv/ts-utils-jest`.
- **CSV / record-jar?** → `@fgv/ts-extras` (`csv` / `record-jar`).
- **Numeric / date / orderable range?** → `RangeOf<T>` from `@fgv/ts-extras/experimental`.
- **Need a Result-integrated WebAuthn registration / authentication primitive (server-side)?** → `generateRegistrationOptions` / `verifyRegistrationResponse` / `generateAuthenticationOptions` / `verifyAuthenticationResponse` from `@fgv/ts-extras-webauthn`. Wraps `@simplewebauthn/server`. Caller still owns ceremony orchestration, challenge management, and credential storage.
- **Need to start a WebAuthn ceremony in the browser?** → `startRegistration` / `startAuthentication` from `@fgv/ts-web-extras-webauthn`. Wraps `@simplewebauthn/browser`.
- **Note (WebAuthn):** `@fgv/ts-extras-webauthn` and `@fgv/ts-web-extras-webauthn` do NOT include PRF helpers, challenge generators, attestation policy, or credential storage. For anything beyond the Result boundary, call `@simplewebauthn/*` directly.
