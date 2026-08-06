# Finding: no other `DetailedResult` consumer is silently losing its detail

**Stream:** `ts-utils-async-detailed-result`
**Date:** 2026-08-06
**Disposition:** informational — **no follow-up work implied**. Recorded because the brief asked
for every other-package consumer found losing detail, and the honest answer is "none", which is
worth as much as a list would have been.

## What the brief expected

> If you find a consumer that is *already silently losing its detail*, **record it as a finding, do
> not fix it.**

The framing assumed there would be some. There are none.

## What the sweep found

Every `.thenOnSuccess(` / `.thenOnFailure(` call site in the repo, outside `ts-utils` itself:

| Package | call sites | references `DetailedResult`? |
|---|---:|---|
| `ts-agent-memory` | 23 | no — zero references anywhere in `src/` |
| `ts-prompt-assist` | 4 | no — zero references |
| `ts-extras` (`crypto-utils/keystore`) | 8 | no — the packlet does not use `DetailedResult` |
| `tools/ks` | 1 | no — zero references |
| **`ts-extras` (`safer-fetch`)** | **3** | **yes — and these are this stream's own conversions** |

And the five out-of-scope `DetailedResult` consumer packages, from the other direction:

| Package | non-test files using `DetailedResult` | uses the async bridge? |
|---|---:|---|
| `ts-json` | 10 | **no** — 0 call sites |
| `ts-res` | 9 | **no** — 0 call sites |
| `ts-utils-jest` | 6 | **no** — 0 call sites |
| `ts-web-extras` | 4 | **no** — 0 call sites |
| `ts-json-base` | 4 | **no** — 0 call sites |

The two sets are disjoint. **No package both carries a `DetailedResult` and chains an async step
off it**, so no detail is being dropped anywhere today.

Corroborated independently: a full `rush build` after the change produced **no API-report diff in
any package other than `ts-utils`**. Had any consumer been chaining off a detailed result, its
inferred types would have moved from `AsyncResult<T>` to `AsyncDetailedResult<T, TD>` and its
`etc/*.api.md` would have shifted. Nothing shifted.

## Why this matters more than a list would have

1. **The fix is preventive, not remedial.** Nothing in the repo is broken today and nothing needs
   repairing. A future migration stream would be *adopting a capability*, not fixing damage — which
   makes it genuinely low-priority rather than latent-bug cleanup.
2. **It explains why the bug survived.** The trap was armed but unsprung. The only consumer that
   walked into it is the one whose failure taxonomy *is* its product (`safer-fetch`), and it
   noticed immediately and recorded the constraint rather than working around it. A consumer that
   only ever widens to `Result<T>` at the boundary would never have noticed — which is precisely
   the silence that made this worth fixing in the primitive.
3. **It bounds the deferred migration to approximately nothing.** `async-result-family-design.md`
   § 7 deferred the *collectors'* in-repo migration because it is a behaviour change at three real
   call sites. This deferral is emptier than that: there is no call site to migrate.

## Adjacent observation, not a finding

`ts-agent-memory` is by far the heaviest user of the async bridge (23 sites) and uses plain
`Result` throughout. Nothing is wrong with that. It is only worth noting that if that package ever
grows a failure taxonomy, it is now the most likely next consumer of `AsyncDetailedResult`, and it
will not need a ts-utils change to get one.
