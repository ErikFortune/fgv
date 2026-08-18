# safer-fetch — implementation plan

**Design:** `.claude/project/fetch-primitive-threat-model.md` (PR #587). That document is
the spec. This plan is only decomposition, sequencing, and the shared context every stream
needs. **Briefs deliberately do not restate the design** — they name the sections that bind
them, so there is exactly one place a decision lives.

**Origin:** PersonAIlity round-3 ask 5. Accepted design-first because the ask as written had
an SSRF hole (§ 4 of the design).

---

## Prerequisite — must merge before stream 1 opens

**PR #588 — `DetailedResult` promoted `@beta` → `@public` in `ts-utils`** (design decision
D-2). Every entry point returns `DetailedResult<ISaferFetchResponse<T>, FetchFailureReason>`;
with the stale `@beta` tag those signatures bake `ae-incompatible-release-tags` warnings into
the checked-in `ts-extras.api.md`. Not a blocker for *writing* code, but a stream that lands
before it will produce an `api.md` that has to be regenerated afterward.

---

## Decomposition

Four streams. The naive read of the design's § 14 phasing is six sequential steps; that is
mostly right, but **one substantial piece is genuinely parallelizable** and it is one of the
two most expensive.

```
          #588 (prereq)
                │
       ┌────────┴────────┐
       │                 │
   ┌───▼────┐      ┌─────▼──────────────┐
   │ S1     │      │ S2a                │   ← parallel; no shared files
   │ core   │      │ address            │
   │        │      │ classification     │
   └───┬────┘      └─────┬──────────────┘
       │                 │
       └────────┬────────┘
                │
          ┌─────▼──────────────┐
          │ S2b                │
          │ DNS + redirect walk│
          └─────┬──────────────┘
                │
          ┌─────▼──────────────┐
          │ S3                 │
          │ browser + retry    │
          │ + docs             │
          └────────────────────┘
```

| Stream | Scope | Est. | Depends on |
|---|---|---|---|
| **S1** | Core: types, taxonomy, seams, `platformFetchTransport`, timeout composition, streaming cap, content-type gate, three entry points, `allowAnyAddress()`. No redirects. | ~1 session | #588 |
| **S2a** | `blockPrivateNetworks()` **address classification only** — pure string → verdict. No DNS, no wiring. | 1–1.5 sessions | nothing |
| **S2b** | DNS resolution, per-hop guard invocation, redirect walk, credential stripping, hop cap. | 1–1.5 sessions | S1 + S2a |
| **S3** | Retry, browser packlet, `LIBRARY_CAPABILITIES.md`, testbed scenario. | ~1 session | S1 + S2b |

**Total 4–5 sessions**, matching design § 14.1. Wall-clock is shorter than the sum because
S1 ‖ S2a.

### Why S2a splits out — the load-bearing scheduling decision

Address *classification* is a pure function from a string to a verdict: given
`::ffff:169.254.169.254` or `0177.0.0.1` or `100.64.0.1`, is this a private address? It needs
no transport, no entry point, no DNS, and no core types beyond `Result`. It is also where the
bulk of the test matrix lives — every row of design § 3's bypass table is a required test at
this repo's 100% coverage bar.

So the single largest block of work has **no dependency on the core** and should not wait for
it. Running S1 and S2a together is the difference between a serial 4–5 sessions and a
wall-clock closer to 3.

**S2a must not touch the transport, the entry points, or DNS.** Resolution is S2b's;
classification is S2a's. Keeping that line sharp is what makes them parallelizable.

---

## Shared context — every stream must internalize this

**1. This is a security primitive, and the north star is falsifiable.**

> A primitive that advertises a guarantee it does not have is worse than five lines at a call
> site, because it transfers responsibility without transferring protection.

Every guarantee claim in TSDoc or README must be one you would defend. Where a guarantee is
impossible, say so — design § 5.4's guarantee table has two ❌ rows on purpose.

**2. Redirect handling and the address check are ONE mechanism (§ 4).** A guard that validates
only the initial URL is worthless; a `302` to `169.254.169.254` defeats it. Any change that
lets a hop reach the network without passing the address guard is a P1 regardless of test
results.

**3. The address guard sees the whole hop chain, and hop 0 is not a special case (§ 6.1).**
No `isRedirect` boolean. The `A → B → A` credential-re-attachment case is the reason: a check
comparing only against the previous hop finds the final hop same-origin with `A` and
re-attaches credentials even though `B` observed the redirect in between.

**4. Guards resolve once at init; nothing downstream branches on absence (§ 6.3).** Optional
in public params, non-optional in the resolved structure. `addressGuard` is required with no
default and its omission is a compile error (D-3).

**5. The failure taxonomy is a scanning oracle (§ 8, L4).** Precision is what makes it useful
and what makes it dangerous. The hop chain is guard-visible; it reaches the caller only on
explicit opt-in and is never auto-echoed into a returned failure.

**6. `IFetchTransport` is the test seam.** Every stream tests against a mock transport rather
than the network. If you find yourself wanting a live server, you are about to make the suite
flaky — reach for the transport instead.

---

## Gates — every stream, every modified package

- `rushx build`, `rushx lint`, `rushx test` at 100% coverage
- `rushx fixlint` before the final commit
- `etc/*.api.md` regenerated; **no new `ae-unresolved-link` of the "does not have an export"
  class** — use code spans for cross-package symbols
- Rush change file per modified package
- `code-reviewer` on the final diff **before** any coverage-closure pass, per
  `TESTING_GUIDELINES.md` § "Coverage Gap Resolution"
- Copilot loop driven to diminishing returns; stop reason recorded on the PR

**Expect layer 2 to be substantive here.** This is security-sensitive greenfield, which is the
profile where a clean layer-1 pass does *not* predict a nitpick-only Copilot loop. Do not call
diminishing returns until the finding profile actually goes nitpicky.

---

## Branch and merge topology

All streams branch from and PR into **`integration/safer-fetch`** (created when S1 opens), not
`release`. The integration branch squashes to `release` once S3 lands and the whole surface is
coherent. Rationale: the API surface moves across streams, so `api.md` conflicts are expected
and are cheaper to resolve once at integration than four times against a moving `release`.

**No stream self-merges.**

---

## Deliberately out of scope for v1

Per design § 14 and the decisions: pinned-connect transport (seams present, implementation
deferred — D-5 / § 13); streaming entry point for large downloads; inactivity timeout;
migration of the four `ai-assist` call sites (D-4).

**Retry is in v1 with a pre-registered cut trigger (D-7):** if implementation reveals it is
harder than it looks — § 11's idempotency and budget interactions are the likely source — cut
it to v2 rather than expanding scope. That decision is already made; it is not to be
relitigated under schedule pressure by whoever hits the complexity.
