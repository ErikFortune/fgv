# `null-prototype-property-guard` — a converter that throws is not a converter

**Shipped 2026-09-27 via #700.** `@fgv/ts-utils`, `@fgv/ts-json`, `@fgv/ts-res-ui-components`,
`@fgv/ts-utils-jest`. Bug fix; `patch` in all four.

---

## What it fixed

`obj.hasOwnProperty(key)` reads `hasOwnProperty` off the object itself. An `Object.create(null)`
value has no prototype, so there is nothing to read and the call throws `TypeError`. Nine library
call sites did this. The one that mattered most was `isKeyOf`, a type guard that every
field-reading converter in `ts-utils` calls. So:

```ts
const input = Object.assign(Object.create(null), { prop1: 'a', prop2: 'b' });

Converters.strictObject({ prop1: Converters.string, prop2: Converters.string }).convert(input);
// before: throws TypeError: item.hasOwnProperty is not a function
// after:  Success { prop1: 'a', prop2: 'b' }; an extra property is a Failure, not a throw
```

The same held for plain `Converters.object`, and for every other converter that reads a field
through `isKeyOf` (`recordOf`, `discriminatedObject`, the transform converters).

`JSON.parse` never produces a null-prototype object, so wire data never hit this. A caller
does, and it is an ordinary thing to do with untrusted data, precisely because such an object has
no prototype to pollute.

Every site now uses `Object.prototype.hasOwnProperty.call(obj, key)`. On any object that *has* a
prototype the answer is identical, so nothing that worked changes.

| package | sites |
|---|---|
| `ts-utils` | `isKeyOf`; `ObjectConverter`'s strict-mode extra-property check |
| `ts-json` | `JsonEditor` merge; `mergeDefaultJsonConverterOptions`; `contextFromConverterOptions`; `JsonContextHelper.mergeContext` (×2) |
| `ts-res-ui-components` | `computeResourceDelta`'s deletion walk |
| `ts-utils-jest` | the Jest-global probe (only ever called on `global`, so it never threw; fixed so the rule goes clean) |

## The gate

`no-prototype-builtins` is now an **error** in those four packages, and Heft's `build:lint` step
fails the build if a site is reintroduced. The rule was not in force anywhere before this: the
rushstack profile does not include it, which is why lint stayed green through nine violations.

**It is not repo-wide.** There is no shared ESLint layer: each of 33 projects carries its own
`eslint.config.js`. Building one touches every package, so it was deferred as its own work and
recorded as a P2 in `docs/TECH_DEBT.md`. The other 29 packages have no violations today, but
nothing stops a new one.

## Three things worth carrying elsewhere

- **A reported site is a sample, not the population.** One site was reported. A grep found nine,
  including a second on the same `strictObject` path that the report missed. The lint rule is what
  turns "we fixed the ones we found" into "the class cannot come back".
- **Rewriting an optional chain is not a free refactor.** `partial?.hasOwnProperty(k)` short-circuits
  on `null` *and* `undefined`. The first rewrite guarded `!== undefined` only, which would have made
  a `null` options object from a JavaScript caller throw. That is a regression inside a fix whose
  whole claim was "nothing that returns starts throwing". The `code-reviewer` pass caught it before
  the PR opened, and a test now pins it.

- **The rule cannot see everything in the class.** Copilot found `key in delta` in the same
  `ts-res-ui-components` loop. It asks the prototype chain an own-property question, so a deleted
  `toString` was dropped from the delta. `no-prototype-builtins` does not flag the `in` operator.
  The rule stops the throwing form; it does not stop this one.

## Open

- **The shared ESLint layer.** Recorded as a P2 in `docs/TECH_DEBT.md`.
- **T1 handoff.** Whoever finalizes `agent-tasks-v1` should point `agent-tasks-t1/result.md`
  item 6 at this stream. That file is not on `release`, so this PR could not do it.
- **Coverage.** The brief's 100 % gate was not met in `ts-utils` (99.27 %) or `ts-json` (99.95 %).
  Coverage is identical on `release`, and every uncovered line is pre-existing and outside this
  stream's sites.

## Notes

- `state.md` still reads "gates in progress". That is deliberate: it is the in-flight log, and
  `/finalize-task` does not allow correcting it after the fact. `result.md` and this README are the
  record of what completed.
- Copilot's second round also noticed that `jsonThreeWayDiff` drops an own `__proto__` key. It is a
  separate defect in `ts-json`'s diff, recorded as a P3 in `docs/TECH_DEBT.md` rather than fixed here.
- The generated capability feed stamps this stream's converter-centric headline into all four
  packages' `CAPABILITIES.md` files, including `ts-utils-jest`, where nothing changed behaviourally.
  That is the generator's per-package fan-out. It is left as is rather than special-cased.

## Artifacts

- `brief.md`: the orchestrator's brief, with the site table and gates.
- `state.md`: the live work log, including the lint-layer decision.
- `result.md`: the verified site list, each site's test and watched-fail evidence, gate results,
  and the closure of T1's escalation (`agent-tasks-t1/result.md` item 6). T1's file is not on
  `release`, so it was not edited here.
- `meta.yaml`: summary, keywords and related streams.
