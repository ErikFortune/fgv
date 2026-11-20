# Result: `local-summarization`

**Branch:** `feat/local-summarization` → PR to `local-summarization` integration branch.
**Outcome:** `summarize` shipped as the third facade task type + a CLI testbed scenario. All gates green; no stop-and-surface triggered.

## What shipped

### `summarize` primitive (both facades, surface parity)
```typescript
summarize(
  summarizer: SummarizationPipeline,
  text: string,
  options?: Parameters<SummarizationPipeline>[1]   // GenerationFunctionParameters (min_length/max_length/max_new_tokens/…)
): Promise<Result<SummarizationOutput>>             // [{ summary_text: string }]
```
- Thin `captureAsyncResult` wrapper over the upstream `summarization` pipeline — mirrors `classify`/`embed` exactly (no opinionated orchestration). Node package is the canonical type source; browser package re-exports the types + implements the browser path. `SummarizationPipeline` / `SummarizationOutput` re-exported from both.
- 28 tests each package (23 prior + 5 summarize), 100% all four metrics. api-extractor reports regenerated.

### `local-summarization` CLI scenario (testbed)
- CLI-only (`cli` impl, no `web`) — matches the consumer's backend-Node reality + avoids a ~300MB browser download. Surfaces in the web shell via the B-5 `no-web` path.
- Loads `Xenova/distilbart-cnn-6-6` via `loadPipeline('summarization', …)` through a `webpackIgnore` dynamic import of the Node facade (the module is in the web graph via the registry).
- Summarizes a **realistic synthetic** multi-turn standup transcript (so summary quality-for-recall is observable; no real consumer data), prints the summary + a compaction note framing local-vs-cloud at **note depth** — explicitly NOT a routing engine (escalation policy is the consumer's).
- 143 testbed tests, 100%.

## Answers to the kickoff's flagged questions
- **`loadPipeline` task-typing needed NO extension.** `'summarization'` is already in the upstream `PipelineType` union `loadPipeline<T extends PipelineType>` is generic over (same as `'text-classification'`/`'feature-extraction'`). No facade-typing change.
- **No unsafe cast needed.** `SummarizationOutput` (`[{ summary_text }]`) is cleaner than `embed`'s `Tensor`/`tolist()`; the empty-output case is handled as an explicit, tested `Result.fail` (`first === undefined`), not a cast or `??` fallback.
- **No other upstream-API surprises.** Output shape matched the brief's expectation exactly.

## Gates
- [x] `summarize` in both facade packages; surface parity; Node/browser split mirrors existing primitives.
- [x] `rush build` full repo clean.
- [x] `rushx lint` clean in every modified package; `rushx fixlint` run.
- [x] `rushx test` 100% all four metrics — facades 28 each; testbed 143. Upstream pipeline mocked (no model download in tests).
- [x] CLI scenario runs (`--scenario local-summarization`); returns `Result<string>`; scenario test mocks inference.
- [x] api-extractor regenerated in both facade packages.
- [x] Rush change files (`minor` facades; `none` testbed).
- [x] LIBRARY_CAPABILITIES updated (facade table row + types + decision shortcut).
- [x] No `any`; no unsafe casts; no `Result<void>`.
- [x] production `build:web` compiles; Node facade excluded (3 `webpackIgnore` literals = the three scenarios' CLI paths).

## Notes
- Third facade task type (`classify` → `embed` → `summarize`) — more evidence the facade earns its keep, consumer-pulled.
- Deferred (unchanged): the general `generate` primitive; concept-extraction; the reflection/routing layer.
