# Brief — S2b: DNS resolution, per-hop guard, redirect walk

**Read first:** `.ai/tasks/active/safer-fetch/plan.md` and
`.claude/project/fetch-primitive-threat-model.md` — **§ 4 in full**, plus § 6.1's hop-chain
rationale.

**Branch:** `safer-fetch-redirect-walk` from `origin/integration/safer-fetch` **after S1 and S2a
have landed there.** PR into `integration/safer-fetch`. **Do not merge.**

**Estimate:** 1–1.5 sessions. Depends on both prior streams.

---

## Scope

Join S1's core to S2a's classifier and make the guard actually load-bearing.

- **DNS resolution** (`node:dns/promises`) in the Node-only module. Resolve, hand the address
  list to S2a's classifier, **reject if any resolved address is disallowed.**
- **Per-hop guard invocation.** `redirectPolicy: 'validate-each-hop'` — every hop passes the
  address guard before any connection is made. `redirect: 'manual'`, `Location` resolved
  relative to the current hop.
- **The hop chain** (§ 6.1): build `ReadonlyArray<IRequestHop>` and pass it whole. Hop 0 is the
  caller's request and is **not** a special case. Populate `status` (the redirect status
  producing the next hop) and `connectedAddress`.
- **Credential stripping.** Turning on manual redirects makes *us* responsible for a rule the
  platform was applying for free: drop `authorization`, `cookie`, `proxy-authorization` — plus
  any caller-supplied `sensitiveHeaders` — on a **cross-origin** hop.
- **Hop cap** (`maxRedirects`, default 5) and loop detection.
- **Method and body rewriting**: `301`/`302` may convert to `GET` and drop the body;
  `307`/`308` preserve both. Get this right — it is why `IRequestHop.status` exists.

## The three things that make this stream hard

**1. Cross-origin is computed against the whole chain, not the previous hop.** `A`
(authenticated) → `B` → `A`: comparing only against the immediately previous hop finds the
final hop same-origin with `A` and re-attaches credentials, even though `B` observed the
redirect. **This must have a dedicated test.** It is a real leak class and it reviews as
correct.

**2. Half of this is not shippable alone (§ 4).** The redirect walk without a guard that has
something to say, or the guard without per-hop revalidation, is the failure mode § 4 exists to
name: "the guard apparently present and the protection absent." Ship them together.

**3. There is no separate redirect guard, and adding one is a regression.** Redirect *policy*
(max hops, follow-or-not, credential stripping) is configuration; the per-hop *check* is the
address guard. If you find yourself wanting a second seam that decides whether a hop may
proceed, re-read § 4 and stop.

## Explicitly NOT in scope

- **Pinned-connect.** The seams (`IGuardVerdict.pinnedAddress`, `IFetchTransport`) exist and
  the interlock must keep working, but `pinnedAddress` stays `undefined` in v1 (§ 13). DNS
  rebinding remains a **stated limit**, not a closed hole. Do not close it here; do not imply
  in TSDoc that it is closed.
- Retry, browser, docs — S3.
- Re-litigating S2a's classification. If a row is wrong, fix it in place and say so.

## Definition of done

Everything through the **mock transport**. A live server here means a flaky suite and, worse,
a test that could actually reach `169.254.169.254`.

Required tests beyond the plan's gates:

- `302` → `169.254.169.254` is **blocked at the hop**, and the request never reaches the
  transport. Assert on the transport, not just the returned failure.
- `302` → `127.0.0.1` blocked under `blockPrivateNetworks()`, permitted under
  `{ allowLoopback: true }`.
- `A(auth) → B → A` strips credentials on the final hop.
- `301`/`302` drop the body and convert method; `307`/`308` preserve both.
- Hop cap fires; `A→B→A→B` oscillation is caught rather than burning the whole budget.
- A hostname resolving to one public and one private address is **rejected**.

The failure taxonomy must distinguish these without becoming a finer scanning oracle than
§ 8 already accepts (L4). If a new reason variant would let an untrusted caller map an internal
network more precisely, collapse it and say so in the PR.
