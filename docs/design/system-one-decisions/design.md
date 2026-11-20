# System-1 decisions — design

**Status:** Phase A (design) of the `system-one-decisions` design-triage-implement stream. Design
only: no package, no dependency, no change under any `src/`. Every external fact below is marked
**verified** (read at its source in this phase), **derived** (several verified sources taken
together, but not seen end to end), **reported** (a third party says it, and the source could not be
read here), or **unverified**. Nothing here was run. There was no GPU, and no System-1 server answered
a request in this phase.
**Amended 2026-10-01** with the user's answers to OQ-1 (the consumer will experiment, and adoption depends on performance) and OQ-3 (production runs Qwen locally; development connects to a remote Jev or openjev). See §1 decision 6, §7.1, and §8 `meta`.
OQ-10 (Qwen runs on vLLM on an Olares One, probably, and on Ollama elsewhere) was answered the same day; see §7.1 item 6 and OQ-12.
**Amended 2026-10-02** by the `system-one-design-antagonist` verification pass: every §2 citation now
names the ref it was read at, E16 and E27 are split by link, OQ-7 is resolved, and §8 decides the
`confidence` field. The pass's account, including what it checked and left alone, is
[`.ai/tasks/completed/2026-10/system-one-design-antagonist/result.md`](../../../.ai/tasks/completed/2026-10/system-one-design-antagonist/result.md).
**Amended 2026-10-03** by Phase B triage (`system-one-triage`): §12 is worked through in place; §2
gains E28–E35; §7.1 item 5 and §8 carry dated refinements; §11 D7 and D10 are annotated. Phase C is
held to [`implementation-plan.md`](implementation-plan.md). The triage account, including the
decisions left to the user, is
[`.ai/tasks/completed/2026-10/system-one-triage/result.md`](../../../.ai/tasks/completed/2026-10/system-one-triage/result.md).
**Implemented 2026-10-03** (Phase C, `system-one-impl`) as `@fgv/ts-extras-system-one`, per
[`implementation-plan.md`](implementation-plan.md); deviations in
[`.ai/tasks/completed/2026-10/system-one-impl/result.md`](../../../.ai/tasks/completed/2026-10/system-one-impl/result.md).
**L1 recorded 2026-10-08** against hosted Jev (`jev-latest` answering as `jev-1.13.0`), passed; see
E36 and the record in `system-one-impl/result.md` § "L1, recorded 2026-10-08". L2–L5 were not run
live; decision U2 required only L1. **Shipped 2026-10-08:** Phase C via #721, and the cluster closed
with [#724](https://github.com/ErikFortune/fgv/pull/724) into `integration/system-one-decisions`.
**Date:** 2026-10-01. **Inspected checkout:** `16ec1622b`, which carries promoted `release` at
`febf0b2b4`. `ts-agent-tasks` citations were re-read there; Phase A had read them from
`origin/integration/agent-tasks-v1` at `2a95fbb2`, a branch that no longer exists.
**Brief:** [`.ai/tasks/completed/2026-10/system-one-decisions-design/brief.md`](../../../.ai/tasks/completed/2026-10/system-one-decisions-design/brief.md).

## 1. Decisions and scope

The question was whether fgv should support **System-1 decision models**, and how. These models
return typed values with probabilities instead of generated text. CLM-8B is the open implementation
driving the question, and TypeSafe AI's hosted Jev is what it claims compatibility with.

The short answer is **yes, in a narrower form than the brief expected.** CLM runs where the GPU is,
in the deployed environment, and development machines reach a System-1 server remotely (§7.1).

1. **The user's "just wrap the library" assumption holds, but for a different library.** CLM has
   no JS client. The wire CLM implements, TypeSafe's `POST /v1/systemone`, does: the vendor publishes
   **`@typesafe-ai/sdk`** on npm. It is MIT-licensed, has zero runtime dependencies, and takes
   `baseURL` and `fetch` overrides (§2, E10–E13). CLM, openjev and hosted Jev are all reachable
   through that one client by changing a URL. The orchestrator's claim that this is "a new integration
   shape for fgv" is **overturned** (§4). The shape is `ts-extras-ollama`'s: a Result boundary over
   an official JS client, pointed at a sidecar by host URL.
2. **No fgv interface. The wire is the interface, and the swap point is a base URL** (§5). An
   fgv-defined `ISystemOneDecider` would have exactly one implementation, an HTTP client. Hosted Jev
   versus local CLM is a choice made at the composition root, as it already is for ai-assist provider
   `endpoint`s. An in-process implementation would change this (§5.3).
3. **CLM-8B does not serve a laptop inner loop.** Its supported path is vLLM serving Qwen3-8B on an
   NVIDIA GPU. The GGUF conversion does **not** lower that floor: it contains the heads only, and
   still needs the full 8B encoder in a separate Rust runtime driven from a CLI (§7). Under the
   topology the user chose (decision 6), this does not matter: development machines call Jev or
   openjev remotely, and CLM runs only where the GPU is. Development still answers with a different
   model, and so has different probabilities (§7.1).
4. **Upstream CLM silently drops the question from an over-long state** (§6.1). The vLLM half of that
   chain is verified at the vLLM releases CLM's recipe can run; the tokenizer half is derived (E16).
   openjev and the author of CLM's own unmerged fix report the same independently. fgv will **refuse at
   a caller-declared, mandatory input bound and never truncate**. The decision does not depend on which
   end is cut: truncation is unreported on the wire either way (E15), so a cut at either end is a
   silent loss.
5. **Recommendation for Phase C:** a new package, provisionally `@fgv/ts-extras-system-one`. It is a
   Node-only Result boundary over `@typesafe-ai/sdk` with about five primitives, response validation
   the SDK does not do, a classified failure detail, and the mandatory input bound (§8). A live check
   against a real server is required before any success is claimed (§10).
6. **Deployment topology, decided by the user on 2026-10-01** (§7.1). The deployed environment runs
   Qwen locally, so CLM runs as a sidecar there. Development machines connect to Jev or openjev
   running elsewhere. The driving consumer will experiment with the package, and whether it adopts
   it depends on how it performs. The URL-selected design in decision 2 serves this as it stands.
   What the topology adds is that **development and production answer with different models.** §7.1
   names what that does and does not let a developer conclude, and §8 gives the experiment the
   per-call measurements it needs.

**Out of scope for this design:** consumer integrations, which are each their own stream (§11);
process management for any sidecar; fine-tuning; images and other openjev extensions.

## 2. Source evidence

**Refs.** Every row names the ref it was read at. A line number without a ref is not a citation. A
released tag or a content hash is preferred wherever the reasoning depends on a version; `main` is
cited only where the row is *about* `main` (E23). Abbreviations used below:

- **sdist 0.1.0**: the PyPI `contrastive-lm` 0.1.0 sdist, CLM's only release. E23 shows CLM `main`
  at `bb42c6c` matches it in every file cited here except the line offsets in `engine.py`.
- **SDK 0.6.0**: the npm `@typesafe-ai/sdk` 0.6.0 tarball. It was still `latest` on 2026-10-02.
- **openjev `dcd20947`**: `razorback16/openjev` README. The default branch is `main`, there is no
  `master` branch, and there are no tags, so the commit is the only stable ref.
- **ollama `v0.35.0`**: the latest Ollama release (commit `cc406939`, 2026-09-28). Phase A read
  `main`. Its line numbers still matched `v0.35.0` to within a few lines, but by 2026-10-02 `main`
  (`b0c1ca4f`) had moved the E26 handler about 16 lines further.
- **vLLM**: CLM declares `vllm>=0.6` (E3), but its own launch recipe needs **0.10.1 or later**, the
  first release with `--runner` (E3). vLLM rows are therefore read at `v0.10.1` (the floor) and
  `v0.30.0` (the latest, which an unpinned install resolves to).

| # | Fact | Status | Source |
|---|---|---|---|
| E1 | CLM-8B weights are **Apache-2.0**. The base Qwen3-8B is **Apache-2.0**. The deployable pair is therefore Apache-2.0 on both halves. | **verified** | Model card `Contrastive-LM/CLM-v0.1-8B` § License, plus `cardData.license`, @ `e939398d`. `Qwen/Qwen3-8B` API `cardData.license = apache-2.0` @ `b968826d`. Both shas were unchanged on 2026-10-02. |
| E2 | The checkpoint is a single `CLM_v0.1-8B.pt`, 75 MB in the repo. `config.json`: `embedding_dim 4096`, `encoder_pooling last-token`. | **verified** | HF API `siblings` / `usedStorage 75816125`, and `config.json`, @ `e939398d`. |
| E3 | The Python package is **`contrastive-lm`** 0.1.0 (import name `clm`), Apache-2.0, Python ≥ 3.10. **`vllm>=0.6` is a hard install dependency**, but no module in `src/clm/` imports vLLM; it is reached only over HTTP. CLM's documented encoder launch (`vllm serve Qwen/Qwen3-8B … --runner pooling`) needs **vLLM ≥ 0.10.1**: `--runner` first appears as a CLI flag at `v0.10.1`. The range an install can actually use is 0.10.1–0.30.0, not 0.6–0.30.0. | **verified** | PyPI JSON `requires_dist`; sdist 0.1.0 (`grep vllm src/clm/*.py` finds only the `embedder.py:6` docstring). Recipe: sdist 0.1.0 `README.md:59`, `embedder.py:6`; `serve_qwen3_8b.sh` @ CLM `bb42c6c`. Flag: vLLM `vllm/engine/arg_utils.py:473` @ `v0.10.1`; absent @ `v0.10.0`, where `runner` exists only as a `ModelConfig` field. |
| E4 | **Two processes.** `clm-serve` is a FastAPI server on **port 8700** that holds the heads. It calls an OpenAI-compatible `/v1/embeddings` encoder on **port 8090** (vLLM, `--runner pooling`). The brief's "default port 8090" is the encoder, not the API. | **verified** | `server.py:170-171` @ sdist 0.1.0; model card usage block @ `e939398d`. |
| E5 | **Wire, `/v1/systemone`.** Request `{state, model, questions: {id: Question}, temperature?}`. Questions are `noul` (`instructions`, optional `criteria {true, false}`), `choice` (`criteria {label: description}`), and `score` (`criteria` as an ordered list of at least 2 levels). Response `{model, answers, usage {billing_units, input_tokens, output_tokens}}`, plus an `X-CLM-Latency-Ms` header. | **verified** | `server.py:96-119`, `schema.py:75-145`, `client.py` @ sdist 0.1.0; matches its README § API. |
| E6 | **Answers.** `noul`: `{noul: P(true)}`. `choice`: `{choice, confidence, probabilities}`. `score`: `{score: Σ i·pᵢ, confidence, legend, probabilities}`. Probabilities are a softmax over `scale·cos/temperature` and are **relative to the supplied candidate set**. | **verified** | `schema.py:115-145`, `engine.py:130-136` @ sdist 0.1.0; model card § Limitations @ `e939398d`. |
| E7 | **CLM's `confidence` is top probability minus the mean of the rest**, clamped to [0, 1]. It is a pure function of the returned `probabilities`. | **verified** | `schema.py:122-128` @ sdist 0.1.0. |
| E8 | **`/v1/rank`** is a CLM-only convenience. It is literally a `choice` question whose criteria are the candidates. | **verified** | `engine.py:138-149`, `server.py:121-153` @ sdist 0.1.0. |
| E9 | **Errors.** CLM returns `401` for a bad key, `422` for a malformed request **or an unknown model**, and `502` when the embedder is unreachable **or returns any non-200** (E15's refusal path uses this). Auth applies only if `CLM_API_KEY` is set. The server **binds `0.0.0.0` by default**. | **verified** | `server.py:78-80, 113-118, 169`, `embedder.py:44-49` @ sdist 0.1.0. |
| E10 | **`@typesafe-ai/sdk` 0.6.0** on npm (published 2026-09-15, created 2026-09-12): MIT, `engines.node >=20`, **no runtime dependencies**, ESM and CJS, `sideEffects: false`. | **verified** | npm registry metadata and tarball `package.json`, SDK 0.6.0. |
| E11 | The SDK's types encode the same wire as E5/E6 (`NoulQuestion`, `ChoiceQuestion`, `ScoreQuestion`, `SystemOneResult`, `Usage`). It has **no `rank`, and no `temperature` field**, though "additional properties on a request variable are forwarded". It documents `confidence` only as "Reported confidence", with no formula. | **verified** | `dist/index.d.mts:36-158` (forwarding note `:145`; `confidence` `:97-98, 111-112`) @ SDK 0.6.0. |
| E12 | `TypeSafeClientConfig` takes `baseURL` (default `https://api.typesafe.ai`, env `TYPESAFE_BASE_URL`), `defaultModel` (default **`jev-latest`**), `fetch`, `timeout` (default 10 s), `retry` (2 retries on 408/429/5xx), `logger`, and `dangerouslyAllowBrowser`. | **verified** | `dist/index.d.mts:203-228`, `RetryPolicy` `:161-173` @ SDK 0.6.0. |
| E13 | Runtime behaviour: the constructor **throws if no API key is given**, and throws in a browser unless opted in. `systemOne` checks the question count and score arity and then **`JSON.parse`s the response with no validation**. Failures throw a typed `APIError` subclass per status, `APIConnectionError`, `APITimeoutError`, or `APIUserAbortError`. | **verified** | `dist/index.mjs:347-352, 376, 392, 398, 511-512, 681-686`; error classes `dist/index.d.mts:327-375` @ SDK 0.6.0. |
| E14 | **Jev's wire shape is what E11 encodes.** Jev's *semantics* are **not visible**: how it defines `confidence`, its token bound, its truncation behaviour, and its error bodies. TypeSafe's docs and blog are blocked by the egress proxy. | **unverified** | `typesafe.ai`, `docs.typesafe.ai`: CONNECT 403 (re-confirmed 2026-10-02). |
| E15 | **CLM truncation.** `clm-serve --max-tokens` (default 2048, env `CLM_EMB_MAX_TOKENS`) is sent to vLLM as `truncate_prompt_tokens` **with no `truncation_side`**. Configurable: yes. Reported to the caller: no. **`--max-tokens 0` sends no `truncate_prompt_tokens` at all** (the field is set only when the value is truthy). A value above vLLM's `--max-model-len` is not clamped: vLLM rejects the request, so every call fails with `502` (E9). | **verified** | `server.py:173-174, 203`, `embedder.py:41-43` @ sdist 0.1.0. vLLM `serving_engine.py:299-304` @ `v0.10.1`; `entrypoints/pooling/base/serving.py:238-250` @ `v0.30.0`. |
| E16 | **Which end is cut**, split by link. Conclusion: **an over-long state loses its question.** | **derived** (E16a verified; E16b has one link unreachable from here) | Rows E16a–E16c. |
| E16a | *vLLM half.* When a request carries `truncate_prompt_tokens` but no `truncation_side`, vLLM truncates on the tokenizer's own side. At `v0.10.1` the text path calls the tokenizer with `truncation=True, max_length=truncate_prompt_tokens` and passes no side at all. At `v0.30.0` the embeddings request builds `TokenizeParams` with the request's `truncation_side` (`None` from CLM); that again calls the tokenizer with `truncation=True`, and the post-tokenization slice falls back to `tokenizer.truncation_side`, else keeps the first N. vLLM accepts `truncation_side` from `v0.18.0`; CLM does not send it (E15). | **verified** | `vllm/entrypoints/openai/serving_engine.py:532-547` @ `v0.10.1` (same shape at `v0.6.6:235-249` and `v0.14.1:945-979`). `vllm/entrypoints/pooling/base/protocol.py:42, 54-61, 110-136` and `vllm/renderers/params.py:180-185, 327-352, 460-484` @ `v0.30.0`. `params.py` exists from `v0.16.0` through `v0.30.0`; Phase A cited it on `main` with no tag. |
| E16b | *Tokenizer half.* transformers' default `truncation_side` is `"right"`, which keeps the first N tokens. Qwen3-8B's `tokenizer_config.json` has **no `truncation_side` key**, so it does not override that default. **Not checked:** a fast tokenizer also takes its side from a `truncation` section in `tokenizer.json`, if one exists. Qwen3-8B's `tokenizer.json` is a 11.4 MB LFS object served from `us.aws.cdn.hf.co`, which the egress proxy refuses. | default **verified**; config **verified**; `tokenizer.json` **unverified** (unreachable from here) | `src/transformers/tokenization_utils_base.py:1390` @ `v4.55.0` (vLLM `v0.10.1` requires `>=4.55.0`), `:984` @ `v5.11.0`, `:975` @ `v5.18.0` (vLLM `v0.30.0` requires `>=5.10.4`). `tokenization_utils_fast.py:157-163` @ `v4.55.0` and `tokenization_utils_tokenizers.py:430-436` @ `v5.18.0` read `tokenizer.json`'s `truncation.direction`. `Qwen/Qwen3-8B` `tokenizer_config.json` @ `b968826d`. |
| E16c | *Position and corroboration.* CLM builds the state as **context, then the question last**. The author of CLM's unmerged PR #6 states the same mechanism in the commit that fixes it: "vLLM falls back to the tokenizer default … 'right' … drops the question that state_text appends last", and sends `truncation_side='left'`. openjev's README says "Upstream CLM cuts the end (see CLM PR #6)". | position **verified**; both statements **reported** | `schema.py:62-65` @ sdist 0.1.0. CLM `refs/pull/6/head` = `11211fc` (read over git; not merged at `bb42c6c`). openjev README:411-413 @ `dcd20947`. |
| E17 | Candidate texts (option descriptions) are embedded separately, and each is subject to the same bound. | **verified** | `engine.py:116-128` and `embedder.py`, which handle every text identically, @ sdist 0.1.0. |
| E18 | **GGUF (`EvoAwaken-Workshop/CLM-v0.1-8B-gguf`) contains the projection heads only**: 17 F32 tensors, 75.5 MB. It "does **not** contain" the Qwen3-8B encoder. It runs through the third-party **`rust-model-inference`** CLI (`--jev --clm-head …`) with `Qwen3-8B-BF16.gguf` (16.39 GB). Bitwise parity is claimed only for scalar mode with BF16, against a scalar llama.cpp encoder rather than vLLM. | **verified** (card); parity **reported** | GGUF model card @ `01d33811` (README:27, 33, 81-90), and the HF API for file sizes. |
| E19 | Qwen3-8B sizes: safetensors 16.38 GB (bf16). GGUF Q8_0 8.71 GB, Q4_K_M 5.03 GB. Whether CLM's heads stay accurate on quantized embeddings is not established anywhere I could read. | sizes **verified**; accuracy **unverified** | HF API, `Qwen/Qwen3-8B` @ `b968826d`, `unsloth/Qwen3-8B-GGUF` @ `a6adef13`. |
| E20 | `llama-server` offers `--pooling last` and `/v1/embeddings`, so in principle it could stand in for the vLLM encoder. Not tested, and no parity evidence exists. `truncate_prompt_tokens` is a vLLM field; what `llama-server` does with it is unknown. Its `--embedding` flag is documented as "use only with dedicated embedding models". | flags **verified**; viability **unverified** | llama.cpp `tools/server/README.md:175, 210` @ `b11081` (the build Ollama `v0.35.0` pins); unchanged @ `b11347`, the latest tag on 2026-10-02. |
| E21 | **openjev** (`razorback16/openjev`, independent of TypeSafe) claims the same wire, "checked against the live API". It defines **`confidence` as `1 − H(p)/ln K`**, which differs from E7; it too is a function of the distribution alone. It lists Jev's errors as `400 api_usage_error` for an unknown model, which differs from CLM's `422`. It serves CLM (FP8: 7.7 GB on an RTX 3090, 99 ms; bf16 14.1 GB) and an MLX backend on Apple silicon (about 16 GB to load, 23–36 GB in service). It also serves small CPU-capable models (`verdict-1.4` 151M with 512 tokens; `laya-1.0` 421M with 1,024 tokens), and gives a free hosted endpoint (Codiv). Its `jevk5-0.2` model returns `400` for a read over 16,384 tokens, "never a cut". **openjev's `clm-v0.1` route answers through the same `to_answer`, so it reports `1 − H(p)/ln K` over CLM's weights, not E7's formula**, and it wraps CLM's embedder to keep the end of a long text. | **reported** (README); the `confidence` formula, its use on the `clm-v0.1` route, and the left-truncating wrapper are **verified** in source | openjev README @ `dcd20947`: lines 15-16, 25-28, 85, 99-106, 289-291, 397-403, 467. Source @ `dcd20947`: `openjev/engine.py:434-451`; `openjev/encoders.py:45, 157, 291-302, 315-316`. |
| E22 | CLM `score` questions can ignore the state: "one level winning whatever the state says" (CLM issue #3). | **reported** | openjev README:417-419 @ `dcd20947`. CLM issues are not git refs, and github.com web and `api.github.com` return 403, so the issue stays unreadable. |
| E24 | **Olares One:** NVIDIA RTX 5090 Mobile with **24 GB GDDR7**, 96 GB DDR5, Core Ultra 9 275HX. | **reported** (secondary) | TechRadar and Notebookcheck coverage. `olares.com/docs/one/spec` is blocked by the egress proxy. |
| E25 | **Ollama's OpenAI-compatible `EmbedRequest`** has exactly `input`, `model`, `dimensions` and `encoding_format` (`float` or `base64`). It has **no truncation field**. The middleware then re-encodes the request as a native `api.EmbedRequest` carrying only `Model`, `Input` and `Dimensions`, so CLM's `truncate_prompt_tokens` cannot reach the handler. | **verified**. That the unknown field is ignored rather than rejected at bind time is **derived** from gin's non-strict `ShouldBindJSON`. | `openai/openai.go:95-100` and `middleware/openai.go:398-430` @ ollama `v0.35.0`. |
| E26 | **Ollama truncates embedding input itself** by default: the OpenAI path never sets `truncate`, and a nil `truncate` means true. It cuts to `min(context_length, num_ctx)`, **keeping the first tokens** (`tokens[:ctxLen]`). It reserves one token each for a BOS and an EOS that the tokenized input lacks, when the GGUF's `add_bos_token` / `add_eos_token` is true **or absent**. The default `num_ctx` is chosen by VRAM: 4,096 below 23 GiB, 32,768 from 23 GiB, and 262,144 from 47 GiB. | **verified** | `server/routes.go:1002-1047, 2199-2209`, `api/types.go:610-611` @ ollama `v0.35.0`. |
| E27 | Ollama's embed handler requires **no embedding capability**, so a generative Qwen3-8B can be *asked* for embeddings. | **verified** | `server/routes.go:987` (`scheduleRunner(..., []model.Capability{}, ...)`) @ ollama `v0.35.0`. |
| E27a | **At `v0.35.0`, asking will probably fail rather than mis-pool.** Ollama runs a GGUF model in a bundled upstream `llama-server`. It passes `--embedding` only when the GGUF carries `<arch>.pooling_type`, and it treats such a model as an embedding model. Without that flag, `llama-server`'s `/v1/embeddings` answers "This server does not support embeddings". llama.cpp's converter writes `pooling_type` only from a sentence-transformers `modules.json`, which `Qwen/Qwen3-8B` does not have. **Not checked:** the metadata of the actual `qwen3:8b` library blob, because `registry.ollama.ai` is unreachable from here. **Not covered:** older Ollama releases. Up to at least `v0.20.0` Ollama used its own runner (`runner/`), whose pooling remains **unverified**. | **derived**; the blob's metadata is **unverified** (unreachable from here) | `llm/llama_server.go:584-590, 863-865, 945` and `fs/gguf/metadata.go:80-91`, `server/images.go:197-200` @ ollama `v0.35.0`; `LLAMA_CPP_VERSION` = `b11081`. llama.cpp `tools/server/server-context.cpp:5390-5394` and `conversion/base.py:2223-2255`, `conversion/qwen.py:66-68, 159-161` @ `b11081`. HF tree `Qwen/Qwen3-8B` @ `b968826d` (no `modules.json`). `llm/llama_server.go` 404 @ `v0.12.0`, `v0.20.0`; 200 @ `v0.30.0`. |
| E23 | CLM `main` matches PyPI 0.1.0 in `server.py`, `schema.py`, `embedder.py` and `client.py`. The only differences are a download counter and dict normalisation in `engine.py` (`question_to_dict`, +2 lines). **No truncation fix has landed on `main`.** The fix exists only as unmerged PR #6 (E16c). This row is *about* `main` by design: the question it answers is whether a fix has landed upstream ahead of a release. | **verified** | CLM `main` @ `bb42c6c` (2026-09-24; still `HEAD` on 2026-10-02) diffed against sdist 0.1.0. |
| E28 | *Added 2026-10-03 (Phase B).* **SDK release cadence.** 0.5.7 was published 2026-09-12T04:13Z and 0.6.0 on 2026-09-15T18:17Z: three and a half days apart, not three weeks (OQ-9 said "three weeks apart"; the *package* is three weeks old). No release since; `latest` is still 0.6.0. The name `@fgv/ts-extras-system-one` is unclaimed on npm (`E404`). | **verified** | npm registry `time` and `dist-tags` for `@typesafe-ai/sdk`, and `npm view @fgv/ts-extras-system-one`, both 2026-10-03. Tarball `dist.shasum` `dbba30689e77c317e7619fbee006caa18f37a76a`. |
| E29 | *Phase B.* **SDK logging and explicit values.** There is a fourth environment fallback, **`TYPESAFE_LOG_LEVEL`**, used when `logLevel` is omitted (§7.1 item 5 named three). At `debug` the SDK logs request and response bodies: "known credential headers are redacted; bodies are not". With no `logger` it writes to a prefixed `console`. Explicit options are taken with `??`, so an explicit **empty string is used as given**: an empty `apiKey` neither throws nor falls back to `TYPESAFE_API_KEY` (E13's "throws if no API key is given" means `undefined`). | **verified** | `dist/index.d.mts:209-213, 321`; `dist/index.mjs:62, 65-70, 259, 444-448, 511-516, 596-598` @ SDK 0.6.0. |
| E30 | *Phase B.* **SDK failure mechanics.** `systemOne` checks its questions **synchronously**, before it returns a promise, and throws the *base* `TypeSafeError` for an empty set or a score question without a list of at least two levels. `APITimeoutError` **extends** `APIConnectionError`. Status classes exist for 400, 401, 403, **404**, 422, 429 and ≥ 500; any other non-2xx is a bare `APIError`. Retries by default: 408, 429 and **every status 500–599** (so openjev's `529` is retried), connection errors and timeouts; the timeout is per attempt, with no total budget. A 2xx body that is not JSON is returned **as a string**, and an empty one as `undefined`; neither throws. `models.list()` unwraps `{ models: [...] }` and throws the base `TypeSafeError` on any other shape. `withResponse()` resolves `{ data, response, requestId }`, with `requestId` from `x-typesafe-request-id`, else `undefined`. | **verified** | `dist/index.mjs:1-32, 73-92, 191-199, 347-354, 368-371, 438-441, 548-549, 628-660, 677-690`; `dist/index.d.mts:16-26, 352, 367` @ SDK 0.6.0. |
| E31 | *Phase B.* **The SDK's fetch seam** is `type Fetch = (input: string, init?: RequestInit) => Promise<Response>`, so any function with the global `fetch` signature is assignable to it. The SDK buffers the whole body inside each attempt. Its dist imports no Node built-in. | **verified** | `dist/index.d.mts:192`; `dist/index.mjs:628-660` (no `node:` import anywhere in the file) @ SDK 0.6.0. |
| E32 | *Phase B.* **CLM `/v1/models`** returns `{"models": [{name, description, release_date}]}`, the shape the SDK unwraps (E30). CLM joins state and instructions with `"\n\n"`, **two characters**, after stripping each. **The candidate texts are not always the descriptions** (a refinement of E17): a `choice` option with a null or empty description embeds its key; a `score` level embeds its text; a `noul` option embeds `"true: "` / `"false: "` plus its description, or, with no description, `"Yes. This is true: "` / `"No. This is false: "` **plus the question's instructions** (at most 26 characters plus the instructions). | **verified** | `server.py:10, 91-94`, `schema.py:62-65, 75-101` @ sdist 0.1.0. |
| E33 | *Phase B.* **Qwen3-8B characters per token** (OQ-4), over 4,000-character windows. Minimum / median: English prose 3.65 / 5.43; Markdown (`CAPABILITIES.md` files) 2.91 / 4.16; TypeScript 3.51 / 4.39; JSON records (IANA subtag entries) 2.39 / 2.45; UUID-, timestamp- and number-dense JSON 1.34 / 1.35. Digits tokenize one per token, which is why the last class is lowest. The tokenizer adds no BOS or EOS (`"Hello world"` → `[9707, 1879]`). No CJK or other non-Latin corpus was measured. | **derived**. The vocabulary and merges are Qwen3-8B's own; the normalizer and pre-tokenizer are transformers' `Qwen2Tokenizer` defaults, which only `tokenizer.json` (unreachable, E16b) would confirm. The slow and fast tokenizers agreed on every one of 388 windows. | `vocab.json`, `merges.txt`, `tokenizer_config.json` of `Qwen/Qwen3-8B` @ `b968826d` (non-LFS, fetched through `huggingface.co`); transformers `4.55.0` (vLLM `v0.10.1`'s floor), tokenizers `0.21.4`. Corpora: `docs/design/**/*.md` prose paragraphs, `libraries/*/CAPABILITIES.md`, `libraries/ts-agent-tasks/src/packlets/**/*.ts`, `ts-bcp47`'s `language-subtag-registry.json`, and 2,000 seeded synthetic `{id, rev, at, parent, progress}` records, all @ `bb48c467`. `tokenizer.json` still redirects to `us.aws.cdn.hf.co/xet-bridge-us/…` (not fetched). |
| E34 | *Phase B.* **E27a's converter link.** Neither converter that could have produced the `qwen3:8b` library blob writes a `pooling_type` for Qwen3. llama.cpp at `b5250` (2025-05-01, the week Qwen3 shipped) writes it only in `BertModel`, from `modules.json`. Ollama had no Qwen3 converter at `v0.6.8` or `v0.12.0`, and its `convert_qwen3.go` at `v0.20.0` writes none (only its BERT and nomic-bert converters do). At `v0.35.0` Ollama has no `convert/`, `runner/` or model-engine tree: every GGUF runs in `llama-server`, and `isEmbedding` is exactly `f.KV().Has("pooling_type")`. This narrows E27a's open link to the blob itself; it does not close it. | converters and the `v0.35.0` path **verified**; the blob's provenance and metadata remain **unverified** | llama.cpp `convert_hf_to_gguf.py:2686-2688, 3309-3341` @ `b5250`. ollama `convert/convert_qwen3.go:35-72`, `convert/convert_bert.go:95`, `convert/convert_nomicbert.go:101` @ `v0.20.0`; `git ls-tree` @ `v0.6.8`, `v0.12.0`, `v0.35.0`; `llm/llama_server.go:584-587, 863-865`, `server/images.go:197-200` @ `v0.35.0`. |
| E35 | *Phase B.* **vLLM serves `POST /tokenize`**, so a deployed encoder can confirm E33's counts with the real tokenizer. At `v0.30.0`, `GET /tokenizer_info` also exists behind `--enable-tokenizer-info-endpoint`. | routes **verified**; whether they are mounted under `--runner pooling` is **unverified** | `vllm/entrypoints/openai/api_server.py:480` @ `v0.10.1`; `vllm/entrypoints/serve/tokenize/api_router.py:36, 87-93` @ `v0.30.0`. |
| E36 | *Added 2026-10-08 (live check L1).* **Jev, live.** Hosted Jev at `https://api.typesafe.ai`, model `jev-latest` answering as `jev-1.13.0`, accepted a noul + choice + score request through `@fgv/ts-extras-system-one` and the body passed every plan § 3.6 check. **A `score` answer is fractional, confirmed live:** `score` was `1.73` over levels `0`–`2` with probabilities `{0: 0, 1: 0.27, 2: 0.73}`, which equals `Σ level·p` (0·0 + 1·0.27 + 2·0.73). This is the documented behaviour, now observed: the SDK types `ScoreResponse.score` as "Expected score, which may fall between integer rubric levels" (`dist/index.d.mts:109` @ SDK 0.6.0), and E6 reads the same expectation in CLM's source. So a `score` is **not an integer level**; the most probable level is the argmax of `probabilities`. Also observed: an unknown model gets **`400`**, classified `invalid-request` (OQ-6; openjev's report in E21, not CLM's `422` in E9); `x-typesafe-request-id` is sent; neither `Server-Timing` nor `X-CLM-Latency-Ms` is sent. | **verified** (one live round trip; the `score` semantics also at SDK source) | `perf/systemOneLive.js probe` record of 2026-10-08T14:22:08Z, darwin arm64, Node 24.18, in `.ai/tasks/completed/2026-10/system-one-impl/result.md` § "L1, recorded 2026-10-08". |

Two brief premises turned out to be wrong. Both are recorded here because Phase B will reason from
them.

- *"`createTaskTools` hands a model the commands the view reports available — literally `/v1/rank`'s
  input shape."* **Partially refuted.** The available commands are bare names returned as data by
  `task_inspect`. The *executable* command tools are fixed when the tools are built, and their
  `parameters` must be written by a model (`succeed {outcome}`, `fail {reason}`, `set-title {title}`
  and so on). Sources: `types/trackedCommands.ts:16-31` and `tools/schemas.ts:236-243` in
  `libraries/ts-agent-tasks/src/packlets/`, @ `release` `febf0b2b4`. The claim is unchanged from the
  branch Phase A read; only the first range moved. See §9.
- *"I1a … every omitted page item is named."* **Refuted.** `TaskContextRenderer` always reports
  omissions, but as **counts and reasons**, not identities (`ITaskContextOmissions`,
  `types/context.ts:170-190` @ `release` `febf0b2b4`). The 8,000-character default is **verified**
  (`defaultTaskContextBudget`, `types/context.ts:30-38`, same ref). The convention §6.1 relies on is "nothing is dropped *unannounced*", and
  that convention holds.

## 3. What a System-1 decision is, on the wire

A request carries one `state` and N named questions. Each question is answered independently against
that state, as a distribution over a **closed candidate set the caller supplies**. There is no
generation. The answer cannot leave the schema, and it carries no explanation. Two properties shape
everything downstream:

- **Probabilities are relative to the set** (E6). P(billing)=0.94 means "billing rather than
  technical", not "94% likely billing". Adding a third option changes the number. A threshold tuned
  against one candidate set, or one backend, does not transfer to another.
- **`confidence` is backend-defined** (E7 against E21; Jev's definition is E14). The field name is
  shared, the formula is not, and nothing in a response says which formula produced it (E11).
  `probabilities` has one definition on every backend, so it is the only field whose *meaning*
  carries across backends. Its *values* are still model-relative (the bullet above, and §7). The
  boundary does not return `confidence` (§8).

## 4. The pressure test

**The orchestrator's claim:** "wrap the library like our other libraries" does not transfer, because
every fgv Result-integration boundary wraps an in-process npm library and CLM ships no JS client.

**Verdict: overturned. The premise is right about CLM and wrong about the wire.**

- *Right:* there is no CLM JS client, and wrapping CLM's Python is not an fgv shape.
- *Wrong:* the thing worth wrapping is not CLM. It is the wire CLM chose to be compatible with, and
  that wire's owner ships an official, zero-dependency TS client that is designed to be pointed
  elsewhere (`baseURL`, `fetch`; E12). openjev documents exactly that use: `TYPESAFE_BASE_URL=http://127.0.0.1:8080`.
- *Which convention applies.* `result-integration-boundary.md` covers this directly. The precedent is
  **`ts-extras-ollama`**: "a Result-integration boundary over the official `ollama` JS library", where
  `createOllamaClient({ host?, fetch? })` points the client at a local daemon. The in-process
  distinction the orchestrator drew does not hold even inside the convention's own instances:
  `ollama` is an HTTP client to a sidecar, and it is the reference instance.
- *Why ai-assist is not the home.* The brief is right here. System-1 is not a completion, and an
  `IAiProviderDescriptor` would describe a provider that cannot complete. The ollama precedent of
  cutting what ai-assist owns does not arise, because ai-assist owns nothing here.

`cross-runtime-interfaces.md` does **not** apply. It describes one capability with separate Node and
browser *implementations in fgv* (`FsTree` and the File System Access tree; `NodeCryptoProvider` and
`BrowserCryptoProvider`). Here there is one client implementation and N remote servers. That is the
ai-assist `endpoint` pattern, not the cross-runtime one.

## 5. Interface versus client

### 5.1 Decision: no fgv interface. Thin boundary over the vendor client; the backend is chosen by URL

The brief framed this as "one System-1 interface with Jev and CLM as implementations" against "a
CLM-specific client". **Neither is right.** The decision is a backend-neutral client, named for the
wire rather than for CLM, where the backend is a construction-time `baseUrl` + `model`.

**Arguments for an interface, and why they fail here:**

- *"Hosted in production and local in the inner loop, with consumer code unchanged."* A URL already
  delivers this, and it delivers it without an abstraction. Consumer code holds an `ISystemOneClient`
  and never learns which server answers. The user's chosen topology is the reverse (local in
  production, remote in development; §7.1). The argument is symmetric, so it holds unchanged.
- *"There are three implementations (Jev, CLM, openjev)."* There are three **servers**. In fgv each
  would be the same HTTP client, so an interface would have one implementation. That is the premature
  abstraction `CODING_STANDARDS.md` warns against, and it would make a promise the design cannot keep:
  that all implementations behave alike. They do not (E7/E21 `confidence`, E9/E21 errors, E15/E21
  truncation).

**Arguments for a CLM-specific client, and why they fail:**

- *"We have verified only CLM."* True for semantics. But the request and response *shape* is verified
  from the vendor's own SDK types (E11), not inferred from CLM. A CLM-named client would have to
  reject `jev-latest` or the openjev models for no reason.
- *"CLM has `/v1/rank` and `temperature`."* `rank` is a `choice` question (E8). `temperature` is a
  CLM extension, and the SDK forwards it as an extra property; it is deferred (D2).

### 5.2 What "spanning Jev" claims, and what it does not

It claims **wire compatibility**, read from the SDK. It does **not** claim **semantic
compatibility**, which E14 makes unknowable from here. So the package omits `confidence` from its
answers (§8), and classifies failures by HTTP status family rather than by body shape. It promises
nothing about Jev's token bound.

### 5.3 What would change the decision

An **in-process implementation**: anything that answers System-1 questions without an HTTP server.
Two candidates exist (D4):

- TS-native CLM heads (a 75 MB two-layer MLP) over any Qwen3-8B last-token embedding endpoint.
- A small encoder model (openjev's `verdict-1.4` is ModernBERT-based) through
  `@fgv/ts-extras-transformers`.

Either one makes "HTTP client versus in-process" two genuinely different implementations. At that
point an `ISystemOneDecider` interface earns its place, and the HTTP client becomes one implementation
of it. Introducing the interface then is a small additive change (extract the client's method set).
Introducing it now would be a guess.

## 6. Constraints

### 6.1 The 2048-token bound and silent truncation

**Facts:** the bound is configurable on the CLM server (E15), but it has to match the encoder's
`--max-model-len`. Truncation is silent: no warning, no field, and `usage.input_tokens` counts only
cache misses (E5). Per E16, it **cuts the question, not the context**. Each candidate description is
bounded separately (E17). Other backends have other bounds: openjev lists 512, 1,024, 2,048 and
16,384 (E21). Jev's is unknown (E14).

**Decision: refuse, at a caller-declared bound that is mandatory and has no default. fgv never
truncates.**

- `askSystemOne` requires `inputLimit: { maxChars: number } | 'unchecked'`. As with safer-fetch's
  `addressGuard`, omitting it is a **compile error**, so every call site's posture can be found with
  one grep. `'unchecked'` exists for backends that are known to refuse rather than truncate, and it
  names itself. Such backends exist (OQ-7, resolved), but none is in the decided topology's every
  leg, so `'unchecked'` is not correct for the driving consumer today.
- Before sending, the boundary measures, for each question, the length of the state plus
  `instructions` plus the separator. It also measures each criterion description separately. If any
  exceeds the limit, the call fails with reason `'input-over-limit'`, naming the question id, the
  part (state or which criterion), and the measured length. **Nothing goes over the wire.**
- The measure is **characters, and it is a proxy, not a guarantee.** A character bound cannot bound
  tokens exactly: the ratio varies with the content and with each backend's tokenizer. The package
  says so. A structured `state` is measured by its JSON serialization. That is usually an
  over-estimate of CLM's `key: value` rendering (E5), but not provably always one. Exact
  pre-measurement against the backend's tokenizer is deferred (D5).
- **No default number ships.** A recommended `maxChars` per backend is OQ-4. It must be measured with
  the Qwen3 tokenizer on representative states, not guessed. The `TaskContextRenderer` default of
  8,000 characters (§2) is very likely over CLM's bound for English prose. A consumer feeding
  rendered task context to CLM will need a smaller budget, and the refusal will tell them so.

Why not the alternatives:

- **Report-only** (send, then warn): truncation is not observable through the wire, so there is
  nothing to report from.
- **Truncate in fgv, cutting from the start so the question survives**: this repeats the defect one
  layer out, with an fgv-chosen side instead of an upstream one. The repo's convention is that nothing
  is dropped unannounced.
- **Leave it to the caller**: this is the status quo that produced the E16 hazard.

### 6.2 GPU, vLLM, and the inner loop

See §7 and §7.1. **Decision: the package does not depend on, launch, or assume any particular
backend.** The development answer is "point it at a remote wire-compatible server", as the user
decided. Production points it at the local CLM sidecar. The README documents the backends it can
honestly name, along with their measured or reported floors.

### 6.3 A localhost sidecar and `safer-fetch`

**Decision: platform `fetch`, through the SDK. No safer-fetch address guard.** The base URL is
**operator configuration supplied at client construction, never request-time input.**

`safer-fetch` exists for "a URL you do not fully control" (`ts-extras/CAPABILITIES.md`). Its
`blockPrivateNetworks` guard defends against SSRF: an attacker steering a server-side fetch at an
internal address. A sidecar URL that the composition root wrote down is not attacker-steerable, so
there is nothing for the guard to defend. Repo precedent agrees: ai-assist provider calls
(`ai-assist/http.ts:64`, `streamingAdapters/common.ts:288`) and `ts-extras-ollama`
(`createOllamaClient({ host?, fetch? })`) both use platform `fetch` toward a configured host. The
boundary must therefore **not** accept a per-call URL. If it ever does, this decision reverses.

safer-fetch also cannot be plugged in mechanically. It returns `DetailedResult`, not a
`fetch`-shaped `Response`, and the SDK's seam is `fetch: (input, init) => Promise<Response>` (E12).
An adapter is deferred (D7) until a consumer needs one.

**The real network risk is inbound, and it is upstream's.** `clm-serve` binds `0.0.0.0` with auth off
by default (E9). That puts an unauthenticated model server on the LAN. The README tells operators to
run it with `--host 127.0.0.1`, or to set `CLM_API_KEY`. Separately, the SDK refuses to construct
without an API key (E13), so a keyless local server needs a placeholder key, and the README says so
rather than hiding it.

### 6.4 Where it lives

**Decision: a new package, provisionally `@fgv/ts-extras-system-one`, Node-only for v1.**

- It is not a `ts-extras` packlet. Every upstream-wrapping boundary in the repo is its own package,
  and adding `@typesafe-ai/sdk` to `ts-extras` would give a dependency to every `ts-extras` consumer.
- It is named for the wire (`/v1/systemone`, the "System One API" in all three servers). It is not
  named `-clm` (CLM is not what it wraps) or `-typesafe` (consumers pick the backend, and the vendor
  is one of three). The name is OQ-2.
- **Dependency posture: direct.** The convention's axis is whether the consumer must control the
  version or the instance. The SDK is a pure-JS protocol client with no native binding and no
  consumer-owned handle, which matches the `ts-extras-mcp` and webauthn precedents. Pin it `~0.6.0`:
  it is three weeks old and 0.x (E10), and a minor bump is a wire risk to review, not to absorb.
- Node-only because the SDK refuses browsers by default to protect the key (E13). A browser sibling
  is deferred (D3).
- **Lockstep:** a new package publishes with everything at the next alpha. It is new surface on no
  `main` release, so its change file is `minor` (`ACTIVE_DEVELOPMENT.md` § change-file typing). It
  joins the active-development table.

### 6.5 Python in the loop

**Decision: fgv speaks HTTP to a server the consumer operates. fgv consumers have no Python
dependency, and fgv manages no process.** This matches `ts-extras-ollama`, which expects an Ollama
host and does not run one. Whoever wants CLM runs `clm-serve` plus vLLM (or openjev's `openjev-clm`
container). The package's README gives the recipe and the floors (§7). Process lifecycle, health
supervision and model download are explicitly out of scope.

## 7. Inner-loop viability: the honest answer

*Status note, 2026-10-01: this section is the Phase A analysis of the brief's original premise, that
CLM would run on the developer's own machine. The user has since chosen a different topology:
production runs CLM locally, and development uses a remote server. §7.1 records that decision and
supersedes this section's conclusions wherever they differ. The floor facts below still hold, and
they are why the chosen topology is the right one.*

The brief's premise: Jev is hosted, so it cannot serve an inner loop. CLM is "locally hostable".

**For CLM-8B on a developer laptop, the answer is no.**

- The supported path needs vLLM serving Qwen3-8B on an NVIDIA GPU (E4). Weights are 16.4 GB at bf16
  (E19). openjev reports 7.7 GB at FP8 on an RTX 3090 (E21). The realistic floor is a Linux machine
  with a 12 GB-plus NVIDIA card. That is a workstation or a LAN GPU box, not a MacBook.
- `pip install contrastive-lm` pulls in vLLM as a hard dependency (E3), even though nothing imports
  it. On a machine where vLLM cannot be installed, CLM cannot be installed.
- **The GGUF does not change this** (E18). It is heads only. It needs the full 16.4 GB BF16 Qwen3 GGUF
  (the only verified-parity encoder) inside a third-party Rust CLI, and that CLI is not a
  `/v1/systemone` server, so nothing fgv-shaped could talk to it.
- An unproven laptop path exists. `clm-serve --emb-url` accepts any OpenAI-style embeddings endpoint,
  and `llama-server --embeddings --pooling last` with a quantized Qwen3-8B GGUF could, in principle,
  back it on Apple silicon (E20). Every link in that path is unverified: the vLLM install obstacle,
  quantization accuracy (E19), `truncate_prompt_tokens` handling, and numeric parity. OQ-3 dropped
  this path, since nobody needs CLM on a laptop. Its Ollama analogue in deployment is OQ-12.

**For development without a local GPU, the answer is "yes, but not via CLM on the developer's
machine, and with a caveat that matters."** Because the wire is shared, the design in §5 lets
development use *any* wire-compatible server, local or remote:

| backend | runs on | floor | status |
|---|---|---|---|
| CLM via `clm-serve` + vLLM | Linux and NVIDIA | ~8–16 GB VRAM | verified requirement (E4, E19); FP8 figure reported (E21) |
| openjev, DiffusionGemma, MLX | Apple silicon | ~16 GB to load, 23–36 GB in service | reported (E21) |
| openjev `verdict-1.4` / `laya-1.0` | CPU | 1.2 / 2.5 GB (GPU figures); 512 / 1,024 tokens | reported (E21) |
| remote: hosted Jev, Codiv, or a self-hosted openjev / `clm-serve` | elsewhere | none locally | **the chosen development path** (§7.1), so a WAN round trip is added to every call |

**The caveat:** an inner loop on model X tests **plumbing**: request shape, failure handling, how the
consumer reacts to a distribution. It does **not** tune **thresholds** for production. Probabilities
are relative to the set (§3), and they are model-specific. A consumer that tunes a 0.8 cut-off against
Jev, or against a 151M CPU model, and then ships against CLM has tuned nothing. That limit holds whichever model sits behind
the URL, and the README has to say it plainly.

Running CLM itself on a laptop is still not served. Under the chosen topology nothing requires it,
and a remote `clm-serve` or an openjev `clm-v0.1` route gives development the same weights as
production (§7.1, item 2).

### 7.1 The decided topology: local in production, remote in development

*The user's decision, 2026-10-01:* the deployed environment can run Qwen locally, so CLM runs as a
sidecar next to the consumer. Development machines connect to Jev or openjev running elsewhere. Both
cases are the same client with a different `baseUrl`, `model` and `apiKey`. That configuration is
written at the composition root, so §6.3 holds: platform `fetch`, and no per-call URL. A remote
development server is reached over `https` with a real key.

The design above already supports this topology. These are the consequences that have to be designed
for rather than discovered:

1. **Development and production answer with different models.** Jev and openjev's default models are
   not CLM. A development run proves plumbing, failure handling and the consumer's control flow. It
   says **nothing** about production thresholds, because probabilities are model-relative (§3).
   Production thresholds are tuned against CLM.
2. **A remote CLM narrows that gap without closing it.** openjev serves CLM under the model id
   `clm-v0.1` (E21). An openjev instance with that route, or a remote `clm-serve`, gives development
   the same weights. **The behaviour is still not identical.**
   - openjev's CLM truncates the *start* of an over-long state, where upstream truncates the end
     (E16, E21).
   - openjev defaults to FP8 encoder weights, and reports 98.5% top-option agreement with bf16 (E21).

   The design does not depend on which remote is chosen. It only requires that `model` is never
   defaulted (§8). The model ids differ across backends (`clm-latest`, `clm-v0.1`, `jev-latest`), and
   a wrong default fails as `invalid-request` at best.
3. **Truncation differs per backend, so the input bound must not.** This is why `inputLimit` is a
   **per-call argument in code, not client configuration** (§6.1). It cannot then vary with the
   environment, and development refuses exactly the inputs production refuses. Set it from the
   production backend's bound. Upstream CLM is the strictest relevant one, and the one that cuts the
   question.
4. **`confidence` differs per backend** (E7 against E21), and it differs even between two servers
   serving the same CLM weights: openjev's `clm-v0.1` route reports E21's formula, and `clm-serve`
   reports E7's. A consumer that branched on it would behave differently in development and
   production by construction. The boundary therefore does not return it (§8). Thresholds on
   `probabilities` are still model-relative (item 1), but they keep one meaning on every server, so a
   development run against openjev's `clm-v0.1` exercises the same quantity production uses.
5. **The SDK's environment fallbacks.** The SDK reads `TYPESAFE_BASE_URL`, `TYPESAFE_API_KEY` and
   `TYPESAFE_DEFAULT_MODEL` when values are omitted (E12). The boundary always passes explicit values,
   so a developer's shell variable cannot silently redirect a deployed client. The composition root
   chooses the environment, and the SDK never does.
   *Amended 2026-10-03 (Phase B):* there is a fourth fallback, `TYPESAFE_LOG_LEVEL` (E29), and at
   `debug` the SDK logs request bodies, which carry the state. The boundary therefore also passes
   `logLevel` and `logger` explicitly, and never selects `debug` (plan § 3.4).
6. **What runs Qwen in production.** *Answered by the user on 2026-10-01: probably vLLM on an Olares
   One, and Ollama in some other environments.* CLM's heads were trained on vLLM, Qwen3-8B, bf16,
   last-token-pooled embeddings (E2, E4). The two answers therefore carry very different confidence.
   - **Olares One with vLLM is the supported path.** 24 GB of VRAM (E24) holds Qwen3-8B in bf16 (about
     14 GB resident according to E21) with room for the CLM vector cache. Two caveats, both
     unverified, are OQ-10:
     - The RTX 5090 is a Blackwell part, which needs a vLLM and CUDA build that supports it.
     - On a shared device, vLLM's default GPU-memory claim has to be lowered (`--gpu-memory-utilization`),
       as openjev does for its CLM container (E21).
   - **Ollama is a different encoder path, with three differences.** Two are silent; the third,
     on current Ollama, is probably loud instead (item 2 below, amended 2026-10-02). `clm-serve
     --emb-url` can point at Ollama's `/v1/embeddings`: the request shape and `encoding_format:
     base64` are accepted (E25). But:
     1. **CLM's 2048 bound is not applied.** Ollama drops `truncate_prompt_tokens` (E25) and truncates
        at its own `num_ctx` instead, keeping the start (E26). Inputs between 2,048 tokens and
        `num_ctx` are embedded in full, which is longer than anything the heads were served under.
        Inputs beyond `num_ctx` lose the question, as upstream CLM does.
     2. **Pooling.** *On Ollama `v0.35.0`, the request probably fails outright* (E27a, derived). A
        base Qwen3-8B GGUF carries no `pooling_type`, so Ollama starts its bundled `llama-server`
        without `--embedding`, and that server refuses embedding requests. `clm-serve` then answers
        `502` (E9), and the boundary reports `server`. That is a loud failure, not a silent one, and
        it means the Ollama leg may not run at all with base `qwen3:8b`. The one unchecked link is
        the library blob's own metadata. *On older Ollama releases*, which used Ollama's own runner,
        pooling is still unverified: if it does not pool the last token the way vLLM's pooling runner
        does, or if it pools an appended EOS, the heads receive different vectors and nothing
        reports an error. A GGUF that does carry `pooling_type` would be embedded with the pooling it
        declares, and then the silent version of this difference applies again.
     3. **Quantization.** Ollama serves GGUF, usually quantized. The only accuracy figure anywhere is
        openjev's FP8 result (E21), which says nothing about Q4 or Q8 (E19).

     The model has to be **base Qwen3-8B**. Ollama's library also carries `qwen3-embedding`, which
     has different weights and on which the heads are meaningless.
   - **What the boundary contributes, and where its job stops.** Because fgv refuses at the per-call
     `inputLimit` before any server truncates (§6.1), difference 1 is neutralised for inputs under the
     limit. Inputs never reach Ollama's longer window or either server's cut. Differences 2 and 3 are
     encoder fidelity, which an HTTP client cannot observe. The exception is difference 2's refusal
     on current Ollama, which the boundary does surface, as `server`. **Ollama-backed CLM results are
     unvalidated until a parity check against vLLM bf16 passes (OQ-12).** The boundary is indifferent
     to the encoder; the consumer's experiment is not.

## 8. Proposed package contract (Phase C sketch, not code)

`@fgv/ts-extras-system-one`, Node ≥ 20, a direct dependency on `@typesafe-ai/sdk ~0.6.0`, and peer
dependencies on `@fgv/ts-utils` and `@fgv/ts-json-base`.

| primitive | wraps | returns |
|---|---|---|
| `createSystemOneClient({ baseUrl, model, apiKey, timeoutMs?, retry?, logger? })` | `new TypeSafeClient(...)` | `Result<ISystemOneClient>`. **`baseUrl` and `model` are required**: the SDK defaults (`api.typesafe.ai`, `jev-latest`) would silently send CLM a model it rejects with 422 (E9), and would make the backend choice invisible at the composition root. `logger` is an fgv `ILogger` adapted to the SDK's `Logger`. |
| `askSystemOne(client, { state, questions, inputLimit, signal? })` | `client.systemOne(...).withResponse()` | `Promise<DetailedResult<ISystemOneAnswer<Q>, SystemOneFailureReason>>`. Runs the §6.1 bound, then the call, then **response validation** (below). Returns `{ result, meta }`. `result` is the SDK's `SystemOneResult<Q>` with `confidence` removed from `choice` and `score` answers (a mapped type over the SDK's, not a parallel definition; see below), with answer types inferred from `questions`. `meta` is `{ model, usage, elapsedMs, requestId?, serverTiming? }`, described below. |
| `listSystemOneModels(client)` | `client.models.list()` | `Promise<Result<ReadonlyArray<ModelCard>>>` |
| `noul` / `choice` / `score` | re-exports | SDK question builders, so there are no parallel types |
| `measureSystemOneInput(state, questions)` | — | the per-question and per-criterion lengths that the §6.1 check uses, so a caller can size a budget before calling |

**Response validation, which the SDK does not do (E13).** The validator is built from the request's
own questions:

- Every question id is answered, with the right `type`.
- `choice.probabilities` keys equal that question's criteria keys, and `choice` is one of them.
- `score.probabilities` keys are `0..n-1`, and `score` is within `[0, n-1]`.
- `noul` is within `[0, 1]`.
- Every probability is finite, and each distribution sums to 1 within a tolerance.

A mismatch is `'invalid-response'`. A server can return a well-formed answer to a different set of
questions, and none of the three servers promises otherwise. Use `Converters` / `Validators` per
`/type-safe-validation`; never a cast.

**`confidence` is not returned.** *Decided 2026-10-02 by the verification pass.* Phase A made omitting
`inputLimit` a compile error, but handled `confidence` with advice ("branch on `probabilities`"). The
two hazards have the same shape: a number whose meaning the consumer cannot see changes with the URL.
The asymmetry does not survive inspection, so this design closes it. Four options were weighed:

1. *Pass it through, documented* (Phase A). **Rejected.** The decided topology changes the URL
   between development and production (decision 6). The formula changes even between two servers
   that serve the same CLM weights (§7.1, item 4). A field that is wrong by construction for the
   consumer's own experiment is the kind of thing the repo removes rather than documents.
2. ***Omit it.* Chosen.** Both known definitions, CLM's (E7) and openjev's (E21), are pure functions
   of the returned `probabilities`. Omitting the field therefore loses no information on either
   backend. A consumer that wants either can compute it in a line, and the formula is then named in
   the consumer's own code. The only definition lost is Jev's, which is unknown (E14) and so could
   not have been interpreted anyway.
3. *Return it wrapped with its definition.* **Rejected.** The boundary cannot know the definition.
   The SDK documents it only as "Reported confidence" (E11), Jev's formula is unknown (E14), and a
   model id does not identify the server: openjev's `clm-v0.1` and `clm-serve`'s `clm-latest` serve
   the same weights under different formulas. A wrapper would label each number with a guess. That
   is the promise of equivalence §5.1 already refuses to make through an interface.
4. *Name it per backend.* **Rejected** for the same reason: it needs the boundary to know which
   server answered.

Why the asymmetry arose: `inputLimit`'s hazard cannot be seen after the call, because truncation is
unreported on the wire (E15). It had to be prevented up front. `confidence` can be seen, so
explaining it looked sufficient. But a visible number that misleads still misleads. Preventing it is
also cheaper than preventing truncation: the field is simply left out of a projection the boundary
already builds for response validation.

**Per-call `meta`, there because adoption is decided by measured performance (§1, decision 6).** The consumer's
experiment needs, for every call:

- the answering `model`, so a development run against Jev is never mistaken for a CLM run;
- `usage`;
- `elapsedMs`, client wall time including any SDK retries, measured by the boundary;
- `requestId`, from `x-typesafe-request-id` when the server sends one;
- `serverTiming`: the raw `Server-Timing` (openjev) or `X-CLM-Latency-Ms` (CLM) header value,
  **passed through unparsed**. Each backend formats it differently, and parsing it is the consumer's
  analysis, not the boundary's.

This is measurement, not policy. Nothing aggregates it, and nothing acts on it.

**Development latency is not production latency.** In development, `elapsedMs` includes a WAN round
trip to a remote server, which runs a different model on different hardware. Only measurements taken
against the deployed sidecar say anything about production. Having `serverTiming` next to `elapsedMs`
is what lets the consumer separate model time from network time.

**`SystemOneFailureReason`:**

- `input-over-limit`
- `invalid-request` (400/422)
- `unauthorized` (401/403)
- `rate-limited` (429)
- `server` (5xx, including CLM's 502 when the embedder is down)
- `connection`
- `timeout`
- `aborted`
- `invalid-response`

These are classified from the SDK's error classes and the HTTP status, never from body text, because
the bodies differ by backend (E9 against E21).

**Explicitly NOT in scope:**

- CLM's `/v1/rank` (use `choice`).
- `temperature` and openjev's extensions (`images`, `steps`, `samples`, `think`, `sequential`).
- A browser sibling.
- Any fgv `ISystemOneDecider` interface (§5.3).
- Sidecar process management, health supervision, model download.
- `confidence` in any form, raw or backend-normalised (D6).
- Exact token counting.
- Threshold or decision policy, which belongs to the consumer.
- Retries beyond passing through the SDK's policy.
- Fine-tuning.

**Amended 2026-10-03 (Phase B).** Five refinements to the sketch above, each derived from a fact the
sketch did not have. None changes decisions 1–6. The plan's § 3 is the authoritative surface.

1. **`createSystemOneClient` takes `fetch?`**, typed as the SDK's `Fetch` (E31). §10 item 1 requires
   unit tests "through its `fetch` seam", which the sketch's parameter list did not expose, and it is
   the seam a guarded fetch (D7) would later plug into without a contract change. It does not
   reintroduce a per-call URL: §6.3 stands.
2. **`logLevel` and `logger` are always passed to the SDK, and `debug` is never selected** (E29).
3. **The failure classification is total.** Any 4xx not named in the list is `invalid-request`
   (including 404, which the SDK has its own class for), 408 is `timeout`, and any other non-2xx is
   `server`. `APITimeoutError` is tested before `APIConnectionError`, which it extends (E30). The
   SDK's synchronous `TypeSafeError` before the call is `invalid-request`; the same class raised
   after a response by `models.list()` is `invalid-response` (E30).
4. **`serverTiming` names its header.** The two backends format it differently, so a raw value the
   consumer cannot attribute is not parseable. `meta` carries `timingHeaders`, holding whichever of
   `server-timing` and `x-clm-latency-ms` were present, unparsed.
5. **`@fgv/ts-json-base` is a dependency only if the source imports it.** The SDK types `state`
   itself, so it is expected not to be.

## 9. Prospective consumers

`CODING_STANDARDS.md` § *We Build General Capabilities* applies. These consumers shape priority, not
the contract above. The question here is only whether any of them would use it.

| consumer | fit | what it would need | verdict |
|---|---|---|---|
| **`ts-prompt-assist` screeners** | **Good.** `IScreener.screen(ctx) → Promise<Result<ISafeguardFinding[]>>` (`types/safety.ts:53-58`) is async and Result-valued. `ISafeguardFinding.metadata` is documented for "a classifier's per-label scores". A `noul` per policy maps P(violation) to a disposition, with P in `metadata`. **No interface change.** | A screener factory, `createSystemOneScreener(client, policies, thresholds)`, which belongs in a consumer-side stream (D9). It screens one slot value at a time, which fits a per-slot policy. | **The strongest first consumer.** The shape matches, and the threshold caveat (§7) is the consumer's to own. |
| **`ts-agent-tasks`** | **Weaker than the brief claimed** (§2). Available commands are bare names from `task_inspect`. Executing one needs model-written `parameters` (`outcome`, `reason`, `title` …), which a System-1 model cannot produce. There is **no selection seam**: the only chooser is the model making a tool call. | A new host-side seam, for example "rank the available commands" as a pre-filter or verifier ahead of the LLM turn. That is a design change in `ts-agent-tasks`, not an adapter. `start` and `resume` carry no parameters, so a pure choice could execute only those. | **Not a v1 consumer.** At most a verifier or pre-filter, and only after `ts-agent-tasks` decides it wants a selection seam. |
| **`ts-agent-memory` retrieval** | **Partial.** `IMergeStrategy.merge` is synchronous, does not receive the query, and returns an order (`retrieve/hybridRetriever.ts:24-32`). The only async seam that sees the query is wrapping an `IMemoryRetriever`. There is no reranker interface. | A rerank seam that receives the query, or a wrapping retriever, plus acceptance that rerank probabilities are set-relative (no absolute relevance cut-off) and that each candidate record is truncated at the backend bound (E17). | **Not a v1 consumer.** A plausible later one if a rerank seam is added on its own merits. |

Net: one consumer fits as-is. *Resolved 2026-10-01 (OQ-1):* the driving consumer will experiment with
the package, and whether it adopts it depends on how it performs. That is enough to build it, because
the package is general on its own terms, and §8's `meta` serves the experiment without bending the
contract toward one consumer. The experiment's conclusions about whether CLM is good enough belong to
the consumer. The boundary makes them observable; it does not make them.

## 10. Validation Phase C must do before claiming anything

No success may be claimed from mocked SSE-style fixtures alone. This is the `TESTING_GUIDELINES.md`
§ *Coverage Gap Resolution* lesson.

1. **Unit tests** against the SDK through its `fetch` seam, with recorded CLM-shaped and Jev-shaped
   bodies (E5, E11). Required cases:
   - every failure reason;
   - the input-limit refusal, which must fire before any fetch;
   - validation rejecting a mismatched answer set;
   - a `choice` or `score` answer carrying no `confidence`, whatever the backend sent.
2. **Live round trips, one per topology leg (§7.1)**, each recorded in the stream's `result.md` with
   backend, model, hardware and the `meta` it returned:
   - a remote development server (Jev or openjev), over `https` with a key;
   - CLM on a local sidecar as deployed (`clm-serve` on loopback), **once for each encoder that is
     actually deployed**: vLLM on the Olares One, and each Ollama setup. A round trip proves the
     wiring only. Encoder fidelity is OQ-12.

   Any leg that was not run is recorded as **"not run live"**, never inferred from the other leg.
3. **A test that the request body carries `model`**, since the SDK's default would otherwise hide a
   misconfiguration.

## 11. Deferred

1. **D1 — CLM `/v1/rank`.** It is a `choice`. Revisit only if a consumer needs ranks with no labels.
2. **D2 — `temperature` and openjev extensions.** They are backend-specific and the SDK does not
   type them.
3. **D3 — Browser sibling** (`@fgv/ts-web-extras-system-one`). It needs a key-exposure story first.
4. **D4 — In-process implementation:**
   - TS-native CLM heads over a Qwen3-8B last-token embedding endpoint, which would use
     `AiAssist.callProviderEmbedding`; or
   - a small encoder model via `@fgv/ts-extras-transformers`.

   This is the trigger for an `ISystemOneDecider` interface (§5.3). It needs numeric-parity evidence
   first.
5. **D5 — Exact token pre-measurement** using each backend's tokenizer (for example a Qwen3 tokenizer
   loaded through transformers.js, which is unverified). It would replace the character proxy for
   backends whose tokenizer is known.
6. **D6 — Backend-normalised confidence**, computed from `probabilities`. This adds opinion, so it
   waits for a consumer to ask. The backends' own `confidence` is not returned at all (§8).
7. **D7 — A `fetch`-shaped safer-fetch adapter**, for a consumer that needs to reach a System-1 server
   whose URL it does not control.
   *Phase B, 2026-10-03:* this is the same primitive as PersonAIlity ask personaility#672 (entry 12 of
   `integration/asks`' `followups.md`): a guarded, `fetch`-shaped, non-buffering fetch. A
   non-buffering one serves D7 too, because the SDK buffers for itself (E31); the reverse does not
   hold. It is designed once, in safer-fetch, not here. This package needs only the `fetch?`
   parameter (§8, Phase B amendment 1) to accept it later.
8. **D8 — Sidecar process management** (spawn, health, download), as for Ollama.
9. **D9 — Consumer integrations**, each as its own stream:
   - a prompt-assist System-1 screener factory;
   - an agent-tasks command-selection seam;
   - an agent-memory rerank seam.
10. **D10 — An encoder-parity harness** (OQ-12): a `perf/` script that runs a fixed question set
    against two System-1 endpoints and reports agreement. It uses only the package's public client
    and needs no new surface. It is a candidate for Phase C if triage wants it to ship with the
    package rather than live in the consumer.
    *Decided 2026-10-03 (Phase B): it ships in Phase C*, as `perf/systemOneLive.js` (OQ-12 below;
    plan § 8).

## 12. Open questions for Phase B

Each question is followed by what would resolve it.

1. **OQ-1 — Is there a committed first consumer? RESOLVED 2026-10-01 (user).** The driving consumer
   will experiment with the package, and adoption depends on performance. Phase C proceeds. Its
   consequence for the design is §8's per-call `meta`.
2. **OQ-2 — Package name.** `@fgv/ts-extras-system-one` is provisional. *Resolved by:* triage. The
   constraints are §6.4's: not `-clm`, and not vendor-named if the backend is the consumer's choice.
   **RESOLVED 2026-10-03 (Phase B): `@fgv/ts-extras-system-one`, at `libraries/ts-extras-system-one`.**
   - It meets both of §6.4's constraints: it names the wire (`/v1/systemone`, the SDK's `systemOne`,
     "System One API" on all three servers), not CLM and not TypeSafe.
   - It follows the sibling rule, `ts-extras-<what is wrapped>`. `ts-extras-mcp` is the precedent for
     naming a protocol rather than a library.
   - `system-one` is the kebab form of the SDK's own `systemOne`. `systemone` would match the URL path
     but no identifier a TS consumer types.
   - The name is free on npm (E28).
   - **Rejected:** `-decisions` (names a use, not the wire; the screener consumer, §9, is a decision
     only loosely), `-typesafe` and `-clm` (§6.4).
3. **OQ-3 — Can CLM run on the user's inner-loop machine? RESOLVED 2026-10-01 (user), by changing the
   question.** CLM runs in the deployed environment, which can host Qwen. Development machines
   connect to Jev or openjev running elsewhere. Nobody needs CLM on a laptop, so the llama.cpp laptop
   experiment is dropped. The consequences are in §7.1. What remains open is what runs Qwen in
   deployment (OQ-10).
4. **OQ-4 — Recommended `maxChars` per backend.** *Resolved by:* measuring Qwen3-tokenizer token
   counts against character counts on representative states (task context, prompt slot values,
   memory records), then picking a value with a stated margin. The ModernBERT and Gemma tokenizers
   need the same if those backends are documented.
   **RESOLVED for upstream CLM 2026-10-03 (Phase B), from a derived measurement (E33).** The HF LFS
   CDN is still blocked, but `vocab.json` and `merges.txt` are not LFS objects, and they are enough to
   rebuild the tokenizer.
   - **The rule:** `maxChars = floor(B × r × 0.9)`.
     - `B` is the backend's token bound: `clm-serve --max-tokens`, default 2,048, which must not exceed
       the encoder's `--max-model-len` (E15).
     - `r` is the **minimum**, not the median, characters per token over 4,000-character windows of
       representative states, measured with the backend's own tokenizer. The failure being prevented
       is silent loss of the question, so the bound has to hold for the worst window, not the typical
       one.
     - `0.9` is the margin. It covers the reconstruction gap (E33 is derived) and drift between the
       measured corpus and production. It does **not** cover a content class that was never
       measured. Choosing `r` from the consumer's own states covers that.
   - **The README's recommended values for upstream CLM at 2,048 tokens:**
     - **2,400 characters** when the content class is unknown, or includes identifier- or
       number-dense runs (UUIDs, timestamps, hashes, numeric tables). `r` = 1.34 gives 2,469.
     - **4,400 characters** for states measured to be prose, Markdown, code or ordinary JSON records.
       `r` = 2.39 gives 4,405.
     - Anything above 4,400 only from the consumer's own measurement, by the rule.
     - The `TaskContextRenderer` default of 8,000 characters exceeds both, as §6.1 predicted.
   - **Not covered, and the README says so:** CJK and other non-Latin scripts (no corpus in this repo);
     openjev's 512- and 1,024-token CPU models and its Gemma model (other tokenizers); Jev (OQ-5).
   - **Phase C** puts E33's table and the rule in the README with the corpus described. It does not
     re-measure from a sandbox. When the Olares leg runs, live check L3 replays E33's windows through
     the deployed encoder's `/tokenize` (E35). A count that differs by more than the margin reopens
     this question.
5. **OQ-5 — Jev's semantics** (`confidence` formula, token bound, truncation, error bodies) (E14).
   *Resolved by:* reading `docs.typesafe.ai`, which is blocked here, or early-access observation.
   This does not block v1, because §5.2 already treats these as backend-defined.
   *Not answered by L1 (2026-10-08, E36),* although L1 was an observation of Jev: the probe projects
   `confidence` away and records no error body, and it measured no token bound or truncation.
6. **OQ-6 — Does the SDK behave against non-Jev servers in every path?** For example: a missing
   `x-typesafe-request-id`; whether openjev's `529` counts as retryable (the SDK retries `500–599`);
   CLM's `422` on unknown model being classified as `invalid-request`. *Resolved by:* §10.2's live
   round trip plus targeted fixture tests.
   **SPECIFIED FOR PHASE C 2026-10-03 (Phase B).** The SDK's side is now read at source (E29–E31), so
   the fixture half is no longer a guess about the client. Every path below is a named unit test in
   plan § 5 (U-numbers), and the server half is live checks L1 and L2:
   - a missing `x-typesafe-request-id` gives `meta.requestId: undefined` (U20);
   - openjev's `529` is retried and then reported as `server` (U13);
   - CLM's `422` and openjev's `400 api_usage_error` for an unknown model are `invalid-request`
     (U11, U12);
   - a 404 from a wrong `baseUrl` path is `invalid-request` (U12);
   - a 2xx non-JSON or empty body is `invalid-response`, not a success or a throw (U17);
   - `models.list()`'s shape error is `invalid-response`, while the same error class before the call
     is `invalid-request` (U10, U19).

   What stays open until L1 and L2 run: whether each real server sends the headers and the status
   codes the fixtures assume.
   **Jev answered by L1, 2026-10-08 (E36):** an unknown model is `400`, classified `invalid-request`,
   as openjev reports and unlike CLM's `422`; `x-typesafe-request-id` is sent; neither timing header
   is. CLM's server remains for L2; openjev and Codiv each need their own L1-style probe, and
   openjev's `529` retry path is still unobserved live.
7. **OQ-7 — Is `'unchecked'` safe to offer? RESOLVED 2026-10-02 (verification pass): keep it, and
   state exactly when it is correct.** This question's own condition, finding a backend that refuses,
   is met:
   - **vLLM refuses rather than truncates** when a request carries no `truncate_prompt_tokens`. At
     `v0.10.1`, `_validate_input` raises "This model's maximum context length is …"
     (`vllm/entrypoints/openai/serving_engine.py:574-601`). At `v0.30.0`, `_text_len_check` and
     `_token_len_check` raise the same way (`vllm/renderers/params.py:354-382, 494-519`). **verified.**
   - vLLM on its own is an encoder, not a `/v1/systemone` server, so it is not a backend this package
     targets. What reaches the boundary is `clm-serve`, which sends `truncate_prompt_tokens` by default
     (E15). **`clm-serve --max-tokens 0` sends none** (E15). A `clm-serve` over vLLM deployed that way
     therefore refuses any input longer than vLLM's `--max-model-len`. The refusal reaches the boundary
     as `502` (E9), so it is classified as `server`, and it cannot be told apart from an unreachable
     embedder. **derived** (E15, E9 and the vLLM lines above; not run).
   - openjev's `jevk5-0.2` returns `400` for a read over 16,384 tokens (E21, **reported**).

   **What this decides.** `'unchecked'` stays. Its README states that it is correct only when *every*
   backend the call site can reach refuses, and that under `clm-serve --max-tokens 0` a refusal
   arrives as `server`, not as `input-over-limit`. Under the decided topology that condition does not
   hold today. Development reaches Jev, whose behaviour is unknown (OQ-5), or openjev's CLM, which
   truncates the start (E21). Production `clm-serve` truncates unless it runs with `--max-tokens 0`.
   So the driving consumer uses `{ maxChars }`, and §7.1 item 3 is unchanged.
8. **OQ-8 — CLM `score` reliability** (E22). This is model quality, not the boundary's concern. Should
   the README warn about it? *Resolved by:* reproducing CLM issue #3 during §10.2. If it reproduces,
   the README carries the warning with the evidence.
9. **OQ-9 — SDK pin and churn.** Releases so far are 0.5.7 and 0.6.0, three weeks apart.
   *Resolved by:* triage choosing `~0.6.0` or an exact pin, and whether a minor bump needs a review
   gate.
   *Correction, 2026-10-03:* they are three and a half days apart (E28). The package is three weeks
   old.
   **RESOLVED 2026-10-03 (Phase B): `~0.6.0`, a direct dependency, and a review gate on every minor.**
   - **Why `~` and not exact.** On a 0.x version, `~0.6.0` and `^0.6.0` admit the same set (0.6.x),
     so the operator does not bound risk; the minor does. `ts-extras-transformers` uses `~4.2.0` for
     the same reason. An exact pin would buy nothing inside the monorepo, where the lockfile already
     pins the tested version, and outside it would give a consumer who also depends on the SDK a
     second copy.
   - **Patch bumps** take the ordinary path: `rush update`, then the unit suite. The boundary checks
     everything it relies on at its own edge (response validation, explicit configuration, total
     classification), so an untested patch on a consumer's install fails loudly rather than silently.
   - **A minor bump (0.7.0) needs a review gate** before the range moves:
     1. diff `dist/index.d.mts`;
     2. re-confirm the behaviours the boundary depends on (E29–E31, listed in plan § 9);
     3. the unit suite and the revert matrix green;
     4. live check L1 re-run.
   - npm's minimum release age already delays any new version by about a day (`CODING_STANDARDS.md`).
10. **OQ-10 — What serves Qwen3-8B in the deployed environment? ANSWERED 2026-10-01 (user):
    probably vLLM on an Olares One, and Ollama elsewhere.** For Olares, two items remain open. Both
    are setup checks, not design work:
    - whether the deployed vLLM build supports the RTX 5090, a Blackwell part;
    - a GPU-memory budget that coexists with the device's other workloads.

    *Resolved by:* the first successful `clm-serve` round trip on the device (§10, item 2). The
    Ollama environments carry OQ-12.
11. **OQ-11 — Which remote does development use for performance comparisons?** Jev gives the hosted
    comparison. An openjev or `clm-serve` instance serving CLM gives the same weights as production
    (with the differences listed in §7.1, item 2). *Resolved by:* the consumer's experiment plan. The
    package supports any of them unchanged.
    **Noted 2026-10-03 (Phase B); the consumer's to answer.** Nothing in the plan depends on the
    answer. L1 records which remote it used, so a result is never read as covering another.
    **L1 (2026-10-08) used hosted Jev** (`https://api.typesafe.ai`, `jev-latest` → `jev-1.13.0`),
    E36. It says nothing about CLM's weights or about openjev, Codiv or `clm-serve`.
12. **OQ-12 — Is Ollama-backed CLM faithful to vLLM-backed CLM?** It differs in pooling (E27),
    quantization (E19) and the truncation window (E25, E26) (§7.1, item 6). *Resolved by:* running the
    same fixed question set through `clm-serve` twice, once over vLLM bf16 on the Olares and once over
    each Ollama setup actually deployed (model tag and quantization recorded). Compare top-answer
    agreement and the per-option probability differences, with the acceptance threshold **written
    down before the run**, as `TESTING_GUIDELINES.md` § *Measurement Harnesses* requires. Use only
    inputs inside the `inputLimit`, so truncation is not what is being measured. A run that fails
    means Ollama environments use a remote vLLM-backed CLM instead. It is not a reason to loosen the
    threshold. This is the consumer's experiment, but the harness is backend-agnostic. Phase B
    decides whether it ships as a `perf/` script in the package (D10).
    *Precondition, added 2026-10-02:* on Ollama `v0.35.0` with base `qwen3:8b`, the Ollama leg probably
    fails before any comparison is possible (E27a). The first step is a single round trip. A refusal
    there is recorded as a refusal, not as a parity result.
    *Phase B, 2026-10-03:* E34 narrows E27a's open link to the library blob itself. **Whether Ollama
    environments stay in the topology is the user's decision U1** (triage `result.md`). The harness
    question is decided:
    **D10 RESOLVED 2026-10-03 (Phase B): the harness ships in the package as `perf/systemOneLive.js`.**
    - It is backend-agnostic and uses only the public client (D10), and measurement scripts belong
      under `perf/` (`TESTING_GUIDELINES.md` § *Measurement Harnesses*). `perf/` is outside the
      package's `files`, so nothing is published.
    - It **refuses to run a parity comparison unless the thresholds are given as arguments**, and it
      prints them before the first request. "Threshold written down before the run" is then enforced
      by the script, not remembered.
    - E27a's precondition is its first step: one probe round trip per endpoint. A failed probe exits
      with its own code and the classified reason, never as a parity result.
    - Specified in plan § 8.

## 13. Revert matrix

**None.** This phase adds documentation only. There is no code, no package, no dependency, and no
behaviour to protect or revert.
