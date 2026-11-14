# Brief: `testbed-model-probes` — live probes for the claims #765 and #767 inferred from docs

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** a user request. Before the user runs the testbed live, cover the behaviours that #765 (`resolveMaxOutputTokens`) and #767 (alias refresh) derived from provider documentation and that no live scenario exercises yet. Groq and Mistral stay out of scope. The user runs the scenarios locally with their own keys, and no keys exist in this environment. So every live call goes through the existing keyed seam, and the keyless path must stay the STOP-FLAG report.

**Base / PR target:** `integration/asks`.
**Package:** `samples/testbed` (private). Touch `@fgv/ts-extras` only if a probe exposes a genuine defect. Stop and record it in `state.md` rather than fixing it silently.

## Gaps to close
Each probe is added to the existing model-tier canary (`src/scenarios/modelTiers/`). Each must have a row in the canary report and feed into its verdict.

1. **Anthropic thinking effort.** Give `anthropic-model-tiers` the `thinkingEfforts: ['none', 'low']` probe the other providers already have, plus the `'none'` with `onUnsupported: 'fail'` row where Gemini has one. Expected results, which the probe must state and classify:
   - **`@anthropic:haiku` (`claude-haiku-5-5`) with `'none'`:** sends `thinking: {type: 'disabled'}`, and the provider accepts it.
   - **sonnet-5-5, opus-5-5 and fable-5-1 with `'none'`:** degraded to `'low'` and accepted.
   - **sonnet-5-5, opus-5-5 and fable-5-1 with `'fail'`:** refused before the wire, with no network call.
   - **All models with `'low'`:** adaptive, and accepted.
   
   Check what the existing `rawNone` probe does for OpenAI, xAI and Gemini. Decide whether Anthropic needs a raw `disabled` row on sonnet-5-5 to prove the provider still returns 400. That row would detect a stale thinking-required listing, the same purpose rawNone serves elsewhere. Record the decision.
2. **Temperature.**
   - **Anthropic:** on each Anthropic tier and extra model, send `temperature: 1` with no thinking, then `temperature: 1` with effort `'low'`. Both must be accepted. Then send a non-default `temperature: 0.3` and confirm it is refused before the wire, with no network call.
   - **OpenAI:** on `@openai:mini` (`gpt-6-luna`), send `temperature` with effort `'none'` (expected: accepted), and `temperature` with no effort (expected: a provider 400, per #767's Q8). Classify the expected 400 as `expected-reject`, not as a failure. On `gpt-6.1-sol` (advanced) and `gpt-6-astra` (frontier), `temperature` must be refused before the wire.
3. **Max output.** For every tier and extra model of the Anthropic and OpenAI canaries, plus the Gemini completion tiers, take `limit = AiAssist.resolveMaxOutputTokens(descriptor, spec, tier)`.
   - **If `limit` is defined:** send one completion with `maxTokens: limit` and the tiny prompt. Expected: accepted. A refusal that names `max_tokens` or the output limit is a real failure: the recorded value is too high.
   - **If `limit` is undefined:** report `no-recorded-limit` and make no call.
   
   Keep the cost tiny. The prompt asks for one word, so a high cap costs nothing extra.
4. **Stale comment.** `anthropicClientTools/index.ts` says effort `'low'` "maps to the lowest thinking budget". Correct it for adaptive thinking.

## Decisions
- **Follow the canary's existing shape.** Options flow through `ICanaryCompleteOptions`, results through the existing classification, report and verdict. Do not build a parallel harness. Extend the `complete` seam's options as needed, e.g. `temperature` and `maxTokens`.
- **Refused-before-wire rows must prove no network call happened.** In unit tests, inject a `complete` that records calls. In the live seam, a local refusal returns before `fetch`. The report labels it `refused-locally`.
- **The live seam stays the only coverage-ignored region.** Do not add new `c8 ignore` directives. If one seems unavoidable, stop and record it in `state.md`.
- **Update the scenario descriptions, TSDoc and the testbed README's scenario notes** so a reader knows what each new row means and what result to expect.
- **Change file:** testbed is private, so no change file is needed unless `rush change --verify` asks for one. If `ts-extras` is touched, it needs one.

## Acceptance
- [ ] testbed build, lint and test pass, with the keyless path covered via injected deps.
- [ ] A keyless run of each changed scenario (`node bin/testbed.js --scenario <id>`) prints the new rows as `not-run`, with the STOP-FLAG verdict. Paste the output into `result.md`.
- [ ] Repo-wide `rush rebuild` and `rush test` pass.
- [ ] `change --verify --target-branch origin/integration/asks`, prettier 2.8, `verify-capability-docs` and `generate-capability-feed --check` all pass.
- [ ] `result.md` includes a **run sheet** for the user: the exact commands, and for each new row the expected outcome and what a deviation would mean.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-11/testbed-model-probes/`, with a ledger entry (`#TBD`). The feed headline is opted out (a sample, not a capability).

## Mechanics
- Work only in `/home/user/fgv-probes`, on branch `testbed-model-probes`. Push only to that branch. Open no PR.
- Logs go under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/probes/`.
- Commit before gating. Run the gates in the foreground, except the repo-wide test, which runs in the background and is waited for in the same turn.
- No sub-agents. Do not run a `code-reviewer` pass.
