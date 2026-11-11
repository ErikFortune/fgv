# Brief: `fable-5-2` — rotate `@anthropic:fable` to Claude Fable 5.2 and register Mythos 5.2

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** user request, 2026-11-11. Anthropic released Claude Fable 5.2 (`claude-fable-5-2`) and Claude Mythos 5.2 (`claude-mythos-5-2`, verified organizations only). The registry's `@anthropic:fable` still targets `claude-fable-5-1`. No declaration names a `5-2` id.

**Base / PR target:** `integration/asks`.
**Packages:** `@fgv/ts-extras` (`ai-assist`) and `samples/testbed`.

## Orchestrator's reading of the docs
This comes from Anthropic's API reference cached 2026-11-03. **Verify every point against pages you fetch.** Start with `platform.claude.com/docs/en/about-claude/models/overview` and the Fable 5.2 model page, then the thinking page `build-with-claude/thinking`, and the migration guide section "Migrating to Claude Fable 5.2".
- **Pricing and limits.** $8 / $40 per MTok, which is cheaper than Fable 5.1's $10 / $50. 1M context, **128K max output**. Fable 5.1 is still served.
- **Same request surface as 5.1:**
  - Thinking is always on. `{type:'disabled'}` and `budget_tokens` return 400, and omitting `thinking` runs adaptive.
  - Forced `tool_choice` `any`/`tool` returns 400.
  - Sampling parameters are restricted.
  - Effort runs low through max.
  - No assistant prefill.
- **Breaking changes relative to 5.1** that may touch ai-assist:
  - **Preserved thinking's history-editing check is enforced on every account.** Replayed thinking blocks must come back unedited and append-only.
  - No earlier model reads 5.2's thinking blocks.
  - `computer_20251124` returns 400 on most platforms. ai-assist doesn't use it; just confirm.
- Mythos 5.2 has the same capabilities and API surface.

## Decisions
1. **Rotate `@anthropic:fable` → `claude-fable-5-2`.** It is the same role, it is GA, and it is cheaper. Under the rotation rule, the price drop is not a tier move.
2. **Every per-model declaration must cover `claude-fable-5-2` and `claude-mythos-5-2`.** For each declaration below, confirm the existing dash-bounded entry matches or add an explicit one, and give each a cited source:
   - `adaptiveThinkingModelPrefixes`
   - `thinkingRequiredModelPrefixes`
   - `samplingParamsRejectedModelPrefixes`
   - the `structuredOutput` capability. This one uses plain prefix matching and names `claude-fable-5-1` / `claude-mythos-5-1` explicitly. **Without an entry, 5.2 falls through to the forced-tool path and returns 400.**
   - `maxOutputTokens`, which matches exact ids only: add `claude-fable-5-2` and `claude-mythos-5-2` at the cited value.
   - capability detection in `DEFAULT_MODEL_CAPABILITY_CONFIG`
   - the model-name unions
   - `anthropicThinkingOffTypes`, which should stay default (unused, since the model is thinking-required). Confirm this.
3. **Temperature.** The live run accepted `temperature: 1` on `claude-fable-5-1`. If the docs say 5.2 differs, so that any temperature returns 400, declare that from the source. Otherwise keep the existing accepted-default behaviour, and leave it for the live testbed run to confirm.
4. **Preserved thinking on every account.** Trace how ai-assist rebuilds the assistant turn when it continues a client-tool conversation (`clientToolContinuationBuilder`, Anthropic streaming adapter), and how `runClientToolLoop` replays thinking blocks. Answer one question: does the replayed history stay byte-for-byte append-only, with thinking blocks (including signatures and empty `thinking` text) passed back unchanged?
   - **If yes:** say so in `result.md` with the code references.
   - **If not:** fix it, with request-body tests. If the fix is larger than a few lines, stop and record it in `state.md`.
5. **Testbed.**
   - Probe rows that follow `@anthropic:fable` pick up 5.2 automatically. Update every pinned id.
   - Make `anthropic-client-tools` able to run on `@anthropic:fable` as well as `@anthropic:sonnet`. A scenario option, a second scenario id, or an env var are all fine; pick the least intrusive. That gives the user a live check of the replay path on 5.2.
   - Update the run sheet with the new rows and what each deviation means.
6. **Change file:** `minor` for `@fgv/ts-extras`, stating the alias move and the new declarations.

## Acceptance
- [ ] `ts-extras` and `testbed` build, lint and test pass at 100%, with no new `c8 ignore`.
- [ ] Request-body tests: `@anthropic:fable` resolves to `claude-fable-5-2`, and the following hold for both 5.2 ids:
  - structured output uses `output_config.format` with no `tool_choice`;
  - `'none'` is degraded to `'low'`, or refused under `'fail'`;
  - a non-default temperature is refused locally;
  - `resolveMaxOutputTokens` returns the cited value.
  
  Run each red before the change and green after.
- [ ] Repo-wide `rush rebuild`, `rush lint` and `rush test` pass.
- [ ] `change --verify --target-branch origin/integration/asks`, prettier 2.8, `verify-capability-docs` and `generate-capability-feed --check` pass.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-11/fable-5-2/`, with a ledger entry (`#TBD`), `result.md` with a citations table and the run sheet, and the feed.

## Mechanics
- Work only in `/home/user/fgv-fable`, on branch `fable-5-2`. Push only to it. Open no PR.
- Logs go under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/fable/`.
- Commit before gating. Run gates in the foreground, except the repo-wide test, which runs in the background and is waited for.
- No sub-agents. No code-reviewer pass.
