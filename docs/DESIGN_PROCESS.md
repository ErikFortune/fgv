# Design Process — fgv

Candidate pattern for design → triage → implement cycles. The
process bridges high-fidelity design prototypes (HTML/CSS/JS,
Figma, Claude Design output, etc.) to implementation contracts.

---

## Premise

Design tools produce high-fidelity prototypes that look essentially
final. Implementing agents work best when they have **clear
contracts** — what's binding, what's revisable, what already exists
upstream. The gap between "delightful prototype" and "implementable
contract" is where this process lives.

The recurring failure modes when that gap isn't bridged:

- **Implementers copy prototypes literally** — including idioms that
  don't fit the target codebase (browser-babel, inline styles,
  untyped JS).
- **Implementers ignore prototypes** — and the visual intent is lost
  in translation.
- **Implementers face a multi-thousand-LOC bundle with no priority
  signal** — and their first hour is spent re-discovering what
  already exists in shared libraries.
- **Pre-positioning creates apparent contracts** — implementers
  treat planted artifacts as immutable when they were meant as
  starters.
- **Emergent capabilities** show up during implementation instead
  of being captured in design docs before implementation starts.

## Workflow

```
A · Design   →   B · Drop   →   C · Triage   →   D · Implement
designer         commit         triage agent     implementing
produces a       the raw        produces the     stream consumes
prototype        bundle to      architectural    the triage
                 design path    doc updates,     outputs and
                 (no agent)     staging tree,    builds the
                                packaging        feature
                                recommendation
```

For the full workflow procedure see
`.ai/conventions/workflow/` and the orchestrator's `/triage-cycle`
skill.

Use `/triage-cycle` to draft the phase-C kickoff prompt.

## What gets captured at triage time

Four buckets, each with a different home:

1. **Visuals → component plan** — enumerative inventory: already-
   canonical / promote-to-shared-library / app-local / discard.
2. **Assets → package destinations** — assets sorted by *role*,
   not current content fidelity. Placeholder and final assets share
   the same package because the *interface* (an SVG at this aspect
   ratio) is what consumers depend on.
3. **Emergent capabilities → architectural docs** — features the
   design implies that aren't currently documented. Captured during
   triage as commitments, not proposals. The implementing stream
   finds them already documented, with rationale and alternatives
   considered.
4. **Followups → batch register / TECH_DEBT / FUTURE** — items
   that don't fit the other buckets, routed via
   `.ai/conventions/workflow/lessons-codification-triage.md`.

## The staging area

Proposed artifacts live in a parallel directory tree mirroring their
proposed final paths (`design/staging/<feature>/`). Production code
is never touched during triage. The implementer chooses what to
promote, what to revise-and-promote, and what to reject.

### Why staging beats annotations

**Structural constraint vs. procedural convention.** A separate
directory tree is a structural fact — staged artifacts physically
aren't in production paths, so the implementer has to *decide-to-
move* rather than *decide-to-keep*. Default behavior is "do nothing
→ nothing happens to the codebase," which is the right default for
proposals.

### What goes in staging

- Asset files (copies of new assets ready to move to canonical homes)
- Content data (themes, presets, configuration arrays)
- Type definitions the implementer will consume — when genuinely
  settled at triage time
- Doc fragments (READMEs for new directories, scaffolding for
  component-library docs)

### What does NOT go in staging

- Components requiring tests / build-tool-validation / lint passes
- Anything depending on in-flight wire shapes not yet shipped
- Style decisions the implementer should own
- Architectural docs — those land in `docs/` directly during triage

### Staged file headers

Every staged code/data file carries a `STAGED:` header naming what's
binding (interface name, file path, exported symbol) vs. revisable
(default values, content arrays, prose).

### Boneyard

Items the implementer rejects move to
`design/boneyard/<feature>/<staged-path-mirrored>` with a one-line
WHY annotation. Preserved, not deleted — signal for the next triager
about what didn't fly and why.

### End-of-stream discipline

When the implementing stream closes, every staged item has one fate:

| Fate | What happened | Where the file lives |
|------|---------------|----------------------|
| Promoted | Implementer accepted (and possibly revised) | Production tree |
| Boneyarded | Implementer rejected with documented reason | Boneyard tree |
| Process bug | Anything still in staging | Needs cleanup before stream close |

## Variant: who populates staging?

- **Variant A** — the triage agent populates staging. Standard for
  substantial bundles. Forces architectural questions to surface
  early.
- **Variant B** — staging starts empty; the implementing agent
  extracts as their first deliverable. Lighter; useful when the
  bundle is small or the implementing agent has the domain expertise
  to do the extraction without losing triage value.

The boneyard mechanism works identically either way.

## Phase-C completion gate

Phase C is **not** complete when the triage agent stops. It's
complete when the user signs off on the three outputs:

1. Architectural-doc updates read clean against the rest of the
   design system.
2. The packaging recommendation is enumerative — every staged item
   has a fate-recommendation; every "already canonical" entry names
   the canonical location; every "discard" entry has a one-line WHY.
3. The staging tree mirrors target paths; every staged code/data
   file carries a `STAGED:` header with binding-vs-revisable
   explicit.
4. `docs/WORKSTREAMS.md` § implementing stream has a Design handoff
   section pointing at the cycle outputs.

If sign-off surfaces a gap, the triage agent closes it and re-
presents. The gate is a forcing function, not a blocker.
