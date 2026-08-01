# Brief — S1: safe-fetch core (runtime-agnostic)

**Read first:** `.ai/tasks/active/safe-fetch/plan.md` (shared context, gates, topology) and
`.claude/project/fetch-primitive-threat-model.md` (the spec). Then `CLAUDE.md` and
`.ai/instructions/*`.

**Branch:** `safe-fetch-core` from `origin/integration/safe-fetch`. PR into
`integration/safe-fetch`. **Do not merge.**

**Estimate:** ~1 session. **Runs in parallel with S2a** — you share no files with it.

---

## Scope

A new `safe-fetch` packlet in `@fgv/ts-extras` (D-1: packlet, not a sibling package —
mirror `crypto-utils`, reuse the existing `index.ts` / `index.browser.ts` +
conditional-`exports` machinery, add **zero** dependencies).

Implement design § 6 and §§ 8–10, 12:

- All four guard interfaces (§ 6.1) and `IRequestHop`, `IGuardVerdict`.
- `IFetchTransport`, `IFetchTransportHints`, `platformFetchTransport` — **including the pin
  interlock: a transport asked to honor a `pinnedAddress` it cannot honor MUST fail rather
  than connect by hostname.** That interlock is what makes the deferred pinned-connect work
  additive rather than breaking; it is not decoration.
- `allowAnyAddress()` (§ 6.1).
- Guard resolution at init (§ 6.3): optional in params, non-optional in `IResolvedGuards`,
  passthrough defaults for the three policy guards.
- `FetchFailureReason` taxonomy (§ 8), following `jsonResponse.ts`'s `found`/`unclosed`/`none`
  precedent — read it before designing the union.
- Streaming size cap (§ 9) via `response.body.getReader()`, counting as it reads.
  `Content-Length` is a **fast-reject path only** — absent on chunked, and it lies when
  hostile. The cap must hold without it.
- Timeout composition (§ 10): overall deadline and headers deadline.
- The three entry points (§ 6.4): `safeFetchJson` / `safeFetchText` / `safeFetchBytes`.
- Defaults per § 12. **`maxResponseBytes` defaults to 5 MiB and tunability is a requirement,
  not a nicety (D-6)** — a per-call option, documented at the entry points rather than only in
  a defaults table.

## Explicitly NOT in scope

- **Redirects.** `redirectPolicy: 'reject'` only; `'validate-each-hop'` is S2b's. Fail loudly
  on any 3xx.
- `blockPrivateNetworks()` and all address classification — S2a owns it. Do not write an
  address parser.
- DNS resolution of any kind. No `node:dns`, and **no `node:` imports at all** in this module —
  it must load in a browser (§ 5.3).
- Retry, the browser packlet, `LIBRARY_CAPABILITIES.md` — S3.

## Definition of done

Testable **entirely against a mock `IFetchTransport`** — no live server, no network. If you
reach for one, you are about to make the suite flaky.

Beyond the plan's standard gates:

- A test proving the size cap holds when `Content-Length` is **absent** and when it **lies**
  (understates the true body size).
- A test proving `platformFetchTransport` **fails** rather than silently connecting when
  handed a `pinnedAddress`.
- A test proving a guard supplied as `null` (from a JS caller or an `unknown` escape hatch) is
  treated as absent rather than installed — see the `_resolveIndex` defect on PR #582, which
  was exactly this bug in exactly this pattern.
- `addressGuard` omission is a **compile** error. Assert it with a type-level test if the repo
  has that idiom; otherwise state in the PR that it was verified by compilation.

## Notes

`ts-extras`'s `ai-assist` and `crypto-utils` packlets are on the active-development surface;
this new packlet is likewise unconstrained by compatibility. The rest of `ts-extras` is stable
— do not touch it.

Do not migrate any of the four existing `fetch(` call sites in `ts-extras` (D-4). They are
bearer-auth + provider error mapping, and one is an SSE site where a buffering cap is
semantically wrong.
