# B-3 kickoff: first scenario — local classifier as `IPromptSafetyPolicy` backend

**Phase:** B-3 of `local-ai-exploration`
**Integration branch:** `local-ai-exploration` (off `release`)
**Work branch stem:** `chore/local-ai-exploration-b3-classifier-scenario` (harness may suffix)
**PR target:** `local-ai-exploration`, **NOT** `release`
**Workflow shape:** clean scenario (no library extension — the gap-fix shipped to `release` and is merged in)

---

## Mission

Build the testbed's first scenario: a **local toxicity classifier wired in as an `IScreener`** on a `PromptLibrary`'s `IPromptSafetyPolicy`. When a prompt is resolved, user-supplied slot values are screened through a local `@huggingface/transformers` text-classification pipeline (model: `toxic-bert`); per-label scores are compared against a threshold map and turned into `allow` / `warn` / `reject` findings.

This scenario is the **done-or-discard forcing function** for the transformers facade. Its real deliverable is the answer to one question: *does composing the facade (`@fgv/ts-extras-transformers`) with `@fgv/ts-prompt-assist`'s screener seam read meaningfully cleaner than calling `@huggingface/transformers`' `pipeline()` directly?* Build the scenario well, then evaluate honestly.

---

## What changed since this was first sketched

The B-2 exit flagged three open questions. All three are now **decided** — do not re-open them:

1. **Classifier output interpretation → per-label threshold map.** Build a small interpreter: `{ toxic: 0.8, threat: 0.3, insult: 0.6, identity_hate: 0.3, ... } → 'allow' | 'warn' | 'reject'`. Reject if any label exceeds its reject-threshold; warn on a softer band; allow otherwise. This uses the model's full multi-label output (toxic-bert scores ~6 labels independently). The threshold map is **scenario-local demo config** — not a facade concern.

2. **Model → `toxic-bert`.** Use a HuggingFace Hub text-classification model in the toxic-bert family (e.g. `Xenova/toxic-bert`, which is the transformers.js-compatible ONNX export — confirm the exact id resolves at author time). Multi-label; emits per-category scores.

3. **Screener seam → it now exists.** `@fgv/ts-prompt-assist` shipped the pluggable screener model (#407, merged into this integration branch). **No library extension is in B-3 scope.** You consume `IScreener` / `IPromptSafetyPolicy.screeners`; you do not modify `ts-prompt-assist`.

---

## The two seams you compose

### Facade (`@fgv/ts-extras-transformers`) — already shipped (B-2)

```typescript
import { loadPipeline, classify, type TextClassificationOutput } from '@fgv/ts-extras-transformers';

// load once, hold the reference (in scenario initialize())
const pipe = (await loadPipeline('text-classification', 'Xenova/toxic-bert')).orThrow();

// per slot value
const out: Result<TextClassificationOutput> = await classify(pipe, value, { top_k: null });
// out.value === [{ label: 'toxic', score: 0.91 }, { label: 'threat', score: 0.02 }, ...]
```

`{ top_k: null }` returns **all** labels (otherwise you only get the top one — you need all of them for per-label thresholds). Confirm this against the upstream pipeline at author time; if `top_k` doesn't behave as expected, that's a stop-and-surface (facade may need a follow-on).

### Screener (`@fgv/ts-prompt-assist`) — shipped surface to consume

```typescript
// from @fgv/ts-prompt-assist (libraries/ts-prompt-assist/src/packlets/types/safety.ts + trace.ts):

interface IScreenerContext {
  readonly slot: IPromptSlot;
  readonly source?: string;
  readonly promptId: PromptId;
  readonly value: string;          // post-binding, pre-render — the screening point
}

interface IScreener {
  readonly name: string;
  readonly screen: (ctx: IScreenerContext) => Promise<Result<ReadonlyArray<ISafeguardFinding>>>;
}

interface ISafeguardFinding {
  readonly slot: SlotName;
  readonly kind: SafeguardFindingKind;        // open string; use 'classifier-verdict'
  readonly disposition: SafeguardDisposition;  // 'warn' | 'reject' | 'info'
  readonly detail: string;                     // human-readable
  readonly metadata?: Readonly<Record<string, unknown>>;  // per-label scores go here
  readonly screener?: string;                  // your screener's name
}

interface IPromptSafetyPolicy {
  readonly defaultMaxLength?: number;
  readonly screeners?: ReadonlyArray<IScreener>;   // ← your classifier screener lands here
  readonly antiJailbreakPreface?: ...;
}
```

Your classifier screener:
- holds the loaded pipeline reference (closure-captured),
- on `screen(ctx)`: calls `classify(pipe, ctx.value, { top_k: null })`,
- maps the `TextClassificationOutput` through the threshold map,
- returns `[]` for clean values, or one `ISafeguardFinding` (`kind: 'classifier-verdict'`, the breaching label's `disposition`, per-label scores in `metadata`, your screener `name`).
- A `classify` failure → propagate as `fail()` (operational failure, not a finding) per the `IScreener` contract.

Read `createPatternScreener` (`libraries/ts-prompt-assist/src/packlets/safeguards/patternScreener.ts`) as the canonical reference for how a built-in screener is shaped — match its structure for the classifier screener.

---

## Scenario structure

Land it at `samples/testbed/src/scenarios/localClassifierSafety.tsx` and register it in `samples/testbed/src/scenarios/index.ts` (append to the `scenarios` array — that's the whole registration). Conform to the `IScenario` contract in `samples/testbed/src/shell` (read `IScenarioContext`, `IWebScenarioImpl`, `ICliScenarioImpl` — already defined in the scaffold).

- `category: 'ai'`; `tags: ['local-ai', 'classification', 'ts-prompt-assist', 'safety']`.
- **Web impl:** `initialize()` loads the pipeline (returns `Result<boolean>` to gate mounting — model download is slow, so this is the right seam). Component lets the user type prompt-slot input, runs a resolve through a `PromptLibrary` whose policy carries the classifier screener, and shows the verdict + per-label scores + the resolved-or-rejected outcome. Surface findings via the shell's `ILogReporter` / messages panel.
- **CLI impl (recommended, for coverage + batch demonstration):** `run()` classifies a small set of fixture inputs (clean + toxic) through the same screener, returns a `Result<string>` summary. The CLI path is far easier to drive to 100% coverage than the React component.

**Testability requirement (load-bearing for the coverage gate):** put the **interpretation logic** (threshold map → verdict → `ISafeguardFinding`) and the **screener factory** in pure, React-free units. Unit-test them exhaustively with a **mocked facade** (mock `classify` to return canned `TextClassificationOutput` arrays — clean, single-label-toxic, multi-label, empty, and a `fail()`). The React component stays a thin shell over the tested core. **Do not download a model in tests.**

---

## Tenets that bite here (from the cluster brief)

- **Showcase fgv best practices.** Result chaining throughout; `PromptLibrary` built via its factory; `Converters` for any untyped input; `ILogReporter` for observability. No sample-class shortcuts.
- **Gap-then-fix.** If the scenario reaches for something the facade or `ts-prompt-assist` *should* provide but doesn't (e.g. you find yourself wishing the facade exposed a typed label-score map helper), **stop and surface** — don't bury a workaround. Per the tenet: anything a real consumer would also need belongs in a `@fgv/*` library, not in the sample. Tag any unavoidable workaround `// TESTBED-WORKAROUND: <desc> — see <link>` and file it.
- **100% coverage** on the scenario + screener core (entry points `c8 ignore`-able as glue).

---

## B-3 exit gate (orchestrator-led — NOT your call to make)

After your PR, the orchestrator applies the done-or-discard criteria. Your job is to give that decision honest evidence. In `phase-b3-result.md`, answer directly:

1. **Cleaner than direct `pipeline()`?** Show the facade-consuming screener code; assess whether the `Result` wrapping earned its keep vs `captureAsyncResult(() => pipeline(...))` inline.
2. **Does the boundary survive a real composition?** Did `classify`'s `TextClassificationOutput` type compose cleanly into the screener, or did you fight the types?
3. **Does Result composition with `ts-prompt-assist`'s screener seam feel natural?** This is criterion 3 from the cluster brief — the central question. Be specific about friction.

If you hit material friction, **say so plainly** — a "this facade isn't earning its keep" result is a successful B-3, not a failed one. The gate decides ship (B-4a) vs pivot-to-native (B-4b).

---

## Stop-and-surface triggers (one-shot — you cannot ask mid-flight)

- `toxic-bert` (or the chosen id) doesn't resolve as a transformers.js text-classification model, or its label set isn't what the threshold-map approach assumes.
- `classify`'s `{ top_k: null }` (or equivalent) doesn't return all labels — the per-label threshold approach needs the full score vector.
- The `IScreener` seam can't carry what the scenario needs (e.g. the screener needs prompt-level context the per-slot-value `IScreenerContext` doesn't provide) — this is signal the gap-fix missed something; surface for a follow-on rather than working around.
- The scenario forces a facade change (e.g. you genuinely need `embed` or a typed label converter at the facade level) — surface; we decide whether it's in-scope or a B-4a item.

---

## Acceptance gates (hard exit)

- [ ] `rush build` passes full repo.
- [ ] `rushx lint` clean in `samples/testbed` (separate gate from build).
- [ ] `rushx fixlint` run before final commit.
- [ ] `rushx test` 100% coverage all 4 metrics in `samples/testbed` (entry-point `c8 ignore` only, with rationale).
- [ ] No `any`; no manual unsafe casts beyond `@ts-expect-error` test assertions; no `Result<void>`.
- [ ] Scenario registered in `scenarios/index.ts`; appears in shell.
- [ ] No modification to `@fgv/ts-prompt-assist` or the transformers facade packages (B-3 is a pure consumer; any change there is a stop-and-surface).
- [ ] `phase-b3-result.md` written with the three done-or-discard answers above, plus: model id used, threshold map chosen, test mocking strategy, and any `@huggingface/transformers` runtime surprises.
- [ ] `state.md` updated: B-3 row → ✅ with PR link; exit-gate row → 🟢 ready for orchestrator decision.

## Out-of-scope (deferred)

- The done-or-discard decision itself (orchestrator-led, post-PR).
- A second model-type scenario (embedding/generation) — that's B-4a if we ship.
- Any `LIBRARY_CAPABILITIES.md` entry for the facade — held for B-4a.
- Extending `ts-prompt-assist` or the facade.
- Anti-jailbreak preface content (consumer-supplied per design).

## Skills to load

| When | Skill |
|---|---|
| Before writing the screener / Result chains | `/result-pattern` |
| Before writing tests | `/result-tests` |
| Before reaching for utility code | `/published-primitives-reflex` |
| Touching any file I/O (data fixtures) | `/filetree-io` |
| Emitting diagnostics | `/ts-utils-logging` |

## Final-message protocol

≤300 words back to the orchestrator:
- Confirm acceptance gates pass; name the PR number.
- Model id + threshold map chosen.
- **The three done-or-discard answers in one line each** (cleaner-than-direct? boundary-survives? composition-natural?) — this drives the gate.
- Any `@huggingface/transformers` runtime surprises.
- Anything that pushed back on the screener seam (signal for a `ts-prompt-assist` follow-on).
