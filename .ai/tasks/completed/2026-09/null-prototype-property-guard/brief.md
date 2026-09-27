# Stream brief — `null-prototype-property-guard`

A bug fix, promoted to its own stream because the defect turned out to be a **class of nine sites
across four packages**, not the one instance it was reported as.

## Mission

Replace every unguarded `obj.hasOwnProperty(key)` in library source with
`Object.prototype.hasOwnProperty.call(obj, key)`, and **enable the lint rule that makes the class
unable to recur**.

**Dependencies:** none. Branch off `release`.

## Branch and PR posture

- **Branch:** `claude/null-prototype-property-guard`, created off `release` at `bba6af445` and pushed.
- **PR into `release`.** This is not part of the `agent-tasks-v1` cluster.
- **Artifacts in `.ai/tasks/active/null-prototype-property-guard/`.** This is a standalone fix, so
  **do** run `/finalize-task` as part of the PR that closes it.

---

## The defect, reproduced

`isKeyOf` calls `item.hasOwnProperty(key)`. On an object with a null prototype there is no
`hasOwnProperty`, so it throws instead of answering:

```
$ node -e "…"   # against built ts-utils, 2026-09-26
isKeyOf THREW: TypeError - item.hasOwnProperty is not a function
strictObject.convert THREW: TypeError - item.hasOwnProperty is not a function
Object.prototype.hasOwnProperty.call(nullProto, 'name') -> true
```

So a *type guard* throws, and — the part that matters — **`Converters.strictObject().convert()`
throws rather than returning a `Failure`**. That is a Result-pattern violation reachable from public
API by a host that passes an `Object.create(null)` value, which is a perfectly ordinary thing to do
with untrusted data precisely *because* it has no prototype to pollute.

`JSON.parse` never produces such an object, so wire data does not reach it. A caller does.

## Why this is a stream and not a one-line commit

**T1 reported one site. There are nine.** Fixing the reported line and stopping is the exact mistake
this repo has paid for repeatedly — see `CODING_STANDARDS.md` on contagions (the 23-instance
save/restore pattern, the 20-instance mock-Result shape), and note that the reported site is *not*
even the most serious one.

Library source, from `grep -rn "\.hasOwnProperty(" libraries/*/src tools/*/src | grep -v "Object.prototype"`:

| package | file:line | note |
|---|---|---|
| `ts-utils` | `packlets/base/utils.ts:48` | the reported site — `isKeyOf` |
| `ts-utils` | `packlets/conversion/objectConverter.ts:247` | **on the same `strictObject` path**; T1 did not report it |
| `ts-json` | `packlets/editor/jsonEditor.ts:281` | |
| `ts-json` | `packlets/converters/jsonConverter.ts:157` | caller-supplied options |
| `ts-json` | `packlets/converters/jsonConverter.ts:200` | caller-supplied options |
| `ts-json` | `packlets/context/contextHelpers.ts:157` | caller-supplied context |
| `ts-json` | `packlets/context/contextHelpers.ts:159` | caller-supplied context |
| `ts-res-ui-components` | `src/utils/resolutionEditing.ts:106` | |
| `ts-utils-jest` | `src/index.ts:10` | on `globalThis`, which always has a prototype — safe in practice; fix for consistency and to let the rule go clean |

**Verify this list yourself** rather than trusting the table; it was produced by one grep on one day,
and the count is the whole argument for the stream's shape. There were 13 hits including test files —
decide per test whether the call is the subject of the test or incidental.

## The gate — this is the deliverable that stops it recurring

`no-prototype-builtins` is **not configured anywhere in this repo** (`grep -rn
"no-prototype-builtins"` outside `node_modules` returns nothing), and lint is green with nine
violations present — which is the evidence that it is off.

ESLint's `no-prototype-builtins` catches exactly this class. **Enable it as an error**, and place it
where every package inherits it rather than per-package if the config layout allows — each package
has its own flat `eslint.config.js` extending `@rushstack/eslint-config/flat/profile/node`, so find
out whether there is a shared layer before copying a rule into twenty files. If there is not, say so;
a shared lint layer may be worth its own small stream rather than being invented here.

`TECH_DEBT.md`'s own framing applies: *"the fix is not to restate it but to replace recall with a
mechanical gate."* A stream that fixes nine sites and leaves the rule off has fixed nothing durable.

## Compatibility posture — read this before worrying

Three of the four packages (`ts-utils`, `ts-json`, `ts-res-ui-components`) are **stability-obligated
production surfaces** per `ACTIVE_DEVELOPMENT.md`, so the instinct to be careful is right. But this
change is **not breaking in either direction**:

- Every input that works today returns the same answer — `Object.prototype.hasOwnProperty.call(o, k)`
  and `o.hasOwnProperty(k)` agree on every object that has a prototype.
- Inputs that currently **throw** start returning correctly. Nothing that currently returns starts
  throwing.

So no signature moves, no export changes, and the change file is a **`patch`**. (It is not `minor` —
nothing is added — and `major` is wrong on both counts: nothing breaks, and per
`ACTIVE_DEVELOPMENT.md` § *How to type a change file* the test is whether it breaks code that shipped
non-alpha.) **Every touched package needs its own change file**, which for four packages is four
files; that gate is CI's first and is invisible to the whole local suite.

One thing to watch: a *test* that asserts the current throwing behaviour would go red, and that is
the desirable direction. If you find one, the test is wrong and should be inverted, not preserved —
but say so explicitly in `result.md` rather than quietly changing an assertion.

## Tests

For each fixed site, a test that **passes a null-prototype object and asserts the correct answer**
— not merely that it does not throw. And per `TESTING_GUIDELINES.md` on caller enumeration: the
reported site is a shared helper with call sites that each matter, so **`isKeyOf`'s own test is not
sufficient**. `Converters.strictObject().convert()` returning a `Failure` rather than throwing is its
own test, at its own call site, because that is the behaviour a consumer actually depends on.

Verify each test the way that section requires: revert the one-line fix, watch exactly that test go
red, restore it. A regression test you have not seen fail is a guess.

**Headroom — checked for you, and it is fine, but check the file you actually pick.** The 2000-line
`max-lines` cap is a promoted **P1** in `docs/TECH_DEBT.md` that six streams have now paid, so this is
worth thirty seconds rather than a red check. As of 2026-09-26 the likely targets have room:
`ts-utils/src/test/unit/utils.test.ts` is **486**, and `converters.basic.test.ts` (which already
exercises `strictObject`) is **1688**. The danger files in `ts-utils` are elsewhere —
`test/unit/result.test.ts` at **1989**, 11 lines of headroom — so do not put a null-prototype test
there out of convenience.

## Out of scope

- **Any other `Object.prototype` builtin.** `no-prototype-builtins` also covers `isPrototypeOf` and
  `propertyIsEnumerable`; if the rule flags those, fix what it flags, but do not go looking for
  adjacent classes.
- **A shared lint layer**, if one does not exist — surface it instead.
- **Refactoring anything you touch.** Fix the call, add the test, move on.

## Gates

- [ ] `rushx build` **zero warnings**, `rushx lint`, `rushx fixlint` in every modified package
- [ ] `rushx test` at 100 % coverage in every modified package
- [ ] **A change file for every touched package** — four of them; verify with
      `rush change --verify --target-branch origin/release`. Type them **`patch`**
- [ ] Repo-wide `node common/scripts/install-run-rush.js rebuild` **and** `test`. The `test` half is
      **load-bearing**: this widens what these functions *accept* without moving a signature, which is
      precisely the class a rebuild cannot see (`CODING_STANDARDS.md` § *`rush rebuild` covers a
      widened type. Only a repo-wide `rush test` covers a widened behaviour*)
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] `code-reviewer` before coverage closure; then the Copilot loop
- [ ] `/finalize-task` — this stream does close, unlike the agent-tasks slices

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`.
It must record: the verified site list (yours, not this brief's); whether a shared lint layer existed
and what you did about it; each site's test and that you watched it fail; and the **four** change
files. Then close T1's escalation — `.ai/tasks/active/agent-tasks-t1/result.md` § item 6 — and note
that T3, T4 and T5 each declined it by name.

## Required reading, in order

1. This brief.
2. `libraries/ts-utils/src/packlets/base/utils.ts` and `packlets/conversion/objectConverter.ts`.
3. `.ai/tasks/active/agent-tasks-t1/result.md` § item 6 — the original escalation.
4. `.ai/instructions/ACTIVE_DEVELOPMENT.md` § *Compatibility Rules* and § *How to type a change file*.
5. `.ai/instructions/TESTING_GUIDELINES.md` § *100 % coverage cannot see a predicate that is never
   called* — the caller-enumeration rule.
6. `.ai/instructions/CODING_STANDARDS.md` § *Every touched package needs a change file*.

## Missing-input rule

If a required-reading file does not exist, or the site list does not match what you find,
**STOP and surface the gap** — the count is the argument for this stream's shape, so a different
count is worth reporting before you start fixing.
