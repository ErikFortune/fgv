# Stream brief — `library-capabilities-split`

**Status: PHASE 0 + PHASE 1 DONE (2026-08-24). Phases 2 and 3 scoped here, shipping separately.**

**Result: 171,693 → 15,225 chars, a 91% cut**, with all five gates passing and content preservation
verified at 98.7% of distinctive sentences found verbatim (the misses are the deliberately-rewritten
preamble plus two sentence-splitter artifacts whose reflexes were confirmed individually). One real
casualty was caught by that check and fixed: compressing the cross-runtime table had dropped its
notes column, so the full table is preserved whole in `.ai/conventions/`.

## The problem, measured

`.ai/instructions/LIBRARY_CAPABILITIES.md` is **172,821 chars ≈ 43k tokens**, and it is
`@`-included from `CLAUDE.md` — so it loads into **every session, unconditionally**, before anyone
knows whether the task touches a library at all.

| `@`-included file | tokens | share of instruction budget |
|---|---|---|
| **LIBRARY_CAPABILITIES.md** | **~42,900** | **67%** |
| CODING_STANDARDS.md | ~11,500 | 18% |
| the other four | ~9,600 | 15% |
| | **~64,000** | every session |

Where the mass sits: **Decision shortcuts 30%**, `ts-extras` 17%, `ts-agent-memory` 16% — top five
sections are **72%** of the file. There are **82 shortcuts averaging 615 chars**; five exceed 1,500
and the longest (`HorizontalComposer`) is **3,275**. A 3,275-character shortcut is not a shortcut.

## The diagnosis

The file does **two jobs that want opposite shapes**:

1. **Routing** — *"does a primitive already exist for X?"* Wants tiny, always resident, high recall.
   This is what the file's own preamble promises, and it is what the **external consumers**
   (PersonAIlity, chocolate-lab) use it for: decide whether to request something or roll their own.
2. **Reference** — *"what exactly does `adaptOptionalToNullable` do with a partly-hoistable schema?"*
   Wants depth, and wants to be read only when you are already in that surface.

Job 2's mass has eaten job 1's usability. **And it is structural, not accidental:** the repo's own
"docs ship with the code" rule means every stream adds to this file, forever. Three streams did so in
the week this was written. A one-time trim would be back here within months, so the fix must change
the shape, not just the size.

## Target shape

**`LIBRARY_CAPABILITIES.md` stays at its path and stays `@`-included, and becomes a router.** Nothing
anyone has linked breaks.

| part | content |
|---|---|
| package index | every library: name → one-line purpose → link to its `CAPABILITIES.md` |
| **reflex list** | all **82** shortcuts, compressed to one line each ("password hashing → `KeyStore`; never roll PBKDF2") |
| recent additions | newest-first, bounded (see phase 2) |
| navigation | how to go deeper, and the authority rule below |

**Detail moves to `libraries/<pkg>/CAPABILITIES.md`** — in the package, not in `.ai/`. Today's
per-package sections and the essay-length shortcuts land there, **topically organised**.

## Decisions already made — do not relitigate

- **All 82 shortcuts stay in the router**, compressed — not only the 59 reflex ones. The extra ~2k
  chars preserves "start here" navigation for non-reflex questions.
- **`CAPABILITIES.md` lives in the package**, not a central directory. Makes "docs ship with the
  code" nearly automatic — the stream editing the package edits the file in the same folder.
- **All 26 libraries get one** (see the carve-out below), not just those with external consumers.
- **Chronological is a second index, never the primary order.** Package files stay topical; someone
  looking for "crypto" must not have to scan by date.

## The reflexes are the safety-critical part

~59 reflex phrases / 41 bolded sentences / ~6,400 chars — `embeddingRefOf` and the `null`-sentinel
trap, "don't hand-roll a timeout + size cap + redirect loop", the strict-text custody rule, "never
call `globalThis.crypto.randomUUID()` directly".

**These work *because* they are resident.** They fire for a reader who did not know to look. Move
them behind a load-on-demand boundary and they only reach someone who already knew — who did not
need them. **Every one must survive into the router**, and that is a gate, not an intention.

## Gates — write these FIRST, then split to satisfy them

A convention saying "keep entries short" is precisely the gate shape this repo has already watched
fail: `TECH_DEBT.md`'s disposition pass found **four triggers phrased as "next time someone touches
X" that fired without anyone acting**, and concluded the fix is to *replace recall with a mechanical
gate*. So:

1. **Router byte cap — 16,000 chars.** Currently 172,821. Fails CI above the cap.
2. **Every library has `CAPABILITIES.md`**, except the carve-out below.
3. **Every `CAPABILITIES.md` is linked from the router; no orphans, no dead links.**
4. **All 59 reflex phrases present in the router** after the split — grep-asserted, since this is the
   class of loss that would be invisible on review.
5. **No content lost.** The split is a move, not a rewrite: assert total chars across router +
   package files is within a small delta of 172,821 minus the deduplication the split makes possible.

## Two gaps the survey already surfaced

**`@fgv/ts-random` has no entry at all** — a production library, on `ACTIVE_DEVELOPMENT.md`'s
stability list, invisible to the doc a consumer reads to decide whether to roll their own. Exactly
the failure this file exists to prevent. It needs a `CAPABILITIES.md` written from scratch, and the
router entry is new content rather than moved.

**`ts-sudoku-lib` / `ts-sudoku-ui` are the carve-out.** `ACTIVE_DEVELOPMENT.md` says they are slated
to move to their own monorepo and that work should not be queued against them. Gate 2 must exempt
them explicitly rather than forcing work on packages that are leaving.

Also: **7 libraries have no `README.md`** (`ts-extras-argon2`, `ts-extras-webauthn`,
`ts-http-storage`, `ts-random`, `ts-sudoku-ui`, `ts-web-extras-argon2`, `ts-web-extras-webauthn`).
Do **not** fix that here — out of scope, and `CAPABILITIES.md` is not a README substitute.

## Authority rule, to prevent the obvious drift

18 of 26 libraries have a `README.md`. Two docs over one surface will diverge. State it in the router
and in each `CAPABILITIES.md`:

> **`CAPABILITIES.md` is authoritative for "what exists and what not to hand-roll".** `README.md`
> stays getting-started and links to it. The router links to `CAPABILITIES.md`, never to a README.

## Phase 2 — the recent-additions feed, generated not written

**The data already exists.** 53 of 78 completed streams carry `summary.sourceLine` in their
`meta.yaml`, beside `packages` and `opened`:

```yaml
opened: 2026-08-22
packages: ['@fgv/ts-agent-memory-sqlite-vec']
sourceLine: "**Shipped:** the rebuild-path table clear runs through `exec`, so the one
             statement `release()` could never reach no longer exists."
```

That is a dated, per-package, one-line changelog waiting to be assembled. **Generate the feed from
it** rather than hand-maintaining a second copy — drift-proof, and it costs no discipline at stream
close, which is where hand-maintained lists die.

- Router: newest-first, **bounded** (~15 entries / 90 days) so it cannot eat the byte cap.
- Package file: full history, newest-first, cheap there.
- Backfill the 25 streams missing `sourceLine` only if it is cheap; otherwise start the feed from
  what exists and say so.

## Phase 0 — DONE (2026-08-24), landed ahead of the split

Three items pulled forward at the owner's request, because they are independently correct and
unblock the rest.

**`@fgv/ts-random` now has a `CAPABILITIES.md`.** Written against source and **verified by running
every claim** — which was not ceremony: four assertions were wrong on the first draft.
`nextInRange` is *inclusive* of both bounds and tolerates `min > max`; `nextInt` with a negative
extent draws `(extent, 0]`; `nextString`'s alphabet is optional with an alphanumeric default; and
`candidates` on the pick methods is an array of **pools**, not of items, so `pickSequential` walks
the pools cyclically drawing one from each. The documented example returned an **empty string** until
it was run — `Words` exports are **capitalized** (`Words.Adjectives`), and `jobs` is the lone
lowercase sibling. A capabilities doc that misdescribes the surface is worse than none, so *run the
examples* is a rule for the rest of the split, not a one-off.

**Publishing audit — the answer is "mostly fine, one real leak".**

| posture | count | packages |
|---|---|---|
| allowlist (`files`) | 12 | the newer boundary packages, one uniform pattern |
| denylist (`.npmignore`) | 18 | the core: `ts-utils`, `ts-extras`, `ts-json-base`, `ts-res`, `ts-bcp47` … |
| **neither** | **1** | **`@fgv/ks`** |

Checked with `npm pack --dry-run` across the core no-allowlist packages: **no `src/`, no tests** in
any of them — the `.npmignore` files are doing their job. Two strays ship repo-wide and are
harmless but pointless: `eslint.config.js` and `tsconfig.tsbuildinfo` (a build cache).

**`@fgv/ks` was the real one** — neither allowlist nor `.npmignore`, so it shipped its entire
`src/`. Given the canonical allowlist it goes **76 files / 338 KiB → 36 files / 134 KiB**, with
`bin/ks.js` and `lib/` intact.

**`CAPABILITIES.md` added to all 12 existing allowlists**, ready for the files to land.

**Left deliberately undone:** converting the 18 denylist packages to allowlists. It is the better
posture — a denylist ships a new file type by default unless someone remembers to ignore it, whereas
an allowlist fails safe — but it changes what 18 published packages contain, and that deserves its
own verification pass rather than riding a docs stream. Filed as a follow-up, not done here.

## Phase 3 — publish `CAPABILITIES.md` in the tarball (all 26)

**The win is version accuracy, and it is bigger than convenience.** Today the single release-branch
file describes `HEAD`, so a consumer on `5.1.0-54` reads about capabilities their install does not
have. That is not hypothetical — PersonAIlity's arm64 repro was written against `5.1.0-53` describing
a statement that had already been removed. Shipping the doc *in* the tarball makes doc and code move
together by construction.

**Only 11 of 26 libraries have a `files` allowlist**, so publishing is not uniform: 15 would pick the
file up automatically and 11 would silently omit it. Update the allowlists **and** gate it —
`common/scripts/verify-tarball-exports.mjs` already runs in CI over the real packed tarball and is
the natural place to assert `CAPABILITIES.md` is present.

## Sequencing

| phase | content | why separate |
|---|---|---|
| **1** | gates + router + the split | must land **whole** — a half-split file is worse than either end state |
| **2** | generated recent-additions feed | a generator is its own review surface |
| **3** | allowlists + tarball assertion | independent; can ride a later publish |

Phase 1 is reviewable as one question: *did the content survive, and is the router honest?* Bundling
a generator and 26 `package.json` edits into it would bury that.

## Acceptance criteria

- [ ] All five gates above implemented and passing, **written before the split**
- [ ] Router ≤ 16,000 chars, `@`-included, at the unchanged path
- [ ] Every non-carve-out library has `CAPABILITIES.md`, linked, topically organised
- [ ] `@fgv/ts-random` documented for the first time
- [ ] Authority rule stated in the router and each package file
- [ ] `rushx build` / `lint` / `test` pass in any package whose `package.json` changed (phase 3)
- [ ] Change files for any touched package; `rush change --verify`
- [ ] `docs/WORKSTREAMS.md` entry written **anticipating merge** (`✅ shipped … via #N`), per
      `.ai/conventions/workflow/artifact-protocol.md` § "A PR anticipates its own merge"
- [ ] Consumer note drafted for PersonAIlity + chocolate-lab (see below)

## Consumer coordination

The router **is** the consumer artifact — it answers "have you got this, or do I ask?" in one read,
which is their entire use case, and it gets ~5× cheaper for them too. The change to communicate is
one sentence: *read the router; follow the link when you need depth.*

A capabilities **skill** is deliberately **not** in scope. It is a second thing to keep in sync, and
if the router does its job the navigation is a link. Revisit only if the consumers report the
two-step as friction.

## Out of scope

- Rewriting capability content — this is a **move**, and gate 5 enforces it
- Adding READMEs to the 7 libraries lacking one
- The sudoku packages
- A consumer-facing skill (above)
- Touching the other five `@`-included instruction files
