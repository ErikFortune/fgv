# Stream brief — `ai-assist-streaming-cache`

**Status: 🟢 ready.** Drafted 2026-09-23, from a PersonAIlity ask verified against our own source.

## Mission

Thread `cache?: IAiCacheRequest` through the **streaming** request paths of
`@fgv/ts-extras/ai-assist`, the way `completionClient` already threads it through the non-streaming
ones — so a tool-augmented or streamed turn can carry system-prompt cache breakpoints and a routing
key.

## The gap, verified in source

The consumer reported this against the compiled `5.1.0-56` (their `#664` lesson: verify compiled
code, not declarations). **Every claim was re-checked against our source and holds**, and source
agrees with dist.

| entry point | file | `cache` |
|---|---|---|
| `callProviderCompletion` | `completionClient.ts:789` | ✅ honored |
| `callProxiedCompletion` | `completionClient.ts:1020` | ✅ forwarded (`body.cache = cache`) |
| `callProviderCompletionStream` | `streamingClient.ts:105` | ❌ **none** |
| `executeClientToolTurn` | `streamingAdapters/clientToolContinuationBuilder.ts:615` | ❌ **none** |

- `cache?: IAiCacheRequest` appears in exactly one file in the packlet: `completionClient.ts`
  (`:180` on the params, threaded at `:322/435/585/920/970`).
- `clientToolContinuationBuilder.ts` and `streamingClient.ts` have **zero** `cache` references.
- `IExecuteClientToolTurnParams extends IChatRequest` (`clientToolContinuationBuilder.ts:441`), and
  `IChatRequest` (`model.ts:196–204`) carries only `system` and `messages` — so there is nothing to
  inherit.
- `streamingClient.ts:109` destructures a fixed list and never reads a cache plan, so even a
  structurally-spread `cache` would be dropped before any adapter saw it.

**The gap is wider than the consumer framed it.** They asked about `executeClientToolTurn`; the real
statement is that **no streaming path can send a cache plan at all**. A tool-*less* streaming turn is
equally unable to. And the two are separate request paths — `streamingClient.ts:63–72` documents that
client tools deliberately do **not** flow through `callProviderCompletionStream` — so each needs its
own thread. **Do both.** Fixing only the tool turn leaves the sibling hole open and invites a second
ask.

## Why it matters to the consumer

Every hub chat turn where the agent holds a client tool — their normal case — goes through
`executeClientToolTurn`. So `toCacheRequest(composition)` from `@fgv/ts-prompt-assist` can currently
only reach a provider on tool-less, non-streaming turns. The plan is derived once per turn from the
`chat.system` resolve and is identical for every round of the loop.

## The shape to build

One `cache?: IAiCacheRequest` on the params, applied to **each round's** request the same way the
single-shot path applies it — **validated fail-loud against that round's own `system`**, not
validated once and reused. `validateAiCacheRequest(system, cache, maxBreakpointWrites?)`
(`cacheRequest.ts:139`) is the existing contract; use it rather than a new one.

Reuse the existing capability gating verbatim — `completionClient.ts:918–924` is the reference:

```ts
const routing = supportsPromptCacheRouting(descriptor);
const breakpoints = supportsPromptCacheBreakpoints(descriptor) ? cache?.systemBreakpoints : undefined;
const routedKey = routing !== undefined ? cache?.cacheKey : undefined;
```

Breakpoints and routing key are **gated independently** — the comment above that block records why:
gating them together withheld the routing key from the provider that depends on it most. A
descriptor supporting neither must get **byte-identical** request bodies to what it would have got
with no `cache` at all. Pin that with a test.

## Package surface

- `libraries/ts-extras/src/packlets/ai-assist/` — `streamingClient.ts`,
  `streamingAdapters/clientToolContinuationBuilder.ts`, and whatever per-provider stream builders
  they call
- `libraries/ts-extras/CAPABILITIES.md`, `etc/ts-extras.api.md`, change file

`ts-extras/ai-assist` is an **active surface** per `ACTIVE_DEVELOPMENT.md` — additive changes land
freely, no shim needed.

## Out-of-scope

- **`completionClient.ts`'s existing behaviour.** It is the reference implementation, not the target.
  Refactoring shared cache logic out of it is permitted *only* if the extraction is behaviour-
  preserving and pinned by the existing tests; if that starts to look invasive, duplicate the small
  gating block instead and say so.
- **Any change to `IAiCacheRequest`, `validateAiCacheRequest`, or the `supportsPromptCache*`
  capability predicates.** You consume them.
- **The proxied streaming path's wire contract**, beyond what the direct path needs. If
  `callProxiedCompletionStream` cannot honour `cache` without a proxy-side protocol change, **refuse
  it explicitly the way #679 refused `endpoint`** rather than forwarding a field no deployed proxy
  reads — and say so in the PR. Silently accepting it is the defect #679 existed to fix.
- `@fgv/ts-prompt-assist`, consumed unchanged. `toCacheRequest` already produces the plan.
- Every other package.

## Acceptance

- `cache?: IAiCacheRequest` on **both** `IExecuteClientToolTurnParams` and
  `callProviderCompletionStream`'s params, honored end to end.
- Validation runs **per round**, against that round's `system`, and **fails the round** rather than
  dropping the plan.
- A descriptor supporting neither breakpoints nor routing gets a request body byte-identical to the
  no-`cache` case.
- Breakpoints and routing key remain independently gated.
- **Tests assert the request body**, not merely that the call succeeded. This is the #679 lesson: a
  dropped parameter still returns 200, and a success-only assertion passes against every broken
  version.

## Repo gates

- [ ] `rushx build` — zero warnings · `rushx lint` · `rushx fixlint`
- [ ] `rushx test` — 100% on all four metrics
- [ ] `code-reviewer` **before** closing coverage gaps
- [ ] `node common/scripts/install-run-rush.js rebuild`
- [ ] **`node common/scripts/install-run-rush.js test`** — load-bearing here: this *widens what these
      functions accept* without moving a signature elsewhere, which a rebuild is structurally unable
      to see
- [ ] Change file for `@fgv/ts-extras`, verified against `origin/release`
- [ ] `CAPABILITIES.md` updated; index row stays one line
- [ ] Every step `.github/workflows/ci.yml` runs

## Parallel-stream collision note

`agent-tasks-t4` runs concurrently on `integration/agent-tasks-v1`, in `libraries/ts-agent-tasks`.
**No code overlap.** But both streams touch `.ai/instructions/LIBRARY_CAPABILITIES.md` and
`docs/WORKSTREAMS.md` — **own section only**, per this repo's standing rule for parallel streams.

## Branch and PR posture

Branch `claude/ai-assist-streaming-cache`, off `release` at `af05bb319`. **PRs into `release`** —
this is an ordinary feature stream, not part of the agent-tasks integration branch.

`rush change --verify --target-branch origin/release`.

## Exit artifact

Standard: `state.md` through the run, `result.md` at the end, `/finalize-task` in the PR before
merge — this stream closes on landing.

`result.md` should record what the proxied streaming path does with `cache` and why.

## Required reading, in order

1. `libraries/ts-extras/src/packlets/ai-assist/completionClient.ts` — the reference implementation.
   `:180`, `:322`, `:435`, `:585`, and especially `:915–925` (capability gating, with the comment
   explaining why the two are gated independently).
2. `libraries/ts-extras/src/packlets/ai-assist/cacheRequest.ts` — `IAiCacheRequest`,
   `validateAiCacheRequest`, `supportsPromptCacheBreakpoints`, `supportsPromptCacheRouting`.
3. `libraries/ts-extras/src/packlets/ai-assist/streamingClient.ts` — especially `:63–72` on why
   client tools do not flow through it, and the destructure at `:109`.
4. `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts`.
5. **PR #679** — the same family of defect (proxied entry points dropping declared parameters), and
   the precedent for refusing rather than silently ignoring a parameter a path cannot honour.
6. `libraries/ts-extras/CAPABILITIES.md` § ai-assist prompt-cache entries.

## Missing-input rule

If any statement above does not match the tree, **STOP and surface it.** The file/line references
were verified on `af05bb319`; if they have moved, the code has changed under this brief.
