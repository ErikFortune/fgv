# Brief: `model-max-output-tokens` — each model's maximum output tokens, resolvable through aliases

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#724 (fgv-ask). Anthropic and OpenAI do not clamp a `maxTokens` above a model's output limit; they refuse the request. Aliases resolve inside fgv, so a consumer cannot know which model a slot will reach, and has to pick one number for every model that slot might resolve to. PersonAIlity's reflection curator needs about 33k output tokens to leave room for an always-thinking Claude model's reasoning. That is too large for a mini-tier model on the same slot. Their interim: a constant cap, with a lift condition of `min(curator cap, model limit)`.

**Base / PR target:** `integration/asks`.
**Package:** `@fgv/ts-extras` (`ai-assist` packlet, which is an active surface). Touch no other package unless a consumer sweep forces it, and record why if it does.

## Facts (verified on integration/asks @ ac99bdc2)
- `registry.ts` already has an alias-first, longest-prefix helper, `resolveCapabilityForModel`. It backs `resolveImageCapability`, `resolveEmbeddingCapability` and `resolveStructuredOutputCapability`. An unresolvable alias yields `undefined`; it never falls through to a catch-all.
- `IAiProviderDescriptor` (`model.ts`) declares these capability arrays as optional `ReadonlyArray<{ modelPrefix, … }>`.
- `DEFAULT_ANTHROPIC_MAX_TOKENS` is what the Anthropic adapters send when the caller sets no `maxTokens`. The Messages API requires the field.

## Decisions
1. **Same idiom as the existing per-model capabilities.** Add an exported `IAiMaxOutputTokensCapability { readonly modelPrefix: string; readonly maxOutputTokens: number }`. Add an optional descriptor field, `maxOutputTokens?: ReadonlyArray<IAiMaxOutputTokensCapability>`; the field name is your call if it reads better next to its siblings. Add `resolveMaxOutputTokens(descriptor, modelId): number | undefined`, built on `resolveCapabilityForModel`. It is alias-first. It returns `undefined` for an unresolvable alias, for a provider with no entries, and for a model no entry matches. Do not create a second matching helper.
2. **No catch-all in the shipped registry.** A `modelPrefix: ''` entry would answer an unknown model with a confidently wrong number, which is the defect this helper family exists to prevent. Here a wrong number is worse than none: a too-high answer is refused by the provider, and a too-low one silently truncates. Pin this with a test over every shipped descriptor. Hand-built descriptors may still declare one; document that it is their call.
3. **Populate the shipped registry from sources, not memory.** Fill in every cloud provider that has a registry descriptor. Include at least the concrete target of every registered alias, plus the families those targets belong to. Self-hosted providers (`ollama`, `openai-compat`) declare nothing. Each value must be **cited from a provider page you fetched in this run**: the model page, the models overview, or the API reference. Put a citations table in `result.md`: model, prefix, value, URL, and the quoted line. If a source gives no number, or two sources disagree, record nothing for that model, say why in `result.md`, and leave the lookup returning `undefined`. Record the limit a request **as ai-assist sends it** would get. If a provider raises the limit only behind an opt-in header or flag that ai-assist does not send, record the default limit and note the opt-in.
4. **Pin alias coverage.** Add a test asserting that every registered alias of every cloud provider resolves to a recorded limit, or is on an explicit, commented exclusion list (for example, image and embedding aliases have no completion output limit). Then the next alias rotation cannot silently drop coverage.
5. **The Anthropic default.** Check `DEFAULT_ANTHROPIC_MAX_TOKENS` against every recorded Anthropic limit. If any registered Anthropic model's limit is below the default, a call without `maxTokens` is refused today. In that case, send `min(default, resolved limit)` at the adapter sites that apply the default, and cover it with a test at each such call site. Per TESTING_GUIDELINES, enumerate the callers, and for each one show its test go red when that site is reverted. If the default is below every limit, change nothing and record that finding.
6. **Do not clamp an explicit caller `maxTokens`.** That is the consumer's decision. The ask is for the lookup so they can make it. Silently lowering an explicit value would turn a loud refusal into silent truncation. Record this decision in `result.md` so the consumer sees why.
7. **Change file:** `minor` for `@fgv/ts-extras`. It is additive; mention point 5's behaviour change if one was made.

## Required evidence
- Unit tests for `resolveMaxOutputTokens`: a concrete id, an alias, an unresolvable alias, a provider with no entries, longest-prefix precedence, and no catch-all in the shipped registry.
- The citations table, plus the alias-coverage test.
- `ts-extras` `CAPABILITIES.md`: document the lookup. Add an index shortcut in `LIBRARY_CAPABILITIES.md` if it fits the router budget, for example "**Which `maxTokens` will a model accept?** → `resolveMaxOutputTokens`". `verify-capability-docs` enforces the budget.

## Acceptance
- [ ] `ts-extras` build, lint and test pass at 100% coverage.
- [ ] Repo-wide `rush rebuild` **and** `rush test` pass. This widens `IAiProviderDescriptor`, so sweep for hand-built descriptors in `libraries/`, `tools/` and `samples/`. It is optional, so nothing should break; confirm that.
- [ ] `change --verify --target-branch origin/integration/asks` passes.
- [ ] prettier 2.8 and `verify-capability-docs` pass.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-11/model-max-output-tokens/`, with a ledger entry (`#TBD`) and the feed. `result.md` is required.

## Mechanics
- Work only in `/home/user/fgv-mot`, on branch `model-max-output-tokens`. Push only to that branch. Open no PR.
- Commit before gating. Run gates in the foreground, except the repo-wide test, which runs in the background and is waited for in the same turn. Use log paths under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/mot/`.
- No sub-agents. Do not run a `code-reviewer` pass; the orchestrator runs independent review.
