# `@fgv/ts-extras-system-one` — System-1 decision server Result boundary

> **This file is authoritative for what `@fgv/ts-extras-system-one` provides and what not to hand-roll.**
> `README.md` is getting-started material, and carries the input-bound measurements. The
> always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.

---

[libraries/ts-extras-system-one](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-system-one)

**A Result-integration boundary over [`@typesafe-ai/sdk`](https://www.npmjs.com/package/@typesafe-ai/sdk)
for `POST /v1/systemone`**, the wire spoken by CLM (`clm-serve`), openjev and TypeSafe's hosted Jev.
A System-1 server answers named `noul` / `choice` / `score` questions about a state with a
distribution over a closed candidate set — no generated text. Node-only. The backend is chosen by
`baseUrl` + `model` at the composition root; there is deliberately no fgv interface over backends.

| Primitive | Wraps | Returns |
|---|---|---|
| `createSystemOneClient({ baseUrl, model, apiKey, timeoutMs?, retry?, logger?, fetch? })` | `new TypeSafeClient(...)` | `Result<ISystemOneClient>` (opaque). Every `TYPESAFE_*` env fallback is overridden by an explicit value; `apiKey: ''` is a keyless local server. |
| `askSystemOne(client, { state, questions, inputLimit, signal? })` | `systemOne(...).withResponse()` | `Promise<DetailedResult<ISystemOneAnswer<Q>, SystemOneFailureReason>>` — `{ result, meta }`, answers typed from the questions, **no `confidence`**. |
| `listSystemOneModels(client)` | `models.list()` | `Promise<Result<ReadonlyArray<ModelCard>>>` |
| `measureSystemOneInput(state, questions)` | — | `Result<ISystemOneInputMeasure>`: the per-question and per-candidate character counts the bound uses |
| `noul` / `choice` / `score` | re-exports | the SDK's own builders — no parallel types |

**What it adds over the SDK:**

- **A mandatory input bound** (`inputLimit: { maxChars } | 'unchecked'`, a compile error to omit).
  Upstream CLM silently truncates an over-long state and loses the question; this refuses
  (`input-over-limit`) before any request, measuring what CLM actually embeds — state + 2 +
  instructions per question, and each candidate text separately. **Never hand-roll truncation** in
  front of a System-1 call. Recommended values for upstream CLM: 2,400 (unknown or ID-dense content),
  4,400 (measured prose/Markdown/code/JSON); the rule and measurements are in the README.
- **Response validation the SDK does not do**: answer ids = question ids with matching types,
  probability keys = labels / `0..n-1`, finite values in `[0, 1]` summing to 1 within `1e-3`, `score`
  in `[0, n-1]`. A mismatch is `invalid-response`. A `score` is **fractional** — the expectation
  over the levels, as the SDK documents (confirmed live on Jev: `1.73` for `p = 0, 0.27, 0.73`) — so take the level from
  `probabilities`, never by assuming an integer.
- **A total failure classification** by error class and HTTP status, never body text:
  `input-over-limit`, `invalid-request`, `unauthorized`, `rate-limited`, `server`, `connection`,
  `timeout`, `aborted`, `invalid-response` (the list is `allSystemOneFailureReasons`). Malformed input
  is `invalid-request`, never a rejection, and no failure message quotes the server's body.
- **Per-call `meta`**: answering `model`, `usage`, `elapsedMs` (including retries), `requestId`,
  unparsed `timingHeaders`.
- **Logging through an fgv `ILogger`**, never at the SDK's `debug` level (which logs request bodies),
  never to `console`.

**Probabilities are set-relative and model-specific**: a threshold tuned against one backend or
candidate set does not transfer to another.

**Dependency posture:** `@typesafe-ai/sdk` **direct**, `~0.6.0` (review every minor);
`@fgv/ts-json-base` direct (its JSON converter); `@fgv/ts-utils` peer.

**Explicitly NOT in scope:** CLM's `/v1/rank` (use `choice`); `temperature` and openjev's extensions;
a browser sibling; an `ISystemOneDecider` interface; sidecar process management; `confidence` in any
form; exact token counting; threshold policy; retries beyond the SDK's; fine-tuning; a per-call URL.

**Live status:** one live round trip recorded — hosted Jev (`jev-1.13.0`), 2026-10-08, passed. No
CLM, openjev or Ollama endpoint has been run live; `perf/systemOneLive.js probe` produces the record.

**Upstream:** `@typesafe-ai/sdk` `~0.6.0` (direct dependency).

---

## Decision shortcuts

- **Asking a System-1 decision model (CLM, openjev, Jev) a typed yes/no, choice or score question?** → `@fgv/ts-extras-system-one` (Node-only). `createSystemOneClient({ baseUrl, model, apiKey })`, then `askSystemOne(client, { state, questions, inputLimit })` with questions from `noul` / `choice` / `score`. `inputLimit` is mandatory: never truncate a state yourself.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-10-03** — A Result boundary over the TypeSafe System-1 SDK: ask Jev, openjev or a local CLM server typed noul/choice/score questions, with over-long input refused, not truncated. Verified live on Jev. ([#721](https://github.com/ErikFortune/fgv/pull/721))

<!-- END GENERATED: recent-additions -->
