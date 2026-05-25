# Stream brief: `local-summarization`

**Status:** 🟢 ready to commission
**Branch base:** `release`
**Workflow shape:** single-PR additive feature (facade primitive + CLI testbed scenario)
**Package surface:** `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` (add `summarize` primitive) + `samples/testbed` (CLI scenario) + `.ai/instructions/LIBRARY_CAPABILITIES.md`

---

## Mission

Add a local text-summarization primitive to the transformers facade shipped by the `local-ai-exploration` cluster, plus a CLI testbed scenario demonstrating it. Consumer-driven: personaility currently summarizes in the cloud via `@fgv/ts-extras/ai-assist`, but cloud is slow + expensive for simple cases where a small local model is good enough. Local summarization is the cheap/fast path; cloud (ai-assist) stays for quality on long/complex documents.

This is the third task type on the facade (`classify` → `embed` → `summarize`), continuing the "grow the facade as real consumers need it" path the cluster established. The facade's existence is already proven (B-3 SHIP); the only question this stream answers is "does `summarize` earn its primitive" — one CLI scenario answers it.

---

## Locked design

### `summarize` primitive

Task-specific, mirroring the existing `classify` / `embed` primitives (NOT the deferred general `generate`):

```typescript
// shape — match the existing facade primitives' signature style; verify against
// the actual @huggingface/transformers summarization pipeline output
summarize(
  pipeline: SummarizationPipeline,        // from loadPipeline('summarization', model)
  text: string,
  options?: { minLength?: number; maxLength?: number; /* upstream summarization opts */ }
): Promise<Result<SummarizationOutput>>   // upstream shape: [{ summary_text: string }]
```

- Wraps the `@huggingface/transformers` `summarization` pipeline task via `captureAsyncResult`.
- Same Node/browser split discipline as the existing primitives: the canonical type source is the Node package (`@fgv/ts-extras-transformers`); the browser package (`@fgv/ts-web-extras-transformers`) re-exports types + implements the browser path. **Both packages get `summarize` for surface parity** even though the testbed scenario only exercises the Node path.
- Options pass `min_length` / `max_length` (and whatever else the upstream summarization pipeline accepts) through; default behavior is the upstream default.

### CLI testbed scenario: `local-summarization`

**Shape the scenario as a thoughtful consumer would — you have latitude here.** The testbed's purpose is to *see what real consumer code naturally looks like*, so this section is guidance, not a spec to implement literally. Use your judgment on structure, input, and presentation. Two firm guardrails and the rest is yours:

- **Firm: CLI runtime** (no `web` impl). Mirrors personaility's backend-Node reality and avoids pulling a ~300MB summarization model into a browser bundle. This one's load-bearing — the scenario should demonstrate the runtime the consumer actually uses.
- **Firm (tenet, not micromanagement): don't build complicated sample-only behavior a real consumer would also need.** A full local-vs-cloud *routing engine* is application logic, not facade or sample concern — if the local-vs-cloud framing is worth showing, surface it at whatever depth reads naturally (a comment, a printed note, a simple length check), but the escalation *policy* belongs to the consumer, not the sample.
- **Your latitude:** what text it summarizes, how it presents the result, whether/how it frames the local-vs-cloud decision, the model choice (a small well-known summarization model — distilbart-cnn class is a reasonable default), tags/category, internal structure. Match the existing scenarios' registration pattern; otherwise build it the way a real consumer would and we'll learn from the shape.

### LIBRARY_CAPABILITIES update

- Add `summarize` to the transformers facade entries.
- Decision-shortcut line: "Local summarization (cheap/fast/offline, small model) → `summarize` from `@fgv/ts-extras-transformers`; cloud summarization (quality on long/complex docs) → `AiAssist.generateJsonCompletion` / completion from `@fgv/ts-extras/ai-assist`."

---

## Runtime context (resolves the model-size question)

personaility runs summarization on the **backend in Node**. So:
- Model size (~300MB distilbart-cnn class) is a one-time server-side cache — not a browser-download UX concern.
- The CLI scenario is the faithful demonstration of the consumer's actual usage.
- The browser `summarize` primitive ships for surface parity but isn't the validated path.

---

## In-scope

- `libraries/ts-extras-transformers/src/` — add `summarize` + tests (100% coverage; mock the upstream pipeline, don't download models in tests).
- `libraries/ts-web-extras-transformers/src/` — add `summarize` (browser path; surface parity) + tests.
- Both `etc/*.api.md` — regenerated.
- `samples/testbed/src/scenarios/localSummarization.ts` (CLI scenario) + register in `scenarios/index.ts`.
- `samples/testbed/data/` — any sample input text the scenario summarizes (via the data pipeline if non-trivial; an inline string is fine for a single short fixture).
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — facade entries + decision shortcut.
- `common/changes/` — rush change files (`minor`; additive) for the touched packages.

## Out-of-scope

- Web summarization scenario (would demo a runtime personaility isn't using + a 300MB browser download).
- Local-vs-cloud routing orchestrator (application concern; a doc-comment note is the right depth).
- The deferred general `generate` primitive (summarization is task-specific; `generate` stays deferred until a concrete consumer needs it).
- Cloud summarization changes to ai-assist (it already does this via completions; no change needed).

## Acceptance criteria

- [ ] `summarize` in both facade packages; surface parity; Node/browser split mirrors existing primitives.
- [ ] `rush build` full repo clean.
- [ ] `rushx lint` clean in every modified package (separate gate from build).
- [ ] `rushx fixlint` run before final commit.
- [ ] `rushx test` 100% coverage all 4 metrics in both facade packages + testbed. Upstream pipeline mocked in facade tests.
- [ ] CLI scenario runs: `--scenario local-summarization` loads a summarization pipeline, summarizes input, prints summary + the escalation note. Returns `Result<string>` summary per the scenario contract.
- [ ] api-extractor regenerated in both facade packages.
- [ ] Rush change files (`minor`) for touched packages.
- [ ] LIBRARY_CAPABILITIES updated (facade entries + decision shortcut).
- [ ] No `any`; no manual casts beyond `@ts-expect-error`; no `Result<void>`.
- [ ] `result.md` written; substrate migrated to `.ai/tasks/completed/<YYYY-MM>/local-summarization/` with polished README as part of the PR.

## Required reading

1. This brief.
2. `libraries/ts-extras-transformers/src/` + `libraries/ts-web-extras-transformers/src/` — the existing `classify` / `embed` primitives. **Mirror their signature style, Node/browser split, test-mocking strategy exactly.**
3. `.ai/tasks/completed/2026-05/local-ai-exploration/` (brief + result docs) — the facade design discipline + the testbed scenario contract.
4. `samples/testbed/src/scenarios/` — the two existing scenarios (`local-classifier-safety`, `local-embedding-search`) + `src/shell/` for the `IScenario` / `ICliScenarioImpl` contract. **The new scenario mirrors the CLI shape of these.**
5. `samples/testbed/conventions.md` — house style + gap-then-fix tenet.
6. `CLAUDE.md` + `.ai/instructions/CODING_STANDARDS.md`.

## Skills to load

| When | Skill |
|---|---|
| Before writing the primitive | `/result-pattern` (`captureAsyncResult`) |
| Before writing tests | `/result-tests` |
| Before reaching for utility code | `/published-primitives-reflex` |

## Stop-and-surface

- The `@huggingface/transformers` summarization pipeline output shape differs materially from `classify`/`embed` in a way that complicates the facade signature — surface before improvising.
- The summarization model the scenario picks is impractically large even for Node tests (mock should avoid any real download; if the scenario itself can't run without a multi-hundred-MB download in the test env, the scenario test should mock or skip the actual inference and assert wiring).
- Adding `summarize` surfaces a gap in the existing facade structure (e.g. `loadPipeline`'s task-type typing doesn't cleanly extend to `'summarization'`) — surface; that's a facade-design question.

## fgv-conventions pre-load (per L22)

- No re-exports from sibling `@fgv/*` packages.
- All fallible ops return `Result<T>`; no `Result<void>`; `captureAsyncResult` for async upstream wrapping.
- Mirror the existing facade primitives' discipline (WebAuthn-style thin boundary) — don't add opinionated orchestration.
- `rushx lint` is a separate gate from `rushx build`.
- Both transformers packages are active-development surface; additive change; no breaking concerns.

## Branch + PR posture

- **Work branch stem:** `feat/local-summarization` (harness may suffix).
- **PR target:** `release` (single-PR feature; facade is already shipped on release; no integration branch).
- **PR title:** `feat(transformers): add summarize primitive + local-summarization testbed scenario`
- **PR body:** the `summarize` signature; the CLI scenario; the local-vs-cloud decision framing (local cheap/fast, cloud for quality); pre-PR gate checklist; explicit "third facade task type — more evidence the facade earns its keep."
