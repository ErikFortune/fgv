# Stream brief — `ai-assist-model-catalog-2026-09`

A provider-line rotation across the four tier providers. **Scope: OpenAI, Anthropic, Gemini, xAI.**
Groq and Mistral are explicitly out until they bump in priority; Ollama is context-dependent and
carries no catalog default to rotate.

**Branch:** `claude/ai-assist-model-catalog-2026-09`, off `release` at `d01e39901`.
**PR into `release`.** Single landing, no integration branch.
**Package surface:** `libraries/ts-extras` (`ai-assist` packlet) only.

---

## STEP ZERO — prove you can reach the documentation, or stop

At orchestration time, **every provider documentation host was blocked by the environment's network
egress proxy** (403 at CONNECT): `platform.openai.com`, `developers.openai.com`,
`docs.anthropic.com`, `ai.google.dev`, `docs.x.ai`. The user was asked to widen the policy. It may
or may not have taken effect by the time you run — a policy change generally applies to newly
started sessions.

**Before anything else, `WebFetch` one documentation page per provider.** If any host is still
blocked, **STOP and surface it, naming the host.** Do not proceed with a partial sweep, and do not
fall back to search results for identifiers (see the next section for why).

## The sourcing contract — this is the load-bearing rule of the stream

**Every model identifier that enters the catalog must come from a page you fetched, and you must
record the URL and the date you fetched it.**

`WebSearch` is permitted for **finding** pages and for noticing that a generation has moved. It is
**not** permitted as a source of identifiers. Search returns a summarising model's rendering of a
page, and what this catalog needs is an exact API identifier string. `gpt-6-astra` versus
`gpt-6.0-astra` versus the display name "GPT-6 Astra" are three different things, and only one of
them is an id. A summariser that drops a hyphen or hands back a display name produces an id that
**resolves cleanly in the registry and fails on the wire** — which is precisely the failure the
alias layer exists to make impossible for the *nonexistent*-id case, and cannot catch for the
plausible-but-wrong case.

For each id, record in `result.md`: the id verbatim, the doc URL, the fetch date, and whether the
page presented it as an API identifier or you inferred it. **Anything inferred is flagged, not
adopted.** That list is what the user checks the testbed run against.

**A concrete signal from orchestration-time search, to be confirmed, not trusted:** results pointed
at an OpenAI **GPT-6 line — Astra, Sol, Luna** — against a catalog currently pinning `gpt-5.6-sol` /
`gpt-5.6-terra` / `gpt-5.6-luna`. Treat that as a hint that a generation moved, and nothing more.

## Why release notes matter as much as identifiers

This is what makes doc-sourcing better than a `listModels` call for this job. `listModels` gives you
ids; the documentation tells you what the ids *are capable of*, and the capability edits are where a
rotation goes quietly wrong.

**Every capability-table edit must cite the release note or model page that justifies it.** An
uncited capability change is a guess about someone else's product.

## The three manual axes — the alias edit is one of three, not the whole job

`docs/TECH_DEBT.md` carries a P3 entry whose stated purpose is *"so the two manual axes are not
forgotten on the next rotation."* **This is that rotation.** Per provider:

1. **The `aliases` map** in `registry.ts` — the one-line edit the maintenance-loop doc describes.
   Also the `defaultModel` tier slots if a role's target changes.
2. **The capability-detection `idPattern` rules** (`registry.ts`,
   `DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider`). These classify the concrete ids `listModels`
   returns, never aliases. **A new line needs a matching sibling rule or its ids fall through to the
   base capability set and are mis-classified** — the entry's own example is a thinking-capable
   model detected as non-thinking.

   **Already visible and concrete:** OpenAI's rules are `/^gpt-image/`, `/^text-embedding/`,
   `/^gpt-5/`, `/^gpt-4/`, `/^gpt-3\.5/`, `/^o\d/`. If the line has moved to GPT-6, **there is no
   rule that matches it.** xAI's are `/^grok-4\.5/`, `/^grok-4\.3/`, `/^grok-4$/`, `/^grok-4/`,
   `/^grok-3-mini/` — same exposure on a `grok-5`.
3. **The typed `*ModelNames` unions** in `model.ts` (`GeminiThinkingModelNames`,
   `OpenAiThinkingModelNames`, `GeminiFlashImageModelNames`, and siblings). They enumerate concrete
   ids for the layered-options `models?` filter arrays and must track real ids on a deprecation.

**And the per-model capability tables**, which the TECH_DEBT entry does not enumerate but which this
rotation touches: `responsesOnlyModelPrefixes`, `usesMaxCompletionTokensField`,
`supportsStreamUsageOption`, `supportsPromptCacheBreakpoints`, `supportsPromptCacheRouting`,
`supportsCacheUsageReporting`, and the image/embedding capability entries. Check each against the
new ids. A rotation that leaves one stale produces a call that succeeds with a capability silently
off — the hardest class to notice.

## Preserve the comment convention — it is the catalog's real documentation

Every alias in `registry.ts` carries its history inline, e.g.:

```ts
'@openai:pro': 'gpt-5.6-sol', // frontier tier (was gpt-5.5-pro, which was Responses-API-only; 5.6 works on chat completions)
'@google-gemini:flash': 'gemini-3.5-flash', // base (was gemini-2.5-flash, shutdown 2026-10-16)
```

**Continue it.** Each changed value gets `(was <old-id>, <why/when>)`. Where a shutdown or
deprecation date is documented, record it. The Gemini block additionally carries a standing note
explaining that its per-role version split is deliberate rather than a typo — **do not "tidy" that
away**; if the split changes, update the note to match the new reality.

## The live confirmation is the user's gate, not yours

The maintenance loop is *"one edit + a testbed run … against the live API to confirm the new id
answers."* **You cannot run it** — this environment has no provider credentials (all key env vars
unset; the testbed resolves through a KeyStore vault). Do not attempt to obtain any, and do not ask
the user for a key.

Your job ends at: every offline gate green, and a cited id list the user can check a testbed run
against. Say so plainly in the PR description — **the PR is not "verified against the providers"
and must not claim to be.**

## Out of scope

- **Groq, Mistral, Ollama, `openai-compat`.** Leave their descriptors untouched.
- Any package outside `libraries/ts-extras`, and any packlet outside `ai-assist`.
- The `models?`-filter redesign the TECH_DEBT entry floats as a follow-on (allowing aliases inside
  the arrays so the unions stop enumerating concrete ids). Out of scope — mention it in `result.md`
  if this rotation makes the case stronger.
- The three known CI flakes (`docs/TECH_DEBT.md`): a wall-clock assertion in `ts-extras`, `rush
  install`'s single-attempt dependency fetch, and an Argon2id mock deriving colliding keys. If one
  reddens your PR, read the log, confirm it is one of those three, and re-trigger. **Do not fix
  another package to get green.** Note the first is in the package you are editing — read the
  failure before assuming it is yours.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100% coverage in `ts-extras`
- [ ] `rush change --verify --target-branch origin/release`
- [ ] **Repo-wide `node common/scripts/install-run-rush.js test`.** Required, not optional: this
      changes what `resolveModelAlias` / `resolveImageCapability` / `resolveEmbeddingCapability`
      *classify* without moving a signature, and a rebuild is a compiler that cannot see it. The
      known casualty class is real here — `samples/testbed`'s
      `crossProviderEmbeddingSearch` broke on exactly this in the last rotation, because
      `resolveEmbeddingCapability` matches on **concrete** ids
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] `listModels.test.ts` updated — it pins id→capability classification and is the test that
      catches a missing `idPattern` sibling
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] `code-reviewer` **before** coverage closure; findings resolved or dispositioned in the PR

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must contain:

- **The cited id table**: per provider, each id verbatim, its doc URL, fetch date, and
  documented-vs-inferred. This is the artifact the user's testbed run checks against.
- Every `idPattern` rule added or changed, with the release note that justifies it.
- Every capability-table entry checked, including the ones that needed **no** change — a table
  you did not check is indistinguishable in the diff from one you checked and left alone.
- Any deprecation or shutdown date the docs stated, so the next rotation inherits it.
- An explicit statement that no live API confirmation was performed.

## Required reading, in order

1. This brief.
2. `libraries/ts-extras/src/packlets/ai-assist/registry.ts` — descriptors, alias maps,
   `DEFAULT_MODEL_CAPABILITY_CONFIG`.
3. `libraries/ts-extras/src/packlets/ai-assist/model.ts` — the `*ModelNames` unions.
4. `libraries/ts-extras/CAPABILITIES.md` § the ai-assist model-alias and quality-tier paragraphs —
   the maintenance loop and the stated boundary of what the alias layer covers.
5. `docs/TECH_DEBT.md` — the manual-axes entry (P3) and the CI-flake entry.
6. `.ai/tasks/completed/2026-06/ai-assist-model-aliases/state.md` — the last rotation's record,
   including its tier-2 manual-axis bumps and the testbed fallout they caused.
7. `.ai/instructions/CODING_STANDARDS.md` § *Review-loop discipline* and § *Pre-PR validation*.

## Missing-input rule

If a required-reading file does not exist, or a documentation host is unreachable, or a page does
not present identifiers in a form you can quote verbatim — **STOP and surface it.** Do not infer an
identifier to keep moving. An id that looks right and is wrong is worse than a stream that stopped.
