# Safer Fetch Primitive — Threat Model and Design

Status: **design only — no implementation.** Written for review before any
implementation stream is commissioned.
Owner libraries (proposed): `@fgv/ts-extras` (core + Node guard) and
`@fgv/ts-web-extras` (browser entry point)
Requesting consumer: PersonAIlity
Stream: `fetch-primitive-threat-model`

> A primitive that advertises a guarantee it does not have is worse than
> five lines at a call site, because it transfers responsibility without
> transferring protection.

That sentence is this design's north star. Every guarantee claimed below
is one I would defend; every gap is named rather than implied.

---

## Table of contents

- [1. What this is, and what it is not](#1-what-this-is-and-what-it-is-not)
- [2. Verified premises](#2-verified-premises)
- [3. Threat model](#3-threat-model)
- [4. Redirect policy and the SSRF guard are one mechanism](#4-redirect-policy-and-the-ssrf-guard-are-one-mechanism)
- [5. The cross-runtime split](#5-the-cross-runtime-split)
- [6. API surface sketch](#6-api-surface-sketch)
- [7. The additive pinned-IP seam](#7-the-additive-pinned-ip-seam)
- [8. Failure taxonomy](#8-failure-taxonomy)
- [9. The streaming size cap](#9-the-streaming-size-cap)
- [10. Timeouts](#10-timeouts)
- [11. Retry](#11-retry)
- [12. Defaults and their justification](#12-defaults-and-their-justification)
- [13. Stated limits](#13-stated-limits)
- [14. Phasing](#14-phasing)
- [15. Testing notes](#15-testing-notes)
- [16. Decisions](#16-decisions)
- [Appendix A — where the three findings were incomplete](#appendix-a--where-the-three-findings-were-incomplete)
- [Appendix B — design-history record](#appendix-b--design-history-record)
- [Appendix C — consumer validation](#appendix-c--consumer-validation-personaility-2026-08-01)

---

## 1. What this is, and what it is not

### Not a Result-integration boundary package

`LIBRARY_CAPABILITIES.md` documents a recurring package shape — the
**Result-integration boundary** (`ts-extras-webauthn`,
`ts-extras-transformers`, `ts-extras-mcp`, `ts-extras-ollama`,
`ts-agent-memory-sqlite-vec`). That shape wraps a well-maintained upstream
library, converts throw-on-failure into `Result<T>`, adds **no opinion**,
and carries an explicit NOT-in-scope list whose purpose is to say "for
anything else, call the upstream directly."

**This primitive is not that shape, and framing it that way would be a
documentation defect with security consequences.** Two reasons:

1. **There is no upstream to wrap.** `fetch` is a platform global, not a
   library. There is no maintainer whose opinions we are declining to
   inherit.
2. **The opinion is the entire product.** Timeout defaults, redirect
   posture, the scheme allowlist, credential stripping on cross-origin
   hops, the private-address guard — these are the deliverable. A
   caller who strips the opinion out and "calls the upstream directly"
   has `fetch`, which is where they started.

The boundary-package README template teaches a reader: *thin, unopinionated,
escape to the upstream for anything not listed.* Applied here that message
is actively harmful — it invites callers to bypass the guard for any case
the table does not enumerate, which is exactly the failure mode the
primitive exists to prevent.

### What it is

A **first-class primitive with an explicit threat model**. The closest
existing sibling in this repo is the `crypto-utils` packlet: opinionated,
cross-runtime-split by capability rather than convenience, and already
carrying a per-platform threat-model section in its design doc
(`.claude/project/keystore-asymmetric-design.md` § "Threat models per
platform"). This document extends that precedent rather than inventing a
genre.

**Consequences for the deliverable:**

- The README leads with the threat model, not the API table.
- Every exported entry point's TSDoc states what it does **not** protect
  against, adjacent to what it does.
- There is no "NOT in scope — use the upstream directly" section. There is
  a **Stated limits** section (§13), which is a different claim: these are
  holes in a guarantee we are making, not features we declined to wrap.

---

## 2. Verified premises

The consumer's premises were re-verified against `release` @ `c37ec88b2`
rather than taken on faith. All four hold.

| Premise | Verification | Result |
|---|---|---|
| `fetchJson` is unexported | `grep -c fetchJson libraries/ts-extras/etc/ts-extras.api.md` → **0** | ✅ Holds |
| Four bare `fetch(` sites in `ts-extras/src` | See table below | ✅ Holds, exactly four |
| No generic helper with timeout / size cap / allowlist | See searches below | ✅ Holds |
| Prying open `ai-assist` transport would make it worse | Read all four sites | ✅ Holds — see below |

### The four `fetch(` sites

| File:line | Shape | What it is |
|---|---|---|
| `ai-assist/http.ts:58` | `POST` JSON | `fetchJson` — `@internal`, JSON body, bearer headers |
| `ai-assist/apiClient.ts:166` | `POST` multipart | `FormData` image-edit upload |
| `ai-assist/apiClient.ts:270` | `GET` | list-models |
| `ai-assist/streamingAdapters/common.ts:243` | `POST` SSE | `openSseConnection`, returns raw `Response` |

All four share the same skeleton: `try { fetch } catch → fail`, then
`!response.ok → fail(\`AI API returned ${status}: ${text}\`)`. None has a
timeout, size cap, redirect policy, or address guard. Each is coupled to
bearer auth (`bearerAuthHeader(config.apiKey)`) and to provider-shaped
error mapping.

**Leave them alone.** The SSE site in particular returns a raw `Response`
whose body is consumed by `sseParser.ts` via `body.getReader()` — a
buffering size cap is semantically wrong for an unbounded stream, and the
correct behavior there (a per-event budget, an idle timeout) is a
different feature. Migrating these four is out of scope for v1; see D-4.

### Searches confirming nothing exists

```
grep -rn "redirect: *'manual'"        libraries tools   → 0 hits
grep -rn "AbortSignal\.timeout"       libraries/*/src   → 0 hits
grep -rn "node:dns"                   libraries/*/src   → 0 hits
grep -rniE "ssrf|private[_ ]?ip|169\.254|rebind"  (src) → 0 relevant hits
grep -rn "getReader()"                libraries/*/src   → 1 hit (sseParser.ts)
```

There is no timeout helper, no size cap, no redirect handling, no DNS
access, and no address classification anywhere in the repo. This is
genuinely greenfield.

### One premise-adjacent finding the ask did not anticipate

`ts-extras` already implements the **exact cross-runtime mechanism** this
design needs, in `crypto-utils`: a packlet with `index.ts` and
`index.browser.ts` barrels, selected by conditional `exports` in
`package.json` (`"./crypto": { "node": …, "default": … }`), where
`index.browser.ts` carries the literal comment
`// Note: NodeCryptoProvider is NOT exported in browser version`.

The split proposed in §5 is not a new pattern. It is the established one.

---

## 3. Threat model

### 3.1 Assets

| Id | Asset | Why it matters |
|---|---|---|
| **A1** | Internal network reachability from the calling process | Cloud metadata endpoints (`169.254.169.254`, `fd00:ec2::254`), loopback admin ports, RFC-1918 hosts, container service meshes. Reaching these from a process that fronts untrusted input is the classic SSRF payoff. |
| **A2** | Credentials on the outbound request | `Authorization`, `Cookie`, `Proxy-Authorization`. A redirect to an attacker-controlled host exfiltrates them verbatim if they are replayed on the hop. |
| **A3** | Process availability | Heap (unbounded response buffering), sockets/FDs (responses that never close), event-loop time (slowloris trickle). |
| **A4** | Caller-visible data integrity | An HTML error page parsed as JSON; a response whose declared type does not match its content. Not a confidentiality issue; a correctness one that becomes a security one when the parsed value drives a decision. |

### 3.2 Adversary capabilities

Tiered, because the mitigations differ per tier.

**AC1 — URL-influencing caller-of-caller (primary adversary).**
Untrusted data reaches the request URL: a webhook target, a user-supplied
avatar or OpenGraph URL, an RSS feed address, a link the model asked to
fetch. The adversary controls the **scheme, host, port, path, and query**
of the initial request, but does not control the process.
*This is the adversary the guard exists for.*

**AC2 — Hostile or compromised remote server at an allowed URL.**
Controls response status, all headers (including `Location`,
`Content-Length`, `Content-Type`, `Retry-After`), body size, body content,
and response timing. Note that AC2 is reachable **even under a strict
allowlist** — an allowlisted host can be compromised, and a
`Content-Length: 12` header on a 10 GB body is free to send.

**AC3 — Hostile DNS.** Controls the A/AAAA records for a hostname, and
can return different answers to two lookups seconds apart. This is the
rebinding adversary. Partially mitigated; see §7 and §13.

**AC4 — Network-position attacker (MITM).** **Out of scope.** TLS is the
control. The primitive requires `https:` by default and relies on the
platform's certificate validation; it does no pinning and adds nothing
here.

### 3.3 Explicitly out-of-scope adversaries

Naming these is load-bearing — each is a guarantee a reader might
otherwise assume.

- **A malicious first-party caller.** A caller who wants to reach
  `127.0.0.1` calls `globalThis.fetch` and is done. This primitive
  protects against untrusted **data**, not untrusted **code in the same
  process**. It is not a sandbox and must never be described as one.
- **A compromised process or supply chain.** Once the adversary runs code
  in-process, the guard is a function they can also not call.
- **Egress control.** If the deployment has an egress proxy or firewall,
  that control is strictly stronger than this guard. The guard is
  defense in depth for deployments that do not, not a replacement for
  those that do.

### 3.4 Trust boundaries

```
   untrusted URL (AC1)
          │
          ▼
┌──────────────────────┐
│   caller code        │  trusted
└──────────┬───────────┘
           │  saferFetchJson(url, { guard, … })
           ▼
┌────────────────────────────────────────────────┐
│  safer-fetch core   (runtime-agnostic)          │
│    · scheme / URL shape                        │
│    · overall deadline, headers deadline        │
│    · streaming size cap                        │
│    · content-type gate                         │
│    · failure taxonomy, retry policy            │
└──────────┬─────────────────────────────────────┘
           │   ┌───────────────────────────────┐
           ├──►│ IAddressGuard   ◄── RE-RUN    │  ← trust boundary crossed
           │   │  (Node: address classifier)   │     once per hop
           │   └───────────────────────────────┘
           ▼
┌──────────────────────┐
│  IFetchTransport     │  platform fetch today; pinned-connect later
└──────────┬───────────┘
           │
           ▼   DNS (AC3) ────────► remote server (AC2)
                                        │
                                   3xx Location
                                        │
                                        └──► back to IAddressGuard (next hop)
```

The loop from `Location` back through `IAddressGuard` is the whole point of
§4. A guard that sits only on the first arrow is decorative.

### 3.5 In scope for the guard (Node)

- **Scheme allowlist.** `https:` only by default. `http:` behind an
  explicit opt-in. Everything else — `file:`, `data:`, `blob:`, `ftp:`,
  `gopher:`, `ws:` — rejected outright, at every hop.
- **Host allowlist / denylist.** Exact hostnames and explicit suffix
  matches (`.example.com`). **No regex**, ever: regex allowlists are a
  well-known bypass generator (unanchored patterns, `.` matching `.`,
  catastrophic backtracking as a DoS).
- **Port allowlist.** Default `{443}`, plus `80` when insecure HTTP is
  enabled.
- **Resolved-address classification.** Reject when the resolved address is
  loopback, link-local, unique-local, private, CGNAT, multicast,
  broadcast, reserved, or unspecified. The concrete ranges are enumerated
  in §3.6 because the naive version of this check is where guards fail.
- **Every one of the above, re-evaluated on every redirect hop.**

### 3.6 The address classification is where naive guards fail

A guard that checks `10.`, `172.16.`, `192.168.` and calls it done is
bypassed by all of the following. Each must be handled:

| Bypass | Example | Handling |
|---|---|---|
| IPv4-mapped IPv6 | `::ffff:169.254.169.254` | Normalize to canonical form before classifying; classify the embedded v4. |
| NAT64 / well-known prefix | `64:ff9b::a9fe:a9fe` | Classify the embedded v4 for the `64:ff9b::/96` prefix. |
| Decimal / octal / hex literals | `http://2130706433/`, `http://0x7f.1/`, `http://0177.1/` | These are IP **literals**, not hostnames — parse and canonicalize before deciding whether to resolve. |
| The unspecified address | `0.0.0.0`, `::` | Routes to localhost on Linux. Reject. |
| CGNAT | `100.64.0.0/10` | Frequently carrier/container-internal. Reject by default. |
| Link-local v6 | `fe80::/10` | Reject. |
| Unique-local v6 | `fc00::/7` | Reject. |
| Multi-record hostnames | one public A, one private A | **Reject if *any* resolved address is disallowed**, not if the first is. Without pinning (§7) there is no guarantee which address the connect will use. |
| Trailing-dot / IDN / case | `LOCALHOST.`, unicode homographs | Normalize the hostname (lowercase, strip trailing dot, punycode) before allowlist matching. |

Ranges to reject (v4): `0.0.0.0/8`, `10/8`, `100.64/10`, `127/8`,
`169.254/16`, `172.16/12`, `192.0.0/24`, `192.0.2/24`, `192.168/16`,
`198.18/15`, `224/4`, `240/4`, `255.255.255.255/32`.
(v6): `::/128`, `::1/128`, `fc00::/7`, `fe80::/10`, `ff00::/8`, plus
v4-mapped and NAT64 embeddings of the above.

#### Corrections from implementation (S2a, PR #592)

The table above was written against intent. Implementing it — and running a
differential harness against the platform's own WHATWG URL parser over 4405
inputs — found four gaps. Each is verified, not asserted; the `node -e` one-liners
that demonstrate them are reproducible.

**Three additional v4-in-v6 embeddings.** The table lists only the *mapped* form.
Also required:

| Bypass | Example | Note |
|---|---|---|
| **6to4** `2002::/16` | `2002:a9fe:a9fe::` | Embeds v4 in bits 16..47 — this **is** the metadata endpoint |
| **IPv4-compatible** `::/96` | `::a9fe:a9fe` | Deprecated but still parsed; distinct from the mapped form |
| **RFC 6145 translated** `::ffff:0:0:0/96` | | Third embedding shape |

**The v6 reject list leaves most of IPv6 classified as public.** Only `2000::/3`
is assigned global unicast, so a classifier using the reject list alone treats
`fe00::1`, `1fff::1`, `4000::1` and `100::1` as public — verified: all four pass
through `new URL()` unchanged and match no listed range. **The v6 fallback must be
`reserved`, never `public`:** classify what is *known* global unicast and reject
the rest, rather than rejecting a list and permitting the remainder. This inverts
the table's polarity for v6 and is the more consequential of the four.

**`0x` with an empty remainder is `0`.** `http://127.0x.1/` has hostname
`127.0.0.1`. So does `http://0x7f.1/`; `http://127.0x/` is `127.0.0.0`. This was a
live bypass in S2a's first draft, found by the differential harness rather than by
review — no reads-against-intent pass would have produced it.

**IDNA is an address-level concern, not only a hostname-allowlist one.** The row
above files unicode homographs under allowlist matching, which understates it:
`http://⑫7.0.0.1/`, `http://１２７.０.０.１/` and `http://127。0。0。1/` all have
hostname `127.0.0.1` after WHATWG normalization. The digits and the separators
both normalize.

**The operational consequence of the last two:** classify `url.hostname` — the
parser's normalized output — and **never** raw URL text. Every one of these forms
is already canonical by the time `hostname` is read, and every one of them defeats
text matching.

### 3.7 Out of scope for the guard

- **DNS rebinding.** Documented limit; seam present. See §7 and §13.
- **Response content policy.** The primitive does not scan bodies for
  anything.
- **Certificate pinning / MITM.** See AC4.
- **Egress accounting, rate limiting, per-host quotas.** Deployment
  concerns; a retry policy is not a rate limiter.

---

## 4. Redirect policy and the SSRF guard are one mechanism

The consumer's original ask listed "allowlist" and "redirect handling" as
two independent bullets. **They are one feature, and shipping them as two
is the concrete way this ends up with the guard apparently present and the
protection absent.**

A guard that validates only the initial URL is defeated by a single hop:

```
GET https://allowlisted.example.com/avatar
  ← 302 Location: http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

The initial URL passes every check. The platform's default
`redirect: 'follow'` then fetches the metadata endpoint, and the guard
never sees it. The same applies to `http://127.0.0.1:6379/`,
`http://10.0.0.5:9200/`, and every other internal service.

### The mechanism, stated as one thing

1. Validate URL₀ with the guard.
2. Issue the request with **`redirect: 'manual'`** so the platform does not
   follow anything on our behalf.
3. If the status is 301/302/303/307/308 and `Location` is present:
   a. Resolve `Location` against the current URL (it may be relative).
   b. **Run the full guard on the resulting URL** — scheme, host, port,
      resolved-address classification, all of it.
   c. Apply method/body rewriting: 303 → `GET` with no body; 301/302
      historically → `GET` (match platform behavior and document it);
      307/308 preserve method and body. A body that cannot be replayed
      (a stream) makes 307/308 unfollowable — fail rather than silently
      send an empty body.
   d. **Strip credential headers if the target origin differs** — see
      below.
   e. Increment the hop counter; fail with `too-many-redirects` past the
      cap.
   f. Loop.
4. On a non-redirect status, proceed to the content-type gate and the
   size-capped body read.

### The third inseparable part: credential stripping

Not in the original ask, and it belongs to the same mechanism.

If the request carries `Authorization: Bearer <token>` and hop 1 redirects
to `https://attacker.example/`, replaying the header hands the token over.
Browsers and `curl` both strip credential headers on cross-origin
redirects; a hand-rolled manual-redirect loop **re-introduces the bug the
platform had already fixed**, because the loop author is now responsible
for a rule the platform used to apply.

Rule: on any hop where the target's `(scheme, host, port)` differs from the
previous hop's, drop `Authorization`, `Cookie`, `Proxy-Authorization`, and
any header the caller marks `sensitive`. Callers who genuinely need
cross-origin credential replay must opt in per call, loudly.

This is why "redirect policy" cannot be a bullet: turning on manual
redirects **creates** a security obligation that did not previously exist.

### The browser makes the coupling structural, not merely advisable

`redirect: 'manual'` in the browser does **not** give you the redirect to
inspect. It yields an opaque-redirect response: `type: 'opaqueredirect'`,
`status: 0`, and `Location` is **not readable**. The manual-redirect walk
is therefore not merely harder in the browser — it is **not implementable
there at all**.

This is stronger than the finding as originally stated ("no reliable
interposition on redirect hops"). It is not a reliability question. The
hop information does not exist on the browser side of the API. That fact
alone forces the cross-runtime split in §5; the DNS argument is the second
reason, not the only one.

---

## 5. The cross-runtime split

### 5.1 Why the guard cannot exist in the browser

- **No DNS resolution.** There is no browser API that returns the A/AAAA
  records for a hostname. The guard's central check is unavailable.
- **No view of the resolved address.** Nothing in `fetch` or `Response`
  exposes the peer address.
- **No redirect interposition.** Per §4, `redirect: 'manual'` yields an
  opaque response with no readable `Location`.

A browser-side function named `saferFetch` that accepted an `addressGuard` option
and quietly did nothing with it would be the worst artifact this stream
could produce: it would read at the call site as protection, and reviewers
would stop looking.

### 5.2 What the browser *can* honestly offer

The browser side is not a pure no-op, and the doc should not overstate the
loss:

- **The actual controls are CORS and network position.** A page can only
  reach what the browser's origin policy and the user's network permit.
  A browser fetch to `169.254.169.254` from a public origin is already
  constrained by CORS in a way a server-side fetch is not.
- **`redirect: 'error'` is a real guarantee.** "This request must not be
  redirected anywhere" is enforceable in the browser. It is narrow, but it
  is genuine, and it should be offered rather than withheld on the grounds
  that the full guard is impossible.
- Everything in the runtime-agnostic core — timeout, streaming size cap,
  content-type gate, failure taxonomy, retry — works identically.

### 5.3 Package placement

Follows `crypto-utils` exactly (see §2, "one premise-adjacent finding").

| Location | Contents | Runtime |
|---|---|---|
| `@fgv/ts-extras` packlet `safer-fetch`, module `core.ts` | Types, taxonomy, timeout, streaming cap, content gate, retry, the four guard seams / `IFetchTransport`, `platformFetchTransport`. **No `node:` imports.** | any |
| `@fgv/ts-extras` packlet `safer-fetch`, module `nodeGuard.ts` | `blockPrivateNetworks()` and friends — `node:dns/promises`, address classification, allowlist. | Node only |
| `@fgv/ts-extras/safer-fetch` → `index.ts` | core + the Node address guards + `nodeSaferFetchJson` etc. | Node barrel |
| `@fgv/ts-extras/safer-fetch` → `index.browser.ts` | core only, with an explicit `// Note: the Node address guards are NOT exported in browser version` comment, mirroring `crypto-utils/index.browser.ts`. | browser barrel |
| `@fgv/ts-web-extras` packlet `safer-fetch` | `browserSaferFetchJson` etc. — the core wired to `allowAnyAddress()`, with the "what this does not protect against" TSDoc. | browser |

New conditional export in `libraries/ts-extras/package.json`:

```jsonc
"./safer-fetch": {
  "node":    { "import": "./lib/packlets/safer-fetch/index.js",
               "require": "./lib/packlets/safer-fetch/index.js" },
  "default": { "import": "./lib/packlets/safer-fetch/index.browser.js",
               "require": "./lib/packlets/safer-fetch/index.browser.js" }
}
```

Neither package gains a dependency. The address classification is ~150
lines of pure arithmetic over parsed octets; pulling in a CIDR library for
that would add a supply-chain surface to a security primitive to save
little.

### 5.4 The guarantee table

This table is the artifact that keeps the primitive honest. It belongs in
both READMEs verbatim.

| Property | Node (`@fgv/ts-extras/safer-fetch`) | Browser (`@fgv/ts-web-extras`) |
|---|---|---|
| Overall + headers deadline | ✅ | ✅ |
| Streaming size cap, enforced during read | ✅ | ✅ |
| Content-type gate before body read | ✅ | ✅ |
| Structured failure taxonomy | ✅ | ✅ |
| Retry with idempotency + budget rules | ✅ | ✅ |
| Scheme allowlist on URL₀ | ✅ | ✅ |
| Host / port allowlist on URL₀ | ✅ | ✅ |
| **Resolved-address (private-IP) guard** | ✅ | ❌ **impossible** — no DNS API |
| **Per-hop revalidation of redirects** | ✅ | ❌ **impossible** — opaque redirect |
| **Credential stripping on cross-origin hop** | ✅ | n/a — platform does it |
| Reject-all-redirects mode | ✅ | ✅ (`redirect: 'error'`) |
| DNS-rebinding resistance | ❌ **documented limit** (§13) | ❌ |

### 5.5 The address guard is a required parameter, with no default

The single most effective mechanism against "guarantee implied but not
delivered" is refusing to let the address guard be absent by accident.

```typescript
// Node — the posture is named at the call site
const r = await saferFetchJson(url, { addressGuard: blockPrivateNetworks() });

// Node, local sidecar — the deviation is visible and greppable
const r = await saferFetchJson(ollamaUrl, {
  addressGuard: blockPrivateNetworks({ allowLoopback: true })
});

// Browser — the absence of protection is named at the call site
const r = await saferFetchJson(url, { addressGuard: allowAnyAddress() });
```

`addressGuard` has **no default value**, so omitting it is a *compile*
error — not a runtime failure, not a lint rule. For a security primitive,
*impossible to construct wrong by accident* is a stronger property than any
amount of documentation. `allowAnyAddress()` is exported with TSDoc
enumerating precisely what it does not do. The result:

- A reviewer greps `addressGuard:` and enumerates every call site's posture
  in one search, with no ambient default to overlook.
- `allowAnyAddress()` and `allowLoopback: true` are each independently
  greppable, so the two ways of weakening the guard are both visible.
- A Node call site cannot silently inherit browser semantics by omission.
- Choosing no protection is a deliberate, named act.

The cost is one named factory per call site, and it is the right trade.

The other three guards (§ 6.1) are the opposite: they default to silent
passthrough and are omittable, because their absence is a smaller surface
rather than an absent guarantee. All four are non-optional in the resolved
runtime structure (§ 6.3).

---

## 6. API surface sketch

Illustrative, not final. The seams (§7) are the binding part; names and
option spellings are revisable.

### 6.1 Seams

Four guard seams, not one. They have different signatures, lifecycles, and
blast radii, and collapsing them makes the SSRF-critical decision harder to
audit.

| Seam | Runs | Governs |
|---|---|---|
| **address guard** | per hop, before connect | scheme + resolved address. The SSRF boundary. |
| **request guard** | per attempt | method, headers, body |
| **response headers guard** | after headers, before body | status, content-type, content-length, `set-cookie` |
| **response body guard** | after the size cap, on the buffered body | body shape/content |

The **address guard** is named separately because it is the one whose failure
is catastrophic. Keeping it small and separately nameable is what makes "did
the SSRF check run, and run correctly?" answerable by reading one
implementation rather than auditing a general-purpose request policy.

The **response guard splits by phase** because § 9's size cap runs *during*
the read. A single response guard wanting the body would either receive the
stream — leaving the cap unenforced — or run post-buffer, too late to help
against a hostile multi-gigabyte response. The headers half is also the more
valuable half: it rejects before the body is paid for, and it catches a
server returning an HTML error page with a `200`.

The **request guard rejects; it does not sanitize.** Silently rewriting a
caller's headers or body inside a fetch primitive means the caller no longer
knows what was sent. Either reject, or return an explicit transformed request
the caller can observe.

There is deliberately **no separate redirect guard.** § 4's finding is that
redirect handling and the address check are *one* mechanism; a second seam
re-opens exactly that hazard by creating another place that decides whether a
hop may proceed. Redirect **policy** (max hops, follow-or-not, credential
stripping) is configuration; the per-hop **check** is the address guard.

```typescript
/** One hop in a redirect chain. Entry 0 is the caller's original request. */
export interface IRequestHop {
  readonly url: URL;
  /** The redirect status that produced the NEXT hop; absent on the current one. */
  readonly status?: number;
  /** The address actually connected to on this hop, when pinning was in effect. */
  readonly connectedAddress?: string;
}

/**
 * Decides whether a connection may be made. Invoked once per redirect hop,
 * never only on the initial URL.
 * @public
 */
export interface IAddressGuard {
  /** Stable identifier, surfaced in `blocked-by-guard` failures. */
  readonly name: string;

  /**
   * @param chain - every hop so far, oldest first. The URL under consideration
   *                is the last entry; `chain.length === 1` is the initial
   *                request. There is no separate "is this a redirect" flag —
   *                hop 0 is not a special case.
   */
  check(chain: ReadonlyArray<IRequestHop>): Promise<Result<IGuardVerdict>>;
}

/** @public */
export interface IRequestGuard {
  readonly name: string;
  /** Reject-only. To alter the request, return an explicit replacement. */
  check(request: ISaferFetchRequest, chain: ReadonlyArray<IRequestHop>): Promise<Result<ISaferFetchRequest>>;
}

/** @public */
export interface IResponseHeadersGuard {
  readonly name: string;
  /** Runs before any body bytes are read, so a rejection costs nothing. */
  check(headers: ISaferFetchResponseHead, chain: ReadonlyArray<IRequestHop>): Promise<Result<true>>;
}

/** @public */
export interface IResponseBodyGuard {
  readonly name: string;
  /** Runs on the buffered body, after the § 9 size cap has been enforced. */
  check(body: Uint8Array, head: ISaferFetchResponseHead): Promise<Result<true>>;
}

/** @public */
export interface IGuardVerdict {
  /** The URL cleared for request. Guards may normalize; they must not retarget. */
  readonly url: URL;

  /**
   * The address the guard validated and to which the connection SHOULD be
   * pinned. **Always `undefined` in v1** — reserved for the pinned-connect
   * work that closes the DNS-rebinding hole (§ 13). A transport that receives
   * a defined value it cannot honor MUST fail rather than connect by hostname.
   */
  readonly pinnedAddress?: string;
}

/**
 * Performs the actual request. Injectable so the pinned-connect
 * implementation can be dropped in without a signature change — and so the
 * guard is testable without a live server (§ 15).
 * @public
 */
export interface IFetchTransport {
  readonly name: string;
  fetch(url: URL, init: RequestInit, hints: IFetchTransportHints): Promise<Response>;
}

/** @public */
export interface IFetchTransportHints {
  readonly pinnedAddress?: string;
}

/**
 * Wraps `globalThis.fetch`. Fails loudly if asked to honor a
 * `pinnedAddress`, rather than silently connecting by hostname.
 * @public
 */
export const platformFetchTransport: IFetchTransport;
```

#### Why the address guard sees the chain, not a hop count

Three things are inexpressible from a counter plus the previous origin:

1. **Credential re-attachment across a laundering hop.** `A` (authenticated)
   → `B` → `A`. A check comparing only against the immediately previous hop
   finds the final hop same-origin with `A` and re-attaches credentials —
   even though `B` observed the redirect in between. Only the chain shows the
   intervening origin. This is a real leak class and it reviews as correct.
2. **Loop and oscillation detection.** `A→B→A→B` never fails a per-hop check
   while consuming the entire hop budget.
3. **Monotonic strictness.** "Once we have left the original origin, never
   accept a private address" is a statement about history, not one hop.

`status` is carried because `307`/`308` preserve method and body where
`301`/`302` may not, which the request guard needs. `connectedAddress` is
carried because the pin is per-hop, so the chain is where the rebinding
defense's evidence lives.

**The chain is guard-visible, not caller-visible by default.** § 8 notes that
the failure taxonomy is an internal-network scanning oracle (L4); a full
redirect chain with per-hop resolved addresses is a substantially richer one.
Guards receive it; callers get it only on explicit opt-in, never echoed
automatically into a returned failure.

#### Named response-headers guards

Content-type gating is the one policy guard worth shipping a factory for,
rather than leaving every consumer to write it:

```typescript
/** @public */
export function allowContentTypes(types: ReadonlyArray<string>): IResponseHeadersGuard;
```

**Rejecting on `Content-Type` is strictly cheaper than capping mid-read** — it
costs a header comparison instead of a partial body transfer — so a URL-ingestion
consumer wants it on every call.

The parse is **not trivial in the way it looks**, which is the argument for
owning it once. `text/html; charset=utf-8` must match `text/html`. Matching is
case-insensitive on both type and subtype. `text/*` wildcards need to work.
Parameters must be stripped, not string-matched around. Every hand-rolled
version gets a different subset of these right, and the failure is silent —
a document is rejected, or worse accepted, for reasons the caller never sees.

This deliberately **replaces** an earlier `acceptContentTypes?: string[]`
option. The option predated the four-seam split; once response-headers guards
exist, having both would be two mechanisms for one job.

Note the guard runs *before* any body bytes are read, so a rejection costs
nothing beyond the headers — which is what makes it the right layer for this.

#### Named address guards

The address guard is **required** and has **no default** — see § 6.2. That
does not mean hand-writing one:

| Factory | Posture |
|---|---|
| `blockPrivateNetworks()` | **Recommended.** Blocks loopback, link-local (`169.254.0.0/16` — the cloud metadata endpoint), RFC1918, CGNAT (`100.64.0.0/10`), multicast and reserved, plus every encoding bypass tabulated in § 3: IPv4-mapped IPv6, NAT64, decimal/octal literals, `0.0.0.0`. |
| `blockPrivateNetworks({ allowLoopback: true })` | The local-sidecar case, including this repo's own Ollama path (§ 13, L6). |
| `allowAnyAddress()` | Escape hatch for tests and trusted-input paths. Deliberately named to be uncomfortable in review. The only correct choice in the browser, where DNS resolution and redirect interposition do not exist. |

An options bag rather than a name per combination
(`blockPrivateNetworksExceptLoopback()`, …) because the combinations
multiply, while `allowLoopback: true` greps as well as a distinct name and
keeps one canonical entry point.

`allowAnyAddress()` ships despite being a footgun: it is needed for tests and
trusted paths, and omitting it guarantees consumers hand-roll something
worse. Better that the no-guarantee case have a name that indicts itself at
the call site than be reachable by accident.

### 6.2 Options

```typescript
/** @public */
export interface ISaferFetchOptions {
  /**
   * **Required, with no default.** A passthrough default here would be exactly
   * the failure this document's north star names — a primitive advertising a
   * guarantee it does not have. Requiring it makes that a *compile* error
   * rather than a runtime failure or a lint rule. Pick a named factory
   * (§ 6.1); `allowAnyAddress()` is the explicit opt-out.
   */
  readonly addressGuard: IAddressGuard;

  /**
   * Policy guards. Optional here and **non-optional in the resolved runtime
   * structure** — each defaults to silent passthrough, applied once at
   * initialization (§ 6.4). Their absence is a smaller surface, not an absent
   * guarantee, which is why they may default where `addressGuard` may not.
   */
  readonly requestGuard?: IRequestGuard;
  readonly responseHeadersGuard?: IResponseHeadersGuard;
  readonly responseBodyGuard?: IResponseBodyGuard;

  readonly method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string | Uint8Array | undefined;

  /**
   * Header names to drop on a cross-origin redirect hop, in addition to
   * the always-stripped `authorization` / `cookie` / `proxy-authorization`.
   */
  readonly sensitiveHeaders?: ReadonlyArray<string>;

  /** Overall deadline covering redirects, retries, and the body read. Default 30_000. */
  readonly timeoutMs?: number;
  /** Deadline to first response headers, per attempt. Default 10_000. */
  readonly headersTimeoutMs?: number;

  /** Cap on decoded response bytes. Default 5 MiB. */
  readonly maxResponseBytes?: number;

  /**
   * `'validate-each-hop'` (Node default) walks hops through the guard.
   * `'reject'` fails on any 3xx — the only mode with an equivalent
   * guarantee on both runtimes.
   * `'follow-unvalidated'` defers to the platform; browser default,
   * **never** available on Node.
   */
  readonly redirectPolicy?: 'validate-each-hop' | 'reject' | 'follow-unvalidated';
  readonly maxRedirects?: number;              // default 5

  readonly retry?: IRetryPolicy;               // default: no retries
  readonly transport?: IFetchTransport;        // default platformFetchTransport
  readonly signal?: AbortSignal;
  readonly logger?: Logging.ILogger;

  // NOTE: content-type gating is NOT an option here. It is a response-headers
  // guard — `allowContentTypes([...])` (§ 6.1). The option predated the
  // four-seam split and would have been a second way to do the same thing.
}
```

### 6.3 Guards resolve once, at initialization

Guards are optional in the public params and **non-optional in the resolved
runtime structure**. Defaults are applied once, at the boundary, and no code
path downstream branches on a guard's absence.

```typescript
/** Resolved once at init; every field concrete from here down. */
interface IResolvedGuards {
  readonly address: IAddressGuard;                 // caller-supplied; no default
  readonly request: IRequestGuard;                 // passthrough by default
  readonly responseHeaders: IResponseHeadersGuard; // passthrough by default
  readonly responseBody: IResponseBodyGuard;       // passthrough by default
}
```

This is the idiom `FileTreeMemoryStore.create()` already uses
(`params.codecs ?? new Map()`, `params.clock ?? Date.now`,
`params.logger ?? new NoOpLogger()`): resolve at the boundary, store concrete,
never branch again. It avoids spraying `if (!guard) { … }` through call paths
where defaults become hard to find and easy to get subtly wrong.

Corroborating evidence from this repo: PR #582's `_resolveIndex` was a defect
*in* a resolve-at-init step — it tested `!== undefined` where its eight
sibling params used `??`, so a `null` passed straight through and installed
itself as the store's index. That argues *for* centralizing: there was exactly
one place to get wrong, so there was exactly one place to find and fix. The
same defect distributed across call sites would have been found partially.

It also has a testing consequence worth noting in sizing (§ 14): each default
is tested once as an implementation, rather than "guard omitted" being a case
to cover at every call site.

---

### 6.4 Entry points

Three named functions rather than one function with a mode discriminant —
each returns its narrow type with no union for the caller to unwrap,
matching the repo's `callProviderEmbedding` / `callProviderImageGeneration`
style. All three delegate to one internal implementation.

```typescript
export function saferFetchJson<T = JsonValue>(
  url: string | URL,
  options: ISaferFetchOptions & { converter?: Converter<T> }
): Promise<DetailedResult<ISaferFetchResponse<T>, FetchFailureReason>>;

export function saferFetchText(
  url: string | URL,
  options: ISaferFetchOptions
): Promise<DetailedResult<ISaferFetchResponse<string>, FetchFailureReason>>;

export function saferFetchBytes(
  url: string | URL,
  options: ISaferFetchOptions
): Promise<DetailedResult<ISaferFetchResponse<Uint8Array>, FetchFailureReason>>;

/** @public */
export interface ISaferFetchResponse<T> {
  readonly value: T;
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  /** Every URL requested, in order. `[0]` is the caller's; later entries are hops. */
  readonly urlChain: ReadonlyArray<string>;
  readonly bytesRead: number;
}
```

`urlChain` is deliberately part of the success value: a caller that
allowlisted `api.example.com` and got redirected to `cdn.example.com`
(also allowlisted) usually wants to know.

The optional `converter` on `saferFetchJson` lets a caller go from wire to
validated `T` in one step, per `CODING_STANDARDS` § Type-Safe Validation.
Without it the value is `JsonValue` and the caller validates.

---

## 7. The additive pinned-IP seam

**This is the most important API-shape constraint in the design.** The
consumer has accepted a documented DNS-rebinding limit on the condition
that closing it later is additive, not breaking. That condition is met by
the two seams above — and the brief's suggested framing ("an option or a
swappable resolver") is, on inspection, **insufficient on its own**.

### Why a swappable resolver is not enough

The rebinding attack is:

```
guard: resolve("evil.example")  → 93.184.216.34   (public — allowed)
       fetch("https://evil.example/…")
                     ↑ re-resolves → 169.254.169.254  (private — connected)
```

Swapping the resolver changes only the **first** line. The second line
still hands a *hostname* to `fetch`, and `fetch` resolves it again through
the platform resolver, which the injected resolver does not control. A
design that provides only a resolver seam has provided a seam through
which the hole cannot be closed.

### What actually has to be swappable

Closing the hole requires connecting to a **specific address** while
preserving SNI and `Host` for TLS and virtual hosting. On Node that means
an `undici` `Agent` with a custom `connect`, or an equivalent. That is a
property of the **transport**, not the resolver.

So both of these must exist in v1, unused:

1. **`IGuardVerdict.pinnedAddress?: string`** — the channel by which a
   future guard tells the transport which address it validated. Optional
   from day one; populating it later is additive.
2. **`IFetchTransport`** — the injectable performer of the request. If v1
   hard-codes `globalThis.fetch`, then a future pinned implementation has
   to change how callers configure the primitive, which is exactly the
   breaking change the consumer asked to avoid.

Of the two, **the transport seam is load-bearing**. Ship the seam even
though `platformFetchTransport` is the only implementation.

### The safety interlock

`platformFetchTransport` must **fail** when handed a defined
`pinnedAddress`:

```typescript
if (hints.pinnedAddress !== undefined) {
  return fail(
    `platformFetchTransport cannot honor pinnedAddress ${hints.pinnedAddress}: ` +
    `it connects by hostname. Use a pinning transport or a guard that does not pin.`
  );
}
```

The alternative — ignoring the hint — means a future deployment that wires
a pinning guard but forgets the matching transport gets **exactly the
rebinding exposure it thought it had closed**, silently. A primitive that
advertises a guarantee it does not have is worse than no primitive; that
applies to future versions of itself.

---

## 8. Failure taxonomy

The local precedent is `ts-extras/src/packlets/ai-assist/jsonResponse.ts`:
the `found` / `unclosed` / `none` scan-result union, and the newer
`JsonParseFailureReason` (`kind` discriminant + per-kind payload fields,
`'unknown'` as an honest catch-all rather than a guess). This follows both.

```typescript
/** @public */
export type FetchFailureReason =
  | { readonly kind: 'invalid-url'; readonly url: string; readonly detail: string }
  | { readonly kind: 'blocked-by-guard'; readonly url: string; readonly hop: number;
      readonly guard: string; readonly detail: string }
  | { readonly kind: 'redirect-rejected'; readonly url: string; readonly status: number }
  | { readonly kind: 'redirect-opaque' }
  | { readonly kind: 'too-many-redirects'; readonly hops: number; readonly limit: number }
  | { readonly kind: 'timeout'; readonly phase: 'headers' | 'body' | 'overall';
      readonly elapsedMs: number; readonly limitMs: number }
  | { readonly kind: 'aborted' }
  | { readonly kind: 'network'; readonly detail: string }
  | { readonly kind: 'http-status'; readonly status: number;
      readonly statusText: string; readonly bodyPreview?: string }
  | { readonly kind: 'too-large'; readonly bytesRead: number; readonly limit: number;
      readonly declared?: number }
  | { readonly kind: 'unsupported-content-type'; readonly contentType?: string;
      readonly accepted: ReadonlyArray<string> }
  | { readonly kind: 'decode'; readonly detail: string }
  | { readonly kind: 'parse'; readonly detail: string }
  | { readonly kind: 'unknown'; readonly detail: string };
```

Notes:

- `aborted` (caller's signal) is distinct from `timeout` (our deadline).
  Conflating them makes "did the user cancel or did we give up?"
  unanswerable, and they need opposite handling.
- `timeout.phase` distinguishes slowloris (`'body'`) from an unresponsive
  host (`'headers'`) from a retry budget consumed by redirects
  (`'overall'`). Same class as `JsonParseFailureReason`'s per-kind payload.
- `too-large.declared` records what `Content-Length` claimed, present only
  when the header was sent. `declared` far below `bytesRead` is direct
  evidence of a hostile server (AC2) and worth surfacing.
- `bodyPreview` on `http-status` is length-capped and opt-in. Error bodies
  routinely contain request echoes and tokens.
- `'unknown'` follows the `jsonResponse.ts` precedent: report nothing
  rather than guess.

### Carrier: `DetailedResult<T, FetchFailureReason>`

`DetailedResult` is the repo's existing vehicle for "failed, and here is a
machine-readable reason," it has a Jest matcher (`toFailWithDetail`), and
callers who do not care call `.asResult` per `CODING_STANDARDS`.

**One real cost, verified:** `DetailedResult` is tagged `@beta` in
`ts-utils`, and API Extractor emits `ae-incompatible-release-tags` when a
`@public` symbol references it — `libraries/ts-utils/etc/ts-utils.api.md`
already carries dozens of these baked-in warnings from `ResultMap`. Using
it here adds more to `ts-extras.api.md`. That is the same class of
checked-in-api.md liability `CODE_REVIEW_CHECKLIST.md` § Documentation
calls out for `ae-unresolved-link`.

Alternative considered: `Result<ISaferFetchOutcome<T>>` where the outcome
carries `{ ok: true, value } | { ok: false, reason }`. This avoids the
release-tag warnings but produces double unwrapping at every call site and
makes `Result`-chaining awkward — a failed fetch would be a *successful*
`Result`, which inverts the repo's central idiom. Rejected, but the
release-tag cost is retired by D-2, which promotes `DetailedResult` to `@public` in `ts-utils` ahead of this work.

### The taxonomy is itself a security-relevant surface

A detailed `blocked-by-guard` failure — naming the URL, the hop, and why —
is an **internal-network scanning oracle** if it reaches an untrusted
user. An attacker submits `http://10.0.0.7:9200/` and learns from the
error whether the host resolved, whether it was private, and which hop
failed. The taxonomy's precision is exactly what makes it dangerous here.

Mitigation is documentation plus one affordance, not truncation:

- Every entry point's TSDoc states: **do not echo `FetchFailureReason`
  detail to an untrusted caller.** Log it; return a generic message.
- The detail is structured, so a caller can map to a coarse public code
  (`kind` only) trivially. The affordance is that it is *easy* to be safe,
  not that safety is imposed.

---

## 9. The streaming size cap

`Content-Length` is a **fast-reject path only**. It is absent on chunked
responses, and under AC2 it is a value the adversary chooses. The cap must
count bytes as they are read.

```typescript
// 1. Fast reject — costs nothing, catches the honest case.
const declared = parseContentLength(response.headers.get('content-length'));
if (declared !== undefined && declared > limit) {
  return failWithDetail(…, { kind: 'too-large', bytesRead: 0, limit, declared });
}

// 2. Content-type gate — before the body is touched.
if (!contentTypeAccepted(response.headers.get('content-type'), accepted)) {
  await response.body?.cancel();
  return failWithDetail(…, { kind: 'unsupported-content-type', … });
}

// 3. Count during read.
const reader = response.body.getReader();
const chunks: Uint8Array[] = [];
let total = 0;
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  total += value.byteLength;
  if (total > limit) {
    await reader.cancel();                       // release the socket
    return failWithDetail(…, { kind: 'too-large', bytesRead: total, limit, declared });
  }
  chunks.push(value);
}
```

Four points the naive version misses:

1. **`reader.cancel()` on overflow is not optional.** Returning without
   cancelling leaves the response body unconsumed; the connection is not
   released and the transfer may continue. On a deliberately huge response
   that turns a size-cap "rejection" into the exact resource exhaustion the
   cap exists to prevent (A3).
2. **The cap counts *decoded* bytes; `Content-Length` counts *encoded*
   bytes.** The platform transparently decompresses `Content-Encoding`, so
   `response.body` yields post-decompression data. A 2 KB gzip that expands
   to 10 GB passes the fast-reject and then trips the cap after `limit`
   decoded bytes — which is correct, and is the decompression-bomb defense
   — but it means the two numbers are not comparable, and
   `too-large.declared` must be read as "what the wire claimed," not "how
   big it was."
3. **The content-type gate runs before the body read**, so an HTML error
   page never gets buffered on a JSON call (A4), and the failure names the
   type rather than surfacing a JSON parse error twenty frames away.
4. **The body read is inside the overall deadline.** A response that
   dribbles one byte every 25 s passes every per-read check and never
   trips a connect timeout. The overall deadline is what stops it. See
   §10.

`saferFetchBytes` concatenates once at the end (`total` is known, so one
allocation). `saferFetchText` decodes with `TextDecoder` honoring the
charset parameter, failing as `{ kind: 'decode' }` on an unknown charset
rather than silently mojibake-ing to UTF-8.

---

## 10. Timeouts

Two knobs, one deadline.

- **`timeoutMs` (default 30 000)** — an **overall deadline** covering DNS,
  connect, TLS, every redirect hop, every retry attempt, and the body
  read. Retries consume it and do **not** reset it. Without this rule
  `{ timeoutMs: 30_000, retry: { attempts: 3 } }` silently becomes a
  two-minute call, which is the sort of surprise that gets a primitive
  banned from a codebase.
- **`headersTimeoutMs` (default 10 000)** — per attempt, to first response
  headers. Distinguishes "host is not answering" from "host is answering
  slowly," which the taxonomy then reports as `timeout.phase`.

Implementation: compose the caller's signal with a deadline signal
(`AbortSignal.any([...])` where available). Aborting after headers are
received cancels the body stream, which is what makes the body-phase
deadline effective.

**Runtime requirement to confirm at implementation time:**
`AbortSignal.any` is Node 20.3+ / Chrome 116+ / Safari 17.4+ / Firefox
124+. The repo requires Node 20 LTS, and `crypto-utils` already documents
browser minimums for `HpkeProvider`, so stating a minimum is precedented.
If the floor proves too high, the fallback is manual `AbortController`
plumbing — a few lines, no API change. This is a note to the implementer,
not a claim.

An **idle/inactivity timeout** (no bytes for N ms) is a genuinely better
slowloris defense than an overall deadline, and is deliberately deferred:
it is additive (a new optional field), and two knobs are enough for v1.

---

## 11. Retry

**Off by default.** A primitive that silently retries changes the
semantics of every call site and amplifies load against a service that is
already struggling. Opt in.

```typescript
/** @public */
export interface IRetryPolicy {
  readonly attempts: number;                 // additional attempts, not total
  readonly baseDelayMs?: number;             // default 250
  readonly maxDelayMs?: number;              // default 5_000
  readonly retryNonIdempotent?: boolean;     // default false
  readonly respectRetryAfter?: boolean;      // default true
}
```

Rules, each of which is a decision:

- **Retryable:** `{ kind: 'network' }`, `{ kind: 'timeout' }`, and
  `http-status` in `{408, 429, 500, 502, 503, 504}`.
- **Never retryable:** `blocked-by-guard`, `invalid-url`, `too-large`,
  `unsupported-content-type`, `aborted`, `parse`, `decode`,
  `too-many-redirects`, and every other 4xx. Retrying a guard block cannot
  succeed; retrying `too-large` re-downloads up to the cap each time,
  turning a defense into an amplifier.
- **Idempotency:** retry only `GET` / `HEAD` unless
  `retryNonIdempotent: true`. A retried `POST` after a timeout can
  double-charge — the timeout does not tell you whether the server
  processed the request.
- **The guard re-runs on every attempt, from hop 0 — a full re-walk, not a
  resume.** This is the single most important rule in this section, and the
  reasoning is worth stating rather than asserting.

  Reusing a prior attempt's verdict would make retry its own rebinding
  vector. The attacker needs the guard check to pass once and the connect to
  land on a private address; caching the verdict across `N` attempts gives
  them `N` connects against **one** check, multiplying their odds by the
  retry count. Retries are also *delayed*, and a delay is precisely when a
  short-TTL rebind lands. This matters **more** while pinned-connect is
  deferred (§ 13), not less — the whole reason the hole is survivable today
  is that a single connect is a single roll.

  A resume is insufficient for a second, independent reason: **the redirect
  chain is not stable across attempts.** Attempt 2's server may return a
  different `Location` than attempt 1's. Revalidating only the current hop
  would validate a chain the request no longer follows. So a retry restarts
  the walk at hop 0 and revalidates every hop it then encounters.

  Consequence for the budget: retries are *more* expensive than a naive
  implementation would suggest, because each carries full re-resolution.
  That cost is deliberate and must not be optimized away by caching.
- **`Retry-After`** honored on 429/503 (delta-seconds or HTTP-date),
  clamped to `maxDelayMs` — it is an AC2-controlled header, so an
  unclamped `Retry-After: 86400` is a denial-of-service on the caller.
- **Backoff:** exponential with full jitter.
- **The overall deadline is the ceiling.** If the remaining budget is less
  than the computed delay, fail now rather than sleep past the deadline.

---

## 12. Defaults and their justification

Every default is a security posture. None is "whatever the platform does."

| Option | Default | Justification |
|---|---|---|
| `addressGuard` | **none — required** | §5.5. The one mechanism that reliably prevents an implied-but-absent guarantee. Omission is a compile error. |
| `requestGuard` / `responseHeadersGuard` / `responseBodyGuard` | passthrough | §6.3. Policy, not guarantee; resolved at init so no call path branches on absence. |
| scheme | `https:` only | `http:` is AC4-exposed and is the scheme every SSRF payload reaches for. Opt in with `allowInsecureHttp`. |
| ports | `{443}` (`{80,443}` with insecure HTTP) | Non-standard ports on an allowlisted host are overwhelmingly an internal service. |
| `timeoutMs` | `30_000` | Comfortably above a slow-but-real API; far below "a hung request pins a socket for minutes." Streaming LLM calls should not use this primitive — that is `ai-assist`. |
| `headersTimeoutMs` | `10_000` | A host that has not sent headers in 10 s is not answering. |
| `maxResponseBytes` | `5 MiB` | Roughly an order of magnitude above any realistic JSON API response, well below a size that threatens a Node heap. Raising it is a deliberate act; large downloads want a streaming entry point (deferred), not a bigger buffer. |
| `maxRedirects` | `5` | Legitimate chains are 1–2 (canonicalization, then CDN). Browsers allow 20; that budget exists for the open web, not for a server-side API client. Each hop is a fresh guard evaluation and a fresh chance to be wrong. |
| `redirectPolicy` | `'validate-each-hop'` (Node) / `'follow-unvalidated'` (browser) | The Node default is the only one that keeps the guard meaningful. The browser default reflects what the platform actually does — naming it `'follow-unvalidated'` rather than `'follow'` keeps the honesty at the type level. |
| `retry` | none | §11. |
| `transport` | `platformFetchTransport` | §7. |
| credential stripping | always on for cross-origin hops | §4. Opt out per call, loudly. |
| `bodyPreview` on errors | off | Error bodies routinely echo request content, including tokens. |

---

## 13. Stated limits

Each of these is a hole in a guarantee we are making. They belong in the
README, not only here.

### L1 — DNS rebinding (chief among them)

**The guard validates a resolved address; the transport then re-resolves.**
Hostile DNS (AC3) can answer the guard's lookup with a public address and
the connect's lookup with a private one, and the guard is bypassed.

- **Accepted as a documented limit** by the consumer.
- **Fully closing it** requires resolving once and connecting to the
  pinned address with `Host`/SNI preserved.
- **The seam is designed now** (§7): `IGuardVerdict.pinnedAddress?` plus
  `IFetchTransport`. Populating the field and shipping a pinning transport
  is additive.
- **Interlock:** `platformFetchTransport` fails rather than silently
  ignoring a pin it cannot honor.
- **Residual risk today:** a caller who allows arbitrary hostnames is
  exposed. A caller using a strict host allowlist is exposed only if an
  allowlisted host's DNS is hostile — a much smaller surface, and the
  reason a host allowlist is the recommended posture rather than
  address classification alone.

### L2 — The browser has no SSRF guard at all

Not a partial guarantee — an absent one, for the structural reasons in
§5.1. The browser's real controls are CORS and network position. See the
§5.4 table.

### L3 — Time-of-check/time-of-use beyond DNS

Even with pinning, an allowlisted host can be compromised between the
guard's decision and the response. The guard authorizes a *destination*,
never the *content* that comes back.

### L4 — The failure taxonomy is an information-disclosure surface

§8. Detailed guard failures are an internal-network scanning oracle if
echoed to an untrusted user. Documented, with a structured shape that
makes coarsening easy.

### L5 — No egress accounting

No per-host rate limiting, connection pooling policy, or quota. A retry
policy is not a rate limiter. Deployments needing these have them at a
different layer.

### L6 — Loopback is blocked by default, and this repo has a loopback consumer

The guard rejects `127.0.0.0/8` and `::1`. But this repo's own documented
local-development path is `http://localhost:11434/v1` for Ollama, and
`@fgv/ts-extras-ollama` plus the `ollama` / `openai-compat` provider
descriptors depend on it.

The two are reconciled by making it explicit rather than by weakening the
default: a caller who wants loopback constructs a guard that says so
(`blockPrivateNetworks({ allowLoopback: true, allowInsecureHttp: true,
allowHosts: ['localhost'], allowPorts: [11434] })`). Blocking loopback by
default and requiring an opt-in for the local-dev case is the right
polarity; the wrong polarity ships a guard that permits
`http://127.0.0.1:6379/` so that a dev-time convenience keeps working.

**This is a real interaction that would have surfaced painfully during
implementation**, and it is the concrete reason D-5 settles the polarity now
before code is written.

### L7 — HTTP semantics not implemented

No cookie jar, no cache, no conditional requests, no `Expect: 100-continue`,
no proxy configuration beyond what the platform picks up from the
environment. Callers needing these want a full HTTP client.

---

## 14. Phasing

Design only; no implementation stream is commissioned by this document.
When one is, this ordering keeps each step independently reviewable.

1. **Core, runtime-agnostic.** Types, `FetchFailureReason`, seams,
   `platformFetchTransport` (with the pin interlock), timeout composition,
   streaming cap, content-type gate, the three entry points.
   `allowAnyAddress()`. No redirects yet — `redirectPolicy: 'reject'` only.
   Testable entirely against a mock transport.
2. **Redirect walk.** `'validate-each-hop'`, method/body rewriting,
   credential stripping, hop cap. Ships together with a guard that has
   something to say, because half of this is not shippable (§4).
3. **`blockPrivateNetworks()`.** Address parsing and classification (§3.6),
   host/port/scheme allowlists, DNS resolution, reject-if-any-address-
   disallowed. The classification table is the test matrix.
4. **Retry.** Additive; the taxonomy already distinguishes retryable from
   not.
5. **Browser entry point** in `ts-web-extras`, plus the §5.4 guarantee
   table in both READMEs.
6. **`LIBRARY_CAPABILITIES.md` entry** — under "Specialized utilities" and
   in "Decision shortcuts," explicitly **not** in the "Result-integration
   boundary" list (§1).

Deferred, additive, not in v1: streaming entry point for large downloads;
inactivity timeout; pinned-connect transport; migration of the four
`ai-assist` sites (D-4).

---

### 14.1 Implementation sizing

**Estimate: 4–5 agent sessions**, against a baseline where a well-scoped
additive stream in this repo (#582, #585, #586) is one session each. This is
greenfield with adversarial semantics, so it is not one of those.

| Piece | Est. | Notes |
|---|---|---|
| Runtime-agnostic core | ~1 | Timeout, streaming cap, content gate, taxonomy, guard orchestration |
| `blockPrivateNetworks()` + adversarial tests | **1–2** | The dominant and least predictable cost |
| Browser package + its stated non-guarantees | ~0.5 | Mostly docs; the code is the core minus the guard |
| Packaging, `api.md`, change files, README | ~0.5 | Packlets per D-1, so the lower end |
| Review loops | ~1 | Security-sensitive; expect layer 2 to be substantive, not nitpicky |

**The dominant cost is the adversarial test matrix, not the production code.**
Every row of § 3's bypass table — IPv4-mapped IPv6, NAT64, decimal and octal
literals, `0.0.0.0`, CGNAT, multi-record hostnames — is a required test at this
repo's 100% coverage bar, as is each `A → B → A` credential case from § 6.1.

**The largest risk was retired by the design, not deferred.** The open question
in early sizing was how to exercise a `302` to `169.254.169.254`, or a chunked
response with a lying `Content-Length`, without standing up a live server.
`IFetchTransport` (§ 6.1) is injectable, so the guard and the cap are testable
in-process. Had the transport seam not been needed for pinned-connect, it would
have been worth adding for testability alone.

**What still moves the number**, all of them open questions rather than
decisions rather than unknowns, and all three are now settled: D-1 takes
packlets (the cheaper end), D-8 keeps the browser package (roughly half a
session), and D-7 keeps retry with a cut trigger — so if § 11's idempotency
interactions bite, the estimate drops rather than grows. **Call it 4–5, with
D-7 the only piece that can move it down.**

One item sits *outside* this estimate: D-2's promotion of `DetailedResult` to
`@public` in `ts-utils` is a prerequisite in a different package — small and
mechanical, but it is not free and it is not part of these sessions.

Two things that do *not* move it: the four-seam split is roughly neutral, since
resolve-at-init (§ 6.3) removes the guard-absent branch from every call path in
exchange for the extra interfaces; and pinned-connect is explicitly **not** in
this estimate — it is listed above as deferred and additive, gated on whether
the documented DNS-rebinding limit (§ 13) stands.

---

## 15. Testing notes

100% coverage is required; more relevantly, the interesting cases here are
adversarial and none of them require a network.

- **`IFetchTransport` is the test seam.** A mock transport scripts status,
  headers, and body chunks per call, which makes redirect chains,
  `Content-Length` lies, decompression-bomb shapes, and slowloris
  (a body stream that yields slowly) all unit-testable. This is a second
  reason the transport seam earns its place, independent of §7.
- **The §3.6 bypass table is the guard's test matrix**, one case per row,
  plus each rejected CIDR at its boundaries.
- **The redirect tests must assert credential stripping**, not just that
  the hop was guarded. Per `TESTING_GUIDELINES.md`'s canonical
  observation, coverage tools measure the lines you have and cannot flag
  the test class you are missing — "does the second request still carry
  the bearer token?" is exactly that class.
- **Assert `reader.cancel()` is called** on the `too-large` path. The
  failure returns correctly whether or not it cancels; only an explicit
  assertion catches the leak.
- Use `toFailWithDetail` for taxonomy assertions.
- **Live-network tests do not belong in the unit suite.** A guard test
  that resolves a real hostname is a test that fails in CI for reasons
  unrelated to the guard.

---

## 16. Decisions

All eight open questions were answered in review, 2026-08-01. Recorded here as
decisions; the reasoning that produced them is in Appendix B where it differs
from what was originally recommended.

**D-1 — Packlets, not sibling packages.** `safer-fetch` packlets inside
`@fgv/ts-extras` and `@fgv/ts-web-extras`, mirroring `crypto-utils` and reusing
the existing `index.ts` / `index.browser.ts` + conditional-`exports` machinery.
Zero new dependencies. Package layout in § 5.3 stands as written.

**D-2 — `DetailedResult` is promoted to `@public` in `ts-utils`.** It has not
been genuinely beta since 5.0, and the tag is the only thing that made
`DetailedResult<T, FetchFailureReason>` costly here. Promoting it removes the
`ae-incompatible-release-tags` liability at the source rather than accepting
warnings baked into `ts-extras.api.md` — and it retires the same latent cost for
every future consumer, including the dozens `ts-utils.api.md` already carries
from `ResultMap`.

**This is a prerequisite change in a different package**, small and mechanical
(release-tag edit plus `api.md` regeneration in `ts-utils`, then regeneration in
every package whose report cites it). It does not belong to the fetch
implementation stream and should land ahead of it.

**D-3 — `addressGuard` required, no default; the other three default to
passthrough.** As specified in § 5.5 and § 6.1–6.3. The unified surface is worth
the one named factory per call site. **Revisit if friction shows up in practice**
— relaxing later (adding a default) is additive and non-breaking, whereas
starting permissive and tightening is neither. The asymmetry is why this
direction is the safe one to start from.

**D-4 — Ships with no in-repo consumer.** This would not be the first feature to
do so. The repo's consumption-driven stability model is real but is in practice
satisfied by external pressure-testing: PersonAIlity and chocolate lab are the
consumers that exercise features hardest, and the testbed is the internal
validation path. A testbed scenario is therefore the substitute for an in-repo
consumer, not an optional extra — it should ship with the implementation rather
than after it.

**D-5 — Loopback blocked by the short factory name.** `blockPrivateNetworks()`
blocks loopback; `blockPrivateNetworks({ allowLoopback: true })` is the opt-in.

Note the blast radius is currently **zero**: `ai-assist` does not use this
primitive, so the Ollama path (`localhost:11434`) is unaffected by the polarity
either way. The decision matters for future call sites, not existing ones —
which is precisely why it was worth settling before any exist.

**D-6 — `maxResponseBytes` defaults to 5 MiB, and tunability is a requirement.**
If anything 5 MiB is generous for text and JSON. It will not be once media is in
scope, so the knob must be genuinely easy to reach — a per-call option, not a
construction-time-only setting, and documented at the entry points rather than
only in a defaults table. Revisit the *default* when a media use case is real;
do not revisit the *tunability*.

**D-7 — Retry stays in v1, with a pre-registered cut trigger.** It is a
convenience feature and the lift looks small; the taxonomy already distinguishes
retryable from not. **If implementation reveals it is harder than it looks — the
idempotency and budget interactions in § 11 are the likely source — cut it to v2
rather than expanding scope to accommodate it.** That decision is made now, so it
does not get relitigated under schedule pressure by whoever hits the complexity.

**D-8 — The browser package earns its keep.** Reinforced rather than weakened by
the four-seam split: the request and response guards are runtime-agnostic and
useful in the browser, so the browser surface is no longer "the core minus the
thing that matters." § 5.4's guarantee table, with its two ❌ rows, is what keeps
that honest.

---

## Appendix A — where the three findings were incomplete

Reported for the record; none turned out wrong.

**Finding 1 (redirect + guard are one feature): correct, and stronger than
stated.** Two additions. (a) A **third** part is inseparable from the same
mechanism and was not in the ask: turning on manual redirects makes *us*
responsible for stripping credential headers on cross-origin hops, a rule
the platform was previously applying. A manual-redirect loop that forgets
it reintroduces a fixed bug. (b) The coupling is not merely advisable —
`redirect: 'manual'` in the browser yields an opaque-redirect response
with an unreadable `Location`, so the coupled mechanism is not
*implementable* there. Finding 1 therefore forces finding 2, rather than
sitting beside it.

**Finding 2 (no browser guard): correct.** One sharpening in each
direction. Harder: the browser gap is not only DNS — the redirect hops are
structurally invisible (above). Softer: the browser is not a pure no-op —
`redirect: 'error'` is a genuine, enforceable guarantee, and the doc
should offer it rather than describe the browser side as guaranteeing
nothing.

**Finding 3 (DNS rebinding is the residual hole): correct, but the
prescribed seam was incomplete.** The brief specified "an option or a
swappable resolver." A swappable resolver alone cannot close the hole:
after resolving, the code still hands a *hostname* to `fetch`, which
re-resolves through the platform. The seam that must exist is a swappable
**transport/connect** (§7), because pinning is a property of the connect.
The design therefore carries **two** seams — `IGuardVerdict.pinnedAddress?`
and `IFetchTransport` — with the transport being the load-bearing one, plus
an interlock making `platformFetchTransport` fail rather than silently drop
a pin. Had the design shipped with only a resolver seam, closing the hole
later would have been the breaking change the consumer specifically asked
to avoid.

**Two findings not in the brief.** (a) The structured failure taxonomy is
itself an internal-network scanning oracle when echoed to untrusted users
— the precision that makes it useful is what makes it dangerous (L4).
(b) Blocking loopback collides with this repo's own documented Ollama
local-dev path; the collision is resolvable but the polarity of the
default needed an explicit decision before implementation (L6); settled as D-5.

---

## Appendix B — design-history record

Decisions taken during review that changed the body of this document, kept so
a later reader can see what was considered and rejected rather than only what
survived.

**Single guard → four seams (§ 6.1).** The first draft had one `IRequestGuard`
validating the URL. Erik proposed splitting it, and the split holds: the four
have different signatures, lifecycles, and blast radii, and the SSRF-critical
decision is easier to audit when it is not co-mingled with general request
policy. The response guard's phase split (headers vs. body) was not in the
proposal — it is forced by § 9's cap running *during* the read.

**A separate redirect guard was proposed and rejected.** It would have created
a second place deciding whether a hop may proceed, which is precisely the
hazard § 4 exists to close: two mechanisms where one is required, and a
reviewer unable to tell from either site whether the other ran. Redirect
policy became configuration; the per-hop check stayed in the address guard.

**Optional `isRedirect` flag → full hop chain (§ 6.1).** The intermediate
proposal was an optional parameter telling the address guard it was on a
redirect. Rejected for two reasons: an optional flag reproduces, inside every
guard implementation, the scattered-branch problem § 6.3 removes from the
core; and a boolean is insufficient regardless — the `A → B → A` credential
re-attachment case needs the whole chain, not the previous hop. Making hop 0
the chain's first entry removes the special case entirely.

**Optional/required guards → resolve-at-init (§ 6.3).** The intermediate
framing was "address guard required, others optional," with absence handled
where used. Erik's framing — all guards non-optional in the runtime structure,
differing only in whether a default is applied at init — has the same effect
with better locality. PR #582's `_resolveIndex` bug, found the same week, is
the evidence: a defect *in* a resolve step is findable precisely because there
is one of them.

**OQ-5 dissolved rather than answered.** With no ambient default, the loopback
question reduced to which posture the shorter factory name carries — settled as
D-5, with the note that its present blast radius is zero because `ai-assist`
does not consume this primitive.

---

## Appendix C — consumer validation (PersonAIlity, 2026-08-01)

The driving external consumer reviewed the design against their actual use case:
**an owner pastes a URL; the hub fetches that document server-side and ingests
its text.** Arbitrary owner-supplied hostnames, one fetch per ingestion. Recorded
because several decisions were taken *without* a consumer in hand and it matters
whether they held.

**D-3's strict polarity is validated, not merely tolerated.** They want arbitrary
hostnames but never private addresses, so `blockPrivateNetworks()` is exactly
right for them and `allowAnyAddress()` is a test-path-only affordance in their
deployment. They have **no loopback case** — `ai-assist` is a separate transport
and, per their own earlier ask, should stay one. So the decision taken before any
consumer existed is the one the first consumer wants.

**The request guard is confirmed unnecessary** for this use case. Recorded as a
negative so it does not get designed toward speculatively.

**Redirects followed with per-hop revalidation is the wanted behavior**, not a
default they would override — confirming § 4's coupling rather than pushing
against it.

**The failure taxonomy's variants are UX-driven, not structural.** Their five
cases become five different things an owner is told: *"that address isn't
allowed" / "that page is too big" / "that site didn't respond" / "that page
returned an error" / "we couldn't reach it."* A single prose message forces the
consumer to re-parse strings to choose one. This is the concrete requirement
behind the structured-failure ask, and it is a better sizing rule than
structural distinctness.

It also **converges with L4** rather than fighting it: a taxonomy sized to
user-facing messages is necessarily coarser than one sized to internal
precision, so the shape the consumer needs is also the shape that leaks least
to an internal-network scanner. Where the two ever conflict, coarser wins.

**`allowContentTypes()` (§ 6.1) originates here** — they need `text/html`,
`text/plain`, `application/pdf` accepted and everything else rejected before the
body streams.

**D-6's tunability requirement is load-bearing for them.** 5 MiB is a fine
default but real documents clear it — a scanned PDF routinely does — so they tune
per call. This confirms the knob must stay a **per-call option**, not
construction-time-only.

**Their one open question — does retry re-run the address guard — was already
answered by § 11**, but the answer was a single asserted line. It has been
expanded with its reasoning, plus a second justification they had not reached:
the redirect chain is not stable across attempts, so a retry must re-walk from
hop 0 rather than resume.

---
