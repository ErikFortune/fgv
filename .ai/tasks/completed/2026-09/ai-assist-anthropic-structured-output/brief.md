# Stream brief — `ai-assist-anthropic-structured-output`

Closes the **P2** in `docs/TECH_DEBT.md`: *"ai-assist Anthropic structured output depends on forced
`tool_choice`, which the current Anthropic lines reject — so `@anthropic:opus` / `@anthropic:fable`
cannot rotate."* Filed by the `ai-assist-model-catalog-2026-09` stream (#692).

**Branch:** `claude/ai-assist-anthropic-structured-output`, off `release` at `6483841d5` (the #692
landing). **PR into `release`.** **Package surface:** `libraries/ts-extras`, `ai-assist` packlet.

---

## Mission

Add a **non-forcing** Anthropic structured-output format, declare it by `modelPrefix` for the lines
that reject forcing, keep `anthropic-tool-forced` for the lines that still accept it, and **then
rotate `@anthropic:opus` → `claude-opus-5-5` and `@anthropic:fable` → `claude-fable-5-1`.**

The rotation is the deliverable. The format work is what makes it safe.

## What is actually broken today

`registry.ts` declares exactly one Anthropic structured-output entry — a catch-all
`{ modelPrefix: '', format: 'anthropic-tool-forced' }` — and `structuredOutput.ts` implements it as
a synthetic tool plus `tool_choice: { type: 'tool', name }`.

**Claude Opus 5.5 and Claude Fable 5.1 return a 400 `invalid_request_error` on forced
`tool_choice`** (`{type:'any'}` and `{type:'tool'}`). Anthropic's page:
<https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5.md> under *"Forced tool use
is not supported"*; the same page states the first three items also apply to Claude Fable 5.1.

**Two distinct defects follow, and the second is live on `release` right now:**

1. The two successors cannot be aliased, so the catalog rotation left Anthropic behind.
2. **The `''` catch-all claims those two ids support a mechanism that 400s on them.** A
   `modelOverride` to either with `structuredOutput` fails *at the provider* rather than being
   refused or degraded locally — and `onUnsupported` cannot help, because the capability model has
   no way to express "no capability" for a prefix sitting under a catch-all. Fixing the capability
   table is part of this stream even for models you do not alias.

**Anthropic's stated replacement:** `tool_choice: auto` + `strict: true`, or their structured-outputs
feature. **Read Anthropic's structured-outputs documentation before choosing** — the choice between
those two is the stream's central design decision, not a detail.

## Three design forks to decide explicitly and record

### 1. Which mechanism

`tool_choice: auto` + `strict: true` keeps the tool shape and is a smaller diff, but `auto` means
the model *may* decline to call the tool — so the "always get a `T`" guarantee weakens unless
something re-asks or fails. Anthropic's structured-outputs feature, if it is a response-format-style
field, gives a stronger guarantee and a cleaner separation. **Decide from their documentation, state
the guarantee each provides, and say which you chose and why.** If the weaker mechanism is the only
one available for these lines, say so plainly rather than describing it as equivalent.

### 2. `StructuredOutputEnforcement` — the required report value

`IAiCompletionResponse.structuredOutput` is **required, not optional**, and deliberately so: the
codebase's own reasoning is that `'degrade'` is only safe because the report is required.
The union today is `'none' | 'json-mode' | 'schema' | 'tool-forced'`.

**`'tool-forced'` would be a lie for a non-forcing mechanism.** So either the new format reports
`'schema'` — defensible if it genuinely constrains the output the way the OpenAI/Gemini schema
formats do — or the union gains a member. **A new member is a breaking change to a public union**;
`ts-extras`'s `ai-assist` packlet is on the active-development list so that is permitted, but it
must be deliberate, stated in the PR, and carried in the change file's type. Do not widen the union
by reflex, and do not report `'tool-forced'` for something that is not forced.

### 3. Does the new format still conflict with server-side tools?

`structuredOutput.ts` refuses structured output combined with server tools, and its comment is
careful about *why* for each format: `anthropic-tool-forced` is a **wire-level clash** — the
constraint *is* `tools` + `tool_choice`, so server tools would be overwritten — whereas
`gemini-response-schema` is an **API-level** mutual exclusivity.

**A non-forcing Anthropic format may not have either problem.** If the mechanism is a
response-format-style field, server tools and structured output may coexist, and the refusal should
not apply to it. If it is still tools-based with `tool_choice: auto`, the clash may persist in a
weaker form. **Work out which, extend the comment in the same careful style, and test it** — a
refusal that no longer applies is a capability silently withheld, and the file's existing comment is
the standard to meet.

## Acceptance

- [ ] A non-forcing Anthropic format exists, declared by `modelPrefix` for the lines that reject
      forcing, with `anthropic-tool-forced` retained for those that accept it.
- [ ] **`@anthropic:opus` → `claude-opus-5-5` and `@anthropic:fable` → `claude-fable-5-1`**, with
      the held-at comment block in `registry.ts` replaced by the rotation's own history comment in
      the established `(was <id>, <why/when>)` style.
- [ ] The capability table no longer claims a mechanism that 400s for any documented id.
- [ ] A structured-output call on each rotated alias is covered by tests asserting the **request
      body**, not merely that the call succeeded — a dropped or wrong constraint still returns 200
      from a mock.
- [ ] The server-tools conflict decision is implemented, commented and tested.
- [ ] `adaptiveThinkingModelPrefixes` and every other Anthropic capability table re-checked against
      the rotated ids. #692's record notes the dash-bounded matcher already covers both successors;
      **verify that rather than inheriting the claim.**
- [ ] The TECH_DEBT P2 is **removed** in this PR, not merely amended — the entry's own trigger is
      "the first consumer that needs structured output on either successor."

## The live confirmation is the user's gate

This environment has **no provider credentials** and you must not seek any. #692 established the
pattern: the agent produces offline-green plus a cited record, and the maintainer runs the testbed.
`samples/testbed`'s model-tier canary is where an Anthropic structured-output probe belongs — **add
one**, so the maintainer's run exercises this rather than only the ids.

State plainly in the PR that no live Anthropic call was made from this environment.

## Sourcing contract

Same as #692, and it is why that stream's ids are trustworthy: **every claim about what Anthropic
accepts or rejects must come from a documentation page you fetched, cited by URL and fetch date.**
`WebSearch` may find pages; it may not supply wire details. If the doc hosts are blocked by the
network egress proxy — they were at the start of #692 and were opened for it — **STOP and surface
it** rather than inferring the wire format.

## Out of scope

- **Every package outside `ts-extras`**, and every packlet outside `ai-assist`.
- **The other providers' formats.** `openai-json-schema`, `openai-responses-format` and
  `gemini-response-schema` are not this stream's business.
- The two P3 items #692 logged (the `'other'`-block endpoint check; `gemini-2.5-pro` gated but not
  in the union). Separate, and the second is explicitly deferred to the next rotation.
- The stale checked-in typedoc `docs/` regeneration #692 declined — filed separately.
- **Do not fix the three known CI flakes** (`docs/TECH_DEBT.md`). One is a wall-clock assertion in
  `ts-extras`, the package you are editing — read the failure before assuming it is yours.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100% coverage in `ts-extras`, and in `samples/testbed` if you touch it
- [ ] `rush change --verify --target-branch origin/release`; change-file type reflects whether the
      enforcement union moved
- [ ] **Repo-wide `node common/scripts/install-run-rush.js test`.** Required: this changes what
      `resolveStructuredOutputCapability` *classifies* and what the server-tools guard *refuses*,
      without moving a signature — a rebuild cannot see it, and #692 was caught by exactly this when
      `samples/testbed` pinned concrete ids
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] `CAPABILITIES.md`'s structured-output paragraph updated — it currently states Anthropic's
      mechanism *is* forced tool use and that this is why it clashes with server tools. **That
      sentence becomes wrong in this PR.**
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] `code-reviewer` **before** coverage closure; findings resolved or dispositioned in the PR

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record: the mechanism chosen and the guarantee it provides versus the one
declined; the enforcement-value decision; the server-tools conflict determination with evidence;
every Anthropic capability table checked, including those needing no change; and every doc URL with
its fetch date.

## Required reading, in order

1. This brief.
2. `docs/TECH_DEBT.md` — the P2 this stream closes, in full.
3. `.ai/tasks/completed/2026-09/ai-assist-model-catalog-2026-09/result.md` §1.4 — why the aliases
   were held, with the Anthropic citations already gathered.
4. Anthropic's structured-outputs documentation and the Opus 5.5 "what's new" page.
5. `libraries/ts-extras/src/packlets/ai-assist/structuredOutputTypes.ts` — the format and
   enforcement unions.
6. `libraries/ts-extras/src/packlets/ai-assist/structuredOutput.ts` — the `anthropic-tool-forced`
   implementation and the server-tools conflict block with its per-format reasoning.
7. `libraries/ts-extras/src/packlets/ai-assist/registry.ts` — the Anthropic descriptor.
8. `libraries/ts-extras/CAPABILITIES.md` § structured output.

## Missing-input rule

If a required-reading file does not exist, a documentation host is unreachable, or Anthropic's pages
do not state the wire shape unambiguously — **STOP and surface it.** Do not infer a wire format. A
mechanism that looks right and is wrong fails at the provider, which is the exact failure this
stream exists to remove.
