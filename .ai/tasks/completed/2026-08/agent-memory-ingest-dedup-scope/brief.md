# Workstream Brief: `agent-memory-ingest-dedup-scope` — make `dedupScope` mean one thing

## Mission

`@fgv/ts-agent-memory` has two dedup layers that disagree. The store honors a kind's declared
`dedupScope`; the ingest orchestrator's stage-4 layer-1 exact match ignores it entirely and always
behaves as `'content'`. Make the declaration authoritative on both paths, and fix the second-order
hazard where a collapsed candidate silently removes an address that sibling edges in the same pass
were built against.

## Status entering

Reported by PersonAIlity against 5.1.0-46, triaged and **verified against source on `release`
@ `b392e1534`**. Every checkable claim in the report held. The consumer has a partial local fix
(declaring `dedupScope: 'entity'` on their own policy) that closes the direct-put path only.

Verified:

- The store honors it — `store/fileTreeMemoryStore.ts:814, 1244` read
  `policy.dedupScope ?? DEFAULT_DEDUP_SCOPE` and only cross-id collapse when `'content'`.
- The orchestrator does not — **`dedupScope` has zero references anywhere in `ingest/`.**
  `_findExactMatch` (`ingest/orchestrator.ts:541-567`) builds its cohort from same-kind,
  same-scope, live records **regardless of `entityId`**, keys on `{ kind, body }`, and
  `_resolveVerdict` (`:459-463`) returns an unconditional `duplicate-of` on a hit.
- The second-order hazard is real — `duplicate-of` plans are filtered from `writablePlans`
  (`:309`), `refIds` is built only from `writablePlans` (`:612-614`), so the collapsed candidate's
  own address is absent and `_validateEdges` fails the **whole ingest item** (`:615-617`).

Blast radius is wider than the reporter's case: `DEFAULT_DEDUP_SCOPE` is `'entity'`
(`types/writePolicy.ts:34`) and both `MemoryCapCullPolicy` (`:363`) and the versioned policy
(`:519`) declare `'entity'`. Only `KnowledgeLwwPolicy` (`:187`) legitimately declares `'content'`.
**Every experience and versioned kind currently gets `'content'` behavior on the ingest path.**

## In-scope paths (you may modify)

- `libraries/ts-agent-memory/src/packlets/ingest/**`
- `libraries/ts-agent-memory/src/packlets/types/memoryStore.ts` — the seam (deliverable 1)
- `libraries/ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts` — implement the accessor
- `libraries/ts-agent-memory/src/test/unit/**`
- `libraries/ts-agent-memory/etc/ts-agent-memory.api.md` — regenerate, never hand-edit
- `libraries/ts-agent-memory/README.md`
- `common/changes/@fgv/ts-agent-memory/*.json`
- `.claude/project/agent-memory-ingest-design.md` — **new**, see deliverable 5
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — **the `@fgv/ts-agent-memory` entry only** (see
  parallel-stream note below)
- `docs/WORKSTREAMS.md` — **this stream's own entry only** (see parallel-stream note below)

## Out-of-scope paths (you must NOT modify)

- `libraries/ts-extras/**`, `libraries/ts-web-extras/**`, `samples/testbed/**` — owned by the
  **`safer-fetch-s3`** stream, running in parallel
- `libraries/ts-agent-memory-sqlite-vec/**` — the persistent index implements `IVectorIndex` /
  `IFragmentVectorIndex`, not the store seam; if your `IMemoryStore` change appears to require a
  change there, **stop and escalate** — it means the accessor landed on the wrong interface
- Any other `libraries/*` package
- The consumer's own repo — their local policy fix is theirs to keep or revert

### Parallel-stream note (read this before touching either shared file)

`safer-fetch-s3` is running concurrently and also has `.ai/instructions/LIBRARY_CAPABILITIES.md`
and `docs/WORKSTREAMS.md` in scope. **Edit only your own section of each**: the
`@fgv/ts-agent-memory` capability entry, and this stream's ledger entry. Do not reflow, reorder,
or reformat surrounding content in either file — that is what turns a trivial two-section merge
into a real conflict. Whoever merges second resolves; keeping edits section-local makes that a
non-event.

## Required reading (load before writing code)

- `libraries/ts-agent-memory/src/packlets/ingest/orchestrator.ts` — stages 4 and 5 especially
  (`_resolveVerdict`, `_findExactMatch`, `_relate`, `_validateEdges`)
- `libraries/ts-agent-memory/src/packlets/types/writePolicy.ts` — `DedupScope`,
  `DEFAULT_DEDUP_SCOPE`, and the three shipped policies' declarations
- `libraries/ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts:800-830` and `:1230-1270` —
  how the store consults the policy today; the new accessor must not duplicate this logic
- `libraries/ts-agent-memory/src/packlets/types/memoryStore.ts` — the seam you are widening
- `.ai/instructions/CODING_STANDARDS.md` § "Extending Core Libraries Over Working Around Them"
- `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `ts-agent-memory` is on the active surface; breaking
  changes land freely with no shim

### Known-missing input — do NOT reconstruct it

`ingest/orchestrator.ts`, `ingest/model.ts` and `ingest/cycleGuard.ts` all cite "**the design
note** §1–§4". **No such document exists in this repo.** This was found during triage and is
already dispositioned as deliverable 5 — you are **not** blocked by it, and you must **not**
reverse-engineer §1–§4 from the code and present the result as the original design. Write a new
note describing what the code does *today* plus what this stream decides, and say plainly at the
top that the cited note was absent and this replaces it.

## Missing-input rule (non-negotiable)

If any *other* required-reading file doesn't exist or you can't access it: **STOP**. Surface the
gap. Do not recreate it from codebase exploration, re-derive brief content, or improvise. Missing
required-reading is an orchestrator-level provisioning gap, not an agent-level workaround. (The
design note above is the one already-known exception, with its handling specified.)

## Dependencies

**Hard:** none. Branch from `release` @ `b392e1534`.
**Soft:** none. `safer-fetch-s3` runs in parallel and touches no code this stream touches.

## v1 deliverables (in order)

1. **A policy read accessor on `IMemoryStore`.** The orchestrator holds an `IMemoryStore` and
   cannot see write policies today — `_writePolicies` is private to `FileTreeMemoryStore`. This is
   why the reported fix is not currently expressible. Add a read accessor (shape is OQ-1).
   **Do not** pass `writePolicies` into the orchestrator separately: that creates a second
   declaration site, which is precisely the defect being fixed.
2. **Layer-1 consults the policy.** For a kind whose effective `dedupScope` is `'entity'`, the
   exact-match cohort must be restricted to the candidate's own entity address, so a cross-id
   body collision is no longer a `duplicate-of`. `'content'` kinds keep today's behavior. The
   same-id case stays the store's job — do not reimplement the store's collapse here.
3. **Edge redirect on `duplicate-of`.** Independent of `dedupScope`, and the sharper of the two
   fixes. `duplicate-of` means "this candidate *is* that record", so a sibling edge built against
   the collapsed candidate's address should be **redirected to the verdict's target**, not
   orphaned into a whole-item ingest failure. This fixes the class, including `'content'` kinds
   where the collapse is correct and the ingest still should not fail. Note the verdict already
   carries `target` — see `:672-676`, where the narrowed `duplicate-of` type is already used
   without a cast.
4. **`LIBRARY_CAPABILITIES.md` correction.** The `@fgv/ts-agent-memory` entry lists the L3 ingest
   orchestrator and the L2 agent-tool surface under "**Fast-follows (seams present, impl
   pending)**". Both ship — `src/packlets/ingest/` and `src/packlets/tools/memoryTools.ts` exist.
   Verify what actually ships and move them; do not simply trust this brief's reading.
5. **`.claude/project/agent-memory-ingest-design.md`** — the note the code has been citing.
   Document the stage pipeline, the two dedup layers and how they now relate, the verdict → write
   mapping, and the cycle guard. Number the sections so the existing `§1`–`§4` citations resolve,
   and update any citation whose number no longer matches what it points at.

## Acceptance criteria (the stop point)

- [ ] A kind declaring `dedupScope: 'entity'` gets entity granularity on **both** the direct-put
      and `ingestItem` paths — with a test that fails against today's code
- [ ] A test covers the reporter's exact scenario: two live records, same kind, same scope,
      byte-identical bodies, different entity ids, plus a sibling edge to the second — ingest
      succeeds and the claim is written
- [ ] A `'content'` kind's cross-id collapse still works and is still tested
- [ ] A `duplicate-of` collapse no longer orphans sibling edges; the redirect is tested for both
      `'entity'` and `'content'` kinds
- [ ] No second declaration site for `dedupScope` — one owner, read through the seam
- [ ] `rushx build` passes in every modified package
- [ ] **`rushx lint` passes in every modified package** *(not run transitively by build)*
- [ ] `rushx test` passes with 100% coverage in every modified package
- [ ] `rushx fixlint` run before the final commit
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] No ad-hoc `console.*` in business logic — use `@fgv/ts-utils` Logging
- [ ] **Docs ship with the code, in this PR:** the `LIBRARY_CAPABILITIES.md` entry, the new design
      note, and this stream's `docs/WORKSTREAMS.md` entry. Not a follow-up docs PR — see
      `CODING_STANDARDS.md` § "Docs ship with the code"
- [ ] `code-reviewer` agent run on the final diff **before** chasing 100% measured coverage;
      findings resolved or dispositioned
- [ ] Copilot loop driven by the implementer; stopped on diminishing returns or the 10-round cap

## Handoff contract (what you publish)

- The `IMemoryStore` policy accessor — consumed by the orchestrator, and by any future host that
  needs to know a kind's dedup granularity without reaching into the store implementation
- Entity-granular layer-1 dedup — consumed by PersonAIlity; **this is the ask**, and it lets them
  revert or keep their local policy fix on their own terms
- Edge redirect on `duplicate-of` — consumed by every ingest host
- `.claude/project/agent-memory-ingest-design.md` — the note three source files already cite

## Open questions to resolve

- **OQ-1 — accessor shape.** Options: a narrow `dedupScopeFor(kind): DedupScope`; a general
  `writePolicyFor(kind): IWritePolicy | undefined`; or surfacing the effective scope on an
  existing descriptor. **Recommended:** the narrow one. It answers exactly the question the
  orchestrator has, keeps `IWritePolicy`'s mutation surface out of a read seam, and cannot become
  a back door for a caller to invoke admission logic out of band. Escalate if you want the general
  form — it is a wider commitment on an interface other implementations must satisfy.
- **OQ-2 — should layer-1 still emit `duplicate-of` for a same-id, identical-body candidate?**
  It is a genuine no-op and the store already handles it. Emitting it is harmless *provided*
  deliverable 3 lands, because the candidate's address then still resolves for sibling edges.
  **Recommended:** yes, emit it — it keeps the verdict honest — but only land that together with
  the redirect, never before.
- **OQ-3 — is `'entity'` the right default given this bug?** `DEFAULT_DEDUP_SCOPE` is `'entity'`,
  so most kinds have silently been getting `'content'` on the ingest path. Fixing this **changes
  behavior for existing hosts**, which is correct but worth stating loudly. **Recommended:** keep
  the default, fix the behavior, and call it out explicitly in the change file and README — do not
  soften it into a flag. Escalate if you think it warrants an opt-in.

## Findings-inbox convention

Findings go to `.ai/tasks/active/agent-memory-ingest-dedup-scope/findings/inbox/<timestamp>-<slug>.md`
— one per file. The orchestrator drains them into `followups.md`. Don't write `followups.md`
directly.

## Required exit artifact

On completion write `.ai/tasks/active/agent-memory-ingest-dedup-scope/result.md` with: branch
name; one-paragraph summary; files changed; build/test/lint status per command; an
**observability self-audit** (`console.*` in business logic — zero hits or each site justified); a
**convention-compliance sweep** against `.ai/instructions/CODE_REVIEW_CHECKLIST.md`; a
**sibling-sweep pass** on the new seam (its siblings are the other `IMemoryStore` members and the
`IMemoryIndex` injection seam — did you diverge asymmetrically from either?); a note on **what
behavior changed for existing hosts** (OQ-3); open questions; and any deviation from this brief.

## Resume protocol

If interrupted: re-read this brief in full, read
`.ai/tasks/active/agent-memory-ingest-dedup-scope/state.md`, and confirm scope still applies.

## A note on the report itself

The consumer's diagnosis was accurate on every checkable claim, and their framing of the
second-order hazard — "an id-collapsed candidate is not just *not written*, it silently removes an
address that sibling edges in the same pass were built against" — is the sharpest sentence in the
report and is why deliverable 3 exists. Their proposed fix was the right intent but not reachable
through the current seam, which they had no way to see from a vendored build. Reply to them when
this lands; they are holding a local workaround pending it.
