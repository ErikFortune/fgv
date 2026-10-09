# State — `system-one-triage`

Worker-owned.

## Log

- **2026-10-03.** Branch `system-one-phase-b` at `bb48c467` (brief only), on top of
  `integration/system-one-decisions` `72f5f0bb`. Read the verification result first, then the design,
  Phase A's brief and result, the agent-tasks plan (shape only), the boundary convention and
  `ts-extras-ollama`.
- **Egress, re-confirmed 2026-10-03.** npm registry: reachable. PyPI: reachable. github.com over git:
  reachable (partial clones of ollama, llama.cpp, vLLM). `huggingface.co` API and non-LFS `resolve`:
  reachable (`vocab.json`, `merges.txt`, `tokenizer_config.json` of `Qwen/Qwen3-8B` @ `b968826d`
  downloaded). `tokenizer.json` still redirects to `us.aws.cdn.hf.co/xet-bridge-us/…`, which is not
  fetched; recorded, not retried. `registry.ollama.ai`, `typesafe.ai`, `olares.com`: not retried
  (blocked per the verification pass; the brief says record and move on).
- **Read at source this phase:** `@typesafe-ai/sdk` 0.6.0 tarball (`dist/index.mjs`,
  `dist/index.d.mts`; npm `dist.shasum` `dbba3068…`); `contrastive-lm` 0.1.0 sdist
  (`schema.py`, `server.py`); ollama `v0.35.0` (`llm/llama_server.go`, `fs/gguf/metadata.go`,
  `server/images.go`), plus the `convert/` tree at `v0.6.8`, `v0.12.0`, `v0.20.0`; llama.cpp `b5250`
  `convert_hf_to_gguf.py`; vLLM `v0.10.1` / `v0.30.0` tokenize routes.
- **Measured this phase:** Qwen3-8B tokenizer chars/token over five corpora (design E33). Reconstructed
  from `vocab.json` + `merges.txt` with transformers 4.55.0 (vLLM `v0.10.1`'s floor), slow and fast
  tokenizers, in a scratch venv. No package or repo dependency was added.

## Decisions taken here (all derived from the design's own principles)

OQ-2, OQ-4, OQ-9, OQ-12/D10 decided; OQ-6 turned into named tests. Contract refinements recorded in
design § 8's Phase B amendment and specified in the plan. See `result.md`.

## Belief checks

- Belief 1 (E27a framing): right, with one refinement. See `result.md` § Decisions, U1.
- Belief 2 (D7 is personaility#672's primitive): agree. Phase C needs one thing from it, and it is
  not the adapter: a `fetch` parameter on `createSystemOneClient`. See `result.md`.

## Open questions for the orchestrator

None beyond the two user decisions in `result.md`.
