# ai-assist-streaming-cache — prompt-cache emission on the streaming paths

**Shipped**: 2026-09-23, pushed to `claude/ai-assist-streaming-cache`. PR: not yet opened —
code, tests, and change file are complete and pushed; open a PR from that branch against
`release` to carry this record.

## Summary

Threaded `cache?: IAiCacheRequest` through the streaming request paths of
`@fgv/ts-extras/ai-assist` — `callProviderCompletionStream`, `executeClientToolTurn`, and
`callProxiedCompletionStream` — the way `completionClient.ts` already threaded it through the
non-streaming `callProviderCompletion` / `callProxiedCompletion`. Before this stream, no
streaming request could carry a cache plan at all: the field simply didn't exist on either
streaming params interface, and the three streaming adapters built `system` from the plain
string with no route to the cache-aware builders the non-streaming path used. This closes a gap
the prior `ai-assist-prompt-caching` stream's own exit record named explicitly as left out.

## Files changed

- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/common.ts` — new
  `IProviderCompletionStreamParams.cache?`, corrected doc claim ("streaming has no cache wire
  path" is no longer true).
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts`
  — new `IExecuteClientToolTurnParams.cache?`; gating block mirroring `completionClient.ts`'s
  `'openai'` case at the dispatch switch.
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts`,
  `openaiChat.ts`, `openaiResponses.ts` — each now builds `system` through
  `buildAnthropicSystem` / `buildOpenAiChatSystemContent` / `buildOpenAiResponsesSystemContent`
  instead of the plain string, propagating a validation failure as `Result.fail`. `openaiChat.ts`
  and `openaiResponses.ts` also gained the `prompt_cache_key` body field / `x-grok-conv-id`
  header split.
- `libraries/ts-extras/src/packlets/ai-assist/streamingClient.ts` — `callProviderCompletionStream`
  gates `cache` at its `'openai'` case exactly as the non-streaming dispatcher does.
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/proxy.ts` —
  `callProxiedCompletionStream` forwards `cache` as a plain `body.cache` field.
- `libraries/ts-extras/src/test/unit/ai-assist/streamingCache.test.ts` — new, 22 tests, sibling
  to `apiClient.cache.test.ts`.
- `libraries/ts-extras/CAPABILITIES.md` — extended the "Prompt-cache breakpoint emission"
  paragraph with the streaming extension.
- `common/changes/@fgv/ts-extras/ai-assist-streaming-cache_2026-09-23-00-00.json`.

## Per-phase summaries

Single-phase stream — no sub-phases in the brief. Sequence: read the required files and confirm
the line references against the branch head → thread `cache` through both streaming params
interfaces → wire the three per-provider adapters through the cache-aware builders → mirror the
independent gating block at both new dispatch sites → decide and implement the proxied-streaming
question → write the test file (one test per design point, request-body/header assertions only)
→ `code-reviewer` pass (approved, no P1/P2) → repo-wide `rebuild` + `test` (see "Decisions" below
for the flakiness encountered along the way).

## Decisions made during execution

- **The proxied streaming path forwards `cache`, rather than refusing it the way #679 refused
  `endpoint`.** The two parameters have different failure profiles when a proxy doesn't
  understand them: `endpoint` names where the request must go, so silently ignoring it
  misdirects the request to a destination the caller excluded; `cache` names an optimization, so
  ignoring it just means no caching — the same request a caller who omitted `cache` gets. This
  also keeps the streaming proxy symmetric with the already-shipped non-streaming
  `callProxiedCompletion`, which forwards `cache` the same way. Full reasoning is in `result.md`.
- **Gating logic is duplicated at two new call sites** (`streamingClient.ts`,
  `clientToolContinuationBuilder.ts`), each with a comment pointing back to
  `completionClient.ts`'s reference block, rather than extracted into a shared helper — per the
  brief's explicit instruction that `completionClient.ts`'s behavior is the reference, not the
  target, and extraction is only in scope if it stays behavior-preserving and doesn't get
  invasive. Two small, commented duplications read more clearly than a shared helper threaded
  through three call sites with slightly different downstream signatures (`cacheKeyHeader` only
  applies on the Chat Completions transport).
- **Repo-wide `rush test` flakiness.** The first three attempts at
  `node common/scripts/install-run-rush.js test` each failed on a different package untouched by
  this stream (`ts-extras`, then `ts-utils`, then `ts-json-base` + `ts-web-extras-transformers`),
  each time with a "file not found" error on a file that existed and was correct moments later,
  with a clean `git status`. Diagnosed as a build-output race in the sandbox's
  parallel (`--parallelism 4`) runner rather than a defect in this diff. A fresh `rush rebuild`
  immediately followed by `rush test`, nothing else running concurrently, passed cleanly (36/36
  rebuild, 35/35 test + 1 no-op). Documented with the specific failure signatures in `result.md`
  in case this recurs on CI — the fix, if needed, belongs to build orchestration, not this
  stream's code.

## Followups

None. See `result.md` § "Followups" — the "no known proxy implementation reads `cache` yet"
caveat is pre-existing context carried forward from the non-streaming proxy, not new information
this stream needs to log.

## Lessons codified during the run

None routed to `.ai/instructions/` — nothing here rose to the level of a repo-wide rule beyond
what `CODING_STANDARDS.md`'s "Extending Core Libraries" and the #679 precedent already state.
The repo-wide test flakiness above is recorded as evidence in `result.md`, not codified as a
lesson, since it's sandbox-specific rather than a repeatable pattern to guard against in code.

## Antagonist pass (self-run, per `/finalize-task` step 6)

An independent `code-reviewer` agent already reviewed the **code diff** (approved, no P1/P2 —
see `result.md` § Repo gates). This pass separately checked the **finalize artifacts**
(`meta.yaml`, this `README.md`, the `docs/WORKSTREAMS.md` edit) for inaccuracies and omissions,
run as a deliberate second pass rather than a re-read:

- Traced every `meta.yaml` `summary.intended`/`shipped` claim back to `brief.md`/`result.md` —
  all trace cleanly; no unsupported claims found.
- Verified `sourceLine` appears **verbatim** in `result.md`'s opening line — confirmed by direct
  string match.
- Checked `prs: []` and the `docs/WORKSTREAMS.md` status marker (🔵, not ✅) against the actual
  state (no PR opened, nothing merged) — both correctly reflect that no PR exists yet, rather
  than anticipating one that hasn't been created. This is the one place this stream's closure
  deviates from the repo's usual "PR anticipates its own merge" convention, and it deviates
  because there is no PR to anticipate a number for, not because the convention was rejected.
- Re-examined `diverged`: not left empty by default — the direct-parent connection to
  `ai-assist-prompt-caching`'s own recorded gap, and the one coverage-driven test addition, are
  both real and both stated.
- Checked for omissions: no deferred work exists to route to `FUTURE.md`/`TECH_DEBT.md`; no
  design doc needed a status flip (none was implemented — this stream extended an existing
  shipped feature per an existing reference implementation); no lesson rose to the level of a
  `.ai/instructions/` codification; no findings inbox exists for this single-session stream.

Nothing required correction. Scope of this pass: the four finalize artifacts listed above,
checked against `brief.md` and `result.md` as source of truth.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- PR: not yet opened (branch `claude/ai-assist-streaming-cache`, based on `release` at
  `af05bb319`)
