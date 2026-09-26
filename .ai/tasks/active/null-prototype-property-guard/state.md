# State — `null-prototype-property-guard`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go.

---

## Status

**Not started.** Branch created and brief placed by the orchestrator 2026-09-26. No implementation
work has begun.

## Branch

- `claude/null-prototype-property-guard`, cut from `release` at `bba6af445`.
- PR targets **`release`**. Not part of the `agent-tasks-v1` cluster.
- Artifacts in `.ai/tasks/active/null-prototype-property-guard/`. This stream **does** close —
  run `/finalize-task` in the PR that closes it.

## Provenance

T1 of the agent-tasks plan escalated this on 2026-09 as *"an upstream robustness gap, escalated
rather than fixed"* (`.ai/tasks/active/agent-tasks-t1/result.md` § item 6). T3, T4 and T5 each
explicitly declined it by name as out of scope — correctly, since none of them owned `ts-utils`.
Four consecutive declines is why it became its own stream rather than a fifth deferral.

## Verified by the orchestrator before the brief was written

Reproduced against built `ts-utils` on 2026-09-26, not taken from T1's report:

```
isKeyOf('name', Object.create(null) with .name set)
  -> THREW TypeError: item.hasOwnProperty is not a function
Converters.strictObject({name: Converters.string}).convert(same)
  -> THREW TypeError: item.hasOwnProperty is not a function
Object.prototype.hasOwnProperty.call(same, 'name')  -> true
```

So the reported behaviour is exact, and the downstream consequence — a `Converter` **throwing**
instead of returning a `Failure` — is real and reachable from public API.

**The scope changed as a result of that check.** T1 reported one site; a repo-wide grep found **nine
in library source** across four packages, including a second in `ts-utils` on the same `strictObject`
path (`packlets/conversion/objectConverter.ts:247`) that T1 did not report. The full table is in the
brief. Thirteen hits including test files.

**`no-prototype-builtins` is not configured anywhere** in the repo, and lint is green with nine
violations present — which is the evidence it is off, and the reason the gate is a deliverable rather
than a nicety.

## Work log

_(append as you go)_

## Two things to expect that are not defects

1. **`max-lines` is not this stream's problem.** The `docs/TECH_DEBT.md` P1 on the 2000-line cap is
   being worked by `agent-tasks-t8b`, whose phase 0 extracts
   `ts-agent-tasks/src/packlets/storage/repository.ts` (1993 lines). This stream carries only a
   *don't-trip-it* warning about where to put new tests. The four remaining near-cap files
   (`ts-utils/test/unit/result.test.ts` 1989, `ts-json-base/test/unit/jsonCompatible.test.ts` 1982,
   `ts-extras/.../keyStore.test.ts` 1945, `ts-agent-memory/.../fileTreeMemoryStore.ts` 1907) stay on
   the P1 entry for a separate chore. **Do not refactor them here.**
2. **A trivial conflict in `docs/WORKSTREAMS.md` is expected** when this lands alongside the
   `agent-tasks-v1` cluster. Both add entries near the top of *Active workstreams*; both sides are
   keepers, and the resolution is to keep both.

## Open questions for the orchestrator

_(raise here and surface, rather than reconstructing intent and proceeding)_

One is anticipated: **whether a shared lint layer exists.** Each package carries its own flat
`eslint.config.js` extending `@rushstack/eslint-config/flat/profile/node`. If enabling
`no-prototype-builtins` means editing twenty files, that is worth surfacing before doing it — a
shared layer may deserve its own small stream rather than being invented inside a bug fix.
