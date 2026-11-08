# Brief: `deps-refresh` — monorepo dependency refresh, security first

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** a user request. The monorepo's dependencies have not been updated in a while, and the user is concerned about known vulnerabilities (CVEs / GitHub security advisories). GitHub's push response for this repo points at Dependabot alerts.

**Base / PR target:** `integration/asks`.
**Scope:** the whole Rush monorepo:
- `rush.json` (`rushVersion` and `pnpmVersion`)
- `common/config/rush/*` (the lockfile, `common-versions.json` and `pnpm-config.json`)
- every project's dependency ranges

Source changes are allowed only where a bump requires them. Record each one.

## Decisions
1. **Security first, measured, not guessed.**
   - Run the package manager's audit against the current lockfile before changing anything, for example `node common/scripts/install-run-rush-pnpm.js audit --json`. Record a baseline table in `result.md`: package, installed version, advisory ID (GHSA/CVE), severity, dependency path, and first fixed version.
   - Re-run the audit at the end and record the after table.
   - **Target:** zero critical, zero high, and zero moderate wherever a fix exists that needs no major bump of a direct dependency.
   - Any advisory you leave open gets a reason: no fix published, the fix needs a major bump (see 3), or not reachable. "Not reachable" needs a concrete argument, for example that the package is a dev-only tool that never sees untrusted input.
2. **How to fix.**
   - Prefer bumping the direct dependency that pulls the vulnerable package in.
   - For a transitive package with no direct-dependency fix, use `globalOverrides` in `common/config/rush/pnpm-config.json`. Scope each override as narrowly as pnpm allows, and give it a comment naming the advisory.
   - Use Rush tooling only. Change ranges with `rush add` (with `--make-consistent` where appropriate) or `rush upgrade-interactive`'s non-interactive equivalent, and run `rush update` (or `--full` if you justify it). Never `npm`, never hand-edited dependency blocks.
   - `common-versions.json` `preferredVersions` / `allowedAlternativeVersions` edits are config and are allowed.
3. **Outdated packages: take minors and patches, report majors.**
   - Bring direct dependencies up to their latest minor and patch within the current major.
   - Do **not** take a major version bump unless it is the only fix for a high or critical advisory. In that case take it, and do the source migration in this branch.
   - List every other available major in `result.md` with a one-line impact assessment: the breaking change that affects us, and the effort (S/M/L). The user decides those as a follow-up.
   - Treat the toolchain as majors-only-with-a-reason: `typescript`, `@rushstack/*`, `heft`, `jest`, `eslint`, `react`, `@types/node`, and Rush/pnpm themselves. Patch and minor for those is fine. For Rush and pnpm, check their own advisories.
4. **The release-age policy.** CI's `rush install` verifies the lockfile against pnpm's minimum release age (see CODING_STANDARDS, "A dependency bump can be green locally and rejected by CI"). After `rush update`, run `rush install` from a clean `common/temp` and confirm it accepts the lockfile. Never pick a version younger than the policy, and never add a `minimumReleaseAgeExclude`.
5. **Change files.** Every published package whose `package.json` changes needs one. Type `patch`, with a comment of the form "dependency refresh: …". Name a security fix that reaches that package's runtime dependencies. Packages whose only change is dev dependencies take type `none`.

## Required evidence
`result.md` must contain:
- the before and after audit tables
- the outdated table: direct dependency, from version, to version, taken or reported
- every override, with its reason
- every source change a bump forced

## Acceptance
- [ ] `rush install` passes from a clean `common/temp`.
- [ ] Repo-wide `rush rebuild`, **`rush lint`** and **`rush test`** pass. Grade them by the logs, not exit codes, and allow no warnings except the known tracked-symlink notice.
- [ ] `change --verify --target-branch origin/integration/asks`, prettier 2.8, `verify-capability-docs` and `generate-capability-feed --check` pass.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-11/deps-refresh/`, with a ledger entry (`#TBD`) and `result.md`. Add a feed line only if a capability changed.

## Mechanics
- Work only in `/home/user/fgv-deps`, on branch `deps-refresh`. Push only to that branch. Open no PR.
- Another worker is refreshing model aliases in `/home/user/fgv-alias` at the same time. Do not touch that directory.
- Logs go under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/deps/`.
- Commit in coherent steps before gating: security fixes first, then minor/patch refreshes. Run the gates in the foreground, except the repo-wide test, which runs in the background and is waited for in the same turn.
- No sub-agents. Do not run a `code-reviewer` pass; the orchestrator runs independent review.
