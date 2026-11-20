# testbed-run-fixes — result

Package: `samples/testbed` only (`@fgv/testbed`, private). No change file:
`rush change --verify --target-branch origin/main` passes without one.

## 1. What changed

### Round 1

- **`safer-fetch-guard`** (`src/scenarios/saferFetchGuard/index.ts`, `saferFetchDemo.ts`). `/big` is
  now four 512-byte `response.write` chunks with no Content-Length. A short Content-Length could
  never test the cap: HTTP/1.1 frames the body by it, so the client read 12 bytes and stopped. Step 6
  is now "the streaming size cap trips during the read when no Content-Length is declared". The test
  mock dropped `declared: 12`. The library was correct throughout.
- **`wire-probe`** (`src/scenarios/wireProbe/probe.ts`, `wires.ts`). `observeRaw` and
  `observeAdapted` share a new `rejectsSchema(status, text)`: a 400/422 is a schema rejection unless
  its provider text is an output-budget failure (`output limit was reached` or a
  `max_tokens`/`max_completion_tokens`/`max_output_tokens` mention), which is inconclusive. Also,
  `RAW_MAX_TOKENS` went from 16 to 256 to match `ADAPTED_MAX_TOKENS`. 16 was plainly too low:
  gpt-6-luna spent it on reasoning, and OpenAI fails an *accepted* request with that 400.
- **`mcp-probe`** (`src/scenarios/mcpProbe/`). `parseMcpProbeSpecFromEnv` returns
  `IMcpProbeSpec | undefined`; it could only ever fail for "nothing configured". The guidance text is
  `MCP_PROBE_SETUP_HINT`. The pre-existing `c8 ignore stop` moved one line, past the `run` body's
  closing brace, which became an uncovered line once the trailing `return fail(...)` went away. The
  maintainer approved that move in round 2.
- **`--all [--skip <id>,...]`** (`src/cli.ts`). Runs every CLI scenario in registration order, one
  at a time, each under `=== <id>`. A throw or a rejection counts as a failure and does not stop the
  loop. Ends with `=== testbed --all summary`, which lists passed, failed (with messages) and skipped
  (with reasons), and exits 1 if anything failed. An unknown or valueless `--skip` exits 1, and so
  does `--all` combined with `--scenario`. `--help` and the README are updated.

### Round 2

- **Merged `origin/main`** (3a541a89f) into the branch; it merged cleanly.
- **A typed skip.** `ICliScenarioImpl` gains an optional
  `skipReason(context): Promise<string | undefined>`, checked by the CLI before `run`.
  `--scenario` prints `scenario "<id>" skipped — <reason>` and exits 0. `--all` counts the scenario
  under skipped with its reason. Both paths go through one `runScenarioCli`, which also now catches
  a throw under `--scenario`. The web runner panel does not consult `skipReason`; it shows secret
  status itself.
- **Shared helpers** in `src/scenarios/aiProviderSecrets.ts`:
  - `skipWithoutSecret(specs, purpose)` resolves each spec through `context.resolveSecret`. If none
    resolves, it gives the reason `<VAR or FALLBACK> not set; set it to run <purpose>`.
  - `skipWithoutProviderKey(provider, purpose)` does the same for the canonical
    `PROVIDER_SECRET_SPECS` key that `resolveProviderApiKey` uses at run time.
  - Wired to:
    - the five `*-client-tools` scenarios (the Fable variant names its model)
    - the four `*-structured-output` scenarios (their own `requiredSecrets`)
    - `xai-cache-probe`
    - `cross-provider-embedding-search`. It skips only for the key of the provider `EMBED_PROVIDER`
      selects, using a new `embeddingProviderId` in `search.ts`. It never skips a self-hosted
      provider. An unknown provider is left to `run`, which reports it.
  - `mcp-probe` gained the same hook, so `--all` counts it as skipped rather than passed.
- **Readable model-load failures.** The three `local-*` and two `sqlite-vec-*` CLI paths still fail,
  now with `could not load model <id> (is huggingface.co reachable?): <cause>` in place of a bare
  `fetch failed`.
- **No new coverage directives.**

## 2. Tests

- `src/test/unit/cli.test.ts`:
  - `--all`: all pass → 0; a failure → 1 and the summary names it; a multi-line message stays
    indented; web-only is skipped; a throw or rejection counts as failed and the loop continues.
  - `--skip`: the happy path, a missing value, an unknown id. Also `--all` with `--scenario`, and
    the help text.
  - `skipReason`: `--scenario` skip (0, not run); precondition holds (runs); precondition throws (1);
    `--all` counts the skip under skipped.
- `src/test/unit/scenarios/keylessSkip.test.ts`: one row per changed scenario (11), each skipping
  with its env var named when the key is absent and running when it is set. Also
  cross-provider-embedding-search for gemini (with the `GOOGLE_API_KEY` fallback), ollama and an
  unknown provider.
- `aiProviderSecrets.test.ts` covers both helpers. `mcpProbe.test.ts` covers the skip and a
  configured server. `wireProbe.test.ts` pins the output-limit 400 as inconclusive on both paths.
  The three `local-*` tests pin the new load-failure text.

## 3. Verification

- `node bin/testbed.js --scenario safer-fetch-guard`: all 10 steps ✅. Step 6 prints `response
  exceeded the 1024-byte cap after 2048 bytes.`
- Gates from the repo root, logs under the session scratchpad `tb2/`. Each is graded by grep: 0 hits
  for `not met|Operations failed|error TS|Jest tests? failed|ERR_PNPM`, and the only `warning` line
  is the tracked-symlink notice. The test log has no NUL padding (4573 = 4573 bytes).

  | command | result |
  |---|---|
  | `install` | finished successfully |
  | `rebuild --to @fgv/testbed` | `SUCCESS: 19 operations` |
  | `lint --to @fgv/testbed` | `SUCCESS: 17 operations` |
  | `test --to @fgv/testbed` | `SUCCESS: 18 operations`; testbed coverage 100% (no uncovered lines or branches in lcov) |
  | `rush change --verify --target-branch origin/main` | exit 0 |

- **Unkeyed `node samples/testbed/bin/testbed.js --all`** (no keys, `huggingface.co` blocked), exit 1:

  ```
  === testbed --all summary
  passed 9 · failed 5 · skipped 14
  failed:
    local-classifier-safety: could not load model Xenova/toxic-bert (is huggingface.co reachable?): fetch failed
    local-embedding-search: could not load model Xenova/all-MiniLM-L6-v2 (is huggingface.co reachable?): fetch failed
    local-summarization: could not load model Xenova/distilbart-cnn-6-6 (is huggingface.co reachable?): fetch failed
    sqlite-vec-memory-persistence: could not load model Xenova/all-MiniLM-L6-v2 (is huggingface.co reachable?): fetch failed
    sqlite-vec-fragment-persistence: could not load model Xenova/all-MiniLM-L6-v2 (is huggingface.co reachable?): fetch failed
  skipped:
    anthropic-client-tools (ANTHROPIC_API_KEY not set; set it to run the live client-tool round trip on @anthropic:sonnet)
    anthropic-client-tools-fable (ANTHROPIC_API_KEY not set; set it to run the live client-tool round trip on @anthropic:fable)
    openai-client-tools (OPENAI_API_KEY not set; set it to run the live client-tool round trip)
    gemini-client-tools (GEMINI_API_KEY or GOOGLE_API_KEY not set; set it to run the live client-tool round trip)
    xai-client-tools (XAI_API_KEY not set; set it to run the live client-tool round trip)
    image-generation (web-only)
    streaming-chat (web-only)
    mcp-probe (MCP_PROBE_URL or MCP_PROBE_COMMAND not set; set it to run the MCP compatibility probe. …)
    cross-provider-embedding-search (OPENAI_API_KEY not set; set it to run the live openai embedding search)
    openai-structured-output (OPENAI_API_KEY not set; set it to run the live structured-output probes)
    anthropic-structured-output (ANTHROPIC_API_KEY not set; set it to run the live structured-output probes)
    google-gemini-structured-output (GEMINI_API_KEY not set; set it to run the live structured-output probes)
    xai-grok-structured-output (XAI_API_KEY not set; set it to run the live structured-output probes)
    xai-cache-probe (XAI_API_KEY not set; set it to run the prompt-cache wire probe)
  ```

  The 9 that passed are gate-deny-client-tools, safer-fetch-guard, memory-tools-gate, the four
  `*-model-tiers` canaries, wire-probe and agent-tasks.

## 4. Left alone

- **Gemini fallback naming differs by scenario.** `google-gemini-structured-output` names only
  `GEMINI_API_KEY`, because its declared spec carries no `GOOGLE_API_KEY` fallback, while the
  client-tools scenario's does. Unifying the spec would change what that scenario resolves at run
  time, so it is outside this stream.
- **Keyless partial runs are still passes.** `wire-probe` and the model-tier canaries succeed
  keyless after doing their offline half; they report their own skips and still count as passed.
- **Not checked live.** No keyed run happened here, so neither `wire-probe` nor any key-gated
  scenario was run live.
- **Review.** Inline against `CODE_REVIEW_CHECKLIST.md` only; no independent reviewer ran.
