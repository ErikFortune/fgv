# Brief — S3: retry, browser packlet, docs, testbed

**Read first:** `.ai/tasks/active/safer-fetch/plan.md` and
`.claude/project/fetch-primitive-threat-model.md` — §§ 5.4, 11, 14.

**Branch:** `safer-fetch-browser-and-docs` from `origin/integration/safer-fetch` **after S1 and
S2b have landed there.** PR into `integration/safer-fetch`. **Do not merge.**

**Estimate:** ~1 session, and the piece most likely to shrink — see the retry cut trigger.

---

## Scope

**1. Retry (§ 11) — with a pre-registered cut trigger.**

The taxonomy already distinguishes retryable from not, so the lift looks small.

> **D-7, decided in advance: if implementation reveals retry is harder than it looks — § 11's
> idempotency and budget interactions are the likely source — CUT IT TO v2 rather than
> expanding scope to accommodate it.**

That decision is already made. It is not to be relitigated under schedule pressure. If you cut
it, say so in the PR with the specific complexity that triggered the cut, and remove it
cleanly rather than leaving a partial implementation. Cutting is a **success outcome** here,
not a failure.

Retry must compose with, not escape, the overall timeout budget (§ 10), and must not retry a
non-idempotent method by default.

**2. Browser packlet in `@fgv/ts-web-extras` (D-1, D-8).**

The core wired to `allowAnyAddress()`, with `browserSaferFetchJson` etc. The four-seam split
strengthens the browser case: the request and response guards are runtime-agnostic and useful
there, so this is no longer "the core minus the thing that matters."

**§ 5.4's guarantee table ships in both READMEs, with its two ❌ rows intact.** This is the
honesty mechanism for the whole feature and it is not optional. In the browser:

- **`redirect: 'manual'` yields an opaque redirect with an unreadable `Location`** — per-hop
  validation is not merely harder, it is *not implementable*.
- `redirect: 'error'` **is** a real enforceable guarantee, so do not overclaim in the other
  direction either; the browser side is not a pure no-op.

**3. Documentation.**

- `LIBRARY_CAPABILITIES.md`: an entry under "Specialized utilities" and a line in "Decision
  shortcuts." **Explicitly NOT in the "Result-integration boundary" list** — there is no
  upstream to wrap (`fetch` is a platform global) and the opinion *is* the deliverable (§ 1).
  Do not copy the boundary-package README template; it teaches "escape to the upstream for
  anything not listed," which here would invite callers to bypass the guard.
- Package READMEs with the guarantee tables.

**4. Testbed scenario — not optional (D-4).**

This ships with **no in-repo consumer**, a deliberate departure from the repo's
consumption-driven stability model. The testbed scenario is the substitute, so it ships with
the feature rather than after it. It should exercise a real request end-to-end and make the
guard's behavior visible — a scenario that only demonstrates the happy path against a public
URL does not do the job.

## Explicitly NOT in scope

- Pinned-connect (§ 13) — still deferred; the stated limit stands.
- Migrating the four `ai-assist` `fetch(` sites (D-4).
- Streaming entry point for large downloads; inactivity timeout.

## Definition of done

Beyond the plan's gates:

- Browser tests run under the repo's jsdom setup; **no `node:` import reaches the browser
  barrel** — mirror `crypto-utils/index.browser.ts` and its explicit comment about what is not
  exported.
- The guarantee table in each README matches what the code actually does. Walk every row back
  to an implementation or a test. A ❌ row is a claim too, and an incorrectly-❌ row
  under-promises in a way that pushes consumers toward hand-rolling.
- If retry shipped: a test proving it respects the overall timeout budget rather than
  extending it. If retry was cut: no dead code, no half-wired option, and the design doc's
  § 11 annotated with the cut and its trigger.
