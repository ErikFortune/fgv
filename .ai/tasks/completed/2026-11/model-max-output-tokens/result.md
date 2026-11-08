# Result: `model-max-output-tokens`

**Shipped:** `AiAssist.resolveMaxOutputTokens(descriptor, modelId)` in `@fgv/ts-extras` returns
the largest `maxTokens` a provider accepts for a model, or `undefined` when the limit is unknown. It
is alias-first, so a consumer can ask about the slot it holds (`@anthropic:opus`) rather than the
model that slot resolves to today. The shipped registry records Anthropic and OpenAI completion
models from provider pages fetched during the run, and declares no catch-all.

Origin: personaility#724 (fgv-ask). Base / PR target: `integration/asks`. PR: #TBD.

## API

- `IAiMaxOutputTokensCapability { readonly modelPrefix: string; readonly maxOutputTokens: number }`
  (`model.ts`, exported from `AiAssist`).
- `IAiProviderDescriptor.maxOutputTokens?: ReadonlyArray<IAiMaxOutputTokensCapability>`, the
  sibling of `imageGeneration`, `embedding` and `structuredOutput`. The field name matches the
  entry's own field and the request option it bounds.
- `resolveMaxOutputTokens(descriptor, modelId): number | undefined` (`registry.ts`). It is a thin
  wrapper over the existing `resolveCapabilityForModel`, so it adds no second matching helper. It
  returns `undefined` for an unresolvable alias, for a provider with no entries and for a model no
  entry matches. The longest prefix wins.

### Decision 6: an explicit `maxTokens` is not clamped

Nothing in ai-assist lowers a caller's explicit `maxTokens` to the model's limit. A too-high value
is refused by the provider, and the refusal is loud. If the library lowered the value silently, the
reply could be truncated with nothing to say why. This lookup exists so the consumer can make the
call themselves:

```ts
const limit = AiAssist.resolveMaxOutputTokens(descriptor, '@anthropic:opus');
const maxTokens = Math.min(curatorCap, limit ?? curatorCap);
```

When `limit` is `undefined`, the consumer keeps its own cap. This is PersonAIlity's stated lift
condition, `min(curator cap, model limit)`.

### Decision 2: no catch-all

No shipped descriptor declares `modelPrefix: ''`. A test pins this: it covers every entry of every
descriptor, and also checks that an id no entry names resolves to `undefined` on every provider. A
hand-built descriptor may still declare a catch-all. The TSDoc on the field and on the entry's
`modelPrefix` says that this is the descriptor's call.

## Citations

All pages were fetched on 2026-11-08.

| provider | model | prefix | value | URL | quoted line |
|---|---|---|---|---|---|
| anthropic | `claude-opus-5-5` (`@anthropic:opus`) | `claude-opus-5-5` | 128000 | https://platform.claude.com/docs/en/models/opus-5-5/overview | "Context window: 1M tokens · Max output: 128K tokens" |
| anthropic | `claude-opus-5` | `claude-opus-5` | 128000 | https://platform.claude.com/docs/en/models/opus-5/overview | "Context window: 1M tokens · Max output: 128K tokens" |
| anthropic | `claude-sonnet-5` (`@anthropic:sonnet`) | `claude-sonnet-5` | 128000 | https://platform.claude.com/docs/en/models/sonnet-5/overview | "Context window: 1M tokens · Max output: 128K tokens" |
| anthropic | `claude-sonnet-5-5` | `claude-sonnet-5-5` | 128000 | https://platform.claude.com/docs/en/about-claude/models/overview | "Max output \| 128K tokens \| 128K tokens \| 128K tokens \| 128K tokens" (Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5 columns) |
| anthropic | `claude-haiku-5-5` | `claude-haiku-5-5` | 128000 | https://platform.claude.com/docs/en/about-claude/models/overview | (same row) |
| anthropic | `claude-fable-5-1` (`@anthropic:fable`) | `claude-fable-5-1` | 128000 | https://platform.claude.com/docs/en/models/fable-5-1/overview | "Context window: 1M tokens · Max output: 128K tokens" |
| anthropic | `claude-fable-5` | `claude-fable-5` | 128000 | https://platform.claude.com/docs/en/models/fable-5/overview | "Context window: 1M tokens · Max output: 128K tokens" |
| anthropic | `claude-mythos-5`, `claude-mythos-5-1` | `claude-mythos-5` | 128000 | https://platform.claude.com/docs/en/build-with-claude/context-windows | "Claude Fable 5.1, Claude Mythos 5.1, Claude Fable 5, Claude Mythos 5, … A single request to any of them can generate up to 128k output tokens (`max_tokens`)." |
| anthropic | `claude-haiku-4-5-20251001` (`@anthropic:haiku`) | `claude-haiku-4-5` | 64000 | https://platform.claude.com/docs/en/models/haiku-4-5/overview | "Context window: 200K tokens · Max output: 64K tokens" |
| openai | `gpt-6-luna` (`@openai:mini`) | `gpt-6-luna` | 128000 | https://developers.openai.com/api/docs/models/gpt-6-luna | "128,000 max output tokens" |
| openai | `gpt-6-sol` (`@openai:flagship`) | `gpt-6-sol` | 128000 | https://developers.openai.com/api/docs/models/gpt-6-sol | "128,000 max output tokens" |
| openai | `gpt-6-astra` (`@openai:pro`) | `gpt-6-astra` | 128000 | https://developers.openai.com/api/docs/models/gpt-6-astra | "128,000 max output tokens" |
| openai | `gpt-5.4-nano` (`@openai:nano`) | `gpt-5.4-nano` | 128000 | https://developers.openai.com/api/docs/models/gpt-5.4-nano | "128,000 max output tokens" |

**How "128K" was read.** No Anthropic page fetched gives the exact integer. The Models API page
shows `max_tokens: 0` in its example. Anthropic's docs use `k` to mean 1,000: the context-windows
page shows a "200k-token" window as `<budget:token_budget>200000</budget:token_budget>`. So the
values are recorded as 128000 and 64000. If `K` meant 1,024, each recorded value is 3,072 low. A
low value can make a consumer cap slightly early. It can never cause a refusal.

**Opt-in limits not recorded.** Anthropic says: "On the Message Batches API, Claude Opus 5.5, Claude
Opus 5, Claude Sonnet 5.5, Claude Sonnet 5, Claude Haiku 5.5, … support up to 300k output tokens
with the output-300k-2026-03-24 beta header." ai-assist uses the synchronous Messages API and sends
no such header. So the synchronous limit is the one recorded.

### Recorded nothing for these providers

The lookup returns `undefined` for every model of these providers.

| provider | aliases / default | why |
|---|---|---|
| `google-gemini` | `@google-gemini:flash`, `:pro`, `:flash-lite` | `ai.google.dev/gemini-api/docs/models` and the per-model pages return 301 to `aistudio.google.com`, which does not resolve from this session's network. No provider page could be read, so no value is recorded. |
| `xai-grok` | `@xai-grok:standard`, `:flagship` | Fetched `docs.x.ai/docs/models`, the `grok-4.7` and `grok-4.3` model pages, and the API reference. The model pages state a context window but no output maximum. The API reference states only a default: `max_output_tokens` "Defaults to 128,000 when unset; set a larger value to allow longer generations." A default is not a limit. |
| `groq` | default `llama-3.3-70b-versatile` | `console.groq.com` does not resolve from this session's network. |
| `mistral` | default `mistral-large-latest` | `docs.mistral.ai` does not resolve from this session's network. |
| `ollama`, `openai-compat` | — | Self-hosted. They declare nothing, by design (decision 3). |
| `copy-paste` | — | Reaches no API. |

To fill the Gemini, Groq and Mistral gaps, allow `aistudio.google.com`, `console.groq.com` and
`docs.mistral.ai` in the network settings, then run the same fetches.

## Alias coverage (decision 4)

`registry.maxOutputTokens.test.ts` builds a `test.each` over every alias of every cloud provider. A
cloud provider here is any descriptor except `copy-paste`, `ollama` and `openai-compat`. Each alias
must either resolve to a recorded limit or appear on a commented `ALIASES_WITHOUT_A_LIMIT` list.
There are 10 exclusions:

- 5 are image or embedding aliases: `@google-gemini:flash-image`, `@google-gemini:embedding`,
  `@openai:image`, `@openai:embedding` and `@xai-grok:imagine`.
- 3 are Gemini completion aliases with no source: `flash`, `pro` and `flash-lite`.
- 2 are xAI completion aliases with no stated maximum: `standard` and `flagship`.

Two further tests stop the exclusion list from going stale. Every excluded alias must resolve to
`undefined`, so once a limit is recorded for it, the test fails until the alias is removed from the
list. And every exclusion must name an alias that is actually registered.

## Decision 5: the Anthropic default

`DEFAULT_ANTHROPIC_MAX_TOKENS` is **4096**. The lowest recorded Anthropic limit is 64000, for
`claude-haiku-4-5`. **The default is below every recorded limit, so nothing changed** at the two
sites that apply it: `completionClient.ts` (`max_tokens: maxTokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS`)
and `streamingAdapters/anthropic.ts`. The client-tool path reaches the second site.

A test pins this finding, so it does not rest on prose alone: `DEFAULT_ANTHROPIC_MAX_TOKENS` must be
less than or equal to every recorded Anthropic limit. I watched that test go red. With the Haiku
entry temporarily set to 4000, 3 tests failed: this one plus the two that assert Haiku's value. The
entry was then restored. If a future model's limit falls below the default, this test is the prompt
to add `min(default, resolved limit)` at those two sites.

## Tests (`src/test/unit/ai-assist/registry.maxOutputTokens.test.ts`, 32 cases)

- Concrete ids, an alias, an unresolvable alias (including another provider's alias), a provider
  with no entries (`ollama`, `groq`), and a model no entry matches.
- Longest-prefix precedence on a hand-built descriptor with its entries out of order, covering both
  the alias and the concrete id.
- A hand-built catch-all is honoured, but never for an unresolvable alias.
- No shipped catch-all, every recorded limit is a positive integer, and non-cloud providers declare
  nothing.
- The alias coverage and exclusion-staleness tests described above.
- The Anthropic-default pin.

## Consumer sweep

`IAiProviderDescriptor` is widened by an **optional** field. I grepped `libraries/`, `tools/`,
`samples/` and `apps/`. Hand-built descriptors exist in `ts-extras` tests, in `ts-extras-mcp` tests
and in `ts-app-shell`'s `useAiAssist.ts`. None needed a change, and the repo-wide `rush rebuild`
compiled all 39 projects. No package other than `ts-extras` was touched.

## Gates

Logs are in `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/mot/`.

- `ts-extras` build (`ext-build.log`) and lint (`ext-lint.log`) are clean. Test (`ext-test.log`):
  all pass, with 100% statements, branches, functions and lines.
- Repo-wide `rush rebuild` (`rebuild.log`): `SUCCESS: 39 operations`. 0 error matches. The only
  warning is the known tracked-symlink notice.
- Repo-wide `rush test` (`test.log`): `SUCCESS: 38 operations`, 0 error matches, only the
  tracked-symlink warning; no flake fired.
- `rush change --verify --target-branch origin/integration/asks`: passes.
- prettier 2.8.8 `--check` on the touched TS files, and `verify-capability-docs`: pass.

## Docs

- `libraries/ts-extras/CAPABILITIES.md` has a new shortcut, "Which `maxTokens` will a model
  accept?". It documents the lookup, the lack of a catch-all, and the clamp the consumer applies
  themselves.
- `.ai/instructions/LIBRARY_CAPABILITIES.md` has the matching one-line shortcut. It fits the router
  budget.

## Not done / observations

- No alias was rotated. Anthropic's current lineup is Sonnet 5.5 and Haiku 5.5, and
  `@anthropic:haiku` still names `claude-haiku-4-5-20251001`. Its page lists "Retirement: Not sooner
  than October 15, 2026". OpenAI's `gpt-5.4-nano` page marks its snapshot "Deprecated". Rotating
  aliases is outside this brief. Recorded in `state.md` for the orchestrator.
