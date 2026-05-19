# Phase #384 result: sample-app rebase + typed-flow demo (B-3 follow-up)

**Date:** 2026-05-19
**Branch:** `claude/round-2-pressure-test-sample-integration`
**PR:** #384 (rebased onto post-B-3 integration HEAD)
**Status:** Complete (force-push pending)

---

## Mission

After B-3 (PR #395) shipped the typed-converter consumer port, the
held PR #384 — the round-2 sample-app integration that surfaced
findings F1 / F2 / F6 — needed to rebase onto the post-#395
integration HEAD and demonstrate the typed flow B-3 enabled. F1 / F2 /
F6 closure notes are added to the round-2 findings doc.

---

## What the sample wires

`samples/ai-image-gen-sample/src/promptLibrary.ts` already wired
`PromptLibrary` + `PromptStoreFixture` for a single `tone`-conditional
chat-system-prompt before B-3. This phase adds the B-3 surface on top:

```ts
const qualifierNames = ['tone'] as const;
export type QualifierName = (typeof qualifierNames)[number];

const qualifierNameConverter: Converter<QualifierName> =
  Converters.enumeratedValue<QualifierName>([...qualifierNames]);

const seed: IPromptStoreFixtureSeed<QualifierName> = {
  records: [...],
  qualifierNameConverter
};

export type ChatPromptLibrary = PromptLibrary<IPromptResponseBase, QualifierName>;

export async function createPromptLibrary(): Promise<Result<ChatPromptLibrary>> {
  const storeResult = await PromptStoreFixture.build(seed);
  // ...
  return PromptLibrary.create({
    store: storeResult.value,
    qualifiers: qualifierNames
  });
}
```

The single `qualifierNames` const threads through three places — the
`PromptLibrary.create({ qualifiers })` call (F3 axis-name narrowing
on the resolve request), the `IPromptStoreFixtureSeed<QualifierName>`
seed annotation (B-3 compile-time narrowing on candidate `conditions`
keys), and the `qualifierNameConverter` field on the seed (B-3
convert-time teeth in the YAML loader).

**Verification:** swapping `conditions: { tone: 'formal' }` to
`conditions: { tonr: 'formal' }` and running `tsc --noEmit` from the
sample's directory produces exactly the expected error at line 70:

```
src/promptLibrary.ts(70,25): error TS2353: Object literal may only
specify known properties, and 'tonr' does not exist in type
'ConditionSetDecl<"tone">'.
```

The narrow flows from `IPromptStoreFixtureSeed<QualifierName>` →
`IPromptCandidateRecord<QualifierName>` (B-3 parameterization) →
`ResourceJson.Json.ConditionSetDecl<QualifierName>` (B-1/B-2
parameterization) — the same chain `phase-b3-result.md`'s
consumer-pattern shape predicted. No API change required;
demonstrated cleanly with the existing surface.

---

## Typed-flow demo shape (as it actually shipped)

The demo is **minimal by design** — the sample's role is to show
"this is how a consumer wires the typed flow," not to stress-test
the surface. The pattern is the same one the README's React-wiring
section describes, plus the new `qualifierNameConverter` field on the
seed.

Three threading points in one file (`promptLibrary.ts`):

1. **Resolve-request narrowing (F3, pre-existing):** `qualifiers: qualifierNames`
   on `PromptLibrary.create` infers `TQualifierNames = 'tone'`,
   tightening `resolve({ qualifiers })`.
2. **Seed-author narrowing (B-3 type-level):** `IPromptStoreFixtureSeed<QualifierName>`
   on the seed annotation rejects typo'd axis names at compile time
   on the candidate `conditions` keys.
3. **YAML-loader narrowing (B-3 convert-time):** `qualifierNameConverter`
   on the seed gets passed to `PromptStoreFixture.build` → through to
   `FileTreePromptStore.create` → into the per-instance YAML loader.
   A runtime-cast escape-hatch (`as unknown as IPromptCandidateRecord<QualifierName>`)
   would still fail at `store.get()` time.

In `promptLibrary.ts` lines 30–43, the inline comment block spells
this out for the next consumer reading the sample. The candidate
itself uses the existing record-sugar form:

```ts
{
  conditions: { tone: 'formal' },
  isPartial: true,
  body: '...'
}
```

— `tone` is narrowed against `QualifierName` from B-3, so a typo is
caught here. The library-level cast-pressure regression test in
`b3TypedConditions.test.ts` already covers the runtime-escape-hatch
behavior end-to-end; the sample doesn't need to duplicate that.

---

## Rebase surprises

**None.** The orchestrator's clean-test was correct — rebase produced
zero conflicts. The two commits on the branch (`b83ce18e` integrate
sample + `343d625a` review-comment) replayed cleanly atop
`c6d19f35` (B-3's merge commit). `pnpm-lock.yaml` was the only file
that overlapped between #384 and B-3's surface; the lock-file
add-only nature of B-3 meant no merge contention.

The TypeScript files #384 touches (`promptLibrary.ts`, `ChatPanel.tsx`,
`App.tsx`) didn't overlap with B-3's library changes at all, so the
post-rebase build was clean on first try (`rush build --to @fgv/ai-image-gen-sample`
green).

---

## Copilot review absorption

Two rounds of Copilot review threads on PR #384, all addressed:

**Round 1 (3 threads — type-only imports + cast hygiene):**

1. `promptLibrary.ts:13` — type-only specifiers (`IPromptResponseBase`,
   `IPromptStoreFixtureSeed`, `Converter`, `Result`) were being
   brought in as runtime values. Under `babel-loader` transpile-only
   that can leak no-op named imports into the emitted JS (and break
   under stricter bundlers). Split into `import type { ... }` blocks.
2. `App.tsx:11` — same issue with `ChatPromptLibrary` and `ChatTone`.
   Split into a separate `import type` line.
3. `ChatPanel.tsx:186` — `e.target.value as ChatTone` was an
   unchecked cast. Refactored narrow-by-construction: `ChatTone` now
   derives from `const chatTones = ['neutral', 'formal'] as const`
   in `promptLibrary.ts`; the same array drives the rendered
   `<option>` set AND a `chatToneConverter = Converters.enumeratedValue<ChatTone>(...)`
   so the handler narrows via
   `chatToneConverter.convert(e.target.value).orDefault(tone)` — no
   unchecked casts, and the option set and Converter-recognized set
   stay in lockstep by construction.

**Round 2 (2 threads — sample-app logic bugs):**

4. `App.tsx:218` — `handleSendChat` was creating the `AbortController`
   and assigning it to `abortControllerRef.current` BEFORE the
   early-return guards (library-not-ready, system-prompt resolve
   failure). On those returns, the ref held a controller for a
   request that never started, so `onAbort` would target nothing and
   the next send would orphan the stale controller. Moved controller
   creation to AFTER the guards — once committed to the network call.
5. `ChatPanel.tsx:209` — `canSubmit` now folds in `promptLibrary !== null`
   but the disabled-state message was hardcoded to "Enter an API key
   to enable chat." Added optional `disabledReason?: string` to
   `IChatPanelProps` (defaults to today's message when omitted) and
   threaded the right cause from `App.tsx` with precedence: missing
   key first, then load failure, then still-initializing. Matches the
   user's mental model — API key is the first thing they fill in.

A single nit-class comment remained after round 2 (acknowledged as
nit by the orchestrator); not absorbing in this PR.

---

## Lint-gate + TS-check note

`samples/ai-image-gen-sample/package.json` does not define a `lint`
script — the package has `build` (webpack production), `dev`, `clean`,
`test`. The `rushx lint` gate from the brief is vacuous for this
package; no lint failures possible because no lint runs.

**Important subtlety on the "TS builds with the narrow" gate:** the
webpack pipeline uses `babel-loader` (not `ts-loader`), which strips
TypeScript types without checking them. So `rushx build` for this
sample is NOT a TypeScript type-check — it's a transpile+bundle. To
actually prove the narrow holds, you have to run `tsc --noEmit -p
tsconfig.json` from the sample directory.

I ran that explicitly and confirmed:

- Spelled-correct form (`conditions: { tone: 'formal' }`) →
  `tsc --noEmit` clean (modulo pre-existing unrelated noise from
  ts-utils unused-parameter warnings and a separate PromptPanel.tsx
  `imagen` typing gap — both predate this phase).
- Typo'd form (`conditions: { tonr: 'formal' }`) →
  `src/promptLibrary.ts(70,25): error TS2353: ... 'tonr' does not
  exist in type 'ConditionSetDecl<"tone">'`.

The narrow works exactly as the B-3 result-doc predicted; the webpack
production build's "clean" status is necessary but not sufficient
proof for this gate. Flagging as a minor cluster-close-prep
consideration: if explicit type-checking on samples matters, the
sample's `build` script could grow a `tsc --noEmit` preflight step.
Not blocking here.

---

## F1 / F2 / F6 closure notes added

`.ai/tasks/active/ts-prompt-assist/pressure-test-findings-round-2.md`:

- **F1** ("candidate conditions keys not typed against TQualifierNames")
  — resolved via ts-res-layer ownership in B-1 + B-2 plus consumer
  port in B-3, and demonstrated in the sample's `promptLibrary.ts`.
- **F2** ("trivial chat descriptor over-ceremony") — resolved via
  `buildSimpleDescriptor` helper shipped in B-3. Note that the sample
  itself doesn't yet use `buildSimpleDescriptor` — `promptLibrary.ts`
  authors the full descriptor inline. This is deliberate: the inline
  authoring makes the descriptor's shape visible to the next consumer
  reading the sample, which is more pedagogically useful than the
  helper-shortcut. A consumer who prefers the helper can swap to it
  in their own code; the helper is exported.
- **F6** ("ChatTone consumer-side enum, doc gap") — resolved via the
  README React-wiring section update in B-3 (PR #395).

Other findings (F3 / F4 / F5 / F8 / F10–F14) stay as they were.
F7 was retracted on review.

---

## Open questions for cluster close

None new from this phase. The relevant open questions surfaced by
B-3 (whether to parameterize `IPromptStore` itself, `tools/ts-res-cli`
adoption, F5 typed-qualifier-VALUES scoping) remain captured in
`phase-b3-result.md` and `result.md` for the stream.

Two minor observations worth flagging at cluster close:

1. The sample's inline descriptor authoring vs the
   `buildSimpleDescriptor` helper — whether the sample should adopt
   the helper (concision) or keep the inline form (pedagogy) is a
   stylistic call. I left it inline. Trivial either way.
2. The `babel-loader` vs `ts-loader` situation in the sample's
   webpack pipeline means `rushx build` doesn't actually type-check
   the sample; an explicit `tsc --noEmit` preflight on the sample
   `build` script would close this gap. Not blocking but worth a
   chore-batch slot.

---

## Acceptance gates

| Gate | Status |
|---|---|
| `rush build --to @fgv/ai-image-gen-sample` clean | ✅ — 28.4s |
| Full repo build clean | ✅ — re-ran post-rebase via the `--to` path (sample's deps already built clean on the integration head; rebase didn't perturb them) |
| `rushx lint` clean in sample package | ✅ (vacuous — no lint script defined; see note above) |
| Sample TS compiles with narrow `QualifierName` union end-to-end | ✅ — verified via direct `tsc --noEmit -p tsconfig.json`; a typo'd `tonr` on the seed candidate fails as `src/promptLibrary.ts(67,25): TS2353 ... 'tonr' does not exist in type 'ConditionSetDecl<"tone">'` (line shifted after round-1 review-absorption refactor). Webpack production build also clean (uses babel-loader, transpile-only). See "Lint-gate + TS-check note" above for why both checks matter. |
| Copilot review rounds absorbed | ✅ — 5 threads across 2 rounds; all addressed with build + `tsc --noEmit` clean after each round. Final state has one nit-class comment outstanding (acknowledged not absorbing per the orchestrator). |
| F1 / F2 / F6 closure notes added to findings doc | ✅ |
| `phase-384-result.md` written | ✅ — this file |
| `state.md` / `docs/WORKSTREAMS.md` left for cluster-close prep | ✅ — not touched in this phase |

---

## Files changed (this rebase + B-3 follow-up + review-rounds)

| File | Change |
|---|---|
| `samples/ai-image-gen-sample/src/promptLibrary.ts` | B-3 typed-flow: added `qualifierNames` const, `QualifierName` type, `qualifierNameConverter`; typed seed as `IPromptStoreFixtureSeed<QualifierName>`; threaded converter through the seed; used `qualifierNames` directly in `PromptLibrary.create({ qualifiers })`. Round-1 review absorption: split type-only imports into `import type` blocks; added `chatTones` const + `chatToneConverter` to narrow-by-construction. |
| `samples/ai-image-gen-sample/src/App.tsx` | Round-1 review: split `ChatPromptLibrary` / `ChatTone` into `import type`. Round-2 review: moved `AbortController` creation past the early-return guards; wired `disabledReason` to `ChatPanel` with precedence. |
| `samples/ai-image-gen-sample/src/components/ChatPanel.tsx` | Round-1 review: handler uses `chatToneConverter` instead of unchecked cast; `<option>`s rendered from `chatTones` array. Round-2 review: added optional `disabledReason?: string` prop. |
| `.ai/tasks/active/ts-prompt-assist/pressure-test-findings-round-2.md` | Closure notes for F1, F2, F6 |
| `.ai/tasks/active/ts-prompt-assist/phase-384-result.md` | New (this file) |

The two pre-existing #384 commits stayed as-is during rebase; this
phase added new content on top via three fresh commits (B-3 typed-flow,
round-1 review absorption, round-2 review absorption).
