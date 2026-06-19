# Brief: make `executeClientToolTurn` continuation cumulative (kill the multi-round footgun)

**Stream:** `ai-assist-tool-continuation`. Integration branch off `release`. Commissioned 2026-06-07 (Erik). Sub-branches → PR INTO `ai-assist-tool-continuation`. Never `main`.
**Surface:** `@fgv/ts-extras/ai-assist` (active development).
**Origin:** PersonAIlity consumer footgun (the second after message-ordering) — confirmed against the code.

## The footgun (confirmed)

In a multi-round client-tool loop, `IAiClientToolContinuation.messages` returned from each round is **per-round only** — the `build{Anthropic,OpenAi,Gemini}Continuation` functions return just *this* round's exchange (`messages: [assistantMessage, userMessage]` — `clientToolContinuationBuilder.ts:170 / :224 / :287`), and `executeClientToolTurn` appends the inbound `continuationMessages` verbatim without accumulating (`:413` destructure → `:487/501/514` pass-through; placed as `[system, …history, current user turn, …continuation]` per `model.ts:178`).

So a consumer who does the natural thing — `continuationMessages = outcome.continuation.messages` (replace) — sends only the **last** round's tool exchange every round. The model loses earlier tool results, re-issues identical calls, and loops to the round cap. Today the consumer is forced to manually accumulate (`[...prior, ...outcome.continuation.messages]`), which is undocumented; the `LIBRARY_CAPABILITIES.md` wording (*"continuation.messages from the prior turn's result"*) actively reads like the broken replace pattern. The only in-repo reference (`*ClientTools` testbed scenarios) is fixed **two-turn**, the degenerate case where replace == accumulate, so it never surfaced this.

## The fix (decided: make the continuation cumulative)

**Make `IAiClientToolContinuation.messages` the full accumulated tool tail**, so replace becomes correct for all N. In `executeClientToolTurn`, right after the continuation is assembled (the `switch` at `clientToolContinuationBuilder.ts:689–698`), prepend the inbound `continuationMessages`:

```ts
let continuation: IAiClientToolContinuation;
switch (descriptor.apiFormat) { /* build{Anthropic,OpenAi,Gemini}Continuation → per-round tail */ }
if (continuationMessages && continuationMessages.length > 0) {
  continuation = { ...continuation, messages: [...continuationMessages, ...continuation.messages] };
}
```

After this, `outcome.continuation.messages` always contains rounds `1..N`, and the canonical loop is just **replace**:

```ts
let tail: JsonObject[] | undefined = undefined;
while (true) {
  const { events, nextTurn } = AiAssist.executeClientToolTurn({
    system, messages: baseMessages, clientTools, continuationMessages: tail
  }).orThrow();
  for await (const e of events) { /* observe */ }
  const outcome = (await nextTurn).orThrow();
  if (outcome.continuation === undefined) break;
  tail = outcome.continuation.messages;   // REPLACE — now cumulative, no manual concat
}
```

### Decisions to pin (with recommendations)
- **`toolCallsSummary` stays per-round** (it's the "what executed *this* turn" diagnostic). Document the split explicitly: `messages` = cumulative wire tail to re-send; `toolCallsSummary` = this round's calls. (If you find a reason to make it cumulative, flag it — but per-round is the recommendation.)
- **Provider homogeneity:** within a loop the same descriptor/provider is used every round, so inbound `continuationMessages` and the freshly-built tail are the same provider-native wire shape — concatenation is valid. (Cross-provider continuation is not a supported scenario; no need to handle mixing.)
- **Keep them provider-native / out of the normalized path** — unchanged; the existing warning is correct (thinking/redacted_thinking, OpenAI function_call items, Gemini parts must not be normalized). Reaffirm in the doc.

### Backward compatibility
The existing two-turn `*ClientTools` scenarios are unaffected: round-1 inbound `continuationMessages` is empty, so cumulative `== ` per-round, and they only ever do one continuation. Existing unit tests should stay green; if any asserted exact per-round `continuation.messages` *with* a non-empty inbound continuation, update it to the cumulative expectation (that's the intended behavior change).

## Tests (load-bearing — this is the gap that hid the footgun)
- **Multi-round (N ≥ 3) unit test** (mock fetch): drive three tool rounds; assert `outcome.continuation.messages` is **cumulative** each round (round 2 contains round-1 + round-2 tails; round 3 contains 1+2+3), and that feeding it back via **replace** produces a request whose wire tail contains the full transcript in order. This is the canonical reference the repo lacked.
- Keep the single-continuation path covered (unchanged behavior).
- Consider extending one `*ClientTools` testbed scenario to >2 rounds as the live reference (or file as a fast-follow if it bloats this PR).

## Docs
- `LIBRARY_CAPABILITIES.md` — fix the `executeClientToolTurn` bullet: `continuationMessages` should be **the latest `continuation.messages` (now cumulative — replace, do not manually concatenate)**. Remove the misleading "from the prior turn's result" framing.
- TSDoc on `IExecuteClientToolTurnParams.continuationMessages` and `IAiClientToolContinuation.messages` — state that `messages` is the **full accumulated** provider-native tail and that callers re-supply it as-is each round.

## Gates
`rushx build` + `rushx lint` + `rushx test` (100%) in `@fgv/ts-extras` (+ `@fgv/testbed` if the scenario is touched); regenerate `etc/ts-extras.api.md` (type surface is unchanged, but confirm); `rush change` file (`@fgv/ts-extras`, type `none` — behavior change on active surface, no version-policy semantics); `rushx fixlint`; run `code-reviewer` on the diff before coverage closure. Report: the seam change, the multi-round test, the doc deltas, and confirmation existing tests pass (or which were updated to the cumulative expectation and why).
