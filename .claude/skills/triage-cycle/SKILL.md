---
name: triage-cycle
description: Use when about to draft a triage-agent kickoff prompt for the design → triage → implement cycle. Pass a feature id plus the implementing stream id and this skill walks you through verifying phase B is complete, confirming the streams-ledger handoff section, drafting the kickoff with the three-inputs / three-outputs contract, and staking out the phase-C completion gate. Required step before invoking the triage agent on a substantial design bundle. Mirrors the workstream-brief skill's role for streams.
---

# Triage Cycle

This skill turns the four-phase design → triage → implement cycle
into a paste-ready kickoff prompt for the triage agent (phase C).
Use before any triage-agent invocation that follows phase B (bundle
drop) and precedes phase D (implementing stream).

The project's design-process doc (`docs/DESIGN_PROCESS.md`) is the
procedural reference for the triage agent itself. This skill is the
procedural reference for the **orchestrator** drafting the kickoff
prompt.

## Inputs

- **Feature id** (required): kebab-case identifier matching the
  bundle path. The bundle lives at `design/pages/<feature>/`, the
  staging tree will land at `design/staging/<feature>/`, the boneyard
  at `design/boneyard/<feature>/`, the recommendation at
  `design/pages/<feature>/PACKAGING.md`.
- **Implementing stream id** (required): the stream that will
  consume the triage outputs. Must have an entry in `docs/WORKSTREAMS.md`.
- **Optional flag** `--write`: if set, persist the kickoff prompt
  in `.ai/tasks/active/triage-<feature>/brief.md`.

## Procedure

### 1. Verify phase B is complete

The bundle must already be committed under the drop path. Confirm:

- Drop path exists and contains the raw export.
- The bundle's own README is intact — typically a "READ THIS FIRST"
  from the design tool.
- No agent-produced artifacts in the bundle directory yet (no
  `PACKAGING.md`, no agent-written prose). If those exist already,
  phase C may have been started informally — check with the user
  before drafting a fresh kickoff.

If the bundle isn't committed cleanly, **stop**. Phase B is the
user's responsibility; the triage agent shouldn't repair it.

### 2. Confirm the streams-ledger handoff section

Open `docs/WORKSTREAMS.md` and find the implementing stream's entry.
The triage agent's outputs are useless if the implementing stream's
brief doesn't point at them.

The stream entry should have (or will get during phase C) a
**Design handoff** subsection naming:

- `docs/DESIGN_PROCESS.md`
- The packaging recommendation (`design/pages/<feature>/PACKAGING.md`)
- The staging tree (`design/staging/<feature>/`)
- The architectural design docs the cycle updated

If the section doesn't exist, flag it to the user. The triage agent
can land the section as part of phase C, but the orchestrator should
know going in whether they're commissioning the stream-brief update
or expecting it preexisting.

### 3. Identify the architectural-doc surface

Skim the bundle's README and a few of its source files. Make a
quick inventory of features the bundle implies that may not yet be
in the architectural surface docs:

- New entity / surface concepts
- New configuration concepts
- New auth / trust concepts
- New interactions with existing surfaces

You don't need to resolve these — the triage agent will. The point
of skimming is to size the triage scope and to flag anything the
implementing stream depends on that isn't documented anywhere yet.

### 4. Draft the kickoff prompt

Use the template below. Be specific — the triage agent is a fresh
session, has no context, and works from this prompt + the
design-process doc.

```markdown
You are the triage agent for the `<feature>` design cycle. The
implementing stream is `<stream-id>`. Your three inputs are:

1. `docs/DESIGN_PROCESS.md` — read it in full. Especially
   "What gets captured at triage time" and "The staging area." This
   cycle uses **variant A** (you populate staging) [or variant B
   if applicable].
2. The raw design bundle at `design/pages/<feature>/` — read it in
   full; follow imports.
3. `docs/WORKSTREAMS.md` § `<stream-id>` — the implementing stream's
   brief. Read it in full to understand what the stream is
   committing to deliver.

Then produce, in this order:

1. **Architectural-doc updates** for emergent capabilities — anything
   the design implies that isn't currently in the architectural
   surface docs. Write the doc updates with rationale, alternatives
   considered, and parking-lot references where appropriate. These
   land as commitments, not proposals. Likely candidates surfaced at
   orchestrator pre-skim: <list 2–4 specific concepts you noticed
   during step 3>.

2. **Staging tree** at `design/staging/<feature>/` — mirror the
   target paths. Every staged file gets a `STAGED:` header naming
   what's binding (interface name, file path, exported symbol) vs.
   revisable (default values, content, prose). What goes in staging
   vs. what does not is defined in `docs/DESIGN_PROCESS.md` § The
   staging area.

3. **Recommendation doc** at `design/pages/<feature>/PACKAGING.md` —
   enumerative, not pattern-matching. Sections: Already canonical
   (don't port); Staged (walk-and-decide); Not staged (implementer's
   first deliverable); Discarded (don't port); Architectural docs
   landed during triage; End-of-stream checklist; What this triage
   left for the implementer to decide.

Also surface follow-ups via the four-bucket sort defined in
`docs/DESIGN_PROCESS.md`: chore-shaped → `docs/CHORES.md`; tech-
debt-shaped → `docs/TECH_DEBT.md`; future-shaped → `docs/FUTURE.md`;
genuinely-implementer-decision → packaging doc § What this triage
left for the implementer to decide.

Update `docs/WORKSTREAMS.md` § `<stream-id>` with a **Design handoff**
section pointing at this cycle's outputs <or note "section already
exists, verify it points at the actual outputs you produced" if it
preexisted>.

**Do not** touch production code (`apps/` or `libraries/` source).
**Do not** write tests, build-tool-validated assets, lint-passable
code, or anything that requires the project's validation tooling
to run — that's the implementing stream's work.

Stop when the four outputs above (architectural docs, staging tree,
packaging recommendation, handoff section) are complete and
committed. The orchestrator presents the outputs to the user for
sign-off (the phase-C completion gate); phase D launches off that
gate.

## Artifact protocol

Maintain `.ai/tasks/active/triage-<feature>/` throughout the run:

- `brief.md` — this kickoff prompt, persisted.
- `state.md` — live checkpoint at every meaningful boundary.
- `result.md` — exit artifact (per-output summary, decisions
  surfaced for the user's sign-off, follow-ups routed per the
  four-bucket sort).

**Pre-merge migration is the rule.** Before the cycle's commits
merge, migrate the active-tasks directory to the completed-tasks
tree with a polished `README.md`. See
`.ai/conventions/workflow/artifact-protocol.md`.
```

### 5. Stake out the phase-C completion gate

In your message to the user delivering the kickoff prompt,
explicitly note that **you'll present the four outputs to the user
for sign-off** when the triage agent returns, before phase D
launches. The sign-off gate is the load-bearing discipline of the
cycle.

Sign-off targets:

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

If sign-off surfaces a gap, the same triage agent (if available)
closes it and re-presents. The gate is a forcing function, not a
blocker.

### 6. (Optional) Persist the kickoff

If `--write` was passed, create `.ai/tasks/active/triage-<feature>/`
and save the kickoff as `brief.md`. Also stub an empty `state.md`.

### 7. Hand off

Output the kickoff prompt to the user paste-ready. The orchestrator's
role through phase C is done at this point; the next orchestrator
action is the sign-off review when the triage agent returns.

## Quality bar for the kickoff

A good kickoff is one where the triage agent can:

- Start work within 30 seconds of reading.
- Know exactly which three inputs to read in what order.
- Know exactly what four outputs to produce and where they land.
- Know what's out of scope (production code, tests, build-tooling-
  passing artifacts).
- Know that phase D launches off a gate the orchestrator owns, not
  the triage agent.

## Anti-patterns

- **Don't draft a kickoff before phase B is clean.** A bundle still
  being curated isn't ready for triage.
- **Don't skip the architectural-doc surface skim** in step 3. The
  triage agent will find the emergent capabilities anyway, but
  flagging them in the kickoff seeds the work.
- **Don't promise the user a phase-D launch alongside the kickoff.**
  The completion gate is real — its whole purpose is that the user
  might surface a change before phase D.
- **Don't let the triage agent touch production code.** That's the
  implementing stream's job.
- **Don't bundle multiple features into one triage cycle.** Each
  cycle is one bundle, one staging directory, one packaging
  recommendation.
