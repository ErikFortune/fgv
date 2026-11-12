# Brief: `final-model-fixes` — what the first live testbed run showed

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** the user's first keyed run of the #768 probes (2026-11-09). Everything passed except the two below, and the run also showed one wire that was mis-declared.

**Base:** this branch starts from `testbed-model-probes` (#768, not yet merged). Its PR targets `integration/asks` after #768 lands; the orchestrator brings in the base.

**Packages:** `@fgv/ts-extras` (`ai-assist`) and `samples/testbed`.

## Live evidence
1. **Gemini.**
   - `gemini-3.5-flash-lite` with effort `'none'`, which ai-assist sends as `thinkingConfig.thinkingBudget: 0`, returns `400 INVALID_ARGUMENT "Request contains an invalid argument."`. `'low'` (budget 1024) passes.
   - `gemini-3.8-flash` accepts budget 0, but Google's thinking page lists its levels as "low, medium, high" with default "On (medium)". So nothing turns thinking off on it, and the canary's "sent with thinking off" row overstates what happened.
   - Source: `https://ai.google.dev/gemini-api/docs/thinking.md.txt` (it redirects to aistudio.google.com), § "Controlling thinking", table rows for gemini-3.8-flash, gemini-3.6-flash and gemini-3.5-flash-lite.
2. **Sonnet 5.5.** A raw `thinking: {type: 'disabled'}` returned 400: *"To turn thinking off on this model, send "thinking": {"type": "between_tools"} instead of {"type": "disabled"}. The model does not think before responding. The short updates it writes between tool calls come back as thinking blocks."*
   - Opus 5.5 and Fable 5.1 returned "`thinking.type.disabled` is not supported for this model. Use `thinking.type.adaptive` and `output_config.effort`", so neither has an off value.
3. **OpenAI.** `gpt-6-luna` with `temperature: 0.3` returned *"'temperature' does not support 0.3 with this model. Only the default (1) value is supported."* That suggests `gpt-6.1-sol` and `gpt-6-astra` may also accept `1`, while ai-assist currently refuses every temperature on them. This is unconfirmed.

## Decisions
1. **Gemini, interim.** Add `gemini-3.5-flash-lite` and `gemini-3.8-flash` to `thinkingRequiredModelPrefixes`, using the same dash-bounded idiom, with the doc table quoted. A generic `'none'` then becomes `'low'`, or is refused under `onUnsupported: 'fail'`.
   - At the declaration, write the interim comment with its lift condition: *Gemini 3.x is controlled by `thinkingLevel`, which ai-assist does not send yet; once it does, `'none'` maps to `minimal` on the models that list it.*
   - Do **not** implement `thinkingLevel` here. It is a separate stream; add it to `docs/FUTURE.md`, or `TECH_DEBT.md` if that fits better, together with the held Gemini 4 Argon rotation.
2. **Sonnet 5.5 thinking off.** On `claude-sonnet-5-5`, a generic `'none'` sends `thinking: {type: 'between_tools'}`.
   - Make it a data declaration: a per-model Anthropic off value, `between_tools`, beside the existing `disabled` default. No model check at a call site.
   - Remove `claude-sonnet-5-5` from `thinkingRequiredModelPrefixes`.
   - Docs: `between_tools` returns 400 at effort `xhigh` and `max`. A bare `'none'` sends no effort, so that limit cannot be hit. Still, confirm in code that `'none'` never sends an effort beside it.
   - Update the client-tool `anthropicThinkingDisabled` path the same way: it sends `between_tools` on that model instead of refusing.
   - Tests: request bodies for completion, streaming and client-tool, red-then-green.
   - Disclose the change in the change file, README and CAPABILITIES. The base tier's `'none'` changes again, this time to real thinking-off, and the response returns the inter-tool-call notes as thinking blocks.
3. **OpenAI `temperature: 1`: probe only.** Add one testbed row that bypasses the local gate: a raw `'other'` block, the way the raw-none rows already work, or another sanctioned bypass. It sends `temperature: 1` to `gpt-6.1-sol` and to `gpt-6-astra`. Expected outcome: report-only, `OBSERVED <accepted|rejected: provider text>`, with no pass/fail claim, because we don't know the answer yet. Do not change the registry. Record the follow-up in `state.md` and in the run sheet.
   - If no sanctioned bypass exists for `temperature`, say so and skip it rather than adding one to ai-assist.
4. **Testbed expectations.** Update the #768 probes to the new truth:
   - Anthropic `base effort=none` reads "sent with thinking off (between_tools)".
   - `base none+fail` passes.
   - `base none raw` (the `disabled` row) stays EXPECTED-REJECT.
   - Gemini `base` and flash-lite `effort=none` are degraded to `'low'`, and `none+fail` is REFUSED-LOCALLY.
   - Raw budget-0 rows: flash-lite is expected to reject with `/invalid argument/i`. Give `gemini-3.8-flash` no raw row and note why: it accepts budget 0 and ignores it, so a raw row cannot tell anything apart.
   - Update the run sheet in this task's `result.md`. Keep #768's own `result.md` as written.
5. **Change files.** `minor` for `@fgv/ts-extras`. The testbed is private.

## Acceptance
- [ ] `ts-extras` and `testbed` build, lint and test pass at 100%, with no new `c8 ignore`.
- [ ] Repo-wide `rush rebuild` and `rush test` pass.
- [ ] `change --verify --target-branch origin/integration/asks` passes. Check it against the base the PR will have; the orchestrator merges #768 first.
- [ ] prettier 2.8, `verify-capability-docs` and `generate-capability-feed --check` pass.
- [ ] `result.md` contains the updated run sheet for the changed rows.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-11/final-model-fixes/`, with a ledger entry (`#TBD`) and the feed.

## Mechanics
- Work only in `/home/user/fgv-final`, on branch `final-model-fixes`, and push only to it. Open no PR.
- Logs go under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/final/`.
- Another gate is running in `/home/user/fgv-probes`; do not touch that directory.
- Commit before gating. Run the gates in the foreground, except the repo-wide test, which runs in the background and is waited for. No sub-agents, and no code-reviewer pass.
