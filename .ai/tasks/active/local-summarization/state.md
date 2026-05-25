# Stream state: `local-summarization`

**Status:** 🟢 ready to commission — substrate prep in flight
**Branch base:** `release`
**Last updated:** 2026-05-24 (orchestrator — substrate prep)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | 🟢 ready | Single-PR additive: `summarize` primitive in both facade packages + CLI testbed scenario. Design locked in brief. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Add `summarize` to the transformers facade (vs new package) | Third task type on the facade shipped by `local-ai-exploration` (`classify` → `embed` → `summarize`). Continues the "grow the facade as real consumers need it" path. More evidence the facade earns its keep. |
| Task-specific `summarize`, not the deferred general `generate` | Summarization has a distinct shape (input → shorter text, min/max length). Mirrors `classify`/`embed`'s task-specific discipline. `generate` stays deferred until a concrete consumer needs it. |
| Both facade packages get `summarize` (surface parity); scenario is CLI-only | personaility runs summarization backend-Node. Surface parity keeps the Node/browser pair identical, but the validated path + testbed scenario is Node/CLI. No web scenario — would demo a runtime personaility isn't using + pull a ~300MB model into the browser. |
| Local as cheap/fast path; cloud (ai-assist) stays for quality | Erik (2026-05-24): personaility summarizes in cloud via ai-assist today, but it's overkill (slow + expensive) for simple cases. Local is the next obvious step for those. Cloud remains for long/complex docs. |
| No local-vs-cloud routing orchestrator in the scenario | When to escalate to cloud is application logic, not facade or sample concern (testbed's "no complicated sample-only behavior a consumer would also need" tenet). Doc-comment note is the right depth. |
| Model size non-issue | Backend Node → ~300MB model is a one-time server-side cache, not a browser-download UX concern. |

---

## Origin

Consumer-driven (personaility). Currently summarizing in cloud via `@fgv/ts-extras/ai-assist`; cloud is slow + expensive for simple cases. Local summarization via the transformers facade is the cheap/fast path. Textbook stability-via-consumption: a real consumer's concrete pain justifies growing the facade.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-24 | Stream requested | Erik floated local summarization as a candidate (personaility short-list). Confirmed: cloud-via-ai-assist today, overkill for simple cases; local is next step; backend-Node runtime. |
| 2026-05-24 | Substrate prep | brief.md + state.md + WORKSTREAMS entry. This PR. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open |
| Implementation | TBD | not yet commissioned |
