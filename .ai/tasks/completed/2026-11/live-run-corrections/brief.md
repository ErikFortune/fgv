# Brief: `live-run-corrections` — two registry corrections from the 2026-11-10 keyed run

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** the user's keyed run on `release` @ f6be787a. It answered the two open follow-ups from `final-model-fixes`: F3, and the OBSERVED rows.

**Base / PR target:** `integration/asks`.
**Packages:** `@fgv/ts-extras` (`ai-assist`) and `samples/testbed`.

## Live evidence
1. **Gemini 3.8 Flash.** A raw `thinkingConfig.thinkingBudget: 0` request to `gemini-3.8-flash` (`generateContent`) returned `usageMetadata` with `promptTokenCount: 8`, `candidatesTokenCount: 1`, `totalTokenCount: 9` and **no `thoughtsTokenCount`**. Budget 0 really does turn thinking off on that model. #769's listing, which was inferred from Google's level table, is wrong for this model.
2. **OpenAI.** The testbed's `[OBSERVED] advanced temp=1 raw gpt-6.1-sol (accepted)` and `[OBSERVED] frontier temp=1 raw gpt-6-astra (accepted)` rows show that both models accept `temperature: 1`. Each was sent through a verbatim `'other'` block at the default effort, so thinking was on. Luna's 400 for 0.3 says "Only the default (1) value is supported", which is consistent.

## Decisions
1. **Remove `gemini-3.8-flash` from Gemini `thinkingRequiredModelPrefixes`.** `gemini-3.5-flash-lite` stays: it returned 400 on budget 0. A generic `'none'` on `@google-gemini:flash` (the base tier) sends `thinkingBudget: 0` again.
   - Update the registry comment, quoting the evidence above with its date. Keep the interim `thinkingLevel` lift-condition comment for flash-lite.
   - Note the dash-bounded side effect: `gemini-3.8-flash-*` variants are no longer caught by this entry. Say so.
2. **OpenAI accepts the default temperature.** Set the OpenAI descriptor's `samplingParamsAcceptedTemperature: 1`.
   - On `gpt-6.1-sol` and `gpt-6-astra`, `temperature: 1` is sent, with or without effort. Any other value is still refused before the wire.
   - Confirm that `checkTemperatureConflict`'s exemption, `temperatureAcceptedWithThinking`, lets 1 through with an effort on these models, as it does for Anthropic. This must stay data-driven, with no provider branch.
   - state.md Q1 from `final-model-fixes` is that the field is descriptor-wide. Record its resolution here: the OpenAI rejected list is exactly sol and astra, and the evidence covers both. Mention it in the field's TSDoc.
   - Update the refusal message wording so OpenAI reads like Anthropic: "does not accept a non-default temperature (x): remove temperature, or send 1".
3. **Testbed expectations.**
   - Gemini: the `base effort=none` row (3.8-flash) is back to "sent with thinking off". `base none+fail` reads PASS.
   - OpenAI: replace the two `[OBSERVED] temp=1 raw` rows with typed `temp=1` rows on sol and astra, expected PASS (sent through the library, not raw). Add `temp=1+effort=low` on both, expected PASS. Keep `temp=0.3` as REFUSED-LOCALLY.
   - Update the testbed README and the run sheet in this task's `result.md`.
4. **Docs.** Update the change file (`minor`, `@fgv/ts-extras`), the ai-assist README and CAPABILITIES so they state the new behaviour. Remove the stale text that said 3.8-flash cannot turn thinking off, and the text that said OpenAI refuses every temperature. Resolve `final-model-fixes` follow-ups F3 and Q1, and the OBSERVED follow-up, by noting where they were resolved. Do not edit `final-model-fixes/result.md` itself. Each claim in `docs/FUTURE.md` about Gemini `thinkingLevel` stays.

## Acceptance
- [ ] `ts-extras` and `testbed` build, lint and test pass at 100% coverage, with no new `c8 ignore`.
- [ ] Request-body tests prove each change, and each test is shown failing before the change and passing after it:
  - 3.8-flash `'none'` sends budget 0;
  - flash-lite `'none'` still sends budget 1024;
  - sol and astra `temperature: 1` are sent, with and without effort;
  - 0.3 is still refused.
- [ ] Repo-wide `rush rebuild`, `rush lint` and `rush test` pass.
- [ ] `change --verify --target-branch origin/integration/asks`, prettier 2.8, `verify-capability-docs` and `generate-capability-feed --check` all pass.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-11/live-run-corrections/`, with a ledger entry (`#TBD`) and the feed.

## Mechanics
- Work only in `/home/user/fgv-lrc`, on branch `live-run-corrections`. Push only to that branch. Open no PR.
- Logs go under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/lrc/`.
- Commit before gating. Run gates in the foreground, except the repo-wide test, which runs in the background and is waited for. No sub-agents. No code-reviewer pass.
