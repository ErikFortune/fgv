[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IRetryPolicy

# Interface: IRetryPolicy

Opt-in retry policy.

## Remarks

**Retry is off by default and has to be asked for.** A primitive that silently retries
changes the semantics of every call site and amplifies load against a service that is already
struggling.

Two rules are load-bearing rather than incidental, and are worth reading before enabling this:

**Every attempt re-runs the address guard from hop 0 — a full re-walk, never a resume and
never a cached verdict.** Reusing an earlier attempt's verdict would make retry its own
DNS-rebinding vector: an attacker needs the guard to pass once and a connect to land on a
private address, so `N` connects against **one** check multiplies their odds by the retry
count — and a retry delay is precisely when a short-TTL rebind lands. A resume is
independently wrong because the redirect chain is not stable across attempts: attempt 2's
server may answer with a different `Location`, so revalidating only the current hop would
validate a chain the request no longer follows. The consequence is that retries cost more
than a naive implementation would suggest — each carries full re-resolution — and that cost
is deliberate.

**The overall deadline is the ceiling.** Retries consume `timeoutMs` and never reset it, so
`{ timeoutMs: 30_000, retry: { attempts: 3 } }` is a thirty-second call, not a two-minute
one. When the remaining budget is shorter than the computed delay, the call fails with the
attempt's own failure rather than sleeping past its deadline.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-attempts"></a> `attempts` | `readonly` | `number` | Additional attempts after the first, **not** a total. `attempts: 2` means up to three requests. Must be a non-negative integer; `0` disables retry. |
| <a id="property-basedelayms"></a> `baseDelayMs?` | `readonly` | `number` | First backoff delay, in milliseconds, doubled per attempt before jitter. Default [SaferFetch.DEFAULT\_RETRY\_BASE\_DELAY\_MS](../variables/DEFAULT_RETRY_BASE_DELAY_MS.md). |
| <a id="property-maxdelayms"></a> `maxDelayMs?` | `readonly` | `number` | Ceiling on any single delay, in milliseconds. Default [SaferFetch.DEFAULT\_RETRY\_MAX\_DELAY\_MS](../variables/DEFAULT_RETRY_MAX_DELAY_MS.md). Also clamps a server-supplied `Retry-After`, which is the security-relevant half of its job. |
| <a id="property-respectretryafter"></a> `respectRetryAfter?` | `readonly` | `boolean` | Honors a `Retry-After` header on `429` and `503`. Default `true`. **Remarks** Always clamped to `maxDelayMs`, whatever this is set to. The header is chosen by the server, which in this threat model may be the adversary. |
| <a id="property-retrynonidempotent"></a> `retryNonIdempotent?` | `readonly` | `boolean` | Retries `POST` / `PUT` / `PATCH` / `DELETE` as well as `GET` / `HEAD`. Default `false`. **Remarks** Off by default because a timeout does not tell you whether the server processed the request: a retried `POST` after a timeout can double-charge. Turn it on for endpoints you know are idempotent — an idempotency key, a `PUT` of a whole resource — and not otherwise. |
