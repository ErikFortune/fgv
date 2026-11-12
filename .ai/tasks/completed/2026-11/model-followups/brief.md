# model-followups — sweep of the follow-ups recorded by the 2026-11 model streams

**Base**: `origin/integration/asks` @ `f66b7f0c0`. **Branch**: `model-followups`. **Worktree**: `/home/user/fgv-followups`.
**Owner of this file**: orchestrator (frozen). Worker writes `state.md` and `result.md` beside it.

A parallel stream `fable-5-2` is editing the **Anthropic** parts of
`libraries/ts-extras/src/packlets/ai-assist/registry.ts`, `anthropicThinkingOff.ts`, and the testbed's
Anthropic tier/model files. Do not touch Anthropic declarations; keep registry edits to the OpenAI /
Groq sections so the two merge cleanly. A later stream will do Gemini `thinkingLevel` — **out of scope here**.

## Items (each closes or updates its record in the same PR)

1. **F1 — OpenAI client-tool `'none'` guard.** Record: `.ai/tasks/completed/2026-11/live-run-corrections/state.md` F1.
   The client-tool path accepts a caller-built `resolvedThinking: { openAiEffort: 'none' }` aimed at a
   thinking-required OpenAI model (sol, astra) and sends it; the provider 400s. Refuse it locally with the
   same shape/wording family as the existing Anthropic guard (`anthropicThinkingDisabled` on a
   thinking-required model). Data-driven from `thinkingRequiredModelPrefixes`, not a provider switch.
   Red-then-green test.

2. **F2 — `gpt-6-luna` / `gpt-6-sol` with `temperature: 1` beside an effort.** Record: same file, F2, and
   `live-run-corrections/result.md` § 4/5a. First establish current behaviour on the base (5a changed
   `checkTemperatureConflict`; sol may already pass). Live evidence: luna's 400 for 0.3 reads "Only the
   default (1) value is supported". Decide from that evidence whether luna belongs on
   `samplingParamsRejectedModelPrefixes` (it then inherits accepted temperature 1); record the decision
   and its evidence. Add a testbed OBSERVED probe row (`temp=1+effort=low` on luna, and 0.3 on luna) so
   the user's next live run confirms it — follow the existing OBSERVED row pattern in the testbed OpenAI
   tier canary / wire-probe.

3. **`resolveModel` fails instead of throwing** on a `ModelSpec` outside its type (`{ base: undefined }`
   etc.). Record: `docs/TECH_DEBT.md` "[P3] `resolveModel` throws …". Pick the scope-sketch option that
   keeps the public signatures sensible (a Result-returning walk, failure names provider id and the
   offending key). Every caller listed in the record (`resolveProviderModel`, completion, streaming,
   `resolveMaxOutputTokens`) gets a test pinning the failure at that call site. Close the TECH_DEBT entry.

4. **Groq `max_tokens` deprecation** (`model-alias-refresh` result Q5). Verify against Groq's current API
   reference whether `max_completion_tokens` is accepted and `max_tokens` deprecated. If so, make the
   output-token field name a descriptor declaration (not a provider-id switch) and set it for Groq;
   check whether any other OpenAI-format provider in the registry documents the same (xAI, Mistral,
   Ollama-compat) and set it only where documented. If the docs cannot be read, change nothing and
   record why. Request-body test per provider touched.

5. **Flake hardening** — each entry below is in `docs/TECH_DEBT.md`; fix per its scope sketch, prove
   determinism (run the single test ≥ 20× or under `--maxWorkers=1` plus a loaded run), close or
   narrow the entry:
   - `ts-extras-mcp` `egress.test` resumed-GET over-cap (P3, ~line 893);
   - `ts-extras-mcp` cancellation test racing two real timers 10 ms apart (P3, ~line 983);
   - `ts-extras` `keyStoreArgon2id` "returns false when salt does not match" (P3, ~line 1232);
   - `ts-extras` `saferFetchRetry` exhausted-deadline test (P2, ~line 534) — inject `random`; check it
     is not already fixed;
   - `tools/ts-res-cli` `cli-configuration` "consistent output by building same input twice" timeout
     (inside the P3 wall-clock entry, ~line 954) — give it an explicit timeout sized to two CLI spawns,
     or assert without spawning twice.
   Leave the sudoku and `ts-res` deltaGenerator items alone. No `c8 ignore`, no skips.

6. **Held aliases re-check** (`model-alias-refresh/result.md` Q2, Q4). Re-read the current OpenAI image
   model docs and Gemini embedding docs. Q2 `@openai:image` → `gpt-image-2.6-sunburst`: rotate only if
   the docs now name 2.6 as the default/recommended image model and its supported sizes/qualities match
   the descriptor's declarations; otherwise stay held with the current reason. Q4 `gemini-embedding-2`:
   stays held — a rotation changes vector space under persisted indexes; record that as a `docs/FUTURE.md`
   entry (what a consumer must do to migrate, e.g. a separate alias) if none exists. If docs cannot be
   fetched, both stay held and you say so.

## Rules
- Repo standards apply (Result pattern, converters, no `any`, 100% coverage, no `c8 ignore` without
  orchestrator approval — ask in `state.md` and stop that item).
- One change file per touched package (`rush change --verify --target-branch origin/integration/asks`).
  ts-extras: `minor` (new descriptor field / refusal), others `none` or `patch` as fits.
- Update `docs/TECH_DEBT.md`, `docs/FUTURE.md`, ts-extras `CAPABILITIES.md` / ai-assist README where
  accuracy changes. Ledger entry in `docs/workstreams/2026-11.md` and `meta.yaml` with `#TBD` PR.
- Do not spawn subagents. Run review inline (apply the code-reviewer rubric yourself) before coverage closure.
- **Commit first, then gate**, foreground. Gate from repo root; logs ONLY under
  `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/followups/`:
  `install`, `change --verify --target-branch origin/integration/asks`, `rebuild`, `lint`, `test`
  via `node common/scripts/install-run-rush.js`. Grade by grep (`not met|Operations failed|error TS|Jest tests? failed`
  = 0; `grep -ci warning` only the tracked-symlink notice).
- Write `result.md` (per item: what changed, evidence, red→green, records closed) and finish with a
  committed, gated branch. Do not push; do not open a PR.
