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
