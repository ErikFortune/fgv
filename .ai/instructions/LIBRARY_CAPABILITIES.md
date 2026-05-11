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

---

## Specialized utilities

### `@fgv/ts-extras` — Node-flavored extras
[libraries/ts-extras](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras)

| Packlet | Use for |
|---|---|
| [`crypto-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/crypto-utils) | Cross-runtime crypto surface. **`ICryptoProvider`** interface with operations: `encrypt`/`decrypt` (AES-256-GCM), `deriveKey` (PBKDF2), `sha256`, `generateRandomBytes`, `generateUuid`, `toBase64`/`fromBase64`, `generateKeyPair`/`exportPublicKeyJwk`/`importPublicKeyJwk` (asymmetric keypairs), `wrapBytes`/`unwrapBytes` (ECIES); **`NodeCryptoProvider`** (Node implementation — pair with `BrowserCryptoProvider` from `ts-web-extras` on the browser side). **`KeyPairAlgorithm`** union: `'ecdsa-p256'`, `'rsa-oaep-2048'`, `'ecdh-p256'`, `'ed25519'`, `'x25519'` (X25519 Diffie-Hellman key agreement — use `deriveBits`/`deriveKey` to produce a shared secret). **`KeyStore`** — **the answer for password hashing and key storage**: password-protected vault for symmetric keys, API keys, and asymmetric keypairs; `addSecretFromPassword` derives + stores a key from a password via PBKDF2; `verifySecretFromPassword` does constant-time verification. Also supports `addSecret`, `addKeyPair`, lock/unlock/save/changePassword, with optional `IPrivateKeyStorage` backend for non-extractable private keys. **Multibase/SPKI helpers** (new): `exportPublicKeyAsMultibaseSpki`/`importPublicKeyFromMultibaseSpki` — export/import any `ICryptoProvider` public key as a multibase base64url-encoded SPKI blob (algorithm-agnostic, suitable for storage/transport); `multibaseBase64UrlEncode`/`multibaseBase64UrlDecode` — pure base64url helpers with the `'m'` multibase prefix. `DirectEncryptionProvider`, `createEncryptedFile`/`decryptFile`/`tryDecryptFile` for one-off encrypted JSON artifacts. **Use this for any password hashing, password-derived key, encrypted-at-rest artifact, named-key lookup, or public-key export; do not roll your own PBKDF2 / timing-safe compare / base64url.** |
| [`experimental`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/experimental) | `ExtendedArray<T>`, `RangeOf<T>` (open/closed orderable ranges), `Formattable<T>` (mustache-printable wrappers). |
| [`csv`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/csv) | CSV parse/format helpers (file + in-memory). |
| [`record-jar`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/record-jar) | Record-jar (RFC 5646 appendix-style) parsing. |
| [`hash`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/hash) | `Md5Normalizer` (Node + browser variants). |
| [`zip-file-tree`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/zip-file-tree) | `FileTree` accessors backed by a ZIP archive. |
| [`conversion`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/conversion) | Extra converters beyond ts-utils. |
| [`ai-assist`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras/src/packlets/ai-assist) | LLM provider client + JSON-tolerant response handling. `callProviderCompletion`/`callProviderCompletionStream` (OpenAI, xAI, Anthropic, Gemini), provider/model registry, `AiPrompt`. **For JSON-shaped completions use `generateJsonCompletion<T>({ converter, ... })`** — it appends a smart "raw JSON only" prompt hint and runs the response through `fencedStringifiedJson`, which strips Markdown fences, leading preamble, and trailing prose before validating with the caller's `Converter<T>` or `Validator<T>`. The bare `extractJsonText` helper is exported for callers that just need wrapper-stripping; `fencedStringifiedJson({ extractor, inner })` is the extension point for custom extractors. **Don't reimplement fence-stripping in consumers.** **For image generation use `callProviderImageGeneration`/`callProxiedImageGeneration`** — supports OpenAI DALL-E 3 / gpt-image-1 (`openai-images`), xAI grok-imagine generations (`xai-images`) and edits (`xai-images-edits`), Google Imagen predict endpoint (`gemini-imagen`), and Gemini image-output via generateContent (`gemini-image-out`). The layered options system provides top-level keys (`size`, `quality`, `seed`, `count`) alongside per-provider `models` blocks for provider-specific params (e.g. `{ provider: 'openai', family: 'gpt-image', config: { outputFormat, background, moderation, outputCompression } }`). Provider capability is declared on `IAiProviderDescriptor.imageGeneration: IAiImageModelCapability[]`; `imageOptionsResolver` translates the layered options into a wire-ready `IResolvedImageOptions`. |

### `@fgv/ts-web-extras` — browser-only utilities
[libraries/ts-web-extras](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras)

| Packlet | Use for |
|---|---|
| [`crypto-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/crypto-utils) | **`BrowserCryptoProvider`** — Web Crypto API implementation of `ICryptoProvider` (the same interface `NodeCryptoProvider` implements). `BrowserHashProvider` for SHA-family hashing. **Use these to back `KeyStore`, `DirectEncryptionProvider`, or any other ts-extras `crypto-utils` consumer in the browser without touching `node:crypto`.** |
| [`file-tree`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/file-tree), [`file-api-types`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/file-api-types) | `FileTree` over the browser File System Access API — drop-in implementation of the same `FileTree` interface used by `FsTree` (Node) and `ZipFileTreeAccessors` (zip). |
| [`helpers`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/helpers) | Browser file-tree convenience helpers. |
| [`url-utils`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras/src/packlets/url-utils) | `urlParams` parsing/serialization. |

---

## Cross-runtime interfaces

Several core abstractions are defined once and have separate Node and browser implementations. Code against the interface; pick the implementation at the composition root.

| Interface | Node impl | Browser impl | Notes |
|---|---|---|---|
| `FileTree` (`@fgv/ts-json-base/file-tree`) | `FsTree` (`ts-json-base/file-tree`) | `FileTree` over File System Access API (`ts-web-extras/file-tree`) | Also: `ZipFileTreeAccessors` (`ts-extras/zip-file-tree`), in-memory tree (`ts-json-base/file-tree`). |
| `ICryptoProvider` (`@fgv/ts-extras/crypto-utils`) | `NodeCryptoProvider` (`ts-extras/crypto-utils`) | `BrowserCryptoProvider` (`ts-web-extras/crypto-utils`) | Same surface for AES-GCM, PBKDF2, SHA-256, random bytes, asymmetric key ops, ECIES wrap/unwrap. |
| Hash normalizer | `Md5Normalizer` (`ts-extras/hash`), `Crc32Normalizer` (`ts-utils/hash`) | `Md5Normalizer.browser` (`ts-extras/hash`), `BrowserHashProvider` (`ts-web-extras/crypto-utils`) | `Crc32Normalizer` is pure JS and runs everywhere. |
| `IEncryptionProvider` (`@fgv/ts-extras/crypto-utils`) | `KeyStore`, `DirectEncryptionProvider` | same (back with `BrowserCryptoProvider`) | The provider is runtime-agnostic; only the underlying `ICryptoProvider` differs. |

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
- **Password-protected vault for keys / API keys / keypairs?** → `KeyStore` from `@fgv/ts-extras/crypto-utils`. Use `addSecretFromPassword` to derive + store, `verifySecretFromPassword` for constant-time password verification.
- **PBKDF2 key derivation, ECIES wrap/unwrap, asymmetric keypairs (Ed25519, ECDSA-P256, ECDH-P256, RSA-OAEP, X25519)?** → `ICryptoProvider` from `@fgv/ts-extras/crypto-utils`. Never call `node:crypto` or `crypto.subtle` directly.
- **Need to hash / verify a password?** → `KeyStore.addSecretFromPassword` / `verifySecretFromPassword` from `@fgv/ts-extras/crypto-utils`. Never roll PBKDF2 directly.
- **Need stable canonical JSON (RFC 8785)?** → `Normalizer.canonicalize()` (available on `HashingNormalizer`, `Crc32Normalizer`, or any `Normalizer` subclass) from `@fgv/ts-utils` hash packlet.
- **Need to encode/decode a public key as multibase SPKI?** → `exportPublicKeyAsMultibaseSpki(key, provider)` / `importPublicKeyFromMultibaseSpki(encoded, algorithm, provider)` from `@fgv/ts-extras/crypto-utils`. Pass the `ICryptoProvider` instance so the underlying SPKI export/import routes through the correct platform implementation.
- **Need X25519 key agreement?** → `generateKeyPair('x25519', ...)` from `ICryptoProvider` (`@fgv/ts-extras/crypto-utils`) to produce the keypair; use `ICryptoProvider.exportPublicKeySpki` / `importPublicKeySpki` to exchange public keys. Raw `deriveBits` for the shared secret is not yet wrapped by `ICryptoProvider` — do not call `crypto.subtle` directly.
- **Parsing a JSON-shaped string (with optional inner validation)?** → `Converters.stringifiedJson(inner?)` from `@fgv/ts-json-base/converters`.
- **Asking an LLM for JSON and getting a validated `T`?** → `AiAssist.generateJsonCompletion<T>({ converter, ... })` from `@fgv/ts-extras/ai-assist`. Tolerates Markdown fences, preamble, and trailing prose by default. Don't reimplement fence-stripping in consumers.
- **Stripping LLM Markdown fences from raw text?** → `AiAssist.extractJsonText` (default extractor) or `AiAssist.fencedStringifiedJson({ extractor, inner })` (extension point) from `@fgv/ts-extras/ai-assist`.
- **Generating images from an LLM provider?** → `AiAssist.callProviderImageGeneration({ descriptor, apiKey, params })` from `@fgv/ts-extras/ai-assist`. Use `callProxiedImageGeneration(proxyUrl, ...)` to route through a proxy when direct browser calls are CORS-restricted. Pass top-level options (`size`, `quality`, `seed`, `count`) and a `models` array for provider-specific config blocks.
- **Declaring image generation capability on a provider?** → Add `imageGeneration: IAiImageModelCapability[]` to `IAiProviderDescriptor`. Each capability entry carries `format` (`'openai-images' | 'xai-images' | 'xai-images-edits' | 'gemini-imagen' | 'gemini-image-out'`), `modelPrefix`, and optional flags like `acceptsImageReferenceInput`, `defaultOutputMimeType`, `outputParamStyle`, `supportsQualityParam`, `maxCount`.
- **Enabling extended thinking / reasoning on LLM completions?** → Pass `thinking: IThinkingConfig` to `callProviderCompletion` or `callProviderCompletionStream`. `IThinkingConfig` supports a cross-provider generic `effort?: 'low' | 'medium' | 'high'` shorthand and an optional `providers[]` array for per-provider config blocks. Provider-specific types: `IAnthropicThinkingConfig` (effort), `IOpenAiThinkingConfig` (effort, including `'none'` to re-enable temperature), `IGoogleThinkingConfig` (thinkingBudget integer), `IXAiThinkingConfig` (effort). Model-specific and `'other'` escape-hatch blocks let you override for individual models without affecting others. Merge precedence: generic effort → provider-generic blocks → model-specific/other blocks (later declaration wins within a tier). **Temperature + thinking conflicts**: Anthropic and OpenAI (non-`'none'` effort) and xAI return `Result.fail`; Gemini accepts both. Thinking events (extended-thinking content blocks) surface as `IAiStreamThinking` events in the streaming iterable — consumers can render or discard them. Unknown/unsupported providers silently ignore the `thinking` field.
- **Parsing / comparing language tags?** → `@fgv/ts-bcp47`.
- **Context-conditional resources?** → `@fgv/ts-res`.
- **Jest matchers for `Result<T>`?** → `@fgv/ts-utils-jest`.
- **CSV / record-jar?** → `@fgv/ts-extras` (`csv` / `record-jar`).
- **Numeric / date / orderable range?** → `RangeOf<T>` from `@fgv/ts-extras/experimental`.
