# local-summarization

**Status:** ✅ implementation complete — PR open on the `local-summarization` integration branch (orchestrator squash-merges → `release`).

Added a local text-summarization primitive (`summarize`) to the transformers facade, plus a CLI testbed scenario — the third facade task type after `classify` and `embed`.

## What shipped

- **`summarize(summarizer, text, options?) → Promise<Result<SummarizationOutput>>`** in both `@fgv/ts-extras-transformers` (Node) and `@fgv/ts-web-extras-transformers` (browser), surface parity. A thin `captureAsyncResult` boundary over the `@huggingface/transformers` `summarization` pipeline — same WebAuthn-style discipline as `classify`/`embed`, no opinionated orchestration.
- **`local-summarization` CLI scenario** in `samples/testbed` — summarizes a realistic synthetic multi-turn transcript with `Xenova/distilbart-cnn-6-6`; CLI-only (backend-Node reality; surfaces via the shell's `no-web` path on the web side). Local-vs-cloud framing is at note depth, not a routing engine.
- **`LIBRARY_CAPABILITIES.md`**: facade table row + types + a decision shortcut (local cheap/fast vs. cloud-via-ai-assist for quality).

## Why

Consumer-driven (stability-via-consumption): a real consumer was summarizing in the cloud via `@fgv/ts-extras/ai-assist` — overkill (slow + expensive) for simple/medium inputs. Local summarization is the cheap/fast path; cloud stays for quality on long/complex documents. More evidence the transformers facade earns its keep.

## Outcome

`loadPipeline`'s task typing needed no extension (`'summarization'` already in the upstream `PipelineType` union); the `[{ summary_text }]` output needed no unsafe cast (empty-output handled as an explicit tested failure). Gates: facades 28 tests each @ 100%; testbed 143 @ 100%; full `rush build` + `build:web` green (Node facade excluded); api reports regenerated; `minor` change files.

## Artifacts

- `brief.md` — the locked design + scenario guardrails.
- `state.md` — decisions log + history.
- `result.md` — full implementation result + gate evidence.

## Deferred (unchanged)

The general `generate` primitive; concept-extraction; the reflection/local-vs-cloud routing layer (application concern).
