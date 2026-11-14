# changelog-curation-5.1.0 — result

**Shipped:** every pending change file (760, across 36 projects) is replaced by 110 curated entries
across the 32 published projects, describing what 5.1.0 changes for someone upgrading from 5.0.2,
with every "Upgrading from 5.0.2" caveat from the semver audit; the full rendered text is below.

## For the morning review

- **Read the rendered text below.** It is the `## 5.1.0` section of each `CHANGELOG.md` exactly as
  `rush version` wrote it on a throwaway clone (only the date line is removed), using the release
  sequence: `rush version --ensure-version-policy --version-policy base-utils --override-version
  5.1.0-0`, then `rush version --bump --version-policy base-utils --override-bump patch`. Every
  published project came out at **5.1.0** and every change file was consumed.
- **`type` matters for rendering** (see `state.md` J1): `major` → `### Breaking changes`, `minor` →
  `### Minor changes`, `patch` → `### Patches`, `none` → `### Updates`. Features are `minor`, fixes
  and packaging `patch`, caveats that break code compiled against 5.0.2 `major`, informational
  caveats `none`. The `major` entries do not move the version under the release sequence above;
  under `rush publish --apply`, by contrast, types would bump packages individually (5.2.0 / 5.1.1).
- **Unpublished projects** (`ks`, `testbed`, `ts-res-tutorial`, `ts-res-ui-playground`): pending
  files deleted, nothing added — Rush never consumes or renders them (`state.md` J2).
- To change wording: edit the JSON under `common/changes/@fgv/<pkg>/release-5-1-0-<nn>_…json`; the
  `<nn>` orders bullets within a heading.

## Verification

- Every "existed in 5.0.2" claim was checked against `origin/main` (`etc/*.api.md`, `package.json`)
  and, for packaging claims, against the **published 5.0.2 tarballs** from npm (LICENSE, source
  maps, test files, ESM `dist/`). The ts-utils / ts-utils-jest Node ESM failure and the
  `ts-res-cli` CRLF shebang were reproduced against the 5.0.2 tarballs.
- No alpha-era `BREAKING:` note about a surface absent from 5.0.2 is carried. ts-extras' breaking
  alpha notes are all on `ai-assist`, `crypto-utils` / KeyStore, safer-fetch or Mustache, none of
  which is on main; the 5.0.2 packlets changed only additively (every 5.0.2 api.md declaration line
  is still present).
- `rush change --verify --target-branch origin/integration/asks` passes.
- No code is touched, so no build/test gate.

## Files per package

| package | deleted | added |
|---|---:|---:|
| `@fgv/heft-dual-rig` | 9 | 1 |
| `@fgv/ks` | 4 | 0 |
| `@fgv/repo-template` | 14 | 1 |
| `@fgv/testbed` | 13 | 0 |
| `@fgv/ts-agent-memory` | 49 | 4 |
| `@fgv/ts-agent-memory-sqlite-vec` | 17 | 3 |
| `@fgv/ts-agent-tasks` | 24 | 5 |
| `@fgv/ts-app-shell` | 31 | 4 |
| `@fgv/ts-bcp47` | 21 | 3 |
| `@fgv/ts-extras` | 138 | 9 |
| `@fgv/ts-extras-argon2` | 11 | 1 |
| `@fgv/ts-extras-mcp` | 29 | 3 |
| `@fgv/ts-extras-ollama` | 16 | 3 |
| `@fgv/ts-extras-re2` | 2 | 2 |
| `@fgv/ts-extras-system-one` | 3 | 2 |
| `@fgv/ts-extras-transformers` | 12 | 1 |
| `@fgv/ts-extras-webauthn` | 9 | 1 |
| `@fgv/ts-http-storage` | 15 | 3 |
| `@fgv/ts-json` | 18 | 2 |
| `@fgv/ts-json-base` | 46 | 8 |
| `@fgv/ts-prompt-assist` | 20 | 5 |
| `@fgv/ts-random` | 18 | 4 |
| `@fgv/ts-res` | 22 | 6 |
| `@fgv/ts-res-browser` | 19 | 3 |
| `@fgv/ts-res-browser-cli` | 17 | 3 |
| `@fgv/ts-res-cli` | 17 | 3 |
| `@fgv/ts-res-tutorial` | 2 | 0 |
| `@fgv/ts-res-ui-components` | 18 | 3 |
| `@fgv/ts-res-ui-playground` | 1 | 0 |
| `@fgv/ts-utils` | 43 | 13 |
| `@fgv/ts-utils-jest` | 19 | 3 |
| `@fgv/ts-web-extras` | 42 | 7 |
| `@fgv/ts-web-extras-argon2` | 10 | 1 |
| `@fgv/ts-web-extras-transformers` | 13 | 1 |
| `@fgv/ts-web-extras-webauthn` | 11 | 1 |
| `@fgv/typedoc-compact-theme` | 7 | 1 |
| **total** | **760** | **110** |

## Rendered changelogs

Packages present in 5.0.2 first, then packages new in 5.1.0.

### `@fgv/ts-utils` (libraries/ts-utils)

```markdown
## 5.1.0

### Breaking changes

- Upgrading from 5.0.2: `Converter` and `Validator` gained a required `or()`, and `IResult` gained required `orDefaultWith`, `shouldNotFail`, `thenOnSuccess` and `thenOnFailure`. Only code that implements these interfaces by hand is affected — extending `BaseConverter` / `GenericValidator` or using `succeed` / `fail` needs no change.

### Minor changes

- Async `Result` support: `AsyncResult<T>`, returned by the new `captureAsyncResult` and by `thenOnSuccess` / `thenOnFailure` on every `Result`, keeps a chain fluent across `await`; `AsyncDetailedResult<T, TD>` keeps the detail type through async steps.
- Async collectors with a concurrency bound — `mapResultsAsync`, `mapDetailedResultsAsync`, `mapSuccessAsync`, `mapFailuresAsync`, `allSucceedAsync` — plus the serial `populateObjectAsync` and `firstSuccessAsync`.
- New `Result` methods: `orDefaultWith(cb)`, a default computed only on failure; `shouldNotFail(label?)` for declaration-time invariants, which throws naming the call site; and `Failure.withType<U>()` to re-type a failure for an early return. `DetailedResult` is now `@public` (was `@beta`).
- Conversion: `or()` alternation on `Converter` and `Validator`, `Converters.tuple`, `Converters.compositeId` / `compositeIdFromString` / `compositeIdFromObject` (with a `split` mode), and `StringConverter.singleLine()`.
- New `formatValueForMessage` renders any value for a message without throwing. Every converter and validator failure now uses it, so a cyclic, BigInt or Proxy input fails instead of throwing, and a throw from a function wrapped by `BaseConverter` or `GenericValidator` becomes a `Failure`.
- Collections: `IResultMap` (implemented by `ResultMap`), `ConvertingResultMap` and `ValidatingConvertingResultMap`, `AggregatedResultMap`, and `RetainingRingBuffer<T>`, a bounded most-recent-N buffer with monotonic `seq` cursor paging.
- Logging: `BootLogger` buffers output until a real logger is ready, `RetainingLogger` keeps a queryable ring of structured log records, `MultiLogger` fans out to several loggers; `MessageLogLevel` and `ReporterLogLevel` gain value lists and converters.
- Utilities: `generateUuid()` with the `Uuid` brand and `isValidUuid`; `canonicalize()` on `Normalizer` for RFC 8785 canonical JSON; `OneOf` / `StringOneOf` types; typed record helpers `keysForRecord`, `valuesForRecord`, `entriesForRecord`, `recordFromEntries`; `ensureArray`.

### Patches

- `captureResult` and the async capture paths never throw while reporting a failure, even when the thrown value's message cannot be read.
- Packaging: source maps and `CAPABILITIES.md` now ship in the package; test helper files no longer do.
- Upgrading from 5.0.2: behaviour fixes you may notice. `mapSuccess` now matches its documented contract, adding every failure to a supplied `aggregatedErrors` even when some results succeeded; `isKeyOf` and `Converters.strictObject` no longer throw on null-prototype objects.
- Upgrading from 5.0.2: Node ESM `import` of this package now works; in 5.0.2 it failed with `ERR_UNSUPPORTED_DIR_IMPORT`. `require` and bundlers are unaffected.
```

### `@fgv/ts-utils-jest` (libraries/ts-utils-jest)

```markdown
## 5.1.0

### Patches

- Node ESM `import` of this package now works; in 5.0.2 it failed with `ERR_UNSUPPORTED_DIR_IMPORT`.
- Packaging: source maps and `CAPABILITIES.md` now ship in the package.

### Updates

- Upgrading from 5.0.2: the runtime dependencies (`expect`, `jest-snapshot`, `jest-matcher-utils`, `@jest/expect-utils`) moved from Jest 29 to Jest 30. The Result matchers and snapshot matchers are verified working under Jest 29 as well.
```

### `@fgv/ts-json-base` (libraries/ts-json-base)

```markdown
## 5.1.0

### Minor changes

- New `JsonSchema` namespace: typed JSON Schema for LLM tools and structured output, where the schema is also the validator — `string`, `number`, `integer`, `boolean`, `enumOf`, `array`, `object`, `record` and `optional`, with `nullable`, constraint and annotation keywords, `Static<S>` type inference and `toJson()`.
- `JsonSchema.fromJson` turns a received schema (for example an MCP tool's) into a validator: it inlines local `$ref`, accepts a pydantic-style `anyOf` of one type plus null, and refuses `pattern` unless a `patternValidator` is supplied. `JsonSchema.isSchemaValidator` detects an authored schema.
- Writable `FileTree`s: optional mutable, persistent, binary, strict-text and atomic-write capabilities, each with a type guard (`isMutableAccessors`, `isBinaryAccessors`, …). Filesystem and in-memory trees are writable when created with `mutable: true` (or a filter).
- `FileTree.copyItemInto` / `copyContentsInto` copy between trees faithfully — bytes verbatim where the destination is byte-native — and fail, or skip with `onUnfaithfulFile: 'skip'`, on any file that would change.
- Filesystem trees: atomic writes (temporary file, flush, rename) via `writeChildAtomically`, and an `absolutePathPolicy` (`'unconfined'` default, `'confined'` or `'verified'`) to keep a tree inside its prefix.
- `Converters.stringifiedJson(inner?)` parses a JSON string, optionally validating the result with an inner converter or validator.

### Patches

- Fix: the recursive `jsonObject`, `jsonArray` and `jsonValue` converters and validators fail on a cyclic input instead of overflowing the stack, and failure messages render the offending value safely.
- Packaging: source maps and `CAPABILITIES.md` now ship in the package; a test helper file no longer does.
```

### `@fgv/ts-json` (libraries/ts-json)

```markdown
## 5.1.0

### Patches

- Fix: `JsonEditor.mergeObjectInPlace`, converter-option merging and `JsonContextHelper.mergeContext` no longer throw on null-prototype objects.
- Packaging: source maps and `CAPABILITIES.md` now ship in the package.
```

### `@fgv/ts-bcp47` (libraries/ts-bcp47)

```markdown
## 5.1.0

### Patches

- Fix: validation failures render the offending value safely, so a cyclic input fails instead of throwing.
- Packaging: source maps and `CAPABILITIES.md` now ship in the package.

### Updates

- Upgrading from 5.0.2: the package is now dual-published — ESM for bundlers, CommonJS for Node. There is no API change.
```

### `@fgv/ts-res` (libraries/ts-res)

```markdown
## 5.1.0

### Breaking changes

- Upgrading from 5.0.2: `ResourceJson.Json.ConditionSetDeclAsRecord` is now readonly and partial. Code that builds one by assigning keys one at a time must build a `Record<string, …>` and assign it whole.
- Upgrading from 5.0.2: `QualifierCollector`'s protected constructor now takes `(qualifierTypes, qualifiers?)` instead of `(params)`; a subclass calling `super(params)` must pass the two values.

### Minor changes

- Qualifier-name-typed declarations: the resource and condition declaration types take an optional `TQualifierNames` parameter (default `string`), and matching `typed*` converters such as `ResourceJson.Convert.typedResourceTreeRootDecl(qualifierNameConverter)` validate qualifier names at load time.
- Importers accept `fileContentConverter` and `fileContentExtensions`, so resource files in another format — YAML, for example — can be imported.
- `QualifierCollector.create` accepts qualifier names as plain strings alongside full declarations (`qualifierTypes` is optional when every entry is a string), and the simple context qualifier providers accept partial `qualifierValues`.

### Patches

- Packaging: `CAPABILITIES.md` and source maps now ship in the package; test helper files no longer do.
```

### `@fgv/ts-res-ui-components` (libraries/ts-res-ui-components)

```markdown
## 5.1.0

### Patches

- Fix: resource editing no longer throws when a null-prototype value is replaced by a non-object, and now deletes a property named like an `Object.prototype` member (such as `toString`).
- Dependency updates: `json-edit-react` ~1.30.2 and `tslib` ^2.9.1.
- Packaging: the MIT `LICENSE` file, source maps and `CAPABILITIES.md` now ship in the package.
```

### `@fgv/ts-extras` (libraries/ts-extras)

```markdown
## 5.1.0

### Minor changes

- New `AiAssist` namespace: Result-returning LLM clients for OpenAI, Anthropic, Google Gemini, xAI, Groq, Mistral, Ollama and OpenAI-compatible servers — completion, streaming, image generation and embeddings, with model aliases (`@provider:role`) and quality tiers.
- ai-assist tool use and structured output: client-defined tools (`executeClientToolTurn`, `runClientToolLoop`), native structured output with an enforcement report, `generateJsonCompletion<T>` with fence-tolerant JSON parsing, prompt-cache requests and usage, and `resolveMaxOutputTokens`.
- New `CryptoUtils` namespace (also at `@fgv/ts-extras/crypto`): `ICryptoProvider` with `NodeCryptoProvider` — AES-256-GCM, PBKDF2, SHA-256, HMAC-SHA256, Ed25519 / ECDSA signing, X25519 key agreement, ECIES wrap, HPKE (`HpkeProvider`) — and strict base64 / hex helpers.
- `CryptoUtils.KeyStore` (also at `@fgv/ts-extras/crypto/keystore`): a password-protected encrypted vault for secrets, API keys and key pairs, with PBKDF2 or Argon2id password secrets and pluggable private-key storage such as `EncryptedFilePrivateKeyStorage`.
- New `SaferFetch` namespace (also at `@fgv/ts-extras/safer-fetch`): server-side fetch with a required address guard (`blockPrivateNetworks()` against SSRF), redirect, size, deadline and content-type controls, opt-in retry, and `createGuardedFetch` for streamed responses.
- New `Mustache` (`MustacheTemplate`, with selectable escaping and `renderWithSegments`), `Yaml` (`yamlConverter`) and `AsyncControl` (`raceStopConditions`, `WriteGate`) namespaces.
- Existing packlets: `Converters.isoDateTime` (a luxon `DateTime`); `ZipFileTree` reads raw bytes and strict UTF-8 text and adds `createZipFromFiles` / `createZipFromTextFiles`; `templateString`, `isoDate` and `isoDateTime` fail readably on cyclic or BigInt input instead of throwing.

### Patches

- Packaging: source maps and `CAPABILITIES.md` now ship in the package.

### Updates

- Upgrading from 5.0.2: new runtime dependencies `js-yaml` and `@types/luxon` (the published typings reference luxon's `DateTime`). The packlets that shipped in 5.0.2 — conversion, csv, experimental, hash, record-jar, zip-file-tree — changed only additively.
```

### `@fgv/ts-web-extras` (libraries/ts-web-extras)

```markdown
## 5.1.0

### Breaking changes

- Upgrading from 5.0.2: the package now requires the peer dependency `@fgv/ts-extras` — install `@fgv/ts-extras@^5.1.0` (npm 7 and later install peers automatically).
- Upgrading from 5.0.2: `FileApiTreeAccessors` no longer takes a type parameter, which was unused; drop the type argument.

### Minor changes

- New `CryptoUtils` namespace: `BrowserCryptoProvider`, a Web Crypto implementation of `@fgv/ts-extras`' `ICryptoProvider` that is byte-compatible with `NodeCryptoProvider`, plus `HpkeProvider` and `IdbPrivateKeyStorage`, an IndexedDB private-key backend for `KeyStore`.
- New writable, persistent browser `FileTree` backends: `LocalStorageTreeAccessors`, `HttpTreeAccessors` (the client for `@fgv/ts-http-storage`), and `FileSystemAccessTreeAccessors` with `DirectoryHandleStore`.
- New `SaferFetch.browserSaferFetchBytes` / `browserSaferFetchText` / `browserSaferFetchJson`, the browser entry points for `@fgv/ts-extras`' safer-fetch.

### Patches

- Packaging: the MIT `LICENSE` file and `CAPABILITIES.md` now ship in the package, test files no longer do. New runtime dependency `idb-keyval`.

### Updates

- Upgrading from 5.0.2: `BrowserHashProvider` is still exported at the root, and is now also available as `CryptoUtils.BrowserHashProvider`.
```

### `@fgv/ts-res-cli` (tools/ts-res-cli)

```markdown
## 5.1.0

### Patches

- Fix: the `ts-res-compile` command runs on Linux and macOS; in 5.0.2 the script had Windows line endings, so its `#!/usr/bin/env node` line failed.
- Dependency update: `commander` ^11.1.0.
- Packaging: the MIT `LICENSE` file and source maps now ship in the package.
```

### `@fgv/ts-res-browser` (tools/ts-res-browser)

```markdown
## 5.1.0

### Breaking changes

- Upgrading from 5.0.2: Node.js 22.22.0 or later is required (`engines.node` was `>=20.0.0`; Node 20 is no longer supported).

### Patches

- Dependency updates: React and React DOM ~19.3.1, `core-js` ~3.51.0, `json-edit-react` ~1.30.2, `serve-handler` ~6.1.7; the unused `crypto-browserify` dependency is removed.
- Packaging: the MIT `LICENSE` file now ships in the package.
```

### `@fgv/ts-res-browser-cli` (tools/ts-res-browser-cli)

```markdown
## 5.1.0

### Breaking changes

- Upgrading from 5.0.2: Node.js 22.22.0 or later is required (`engines.node` was `>=20.0.0`; Node 20 is no longer supported).

### Patches

- Dependency update: `commander` ^11.1.0.
- Packaging: the MIT `LICENSE` file now ships in the package.
```

### `@fgv/ts-random` (libraries/ts-random)

```markdown
## 5.1.0

### Minor changes

- Initial release: seeded, reproducible pseudo-random generation for test data, sampling, shuffles and procedural content. Not cryptographically secure — use `ICryptoProvider.generateRandomBytes` from `@fgv/ts-extras` for tokens, salts or keys.
- `Generator.PseudoRandomGenerator`: floats, integers, inclusive ranges, weighted booleans, strings and picks from candidate pools, reproducible from a string or numeric seed.
- Weighted choice: `pickWeighted` on the generator, and the pure `pickWeightedAt(unit, candidates)` for the same choice from a hash or stored draw.
- `GeneratorData` corpora: character classes (`Chars`) and word lists (`Words`) for readable identifiers and fixtures.
```

### `@fgv/ts-app-shell` (libraries/ts-app-shell)

```markdown
## 5.1.0

### Minor changes

- Initial release: React UI primitives for application shells, styled with Tailwind — add the package to your Tailwind `content` paths and import `@fgv/ts-app-shell/theme.css` (see the README).
- Layout: top bar, compact sidebar with filter rows and flyout selectors, master-detail column cascade, modal and confirm dialogs, drop zone and responsive helpers.
- Messages: toasts and a collapsible log panel filtered by `@fgv/ts-utils` log level, with `MessagesLogger` / `useLogReporter` bridging an `ILogger` into the panel.
- A keyboard-shortcut registry (`KeyboardShortcutRegistry`, `useKeyboardShortcuts`), plus a default light/dark theme of CSS-variable tokens with a Tailwind preset.
```

### `@fgv/ts-http-storage` (libraries/ts-http-storage)

```markdown
## 5.1.0

### Minor changes

- Initial release: the server side of the HTTP `FileTree` backend whose client is `@fgv/ts-web-extras`' `HttpTreeAccessors`.
- `createStorageRoutes` serves the storage REST contract as Hono routes over any `IHttpStorageProvider`; `FsStorageProvider` is the filesystem-backed provider.
- Wire converters for every request and response, and an opt-in `base64` content encoding for byte-faithful file contents.
```

### `@fgv/ts-prompt-assist` (libraries/ts-prompt-assist)

```markdown
## 5.1.0

### Minor changes

- Initial release: authoring, resolution and composition of LLM prompts that vary by context, built on `@fgv/ts-res` conditional resources and Mustache rendering.
- `PromptLibrary`: one YAML file per scope and prompt id, scope-chained resolution, slot bindings — including a slot bound to another prompt — and typed validation of JSON or free-text model output.
- `HorizontalComposer` merges several resolved prompts into one, with provenance ordering.
- Safety policies: length caps, pluggable screeners and an anti-jailbreak preface.
- Observation and caching: observers on every resolution, opt-in composition reports of what a prompt is made of, prompt-cache stability analysis, and `toCacheRequest` to place `@fgv/ts-extras` ai-assist cache breakpoints.
```

### `@fgv/ts-agent-memory` (libraries/ts-agent-memory)

```markdown
## 5.1.0

### Minor changes

- Initial release: a FileTree-backed storage and retrieval substrate for agent memory and knowledge — a vault of markdown records with YAML front matter that git can track.
- `FileTreeMemoryStore`: typed record bodies per kind, attributed edges, dedup, write policies, compare-and-set writes, and crash-safe atomic record writes on filesystem roots.
- Retrieval over an in-memory envelope index (by kind, tag, recency or rank), with semantic recall through the `IVectorIndex` and `IFragmentVectorIndex` seams and the in-memory cosine indexes.
- Index consistency: vector indexes report `size` / `has` and rebuild with a per-kind report, so a store can check its derived state against its records.
```

### `@fgv/ts-agent-memory-sqlite-vec` (libraries/ts-agent-memory-sqlite-vec)

```markdown
## 5.1.0

### Minor changes

- Initial release: durable vector indexes for `@fgv/ts-agent-memory`, backed by SQLite `vec0` (`better-sqlite3` + `sqlite-vec`), so a reopened vault answers queries without re-embedding. Node only.
- `SqliteVecVectorIndex` (one vector per record) and `SqliteVecFragmentIndex` (many per record) implement `IVectorIndex` and `IFragmentVectorIndex`.
- Both store an embedding identity in the index file, and `identity()` reports whether the stored vectors came from the model in use.
```

### `@fgv/ts-agent-tasks` (libraries/ts-agent-tasks)

```markdown
## 5.1.0

### Minor changes

- Initial release: recording and mediation of agent work — a task envelope with lifecycle, observation, command and recovery unions, and a kind and command registry. It records work; it runs no agent loop.
- `FileTreeTaskRepository`: crash-safe, one-record-atomic persistence with indexed queries, paging, due and owed-update selection.
- `TaskBroker`: principal-bound, authorized and projected access, external task sources reconciled in order, subscriptions with issued receipts, retention, and cascade stop over a task subtree.
- `TaskContextRenderer` and `checkTaskPrompt` / `prepareTaskPrompt` render task snapshots into bounded, cacheable prompt context with a receipt of exactly what was included.
- `createTaskTools`: model tools over the tasks a principal may see — read-only by default, with create, update, reassign, typed commands and stop requests opt-in.
```

### `@fgv/ts-extras-argon2` (libraries/ts-extras-argon2)

```markdown
## 5.1.0

### Minor changes

- Initial release: `NodeArgon2Provider`, an Argon2id key-derivation provider for Node backed by the `argon2` native binding — pass it to `@fgv/ts-extras`' `KeyStore` Argon2id password methods. For browsers, use `@fgv/ts-web-extras-argon2`.
```

### `@fgv/ts-web-extras-argon2` (libraries/ts-web-extras-argon2)

```markdown
## 5.1.0

### Minor changes

- Initial release: `BrowserArgon2Provider`, a pure-WASM Argon2id provider (via `hash-wasm`) that runs the same in browsers and Node — pass it to `@fgv/ts-extras`' `KeyStore` Argon2id password methods.
```

### `@fgv/ts-extras-re2` (libraries/ts-extras-re2)

```markdown
## 5.1.0

### Minor changes

- Initial release: `re2PatternValidator`, an RE2 (re2js) validator for JSON Schema `pattern` from sources you do not control, such as an MCP server's tool schema — linear-time matching, ECMA-262 meaning or refusal.
- Pass it as `patternValidator` to `JsonSchema.fromJson` or `adaptMcpTools`; `createRe2PatternValidator` sets the source-length and program-size limits.
```

### `@fgv/ts-extras-mcp` (libraries/ts-extras-mcp)

```markdown
## 5.1.0

### Minor changes

- Initial release: a Result boundary over `@modelcontextprotocol/sdk` that connects to MCP servers and adapts their tools into `@fgv/ts-extras` ai-assist client tools for `executeClientToolTurn`.
- Stdio, HTTP and custom transports; `connectMcpSession`, `listMcpTools`, `callMcpTool` and `closeMcpSession` with timeouts, cancellation and a classified `McpFailureReason`.
- `adaptMcpTools` converts each tool's input schema through `JsonSchema.fromJson`, and reports every tool it cannot adapt instead of failing the whole list.
```

### `@fgv/ts-extras-ollama` (libraries/ts-extras-ollama)

```markdown
## 5.1.0

### Minor changes

- Initial release: a Result boundary over the `ollama` JS library for the native Ollama API that its OpenAI-compatible endpoint cannot express. Node only; completion and tool use stay in `@fgv/ts-extras` ai-assist.
- Model management: `listModels`, `listRunning`, `showModel`, `deleteModel`, and `pullModel` with streamed progress.
- `chatStructured`: grammar-constrained structured output validated against a JSON schema.
```

### `@fgv/ts-extras-system-one` (libraries/ts-extras-system-one)

```markdown
## 5.1.0

### Minor changes

- Initial release: a Result boundary over `@typesafe-ai/sdk` for System-1 decision servers (CLM, openjev, Jev), which answer typed yes/no, choice and score questions with a distribution over closed candidates. Node only.
- `askSystemOne` validates every answer and classifies failures; `measureSystemOneInput` enforces a mandatory input bound before a request is sent.
```

### `@fgv/ts-extras-transformers` (libraries/ts-extras-transformers)

```markdown
## 5.1.0

### Minor changes

- Initial release: a Result boundary over `@huggingface/transformers` for running models locally in Node — `loadPipeline`, `classify`, `classifyAll`, `embed` and `summarize`. The browser sibling is `@fgv/ts-web-extras-transformers`.
```

### `@fgv/ts-web-extras-transformers` (libraries/ts-web-extras-transformers)

```markdown
## 5.1.0

### Minor changes

- Initial release: a Result boundary over `@huggingface/transformers` for running models locally in the browser — `loadPipeline`, `classify`, `classifyAll`, `embed` and `summarize`. The Node sibling is `@fgv/ts-extras-transformers`.
```

### `@fgv/ts-extras-webauthn` (libraries/ts-extras-webauthn)

```markdown
## 5.1.0

### Minor changes

- Initial release: a Result boundary over `@simplewebauthn/server` — `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions` and `verifyAuthenticationResponse` return `Result`s instead of throwing. The browser half is `@fgv/ts-web-extras-webauthn`.
```

### `@fgv/ts-web-extras-webauthn` (libraries/ts-web-extras-webauthn)

```markdown
## 5.1.0

### Minor changes

- Initial release: a Result boundary over `@simplewebauthn/browser` — `startRegistration` and `startAuthentication` return `Result`s instead of throwing. The server half is `@fgv/ts-extras-webauthn`.
```

### `@fgv/heft-dual-rig` (rigs/heft-dual-rig)

```markdown
## 5.1.0

### Minor changes

- First release on the 5.x lockstep line (previously published separately as 0.1.0): a Heft rig that dual-emits CommonJS (`lib/`) and ESM (`dist/`), and fails the build when Jest coverage thresholds are missed.
```

### `@fgv/typedoc-compact-theme` (plugins/typedoc-compact-theme)

```markdown
## 5.1.0

### Minor changes

- First release on the 5.x lockstep line (previously published separately as 1.0.0): a compact TypeDoc theme that renders API docs as tables, in the style of api-documenter.
```

### `@fgv/repo-template` (tools/repo-template)

```markdown
## 5.1.0

### Minor changes

- Initial release: the `repo-template` CLI for creating and maintaining Rush monorepos derived from this one — `create`, `sync`, `init-library`, `link` / `unlink` against a local checkout, `update-fgv-versions` and JSONC `patch`.
```
