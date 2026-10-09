# system-one-decisions-design — Phase A: the System-1 decisions design

**Shipped**: 2026-10-02 via [PR #710](https://github.com/ErikFortune/fgv/pull/710) into `integration/system-one-decisions` (finalized at the system-one-decisions cluster close, 2026-10-08).

## Summary

Phase A decided whether and how fgv should support System-1 decision models: models that return typed
values with probabilities instead of text. CLM-8B was the driving implementation and hosted Jev the
compatibility target. The design recommends a **thin Result boundary over the vendor's own TS SDK
(`@typesafe-ai/sdk`)**, with the backend picked by `baseUrl` plus `model` at construction and **no fgv
interface**. It reports CLM-8B as **not viable on a laptop inner loop**. Every external fact carries a
verified / derived / reported / unverified marker with its source (design §2, E1–E23). Design only;
nothing was run.

## Files changed

- `docs/design/system-one-decisions/design.md` (new).
- `docs/WORKSTREAMS.md` § `system-one-decisions`.
- `.ai/tasks/active/system-one-decisions-design/` (`brief.md`, `state.md`, `result.md`), moved here at
  the cluster close. No `src/`, `package.json` or lockfile change.

## Decisions made during execution

- **Pressure test overturned.** CLM has no JS client, but the wire it implements has an official MIT
  TS SDK with zero dependencies and `baseURL`/`fetch` overrides: the `ts-extras-ollama` shape, not a
  new integration shape. `cross-runtime-interfaces.md` does not apply (it covers fgv implementations
  per runtime; here there are N remote servers).
- **No interface.** It would have one implementation and promise a semantic equivalence the backends
  lack (`confidence` and error codes differ). The trigger to introduce one is an in-process
  implementation (D4).
- **The four model-card items, resolved:** weights and Qwen3-8B are Apache-2.0; the exact wire
  (`noul`/`choice`/`score`, errors 401/422/502, API on `:8700`, `:8090` being the vLLM encoder); the
  bound is configurable and silent, and cuts the end of the state, where CLM puts the question
  (derived); the GGUF is heads only and does not lower the GPU floor.
- **Five constraints:** refuse at a mandatory caller-declared `inputLimit`, never truncate; assume no
  backend and document the floors; no safer-fetch (the URL is composition-root configuration; the real
  risk is `clm-serve` binding `0.0.0.0` with no auth); a new Node-only package with the SDK as a direct
  `~0.6.0` dependency; HTTP to a consumer-operated server, no Python.
- **Brief premises refuted:** ts-agent-tasks commands are names, so it is not the strongest consumer;
  `TaskContextRenderer` omissions are counted, not named; the brief's port was the encoder's.
- **User decisions folded in, 2026-10-01:** OQ-1 (the consumer will experiment; each call returns
  `meta`), OQ-3 (production runs CLM locally; development reaches a remote Jev or openjev; dev tests
  plumbing, not thresholds), OQ-10 (vLLM on an Olares One, probably; Ollama elsewhere, with three
  silent differences from vLLM read from Ollama's source).

## Followups

| item | where it went |
|---|---|
| Every §2 citation's ref, and the derived chains | `system-one-design-antagonist` (2026-10-02) |
| OQ-2, OQ-4, OQ-6, OQ-9, OQ-11, OQ-12 / D10 | Worked by `system-one-triage` in design §12 in place |
| OQ-7 (`'unchecked'`) | Resolved by `system-one-design-antagonist` |
| OQ-5 (Jev semantics) | Still open in design §12 (needs `typesafe.ai`); not in `TECH_DEBT.md` or `FUTURE.md` |
| OQ-8 (CLM `score` reliability), OQ-10's Olares items | Still open in design §12; folded into live check L2 in `implementation-plan.md` |
| Deferred list D1–D10 | Design §11 |

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- Design: `docs/design/system-one-decisions/design.md`
- PR: [#710](https://github.com/ErikFortune/fgv/pull/710)
