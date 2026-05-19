# ts-prompt-assist v0.1 — consumer pressure-test findings (round 2)

**Context:** fresh second pressure-test against the post-round-1
improved surface. Integrated `@fgv/ts-prompt-assist` into
`samples/ai-image-gen-sample` from scratch — round-1's PR #373 was
intentionally NOT merged, so this is a cold-start integration, not an
incremental delta on round-1's code.

**Integration scope:**

- Replaced the hardcoded `'You are a helpful assistant.'` system prompt
  in the chat path with a `PromptLibrary.resolve` call sourced from an
  in-memory `PromptStoreFixture`.
- Added a `tone` qualifier with a `'formal'`-conditional partial
  candidate, wired to a UI `Tone` select in `ChatPanel`.
- Used the post-round-1 ergonomic surface throughout: bare-string
  decl-array (`qualifiers: ['tone'] as const`), descriptor.id omitted
  on the fixture seed (F12), `withType<ChatPromptLibrary>()` for
  failure propagation (F13), and the React useEffect-initialiser
  pattern from the README (F9).

**Overall impression:** materially smoother than round-1. The big
wins — F1's bare-string decl array, F12's optional descriptor.id,
F13's `withType<>`, F9's React-wiring doc, F14's `Partial<Record>`
widening for empty qualifier contexts — all land where round-1
predicted they would, and the consumer-side `promptLibrary.ts`
module is ~30 lines of meaningful code instead of round-1's ~50+. The
README's "Wiring into a React app" section was directly copy-paste
applicable; I literally followed it line for line.

Residual friction is concentrated on the **candidate-authoring**
surface (the `conditions` shape on a seed record), which round-1
under-explored because it primarily touched the resolve side. The
authoring side does not benefit from `TQualifierNames` inference today,
so the typed safety F3 unlocked for `resolve(...)` doesn't flow back
to the seed.

**Round-1 findings cross-check** (informational only, not used as a
checklist):

| Round-1 | Status after round-2 integration |
|---|---|
| F1 (verbose qualifier setup) | **Resolved.** Bare-string decl-array works; one line. |
| F2 (chain repeats) | **Not hit.** Captured `SCOPE` at module scope; not friction. |
| F3 (typed qualifier context) | **Resolved on resolve side.** See FR-3 for the authoring-side gap. |
| F4 (branded id verbosity) | **Not friction in practice.** 2 `.orThrow()`s at module scope. |
| F6 (sync fixture) | **Dropped per orchestrator triage; React-wiring doc absorbs the friction.** Confirmed. |
| F7 (trace not loggable) | **Not hit** — didn't need to log the trace. |
| F8 (warmUp) | **Not hit** — perf wasn't measurable in the integration. |
| F9 (React-wiring doc) | **Resolved.** Doc is excellent; followed verbatim. |
| F12 (descriptor.id redundancy) | **Resolved.** Omitted; works as documented. |
| F13 (Failure invariant) | **Resolved.** `withType<ChatPromptLibrary>()` is clean. |
| F14 (`Partial<Record>` qualifiers) | **Resolved.** `tone === 'formal' ? { tone: 'formal' } : {}` typechecks. |

---

## F1. Candidate `conditions` keys are not typed against `TQualifierNames`

**Surface:** `IPromptCandidateRecord.conditions: ConditionSetDecl` (from
ts-res's `resource-json` packlet, consumed by `IPromptStoreFixtureSeedRecord`).

**Friction:** F3's absorption gave the resolve request a typed
qualifier shape — `resolve({ qualifiers: { tonr: 'formal' } })` is a
compile-time error. But the **authoring** side has no equivalent
narrowing. In my seed I wrote:

```ts
candidates: [
  { conditions: {}, body: '...' },
  { conditions: { tone: 'formal' }, isPartial: true, body: '...' }
]
```

If I had typo'd `tonr: 'formal'` on the partial, it would have
compiled cleanly and silently never matched at resolve time. The
condition would be passed to ts-res's candidate selector, which treats
unknown axes as "no value" and falls through to the base candidate —
the same silent-failure mode F3 absorbed for the request side.

This was the single biggest hazard I had to manually guard against
during the integration. I had to eyeball-match `'tone'` in three
places: the bare-string decl-array, the candidate `conditions` key, and
the resolve request's `qualifiers` key. The first and third agree at
compile time (via F3); the middle one is unchecked.

**Workaround used:** none — surfaced.

**Severity:** P2 friction. (Same risk class as round-1's F3; the
authoring half wasn't covered when F3 was absorbed.)

**Suggested fix:** parameterise `IPromptStoreFixtureSeedRecord` (or at
least the `candidates[].conditions` field) on a `TQualifierNames`
parameter, so the fixture seed builder can be typed against the same
axes the library will be created with. A consumer pattern like:

```ts
const seed: IPromptStoreFixtureSeed<'tone'> = { records: [...] };
```

…would let TS reject `{ tonr: 'formal' }` at authoring time. The
challenge is that `qualifiers` and `seed` are decoupled today (a seed
goes through `PromptStoreFixture.build` separately from
`PromptLibrary.create`) — but a `PromptStoreFixture.build<'tone'>(seed)`
generic on the call site would thread the param through. Either route
gets the win.

### ✅ Resolved 2026-05-19 — `ts-res-typed-conditions` stream + sample-app demo

Closed at the right layer. `@fgv/ts-res` now publishes parameterized
Decl types (B-1, PR #391) and typed Converter siblings (B-2, PR #394);
`@fgv/ts-prompt-assist` consumes the primitives directly (B-3, PR #395)
by parameterizing `IPromptCandidateRecord` / `IStoredPromptRecord` /
`IPromptStoreFixtureSeed` / `IFileTreePromptStoreCreateParams` on
`TQualifierNames extends string = string` and threading an optional
`qualifierNameConverter: Converter<TQualifierNames>` through
`FileTreePromptStore.create` and `PromptStoreFixture.build`. When the
Converter is supplied, the YAML loader rejects typo'd axis names at
convert time via `ResourceJson.Convert.typedConditionSetDecl(qc)` — so
even a runtime-cast escape-hatch (`as unknown as IPromptCandidateRecord<'tone'>`)
fails at `store.get()` time.

The sample app's `samples/ai-image-gen-sample/src/promptLibrary.ts`
now demonstrates the canonical pattern: a single `const qualifierNames = ['tone'] as const`
constant threads through (1) `qualifiers: qualifierNames` on
`PromptLibrary.create`, (2) `IPromptStoreFixtureSeed<QualifierName>`
on the seed annotation, and (3) `qualifierNameConverter` on the seed
itself. A typo'd `tonr` becomes a build-time error in the sample's
own TS build.

---

## F2. `IPromptStoreFixtureSeed.records[].descriptor.surface` and `output` and `slots` are all required for the trivial chat case

**Surface:** `IPromptDescriptor` (consumed via fixture seed).

**Friction:** the simplest possible authored prompt — one body, no
slots, free-text output, chat surface — still requires the consumer
to spell out:

```ts
descriptor: {
  title: 'Chat system prompt',
  schemaVersion: '1',
  surface: 'chat',
  slots: [],
  output: { kind: 'free-text' }
}
```

`schemaVersion: '1'` in particular is ceremony — there's only one
schema version today and nothing in the consumer's authoring is
informed by varying it. `slots: []` is also ceremony when the body
contains no Mustache slots — the loader can detect that the body has
no `{{{x}}}` tokens and infer `slots: []` itself. `output:
{ kind: 'free-text' }` is the default for the chat use case.

This isn't blocking — it's six lines instead of three — but the
"hello world" of authoring a prompt is bigger than it should be, and
each required field is a small cognitive tax.

**Workaround used:** wrote it out.

**Severity:** P3 polish.

**Suggested fix:** on the fixture-seed path specifically (where the
consumer is in TS, not YAML), make `slots` and `schemaVersion` optional
with sensible defaults (`slots: []`, `schemaVersion: '1'`). The on-disk
YAML loader can keep its current strictness, since YAML descriptors
are persisted artifacts that benefit from explicitness. The
TS-authored fixture seed is short-lived in-code data; defaults are
appropriate there.

**Caveat (added on review):** `output` is load-bearing — not pure
ceremony. `PromptLibrary.resolveJsonOutput` and `resolveFreeTextOutput`
both runtime-verify `descriptor.output.kind` against the call path,
so silently defaulting `output: { kind: 'free-text' }` for omitted
fields would make `resolveFreeTextOutput` always-correct for
unannotated prompts and silently route a consumer who intended JSON
into the wrong dispatcher. The `output` defaulting proposal needs
more thought than `slots` / `schemaVersion`; flagging it as deserving
explicit design rather than a one-line shim.

A complementary option: ship a `PromptDescriptor.simple({ title, body, surface? })`
helper that returns a fully-shaped descriptor for the trivial case —
this keeps `output` explicit at the call site while still cutting the
ceremony.

### ✅ Resolved 2026-05-19 — `buildSimpleDescriptor` helper (B-3, PR #395)

`@fgv/ts-prompt-assist` now exports `buildSimpleDescriptor({ id, title, surface?, description? })`
which returns a fully-shaped `IPromptDescriptor` for the free-text
chat case: `schemaVersion: '1'`, `surface: 'chat'` (overridable),
`slots: []`, `output: { kind: 'free-text' }`. The complementary-option
path from the original suggestion — deliberately limited to free-text
output, keeping `output.converterId` explicit at the call site for
JSON-output prompts (per the review caveat above). On-disk YAML
loaders keep their existing strictness; this helper is a TS-authoring
convenience.

---

## F3. `IPromptStoreFixtureSeed` is the only public path to seed an in-memory store — there's no `PromptStoreFixture.builder()` for incremental construction

**Surface:** `PromptStoreFixture.build(seed)`.

**Friction:** authoring multiple prompts in TS means hand-rolling the
`records` array. For a sample app this is fine, but a consumer who
wants to register prompts dynamically (e.g. from a settings panel, from
a plugin loader, from a unit-test factory) has to accumulate seed
records in their own intermediate structure and then call `build`
once. There's no "build, then add, then add" path.

I didn't hit this in my integration (one prompt, one record). But the
moment a consumer wants two prompts authored in two different modules,
they'll need to either merge seeds at the top level or set up two
fixtures and pick the right one.

**Workaround used:** none — surfaced.

**Severity:** P3 polish (forward-looking).

**Suggested fix:** consider exposing a builder shape:

```ts
const builder = PromptStoreFixture.builder();
builder.add({ scope, id, descriptor, candidates }).orThrow();
builder.add({ ... }).orThrow();
const store = (await builder.build()).orThrow();
```

…that lets consumers compose authored prompts from multiple modules.
The existing one-shot `build(seed)` path can stay as a convenience
for the common case.

---

## F4. ~~`resolveChatSystemPrompt` had to peel `Promise → Result → .body`~~ **RETRACTED on review**

**Surface:** `PromptLibrary.resolve`.

**Original framing:** I noted that getting the body string out of
`resolve` required `await` + `.onSuccess(r => succeed(r.body))` —
three layers.

**Why retracted:** this is the same complaint round-1 retracted as F5,
and the same answer applies: `.onSuccess(r => succeed(r.body))` after
the `await` is two tokens of overhead, not friction. The
`IResolvedPrompt` shape carries the trace + descriptor + id alongside
the body for a reason; the consumer should be the one choosing whether
to discard those.

My initial draft of `resolveChatSystemPrompt` actually got tangled in
a "let me chain everything fluently" rabbit-hole that produced
unreadable code; the straightforward `await` + `.onSuccess` shape is
the cleanest path and reads well.

**Severity:** retracted (was going to be P3 polish).

---

## F5. Qualifier-value type discipline does not flow from the candidate set to the resolve request

**Surface:** `IPromptResolveRequest.qualifiers` vs `ConditionSetDecl` on
candidates.

**Friction:** I declared a consumer-side `ChatTone = 'neutral' | 'formal'`
union to drive my UI `Tone` select. The candidate's
`conditions: { tone: 'formal' }` uses the literal `'formal'` value;
the resolve request maps `'formal'` through. But none of the three
agree at compile time — the candidate's value is `string`, the
resolve request's value is `string`, and my `ChatTone` union is what
ties them together by convention. A typo (e.g. authoring a candidate
with `tone: 'formel'` while the UI sends `'formal'`) silently falls
through to the base candidate, identical to F1's failure mode.

This is a different concern from F1 — F1 is about axis NAMES, F5 is
about axis VALUES. F1's fix proposal (parameterise on `TQualifierNames`)
doesn't cover this; a deeper fix would parameterise on
`Record<TQualifierNames, TValueUnion>` (one value union per axis).

**Workaround used:** none — surfaced. In practice I held the discipline
by eyeball; a future consumer with several qualifier axes will
struggle.

**Severity:** P3 polish (forward-looking; the typed-axis-value design
space is bigger than the integration's needs).

**Suggested fix:** for axes backed by `LiteralQualifierType`, the
qualifier-type collector knows the literal set at construction time —
even though bare-string decls synthesize a `LiteralQualifierType`
without a `values` field, a decl-array form like
`qualifiers: [{ name: 'tone', values: ['neutral', 'formal'] as const }] as const`
could let TS infer `Record<'tone', 'neutral' | 'formal'>` and tighten
both the candidate `conditions` and the resolve `qualifiers` shapes.
This is materially more design work than F1's name-only proposal —
file as a v0.2-or-later consideration rather than a blocker.

---

## F6. `ChatTone` lives in the consumer; the library has no canonical "tone" enum it could re-export

**Surface:** consumer-side type design.

**Friction:** I created `export type ChatTone = 'neutral' | 'formal'`
in `promptLibrary.ts` as a tying-together type for the UI. This is the
right consumer responsibility, but it raises a small documentation
question: in a real consumer with several qualifier axes, where should
the enum-of-axis-values live? In the prompt-library module? Alongside
the consumer's UI types? In a shared types file?

This isn't really a library friction — it's a doc gap. The README's
"Wiring into a React app" section sketches the typed-library pattern
but doesn't show the natural follow-on of "and you'll also want a
consumer-side enum per qualifier axis to drive the UI."

**Workaround used:** put `ChatTone` next to the library wiring.

**Severity:** P3 polish (doc gap, not API gap).

**Suggested fix:** extend the React-wiring example in the README with
a "tone select" snippet that shows the consumer-side enum + the natural
binding to the qualifier axis. Five extra lines of code, head off the
"where does this go" question.

### ✅ Resolved 2026-05-19 — README React-wiring section extended (B-3, PR #395)

The README's "Wiring into a React app" section now includes the
`ChatTone = 'neutral' | 'formal'` consumer enum, a `<select>` bound
to it, and the natural `tone === 'neutral' ? {} : { tone }`
qualifier-context wire-through. A fourth list-item under the
section spells out the v0.1 convention that axis NAMES are
library-inferred while per-axis VALUE unions are a consumer concern,
with a forward-reference to F5. Doc gap closed.

---

## F7. ~~`IPromptStoreFixtureSeed.records: []` wrapper feels heavy for single-prompt apps~~ **RETRACTED on review**

**Surface:** `IPromptStoreFixtureSeed`.

**Original framing:** I noticed the seed has a single field, `records`,
which contains the array of authored prompts — and for an app with one
prompt the wrapper feels like ceremony.

**Why retracted:** wrong on review. The wrapper is the right shape:
it leaves room for non-record fields the seed format will grow into
(e.g. fixture-level qualifier-type overrides, fixture-level binding
defaults, fixture metadata). Collapsing it to a bare array now would
force a breaking change the moment any of those land. The one-line
overhead of `{ records: [...] }` is not friction; it's the seam where
the seed format extends in the future.

**Severity:** retracted (was going to be P3 polish).

---

## F8. The integration could not exercise the "resolved trace as observability surface" angle without inventing fake UI scope

**Surface:** `IResolvedPrompt.trace`.

**Friction:** every resolve produces a rich
`IPromptResolveTrace` — candidate matches, merged bindings, safeguard
findings, resource-binding inner traces. For a chat consumer in a
streaming flow, none of this is directly consumable: the consumer
sends the resolved body to the LLM and discards the trace. A
production consumer with debugging needs would want to surface trace
events into devtools or a logger, but the v0.1 surface doesn't make
this trivial.

This is the same point round-1's F7 made (no `Trace.toLoggable`
helper) — round-1 didn't hit it because the integration didn't log
the trace; mine didn't either. But the integration **wants** to log
the trace and can't, ergonomically. The trace's `Map<SlotName, ...>`
fields break `JSON.stringify` out of the box.

**Workaround used:** none — the trace is discarded in the integration.

**Severity:** P3 polish (re-flag of round-1 F7, still standing).

**Suggested fix:** as round-1 suggested — `Trace.toLoggable(trace)` or
`toJSON()` on the trace object. Cheap to land.

---

## Summary of new findings (not round-1 carry-overs)

| Id | Title | Severity |
|---|---|---|
| F1 | Candidate `conditions` keys not typed against `TQualifierNames` | P2 |
| F2 | Trivial-case descriptor authoring requires 5 mandatory fields | P3 |
| F3 | No `PromptStoreFixture.builder()` for incremental seed assembly | P3 |
| F4 | ~~`Promise → Result → .body` three-layer peel~~ **RETRACTED** | — |
| F5 | Qualifier-value typing doesn't flow either way | P3 |
| F6 | Doc gap: consumer-side qualifier-axis enum placement | P3 |
| F7 | ~~`{ records: [...] }` wrapper feels heavy~~ **RETRACTED** | — |
| F8 | Trace not directly loggable (re-flag of round-1 F7) | P3 |

**Top-3 highest-severity (for cluster-close adjudication):**

1. **F1** (P2) — candidate `conditions` axis names not typed; same
   silent-failure mode F3 absorbed for the resolve side, still
   present on the authoring side.
2. **F2** (P3) — five required descriptor fields for the trivial chat
   case; optional defaults on the fixture-seed path would absorb.
3. **F5** (P3) — qualifier values are stringly-typed on both sides;
   forward-looking, larger design problem; queue for v0.2.

Round-2 was materially smoother than round-1; the ergonomics absorption
in PRs #375 / #380 etc. landed precisely where round-1 said it would.
F1 is the one remaining high-leverage win still on the table.
