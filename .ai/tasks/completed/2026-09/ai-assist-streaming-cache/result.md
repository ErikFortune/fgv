# Result — `ai-assist-streaming-cache`

**Shipped:** `cache?: IAiCacheRequest` now flows through every streaming request path in
`@fgv/ts-extras/ai-assist` — `callProviderCompletionStream`, `executeClientToolTurn`, and
`callProxiedCompletionStream` — the way `completionClient.ts` already threaded it through
`callProviderCompletion` / `callProxiedCompletion`.

## What changed

- **`IProviderCompletionStreamParams.cache?: IAiCacheRequest`** (`streamingAdapters/common.ts`) —
  new field. The doc comment previously claimed streaming carried neither `structuredOutput` nor
  `cache` ("the prompt-cache breakpoint emitter has no streaming wire path today"); that claim is
  now false for `cache` and the comment was corrected to say so.
- **`IExecuteClientToolTurnParams.cache?: IAiCacheRequest`** (`streamingAdapters/clientToolContinuationBuilder.ts`)
  — new field, documented as validated and applied **fresh on every call**, since one call is one
  round of a multi-round tool loop and a later round's `system` can differ from an earlier one's.
- **Three per-provider stream builders now route `prompt.system` through the same cache-aware
  builder the non-streaming path uses**, instead of the plain string:
  - `callAnthropicStream` (`streamingAdapters/anthropic.ts`) → `buildAnthropicSystem`
  - `callOpenAiChatStream` (`streamingAdapters/openaiChat.ts`) → `buildOpenAiChatSystemContent`,
    plus the `prompt_cache_key` body field / `x-grok-conv-id` header split
  - `callOpenAiResponsesStream` (`streamingAdapters/openaiResponses.ts`) → `buildOpenAiResponsesSystemContent`,
    plus `prompt_cache_key`
  Each propagates a validation failure (`Result.fail`) rather than swallowing it — a request with
  an invalid breakpoint plan never reaches `fetch`.
- **`streamingClient.ts`'s `callProviderCompletionStream`** and
  **`clientToolContinuationBuilder.ts`'s `executeClientToolTurn`** both gate `cache` at their
  `'openai'` dispatch case using the *same* capability predicates `completionClient.ts` uses
  (`supportsPromptCacheBreakpoints`, `supportsPromptCacheRouting`), gated independently, matching
  the non-streaming reference's gating block verbatim (with a comment pointing back to it). The
  Anthropic case passes `cache` through ungated (Anthropic has no shared-adapter tolerance
  concern — it is the only descriptor on that `apiFormat`). Gemini never receives `cache` at all,
  matching the non-streaming dispatcher.
- **`callProxiedCompletionStream`** (`streamingAdapters/proxy.ts`) now forwards `cache` as a plain
  `body.cache` field — see "The proxied streaming path" below.
- **Change file**: `common/changes/@fgv/ts-extras/ai-assist-streaming-cache_2026-09-23-00-00.json`.
- **`CAPABILITIES.md`**: extended the existing "Prompt-cache breakpoint emission" paragraph with a
  sentence on the streaming extension (kept the single-paragraph-per-packlet-row convention this
  file uses; `verify-capability-docs.mjs` passes).
- **New test file**: `src/test/unit/ai-assist/streamingCache.test.ts` (22 tests, sibling to
  `apiClient.cache.test.ts`).

## The proxied streaming path — what it does with `cache`, and why

The brief asked for a decision, not a default: forward `cache` silently, refuse it the way #679
refused `endpoint`, or something else.

**Decision: forward it**, as a plain `body.cache` field, exactly the way `callProxiedCompletion`
(the non-streaming proxy) already forwards it. This is a *different* call than the one #679 made
for `endpoint`, and deliberately so — the two parameters have different failure profiles when a
proxy doesn't understand them:

- **`endpoint`** names *where the request must go*. A proxy that ignores it silently reaches the
  provider's public API instead of the caller's pinned upstream (a LAN deployment, a residency
  boundary, a self-hosted model) — the request goes somewhere the caller explicitly excluded.
  That is a misdirection, and #679 refuses it outright rather than accept a parameter that can be
  ignored with a worse-than-just-degraded outcome.
- **`cache`** names *an optimization*. A proxy that ignores it sends exactly the request it would
  have sent with no `cache` field at all — the same request a caller who omitted `cache` gets. The
  failure mode is "no caching," not "sent to the wrong place." There is no `endpoint`-style reason
  to refuse it.

So the proxied non-streaming path already established the precedent (it forwards `cache`, and the
brief listed that as ✅ out of scope — "completionClient.ts's behaviour... is the reference, not
the target"). The streaming proxy now matches it, for the same reason, rather than introducing an
asymmetry between the two proxied paths with no stated justification. The code comment at the
forward site states this reasoning explicitly, in case a later reader wonders why `cache` isn't
refused the way `endpoint` is on the same function.

No shipped proxy implementation is known to read `cache` from the stream request today (none was
known to read it from the non-streaming request either, before this stream). A caller relying on
server-side caching through a proxy should confirm their proxy actually forwards `cache` through
to `callProviderCompletionStream` on the server side.

## Acceptance criteria — verified

- [x] `cache?` on both `IExecuteClientToolTurnParams` and `callProviderCompletionStream`'s params,
      honored end to end (Anthropic / OpenAI Chat Completions / OpenAI+xAI Responses).
- [x] Validation runs per round, against that round's own `system`, and fails the round rather
      than dropping the plan — see the "multi-round validation" test in `streamingCache.test.ts`
      (round 1's system passes a breakpoint that round 2's shorter system fails; round 2 never
      calls `fetch`).
- [x] A descriptor supporting neither breakpoints nor routing gets a request body — and headers —
      byte-identical to the no-`cache` case, on both entry points.
- [x] Breakpoints and routing key remain independently gated (xAI gets routing via header, no
      breakpoints; OpenAI gets both; Groq/unconfirmed gets neither).
- [x] Tests assert the request body/headers a mocked `fetch` receives, never merely that the call
      succeeded — every test that would pass against a version silently dropping `cache` fails
      against this implementation's assertions. Each test carries a comment naming the wrong
      implementation it would catch.

## Repo gates

- [x] `rushx build` — zero warnings (only the expected `etc/ts-extras.api.md` auto-update, which
      is not a warning CI gates on — it's api-extractor writing the file).
- [x] `rushx lint` / `rushx fixlint` — clean, no findings.
- [x] `rushx test` — 100% statements/branches/functions/lines in `@fgv/ts-extras` (added one test
      to close a coverage gap on `openaiChat.ts`'s early-return-on-invalid-cache path that the
      first pass of the test file missed).
- [x] `code-reviewer` agent run on the final diff before coverage was already 100% (no gaps needed
      closing) — **Approved, no P1/P2 findings.** Full report quoted in the PR description /
      available in session transcript. Two P3/advisory notes, both "nothing to fix, flagging for
      awareness": the `ae-unresolved-link` warnings on the two new `cache?` fields in
      `etc/ts-extras.api.md` follow the same pre-existing `{@link AiAssist.<Symbol>}` pattern the
      non-streaming `IProviderCompletionParams.cache` field already carries. **Corrected 2026-09-23
      after Copilot raised it:** the *pattern* is pre-existing, but these two *warnings* are new —
      the file goes 368 → 370. The original wording here ("not new drift") overstated that and is
      wrong as written. The fields are still left as they are, on sibling-consistency grounds (94
      uses of the form in this packlet; changing 2 would document the same type two ways one line
      apart in the report), and moving the family to a resolvable form is its own chore. And the
      test file's
      `if (result.isFailure()) return;` narrowing style matches the sibling `apiClient.cache.test.ts`
      convention rather than `toSucceedAndSatisfy` (necessary here since the assertion is on a
      mocked `fetch` call, a side effect, not on the `Result`'s own value).
- [x] `node common/scripts/install-run-rush.js rebuild` — full repo, 36/36 succeeded, zero
      warnings.
- [x] `node common/scripts/install-run-rush.js test` — full repo. **Required several attempts**
      to get a clean run; see "Repo-wide test flakiness" below. The final clean run: 35/35
      succeeded (1 no-op), zero coverage failures, zero test failures.
- [x] Change file for `@fgv/ts-extras`, verified against `origin/release`
      (`rush change --verify --target-branch origin/release` — clean).
- [x] `CAPABILITIES.md` updated; the `LIBRARY_CAPABILITIES.md` index row is unchanged (still one
      line, `verify-capability-docs.mjs` passes).
- [x] Every step `.github/workflows/ci.yml` runs — build/lint/test per package, change-file
      verification.

### Repo-wide test flakiness (evidence, not a defect in this diff)

The first three `node common/scripts/install-run-rush.js test` attempts each failed on a
**different package**, none of them touched by this stream:

1. `@fgv/ts-extras` — api-extractor: `mainEntryPointFilePath` (`lib/index.d.ts`) reported missing.
2. `@fgv/ts-utils` — api-extractor: `Internal Error: referenced path not found:
   lib/packlets/collections/aggregatedResultMap.d.ts`.
3. `@fgv/ts-json-base` + `@fgv/ts-web-extras-transformers` — Jest: `ENOENT` on
   `ts-utils-jest/lib/matchers/.../predicate.js`, and a cascading TS2339 (`toSucceedWith` not
   found) from the same missing ambient-matcher build output.

In every case, checking the named file **immediately afterward** showed it present and correct,
and `git status` was clean — no uncommitted change to any of the implicated files or packages.
This is consistent with a build-output race in the sandbox's parallel (`--parallelism 4`) test
runner (a project's Jest run reading a dependency's `lib/` output while another concurrent
process is still writing it), not a defect introduced by this diff. A fresh `rush rebuild`
immediately followed by `rush test`, run with nothing else executing concurrently, passed cleanly
(36/36 rebuild, 35/35 test + 1 no-op). If this recurs on CI, the fix belongs to the build
orchestration (serialize the affected step, or add a completion barrier before Jest starts), not
to this stream's code.

## Deviations from the brief

None. The brief's "shape to build," "out-of-scope," and "acceptance" sections were all followed
as written. The one open decision the brief explicitly deferred to this stream — what
`callProxiedCompletionStream` does with `cache` — is resolved above.

## Followups

None opened. The "no shipped proxy implementation reads `cache`" caveat (both streaming and
non-streaming) is pre-existing context, not new information this stream needs to log a followup
for.
