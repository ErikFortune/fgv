# Brief — S2a: address classification (pure)

**Read first:** `.ai/tasks/active/safe-fetch/plan.md` and
`.claude/project/fetch-primitive-threat-model.md` — especially **§ 3's address-classification
bypass table, which is your specification and your test matrix.**

**Branch:** `safe-fetch-address-classification` from `origin/integration/safe-fetch`. PR into
`integration/safe-fetch`. **Do not merge.**

**Estimate:** 1–1.5 sessions — the largest single block in the feature. **Runs in parallel
with S1.**

---

## Scope

One module in the `safe-fetch` packlet of `@fgv/ts-extras`: a **pure** classifier answering
"is this address private / loopback / link-local / otherwise disallowed?", plus the
`blockPrivateNetworks()` / `allowAnyAddress()` factories built on it.

Pure means: **string in, verdict out.** No DNS, no transport, no entry points, no I/O, no
clock. Deterministic and synchronous.

Classification must cover, at minimum, every row of § 3:

- loopback (`127.0.0.0/8`, `::1`)
- link-local `169.254.0.0/16` — **the cloud metadata endpoint**, the single most important row
- RFC1918 (`10/8`, `172.16/12`, `192.168/16`)
- CGNAT `100.64.0.0/10`
- multicast and reserved
- `0.0.0.0` and `::`
- **IPv4-mapped IPv6** (`::ffff:169.254.169.254`)
- **NAT64** (`64:ff9b::/96`)
- **decimal and octal literals** (`2130706433`, `0177.0.0.1`)
- IPv6 zone identifiers and abbreviated forms

Ship the factories from design § 6.1:

| Factory | Posture |
|---|---|
| `blockPrivateNetworks()` | Blocks everything above. **Blocks loopback** (D-5). |
| `blockPrivateNetworks({ allowLoopback: true })` | Loopback permitted; everything else still blocked. |
| `allowAnyAddress()` | Permits everything. TSDoc must enumerate precisely what it does not do. |

Options bag rather than a name per combination — `allowLoopback: true` greps as well as a
distinct name and keeps one canonical entry point.

## Explicitly NOT in scope

- **DNS resolution.** No `node:dns`, no async. Resolution is S2b's; you classify what you are
  handed. This line is what keeps S2a and S1 parallel — hold it.
- The redirect walk, per-hop invocation, credential stripping — S2b.
- Transport, entry points, taxonomy, timeouts, size cap — S1.
- Host/port/scheme allowlists **if** they require resolution; a pure hostname/port/scheme
  allowlist is fine here.

## Definition of done

**Every row of § 3's table is a test.** Both directions: the bypass form is rejected, *and*
the legitimate public address that superficially resembles it is accepted. A classifier that
rejects everything passes a one-directional suite and is useless.

Specific traps worth naming, because they are the ones that ship broken:

- `::ffff:169.254.169.254` must classify as link-local, not as "some IPv6 address."
- `0177.0.0.1` is `127.0.0.1`. `2130706433` is `127.0.0.1`. Both must be caught.
- A hostname resolving to **multiple** addresses is disallowed if **any** is disallowed —
  reject-if-any, not allow-if-any. You will not resolve here, but the classifier's contract
  over an address *list* must express this, since S2b will hand you one.
- `100.64.0.1` (CGNAT) is private; `100.128.0.1` is public. Off-by-one on the mask is the
  classic error.

Do not reach for a third-party IP-parsing dependency. D-1 is explicit that this packlet adds
**zero** dependencies, and for a security primitive the classification is the thing we most
want to own and be able to audit.

## Coordination

You and S1 touch **no common files**. If you believe you need something S1 owns, that is a
signal the line has moved — surface it to the orchestrator rather than reaching across.
