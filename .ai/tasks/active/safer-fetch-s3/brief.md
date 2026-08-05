# Workstream Brief: `safer-fetch-s3` — retry, browser packlet, and the guarantee tables

## Mission

Close out the safer-fetch primitive: add opt-in retry, ship the browser entry point in
`@fgv/ts-web-extras`, and publish the per-runtime guarantee table so the primitive's claims are
legible to consumers. This is the last stream of the safer-fetch series.

## Status entering

**Shipped to `release`** (squash `b392e1534`): the full Node-side primitive — core seams, taxonomy,
`platformFetchTransport`, deadlines, streaming cap, content-type gate, three entry points
(S1, #592); address classification + `blockPrivateNetworksPolicy` (S2a, #594/#597); DNS-resolving
`blockPrivateNetworks()` guard, `redirectPolicy: 'validate-each-hop'`, credential stripping, hop
cap, loop detection (S2b, #599). 2,533 tests, 100% coverage, no `c8 ignore` in the packlet.

**Missing:** retry (design §11), the browser packlet (`@fgv/ts-web-extras` has no `safer-fetch`),
both READMEs' guarantee tables, the `LIBRARY_CAPABILITIES.md` entry, and a testbed scenario.
Design §14 phases 4–6 are exactly this stream.

## In-scope paths (you may modify)

- `libraries/ts-extras/src/packlets/safer-fetch/**` — retry, the two refactors below
- `libraries/ts-extras/src/test/unit/safer-fetch/**`
- `libraries/ts-extras/etc/ts-extras.api.md` — regenerate, do not hand-edit
- `libraries/ts-extras/README.md` — §5.4 guarantee table
- `libraries/ts-web-extras/src/packlets/safer-fetch/**` — **new packlet**
- `libraries/ts-web-extras/src/test/unit/safer-fetch/**` — new
- `libraries/ts-web-extras/src/index.ts`, `etc/ts-web-extras.api.md`, `README.md`
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — new entry, see deliverable 6
- `samples/testbed/**` — one scenario
- `common/changes/@fgv/ts-extras/*.json`, `common/changes/@fgv/ts-web-extras/*.json`
- `.claude/project/fetch-primitive-threat-model.md` — **only** to record divergences found in
  implementation (see OQ-1); do not rewrite the design

## Out-of-scope paths (you must NOT modify)

- `libraries/ts-extras/src/packlets/ai-assist/**` — the four existing `fetch(` sites are
  deliberately left alone (bearer auth, provider error mapping, an SSE site where a buffering
  size cap is semantically wrong). Migrating them is D-4, deferred, not this stream.
- Any other `libraries/*` package. If retry or the browser packlet appears to need a change in
  `@fgv/ts-utils` or `@fgv/ts-json-base`, **stop and escalate** — that is a brief amendment.
- `docs/STATUS.md`.
- `.claude/project/fetch-primitive-threat-model.md` beyond the divergence record above.

## Required reading (load before writing code)

- `.claude/project/fetch-primitive-threat-model.md` — **§11 (retry, complete spec)**, §5.1–5.4
  (cross-runtime split + guarantee table), §13 L2/L6/L7 (stated limits), §14 (phasing)
- `libraries/ts-extras/src/packlets/safer-fetch/saferFetch.ts` — `_execute`, `_connect`,
  `_nextHop` in particular
- `libraries/ts-extras/src/packlets/safer-fetch/index.browser.ts` — the barrel doc records what
  the browser surface deliberately omits and why
- PR #599's review-loop comment (github.com/ErikFortune/fgv/pull/599#issuecomment-5187159647) —
  carries the two dispositions this stream inherits
- `.ai/instructions/CODING_STANDARDS.md` § Result pattern; `.ai/instructions/TESTING_GUIDELINES.md`
  § Coverage Gap Resolution

## Missing-input rule (non-negotiable)

If any required-reading file or other declared input doesn't exist or you can't access it:
**STOP**. Surface the gap.

Do NOT recreate the missing input from your own analysis or codebase exploration, re-derive brief
content from scratch, or improvise what it was supposed to contain. Missing required-reading is an
orchestrator-level provisioning gap, not an agent-level workaround.

## Dependencies

**Hard:** none. S1/S2a/S2b are all on `release`; branch from it.
**Soft:** none.

## v1 deliverables (in order)

1. **Retry** — `IRetryPolicy` per design §11, off by default. Implement every rule in that
   section; each is a decision, not a suggestion. The load-bearing one: **the guard re-runs on
   every attempt from hop 0 — a full re-walk, never a resume, never a cached verdict.** Caching a
   verdict across N attempts turns retry into its own rebinding vector (N connects per check), and
   a retry delay is exactly when a short-TTL rebind lands. A resume is independently wrong because
   the redirect chain is not stable across attempts. Also: retryable set, never-retryable set,
   `GET`/`HEAD`-only unless `retryNonIdempotent`, `Retry-After` honored on 429/503 **clamped to
   `maxDelayMs`** (it is attacker-controlled), exponential backoff with full jitter, and the
   overall deadline as ceiling — fail now rather than sleep past it.
2. **Loop-detection restructure** (inherited from #599 round 3, documented as `KNOWN LIMIT` at the
   site). Move the check to *after* the address guard clears the hop, so both sides of the
   comparison are guard-cleared URLs. Today `completed` holds cleared URLs while `to` is the raw
   resolved `Location`, so a normalizing guard can defer a repeat to `maxRedirects`. This means
   splitting the guard step out of `_connect`. Do **not** special-case trailing dots — that layer
   does not own normalization and cannot anticipate a custom guard.
3. **Result-chaining pass over `saferFetch.ts`** (inherited). The entry points were chained before
   merge; `_nextHop`, `_receive`, and `_connect` were not. Do this *with* deliverable 2, since it
   restructures `_connect` anyway — refactoring that function twice is the thing to avoid.
   `_execute`'s walk loop is defensible as loop control flow; the boundary helpers
   (`_decodeText`, `_parseJson`, `_parseUrl`, `_readCappedBody`) convert a plain `Result` into a
   `DetailedResult` and are **correct as they are** — do not "fix" them.
4. **Browser packlet** in `@fgv/ts-web-extras`. The code is the core minus the guard. It must
   state its non-guarantees loudly rather than degrade silently: no resolved-address guard (no DNS
   API), no per-hop revalidation (opaque redirect), credential stripping done by the platform.
   Settle OQ-1 and OQ-2 below as part of this.
5. **Guarantee tables** — design §5.4 verbatim in **both** READMEs, reconciled against what
   actually shipped (see OQ-1). This table is the artifact that keeps the primitive honest.
6. **`LIBRARY_CAPABILITIES.md` entry** — under "Specialized utilities" and in "Decision
   shortcuts". **Explicitly NOT** in the "Result-integration boundary" list: there is no upstream
   being wrapped and the opinion is the entire deliverable (design §1).
7. **Testbed scenario** in `samples/testbed` exercising the Node path end-to-end.

## Acceptance criteria (the stop point)

- [ ] Retry implements every §11 rule, with a test per rule
- [ ] A test asserts the guard re-runs from hop 0 on each retry attempt (not a cached verdict)
- [ ] A test asserts `Retry-After` is clamped to `maxDelayMs`
- [ ] Loop detection compares guard-cleared URLs on both sides; the `KNOWN LIMIT` comment is
      removed because it no longer applies
- [ ] Browser packlet ships with its non-guarantees documented in-code and in the README
- [ ] §5.4 guarantee table in both READMEs, matching shipped behavior
- [ ] `LIBRARY_CAPABILITIES.md` entry added, not in the Result-integration-boundary list
- [ ] `rushx build` passes in every modified package
- [ ] **`rushx lint` passes in every modified package** *(not run transitively by build)*
- [ ] `rushx test` passes with 100% coverage in every modified package
- [ ] `rushx fixlint` run before the final commit
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] No ad-hoc `console.*` in business logic — use `@fgv/ts-utils` Logging
- [ ] `code-reviewer` agent run on the final diff **before** chasing 100% measured coverage;
      findings resolved or dispositioned
- [ ] Copilot review loop driven by the implementer; stopped on diminishing returns or the
      10-round cap. **Expect layer 2 to be substantive here** — this is security-sensitive code,
      and #599's loop surfaced three real defects across three rounds

## Handoff contract (what you publish)

- `IRetryPolicy` + `ISaferFetchOptions.retry?` — consumed by PersonAIlity
- `@fgv/ts-web-extras` `safer-fetch` packlet + its barrel — browser consumers
- §5.4 guarantee table in both READMEs — the honesty artifact the design is built around
- `LIBRARY_CAPABILITIES.md` entry — the discovery path for every future consumer
- A divergence record in the design doc for anything implementation contradicted

## Open questions to resolve

- **OQ-1 — `redirect: 'error'` vs `'manual'` on the browser path.** Design §5.4 row "Reject-all-
  redirects mode" says the browser achieves it via `redirect: 'error'`, but the shipped core uses
  `redirect: 'manual'` on *every* call — which is precisely why a browser redirect surfaces as
  `'redirect-opaque'` rather than `'redirect-rejected'`. Copilot raised this on #599 and it was
  resolved there by documenting the difference, not by changing behavior. **Recommended:** use
  `redirect: 'error'` on the browser path under `'reject'` so the guarantee table is literally
  true, and update §5.4 if you conclude otherwise. Either way the table and the code must agree
  when you are done.
- **OQ-2 — should the browser entry points refuse `'validate-each-hop'` up front?** Today the
  browser barrel accepts the mode and fails at the first redirect as `'redirect-opaque'` — honest,
  but late. **Recommended:** reject at option-resolution with a message naming the runtime, so the
  failure names the cause instead of the symptom.
- **OQ-3 — browser barrel export surface.** `classifyAddress` and the pure policies
  (`allowAnyAddressPolicy` / `blockPrivateNetworksPolicy`) are runtime-agnostic but currently ship
  from the Node barrel only; `index.browser.ts` documents this as deliberate-for-now and defers
  the call to this stream. **Recommended:** export them — they are pure and useful for URL₀ checks
  — but only alongside a clear note that they cannot substitute for the resolved-address guard.
- **OQ-4 — `blockPrivateNetworks` allowlist options.** Design §13 L6's Ollama reconciliation uses
  `allowHosts` / `allowPorts` / `allowInsecureHttp`; none exists. Purely additive on
  `IBlockPrivateNetworksGuardOptions`. Today the loopback sidecar case works via
  `{ allowLoopback: true }` alone. **Recommended:** add them if L6's example is meant to be
  literally runnable; otherwise soften L6 and defer. Escalate if you want it out of scope.

## Findings-inbox convention

Findings surfaced during the stream go to per-file inbox entries at
`.ai/tasks/active/safer-fetch-s3/findings/inbox/<timestamp>-<slug>.md` — one finding per file.
The orchestrator drains the inbox into `followups.md`. Don't write to `followups.md` directly.

## Required exit artifact

On completion, write `.ai/tasks/active/safer-fetch-s3/result.md` with: branch name; one-paragraph
summary; files changed; build/test/lint status per command; an **observability self-audit** (grep
in-scope paths for `console.*` in business logic — zero hits, or document each kept site);
a **convention-compliance sweep** against `.ai/instructions/CODE_REVIEW_CHECKLIST.md`; a
**sibling-sweep pass** on each new surface ("what siblings did I asymmetrically diverge from?" —
the browser packlet's siblings are `crypto-utils` and `file-tree`, which have established
cross-runtime patterns); open questions for downstream; and any deviation from this brief, with why.

## Resume protocol

If interrupted: re-read this brief in full, read `.ai/tasks/active/safer-fetch-s3/state.md` for the
last checkpoint, and confirm scope and boundaries still apply before resuming.

## One note on how the prior streams went

#599 passed 100% coverage and three Copilot rounds while the packlet's largest file deviated from
the house Result-chaining idiom that every sibling file follows — coverage measures the lines you
have, and a diff review does not ask "is this file written like its neighbors?" When you run
`code-reviewer`, ask that question explicitly. It is deliverable 3's whole origin.
