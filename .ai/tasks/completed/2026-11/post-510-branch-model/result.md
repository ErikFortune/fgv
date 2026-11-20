# post-510-branch-model — result

**Shipped:** a stable publish now takes its version from the `publish/<version>` branch name, so no
PR has to move `main`'s version policy before a release; CI refuses a PR into a release train from
anything but `main` or `publish/*`; and every instruction that said "branch from / PR to `release`"
now says `main`.

Branch `post-510-branch-model`, based on `origin/main` `3a541a89f`, merged forward (fast-forward, no
local commits yet) to `b91d01d39` after four Dependabot pin bumps landed on `main`. PR: TBD. Nothing
was published, dispatched or pushed anywhere but this branch.

## 1. Docs sweep (Phase 4)

`grep -rn release` over `CLAUDE.md`, `.ai/` and `.claude/`, each hit judged. Instructions were
rewritten; history (dated handoffs, lessons, cross-repo replies, completed-task artifacts, generated
"Recent additions" feed lines, design docs under `.claude/project/`) was left as written.

| file | change |
|---|---|
| `CLAUDE.md` | a **Branches** line under Quick Reference (branch from / PR to `main`; trains, `publish/*`, `prerelease` are release machinery); `BASELINE.md` description |
| `.ai/conventions/workflow/branch-buffer-and-promotion.md` | new opening section *In this repo: trunk `main`, trains `release/<major>`* (diagram, branch-role table, promotion = PR `main` → `release/<major>`, old `release` deleted); canonical = `release/<major>`, buffer = `main` throughout; step 6 is publish child + back-merges + baseline; naming note on the pre-5.1.0 swap |
| `.ai/conventions/workflow/doc-graduation.md` | `release` → `main` throughout; vocabulary row rewritten (fgv `main` ↔ personaility `working`) |
| `.ai/conventions/workflow/{artifact-protocol,kickoff-prompt-shape,operating-modes}.md` | base / target `release` → `main` |
| `.ai/instructions/CODING_STANDARDS.md` | change-file rule: CI verifies against the PR's base, `origin/main` for an ordinary PR; local commands and the acceptance checkbox name `origin/main`; cluster-merge and doc-only-commit sentences |
| `.ai/instructions/ACTIVE_DEVELOPMENT.md` | the "`major` means breaks shipped non-alpha" test checks `release/<major>` / the stable tag, not `main`; worked-check table annotated as pre-model; **the "type is inert" section rewritten** (below); `ts-agent-tasks` "not yet on `main`" |
| `.ai/instructions/LIBRARY_CAPABILITIES.md` | `Repository:` line → `main`, the trunk; router 23,881 / 24,000 chars |
| 24 `libraries/*/CAPABILITIES.md`, `libraries/ts-prompt-assist/README.md`, `.claude/skills/published-primitives-reflex/SKILL.md` | `github.com/ErikFortune/fgv/{tree,blob}/release/` → `/main/` |
| `.claude/agents/orchestrator.md` | session-start reading adds the branch-model convention; stream / integration bases, cluster-close targets, housekeeping posture → `main`; § *`release` → `main` promotion* replaced by § *Promotion and stable publish (`main` → `release/<major>`)* (seven steps, `release-source`, branch-named version) |
| `.claude/skills/finalize-task/SKILL.md`, `.claude/skills/workstream-brief/SKILL.md` | change-file commands → `origin/main`; `main` as the landing line |
| `.ai/notes/orchestrator/README.md` | `release` → `main` |
| `.ai/notes/orchestrator/{handoff-*,lessons-pending}.md` | history kept; a dated branch-model note under each title says how to read "`release`" |
| `docs/WORKSTREAMS.md` | preamble: stability-via-consumption, **Branch flow** (new diagram, `main` / `prerelease` / `release/<major>` / `publish/*`), status key, branch base, baseline wording; the "branch-model evolution is on the roadmap" paragraph removed (it happened) |
| `docs/CHORES.md` | two trigger descriptions |
| `libraries/ts-app-shell` `TAILWIND_SETUP_DOCS_URL` (+ its test) | the published constant linked `tree/release/…`, a dead branch; now `tree/main/…`. A code change, so its change file is `patch` with a comment, not `none` |

**Integration branches** are documented as based on `main` (CLAUDE.md, WORKSTREAMS preamble,
branch-buffer table, orchestrator prompt). The live `integration/*` branches on origin were not
touched; they pick up `main` when their owners next merge it.

### The change-file `type` section

The old text said lockstep projects are forced to change type `none`, so the `type` drives neither
the version nor the CHANGELOG section and everything renders under `### Updates`. The 5.1.0 publish
(`d198bfda6`) disproves the second half. Every `base-utils` package went to exactly 5.1.0, and the
5.1.0 sections render by type:

| evidence | value |
|---|---|
| `libraries/ts-utils/CHANGELOG.json` 5.1.0 entry | `major` 1, `minor` 8, `patch` 4 |
| `libraries/ts-utils/CHANGELOG.md` 5.1.0 headings | `### Breaking changes`, `### Minor changes`, `### Patches` |
| packages whose 5.1.0 section has `### Breaking changes` | `ts-res`, `ts-utils`, `ts-web-extras`, `ts-res-browser-cli`, `ts-res-browser` |
| packages with `### Updates` (type `none`) | `ts-bcp47`, `ts-extras`, `ts-utils-jest`, `ts-web-extras`, `ts-res-browser` |
| 5.0.x sections | `### Updates` only (written through `rush publish`, not `rush version --bump`) |

The section now says: the version is the policy's (from the branch name), the type picks the
CHANGELOG heading (table major/minor/patch/none → Breaking changes / Minor changes / Patches /
Updates), so a wrong `major` is a false "Breaking changes" heading in a shipped CHANGELOG. The
"`major` means breaks code that shipped non-alpha" rule and its guidance stay.

## 2. `ci.yml` and the `release-source` check

*Revised after the security review (below): the job moved out of `ci.yml` into its own workflow,
`.github/workflows/release-source.yml`, and the publish head pattern narrowed to `publish/[0-9]*`.
The first version is described here as it shipped in `b734cb7a6`.*

- `pull_request.branches`: `['main', 'release/**', 'publish/**', 'prerelease', 'integration/**']`
  (`release` dropped).
- **Change verify**: confirmed it keys off `github.base_ref` (via `env:`) for every PR and uses
  `origin/main` on a push; `fetch-depth: 0` fetches every branch, so `origin/<base>` exists for
  `main`, `release/*`, `publish/*`, `prerelease` and `integration/*`. Comment added; no logic change.
- **New job `release-source`** (no checkout, no actions, top-level `contents: read`). On a
  `pull_request` whose `base_ref` matches `release/*` it fails unless the head repository is this
  repository **and** `head_ref` is `main` or `publish/*`; every other event or base passes, so it can
  be a required check. All refs reach the shell through `env:`. The head-repository condition is an
  addition beyond the brief: without it a fork's branch named `main` would pass.

Exercised by extracting the script and running it:

| event / base ← head @ repo | result |
|---|---|
| PR `release/5` ← `main` @ this repo | pass |
| PR `release/5` ← `publish/5.2.0` @ this repo | pass |
| PR `release/5` ← `feature/x` | **fail** |
| PR `release/5` ← `integration/asks` | **fail** |
| PR `release/6` ← `hotfix/5.1.1` | **fail** |
| PR `release/5` ← `main` @ `someone/fgv` (fork) | **fail** |
| PR `main` ← `feature/x`; PR `publish/5.2.0` ← `fix`; push | pass (not a train) |

**Consequence for the publish PR.** Once `release-source` is required, the PR the publish workflow
opens with `GITHUB_TOKEN` (`publish/<V>` → `release/<major>`) triggers no CI on its own; close and
reopen it (or push to it) so the check reports. Written into the checklist.

**Consequence for hotfixes**, written into the checklist's *Multiple trains*: once `main` and a train
have diverged, a fix reaches the train from a branch named `publish/5.x.y` (PR it in, then reset the
branch to the new train tip and dispatch). A dedicated `hotfix/*` head would be a one-word widening
of the `case` if that flow proves awkward — left as is, since the brief asked for exactly `main` or
`publish/*`.

## 3. Version from the branch name

`publish-release-impl.yml` `guard`:

1. `GITHUB_REF` must be `refs/heads/publish/*` (unchanged).
2. **`V` = the branch suffix**, which must match `^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`.
3. The branch's base-utils policy is read (same comment-tolerant parser) and must itself be a plain
   `X.Y.Z` — a prerelease policy on a train means `prerelease`'s bump leaked into it.
4. **`V` must be newer than the policy** (numeric compare of the three parts).
5. If `V`'s major differs from the policy's, it must be exactly `<policy major + 1>.0.0`.
6. `release` / `major` kind against `V` (unchanged logic, now on `V`).
7. `HEAD` must equal `origin/release/<V's major>` (unchanged check; the train is now named by `V`, so
   `publish/6.0.0` cut from `release/5` is refused).
8. npm partial-publish rules, dist-tag choice, package list: unchanged, on `V`.

`build` already passed the guard's `version` to `--override-version "$VERSION-0"` and `--bump
--override-bump patch`; only its comment changed. The publish job's bump-commit path allowlist,
tarball checks, tag logic and recovery are untouched. Header comments of the impl updated.

### Scratch-clone evidence

Setup (`/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/bm/`, scratch,
not durable): `git clone --bare --no-local` of this worktree as `bare.git`, a `git clone --no-local`
as `clone` with `origin` repointed at `bare.git` (the bare repo's stale `release` branch had to be
deleted before `release/5` could be created — the ref constraint the checklist describes). In the
clone, `release/5` = `19aa60ccf` (the real train tip) plus one commit adding two change files
(`@fgv/ts-utils` minor, `@fgv/ts-json` patch), pushed to the scratch origin; `main` = `3a541a89f`.
The guard, *Version and changelogs* and *Commit the bump* steps were extracted from the edited
workflow with PyYAML and run with `bash -e`; `npm view` was stubbed on `PATH` (everything else
passed through to real npm, which `install-run-rush.js` needs). `rush version` without
`--target-branch` runs its git operations as `DRYRUN` — nothing was pushed, and the scratch origin
gained no `version/*` branch.

Version sequence (`VERSION=<V>`, the build job's step verbatim):

| branch | policy after | `base-utils` projects | ts-utils CHANGELOG.md | ts-json CHANGELOG.md | change files | bump commit vs allowlist |
|---|---|---|---|---|---|---|
| `publish/5.2.0` | `5.2.0` / `nextBump: minor` | 33 × 5.2.0 | `## 5.2.0` → `### Minor changes` | `## 5.2.0` → `### Patches` | both deleted | 102 paths, 0 outside the publish job's allowlist |
| `publish/5.1.1` | `5.1.1` / `minor` | 33 × 5.1.1 | `## 5.1.1` → `### Minor changes` | `## 5.1.1` → `### Patches` | both deleted | 102 paths, 0 outside |
| `publish/6.0.0` | `6.0.0` / `minor` | 33 × 6.0.0 | `## 6.0.0` | — | — | (not committed) |

Packages without change files got a `_Version update only_` section (e.g. `ts-bcp47 ## 5.1.1`).

Guard (`runguard.sh <ref> <kind>`; HEAD = the scratch `release/5` tip unless stated):

| case | outcome |
|---|---|
| `publish/5.2.0` release | **pass** — `version=5.2.0 major=5 npm_tag=latest`, 0/33 on npm |
| `publish/5.1.1` release | **pass** — `version=5.1.1` |
| `publish/5.2.0` release, npm `latest` stubbed 6.2.0 | **pass** — `npm_tag=release-5` |
| `publish/6.0.0` major, HEAD = scratch `release/6` (policy 5.1.0) | **pass** — `version=6.0.0 major=6` |
| `publish/5.1.0` (= policy) | refused: *not newer than 5.1.0, the version the base-utils policy on this branch says was last published* |
| `publish/5.0.9` | refused: not newer |
| `publish/5.2.0-1` | refused: *does not name a plain X.Y.Z version* |
| `publish/5.2`, `publish/05.2.0`, `publish/v5.2.0` | refused: not a plain X.Y.Z |
| `publish/6.0.0` major on `release/5` (no `release/6`) | refused: *belongs to the release/6 train, but origin/release/6 does not exist* |
| `publish/6.0.0` major on `release/5` with a `release/6` present elsewhere | refused: must be exactly `origin/release/6` |
| `publish/6.0.0` release | refused: *a new major; dispatch with release_type major* |
| `publish/6.1.0` release, `publish/7.0.0` major | refused: *changes major from 5; the next major starts at 6.0.0* |
| `publish/5.2.0` major | refused: *major publishes only 5.0.0* |
| `refs/heads/release/5` | refused: wrong ref |
| HEAD one commit past the train | refused: must be exactly `origin/release/5` |
| train policy `5.2.0-0` | refused: *a prerelease policy belongs on prerelease, never on a train* |
| all 33 stubbed on npm at 5.2.0 | refused: *already on npm at 5.2.0; nothing to publish* |

**Not guarded, by design:** the version's *size* against the change types — `publish/5.1.1` over a
`minor` change file publishes 5.1.1 with a `### Minor changes` heading. Choosing the version is the
release decision the branch name records.

### setup-node v7 (coordinator amendment)

- `origin/main` merged in (fast-forward to `b91d01d39`; no conflict — this branch had no commits
  yet). The new pins stand: checkout v7.0.1, setup-node v7.1.0, upload-artifact v7.0.2,
  download-artifact v8.0.2.
- **`package-manager-cache: false`** on all six setup-node steps in `publish-release-impl.yml` and
  `publish-alpha-impl.yml`, with a header comment in each saying why.
- **`NODE_AUTH_TOKEN`.** setup-node writes `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}`
  only where `registry-url` is set — the two `publish` jobs. v5 exported a dummy value; v7 does not.
  npm's `env-replace` leaves an unset `${VAR}` literally in place (checked in `@npmcli/config`
  `lib/env-replace.js`), so the token becomes the string `${NODE_AUTH_TOKEN}` — as invalid as v5's
  dummy, which the 5.1.0 run published through. Reads were checked locally with exactly that
  `.npmrc` and `NODE_AUTH_TOKEN` unset: `npm view @fgv/ts-utils dist-tags.latest` → `5.1.0`,
  `versions --json` → full list (same as with the old dummy). The steps involved are `npm install -g
  npm@11.21.2` (a read) and the per-package `npm view` skip check; the `guard` job's `npm view`s
  have no `registry-url` and are unaffected. `npm publish` itself authenticates by OIDC and is **not
  provable locally**: **the next alpha dispatch is the proof** (it runs the same publish-job shape
  under `npm-publish-alpha`). No step was given an explicit token.

### Lint

actionlint **1.7.12** (`go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12`) with
ShellCheck **0.11.0** (`shellcheck-py==0.11.0.1`), over all four workflows: **no output, exit 0**.
The CI pin-check step, extracted and run: *All uses: references in 4 files are pinned to a commit
SHA.*

## 4. `.ai/BASELINE.md`

Rewritten for the new model: it pins the last **stable publish**, with a table — published commit
`d198bfda6` (every `@fgv/*_v5.1.0` tag), `release/5` tip `19aa60ccf` (#798), promotion source
`34396526c` (#791), back-merge `3a541a89f` (#799). Bump procedure updated.

## 5. Checklist close-out

`.ai/notes/orchestrator/branch-migration-checklist.md`: status line; release flow step 3 and the
guard bullets say the version comes from the branch; *Who may PR into a train*; hotfix paragraph;
the "Consequence: a PR must move the policy" paragraph replaced by the branch-name design and its
evidence. Ticked with citations: four Phase 0 items proven by the 5.1.0 run (environment branch
rule, Actions may open PRs — #798 is by `github-actions[bot]`, OIDC, root-tooling strays absorbed by
#791); all of Phase 2; Phase 3 except "confirm the next alpha is 5.2.0-N" (**Erik** — npm `alpha`
is still `5.1.0-64`); the policy-PR item struck as unnecessary with the reason; all of Phase 4, plus
a new unticked item for **Erik**: make `release-source` a required check on `release/*`. Still open
for **Erik** in Phase 0: `npm-publish-alpha` branch rule, branch protection, the `GITHUB_TOKEN`
no-CI note, the alpha smoke test, per-package trusted-publisher environments, the re-run artifact
proof.

## 6. Gates

- `rush change --verify --target-branch origin/main`: see the commit-time run below.
- `generate-capability-feed.mjs --check`: 0 stale. `verify-capability-docs.mjs`: 0 failed, router
  23,881 / 24,000.
- `npx -y prettier@2.8.8 --check` on every changed and new file: clean.
- Change files: 25 packages (every library whose `CAPABILITIES.md`, README or source changed), type
  `none` with an empty comment, except `@fgv/ts-app-shell` (`patch`, the URL constant).
- `rush change --verify --target-branch origin/main` after the commit: every touched package has
  its change file (the verify found all 25 and passed).
- **`rush install` / `rush rebuild`: blocked, not run to completion.** Both install attempts from
  the repo root failed with `ERR_PNPM_ENOSPC` / an `onnxruntime-node` postinstall `copyfile` failure:
  the shared disk had 99 MB, then 262 MB, free (the other `/home/user/fgv-*` worktrees hold it). The
  partial `common/temp/node_modules` and `pnpm-store` of this worktree were removed afterwards to
  give the space back. Nothing else was deleted. So **the rebuild gate and the `ts-app-shell` test
  run for the one code change (a string constant and the test that pins it) are owed** — the
  coordinator's gate, or CI on the PR, is the first run. Risk is low: the constant is `@internal`
  and its test was updated to the same string.

## Left alone, and why

- **History**: dated handoff notes, `lessons-pending.md` entries, cross-repo replies, completed-task
  artifacts, `docs/workstreams/*`, ledger entries, `.claude/project/*` design docs, `TECH_DEBT.md`
  and `FUTURE.md` narration. They record what happened on `release`; rewriting them would falsify
  them. The handoff/lesson files got a reading note instead.
- **Generated docs** under `docs/api/` (including two `tree/release` links): regenerated by the
  docs stream, not hand-edited.
- **The feed lines** in package `CAPABILITIES.md` that say "→ `release`": generated from completed
  streams' `sourceLine`s.
- **`publish.yml`**: its comments were already correct.
- **The live `integration/*` branches**: not rebased (no pushes outside this branch).

## Security review (2026-11-20, independent, on `b29128787`)

No P1. Every finding fixed on this branch except the three noted as no-change.

| finding | disposition | proved by |
|---|---|---|
| **P2-1** "V newer" trusted only the train's policy, which is stale between a publish run and its publish PR merging into `release/<major>`. In that window `publish/5.1.1` (or a second `publish/5.2.1`) cut from the train tip passed, could publish 5.1.1 after 5.2.0 carrying 5.2.0's features and re-render unconsumed change files, and could race: the `publish-${{ github.ref }}` group did not serialize different `publish/*` branches | **Fixed.** (a) The guard keeps every `npm view <pkg> versions --json` it already makes and requires `V` ≥ the highest **stable** (`X.Y.Z`, no prerelease) version of any `base-utils` package in `V`'s major — any major for a `major` dispatch. Equal is allowed only because the existing rules bound it: all-published is refused, partial is a resume only when every published package is tagged. Taking the maximum over every package rather than `ts-utils` alone also covers a partial run that stopped before `ts-utils`. (b) `publish.yml`'s concurrency group is `publish-stable` for `release`/`major` and `publish-alpha` for `alpha`, no longer per ref | Stubbed-npm guard runs on a fresh scratch clone (`release/5` = `19aa60ccf`, policy 5.1.0): npm 5.2.0 everywhere → `publish/5.1.1` **refused** (*older than 5.2.0, already on npm; the train's policy (5.1.0) lags npm…*), `publish/5.2.0` **refused** (all 33 already at 5.2.0, unchanged), `publish/5.2.1` and `publish/5.3.0` **pass**; only `ts-utils` at 5.2.0 → `publish/5.1.1` refused, `publish/5.2.0` refused untagged, passes as a tagged resume; a `5.3.0-4` prerelease on npm is ignored (`publish/5.2.0` passes); 6.0.0 on npm with 5.9.9 the highest 5.x → `publish/5.9.10` passes (maintenance train); `publish/6.0.0` major on `release/6` passes with npm max 5.1.0 and is refused when 6.1.0 is on npm. Earlier cases re-run: 5.1.1 passes; 5.1.0, 5.2.0-1, 6.0.0-on-`release/5`, 6.1.0 refused as before |
| **P2-2** `release-source` could be bypassed by retargeting a PR's base: the default `pull_request` types exclude `edited`, so a PR opened against `main` (green) and retargeted to `release/5` kept its green check on the same SHA | **Fixed.** The job is now `.github/workflows/release-source.yml` (workflow **Release source**, job and check name `release-source`), on `pull_request` with `types: [opened, synchronize, reopened, edited]` only — never `pull_request_target` — with `permissions: {}`, no checkout, refs through `env:`. Removed from `ci.yml`. The checklist names the check exactly | Extracted script: `release/5` ← `main` / `publish/5.2.0` pass; ← `publish/foo`, `publish/`, `feature/x`, a fork's `main` fail; other bases pass |
| **P3** narrow the publish head pattern | **Fixed**: `publish/[0-9]*` (a digit after `publish/`) | `publish/foo` and `publish/` refused above |
| **P3** checklist open question 2 said `major` requires the policy to say `<n>.0.0` | **Fixed**: it requires the branch `publish/<n>.0.0`, cut from `release/<n>`, with the policy still at `<n-1>.x.y` | — |
| **P3** checklist said the stable path "currently skips `rush test`" | **Fixed**: `rush test` runs in the build job | — |
| removing the `NODE_AUTH_TOKEN` dummy | **No change.** It fails closed: an unset `${NODE_AUTH_TOKEN}` stays a literal, invalid token, so the worst case is an npm auth failure, not a use of some other credential | — |
| `package-manager-cache: false` | **No change.** Defensive: no `packageManager` field exists today, so nothing was being cached; the setting keeps it that way if one is added | — |
| dist-tag compares against `@fgv/ts-utils`'s `latest` only | **No change.** Under the lockstep policy every `base-utils` package shares one version, so `ts-utils` stands for all of them | — |

actionlint 1.7.12 + ShellCheck 0.11.0 on all five workflows: no output, exit 0. Pin check: *All
uses: references in 5 files are pinned to a commit SHA.*
