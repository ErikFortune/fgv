# State — `testbed-web-scenarios`

## Phase B.2 — memory-tools-gate + local-summarization web enablement (this section, added post-PR-open)

### Status
Implementation + tests complete, 100% coverage, `rushx build`/`lint`/`test`/`build:web` all
green in `samples/testbed`. Overnight instruction from Erik (relayed by the orchestrator):
web-enable the two remaining non-Node-native CLI-only scenarios from the Phase B verdict
table (`memory-tools-gate`, `local-summarization`).

### What shipped

- **`memory-tools-gate`** — opted in via `cli.webRunnable: true` (the Phase B pattern, not a
  dedicated `web` component). Verification found the scenario's import graph
  (`@fgv/ts-agent-memory`'s `FileTreeMemoryStore` over an in-memory `FileTree`,
  `MemoryIndex`, `StructuredFilterRetriever`, `HybridRetriever`, `ScoreUnionMergeStrategy`,
  `createMemoryTools`, `BodyConverterRegistry`, `KnowledgeIdentityCodec`) is genuinely
  browser-clean — no Node-core imports anywhere in `@fgv/ts-agent-memory`'s `src/packlets/`,
  and `FileTree.inMemory` is already exercised in the web bundle (`web/App.tsx`'s
  `DATA_TREE`). The one real blocker was the mocked-stream helper's use of the Node-only
  `global` identifier (`global.fetch = ...`) — same class of issue as Phase B's
  `gate-deny-client-tools` fix. Fixed by swapping `global` → `globalThis` throughout
  (`installMockFetch`), matching the existing precedent exactly. `build:web` confirmed
  clean with the scenario opted in.
- **`local-summarization`** — ported to the dual-target `web` + `cli` shape (not
  `webRunnable`), matching `localClassifierSafety`/`localEmbeddingSearch`'s established
  B-3/B-4a pattern rather than the Phase B generic-runner pattern: this scenario already had
  a facade split (Node vs. browser transformers), so the existing dual-target precedent fit
  with less new surface than inventing a `webRunnable` CLI-panel wrapper around a
  `webpackIgnore` dynamic import.
  - New `summarizeAdapter.ts`: facade-agnostic `summarizeTranscript(summarizer, transcript,
    summarizeFn, options?)`, mirroring `embedAdapter.ts`'s injection shape (`SummarizeFn`
    type + type-only facade imports). Reduces the upstream `SummarizationOutput` to
    `{ summary, ratio }` (compaction percentage vs. the original transcript length).
  - `index.tsx` (renamed from `index.ts`): web component (`LocalSummarizationComponent`)
    loads the pipeline on mount via the browser facade (`@fgv/ts-web-extras-transformers`),
    mirrors the classifier/embedding loading-state UX (`initialize()` pre-warms a
    module-level cache; the component reuses it or falls back to a fresh `loadPipeline`
    call). Displays the fixed sample transcript (no user-editable input, matching the
    original CLI scenario's fixed-fixture shape) + a "Summarize" button + the resulting
    summary/ratio. CLI path unchanged in behavior (still loads the Node facade via a
    `webpackIgnore` dynamic import), refactored to share `summarizeTranscript`.
  - One `c8 ignore` (approved-pattern precedent): `handleSummarize`'s
    `summarizer === null` guard is unreachable via the UI (the Summarize button's
    `disabled` condition already excludes it) — same shape and justification as
    `KeyStoreSection.tsx`'s existing `!file` guard directive from Phase B.1.
  - Test file rewritten to the `localEmbeddingSearch.test.ts` template (both facades
    mocked, web component tests via `@testing-library/react`, `initialize()` tests, CLI
    `run()` tests unchanged in substance, scenario-shape tests updated for the dual
    `web`+`cli` impl).
- **Addendum (Copilot round 3, relayed by the orchestrator, folded into this commit):**
  - `web/KeyStoreSection.tsx`: the file-picker and password inputs had no accessible name.
    Added `aria-label="KeyStore file"` / `aria-label="KeyStore password"` (mirrors
    `App.tsx`'s existing `aria-label` usage rather than adding new visible `<label>`
    elements, since neither input currently has one).
  - `shell/secretResolver.ts`: the missing-secret diagnostic's env-var clause was always
    singular ("the X environment variable"), which read wrong once `fallbackEnvVarNames`
    could carry more than one entry. Now branches: `the X environment variable` (one var)
    vs. `the X/Y environment variables` (two or more). Added singular/plural regression
    tests to `secretResolver.test.ts`.

### Browser-cleanliness verdict table update

The Phase B section's verdict table (below) has been updated in place:
`memory-tools-gate` moves from **Not opted in** to **Opted in** (`webRunnable: true`,
`global` → `globalThis` fix); `local-summarization` moves from **Not opted in** to **Ported
to dual-target** (`web` + `cli`, matching the B-3/B-4a pattern rather than `webRunnable`).

---

## Phase B.1 — KeyStore import in the web shell

### Status
Implementation + tests complete, 100% coverage, `rushx build`/`lint`/`test`/`build:web` all
green. Layer-1 `code-reviewer` pass run on the diff (second pass on this branch, covering
this feature on top of the already-reviewed generic-runner-panel commit); two P2 findings
fixed, discretionary P3 applied — see the summary below.

### What shipped

- **`web/openKeyStore.ts`** (new): `openKeyStoreFromFile(file, password)` — reads the file
  (`captureAsyncResult(() => file.text())`), parses + validates it as a keystore vault in one
  step (`Converters.stringifiedJson<IKeyStoreFile>(CryptoUtils.KeyStore.Converters.keystoreFile)`
  — no manual `JSON.parse` + cast), opens it with a fresh `BrowserCryptoProvider` (from
  `@fgv/ts-web-extras`), and unlocks it with the supplied password
  (`.thenOnSuccess(async (ks) => ks.unlock(password))`). The error-format chain is nested per
  step (`.withErrorFormat` for the file-read step is applied before the `.onSuccess` that
  moves into the parse/validate step, and the parse/validate step's own `.withErrorFormat` is
  applied *inside* that `.onSuccess` callback, not chained flat afterward) — a flat chain would
  let the "Invalid keystore file: " label re-wrap a file-*read* failure too (caught by layer-1
  review; see the summary below). Every failure mode (unreadable file, malformed JSON, wrong
  vault format, incorrect password) surfaces as a friendly `Result` failure with an
  unambiguous, non-doubly-wrapped label — nothing throws. `CryptoUtils.KeyStore.KeyStore`/
  `Converters`/`IKeyStoreFile` come from `@fgv/ts-extras`'s `CryptoUtils` namespace, whose
  barrel also exports the Node-only `NodeCryptoProvider` (imports `node:crypto`) — verified via
  `rushx build:web` (clean) and a direct grep of the built `dist-web/bundle.js` for
  `node:crypto` (zero matches) that tree-shaking excludes it from the browser bundle, matching
  the precedent already established by `shell/secretResolver.ts`'s pre-existing
  `CryptoUtils.KeyStore.KeyStore` type usage.
- **`web/KeyStoreSection.tsx`** (new): the Secrets modal's "Open KeyStore" UI — file input +
  password input + Unlock button when locked; "KeyStore unlocked (N secrets)" status (via
  `listSecrets()`) + Lock button when a `keyStore` is supplied. The password field is cleared
  after every unlock attempt, success or failure. A shared `canUnlock` boolean backs both the
  Unlock button's `disabled` condition and `handleUnlock`'s early-return guard so the two can't
  drift apart (P3 from layer-1 review). One remaining `c8 ignore`: the `!file` check inside
  that guard (the button's `disabled` already excludes `!canUnlock`, which folds in
  `file === undefined` — the check is unreachable via the UI, kept purely for TypeScript's
  narrowing of `file: File | undefined` before the `File`-typed call to
  `openKeyStoreFromFile`). `handleLock` now takes the KeyStore instance as a parameter
  (`(ks: CryptoUtils.KeyStore.KeyStore) => void`, invoked as `onLock={() => handleLock(keyStore)}`
  from inside the `keyStore ?` truthy branch) instead of closing over the possibly-`undefined`
  prop — this eliminated the `keyStore?.lock(true)` optional-chaining branch and its `c8 ignore`
  entirely (P2 from layer-1 review: an eliminable branch, not just a defensible one).
- **`web/SecretsModal.tsx`**: additive `keyStore` / `onKeyStoreUnlocked` / `onKeyStoreLocked`
  props; renders `<KeyStoreSection>` above the existing per-secret paste fields.
- **`web/App.tsx`**: `TestbedShell` now holds
  `const [keyStore, setKeyStore] = useState<CryptoUtils.KeyStore.KeyStore | undefined>(undefined)`,
  wired into both `IScenarioContext.keyStore` (previously hardcoded `undefined`) and the
  `resolveSecret({ spec, keyStore, sessionSecrets, getEnvVar })` call. `keyStore` joins
  `secrets` in the `scenarioContext` `useMemo` deps array, so `resolveSecret`'s closure
  identity changes — and dependent scenario effects re-resolve — on either a session-secret
  save or a KeyStore open/lock (same reactivity pattern, one more trigger). No id remapping:
  secret ids stay the library-convention ids already used by `ISecretSpec.id`
  (`openai-api-key`, `anthropic-api-key`, etc.), so a KeyStore built with those same ids
  Just Works with `resolveSecret`'s existing KeyStore-first order — unchanged.
- **`config/jest.setup.js`**: two additive jsdom polyfills, both guarded so they only kick in
  when the real implementation is missing (never clobber): (1) swaps `global.crypto` for
  Node's `webcrypto` when `crypto.subtle` is absent — mirrors `@fgv/ts-web-extras`'s own jest
  setup verbatim, needed because this jsdom version's built-in `crypto` lacks the Web Crypto
  `subtle` API `BrowserCryptoProvider` requires; (2) polyfills `Blob.prototype.text` via
  `FileReader` (which jsdom does implement) since this jsdom version's `File`/`Blob` has no
  `.text()` — real browsers do. Both let the KeyStore tests exercise the real production code
  path (`file.text()`, real WebCrypto-backed `BrowserCryptoProvider`) rather than mocking
  around the gap.
- **Tests**: `openKeyStore.test.ts` (5 tests — success, wrong password, non-JSON file,
  well-formed-but-wrong-shape JSON, unreadable file), `KeyStoreSection.test.tsx` (9 tests —
  render states, Unlock disabled/enabled transitions, success, wrong-password error + clears
  the stale error on file reselect, secret-count pluralization, Lock), plus a new "TestbedShell
  KeyStore wiring" describe block in `App.test.tsx` (2 tests — full unlock flow through
  `TestbedShell` proving a scenario's `resolveSecret` sees the KeyStore-resolved value and the
  readout refreshes on unlock, and that Lock clears `context.keyStore` and the readout reverts
  to failed). All keystore fixtures are built via the **real** `KeyStore.create()` /
  `initialize()` / `importApiKey()` / `save()` calls — no mocking of the `KeyStore` class
  itself, per the "use the real classes, not mocks of them" directive.

### Layer-1 `code-reviewer` summary (this feature)

Ran on the KeyStore-import diff on top of the already-reviewed generic-runner-panel commit.
No P1 findings. Two P2s (both fixed) and one discretionary P3 (applied):

- **P2-1 (real bug, fixed):** `openKeyStore.ts`'s error-format chain was flat
  (`.withErrorFormat(A).onSuccess(...).withErrorFormat(B).onSuccess(...)`), so `B`'s
  `.withErrorFormat` re-wrapped *any* upstream failure still in flight — including a file-read
  failure that had nothing to do with the parse/validate step. Empirically: an unreadable file
  produced `"Invalid keystore file: Failed to read keystore file: boom"` — the "Invalid
  keystore file:" label is misleading on a file that was never read, let alone parsed. Fixed by
  nesting the second `.withErrorFormat` inside the `.onSuccess` callback that owns that step, so
  it only ever labels that step's own failures. Verified with two anchored regex assertions
  (`toFailWith(/^Failed to read keystore file:.../)` and `toFailWith(/^Invalid keystore
  file:.../)`) that would catch a regression back to the flat-chain shape.
- **P2-2 (design simplification, fixed):** `KeyStoreSection.tsx`'s `handleLock` closed over the
  `keyStore` prop (`CryptoUtils.KeyStore.KeyStore | undefined`) and used `keyStore?.lock(true)`
  with a `c8 ignore` on the optional-chaining branch — defensible (the Lock button only renders
  when `keyStore` is truthy) but eliminable: `UnlockedStatus` already only mounts inside the
  `keyStore ?` truthy branch, so the narrowed non-undefined instance can be passed straight into
  the handler. Changed `handleLock` to `(ks: CryptoUtils.KeyStore.KeyStore) => void`, invoked as
  `onLock={() => handleLock(keyStore)}` from the truthy branch. This removed the `?.` and its
  `c8 ignore` directive entirely rather than just re-justifying it.
- **P3 (applied):** factored the duplicated `!file || password.length === 0` condition (the
  Unlock button's `disabled` expression and `handleUnlock`'s early-return guard) into one shared
  `canUnlock` boolean, so the two conditions can't silently drift apart in a future edit.

All fixes verified: `rushx build` / `lint` / `test` (100% branches/lines/functions/statements)
/ `build:web` all green after applying every fix, with the anchored regression tests for P2-1
passing.

### Copilot round 2 (PR #570) — fixed

Four comments (relayed by the orchestrator — no direct GitHub access in this session):

- **MEDIUM (fixed):** `KeyStoreSection.tsx`'s unlock handler's `.then`/`.catch` unconditionally
  called `setIsUnlocking`/`setPassword`/`setError` after the async `openKeyStoreFromFile`
  resolved — if the Secrets modal closed mid-unlock (`Modal` returns `null` when closed,
  unmounting `KeyStoreSection`), the resolution would update state on an unmounted component
  (React warning). Added an `isMountedRef` guard (`useRef(true)` + a `useEffect` cleanup
  setting it `false`), mirroring `ScenarioHost`'s `active`-flag pattern, checked at the top of
  both the `.then` and `.catch` callbacks. Added a dedicated test
  (`KeyStoreSection.test.tsx`, "unmounting mid-unlock…") that spies on the
  `openKeyStore` module to get a deferred promise, unmounts before resolving it, and asserts
  both that `onUnlocked` never fires and that no "not wrapped in act" / "unmounted component"
  warning reaches `console.error`.
- **LOW × 3 (fixed):** `import { CryptoUtils } from '@fgv/ts-extras'` was type-position-only
  in `SecretsModal.tsx`, `App.tsx`, and `KeyStoreSection.tsx` (used only as
  `CryptoUtils.KeyStore.KeyStore` in type annotations, never as a runtime value in those three
  files) — changed all three to `import type { CryptoUtils } from '@fgv/ts-extras'` so no
  runtime binding is pulled into the bundle. `openKeyStore.ts` genuinely calls
  `CryptoUtils.KeyStore.KeyStore.open(...)` / `CryptoUtils.KeyStore.Converters.keystoreFile` at
  runtime — left as a value import there.

All fixes verified: `rushx build` / `lint` / `test` (100%, 450 tests) / `build:web` all green.

---

## Phase B — generic web runner

### Status
Implementation + tests complete, 100% coverage, `rushx build`/`lint`/`test`/`build:web` all
green. Layer-1 `code-reviewer` pass run on the final diff; findings resolved/dispositioned
below. PR open against `release`; Copilot loop in progress.

### What shipped

- **`shell/index.ts`**: additive `ICliScenarioImpl.webRunnable?: boolean`. Absent/false =
  current CLI-only behavior; `true` (with no `web` impl) opts the scenario into the shell's
  generic runner panel.
- **`web/ScenarioRunnerPanel.tsx`** (new): the shell-generic runner panel. Resolves each
  `requiredSecrets` entry via `context.resolveSecret` (loading/ready/missing status per spec,
  "Open Secrets (top bar)" affordance on missing — mirrors Phase A's `ChatSettingsPanel`
  pattern), a Run button (disabled while in flight), an elapsed-time ticker, and the
  `Result<string>` report (monospace `<pre>` on success, `status-error` styling on failure).
  Mirrors `aiProviderSecrets.ts`'s `useProviderApiKey` for the re-resolve-on-identity-change
  pattern and `App.tsx`'s `ScenarioHost` for the mounted-guard / effect-cleanup pattern.
- **`web/App.tsx`**: `ScenarioHost`'s lifecycle state machine gained a `'runner'` state —
  when `!scenario.web && scenario.cli?.webRunnable === true`, renders `ScenarioRunnerPanel`
  instead of the CLI-only "no-web" panel. No change to the `web`-impl or plain-CLI paths.
- **Nine scenarios opted in** (`webRunnable: true`), each verified browser-clean via
  `rushx build:web` (no Node-core/Node-native static imports) and switched from direct
  `process.env` reads to `context.resolveSecret` (required — browsers have no
  `process.env`, and `rushx build:web`'s webpack config deliberately has no Node-core
  fallback stubs, so a leaked Node-only *import* fails the build, but a bare `process.env`
  *reference* only throws at runtime, so this needed a manual audit, not just the build gate):
  - `anthropic-client-tools`, `openai-client-tools`, `gemini-client-tools`,
    `xai-client-tools`: switched from `process.env.<X>_API_KEY` to
    `resolveProviderApiKey(context, providerId)` (the existing Phase A helper in
    `aiProviderSecrets.ts` — no new secret ids invented).
  - `gate-deny-client-tools`: no secrets; the only change was `global.fetch` →
    `globalThis.fetch` for the mocked-stream setup (`global` is a Node-only identifier —
    absent in a browser bundle — while `globalThis` is universal and behaves identically
    on Node, since `globalThis === global` there).
  - `openai-model-tiers`, `anthropic-model-tiers`, `google-gemini-model-tiers`: replaced
    the env-var-list lookup inside the c8-ignored `buildLiveComplete` live-completion seam
    with a new exported, directly-tested `resolveTierApiKey(context, specs)` that walks
    `context.resolveSecret` over the scenario's own `requiredSecrets` (first success wins).
  - `cross-provider-embedding-search`: the scenario's config parser
    (`parseEmbeddingScenarioConfig`) is env-driven with several non-secret CLI-only knobs
    (`EMBED_PROVIDER`/`EMBED_MODEL`/`EMBED_DIMENSIONS`/`EMBED_ENDPOINT` — no per-scenario
    config UI exists in the generic runner panel). Added `readNodeEnv()` (reads `process`
    off `globalThis` via property access, never a bare identifier, so it resolves to `{}`
    in a browser instead of throwing) and `resolveKeyOrEnvFallback()` (resolves the
    provider key via `context.resolveSecret`, falling back to the CLI env value). The
    browser run always exercises the default (openai, no dimension/endpoint override)
    path; noted in the scenario description.

### Browser-cleanliness verdicts (per the brief's candidate list)

| Scenario | Verdict | Notes |
|---|---|---|
| `anthropic-client-tools` | Opted in | Clean import graph; `resolveProviderApiKey` swap for secrets. |
| `openai-client-tools` | Opted in | Same. |
| `gemini-client-tools` | Opted in | Same. |
| `xai-client-tools` | Opted in | Same. |
| `gate-deny-client-tools` | Opted in | No secrets; `global.fetch` → `globalThis.fetch` fix. |
| `openai-model-tiers` | Opted in | `resolveTierApiKey` swap; `build:web` clean. |
| `anthropic-model-tiers` | Opted in | Same. |
| `google-gemini-model-tiers` | Opted in | Same. |
| `cross-provider-embedding-search` | Opted in | `readNodeEnv`/`resolveKeyOrEnvFallback`; browser run is openai-default-only. |
| `sqlite-vec-memory-persistence` | **Not opted in** | Excluded per brief (`better-sqlite3` native binding). |
| `sqlite-vec-fragment-persistence` | **Not opted in** | Excluded per brief (same). |
| `mcp-probe` | **Not opted in** | Excluded per brief (`@fgv/ts-extras-mcp` stdio transport spawns subprocesses). |
| `local-summarization` | **Ported to dual-target** (Phase B.2) | `web` + `cli` (B-3/B-4a pattern, not `webRunnable`); `summarizeAdapter.ts` facade injection; browser facade `@fgv/ts-web-extras-transformers`. |
| `memory-tools-gate` | **Opted in** (Phase B.2) | `@fgv/ts-agent-memory` import graph audited — browser-clean; `global.fetch` → `globalThis.fetch` fix (same class as `gate-deny-client-tools`). |

### Layer-1 `code-reviewer` summary

Ran the `code-reviewer` agent twice on the final diff (two independent passes, both via
the Agent tool, both returned via the async completion-notification path rather than a
synchronous tool result — an environment quirk, not a process skip). Both passes
**Approved**, no P1 findings.

- **P2-1 (fixed):** the "process absent" browser-simulation test in
  `crossProviderEmbeddingSearch.test.ts` deleted/restored `globalThis.process` without a
  `try/finally`, so a thrown setup error between delete and restore could leak the
  deletion into later tests in the file. Wrapped the setup + `cli.run(...)` invocation in
  `try { ... } finally { globalThis.process = originalProcess; }`.
- **P2-2 (fixed):** `App.tsx`'s new `'runner'` lifecycle branch in `ScenarioHost` was only
  *incidentally* covered — the 100% coverage number came from the generic full-registry
  smoke test happening to land on a `webRunnable` scenario first, not from a dedicated
  assertion. Added two direct tests in `App.test.tsx` mirroring the existing `'no-web'`
  test: one confirming `ScenarioRunnerPanel` renders when `cli.webRunnable === true` and
  no `web` impl, one confirming the `'no-web'` panel still renders when
  `cli.webRunnable === false`.
- **P2-3 (dispositioned, not fixed):** `crossProviderEmbeddingSearch`'s browser path only
  resolves `gemini-api-key` (not a `google-api-key` fallback, unlike
  `aiProviderSecrets.ts`'s `PROVIDER_SECRET_SPECS`). Impact is zero today — `EMBED_PROVIDER`
  is a CLI-only knob and the browser run always defaults to `openai` (documented in the
  scenario's own doc comment) — so the Gemini branch is unreachable from the web runner
  panel regardless. Left as a follow-up if `EMBED_PROVIDER` selection ever becomes
  browser-configurable.
- **P3 items** (duplicated secret-resolution shapes across `resolveProviderApiKey` /
  `resolveTierApiKey` / `resolveKeyOrEnvFallback`; a doc-comment precision nit on
  `readNodeEnv`; the `cli` tag left on `cross-provider-embedding-search` despite being
  web-runnable now): noted, not fixed — genuinely different fallback semantics per call
  site, and no functional impact. Candidates for a future consolidation pass if a fourth
  consumer of the same shape shows up.

All fixes verified: `rushx build` / `lint` / `test` (100% branches/lines/functions/statements)
/ `build:web` all green after applying both fixes.

### Runbook (for the PR description)

**Without any keys configured:**
1. Open the testbed web app, select any of the 9 web-runnable scenarios from the sidebar.
2. The runner panel shows each required secret as "not set — Open Secrets (top bar) to add
   one" (or "requires no secrets" for `gate-deny-client-tools`).
3. Click Run. `gate-deny-client-tools` (mocked stream, no live API) succeeds regardless.
   The other 8 fail immediately with a clear "Secret '<id>' is not set…" diagnostic —
   no crash, no hang.

**With keys configured (via the Secrets modal, top bar):**
1. Paste a provider key into the relevant field(s); the runner panel's secret status
   flips to "configured" within a render (re-resolves on the session-secrets-store
   identity change).
2. Click Run — button disables, shows "Running…" + a ticking elapsed-seconds readout.
3. On completion: success renders the scenario's `Result<string>` report in a monospace
   block; failure (e.g. a CORS-restricted provider, or a live API error) renders in the
   error-styled block. Known CORS caveat: provider descriptors carry
   `streamingCorsRestricted`/similar flags; a scenario that fails for CORS reasons in the
   browser is an accepted, loudly-surfaced outcome per the brief (not a bug in this
   stream).

### Open questions / follow-ups

- `memory-tools-gate`'s browser-cleanliness was verified and it was opted in in Phase B.2
  (see the verdict table above and the Phase B.2 section at the top of this file).
- The `cross-provider-embedding-search` browser run only ever exercises the default
  OpenAI path (no per-scenario config UI to select `EMBED_PROVIDER=gemini` etc. from the
  browser) — acceptable per the brief's "no bespoke per-scenario UI" constraint, but a
  future generic "advanced knobs" affordance on the runner panel could close this gap if
  Erik wants full parity.

---

# Phase A (below)

## Status
Implementation + scenario-driven tests complete. About to run layer-1 `code-reviewer`
pass before closing remaining coverage gaps (per TESTING_GUIDELINES sequencing).

## What shipped

### Shell secret story (`samples/testbed/src/shell/`)
- `secretResolver.ts`: replaced the B-1 stub with a real implementation. Resolution
  order: unlocked KeyStore (if present and holds the secret) → session-memory secrets
  map (new, optional `sessionSecrets` param) → env-var fallback. `keyStore` stays
  `undefined` on both web and CLI in this phase (per brief design decision 1); the
  KeyStore branch is honored because the param already existed, not newly added.
- `sessionSecretsStore.ts` (new): `dedupeRequiredSecrets(scenarios)` (pure, dedupes
  `requiredSecrets` across the registry by id) and `useSessionSecretsStore()` (React
  hook holding a `ReadonlyMap<string,string>` in state; `setSecret` produces a new Map
  identity on every update — this identity change is the reactivity signal scenario
  effects key off via `context.resolveSecret`'s closure identity).
- Both re-exported from the `shell/index.ts` barrel (matching the existing
  barrel-only-import convention observed across the package).

### Web shell mount (`samples/testbed/src/web/`)
- `SecretsModal.tsx` (new): renders `@fgv/ts-app-shell`'s `Modal` listing one field per
  deduped required secret (session-memory only, explicit no-persistence copy in the
  modal body).
- `App.tsx`: added a "Secrets" button to the top bar (opens the modal), wired
  `useSessionSecretsStore()` into `TestbedShell`, and rewired `scenarioContext.resolveSecret`
  to pass `sessionSecrets: secrets` with `secrets` in the `useMemo` deps (so the
  `resolveSecret` closure identity changes whenever a secret is saved). Removed the two
  stale `/* c8 ignore */` comments referencing the B-1 stub (now real code paths, both
  covered by tests).
- `cli.ts`: removed a stale `c8 ignore` comment on the `getEnvVar` callback (now a real,
  exercised path — the CLI's `resolveSecret` call already passed `getEnvVar` before this
  phase, but it never had an effect until the stub was replaced).

### Two new scenarios
- `scenarios/aiProviderSecrets.ts` (new, shared by both scenarios): `PROVIDER_SECRET_SPECS`
  maps `AiAssist.AiProviderId` → the *existing* CLI secret ids (`openai-api-key`,
  `anthropic-api-key`, `gemini-api-key`/`google-api-key`, `xai-api-key` — verified against
  `modelTiers/index.ts` and the `*ClientTools` scenarios, no new ids invented).
  `requiredSecretsForProviders`, `resolveProviderApiKey`, `SingleSecretKeyStore` (a
  from-scratch re-implementation of the sample's `InMemoryKeyStore` shape — the sample
  itself is untouched, per the brief), and `useProviderApiKey` (a hook that resolves +
  tracks the current provider's key, re-resolving on provider change or on
  `context.resolveSecret` identity change).
- `scenarios/imageGeneration/` (`index.tsx`, `SettingsPanel.tsx`, `PromptPanel.tsx`,
  `ImageResults.tsx`): web-only port of the sample's image mode. **No CLI** (a live key
  can't be embedded in the CLI's non-interactive run, and the sample itself has no CLI
  surface). No per-scenario API-key input — `SettingsPanel` shows a "no key configured —
  open Secrets" affordance instead, per design decision 3.
- `scenarios/streamingChat/` (`index.tsx`, `SettingsPanel.tsx`, `ChatPanel.tsx`,
  `promptLibrary.ts`): web-only port of the sample's chat mode + the `ts-prompt-assist`
  tone demo (near-verbatim port of `promptLibrary.ts`). Same no-per-scenario-key-input
  pattern.
- Both registered in `scenarios/index.ts`.

## Surprises / deviations from the sample

1. **The `ai-assist` image-generation API has moved on since the sample was written.**
   The sample (`samples/ai-image-gen-sample`) builds via `webpack --mode production`
   with `babel-loader` only — no `tsc` type-check step — so it silently went stale
   against the current `IAiImageGenerationOptions` shape. Concretely: `.imagen` (the
   field the sample uses for aspect ratio) no longer exists, `'gemini-imagen'` is no
   longer a valid `AiImageApiFormat` (replaced by `'gemini-image-out'`), and
   `GptImageSize` dropped the DALL-E-3-era `'1024x1792'`/`'1792x1024'` values in favor of
   `'1024x1024' | '1536x1024' | '1024x1536' | 'auto'`. The ported `PromptPanel.tsx` uses
   the **current** layered-options API instead of a line-for-line port: OpenAI sizing
   stays a top-level `options.size`; Gemini Flash Image and xAI Grok Imagine aspect
   ratio now go through `options.models: [{ provider, family, config: { aspectRatio } }]`
   blocks. This is a necessary adaptation for testbed (which *does* type-check on
   `rushx build`), not scope creep — I did not touch the sample itself. Flagging for
   Erik: the sample itself would fail a real `tsc` pass today and may be worth a
   separate follow-up (not this stream — out of scope per the brief, "do not modify the
   sample").
2. **Dropped the `provider` prop from the ported `PromptPanel`** — it existed in the
   sample only to print a "dall-e-3 only accepts 1" hint, which is stale given the
   #568 rotation (gpt-image-2, not dall-e-3). Replaced with a capability-driven
   `maxCount` hint instead, which is correct for whatever model is actually resolved.
3. **No secrets-modal `openSecrets()` context callback.** The design decision 3 wants a
   "missing key — open Secrets" affordance; I implemented it as static text pointing at
   the top-bar button rather than adding a new `IScenarioContext` field to
   programmatically open the modal. Simpler, and the Sequencing note's bar
   ("`resolveSecret` unchanged is enough for the Phase B runner") is satisfied either
   way — this is a UX-only choice, easy to upgrade to a callback later if Erik wants
   one-click affordance instead of "look at the top bar".
4. **`SingleSecretKeyStore` + `useProviderApiKey` are shared** between the two new
   scenarios (`scenarios/aiProviderSecrets.ts`) rather than duplicated — both scenarios
   need identical "resolve the current provider's key, rebuild a one-entry
   `IAiAssistKeyStore` adapter" logic.

## Test coverage status (pre-code-reviewer)

Full `rushx test` run: 380 passed, 0 failed.
- `shell/`, `web/App.tsx`, `web/SecretsModal.tsx`, `scenarios/aiProviderSecrets.ts`: 100%.
- `scenarios/imageGeneration/*`: ~98% statements, ~80% branches.
- `scenarios/streamingChat/*`: ~96% statements, ~78% branches.
- Aggregate: 99.31% stmts / 94.2% branches / 96.55% funcs / 99.31% lines.

Remaining gaps are mostly defensive branches (unmount guards, `?? undefined` fallbacks
already covered elsewhere) — will categorize properly in the coverage-closure pass
*after* the code-reviewer pass, per the load-bearing TESTING_GUIDELINES ordering.

## Open questions / follow-ups for the orchestrator

- ~~Whether to retire `samples/ai-image-gen-sample` is explicitly Erik's call after
  validating parity (brief decision 4) — not touched.~~ **RESOLVED 2026-07-27: Erik
  validated parity and called retirement — the sample is deleted (project removed from
  `rush.json`, TECH_DEBT P3 port entry closed). The testbed is the canonical sample app.**
- ~~The sample's own type drift (see surprise #1) might warrant a separate small fix
  stream~~ — mooted by retirement.
- Phase B (generic web runner) is next, per the brief's sequencing note. The
  `resolveSecret`/session-secrets-store shape should be consumable unchanged by a
  runner panel since scenarios only ever go through `context.resolveSecret`.
