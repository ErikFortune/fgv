# System-1 decisions — design

**Status:** Phase A (design) of the `system-one-decisions` design-triage-implement stream. Design
only: no package, no dependency, no change under any `src/`. Every external fact below is marked
**verified** (read at its source in this phase), **derived** (several verified sources taken
together, but not seen end to end), **reported** (a third party says it, and the source could not be
read here), or **unverified**. Nothing here was run. There was no GPU, and no System-1 server answered
a request in this phase.
**Amended 2026-10-01** with the user's answers to OQ-1 (the consumer will experiment, and adoption depends on performance) and OQ-3 (production runs Qwen locally; development connects to a remote Jev or openjev).
OQ-10 (Qwen runs on vLLM on an Olares One, probably, and on Ollama elsewhere) was answered the same day; see §7.1 item 6 and OQ-12. See §1 decision 6, §7.1, and §8 `meta`.
**Date:** 2026-10-01. **Inspected checkout:** `30713277c` (`release` HEAD, the base of
`integration/system-one-decisions`). `ts-agent-tasks` was read from `origin/integration/agent-tasks-v1`
at `2a95fbb2`.
**Brief:** [`.ai/tasks/active/system-one-decisions-design/brief.md`](../../../.ai/tasks/active/system-one-decisions-design/brief.md).

## 1. Decisions and scope

The question was whether fgv should support **System-1 decision models**, and how. These models
return typed values with probabilities instead of generated text. CLM-8B is the open implementation
driving the question, and TypeSafe AI's hosted Jev is what it claims compatibility with.

The short answer is **yes, in a narrower form than the brief expected, and not with the inner-loop
promise behind the question.**

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
   still needs the full 8B encoder in a separate Rust runtime driven from a CLI (§7). The user can
   still have an inner loop, because the wire is shared. A developer can point the same client at
   whatever wire-compatible server their machine runs: CLM on a Linux GPU box, openjev's MLX backend
   on Apple silicon, or a small CPU model behind openjev. In each case it is a different model, with
   different probabilities.
4. **Upstream CLM silently drops the question from an over-long state** (§6.1, derived), and
   openjev reports the same independently. fgv will **refuse at a caller-declared, mandatory input
   bound and never truncate**.
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

| # | Fact | Status | Source |
|---|---|---|---|
| E1 | CLM-8B weights are **Apache-2.0**. The base Qwen3-8B is **Apache-2.0**. The deployable pair is therefore Apache-2.0 on both halves. | **verified** | Model card `Contrastive-LM/CLM-v0.1-8B` (sha `e939398d`) § License, plus `cardData.license`. `Qwen/Qwen3-8B` API `cardData.license = apache-2.0` (sha `b968826d`). |
| E2 | The checkpoint is a single `CLM_v0.1-8B.pt`, 75 MB in the repo. `config.json`: `embedding_dim 4096`, `encoder_pooling last-token`. | **verified** | HF API `siblings` / `usedStorage 75816125`, and `config.json`. |
| E3 | The Python package is **`contrastive-lm`** 0.1.0 (import name `clm`), Apache-2.0, Python ≥ 3.10. **`vllm>=0.6` is a hard install dependency**, but no module in `src/clm/` imports vLLM; it is reached only over HTTP. | **verified** | PyPI JSON `requires_dist`, read from the sdist; `grep vllm src/clm/*.py` finds only a docstring. |
| E4 | **Two processes.** `clm-serve` is a FastAPI server on **port 8700** that holds the heads. It calls an OpenAI-compatible `/v1/embeddings` encoder on **port 8090** (vLLM, `--runner pooling`). The brief's "default port 8090" is the encoder, not the API. | **verified** | `server.py:170-171`; model card usage block. |
| E5 | **Wire, `/v1/systemone`.** Request `{state, model, questions: {id: Question}, temperature?}`. Questions are `noul` (`instructions`, optional `criteria {true, false}`), `choice` (`criteria {label: description}`), and `score` (`criteria` as an ordered list of at least 2 levels). Response `{model, answers, usage {billing_units, input_tokens, output_tokens}}`, plus an `X-CLM-Latency-Ms` header. | **verified** | `server.py:96-119`, `schema.py:75-145`, `client.py`; matches README § API. |
| E6 | **Answers.** `noul`: `{noul: P(true)}`. `choice`: `{choice, confidence, probabilities}`. `score`: `{score: Σ i·pᵢ, confidence, legend, probabilities}`. Probabilities are a softmax over `scale·cos/temperature` and are **relative to the supplied candidate set**. | **verified** | `schema.py:115-145`, `engine.py:130-136`; model card § Limitations. |
| E7 | **CLM's `confidence` is top probability minus the mean of the rest.** | **verified** | `schema.py:122-128`. |
| E8 | **`/v1/rank`** is a CLM-only convenience. It is literally a `choice` question whose criteria are the candidates (`engine.py:138-149`). | **verified** | `engine.py`, `server.py:121-153`. |
| E9 | **Errors.** CLM returns `401` for a bad key, `422` for a malformed request **or an unknown model**, and `502` when the embedder is unreachable. Auth applies only if `CLM_API_KEY` is set. The server **binds `0.0.0.0` by default**. | **verified** | `server.py:78-80, 113-118, 169`. |
| E10 | **`@typesafe-ai/sdk` 0.6.0** on npm (published 2026-09-15, created 2026-09-12): MIT, `engines.node >=20`, **no runtime dependencies**, ESM and CJS, `sideEffects: false`. | **verified** | npm registry metadata and tarball `package.json`. |
| E11 | The SDK's types (`dist/index.d.mts`) encode the same wire as E5/E6 (`NoulQuestion`, `ChoiceQuestion`, `ScoreQuestion`, `SystemOneResult`, `Usage`). It has **no `rank`, and no `temperature` field**, though "additional properties on a request variable are forwarded". | **verified** | `index.d.mts:36-158`. |
| E12 | `TypeSafeClientConfig` takes `baseURL` (default `https://api.typesafe.ai`, env `TYPESAFE_BASE_URL`), `defaultModel` (default **`jev-latest`**), `fetch`, `timeout` (default 10 s), `retry` (2 retries on 408/429/5xx), `logger`, and `dangerouslyAllowBrowser`. | **verified** | `index.d.mts:203-228`. |
| E13 | Runtime behaviour: the constructor **throws if no API key is given**, and throws in a browser unless opted in. `systemOne` checks the question count and score arity and then **`JSON.parse`s the response with no validation**. Failures throw a typed `APIError` subclass per status, `APIConnectionError`, `APITimeoutError`, or `APIUserAbortError`. | **verified** | `index.mjs:347-352, 376, 392, 398, 511-512, 681-686`; error classes `index.d.mts:327-375`. |
| E14 | **Jev's wire shape is what E11 encodes.** Jev's *semantics* are **not visible**: how it defines `confidence`, its token bound, its truncation behaviour, and its error bodies. TypeSafe's docs and blog are blocked by the egress proxy. | **unverified** | `typesafe.ai`, `docs.typesafe.ai`: CONNECT 403. |
| E15 | **CLM truncation.** `clm-serve --max-tokens` (default 2048, env `CLM_EMB_MAX_TOKENS`) is sent to vLLM as `truncate_prompt_tokens` **with no `truncation_side`**. Configurable: yes. Reported to the caller: no. | **verified** | `server.py:173-174`, `embedder.py:41-43`. |
| E16 | **Which end is cut.** vLLM falls back to the tokenizer's default side when `truncation_side` is unset. Qwen3-8B's `tokenizer_config.json` sets none. transformers' default is `"right"`, which keeps the first N tokens. CLM builds the state as **context, then the question last** (`schema.py:62-65`). So **an over-long state loses its question.** | **derived** | `vllm/renderers/params.py` (main) on the fallback; Qwen3-8B `tokenizer_config.json` (`truncation_side: null`); `transformers/tokenization_utils_base.py:975`. **Corroborated by openjev's README**: "Upstream CLM cuts the end (see CLM PR #6)". |
| E17 | Candidate texts (option descriptions) are embedded separately, and each is subject to the same bound. | **verified** | `engine.py:116-128` and `embedder.py`, which handle every text identically. |
| E18 | **GGUF (`EvoAwaken-Workshop/CLM-v0.1-8B-gguf`) contains the projection heads only**: 17 F32 tensors, 75.5 MB. It "does **not** contain the Qwen3-8B encoder". It runs through the third-party **`rust-model-inference`** CLI (`--jev --clm-head …`) with `Qwen3-8B-BF16.gguf` (16.39 GB). Bitwise parity is claimed only for scalar mode with BF16. | **verified** (card); parity **reported** | GGUF model card, and the HF API for file sizes. |
| E19 | Qwen3-8B sizes: safetensors 16.38 GB (bf16). GGUF Q8_0 8.71 GB, Q4_K_M 5.03 GB. Whether CLM's heads stay accurate on quantized embeddings is not established anywhere I could read. | sizes **verified**; accuracy **unverified** | HF API (`Qwen/Qwen3-8B`, `unsloth/Qwen3-8B-GGUF`). |
| E20 | `llama-server` offers `--pooling last` and `/v1/embeddings`, so in principle it could stand in for the vLLM encoder. Not tested, and no parity evidence exists. `truncate_prompt_tokens` is a vLLM field; what `llama-server` does with it is unknown. | flags **verified**; viability **unverified** | llama.cpp `tools/server/README.md:175, 210`. |
| E21 | **openjev** (`razorback16/openjev`, independent of TypeSafe) claims the same wire, "checked against the live API". It defines **`confidence` as `1 − H(p)/ln K`**, which differs from E7. It lists Jev's errors as `400 api_usage_error` for an unknown model, which differs from CLM's `422`. It serves CLM (FP8: 7.7 GB on an RTX 3090, 99 ms) and an MLX backend on Apple silicon (about 16 GB to load, 23–36 GB in service). It also serves small CPU-capable models (`verdict-1.4` 151M with 512 tokens; `laya-1.0` 421M with 1,024 tokens), and gives a free hosted endpoint (Codiv). | **reported** | openjev README (raw, `main` = `master`). |
| E22 | CLM `score` questions can ignore the state: "one level winning whatever the state says" (CLM issue #3). | **reported** | openjev README. CLM issues and PRs are blocked (github.com 403). |
| E24 | **Olares One:** NVIDIA RTX 5090 Mobile with **24 GB GDDR7**, 96 GB DDR5, Core Ultra 9 275HX. | **reported** (secondary) | TechRadar and Notebookcheck coverage. `olares.com/docs/one/spec` is blocked by the egress proxy. |
| E25 | **Ollama's OpenAI-compatible `EmbedRequest`** has exactly `input`, `model`, `dimensions` and `encoding_format` (`float` or `base64`). It has **no truncation field**, so CLM's `truncate_prompt_tokens` is dropped without error. | **verified** (struct). That an unknown field is silently ignored is **derived** from Go's default JSON decoding. | ollama `openai/openai.go:94-99` (main). |
| E26 | **Ollama truncates embedding input itself** by default (`truncate` defaults to true). It cuts to `min(context_length, num_ctx)`, **keeping the first tokens** (`tokens[:ctxLen]`), and reserves one token for an appended EOS when the model's `add_eos_token` is set. The default `num_ctx` is chosen by VRAM: 4,096, 32,768 or 262,144. | **verified** | ollama `server/routes.go:1005-1047, 2205-2209`, `api/types.go:610-611` (main). |
| E27 | Ollama's embed handler requires **no embedding capability**, so a generative Qwen3-8B can be asked for embeddings. **Which pooling it then applies** (CLM needs last-token pooling over Qwen3-8B, E2), and whether the appended EOS becomes the pooled token, is **not established**. | handler **verified**; pooling **unverified** | ollama `server/routes.go:987` (`scheduleRunner(..., []model.Capability{}, ...)`). Ollama's model and runner sources were not at any path I could reach. |
| E23 | CLM `main` today matches PyPI 0.1.0 in `server.py`, `schema.py`, `embedder.py` and `client.py`; the only differences are a download counter and dict normalisation. **No truncation fix has landed on `main`.** | **verified** | raw `main` against the sdist, diffed. |

Two brief premises turned out to be wrong. Both are recorded here because Phase B will reason from
them.

- *"`createTaskTools` hands a model the commands the view reports available — literally `/v1/rank`'s
  input shape."* **Partially refuted.** The available commands are bare names returned as data by
  `task_inspect`. The *executable* command tools are fixed when the tools are built, and their
  `parameters` must be written by a model (`succeed {outcome}`, `fail {reason}`, `set-title {title}`
  and so on). Sources: `types/trackedCommands.ts:18-30`, `tools/schemas.ts:236-243`. See §9.
- *"I1a … every omitted page item is named."* **Refuted.** `TaskContextRenderer` always reports
  omissions, but as **counts and reasons**, not identities (`ITaskContextOmissions`,
  `types/context.ts:176-190`). The 8,000-character default is **verified**
  (`types/context.ts:33-38`). The convention §6.1 relies on is "nothing is dropped *unannounced*", and
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
  shared, and the formula is not. Only `probabilities` is comparable across backends.

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
  and never learns which server answers.
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
compatibility**, which E14 makes unknowable from here. So the package documents `confidence` as
backend-defined, recommends `probabilities` for any cross-backend logic, and classifies failures by
HTTP status family rather than by body shape. It promises nothing about Jev's token bound.

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
  names itself.
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

See §7. **Decision: the package does not depend on, launch, or assume any particular backend.** The
inner-loop answer is "point it at whatever wire-compatible server your machine can run", and the
README documents the options it can honestly name, along with their measured or reported floors.

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

The user's motivation: Jev is hosted, so it cannot serve an inner loop. CLM is "locally hostable".

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
  quantization accuracy (E19), `truncate_prompt_tokens` handling, and numeric parity. This is OQ-3.
  It needs a machine to test on, not reasoning.

**For the user's actual goal, an inner loop with production on hosted Jev, the answer is "yes, but
not via CLM in particular, and with a caveat that matters."** Because the wire is shared, the design
in §5 gives the inner loop *any* local wire-compatible server:

| backend | runs on | floor | status |
|---|---|---|---|
| CLM via `clm-serve` + vLLM | Linux and NVIDIA | ~8–16 GB VRAM | verified requirement (E4, E19); FP8 figure reported (E21) |
| openjev, DiffusionGemma, MLX | Apple silicon | ~16 GB to load, 23–36 GB in service | reported (E21) |
| openjev `verdict-1.4` / `laya-1.0` | CPU | 1.2 / 2.5 GB (GPU figures); 512 / 1,024 tokens | reported (E21) |
| hosted (Jev; Codiv) | — | — | not an inner loop |

**The caveat:** an inner loop on model X tests **plumbing**: request shape, failure handling, how the
consumer reacts to a distribution. It does **not** tune **thresholds** for Jev. Probabilities are
relative to the set (§3), and they are model-specific. A consumer that tunes a 0.8 cut-off against a
151M CPU model and ships against Jev has tuned nothing. That limit holds whichever model sits behind
the URL, and the README has to say it plainly.

If the user's inner loop is a laptop *and* they need CLM's specific quality, **this design does not
serve that use today.** OQ-3 says what would change that.

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
4. **`confidence` differs per backend** (E7 against E21). A consumer that branches on `confidence`
   will behave differently in development and production by construction. Branch on `probabilities`.
5. **The SDK's environment fallbacks.** The SDK reads `TYPESAFE_BASE_URL`, `TYPESAFE_API_KEY` and
   `TYPESAFE_DEFAULT_MODEL` when values are omitted (E12). The boundary always passes explicit values,
   so a developer's shell variable cannot silently redirect a deployed client. The composition root
   chooses the environment, and the SDK never does.
6. **What runs Qwen in production.** *Answered by the user on 2026-10-01: probably vLLM on an Olares
   One, and Ollama in some other environments.* CLM's heads were trained on vLLM, Qwen3-8B, bf16,
   last-token-pooled embeddings (E2, E4). The two answers therefore carry very different confidence.
   - **Olares One with vLLM is the supported path.** 24 GB of VRAM (E24) holds Qwen3-8B in bf16 (about
     14 GB resident according to E21) with room for the CLM vector cache. Two caveats, both
     unverified, are OQ-10:
     - The RTX 5090 is a Blackwell part, which needs a vLLM and CUDA build that supports it.
     - On a shared device, vLLM's default GPU-memory claim has to be lowered (`--gpu-memory-utilization`),
       as openjev does for its CLM container (E21).
   - **Ollama is a different encoder path, and three of its differences are silent.** `clm-serve
     --emb-url` can point at Ollama's `/v1/embeddings`: the request shape and `encoding_format:
     base64` are accepted (E25). But:
     1. **CLM's 2048 bound is not applied.** Ollama drops `truncate_prompt_tokens` (E25) and truncates
        at its own `num_ctx` instead, keeping the start (E26). Inputs between 2,048 tokens and
        `num_ctx` are embedded in full, which is longer than anything the heads were served under.
        Inputs beyond `num_ctx` lose the question, as upstream CLM does.
     2. **Pooling is unverified** (E27). If Ollama does not pool the last token the way vLLM's pooling
        runner does, or if it pools an appended EOS, the heads receive different vectors and nothing
        reports an error.
     3. **Quantization.** Ollama serves GGUF, usually quantized. The only accuracy figure anywhere is
        openjev's FP8 result (E21), which says nothing about Q4 or Q8 (E19).

     The model has to be **base Qwen3-8B**. Ollama's library also carries `qwen3-embedding`, which
     has different weights and on which the heads are meaningless.
   - **What the boundary contributes, and where its job stops.** Because fgv refuses at the per-call
     `inputLimit` before any server truncates (§6.1), difference 1 is neutralised for inputs under the
     limit. Inputs never reach Ollama's longer window or either server's cut. Differences 2 and 3 are
     encoder fidelity, which an HTTP client cannot observe. **Ollama-backed CLM results are
     unvalidated until a parity check against vLLM bf16 passes (OQ-12).** The boundary is indifferent
     to the encoder; the consumer's experiment is not.

## 8. Proposed package contract (Phase C sketch, not code)

`@fgv/ts-extras-system-one`, Node ≥ 20, a direct dependency on `@typesafe-ai/sdk ~0.6.0`, and peer
dependencies on `@fgv/ts-utils` and `@fgv/ts-json-base`.

| primitive | wraps | returns |
|---|---|---|
| `createSystemOneClient({ baseUrl, model, apiKey, timeoutMs?, retry?, logger? })` | `new TypeSafeClient(...)` | `Result<ISystemOneClient>`. **`baseUrl` and `model` are required**: the SDK defaults (`api.typesafe.ai`, `jev-latest`) would silently send CLM a model it rejects with 422 (E9), and would make the backend choice invisible at the composition root. `logger` is an fgv `ILogger` adapted to the SDK's `Logger`. |
| `askSystemOne(client, { state, questions, inputLimit, signal? })` | `client.systemOne(...).withResponse()` | `Promise<DetailedResult<ISystemOneAnswer<Q>, SystemOneFailureReason>>`. Runs the §6.1 bound, then the call, then **response validation** (below). Returns `{ result, meta }`. `result` is the SDK's `SystemOneResult<Q>`, with answer types inferred from `questions`. `meta` is `{ model, usage, elapsedMs, requestId?, serverTiming? }`, described below. |
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
- A backend-normalised `confidence`.
- Exact token counting.
- Threshold or decision policy, which belongs to the consumer.
- Retries beyond passing through the SDK's policy.
- Fine-tuning.

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
   - validation rejecting a mismatched answer set.
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
   waits for a consumer to ask.
7. **D7 — A `fetch`-shaped safer-fetch adapter**, for a consumer that needs to reach a System-1 server
   whose URL it does not control.
8. **D8 — Sidecar process management** (spawn, health, download), as for Ollama.
9. **D9 — Consumer integrations**, each as its own stream:
   - a prompt-assist System-1 screener factory;
   - an agent-tasks command-selection seam;
   - an agent-memory rerank seam.
10. **D10 — An encoder-parity harness** (OQ-12): a `perf/` script that runs a fixed question set
    against two System-1 endpoints and reports agreement. It uses only the package's public client
    and needs no new surface. It is a candidate for Phase C if triage wants it to ship with the
    package rather than live in the consumer.

## 12. Open questions for Phase B

Each question is followed by what would resolve it.

1. **OQ-1 — Is there a committed first consumer? RESOLVED 2026-10-01 (user).** The driving consumer
   will experiment with the package, and adoption depends on performance. Phase C proceeds. Its
   consequence for the design is §8's per-call `meta`.
2. **OQ-2 — Package name.** `@fgv/ts-extras-system-one` is provisional. *Resolved by:* triage. The
   constraints are §6.4's: not `-clm`, and not vendor-named if the backend is the consumer's choice.
3. **OQ-3 — Can CLM run on the user's inner-loop machine? RESOLVED 2026-10-01 (user), by changing the
   question.** CLM runs in the deployed environment, which can host Qwen. Development machines
   connect to Jev or openjev running elsewhere. Nobody needs CLM on a laptop, so the llama.cpp laptop
   experiment is dropped. The consequences are in §7.1. What remains open is what runs Qwen in
   deployment (OQ-10).
4. **OQ-4 — Recommended `maxChars` per backend.** *Resolved by:* measuring Qwen3-tokenizer token
   counts against character counts on representative states (task context, prompt slot values,
   memory records), then picking a value with a stated margin. The ModernBERT and Gemma tokenizers
   need the same if those backends are documented.
5. **OQ-5 — Jev's semantics** (`confidence` formula, token bound, truncation, error bodies) (E14).
   *Resolved by:* reading `docs.typesafe.ai`, which is blocked here, or early-access observation.
   This does not block v1, because §5.2 already treats these as backend-defined.
6. **OQ-6 — Does the SDK behave against non-Jev servers in every path?** For example: a missing
   `x-typesafe-request-id`; whether openjev's `529` counts as retryable (the SDK retries `500–599`);
   CLM's `422` on unknown model being classified as `invalid-request`. *Resolved by:* §10.2's live
   round trip plus targeted fixture tests.
7. **OQ-7 — Is `'unchecked'` safe to offer?** It is meant for backends that refuse rather than
   truncate, and no backend is verified to do that. *Resolved by:* finding one that refuses (vLLM
   without `truncate_prompt_tokens` should refuse over-length input, which is unverified). Otherwise,
   drop `'unchecked'` and make `maxChars` the only form.
8. **OQ-8 — CLM `score` reliability** (E22). This is model quality, not the boundary's concern. Should
   the README warn about it? *Resolved by:* reproducing CLM issue #3 during §10.2. If it reproduces,
   the README carries the warning with the evidence.
9. **OQ-9 — SDK pin and churn.** Releases so far are 0.5.7 and 0.6.0, three weeks apart.
   *Resolved by:* triage choosing `~0.6.0` or an exact pin, and whether a minor bump needs a review
   gate.
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

## 13. Revert matrix

**None.** This phase adds documentation only. There is no code, no package, no dependency, and no
behaviour to protect or revert.
