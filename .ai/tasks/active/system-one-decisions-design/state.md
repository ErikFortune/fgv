# State — `system-one-decisions-design` (Phase A)

**Status:** brief written, not started.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/system-one-decisions-design/brief.md` — complete |
| integration branch | `integration/system-one-decisions`, off `release` HEAD (`30713277c`), pushed |
| this branch | `claude/system-one-decisions-design`, off that integration branch |
| PR | none — targets `integration/system-one-decisions`, **not `release`** |

## Shape

Phase A of a **design-triage-implement** stream. Phase A design → Phase B triage → Phase C
implementation, all onto `integration/system-one-decisions`; the orchestrator opens the cluster-close
PR to `release` when implementation completes. **Phase A design never lands on `release` as its own
commit.**

## The question

Whether and how fgv supports **System-1 decision models** — typed values with probabilities rather
than generated text — with open, locally-hostable **CLM-8B** as the driving implementation and hosted
**Jev** (TypeSafe AI) as what it claims compatibility with. Motivation: Jev is hosted and so unusable
in an inner loop.

**Output is a design document only.** "Not yet" or "not this way" is a legitimate result.

## Open at the start of Phase A

1. **Does the user's "just wrap the library" assumption hold?** The orchestrator thinks not: every
   fgv Result-integration-boundary wraps an *npm* library in-process, and CLM ships only Python plus
   an HTTP server. Phase A confirms or overturns that.
2. **Interface or client?** CLM claims Jev request compatibility and `openjev` is a third
   implementation — which looks like fgv's cross-runtime-interface case. Against it: one verified
   implementation plus an unviewable hosted API may not justify an interface.
3. **Is it viable for an inner loop at all?** `clm-serve` wants vLLM serving Qwen3-8B on an NVIDIA
   GPU under Linux. The GGUF conversion may lower that floor; unverified.
4. **The 2048-token state bound truncates silently** — against repo convention on unannounced
   dropping.

## Blocked for the orchestrator, to confirm in Phase A

`huggingface.co` is blocked by the orchestrator's egress proxy; the user is attempting to open it for
the Phase A agent. Four things to confirm from the model card: the **weights** licence (the base is
Qwen3-8B — its terms govern the pair), the exact request/response JSON, whether the 2048-token bound
is configurable and what truncation does, and whether the GGUF conversion carries the custom heads.
**If still blocked: mark unverified and continue — do not infer and present as fact.**

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing is done.
