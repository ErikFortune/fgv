# Finding: flaky test — `verifySecretFromPasswordArgon2id › returns false when salt does not match`

**Stream:** `ts-utils-async-detailed-result`
**Date:** 2026-08-06
**Disposition:** out of scope for this stream — **observed, not fixed**. Recorded because a flake
that fails one run in three will eventually block a cluster merge, and the next person to see it
should not have to re-establish that it is unrelated to whatever they are changing.

## What was observed

Test: `KeyStore Argon2id methods › verifySecretFromPasswordArgon2id › returns false when salt does
not match`
Package: `@fgv/ts-extras`, `crypto-utils/keystore` packlet.

Across three `rushx test` runs of `@fgv/ts-extras` on this branch:

| Run | Tree | Result |
|---|---|---|
| 1 | branch + safer-fetch taxonomy fix | **FAIL** |
| 2 | committed state, changes stashed | pass |
| 3 | branch + safer-fetch taxonomy fix (identical to run 1) | pass |

Runs 1 and 3 were the **same tree** with no intervening edit. That is the definition of a flake, and
it rules out this stream as the cause independently of the packlet argument below.

## Why it is not this stream

This stream touches `libraries/ts-utils/src/packlets/base/result.ts` and
`libraries/ts-extras/src/packlets/safer-fetch/`. The failing test exercises
`crypto-utils/keystore` against the `argon2` native binding. There is no code path from the changed
files to it, and `safer-fetch` coverage stayed at 100% on every one of the three runs.

## Worth a look, for whoever picks it up

The test name — "returns false when salt does not match" — suggests it may generate a random salt
and assert a *negative*. If the two salts can collide, or if the negative is asserted against a
value that is only probabilistically distinct, the flake rate would be low and non-deterministic,
which matches what was seen. Argon2id is also CPU-heavy, so a timeout under parallel Jest load is
the other obvious candidate; the failure output was not captured in enough detail to distinguish
these, and re-running to reproduce was out of scope here.

Not filed as a bug against a specific cause, because only the symptom was established.
