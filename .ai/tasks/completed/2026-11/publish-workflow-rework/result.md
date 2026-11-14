# publish-workflow-rework — result

**Shipped:** one dispatch on `publish/<version>` now does the whole stable publish — guards, test,
version and CHANGELOGs written in the run from `common/changes/`, bump commit, publish, per-package
tags, a PR into `release/<major>` and a draft back-merge PR into `main` — and every action in
`.github/workflows/` is pinned to a commit SHA.

Branch `publish-workflow-rework`, based on `branch-model-plan` (#784). PR: #TBD. Nothing was
published, dispatched or pushed anywhere but this branch.

## The experiment

Throwaway clone (`git clone --no-local` of this worktree) under the scratchpad, `rush install`, and
its `origin` repointed at a scratch bare repo — **`rush publish` and `rush version --target-branch`
run real `git push`es even without `--publish`** (C4 committed and pushed "Bump versions [skip ci]";
C5c pushed `HEAD:<target> --follow-tags`), so the redirect was what kept the experiment off this
worktree. `--publish` was never passed. Input tree: version policy `base-utils` `5.1.0` /
`nextBump: minor`, 33 `base-utils` packages at `5.1.0` plus `@fgv/repo-template` at `5.1.0-6`,
791 change files. Reset between candidates (`git reset --hard`, `git clean` of the project folders,
bare-origin refs restored).

Logs: `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/wf/` (scratch, not
durable).

| # | command(s) | policy after | `base-utils` package.json | CHANGELOG top entry | change files left | verdict |
|---|---|---|---|---|---|---|
| C1 | `rush version --bump` | 5.2.0 / minor | 34 × 5.2.0 | 5.2.0, populated (ts-utils: 16 minor, 4 patch, 19 none) | 20 | wrong version |
| C2 | `rush version --bump --override-bump patch` | 5.1.1 | 34 × 5.1.1 | 5.1.1, populated | 20 | wrong version |
| C3 | `rush publish --apply --include-all --pack --release-folder <dir> --target-branch … --add-commit-details --ignore-git-hooks` | 5.1.0 (untouched) | unchanged (repo-template still 5.1.0-6) | 5.0.2 (untouched) | 791 | no-op: `--include-all` ignores change files and `--apply`; `--pack` without `--publish` is a dry run (0 tarballs) |
| C4 | `rush publish --apply --target-branch … --add-commit-details --ignore-git-hooks` (no `--include-all`) | 5.1.0 (untouched) | **20 × 5.2.0, 12 × 5.1.1, 2 × 5.1.0** | 5.2.0 / 5.1.1 per package | 29 | breaks lockstep; also committed and pushed |
| C5 | `rush version --ensure-version-policy --version-policy base-utils --override-version 5.1.0-0` then `rush version --bump --version-policy base-utils --override-bump patch` | **5.1.0 / minor** | **34 × 5.1.0** (repo-template corrected) | **5.1.0, populated**; 32 CHANGELOG files created where none existed | **20** (all on projects with no version policy: ks, testbed, ts-res-tutorial, ts-res-ui-playground) | **matches** |
| C5c | after C5: `rush publish --include-all --set-access-level public --target-branch … --add-commit-details --ignore-git-hooks` (dry) | — | — | — | — | would `pnpm publish` 34 packages, tag 34 × `<pkg>_v5.1.0`, nothing skipped |
| C6 | `rush version --bump --override-bump major` (the old major impl) | 6.0.0 | 34 × 6.0.0 | 6.0.0 | 20 | publishes `<policy major>+1` |
| C7 | tree with policy 6.0.0, then the C5 sequence with `6.0.0-0` | 6.0.0 | 34 × 6.0.0 | 6.0.0, populated | 20 | major works without `--override-bump major` |

Additional checks on the C5 tree: `rush install` succeeds with no lockfile change; `rush rebuild -t
@fgv/ts-utils` succeeds and modifies no tracked file; a manual `pnpm pack` of `ts-extras` produced
`fgv-ts-extras-5.1.0.tgz` with `version: 5.1.0` and `@fgv/ts-json-base: 5.1.0` (workspace range
resolved). The tarball carries `CHANGELOG.json`, not `CHANGELOG.md`.

### Alpha, unchanged

Run on `origin/prerelease` (`efc72db47`, policy `5.1.0-62` / `nextBump: prerelease`) with the alpha
impl's exact command:

| command | result |
|---|---|
| `… publish --apply --pack --include-all … --tag alpha --prerelease-name alpha` (`--pack` for `--publish`) | dry `pnpm pack` × 35, no tags, tree untouched |
| same, no `--pack` | `Skip <pkg>. Not updated.` × 35 — 5.1.0-62 is on npm |
| after `rush version --bump` (5.1.0-62 → 5.1.0-63) | would `pnpm publish --tag alpha` × 35 at 5.1.0-63, tags `<pkg>_v5.1.0-63-alpha`, push `HEAD:prerelease --follow-tags` |

So the alpha workflow publishes whatever `prerelease` already says; the `-N` bump is the maintainer's
prior commit. The command is left byte-identical except that `${GITHUB_REF_NAME}` is now quoted.

### The chosen sequence

```bash
rush version --ensure-version-policy --version-policy base-utils --override-version "$VERSION-0"
rush version --bump --version-policy base-utils --override-bump patch
git commit --no-verify   # policy, package.json, CHANGELOG.*, deleted change files
rush rebuild && rush test && verify-tarball-exports
rush publish --publish --include-all --set-access-level public --target-branch "$GITHUB_REF_NAME" \
  --add-commit-details --ignore-git-hooks
```

`--override-bump patch` on `X.Y.Z-0` yields exactly `X.Y.Z` for any `X.Y.Z`, so the policy version
is the version published. `--override-bump major` is not needed (C6/C7).

## What changed

| file | change |
|---|---|
| `publish.yml` | top-level `contents: read`; `release` and `major` both call `publish-release-impl.yml` with `release_kind`; per-job `contents`/`id-token`/`pull-requests: write`; `concurrency` per ref |
| `publish-release-impl.yml` | `guard` job (no secrets, `persist-credentials: false`): ref `publish/*`, policy `X.Y.Z`, branch == policy, `major` ⇔ `X.0.0`, `origin/release/<major>` is an ancestor, `@fgv/ts-utils@<V>` not on npm. `publish` job: install → version → assert all `base-utils` at `<V>` → commit → rebuild → **test** → tarball check → publish → confirm push → PRs → summary (`if: always()`) |
| `publish-alpha-impl.yml` | `prerelease`-only guard step; pins; npm exact; `git config` in a run step |
| `publish-major-impl.yml`, three `*-legacy.yml` | deleted |
| `ci.yml` | triggers per brief (keeps `release`, drops `hotfix`); `contents: read`; `persist-credentials: false`; SHA-pin check step; pins; `git config` run step |
| `dependabot.yml` | `github-actions` ecosystem, weekly (prettier requoted the file) |
| `common/config/rush/.npmrc-publish` | `NPM_TOKEN` line commented out — OIDC only |
| `branch-migration-checklist.md` | status, ticks, proven sequence, settings items, corrected tarball claim, open question 2 resolved |

### Pins

| action | tag | SHA | source |
|---|---|---|---|
| `actions/checkout` | v5.1.0 (latest v5) | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` | `git ls-remote https://github.com/actions/checkout 'refs/tags/v5*'`, lightweight tag (no `^{}`); `v5` points at the same commit |
| `actions/setup-node` | v5.0.0 (only v5) | `a0853c24544627f65ddf259abe73b1d18a591444` | same method; `v5` points at the same commit |
| `snow-actions/git-config-user` | — | removed | its v1.0.0 `action.yml` runs repo-local `git config user.name/email`; replaced by the same two lines |
| npm | 11.21.2 | — | newest 11.x, published 2026-11-04 (9.5 days old at the change; `next-11` tag); npm 12 is `latest` but the brief keeps the 11 line |

Newer majors (checkout v6, setup-node v6) were not taken: neither is a verified drop-in and the first
stable publish runs on this file.

## Validation

- **actionlint 1.7.12** (built with `go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12`
  via the Go module proxy — a direct release download was refused by the sandbox) **with ShellCheck
  0.11.0** (`shellcheck-py==0.11.0.1` from PyPI): **0 findings**. Two SC2016 infos on `node -e '…'`
  JavaScript are suppressed in place with a reason; the SC2086 infos were fixed by quoting.
- **YAML parses** (PyYAML 6.0.1 loads all four files; the step harness below reads them).
- **Pin check**: the step's script, extracted from `ci.yml`, passes on this branch and fails on a copy
  with `setup-node@v5`, a quoted tag ref and a 39-hex SHA, listing all three.
- **Guard script**, extracted and run in the scratch clone: G1 `publish/5.1.0` release passes
  (`version=5.1.0 major=5`); G2 `release/5` ref, G3 `prerelease` ref, G4 `publish/5.1.1` vs policy
  5.1.0, G5 `major` on 5.1.0, G6 HEAD not under `release/5` (message lists `release/4`), G7
  `release/5` absent, G8 policy 5.0.2 (on npm), G9 policy `5.1.0-62`, G11 `release` on 6.0.0 — each
  fails with its message; G10 `major` on 6.0.0 under `release/6` passes.
- **Version, commit and confirm steps**, extracted and run in the scratch clone on `publish/5.1.0`:
  34 packages at 5.1.0, commit of 840 files, clean tree after; the publish command minus `--publish`
  pushed the commit to the scratch origin and the confirm step matched it. Tag-count pattern checked
  against two pushed annotated tags.
- **Alpha guard**: passes on `prerelease`, fails on `main` and `publish/5.1.0`.
- **Not exercisable locally**: npm OIDC, `gh pr create`/`gh pr list`, the step summary, environment
  approvals. The PR step's shell is covered by ShellCheck only.
- `NPM_TOKEN` grep after the change: the legacy workflows are gone; what remains is the commented
  example in `.npmrc-publish`, a code comment in `common/scripts/install-run.js` (generic env-var
  handling, untouched), and prose in the brief and the checklist.
- `rush change --verify --target-branch origin/integration/asks`: no relevant package changes.
- `npx -y prettier@2.8.8 --check` on every touched `.yml`/`.md`: clean.
- No package or `common/scripts/*` file changed, so no rebuild/test gate.

## Needs the maintainer

1. **Environment `npm-publish-release`**: allow deployment branch pattern `publish/*` (today it is
   presumably `release`/`main`); `npm-publish-alpha`: allow `prerelease`.
2. **Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"** must
   be on, or the PR step fails with 403 *after* the packages are on npm (the run is then red but the
   publish is done; open the PRs by hand from the summary).
3. **PRs opened with `GITHUB_TOKEN` do not trigger `ci.yml`.** Push to the branch or close/reopen to
   get checks, or switch the step to a GitHub App token later.
4. **First run: no back-merge PR.** `release/5` freshly cut from `main` has no commits ahead, so the
   workflow warns and prints the compare link instead; open it after merging the publish PR.
5. **Branch protection** must let the workflow push to `publish/*` (commit and tags).
6. **The policy names the next version to publish.** After 5.1.0, a PR to `main` must set the policy
   to the next stable (e.g. `rush version --ensure-version-policy --version-policy base-utils
   --override-version 5.2.0`) before `publish/5.2.0`; recreated `prerelease` needs `5.2.0-0` /
   `nextBump: prerelease` for alphas to continue at 5.2.0-N.
7. **npm `latest` for `@fgv/repo-template` is `5.1.0-2`** (an alpha); the 5.1.0 publish moves it.
   `@fgv/repo-template`'s `package.json` says `5.1.0-6` on `release`; the version step corrects it.
8. **Partial-failure recovery.** Rush pushes the commit and tags only after every `npm publish`. If
   publishing stops part-way, nothing is pushed; a re-run passes the guard only if `@fgv/ts-utils`
   was not among the published, re-bumps from the same tree, and rush skips packages already on npm.
   If `@fgv/ts-utils` did publish, finish by hand.
9. **`.npmrc-publish`** no longer has an active token line; uncomment it for a local token publish.
10. **Stray change files**: 20 change files for unversioned projects (`ks`, `testbed`,
    `ts-res-tutorial`, `ts-res-ui-playground`) are never consumed and will accumulate.

## Follow-ups (not done)

- Defer the job's write credentials until the push step (`persist-credentials: false` plus an
  `extraheader` set just before `rush publish`), so `rush install`/`rebuild`/`test` never run with a
  `contents: write` token in `.git/config`. Not done the night before the first publish.
- `ACTIVE_DEVELOPMENT.md` § "What the `type` actually does" says lockstep entries all render under
  `### Updates`; `rush version --bump` renders `### Minor changes` / `### Patches` / `### Updates` by
  type (C1, C5). The doc is wrong on that point.
