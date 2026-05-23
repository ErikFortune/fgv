# Stream brief: `local-ai-exploration`

**Status:** 🟢 ready to commission
**Integration branch:** `local-ai-exploration` (off `release`)
**Workflow shape:** design-triage-implement-refine cluster
**Package surface:**
- **New:** `samples/testbed/` (sample browser app, web + CLI)
- **New (provisional):** `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` (Result-integration boundary over `@huggingface/transformers`)
- **Touch (additive):** `docs/FUTURE.md`, `docs/TECH_DEBT.md`, `docs/WORKSTREAMS.md`

---

## Mission

Two intertwined goals, deliberately:

1. **Build a long-lived sample browser app (`samples/testbed`)** as the canonical home for fgv-capability scenarios. Web-first; CLI-secondary. Sample-browser UX: sidebar lists scenarios by category, main area mounts selected scenario, collapsible message panel at bottom. Grows over time as fgv adds capabilities or as we want a worked example of an existing one.

2. **Use that testbed to evaluate whether a Result-shaped facade over `@huggingface/transformers` (per the local-models research note) earns its keep.** The research recommended Option 2 (sibling Result-integration packages mirroring the `@fgv/ts-extras-webauthn` discipline) but noted the wrapper is so thin that consumers could trivially write it themselves. The testbed gives us a concrete consumer in which to test that thinness.

**Done-or-discard decision criteria — locked at B-3 exit, before B-4 is commissioned:**

- Does the facade let scenario code read meaningfully cleaner than `pipeline()` direct?
- Does the boundary survive when a second scenario pulls in a different model type (classifier vs embedder vs small generator)?
- Does Result composition with the rest of fgv feel natural (e.g. composing with ts-prompt-assist's safety backend)?

If all yes → ship the facade as a real package pair. If meaningful friction → abandon the facade, pivot the scenario to consume `@huggingface/transformers` directly, document the decision in `phase-result.md`, **keep the sample**.

---

## Required reading (decision-track input)

1. **`.ai/notes/orchestrator/research/local-models-incorporation.md`** (on `local-ai-exploration`) — the research note that frames the three options and recommends Option 2 with timing "next open stream slot, not urgent."
2. **`@fgv/ts-extras-webauthn` + `@fgv/ts-web-extras-webauthn`** (production code in `libraries/`) — the canonical Result-integration boundary pattern. Six primitives; zero opinionated orchestration; explicit "NOT in scope" list. The transformers facade mirrors this exactly.
3. **`@fgv/ts-app-shell`** (production code in `libraries/ts-app-shell/`) — packlets confirmed available for testbed: `messages` (MessagesProvider, useLogReporter, StatusBar, ToastContainer), `url-sync` (useUrlSync), `top-bar`, `modal`, `sidebar`, `keyboard`. All needed shell primitives exist; no extension required.
4. **`tools/ks/`** — `ks` CLI tool. The testbed's CLI shell mirrors its env-var conventions verbatim (`FGV_KS_PASSWORD` / `KS_PASSWORD`; `~/.fgv-ks`; `--keystore` / `--password-env` / `--password-file` / `--password-stdin` flags).
5. **Chocolate-lab recon findings** (in this brief; see "Patterns inherited from chocolate-lab" section below) — data-pipeline pattern, keystore-on-web pattern, sample-browser shell pattern.
6. **`.ai/instructions/CODING_STANDARDS.md` § "Extending Core Libraries Over Working Around Them"** — fgv discipline around when to extend libraries vs add new ones. The gap-then-fix tenet in this brief operationalizes that discipline at sample-author scale.

---

## Tenets (binding for the testbed)

1. **Showcase fgv best practices at the latest revision.** Result pattern everywhere; Converters/Validators for untyped input; ILogger/LogReporter for observability; FileTree for I/O; bcp-47 for any locale-touching code; ts-res for any context-conditional behavior; ts-prompt-assist for any prompt resolution. No exceptions for sample-class brevity.

2. **Gap-then-fix tenet — load-bearing.** If a scenario discovers a missing or broken fgv capability, the answer is:
   - **Preferred:** extend/fix fgv first, then continue the scenario. Surface as a separate small PR before continuing the testbed work if the extension is non-trivial.
   - **Fallback:** apply a workaround in the scenario, tag with `// TESTBED-WORKAROUND: <description> — see <work-item-link>`, and file the tracked work item.
   - **Never:** build complicated sample-only behavior that a real consumer would also need. If the scenario is reaching for download primitives, FileTree adapters, secret-resolution helpers, ILogger backends — those go in `@fgv/*` libraries, not in the testbed.

3. **Sample-browser UX.** Web shell is a browse-select-run experience, not a single-purpose demo. Scenarios are first-class entities with searchable/filterable metadata. Adding a new scenario is a single-file (plus one-line registration) PR; the UX exposes it automatically.

4. **Documentation in code.** Use comments to explain subtle or complex parts (e.g. why a particular fgv primitive was chosen; what convention is being demonstrated). Avoid unnecessary clutter — sample code should READ as exemplary code, not as a tutorial transcript.

5. **100% test coverage on testbed shell + scenarios.** Entry points (`cli.ts`, `web/index.tsx`) can be `c8 ignore`-marked as orchestration glue; everything else gets full coverage. Samples worth copying need to be trustworthy.

---

## Locked design

### Scenario contract

```typescript
type ScenarioCategory =
  | 'ai'           // ai-assist, local-ai
  | 'i18n'         // bcp-47, locale handling
  | 'crypto'       // keystore, encryption
  | 'prompts'      // ts-prompt-assist
  | 'resources'    // ts-res
  | 'general';     // utility-shaped scenarios

interface ISecretSpec {
  readonly id: string;            // KeyStore-compatible id (e.g. 'openai-api-key')
  readonly envVarName: string;    // fallback env var (e.g. 'OPENAI_API_KEY')
  readonly description: string;   // for missing-secret diagnostic
}

interface IScenarioContext {
  readonly logger: ILogReporter;          // shell-initialized; bridged to MessagesProvider on web
  readonly keyStore: KeyStore | undefined; // undefined if no keystore unlocked yet
  readonly resolveSecret: (spec: ISecretSpec) => Promise<Result<string>>;
  readonly dataTree: IFileTreeRootItem;    // testbed's in-memory data tree
}

interface IScenarioBase {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: ScenarioCategory;
  readonly tags: readonly string[];        // capabilities exercised: ['ts-res', 'local-ai', 'classification', ...]
  readonly requiredSecrets?: readonly ISecretSpec[];
}

interface IWebScenarioImpl {
  readonly component: ComponentType<{ context: IScenarioContext }>;
  readonly initialize?: (context: IScenarioContext) => Promise<Result<boolean>>;
  // boolean = "ready to mount the component"; allows async setup (model load, secret resolve)
  // to gate component mounting cleanly.
}

interface ICliScenarioImpl {
  run(context: IScenarioContext): Promise<Result<string>>;
  // string = scenario-shaped completion summary (e.g. "Classified 12 inputs; wrote results to data/output/classifications.json")
}

interface IScenario extends IScenarioBase {
  readonly web?: IWebScenarioImpl;
  readonly cli?: ICliScenarioImpl;
}
```

### Web shell layout

```
┌─────────────────────────────────────────────────────────────┐
│ fgv testbed                                       [secrets] │  ← top-bar
├──────────────┬──────────────────────────────────────────────┤
│ [search…]    │  <selected scenario title>                   │
│              │  <description; tags as chips>                │
│ ─ AI ─       │                                              │
│   ▸ Local    │  ┌────────────────────────────────────────┐ │
│     classify │  │                                        │ │
│   ▸ RAG      │  │   <scenario component>                 │ │
│              │  │                                        │ │
│ ─ Prompts ─  │  │                                        │ │
│   ▸ Resolve  │  └────────────────────────────────────────┘ │
│              │  ─── messages ──────────────────────  [▾]   │ ← collapsible, default collapsed
│ ─ i18n ─     │  [info] loading model gpt-2-finetuned…      │
│   ▸ BCP-47   │  [info] ready in 1.2s                       │
└──────────────┴──────────────────────────────────────────────┘
```

- **Top-bar:** ts-app-shell `top-bar`. Testbed name + secrets button (opens modal).
- **Sidebar:** ts-app-shell `sidebar` packlet, scenarios grouped by category, search/filter by tag.
- **Main area:** selected scenario's component (`useUrlSync` for deep-linking via `/scenarios/<id>`).
- **Messages panel:** ts-app-shell `StatusBar` + `MessagesProvider`/`useLogReporter`. **Bottom-of-main collapsible; collapsed by default.** Toast notifications via `ToastContainer` for transient events (model loaded, error, etc.).
- **Secrets modal:** ts-app-shell `modal`. Lists `requiredSecrets` from currently-selected scenario; shows status (resolved from keystore / resolved from env var / unresolved); KeyStore unlock/create flow integrated.

### CLI shell

- Node entry point: `src/cli.ts`.
- Flag-based scenario selection: `--scenario <id>` or interactive picker if omitted.
- KeyStore flags mirroring `ks`: `--keystore <path>`, `--password-env <NAME>`, `--password-file <PATH>`, `--password-stdin`.
- Env-var fallbacks: `FGV_KS_PASSWORD` / `KS_PASSWORD` for password; `~/.fgv-ks` for default keystore path.
- `.env.local` for non-KeyStore secrets (raw env vars).
- `MessagesLogger` (or equivalent console-shaped reporter) writing to stderr.
- Scenario's `run` returns `Result<string>`; CLI prints the success string or fails with structured error.

### Data pipeline (chocolate-lab pattern)

- `samples/testbed/data/` — source YAML/JSON.
- `samples/testbed/scripts/build-data.ts` — manually invoked via `rushx build:data`. Walks `data/`, emits TS source.
- `samples/testbed/src/generated/dataFileTree.ts` — **checked in** (chocolate-lab convention). Exports a `FileTree.inMemory()`-ready data structure or pre-built tree.
- Scenarios import from `src/generated/dataFileTree.ts` and consume via `FileTree.inMemory()`.
- Binary data excluded from the pipeline; scenarios that need binary fetch at runtime or omit.

### KeyStore integration

- **Web:** `FileApiTreeAccessors.createFromLocalStorage(...)` from `@fgv/ts-web-extras` (per chocolate-lab pattern) hosts the keystore blob at `/keystore`. Password prompted via ts-app-shell `modal`; held in memory for session. Create/unlock/change-password flow via dedicated modal modes. First-run: missing keystore → "create" mode.
- **CLI:** `~/.fgv-ks` + `FGV_KS_PASSWORD` env (`ks`-compatible).
- Shared `resolveSecret(spec)` helper: keystore-first, env-var fallback, structured failure with both ids named.
- Local keystore-storage helpers (`loadKeystoreFromTree`, `saveKeystoreToFile`, etc.) live in `src/shell/keystore/` — chocolate-lab keeps these app-local; we mirror unless a second consumer materializes.

### Sample-browser navigation pattern (chocolate-lab-derived)

- State-driven shell, not React Router.
- `useUrlSync` from ts-app-shell for URL-sync of selected scenario (`#scenario=<id>`).
- Single-mode (no `ModeSelector` — testbed doesn't need that surface area). Just sidebar + main + messages.
- Adding a scenario = drop a file + register in `scenarios/index.ts` (manual list, explicit beats clever).

---

## Patterns inherited from chocolate-lab

Per the chocolate-lab recon (in this session):

| Pattern | Source | Adaptation |
|---|---|---|
| Generated-data-as-checked-in-TS | `libraries/ts-chocolate/scripts/build-library-data.js` → `src/packlets/built-in/builtInData.generated.ts` | Same shape; `rushx build:data` script; checked-in artifact. |
| `FileTree` everywhere | `FileTree.inMemory(...)` for generated data; `FileApiTreeAccessors.createFromLocalStorage(...)` for keystore | Same. |
| State-driven shell + URL sync | `App.tsx` uses `useUrlSync` from ts-app-shell | Same hook; simpler shell (no three-mode-selector). |
| `MessagesProvider` + `useLogReporter` + `StatusBar` | `apps/chocolate-lab-web/src/App.tsx` mounts these | Same wiring; `StatusBar` wrapped in a collapsible container. |
| KeyStore on web via localStorage-backed FileTree | `libraries/chocolate-lab-ui/src/packlets/workspace/browserPlatformInit.ts` | Same; password-modal pattern from `UnlockDialog` / `PublishingKeystorePasswordDialog`. |
| Graceful fallback on missing/corrupt persisted data | Throughout chocolate-lab | Apply uniformly. |

**Not copied:**
- Domain-specific vocabulary (ingredients/fillings/molds/etc.).
- Three-top-level-mode shell (testbed doesn't need that).
- Heavy storage topology (mitigated-root / cloud-root / publishing-root).
- Trading-post publishing workflow.

---

## Sub-phase shape

| Phase | Scope | Output |
|---|---|---|
| **B-1: Scaffold** | `samples/testbed/` package + web shell skeleton + CLI shell skeleton + data-pipeline script + initial `conventions.md`. Empty but compilable (`rushx build` clean). Provisional `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` package skeletons (empty surface; `index.ts` exports `{}`). | Branch + PR onto `local-ai-exploration`; all gates green for empty packages. |
| **B-2: Facade primitives** | Implement the 5-8 transformers facade primitives in both packages (Node + browser). `loadPipeline`, `classify`, `embed`, possibly `generate`. Mirror WebAuthn discipline: no opinionated orchestration; explicit "NOT in scope" list in package READMEs. Tests + coverage in both packages. | Branch + PR onto `local-ai-exploration`. 100% coverage on packages. |
| **B-3: First scenario — local classifier as `IPromptSafetyPolicy` backend** | Build the scenario in `samples/testbed/src/scenarios/localClassifierSafety.tsx`. Consumes the B-2 facade; composes into a `PromptLibrary` instance via the `IPromptSafetyPolicy` interface. Demonstrates the facade-to-ts-prompt-assist seam. Web component-shaped; supports a typed `Convert.enumeratedValue` for classifier labels. | Branch + PR onto `local-ai-exploration`. |
| **B-3 exit gate (orchestrator-led)** | Apply the done-or-discard criteria. Decision: ship facade OR abandon-and-pivot. Document outcome + reasoning in `phase-result.md`. | Decision recorded; B-4 commissioned per the decision. |
| **B-4a: Ship the facade** (if B-3 decides yes) | Polish facade for ship-quality: README, JSDoc, second scenario type to confirm boundary survives (e.g. embedding scenario), edge-case tests. Add to `LIBRARY_CAPABILITIES.md`. | Two packages ready for `release` promotion alongside the cluster. |
| **B-4b: Pivot to native** (if B-3 decides no) | Refactor the scenario to consume `@huggingface/transformers` directly. Remove the facade packages from `local-ai-exploration`. Document why in `phase-result.md` and a lessons-pending entry. | Sample stays; facade discarded. |
| **Cluster close** | Promotion `local-ai-exploration` → `release`. | Cluster shipped. |

---

## In-scope paths

- `samples/testbed/` — full new package.
- `libraries/ts-extras-transformers/` — new package (provisional; may be discarded at B-4b).
- `libraries/ts-web-extras-transformers/` — new package (provisional; may be discarded at B-4b).
- `docs/FUTURE.md` — absorb `ts-prompt-assist-samples` queued entry into `samples/testbed`.
- `docs/TECH_DEBT.md` — new P3 entry: port `samples/ai-image-gen-sample` scenarios into the testbed (sometime after testbed is established).
- `docs/WORKSTREAMS.md` — new active stream entry; flip on cluster close.
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — if facade ships at B-4a, add entries for new packages.

## Out-of-scope (deferred)

- Porting `samples/ai-image-gen-sample`'s existing scenarios into the testbed. Tech-debt entry created; not in this cluster.
- Anti-jailbreak content library (consumer-supplied per ts-prompt-assist design).
- LLM-call orchestration beyond what existing ai-assist provides.
- Streaming UX patterns (worth a separate scenario eventually, not v1).

---

## Acceptance criteria (cluster-level, per sub-phase)

Same as every fgv stream:

- [ ] `rush build` passes full repo on every sub-phase PR.
- [ ] `rushx lint` passes in every modified package (separate gate from build).
- [ ] `rushx fixlint` run before final commit.
- [ ] `rushx test` 100% coverage in every modified package (samples included; orchestration entry points may be `c8 ignore`-d with rationale).
- [ ] api-extractor regenerated where public surface changed (transformers packages at B-2/B-4a).
- [ ] Rush change file added under appropriate `common/changes/` dirs.
- [ ] No `any` types; no manual casts beyond `@ts-expect-error` test assertions.
- [ ] Per-phase `phase-result.md` written; `state.md` history updated.

---

## Resume protocol

To pick up cold from a future orchestrator session:

1. Read this brief.
2. Read `state.md` — phase status + decisions log + history.
3. Read `.ai/notes/orchestrator/research/local-models-incorporation.md` (decision-track input).
4. Check open PRs targeting `local-ai-exploration` integration branch.
5. If a sub-phase is in flight, read its `phase-N-brief.md` (drafted at commission time) and `phase-N-result.md` (written by implementing agent on completion).

---

## Branch + PR posture

- **Integration branch:** `local-ai-exploration` (existing).
- **Substrate-prep PR:** this PR — `chore/local-ai-exploration-prep`.
- **Sub-phase work branches:** `chore/local-ai-exploration-b<N>-<short>` (cloud-agent harness may suffix; document actual branch in state.md per L2).
- **Sub-phase PRs:** target `local-ai-exploration`, NOT `release`. Cluster-close prep + promotion is the final PR cluster → `release`.
