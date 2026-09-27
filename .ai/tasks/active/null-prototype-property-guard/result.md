# Result — `null-prototype-property-guard`

**Shipped:** `isKeyOf`, `Converters.strictObject` and six other property probes no longer throw on a null-prototype object — a converter handed `Object.create(null)` now returns a `Result` — and `no-prototype-builtins` gates the four packages that carried the class.

---

## Verified site list

Produced by this stream, not copied from the brief:

```
git grep -nE "\.(hasOwnProperty|isPrototypeOf|propertyIsEnumerable)\(" | grep -v "Object.prototype"
```

over every tracked file. **Nine in library source — exactly the brief's table** — plus four in
`ts-utils` test code, 13 in total. No `isPrototypeOf` or `propertyIsEnumerable` call anywhere.

| package | site | public entry that reached it | regression test | watched red |
|---|---|---|---|---|
| `ts-utils` | `packlets/base/utils.ts:48` `isKeyOf` | `isKeyOf`, and every converter that uses it | `utils.test.ts` › isKeyOf › *reports own properties of an object with a null prototype* | ✅ (also turns the three converter tests below red) |
| `ts-utils` | `packlets/conversion/objectConverter.ts:247` strict check | `Converters.strictObject().convert()` | `converters.basic.test.ts` › *object converters with a null-prototype source* › *strictObject converts…* and *strictObject fails rather than throws for extra properties…* | ✅ — `isKeyOf`'s own test stays green, so these two are what pin this line |
| `ts-json` | `packlets/editor/jsonEditor.ts:281` | `JsonEditor.mergeObjectInPlace` | `jsonEditor.test.ts` › mergeObjectInPlace › *merges own properties from a null-prototype source* | ✅ |
| `ts-json` | `packlets/converters/jsonConverter.ts:157` | `mergeDefaultJsonConverterOptions` | `jsonConverter.test.ts` › *honors extendVars supplied on a null-prototype options object* | ✅ |
| `ts-json` | `packlets/converters/jsonConverter.ts:200` | `contextFromConverterOptions` | `jsonConverter.test.ts` › *propagates extendVars from a null-prototype options object* | ✅ |
| `ts-json` | `packlets/context/contextHelpers.ts:157` | `JsonContextHelper.mergeContext` (added context) | `contextHelpers.test.ts` › *with null-prototype contexts* › *uses extendVars from a null-prototype added context* | ✅ |
| `ts-json` | `packlets/context/contextHelpers.ts:159` | `JsonContextHelper.mergeContext` (base context) | `contextHelpers.test.ts` › *… from a null-prototype base context* | ✅ |
| `ts-res-ui-components` | `src/utils/resolutionEditing.ts:106` | `computeResourceDelta`, when a null-prototype resolved object is replaced by a non-object (`jsonThreeWayDiff` hands back the original object as `onlyInA`) | `resolutionEditing.test.ts` › *marks every property of a null-prototype resolved object as deleted…* | ✅ |
| `ts-utils-jest` | `src/index.ts:10` `isJestGlobal` | none — module-private, called once on `global` at import | **none possible** | n/a — covered by the lint rule only |

**How "watched red" was done.** Each fix was reverted on its own, with `no-prototype-builtins`
temporarily set to `off` in that package (with the rule on, Heft's `build:lint` step fails the build
before any test runs, which is itself evidence the gate works). The package's affected suites were
run, and the fix and the rule restored. Each revert turned red exactly the tests in its row and
nothing else in those suites.

Every test asserts the **correct answer**, not just the absence of a throw. The `extendVars` tests
also check the case where the own property is present but `undefined`, because
`hasOwnProperty` is exactly what tells that apart from an absent property.

**Test-code hits (4), all incidental rather than the subject of their test**, rewritten so the rule
passes in `ts-utils`: `test/helpers/jest/index.ts:9` (a copy of `ts-utils-jest`'s probe),
`converters.basic.test.ts:552,737` and `validation/recordOf.test.ts:72` (each asserts that a
`__proto__` key did not become an own property).

**No test pinned the old throwing behaviour.** Nothing had to be inverted.

## A regression caught in review, and fixed

The two `jsonConverter.ts` sites were first rewritten from `partial?.hasOwnProperty('extendVars')` to
`partial !== undefined && Object.prototype.hasOwnProperty.call(partial, …)`. The optional chain
short-circuited on `null` as well as `undefined`, so for a JavaScript caller passing `null` this
turned a working call into a throw. That broke the stream's own "nothing that returns starts
throwing" claim. The `code-reviewer` pass caught it (P2). Both guards now check `null` too, and
`jsonConverter.test.ts` › *treats a null options object like omitted options* pins it; with the
earlier guard restored it fails with `TypeError: Cannot convert undefined or null to object`.

## The lint gate — and the shared layer that does not exist

- `no-prototype-builtins` was absent from the **effective** config, not just unset in repo files:
  `eslint --print-config` shows no entry, because the rushstack profile does not include it.
- **There is no shared lint layer.** There are 33 per-project `eslint.config.js` files (8 distinct
  variants), each extending `@rushstack/eslint-config/flat/profile/node`, and the `heft-dual-rig`
  carries no ESLint config.
- **This was surfaced to the user rather than decided here.** They chose to **enable the rule as
  `error` in the four touched packages** and defer the shared layer. That deferral is a new **P2**
  in `docs/TECH_DEBT.md` (*No shared ESLint layer — `no-prototype-builtins` is on in 4 of 33
  packages*). The other 29 packages have zero violations today.
- The rule was verified to fire: with only the config change and the original source, `eslint src`
  reports 6 / 5 / 1 / 1 violations (ts-utils / ts-json / ts-utils-jest / ts-res-ui-components),
  = 13, and 0 after the fix.

## Change files — four, all `patch`

`common/changes/@fgv/{ts-utils,ts-json,ts-res-ui-components,ts-utils-jest}/null-prototype-property-guard_2026-09-27-00-00.json`.
`rush change --verify --target-branch origin/release` finds all four. They are `patch` because no
signature or export moves, inputs that have a prototype get the same answer, and inputs that threw
now return.

## Gate results

| gate | result |
|---|---|
| per-package build + lint (Heft runs `build:lint`) | clean, zero warnings, in all four |
| per-package `rushx test` | pass. Coverage is **not 100 % in `ts-utils` (99.27 %) or `ts-json` (99.95 %) — on `release` either**. Every uncovered line is pre-existing and identical with and without this change; each package's configured threshold passes. `ts-res-ui-components` measures 46.57 % against a configured threshold of 0 — also pre-existing. |
| `rush change --verify` | 4 change files found |
| repo-wide `rush rebuild` | exit 0, no `SUCCESS WITH WARNINGS` |
| repo-wide `rush test` | _see below_ |
| `verify-capability-docs` | 0 failed |
| `generate-capability-feed --check` | 0 stale |
| `verify-esm-entrypoints` / `verify-bundler-resolution` / `verify-tarball-exports` | _see below_ |
| `code-reviewer` | one P2 (the `null` regression above), fixed. No P1. No P3. |

## T1's escalation — closed

`agent-tasks-t1/result.md` § item 6 escalated `isKeyOf` throwing on null-prototype objects. T3, T4
and T5 each declined it by name, correctly, because none of them owned `ts-utils`. **This stream
closes it.** T1's `result.md` is **not on `release`**; it exists only on `integration/agent-tasks-v1`
(and the t8/t8b branches). So this PR does not edit it: doing so would add a file the base does not
have and create a conflict with the cluster. The closure is recorded here. Whoever finalizes the
`agent-tasks-v1` cluster should point item 6 at this stream.

## Not done, deliberately

- A shared lint layer (above).
- Reformatting pre-existing prettier drift in `objectConverter.ts`. The repo pins prettier 2.8.8, and
  a newer `npx prettier` wanted to rewrite two unrelated lines; that change was reverted.
