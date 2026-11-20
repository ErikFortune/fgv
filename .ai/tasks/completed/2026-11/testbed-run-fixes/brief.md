# testbed-run-fixes — brief

*Reconstructed from the two orchestrator kickoffs (2026-11-16 and the 2026-11-20 follow-up); the
stream was delegated by message, not from a pre-written brief.*

**Package:** `samples/testbed` (`@fgv/testbed`, private, `shouldPublish: false`). Touch nothing
else; stop and report if a fix needs another package.

**Input.** The maintainer's full testbed run log (every CLI scenario via
`node bin/testbed.js --scenario <id>`), triaged by the orchestrator into the items below.

## Round 1

1. **`safer-fetch-guard` step 6** ("streaming size cap trips despite a lying Content-Length —
   unexpectedly succeeded"). `/big` sent 2048 bytes with `content-length: 12`; HTTP/1.1 frames the
   body by Content-Length, so the client read 12 bytes and the cap never tripped. The library is
   right. Serve `/big` chunked with no Content-Length, relabel the step for what it proves, drop
   `declared: 12` from the test mock, and confirm by running the built scenario.
2. **`wire-probe`** classified OpenAI's "Could not finish the message because max_tokens or model
   output limit was reached" 400 as a schema rejection. Make an output-limit failure inconclusive,
   with a unit test. Check whether the raw probe's token budget is too low for reasoning models;
   raise it to match the adapted path if plainly so, else report.
3. **`mcp-probe`** fails when unconfigured. Follow the keyless-provider precedent: succeed with a
   clear "skipped" message; still fail loudly when a configured server fails.
4. **`--all`** on the testbed CLI: every CLI scenario, sequentially, a `=== <id>` header each,
   failures captured without stopping (throws and rejections included), a summary of passed /
   failed (with messages) / skipped (web-only), exit 1 if any failed. `--skip` only if trivial.
   Update `--help` and the README; unit-test with injected fake scenarios.

## Round 2 (follow-up, after 5.1.0 shipped and `main` became trunk)

1. Merge `origin/main` into the branch (merge, not rebase).
2. **Keyless scenarios skip instead of failing**: the five `*-client-tools` scenarios (including
   the Fable variant), `cross-provider-embedding-search`, the four `*-structured-output` scenarios
   and `xai-cache-probe` succeed with "skipped — <KEY> not set; set it to run …" when their key is
   absent, and still fail loudly when a key is set and the scenario fails. Use a shared helper; a
   typed "skipped" signal that `--all` counts under skipped is the implementer's call.
3. Leave the network-dependent `local-*` and `sqlite-vec-*` scenarios failing, but make their
   `--all` message readable.
4. README "Running scenarios": say what an unkeyed `--all` reports.
5. One skip-path test per changed scenario; 100% coverage; no new `c8` directives.
6. Gates from the repo root (install, rebuild/lint/test `--to @fgv/testbed`), graded by grep;
   one `--all` run; `rush change --verify --target-branch origin/main`; prettier.
7. Stream artifacts, ledger entry and index line; capability-feed check and capability-docs verify.

**Approved in round 2:** the `c8 ignore stop` marker move in `mcp-probe` (same directive, one
line later).
