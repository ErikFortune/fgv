# Brief: `model-alias-refresh` — bring every provider's model aliases up to date

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** a user request to check that the `ai-assist` model aliases are current for every provider. Known drift, found while landing #765:
- `@anthropic:haiku` → `claude-haiku-4-5-20251001`. Its page says "Retirement: not sooner than October 15, 2026", and Haiku 5.5 now exists.
- `@anthropic:sonnet` → `claude-sonnet-5`, while Sonnet 5.5 is listed.
- `@openai:nano` → `gpt-5.4-nano`, whose only snapshot is marked Deprecated.

**Base / PR target:** `integration/asks`.
**Package:** `@fgv/ts-extras` (`ai-assist`, an active surface). Touch other packages only where a repo-wide test pins an alias target. Record each such case.

## Scope
Every descriptor in `libraries/ts-extras/src/packlets/ai-assist/registry.ts`. That means every alias in `aliases`, every `defaultModel` entry, and every per-model declaration a rotation depends on:
- `adaptiveThinkingModelPrefixes`
- the thinking-off refusal list
- `responsesOnlyModelPrefixes`
- `structuredOutput`
- `imageGeneration`
- `embedding`
- `maxOutputTokens`
- `DEFAULT_MODEL_CAPABILITY_CONFIG`

Check the OpenAI-format `max_completion_tokens` field rule (`usesMaxCompletionTokensField`) for any new OpenAI target.

## Decisions
1. **Sources, not memory.** For each provider, fetch its current models page, plus its deprecation or lifecycle page where one exists, during this run. Every target you keep or change needs a citations table in `result.md`: alias, old target, new target, URL, quoted line, and lifecycle status.
   - Network: `aistudio.google.com`, `console.groq.com` and `docs.mistral.ai` were just added to the environment's allowed hosts. If one is still refused, record that provider as unverified and leave its aliases unchanged.
2. **Rotation rule.** An alias targets the provider's current generally-available model for that role. That means not preview, experimental or deprecated, unless the alias is explicitly a preview alias. Move an alias when:
   - its target is deprecated, retired, or has a scheduled retirement date that has passed; or
   - a newer GA model fills the same role (tier and price class). For example, mini stays a mini.
   
   Do not move a role up or down a tier. When the role mapping is ambiguous, keep the target and record the question in `state.md`.
3. **A rotation is only as good as its wire declarations.** For every new target, check from documentation what the existing registry encodes about the old target:
   - the thinking wire shape (adaptive vs budget, whether off is allowed)
   - whether it is Responses-only
   - the structured-output mechanism
   - the tool-choice constraints
   - image input
   - the max-output limit
   
   Then add or adjust the per-model declarations so the new target is called correctly.
   - The comments in `registry.ts` record earlier holds. One example: `claude-opus-5-5` 400s on a forced `tool_choice`. Re-check each hold and keep it unless a source shows it lifted.
   - If you cannot confirm a wire requirement for a candidate, do not rotate to it. Record why.
4. **Keep the max-output coverage honest.** Every new cloud alias target must have a cited `maxOutputTokens` entry (exact model id, per #765), or appear on the coverage test's exclusion list with a reason. Gemini, Groq and Mistral are now reachable, so record their limits where a page cites them, and remove each one you record from the exclusion list. xAI still publishes only a default; leave it excluded unless a maximum is now stated.
5. **No new model families or capabilities beyond what the aliases need.** This is a currency pass, not a feature.
6. **Change file:** `minor` for `@fgv/ts-extras`, because alias targets change behaviour for consumers who use aliases. The comment lists every alias that moved, old → new.

## Required evidence
- The citations table, plus a table of unchanged aliases with the reason each is still current.
- Tests: update the alias pins. Each rotated target must get a test asserting its wire declarations, for example that it resolves to the adaptive shape or is Responses-only. The max-output alias-coverage test must stay green.
- `ts-extras` `CAPABILITIES.md` and README: update any alias table or target they list.

## Acceptance
- [ ] `ts-extras` build, lint and test pass at 100% coverage.
- [ ] Repo-wide `rush rebuild` **and** `rush test` pass. Alias targets are pinned in other packages' tests and samples, so sweep `libraries/`, `tools/` and `samples/` for each old target string.
- [ ] `change --verify --target-branch origin/integration/asks`, prettier 2.8, `verify-capability-docs` and `generate-capability-feed --check` all pass.
- [ ] Close out per `finalize-task` to `.ai/tasks/completed/2026-11/model-alias-refresh/`, with a ledger entry (`#TBD`), `result.md` and the feed.

## Mechanics
- Work only in `/home/user/fgv-alias`, on branch `model-alias-refresh`. Push only to that branch. Open no PR.
- Another worker is running a repo-wide dependency refresh in `/home/user/fgv-deps` at the same time. Do not touch that directory.
- Logs go under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/alias/`.
- Commit before gating. Run the gates in the foreground, except the repo-wide test, which runs in the background and is waited for in the same turn.
- No sub-agents. Do not run a `code-reviewer` pass; the orchestrator runs independent review.
