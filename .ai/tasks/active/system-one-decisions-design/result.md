# Result — `system-one-decisions-design` (Phase A)

**Shipped:** a design for System-1 decisions, at
[`docs/design/system-one-decisions/design.md`](../../../../docs/design/system-one-decisions/design.md).
The recommendation is a thin Result boundary over the vendor's own TS SDK (`@typesafe-ai/sdk`), with
the backend picked by URL. The pressure test is overturned, and CLM-8B is reported as **not viable on
a laptop inner loop**. Design only; nothing was run.

## Verified versus unverified

HuggingFace was **reachable**, and all four model-card items are resolved. github.com web, API and
codeload, and typesafe.ai, are **blocked** (403). raw.githubusercontent.com, PyPI and npm are
reachable. Code was read from the PyPI sdist `contrastive-lm` 0.1.0 and diffed against raw `main`.
The full table is design §2 (E1–E23).

| brief item | result | source |
|---|---|---|
| 1. Weights licence | **Verified.** The heads are Apache-2.0, and Qwen3-8B is Apache-2.0. | Model card § License; HF API `cardData` for both repos. |
| 2. Exact request/response JSON | **Verified.** See E5–E9: `noul`/`choice`/`score`, the answer shapes, and errors 401/422/502. The API is on **:8700**; :8090 is the vLLM encoder. | `server.py`, `schema.py`, `client.py`. |
| 3. 2048 bound and truncation | **Configurable** (`--max-tokens`, which must match vLLM's max length), and **silent**. **Derived:** it cuts the **end** of the state, which is where CLM puts the question. Corroborated by openjev ("Upstream CLM cuts the end, CLM PR #6"). | `embedder.py:41-43`, vLLM `renderers/params.py`, Qwen3 `tokenizer_config.json`, transformers default `"right"`. |
| 4. GGUF usable? | **Heads only.** It still needs the 16.4 GB Qwen3 encoder in a third-party Rust CLI, which is not a server. It **does not lower the GPU floor** for an fgv consumer. | GGUF model card; HF API sizes. |

Still unverified:

- Jev's semantics: its `confidence` formula, token bound, and error bodies.
- The llama.cpp encoder path on a laptop.
- Quantization accuracy for CLM.
- CLM issue #3 (score questions ignoring the state), reported via openjev.

## Pressure test

**Overturned.** CLM has no JS client, but the wire it implements has an official MIT TS SDK with zero
dependencies and `baseURL`/`fetch` overrides. That is the `ts-extras-ollama` shape exactly: a Result
boundary over an official JS client pointed at a sidecar. It is not a new integration shape.
`cross-runtime-interfaces.md` does not apply: that convention covers fgv implementations per runtime,
and here there are N remote servers.

## Interface versus client

**No fgv interface. The wire is the interface, and the backend is a construction-time `baseUrl` plus
`model`.** An interface would have one implementation, and it would promise a semantic equivalence the
backends do not have: `confidence` differs between CLM and openjev, and error codes differ. The trigger
to introduce one is an in-process implementation (D4).

## Five constraints

1. **Token bound:** refuse at a **mandatory** caller-declared `inputLimit` (characters, documented as a
   proxy), with no default number and never a truncation. A recommended per-backend value is OQ-4.
2. **GPU and inner loop:** the package assumes no backend. The README documents the floors honestly.
3. **safer-fetch:** not used. The URL is composition-root configuration, as with ai-assist and
   ts-extras-ollama, and it is never per-call input. The real risk is inbound: `clm-serve` binds
   `0.0.0.0` with no auth by default.
4. **Where:** a new package, `@fgv/ts-extras-system-one` (name provisional), Node-only, with a direct
   dependency on the SDK pinned `~0.6.0`, and a `minor` change file.
5. **Python:** fgv speaks HTTP to a server the consumer operates. It has no Python dependency and
   manages no process.

## Inner-loop viability

**CLM-8B: no, not on a laptop.** It needs an NVIDIA GPU with vLLM under Linux, and `vllm` is even a
hard pip dependency. The GGUF does not help.

**The user's goal: partly.** Because the wire is shared, the same client can point at any local
wire-compatible server: CLM on a GPU box, openjev on MLX or on CPU models. But a different model tests
**plumbing, not thresholds**. Probabilities are set-relative and model-specific, so a threshold tuned
on one model does not carry to another.

## Brief premises refuted along the way

- The ts-agent-tasks commands are names. Executing one needs model-written parameters, and there is no
  selection seam. So it is not the strongest consumer.
- `TaskContextRenderer` omissions are **counted**, not named.
- The default port the brief gave was the encoder's port, not the API's.

## For Phase B, numbered (design §12)

1. OQ-1: is there a committed first consumer? The prompt-assist screener fits as-is. If there is none,
   the recommendation becomes **"not yet"**.
2. OQ-2: the package name.
3. OQ-3: the user's inner-loop hardware, and the laptop llama.cpp experiment.
4. OQ-4: a measured `maxChars` per backend.
5. OQ-5: Jev's semantics (docs are blocked).
6. OQ-6: SDK behaviour against non-Jev servers.
7. OQ-7: whether `'unchecked'` survives.
8. OQ-8: whether the README warns on CLM `score` reliability.
9. OQ-9: SDK pin and churn policy.

## Gates

- No code, no package, no dependency, no `src/` change. `git diff --name-only` against the integration
  branch shows only `docs/` and `.ai/tasks/` files.
- `rush change --verify`: see `state.md` for the run.
- **No revert matrix.** There is nothing to protect; the change is docs only.
