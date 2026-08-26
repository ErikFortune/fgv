# FGV Library Capabilities — index

**Before writing utility-shaped code, look here.** If a capability is listed, use the existing
library rather than reimplementing it. This file is the **index**; the detail lives in each
package's `CAPABILITIES.md`, linked below.

**Repository:** https://github.com/ErikFortune/fgv (release branch)

## How to use this

1. Scan the shortcuts below for your question, or the package table for the area.
2. Follow the link to that package's `CAPABILITIES.md` for the full surface, the edge cases, and
   the things not to hand-roll.
3. If you cannot find what you need, **ask before adding a dependency or rolling your own** — the
   answer is often "we can extend the primitive", which is cheaper than a workaround.

**Why this file is small.** It is `@`-included into every session, so its size is paid whether or
not the task touches a library. It stays an index on purpose, and a CI gate
(`common/scripts/verify-capability-docs.mjs`) enforces that — including that every reflex below
survives. If an entry cannot be said in one line, it is reference material and belongs in a package
file.

**Authority.** Each `CAPABILITIES.md` is authoritative for its package. A package `README.md` is
getting-started material. This index routes; it does not duplicate.

---

## Packages

| package | what it is |
|---|---|
| [`ts-utils`](libraries/ts-utils/CAPABILITIES.md) | `Result<T>`, converters, validators, collections, hashing, logging. The async `Result` family and `AsyncDetailedResult`. **Start here.** |
| [`ts-utils-jest`](libraries/ts-utils-jest/CAPABILITIES.md) | Result-aware Jest matchers — `toSucceed`, `toFailWith`, `toSucceedAndSatisfy` |
| [`ts-json-base`](libraries/ts-json-base/CAPABILITIES.md) | JSON types, converters, `FileTree`, and `JsonSchema` (typed schema = validator = wire, incl. `isSchemaValidator`) |
| [`ts-json`](libraries/ts-json/CAPABILITIES.md) | JSON templating, conditional properties, deep merge, structural diff |
| [`ts-bcp47`](libraries/ts-bcp47/CAPABILITIES.md) | BCP-47 language tags, similarity scoring, IANA + UN M.49 registries |
| [`ts-res`](libraries/ts-res/CAPABILITIES.md) | Multidimensional conditional resources — i18n, theming, A/B, environment overrides |
| [`ts-res-ui-components`](libraries/ts-res-ui-components/CAPABILITIES.md) | React UI for browsing/editing ts-res resources |
| [`ts-random`](libraries/ts-random/CAPABILITIES.md) | Seeded, reproducible PRNG (`SeededRandomSource`, `PseudoRandomGenerator`) + word/char corpora. **mulberry32 — never for tokens, salts or keys** |
| [`ts-extras`](libraries/ts-extras/CAPABILITIES.md) | Crypto, `safer-fetch`, `ai-assist` (LLM clients, structured output incl. `adaptOptionalToNullable`), CSV, zip, mustache |
| [`ts-web-extras`](libraries/ts-web-extras/CAPABILITIES.md) | Browser siblings — crypto, File System Access `FileTree`, browser `safer-fetch` |
| [`ts-extras-argon2`](libraries/ts-extras-argon2/CAPABILITIES.md) · [`ts-web-extras-argon2`](libraries/ts-web-extras-argon2/CAPABILITIES.md) | Argon2id providers (Node native / browser WASM) |
| [`ts-extras-webauthn`](libraries/ts-extras-webauthn/CAPABILITIES.md) · [`ts-web-extras-webauthn`](libraries/ts-web-extras-webauthn/CAPABILITIES.md) | WebAuthn Result boundary over `@simplewebauthn/*` |
| [`ts-extras-transformers`](libraries/ts-extras-transformers/CAPABILITIES.md) · [`ts-web-extras-transformers`](libraries/ts-web-extras-transformers/CAPABILITIES.md) | Local HuggingFace models — classify, embed, summarize |
| [`ts-extras-mcp`](libraries/ts-extras-mcp/CAPABILITIES.md) | MCP server tools → ai-assist client tools |
| [`ts-extras-ollama`](libraries/ts-extras-ollama/CAPABILITIES.md) | Ollama *native* API — model management, grammar-constrained output |
| [`ts-agent-memory`](libraries/ts-agent-memory/CAPABILITIES.md) | Agent memory/knowledge vault — records, dedup (`dedupScopeFor`), edges, retrieval, `IVectorIndex` / `IFragmentVectorIndex`, `embedsKind` |
| [`ts-agent-memory-sqlite-vec`](libraries/ts-agent-memory-sqlite-vec/CAPABILITIES.md) | Durable vector + fragment indexes (SQLite `vec0`) |
| [`ts-prompt-assist`](libraries/ts-prompt-assist/CAPABILITIES.md) | Conditional prompt authoring, resolution, composition, observation |
| [`ts-app-shell`](libraries/ts-app-shell/CAPABILITIES.md) | React app-shell primitives — bars, layout, theme, messages/toasts |
| [`ts-http-storage`](libraries/ts-http-storage/CAPABILITIES.md) | Server side of the HTTP `FileTree` backend |

*Not listed: `ts-sudoku-lib` / `ts-sudoku-ui`, slated to move to their own monorepo — see
`.ai/instructions/ACTIVE_DEVELOPMENT.md`.*

---

## Decision shortcuts

*One line each. The symbols are the anchors — search a package file for the symbol to get the
detail. `· pkg` names the owning package.*

- **Error handling / fallible function?** → `Result<T>` · `ts-utils`
- **Validating untyped JSON / config input?** → `Converters.object` · `ts-utils`
- **Validating an existing class instance?** → `Validators` · `ts-utils`
- **Map/collection with validation?** → `ResultMap` · `ts-utils`
- **Need a bounded most-recent-N ring of records with monotonic `seq` cursor paging…?** → `RetainingRingBuffer` · `ts-utils`
- **Aggregating multiple errors?** → `mapResults` `MessageAggregator` · `ts-utils`
- **N independent async `Result`-returning operations, with a concurrency bound?** → `mapResults` `mapResultsAsync` · `ts-utils`
- **Async operation that is *serial by contract*, not a fan-out?** → `MessageAggregator` `populateObjectAsync` `firstSuccessAsync` · `ts-utils`
- **Reading files?** → `FileTree` · `ts-json-base`
- **Need a file read that fails loudly on malformed UTF-8 instead of silently…?** → `FileTree` `isStrictTextAccessors` `getFileTextStrict` · `ts-json-base`
- **Copying a file or a whole directory tree between `FileTree`s?** → `FileTree` `copyItemInto` `copyContentsInto` · `ts-json-base`
- **Loading/saving JSON files?** → `JsonFsHelper` · `ts-json-base`
- **JSON templating or conditional inclusion?** → `JsonConverter` · `ts-json`
- **Deep-merging JSON?** → `JsonEditor.mergeObjectInPlace` · `ts-json`
- **Diffing JSON?** → `detailedDiff` `threeWayDiff` · `ts-json`
- **Branded ID type?** → `Brand<T>` · `ts-utils`
- **Generating a UUID?** → `ICryptoProvider` `generateUuid` · `ts-utils`
- **Hashing / canonical hash of an object?** → `Crc32Normalizer` `Md5Normalizer` · `ts-utils`
- **Symmetric encryption / decryption (AES-GCM)?** → `KeyStore` · `ts-extras`
- **Need AES-256-GCM encrypt/decrypt with a key you already hold?** → `ICryptoProvider` `KeyStore` · `ts-extras`
- **Password-protected vault for keys / API keys / keypairs?** → `KeyStore` `addSecretFromPassword` `verifySecretFromPassword` · `ts-extras`
- **Need a private-key storage backend so `KeyStore.addKeyPair` works?** → `FileTree` `KeyStore` `EncryptedFilePrivateKeyStorage` `IdbPrivateKeyStorage` · `ts-extras`
- **PBKDF2 key derivation, ECIES wrap/unwrap, asymmetric keypairs?** → `ICryptoProvider` · `ts-extras`
- **Need to hash / verify a password (PBKDF2)?** → `KeyStore` `addSecretFromPassword` `verifySecretFromPassword` · `ts-extras`
- **Need to hash / verify a password with Argon2id?** → `KeyStore` `addSecretFromPassword` `verifySecretFromPassword` `addSecretFromPasswordArgon2id` · `ts-extras`
- **Need an Argon2id provider (Node)?** → `NodeArgon2Provider` · `ts-extras-argon2`
- **Need an Argon2id provider (browser / WASM)?** → `BrowserArgon2Provider` · `ts-web-extras-argon2`
- **Need stable canonical JSON (RFC 8785)?** → `Crc32Normalizer` `canonicalize` · `ts-utils`
- **Decoding base64 that arrived from somewhere you don't control?** → `fromBase64Strict` · `ts-extras`
- **Need to encode/decode a public key as multibase SPKI?** → `ICryptoProvider` `exportPublicKeyAsMultibaseSpki` · `ts-extras`
- **Need hybrid public-key encryption?** → `HpkeProvider` · `ts-extras`
- **Need standalone HKDF-SHA256 key derivation?** → `HpkeProvider` · `ts-extras`
- **Need X25519 key agreement?** → `ICryptoProvider` · `ts-extras`
- **Need to sign data or verify a signature?** → `ICryptoProvider` · `ts-extras`
- **Need HMAC-SHA256 authentication / MAC verification?** → `ICryptoProvider` `timingSafeEqual` `hmacSha256` · `ts-extras`
- **Need constant-time byte comparison?** → `ICryptoProvider` `timingSafeEqual` · `ts-extras`
- **Parsing a JSON-shaped string (with optional inner validation)?** → `Converters.stringifiedJson` · `ts-json-base`
- **Need typed JSON Schema for LLM tool authoring?** → `JsonSchema` `fromJson` · `ts-json-base`
- **Need an absent-able field in a schema you send to OpenAI?** → `JsonSchema` `nullable` · `ts-json-base`
- **Asking an LLM for JSON and getting a validated `T`?** → `generateJsonCompletion` `JsonSchema` · `ts-extras`
- **Need the provider to constrain its output, not just be asked to?** → `structuredOutput` · `ts-extras`
- **Running a tool-use conversation with harness-side client tools?** → `executeClientToolTurn` `JsonSchema` · `ts-extras`
- **Making an MCP server's tools callable from an ai-assist tool-use conversation?** → `executeClientToolTurn` `JsonSchema` `fromJson` `adaptMcpTools` · `ts-extras-mcp`
- **Diagnosing an OpenAI/xAI Responses stream that completes empty?** → `executeClientToolTurn` · `ts-extras`
- **Alerting on provider-API evolution affecting `@fgv/ts-extras/ai-assist`?** → `ILogger` `IStreamApiConfig` · `ts-extras`
- **Stripping LLM Markdown fences from raw text?** → `extractJsonText` `fencedStringifiedJson` · `ts-extras`
- **Diagnosing *why* an LLM's JSON response failed to parse?** → `classifyJsonParseFailure` · `ts-extras`
- **Generating images from an LLM provider?** → `size` `quality` · `ts-extras`
- **Declaring image generation capability on a provider?** → `IAiProviderDescriptor` `format` · `ts-extras`
- **Looking up a model's image/embedding capability by id?** → `resolveImageCapability` · `ts-extras`
- **Enabling extended thinking / reasoning on LLM completions?** → `callProviderCompletion` `callProviderCompletionStream` · `ts-extras`
- **Managing a local Ollama sidecar** → `callProviderEmbedding` `JsonSchema` · `ts-extras-ollama`
- **Running a HuggingFace model locally with a Result boundary?** → `loadPipeline` `classify` · `ts-extras-transformers`
- **Summarizing text locally vs. in the cloud?** → `summarize` · `ts-extras-transformers`
- **Need a text embedding (`text → vector`)?** → `callProviderEmbedding` · `ts-extras-transformers`
- **Embedding text via a cloud or self-hosted provider?** → `callProviderEmbedding` · `ts-extras`
- **Calling a self-hosted Ollama or OpenAI-compatible model?** → `executeClientToolTurn` · `ts-extras`
- **Storing agent memory / a knowledge vault?** → `FileTree` `FileTreeMemoryStore` · `ts-agent-memory`
- **Semantic recall over that vault** → `InMemoryCosineIndex` `SqliteVecVectorIndex` `SqliteVecFragmentIndex` `FragmentSemanticRetriever` · `ts-agent-memory`
- **Vector/fragment embeddings must survive a process restart?** → `SqliteVecVectorIndex` `SqliteVecFragmentIndex` · `ts-agent-memory-sqlite-vec`
- **Need to know whether a store's derived state is consistent with its records** → `IVectorIndex` · `ts-agent-memory`
- **Need to measure a `FileTreeMemoryStore`'s resident-memory / open-cost behavior?** → `FileTree` `FileTreeMemoryStore` · `ts-agent-memory`
- **Reading an envelope's embedding reference, or checking whether it has one?** → `embeddingRefOf` · `ts-agent-memory`
- **Listing records from a store?** → `addressGuard` `allowAnyAddress` `scanEveryRecord` `listEntries` · `ts-agent-memory`
- **Building a retriever directly?** → `FileTree` `FileTreeMemoryStore` `listEntries` · `ts-agent-memory`
- **Fetching a URL you do not fully control (server-side)?** → `saferFetchJson` `saferFetchBytes` `addressGuard` `blockPrivateNetworks` `allowContentTypes`; never echo `FetchFailureReason` to an untrusted caller · `ts-extras`
- **Fetching a URL from a browser?** → `addressGuard` `allowAnyAddress` · `ts-web-extras`
- **Parsing / comparing language tags?** → `Bcp47.tag` `Bcp47.similarity` · `ts-bcp47`
- **Context-conditional resources?** → `ResourceManager` · `ts-res`
- **Authoring, versioning, or resolving LLM prompts that need to vary on context or…?** → `PromptLibrary` · `ts-prompt-assist`
- **Binding a prompt slot to the body of another prompt?** → `PromptLibrary` · `ts-prompt-assist`
- **Composing one prompt from several resolved prompts?** → `PromptLibrary` `HorizontalComposer` · `ts-prompt-assist`
- **Observing every prompt resolution as it flows?** → `RetainingRingBuffer` `PromptLibrary` `PromptObservationStore` `resolveJsonOutput` · `ts-prompt-assist`
- **Validating a JSON-shaped LLM response against a typed `Converter<T>` + validator…?** → `fencedStringifiedJson` `PromptLibrary` `resolveJsonOutput` · `ts-prompt-assist`
- **Enforcing safety policies on a resolved prompt?** → `PromptLibrary` · `ts-prompt-assist`
- **Mustache rendering for LLM prompts?** → `MustacheTemplate` · `ts-extras`
- **Jest matchers for `Result<T>`?** → `toSucceedAndSatisfy` `toFailWith` · `ts-utils-jest`
- **CSV / record-jar?** → `csv` · `ts-extras`
- **Numeric / date / orderable range?** → `RangeOf<T>` · `ts-extras`
- **Need a Result-integrated WebAuthn registration / authentication primitive…?** → `generateRegistrationOptions` `verifyRegistrationResponse` · `ts-extras-webauthn`
- **Need to start a WebAuthn ceremony in the browser?** → `startRegistration` `startAuthentication` · `ts-web-extras-webauthn`
- **WebAuthn: PRF helpers, challenge stores, ceremony orchestration?** → **not in scope** — call `@simplewebauthn/*` directly · `ts-extras-webauthn`

---

## Cross-runtime interfaces

Code against the interface; pick the implementation at the composition root. Compact form — the
full table with per-interface notes is in
[`.ai/conventions/cross-runtime-interfaces.md`](.ai/conventions/cross-runtime-interfaces.md).

| interface | Node | browser |
|---|---|---|
| `FileTree` | `FsTree` · `ZipFileTreeAccessors` | File System Access, `localStorage`, HTTP accessors |
| `ICryptoProvider` | `NodeCryptoProvider` | `BrowserCryptoProvider` |
| `IArgon2idProvider` | `NodeArgon2Provider` | `BrowserArgon2Provider` |
| `IPrivateKeyStorage` | `EncryptedFilePrivateKeyStorage` | `IdbPrivateKeyStorage` |
| safer-fetch | `saferFetchJson` + `blockPrivateNetworks` | `SaferFetch.browserSaferFetchJson` + `allowAnyAddress` |
| transformers facade | `@fgv/ts-extras-transformers` | `@fgv/ts-web-extras-transformers` |

**Result-integration boundary** is the package shape used for thin wrappers over a well-maintained
upstream (`ts-extras-webauthn`, `-transformers`, `-mcp`, `-ollama`, `ts-agent-memory-sqlite-vec`):
convert throws into `Result<T>`, expose ~5–8 primitives, and enumerate what is explicitly **not** in
scope. Dependency posture is per-package and deliberately not uniform — peer when the consumer must
control the version or instance, direct otherwise. Full convention:
[`.ai/conventions/result-integration-boundary.md`](.ai/conventions/result-integration-boundary.md).

---

## Recent additions

*Newest first, bounded. **Generated** from each completed stream's `summary.sourceLine` by
`common/scripts/generate-capability-feed.mjs`; CI fails if it is stale. Do not hand-edit inside the
markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-08-23** — Shipped: an opt-in that hoists the optionals a schema already proves safe to hoist, rather than a boolean asserting they are. ([#659](https://github.com/ErikFortune/fgv/pull/659)) · `ts-extras` `ts-json-base`
- **2026-08-22** — Shipped: a capability-aware copy with a single guarantee — every file that lands is byte-identical to its source, or the copy says… ([#653](https://github.com/ErikFortune/fgv/pull/653)) · `ts-json-base`
- **2026-08-22** — Shipped: `nullable: true` on every factory — the spelling OpenAI strict mode accepts for an absent-able field, where… ([#655](https://github.com/ErikFortune/fgv/pull/655)) · `ts-json-base` `ts-extras` `ts-extras-mcp`
- **2026-08-22** — Shipped: the rebuild-path table clear runs through `exec`, so the one statement `release()` could never reach no longer exists. ([#654](https://github.com/ErikFortune/fgv/pull/654)) · `ts-agent-memory-sqlite-vec`
- **2026-08-21** — A caller that has already declared the shape it wants can now tell the provider, and learn which enforcement was actually applied… ([#652](https://github.com/ErikFortune/fgv/pull/652)) · `ts-extras` `ts-json-base` `ts-app-shell`
- **2026-08-21** — Shipped: `release()` on both index classes — it drops the index's prepared statements and marks it unusable, and never touches the… ([#651](https://github.com/ErikFortune/fgv/pull/651)) · `ts-agent-memory-sqlite-vec`
- **2026-08-18** — Shipped: one invariant, enforced at the one layer that sees both sides — a record loaded from an address derived from kind K is a… ([#648](https://github.com/ErikFortune/fgv/pull/648)) · `ts-agent-memory`
- **2026-08-15** — Shipped: the partial-read `IMemoryIndex` — every read returns `IIndexedMemoryEntry` (scope + envelope, no body), `rebuild` takes… ([#633](https://github.com/ErikFortune/fgv/pull/633)) · `ts-agent-memory` `samples/testbed`
- **2026-08-15** — Outcome: delivered. Additive; `create()` is untouched on both classes.
- **2026-08-15** — Shipped: every count in `IVectorRebuildReport` is now resolved by `Kind`, the exclusion count originates in the layer that decides… ([#633](https://github.com/ErikFortune/fgv/pull/633)) · `ts-agent-memory` `ts-agent-memory-sqlite-vec`

*Showing the 10 most recent of 36. Per-package history is in each `CAPABILITIES.md`.*

<!-- END GENERATED: recent-additions -->
