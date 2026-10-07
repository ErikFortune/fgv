# State — `system-one-impl` (Phase C of `system-one-decisions`)

Worker-owned working surface. The outcome is in [`result.md`](result.md).

## Log

- **Start.** Branch `system-one-phase-c` at `88d936f5`. PR #719 (Phase B) had **not** merged onto
  `integration/system-one-decisions` (`origin/integration/system-one-decisions` = `72f5f0bb`, an
  ancestor of the branch), so no merge was needed.
- **Belief 1.** `rush add -p @typesafe-ai/sdk@~0.6.0` (from the package directory) resolved 0.6.0 and
  touched only the new importer in `pnpm-lock.yaml`. `rush install` reported up to date;
  `rush install --purge` (a clean verifying install) then succeeded, exit 0, with no policy rejection.
- **Belief 2.** Read `dist/index.mjs` / `index.d.cts` of the installed 0.6.0. Every plan § 9 behaviour
  holds (see `result.md`).
- **CLM candidate texts.** Fetched the PyPI `contrastive-lm` 0.1.0 sdist to resolve an ambiguity in
  plan § 3.3: the `noul` default candidate is `"<key>: " + "Yes. This is true: " / "No. This is false: "
  + instructions` (`schema.py` `candidates`), i.e. the `"true: "` / `"false: "` prefix applies to the
  default too. That is what R5b's 106 assumes; implemented that way. With neither description nor
  instructions CLM embeds `"<key>: <key>"`, which the plan did not mention; implemented as CLM does.
- **Implementation** committed `0a4d7c93` (functional tests green, coverage not yet closed).
- **`code-reviewer`** launched on `0a4d7c93` before coverage closure.
- **Live legs.** `curl https://api.typesafe.ai/v1/models` → `CONNECT tunnel failed, response 403`
  from the egress proxy; no key in the environment; no GPU. L1–L5 not run live.
- **Belief 3.** `verify-bundler-resolution.mjs --verbose`: `ok @fgv/ts-extras-system-one -> ./lib/index.js`.

## Open questions

None blocking.

## Later log

- `code-reviewer` returned 2 P1 / 7 P2 / 12 P3; all applied (`7c540179`), coverage closed to 100%
  with no `c8 ignore`.
- Revert matrix: the first full run left R24 and R33 unverified, because pre-commit prettier had
  moved their patterns after `--check`. Re-pointed in `3705870c`; then a clean full run gave 34/34
  VERIFIED.
- Gates green at `3a952c29` (see `result.md`).

## Gate-time review round (2026-10-04)

- Independent review: no P1s; P2-A (malformed input rejected instead of returning a Result) and
  P2-B (state reachable through failure messages) fixed, P3-1..3 applied. P2-B did leak: the SDK's
  `APIError.message` carries body text, up to 200 raw characters. A second path (2xx converter
  messages and quoted received values) was found and closed in the same change.
- Revert matrix 38/38 VERIFIED (R34-R37 new). Gates green; see `result.md`.

## Copilot round 1 on fgv#721 (2026-10-07, against `78ad9b83`)

- Six threads, all fixed: baseUrl echo, systemOneLive `--check` URL constraints and redaction,
  received values in 2xx messages, sum-tolerance rounding, matrix write/restore ordering, the
  largest-file figure. Revert matrix 43/43 VERIFIED (R38-R40 new, R23 re-pointed).

## Copilot round 2 on fgv#721 (against `9b076e47`)

- One thread plus four summary findings, all in `perf/systemOneLive.js` except the stale
  "Not run" paragraph: unknown/repeated/stray arguments refused (exit 3, flag named, value never
  echoed); noul criteria validated in `--check`; an unknown-model ask recorded as an observation
  (reason and status only; the status is read from the package's own `(status N)` message segment,
  since the result does not expose it as a field — flagged, surface not widened); a listing failure
  fails the probe, the ask's failure winning when both fail.
- New `perf/systemOneLive.selftest.js` (S1–S4, stub servers); the matrix runs it for harness rows
  H1–H4. Revert matrix 47/47 VERIFIED.

## Copilot round 3 on fgv#721 (against `502b2067`)

- Three threads plus five summary findings, all reproduced first. Library: every exported entry
  point converts its parameters before reading a field (new `src/shapes.ts`), so malformed JS input
  is an `invalid-request` Result rather than a throw; a malformed question is `invalid-request` in
  `'unchecked'` mode too, with nothing sent; a model-list failure describes the expected shape and
  the malformed entry indices, never the received data; a base URL with whitespace is refused.
  Harness: `absoluteUrl` refuses whitespace as the client does; noul criteria accept `true`/`false`
  keys with any entry value; `--check` twice is refused; `questions` as a list is refused.
- The `noul`/`choice`/`score` factories are left as identity constructors (plan § 3.1, U25); making
  them Result-returning is an orchestrator decision — recorded in `result.md`.
- Revert matrix 57/57 VERIFIED (R41–R46, H5–H8 new; R1, R34, R38, R42 re-pointed). Self-test 7/7.
