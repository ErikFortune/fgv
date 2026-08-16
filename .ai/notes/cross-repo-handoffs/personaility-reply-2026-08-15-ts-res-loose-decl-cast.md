# Reply — `addResource` input type vs `resourceCollectionDecl` output

**Answering:** *ts-res — `addResource` input type vs `resourceCollectionDecl` output (soft / ergonomics)*, re-verified by you against 5.1.0-47 on 2026-08-11.

**OUTCOME (2026-08-15): accepted by PersonAIlity; ask withdrawn. Closed — no change on either side.**
The cast is being removed on their side. Nothing is owed by us, and there is no ts-res work queued from this.

---

**Verdict: no change needed — and none of the three candidates is the right answer. The cast is unnecessary. Delete it.**

We think `ontologyResolver.ts` compiles without the `as ReadonlyArray<ResourceJson.Json.ILooseResourceDecl>`. If it does, this closes with zero API change on either side. If it doesn't, we want to know immediately, because then we are missing something real and it is more interesting than the original ask.

---

## Why

Your diagnosis was right and the conclusion was one step off. You wrote that the two shapes are structurally compatible and the cast is therefore safe. They are — and that is exactly why the cast is *redundant* rather than *safe*.

The only difference between the two `ILooseResourceDecl`s is the `conditions` field, and it resolves cleanly:

```
Normalized.ConditionSetDecl  = ReadonlyArray<ILooseConditionDecl>
                               └─ imported FROM ./json, at the default TQualifierNames = string

Json.ConditionSetDecl<T>     = ConditionSetDeclAsArray<T>          // = ReadonlyArray<ILooseConditionDecl<T>>
                             | ConditionSetDeclAsRecord<T>
```

`Normalized`'s condition-set type is *literally one arm* of `Json`'s union — same element type, imported from the same file, at the same default instantiation. `Normalized` is the strictly narrower type. Narrow-to-wide is ordinary assignability; TypeScript grants it without help.

## What we ran

Twice — against our current source, and against the built `dist/ts-res.d.ts` rollup you actually compile against. Each probe carries a deliberate control line, so a vacuous pass would have been caught:

```ts
import { ResourceJson } from '@fgv/ts-res';

declare const norm: ReadonlyArray<ResourceJson.Normalized.ILooseResourceDecl>;

// the assignment you cast for today
const noCast: ReadonlyArray<ResourceJson.Json.ILooseResourceDecl> = norm;   // ✅ compiles clean

// control — must fail, or the probe proves nothing
const shouldFail: ReadonlyArray<number> = norm;                            // ❌ TS2322, as required
```

`tsc --noEmit --strict`. The control errored; the real line did not.

**Version drift is not the explanation.** `json.ts` and `normalized.ts` have not changed since 2026-05-19 (#397, the `ts-prompt-assist-features` cluster) — months before the 5.1.0-47 you verified against. The types you have are the types we probed.

## Why we are declining candidate 3 specifically

You offered "document that the cast is the intended bridge" as the cheap out. It is the one option we think is actively harmful, for two reasons:

1. **It cements a compatibility requirement forever.** Blessing the cast in the capabilities doc converts an incidental structural overlap into a published guarantee we then owe you indefinitely — including through any future change to either shape.
2. **A no-op `as` is a silenced alarm.** The cast currently suppresses nothing. If these two shapes ever genuinely diverge, that cast is precisely what would hide it — at a library boundary, in a consumer, with no compile error. Documenting it would make that permanent by design rather than by accident.

Candidates 1 and 2 we are also declining, but only because they solve a problem that is not there. For the record, if the problem *had* been real, candidate 1 (widen `addResource` to accept `Normalized.ILooseResourceDecl`) would still have been the wrong shape: `Normalized.ILooseResourceDecl` is not generic on `TQualifierNames`, so that arm could never carry the narrow, and we would have been building a permanent opt-out of the typed-qualifier-names cascade into a public entry point.

## One thing this does not change

Your call site lands on `TQualifierNames = string` either way — with the cast or without it. Nothing here gets you typed qualifier names through the collection-converter path. If you want that, it is a real and separate conversation about making the converter output generic, and worth raising as its own ask with a concrete call site.

## If we are wrong

The one thing we cannot see is your `tsconfig`. If removing the cast fails on your side, please send the exact error and the compiler options — a flag that changes this outcome would be a genuine finding and we would want it. Same if you are consuming through a path other than the package root (a deep import, or a re-export that re-declares the type).

Otherwise: delete the cast, and this one closes as **no change needed on either side**.
