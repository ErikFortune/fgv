# Baseline

Pins the **last stable publish** — the commit a `publish/<version>` run pushed and published, as it
sits on its `release/<major>` train, and the lockstep version it published. Bumped by the
orchestrator after a stable publish lands (step 6 of the release flow in
`.ai/notes/orchestrator/branch-migration-checklist.md`), not when a new stream starts.

## What it's for

- **Recovery referent.** "Last known shipped state" if we need to reason about what's actually in
  the wild vs. what has accumulated on `main` since.
- **Blast-radius sizing.** When scoping a stream, the delta between this commit and current `main`
  HEAD is the unreleased surface the stream sits on top of. A bigger delta means more interaction
  risk.

## What it's NOT for

- Not a stream-start gate. Streams branch from current `main` HEAD; collision avoidance with
  parallel streams is by package surface and out-of-scope declarations in the stream entry, not by
  shared base commit.
- Not a wave base. There are no waves — work is reactive, consumer-driven, and feature-shaped.
- Not an alpha marker. Alphas publish from `prerelease` and do not move the baseline.

## When to bump

After every stable publish, once the `publish/<version>` PR has merged into `release/<major>` and
the back-merge into `main` has landed. Record the published commit (the per-package
`<pkg>_v<version>` tags point at it), the train tip after the publish PR merged, the back-merge
commit on `main`, the date and the version.

---

**Current baseline**: `d198bfda6` — 2026-11-20 — **5.1.0** published (npm `latest`), the first
stable publish under the `main` / `release/<major>` model.

| | commit | what |
|---|---|---|
| published commit | `d198bfda6` | "Publish 5.1.0": policy, `package.json`s, CHANGELOGs, consumed change files; every `@fgv/*_v5.1.0` tag points here |
| `release/5` tip | `19aa60ccf` | merge of #798 (`publish/5.1.0` → `release/5`) |
| promotion source | `34396526c` | merge of #791 on `main`, the drain of the old `release` branch into `main`; `release/5` was cut from here |
| back-merge on `main` | `3a541a89f` | merge of #799 (`release/5` → `main`) |

Previous: `ffde48ad` — 2026-05-10 — orchestrator workflow infrastructure installed (provisional pin
under the old model, where this file pinned the last `release` → `main` promotion).

To bump:
```
git fetch origin release/<major> main
git rev-parse '@fgv/ts-utils_v<version>^{}'   # the published commit
git log --oneline -1 origin/release/<major>   # the train tip after the publish PR merged
# then update the line and table above
```
