# `personality-intake`: PersonAIlity's open fgv asks, captured untriaged and checked against repo state

**Shipped 2026-10-01** via ErikFortune/fgv#711. No package was changed.

> Amended 2026-10-01 after the antagonist pass. See [Appendix A](#appendix-a--corrections-2026-10-01).

---

## What it is

This directory is a batch of 17 consumer requests, ready for triage. Each one is an open `fgv-ask`
issue in `ErikFortune/personaility`, and each has its own file in `findings/inbox/`. A file carries:

- the source issue
- the long-form note that issue links to
- the requester's own framing, with every constraint quoted
- the requester's own priority
- a marked `Observations` section, the only place the intake agent's voice appears

`index.md` is the one-screen table of the batch.

| area | asks |
|---|---|
| `ts-extras-mcp` | ErikFortune/personaility#671–ErikFortune/personaility#678: timeout/abort, fetch guard, failure kinds, terminate, rich results, descriptor + list_changed, OAuth, transport seam |
| `ts-json-base` `JsonSchema` | ErikFortune/personaility#679–ErikFortune/personaility#683: open-object key loss, `anyOf [T, null]`, local `$ref`, constraints through `toJson()`, smaller shapes |
| `ts-extras` ai-assist | ErikFortune/personaility#684: the turn's `AbortSignal` passed to `IAiClientTool.execute` |
| `ts-random` | ErikFortune/personaility#669: weighted pick |
| `ts-agent-memory` | ErikFortune/personaility#670: `derivedFrom` docstring |
| `ts-extras` / `ts-web-extras` | ErikFortune/personaility#648: the browser barrel omits `fromBase64Strict` |

## State at close: all 17 open

The batch was swept against fgv repo state after capture. The checks covered `release`,
`integration/agent-tasks-v1`, all 21 remote branches (see [A.1](#a1--refs-checked-was-not-every-active-branch)), the open PRs,
and history searches for each item's symbols. **None of the 17 is implemented anywhere.** `state.md` gives the
evidence for each item.

Fourteen of the asks are from the 2026-10-01 MCP cluster. Only three predate it, and none of those
three has landed.

## Why capture-only

A summary that decides what matters has already made the triage calls, invisibly and without
knowing what is cheap here or what collides with work in flight. So nothing in this batch is
ranked, merged or dropped. Priorities shown are the requester's own.

## Draining it

The inbox moved to `completed/` with the rest of the directory, because the user asked for the
stream to be finalized. The next orchestrator drains
`.ai/tasks/completed/2026-10/personality-intake/findings/inbox/` from here. They are **undrained**:
`inbox-and-drain.md` asks for a drain before close, and this close did not do one.

## Not covered (named in `result.md`)

- The 28 **closed** `fgv-ask` issues. Their closure was taken at face value; this is where
  fgv's delivered asks are.
- The older notes in PersonAIlity `.ai/notes/fgv-share/` from before the tracker. They may hold
  asks that were never filed as issues.
- M9 (an `mcp-probe` report enhancement). The requester recorded it but chose not to file it.

## Artifacts

`brief.md` (the original contract) · `state.md` (enumeration, exclusions, ambiguities, sweep) ·
`result.md` (outcome, deviations) · `index.md` · `findings/inbox/` (17 files) · `meta.yaml`.

---

## Appendix A — corrections (2026-10-01)

An independent antagonist pass ran after the finalize commit. `state.md` is left as it was written
during the work, per the finalize convention, so its errors are corrected here.

### A.1 — refs checked was not every active branch

> "**Refs checked** (every remote branch with commits since 2026-09-19): `release` @ `30713277`,
> `integration/agent-tasks-v1` @ `2a95fbb2` (contains `release`), `claude/agent-tasks-cluster-close`,
> `claude/system-one-decisions-design`, `integration/system-one-decisions`,
> `claude/coverage-to-100-nonux`, `prerelease`, `erik/tasks`." (`state.md`)

Three qualifying branches were missing from that list: `claude/agent-tasks-t8-4w4kro`,
`claude/orchestrator-handoff-2026-10` and `claude/anthropic-cache-breakpoint-measurement`. None is an
ancestor of `integration/agent-tasks-v1`. The reviewer grepped all 21 remote refs, these three
included, and found none of the asks implemented. The conclusion stands; the stated coverage was
wrong. This README also repeated the claim, and has been corrected inline.

### A.2 — the history search ran on a shallow clone

> "And `git log --all` pickaxe/grep for each item's symbols." (`state.md`)

The fgv clone is shallow, with its boundary at `b86a8e834` (2026-08-21). The window still covers the
question, since the oldest ask is 2026-08-30. But "no commit on any branch changes that line" holds
only back to 2026-08-21, not for all of history.

### A.3 — sweep evidence for J4 and J5 was missing

The `state.md` sweep row for ErikFortune/personaility#679–ErikFortune/personaility#683 cites
`FORBIDDEN_KEYWORDS` and the boolean `additionalProperties`. Neither of those shows anything about
ErikFortune/personaility#682 (constraints through `toJson()`) or ErikFortune/personaility#683's numeric `enum`. Both were verified open separately:

- no `toJson` in `factories.ts` emits `minimum` / `minLength` / `format`
- `fromJson.ts:73` still requires the enum to be "a non-empty array of strings"

### A.4 — the base64 retraction was overstated

> "**ErikFortune/personaility#648**: the issue body's diagnosis and suggested fixes were retracted by the requester in the
> first comment." (`state.md`)

Comment 1 retracts the **diagnosis** and calls suggestion (1) "heavier than needed". It does not
retract suggestions (2) and (3), or the request for a test that runs in a browser bundle. Comment 2
reports suggestion (3) partly landing at `-56`. The inbox file already had this right.

### A.5 — state.md is stale on the finalize itself

`state.md` still points at `.ai/tasks/active/…`, still says "`/finalize-task` was not run", and still
says only paths under `active/` changed. All three were true when written. The finalize
(`773891e8c`) and the ledger commit (`5d56fa20a`) superseded them, as `result.md` and `meta.yaml`
record. This branch also touches `docs/WORKSTREAMS.md` and `docs/workstreams/2026-10.md`.

### A.6 — inbox corrections (edited in place)

The inbox files are this stream's deliverable, so they were corrected directly:

- `mcp-rich-tool-results`: the Observation now cites fgv `docs/FUTURE.md:398`, which already records
  the multimodal-passthrough gap.
- Quotes that had been altered:
  - backslash-escaped quotes inside code spans in `json-schema-constraints-through-tojson` and
    `mcp-failure-kind-close-observation`
  - `'Back-link'` → `"Back-link"` in `agent-memory-derived-from-docstring`
- `ts-random-weighted-pick`: restored the requester's "Both sites adopt it on the bump that carries
  it."
- Two Observations had gone past the brief's allowed kinds. In `json-schema-constraints-through-tojson`
  the "design choice, not an oversight" judgment became a factual scope note. In
  `mcp-http-fetch-address-guard` the "may not fit directly" judgment became a factual statement of
  what the existing entry points return.
- `meta.yaml`: issue references are now qualified as PersonAIlity issues, and `diverged` names the
  unmet drain-before-close rule.

### A.7 — declined

`state.md` § "Where the expectation probably came from" is the agent's inference outside an
Observations section. It is left as written: it answers the user's question about the sweep rather
than describing any request, and the files it cites exist.

### Checked and unchanged

The reviewer fetched all 17 issue bodies and ErikFortune/personaility#648's three comments, and every quote matches its
source except the nits in A.6. It also confirmed:

- the counts: 45 total, 17 open, 28 closed, 29 open issues overall, 12 `cross-track`
- every fgv code fact cited in the Observations and the sweep table
- the source metadata
- the central claim: none of the 17 asks is implemented on any of the 21 remote refs or any open PR
- that `meta.yaml`'s `intended` / `shipped` / `diverged` trace to `brief.md` / `result.md`
- that the blank-`sourceLine` reasoning holds
