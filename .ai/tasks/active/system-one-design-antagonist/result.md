# Result — `system-one-design-antagonist`

**Shipped:** a verification pass over the Phase A System-1 design. Every §2 citation now names the ref
it was read at. E16 and E27 are split so that each link carries its own marker. OQ-7 is resolved:
`'unchecked'` stays, with a stated correctness condition. §8 now omits `confidence`, which answers the
asymmetry the brief asked about. Docs only:
[`docs/design/system-one-decisions/design.md`](../../../../docs/design/system-one-decisions/design.md).

## Facts that contradict a decision

**None.** Decisions 1–6 stand. Decision 4's text was amended to say why it does not depend on which
end of the input is cut (truncation is unreported either way, E15), so even a wrong E16b would not
move it.

**Two findings come close. They do not contradict a decision, but Phase B should read them first:**

1. **§7.1 item 6 called Ollama's pooling difference "silent". On current Ollama it is probably a hard
   failure** (E27a, derived). At Ollama `v0.35.0`, embeddings run through a bundled `llama-server`.
   That server is started with `--embedding` only when the GGUF carries `<arch>.pooling_type`. A base
   Qwen3-8B GGUF has no such key, because llama.cpp's converter writes it only from a
   sentence-transformers `modules.json`, which `Qwen/Qwen3-8B` lacks. Without the flag, `llama-server`
   refuses `/v1/embeddings`. **The Ollama leg of the decided topology may not run at all with base
   `qwen3:8b`.** The failure is loud: `clm-serve` returns 502, and the boundary reports `server`. The
   one unchecked link is the library blob's own metadata (`registry.ollama.ai` is blocked here). OQ-12
   now carries this as a precondition. It is not resolved.
2. **The brief's F1 was itself wrong in two ways, and its replacement evidence was from a vLLM CLM
   cannot run.**
   - **"No release in the pinned range contains `renderers/params.py`" is false.** The file exists in
     every release from `v0.16.0` through `v0.30.0`. The brief checked only 0.6.0, 0.6.6 and 0.9.0.
   - **v0.6.6 is not a version CLM's recipe can launch.** CLM's own launch command (README:59,
     `embedder.py:6`, `serve_qwen3_8b.sh`) uses `vllm serve … --runner pooling`, and `--runner` first
     appears as a flag at `v0.10.1`. `vllm>=0.6` is the declared range; **0.10.1–0.30.0 is the usable
     one.**

   The conclusion survives. I re-verified the mechanism at `v0.10.1` and `v0.30.0`, and F2's refusal
   at both. The design cites those versions, not v0.6.6.

## Status changes

**Downgrades (verified → derived, derived → reported): none at row level.** No row's stated status
was wrong. Three findings come closer to a downgrade than an upgrade, and are listed here for that
reason:

- **E16's tokenizer half had a hidden unverified link.** Phase A's chain ran "Qwen3's
  `tokenizer_config.json` sets no side → transformers' default is right". But a fast tokenizer also
  takes its side from a `truncation` section in `tokenizer.json` (`tokenization_utils_fast.py:157-163`
  @ `v4.55.0`, `tokenization_utils_tokenizers.py:430-436` @ `v5.18.0`). That file was never read. It
  cannot be read from here: it is an LFS object on `us.aws.cdn.hf.co`, which the proxy refuses. E16b
  now marks that link **unverified**.
- **§7.1 item 6's "three of its differences are silent" was a characterisation, not a fact.** On
  `v0.35.0`, difference 2 is derived to be loud (above). The text now says so.
- **§3's "only `probabilities` is comparable across backends" overstated.** `probabilities` has one
  *definition* everywhere, but its *values* are model-relative, as §3's own first bullet says. The
  wording now separates the two.

**Upgrades:**

| row | was | now | why |
|---|---|---|---|
| E16 | one **derived** marker on a compound claim | split: E16a **verified**, E16b derived with one unverified link, E16c position verified + two reports | vLLM half read end to end at `v0.10.1` and `v0.30.0` |
| E16c | openjev's "see CLM PR #6" (reported, PR unreadable) | PR #6's own commit `11211fc` read; the author states the mechanism | `refs/pull/6/head` is fetchable over git |
| E21 | openjev `confidence` formula **reported** | formula, its use on the `clm-v0.1` route, and the left-truncating wrapper **verified** in source | `openjev/engine.py:434-451`, `encoders.py:157, 291-302, 315` @ `dcd20947` |
| E25 | silent drop of `truncate_prompt_tokens` **derived** from Go's JSON decoding | the drop is **verified**: the middleware re-encodes only `Model`, `Input`, `Dimensions` (`middleware/openai.go:430` @ `v0.35.0`); only "no error at bind time" remains derived | |
| OQ-7 | open | **resolved** (below) | |

## Citations corrected

| row / place | was | now |
|---|---|---|
| E16 (vLLM) | `vllm/renderers/params.py` (main) | `serving_engine.py:532-547` @ `v0.10.1`; `pooling/base/protocol.py:42, 54-61, 110-136` + `renderers/params.py:180-185, 327-352, 460-484` @ `v0.30.0` |
| E16 (transformers) | `tokenization_utils_base.py:975`, no ref | `:1390` @ `v4.55.0`, `:984` @ `v5.11.0`, `:975` @ `v5.18.0`, chosen from vLLM's own `transformers` floors (`>=4.55.0` at v0.10.1, `>=5.10.4` at v0.30.0) |
| E16 (Qwen3 config) | "`truncation_side: null`" | the key is **absent**, not null (same effect) @ `b968826d` |
| E21 / E22 | "openjev README (raw, `main` = `master`)" | there is no `master` branch and no tags; pinned to commit `dcd20947`, with line numbers |
| E25 | `openai/openai.go:94-99` (main) | `:95-100` @ ollama `v0.35.0`, plus `middleware/openai.go:398-430` |
| E26 | `server/routes.go:1005-1047, 2205-2209` (main) | `:1002-1047, 2199-2209` @ `v0.35.0` (by 2026-10-02 `main` had moved ~16 lines) |
| E26 (content) | "reserves one token for an appended EOS when `add_eos_token` is set" | one token each for BOS and EOS, when the input lacks them and the flag is true **or absent** (default true); VRAM thresholds 23 / 47 GiB stated |
| E27 | `server/routes.go:987` (main) | same line @ `v0.35.0`; E27a added |
| E20 | `tools/server/README.md:175, 210`, no ref | @ `b11081` (Ollama's pin); unchanged @ `b11347` (latest) |
| E3 | `vllm>=0.6` only | plus the `--runner` floor at `v0.10.1` (`arg_utils.py:473`) |
| E9 | 502 "when the embedder is unreachable" | also on any non-200 from the embedder (`embedder.py:44-49`), which OQ-7's refusal path relies on |
| E15 | — | `--max-tokens 0` disables truncation (`embedder.py:42`, `server.py:203`); an over-large value is rejected by vLLM rather than clamped |
| E1, E2, E4–E9, E13, E15, E17, E18, E19, E23 | file:line with no ref | `@ sdist 0.1.0`, `@ SDK 0.6.0`, or `@ <HF sha>` added; line numbers unchanged |
| refuted-premise bullet 1 | `types/trackedCommands.ts:18-30` @ `2a95fbb2` | `:16-31` @ `release` `febf0b2b4` (content unchanged) |
| refuted-premise bullet 2 | `types/context.ts:176-190`, `:33-38` | `:170-190`, `:30-38` @ `febf0b2b4` (content unchanged) |
| header | inspected checkout `30713277c` | `16ec1622b` carrying `release` `febf0b2b4` |

## Citations checked and left alone

Each one was read at the stated ref, and both the line numbers and the claim still hold:

- **CLM, sdist 0.1.0:** `server.py:78-80, 96-119, 113-118, 121-153, 169, 170-171, 173-174`;
  `schema.py:62-65, 75-145, 115-145, 122-128`; `engine.py:116-128, 130-136, 138-149`;
  `embedder.py:41-43`.
- **CLM `main` @ `bb42c6c`:** E23's diff claim (the four files match; `engine.py` +2 lines of dict
  normalisation). No truncation fix has landed.
- **SDK 0.6.0:** `index.d.mts:36-158, 203-228, 327-375`; `index.mjs:347-352, 376, 392, 398, 511-512,
  681-686`; npm metadata (still `latest`; versions 0.0.0-bootstrap.0, 0.5.7, 0.6.0).
- **HuggingFace:** CLM card @ `e939398d` (licence, 75,816,125 bytes, `config.json`); Qwen3-8B @
  `b968826d` (licence, sizes); GGUF card @ `01d33811` (17 tensors, "does **not** contain", bitwise
  parity scope); `unsloth/Qwen3-8B-GGUF` @ `a6adef13` sizes.
- **openjev README @ `dcd20947`:** every E21 figure (7.7 GB / 99 ms, 14.1 GB bf16, 16 GB / 23.5–36.2
  GB, 151M / 512, 421M / 1,024, Codiv, `400 api_usage_error`, `529`, `Server-Timing`, FP8 98.5%);
  E22's issue #3 quote; §7.1 item 2's start-truncation claim.
- **llama.cpp:** `tools/server/README.md:175, 210` (content).
- **Ollama `v0.35.0`:** `api/types.go:610-611`; the `tokens[:ctxLen]` keep-the-start cut;
  `scheduleRunner(..., []model.Capability{}, ...)`.
- **In-repo, @ `febf0b2b4`:** `tools/schemas.ts:236-243` (exact);
  `ts-prompt-assist` `types/safety.ts:53-58` (exact); `ISafeguardFinding.metadata` "a classifier's
  per-label scores" (`types/trace.ts:97`, which the design names without a path);
  `ts-agent-memory` `retrieve/hybridRetriever.ts:24-32` (exact); `ts-extras` `ai-assist/http.ts:64`
  and `streamingAdapters/common.ts:288` (exact); safer-fetch `addressGuard` required with no
  default. §9's claim that `start` and `resume` carry no parameters also holds.
- **E14, E24:** not retried. Their hosts are blocked, and their rows were already honest.
- **The four attacks the brief fenced off** (E14/OQ-5, OQ-6, §7.1 item 6/OQ-12, §6.1/OQ-4) were not
  re-raised. The one exception is E27a, which is a sourced fact about item 6's pooling difference,
  not a re-argument of it.

## OQ-7: resolved

vLLM without `truncate_prompt_tokens` **refuses**, at both `v0.10.1` and `v0.30.0`. On its own, vLLM
is an encoder, not a `/v1/systemone` backend. But **`clm-serve --max-tokens 0` sends no
`truncate_prompt_tokens`**, so a CLM deployment configured that way is a refusing backend this
package does target. Its refusal arrives as `502`, which the boundary classifies as `server`.
openjev's `jevk5-0.2` also refuses (reported). **Decision:** keep `'unchecked'`. The README states
that it is correct only when every backend a call site can reach refuses. Under the decided topology
that does not hold today (Jev is unknown; openjev's CLM and default `clm-serve` truncate), so the
driving consumer uses `{ maxChars }`.

## The `confidence` decision

**Omit it from the boundary's answers** (design §8, option 2 of the brief's four). The reasons:

- **Nothing is lost.** Both known definitions are pure functions of the returned `probabilities`:
  CLM's top-minus-mean (E7) and openjev's `1 − H/ln K` (E21). Jev's is unknown, so it could not have
  been interpreted anyway.
- **The formula varies even with the weights held fixed.** openjev's `clm-v0.1` route serves CLM's
  weights under openjev's formula, which is now verified in source. So branching on `confidence`
  changes behaviour between a development openjev-CLM and a production `clm-serve`, not only between
  different models.
- **Options 3 and 4 need knowledge the boundary does not have.** A wrapped definition and a
  per-backend name both require knowing which server answered and what formula it used. The SDK
  documents the field only as "Reported confidence", and a model id does not identify the server.
- **Why the asymmetry arose.** `inputLimit`'s hazard cannot be seen after the call, so it had to be
  prevented. `confidence` can be seen, so prose looked sufficient. But a visible, misleading number is
  still misleading, and removing it is cheaper than the type `inputLimit` needed.

## Unverifiable from here vs unverifiable in principle

**From this environment only** (a blocked host; anyone with normal egress can read it):

| item | host | row |
|---|---|---|
| Jev's `confidence`, bound, truncation, error bodies | `typesafe.ai`, `docs.typesafe.ai` | E14 / OQ-5 |
| Olares One spec | `olares.com` | E24 / OQ-10 |
| CLM issue #3 | github.com web, `api.github.com` (issues are not git refs) | E22 / OQ-8 |
| Qwen3-8B `tokenizer.json` `truncation` section | `us.aws.cdn.hf.co` (HF LFS CDN) | E16b |
| `qwen3:8b` library blob metadata (`pooling_type`) | `registry.ollama.ai` | E27a |
| (tried once for E16b) ModelScope mirror | `modelscope.cn` | — |

**In principle, without running something** (no source, from any host, settles these; a GPU or a live
server does):

- quantized-encoder accuracy (E19);
- `llama-server` viability as CLM's encoder (E20);
- Ollama/vLLM parity, and the older Ollama runner's pooling (E27a, OQ-12);
- whether CLM issue #3 reproduces (OQ-8);
- the Olares Blackwell build and memory budget (OQ-10);
- the OQ-7 `--max-tokens 0` refusal path end to end, which is derived from source and was not run.

**Egress compared with the brief's table.** Every host the table lists as reachable was reachable.
Two refinements:

- **`huggingface.co` is reachable, but its LFS CDN is not.** The API and non-LFS files return 200;
  `us.aws.cdn.hf.co` is refused.
- **The git protocol to github.com works**, which the table does not list: `git ls-remote`, partial
  and sparse clones at any tag, and `refs/pull/*/head`. This is what made CLM PR #6, openjev's source,
  and Ollama's and llama.cpp's trees readable, and what established tag lists (vLLM, Ollama,
  llama.cpp, transformers).

OQ-5, OQ-8 and OQ-10's Olares items were left open, as the brief required.

## Gates

All run 2026-10-02 on the working tree carrying this stream's changes.

- **No `src/` file changed by this stream.** `git diff --name-only 16ec1622b` (the handed-over branch
  head) lists exactly `docs/design/system-one-decisions/design.md`,
  `.ai/tasks/active/system-one-design-antagonist/result.md` and `.../state.md`; none is under `src/`.
  **Note for the PR reviewer:** the PR diff against `integration/system-one-decisions` *will* show 253
  `src/` files. They come from the promoted-`release` merge (`16ec1622b`) that the orchestrator made
  before handing over, which the brief required. They are not this stream's.
- `rush change --verify --target-branch origin/integration/system-one-decisions`: **exit 0.** No
  change file is needed, because no package file was touched.
- `node common/scripts/verify-capability-docs.mjs`: **exit 0** (24/24 libraries, 75 reflexes, 0
  failed).
- `node common/scripts/generate-capability-feed.mjs --check`: **exit 0** (0 stale).
- **No revert matrix.** The change is docs only, so there is no behaviour to protect or revert. This
  gate is deliberately not applicable, not skipped.
- `/finalize-task` was not run. This stream finalizes with the design-triage-implement cycle after
  Phase C.
