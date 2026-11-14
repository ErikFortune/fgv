# Stream brief — `system-one-decisions-design` (Phase A: design)

**Phase A of a design-triage-implement stream.** Decide whether and how fgv should support
**System-1 decision models** — models that return typed values with probabilities instead of
generating text — with the open, locally-hostable **CLM-8B** as the driving implementation and
TypeSafe AI's hosted **Jev** as the thing it is compatible with.

**This phase produces a design document and nothing else. No implementation, no new package, no
dependency.** If the design's honest conclusion is *"not yet"* or *"not this way"*, that is a
successful outcome, not a failure — say so and say what would change it.

## Why this exists

The user's motivation, in their words: Jev is interesting but **hosted, so it is not suitable for an
inner loop**. CLM-8B is an open, locally-hostable model that claims Jev request compatibility. The
question is how — or whether — that becomes an fgv capability.

The user's own starting assumption was *"we probably just wrap the library to expose the Result
pattern like some of our other libraries"* and they explicitly flagged it as **untested**. The
orchestrator pressure-tested it and believes it does not hold (below). **Your job includes deciding
whether that pressure test was right.**

## Branch and PR posture

- **Integration branch:** `integration/system-one-decisions`, created off `release` HEAD
  (`30713277c`) and pushed. All phases of this stream land there; the orchestrator opens the
  cluster-close PR to `release` when implementation completes.
- **Your branch:** `claude/system-one-decisions-design`, off that integration branch.
- **PR into `integration/system-one-decisions`** — **not `release`.** Phase A design does not land
  on `release` as its own commit; it is substrate that informs the implementation.
- **Artifacts** in `.ai/tasks/active/system-one-decisions-design/`. Do **not** run `/finalize-task`
  — this stream finalizes at cluster close, after Phase C.

**Note on the base.** `release` does not yet contain the `ts-agent-tasks` cluster; it is on
`integration/agent-tasks-v1` and promotes shortly. `ts-agent-tasks` is a *prospective consumer* of
this capability (see below) — reference it in the design, but do not depend on its code being present
in your tree, and do not base this stream on the agent-tasks integration branch.

---

## What is established, with provenance

Verified by the orchestrator from the CLM GitHub repository (primary-ish) and secondary reporting.
**Treat each as a claim to confirm, not a fact to build on** — the orchestrator's briefs in the last
cluster had a premise overturned in four of six streams, always by reasoning from a plausible
mechanism without reading the thing that implements it.

**Jev** (TypeSafe AI, limited early access 2026-09-15): non-autoregressive, returns typed values with
probability/confidence rather than text. Three question types — choose among known options, score
against an ordered rubric, estimate whether a statement is true. ~100 ms per call. Hosted.

**CLM-8B** (`Contrastive-LM/CLM`, Apache-2.0): two ~9.4M-parameter heads (state + action) on a
**frozen Qwen3-8B**. Ships a Python package `clm`, a server `clm-serve`, inference and fine-tuning
code. HTTP surface: `POST /v1/systemone` (typed questions), `POST /v1/rank` (candidate ranking),
`GET /v1/models`, `GET /` (playground). Python API via `CLMClient` / `Engine` needs no server.
**Requires vLLM serving Qwen3-8B on a GPU** (default port 8090); the projection head falls back to
CPU. **States longer than 2048 tokens are truncated.** Claims Jev compatibility: *"a request written
for TypeSafe replays as `client.system_one(state, questions)`."*

Also in the landscape, unverified: `razorback16/openjev` (a Jev-compatible decision server on
DiffusionGemma) and `EvoAwaken-Workshop/CLM-v0.1-8B-gguf` (a GGUF conversion).

## What the orchestrator could not check, and must be checked

**`huggingface.co` is blocked by the orchestrator's egress proxy.** The user is attempting to open it
for your environment. Confirm from the model card at
`https://huggingface.co/Contrastive-LM/CLM-v0.1-8B`:

1. **The licence of the weights**, separately from the code's Apache-2.0. The head is reported
   Apache-2.0 at 75 MB, but the base is Qwen3-8B — **check Qwen3's licence terms**, because the
   deployable artifact is the pair and the base's terms govern it.
2. **The exact request and response JSON** for `/v1/systemone` and `/v1/rank` — field names, how
   questions are declared, how probabilities and scores come back, what errors look like.
3. **Whether the 2048-token state bound is configurable**, and what truncation actually does
   (silently drop, warn, refuse).
4. **Whether the GGUF conversion is usable** — specifically whether the custom heads survive it, or
   whether it is only the frozen encoder. This decides the GPU question below.

**If HuggingFace is still blocked for you, say so explicitly in the design and mark every one of
these as unverified.** Do not infer them from the GitHub README or from secondary reporting and
present the inference as fact. An unverified design that says which four facts it needs is far more
useful than a confident one built on guesses — and the repo has a standing lesson about exactly this
failure (`TESTING_GUIDELINES.md` § *Coverage Gap Resolution*: a stream once reported a live success
the code could not have produced).

## The orchestrator's pressure test — confirm or overturn it

**Claim: "wrap the library like our other libraries" does not transfer here.** Every instance of
fgv's Result-integration-boundary pattern wraps an **npm** library that runs in-process:
`@simplewebauthn/*` (`ts-extras-webauthn`), `@huggingface/transformers`
(`ts-extras-transformers`), `better-sqlite3` + `sqlite-vec` (`ts-agent-memory-sqlite-vec`), the MCP
SDK (`ts-extras-mcp`), and — note carefully — the **`ollama` JS client library**
(`ts-extras-ollama`), not raw HTTP to Ollama's port.

CLM ships no JS client at all. The closest mechanism in the repo is ai-assist's own provider adapters,
which do speak HTTP directly — but ai-assist is semantically wrong, because CLM is not a completion
provider and `ts-extras-ollama` already shows this repo cutting a capability out of a native wrapper
when ai-assist owns the equivalent path.

So the orchestrator's position is that **this is a new integration shape for fgv, not an application
of a known one.** Test that. Read
`.ai/conventions/result-integration-boundary.md` and `.ai/conventions/cross-runtime-interfaces.md`
and decide whether an existing convention covers it after all.

## The design question the orchestrator thinks is central

CLM advertises Jev request compatibility, and a third implementation (`openjev`) exists. That is a
**de facto wire contract with multiple implementations** — which is the situation fgv's
cross-runtime-interface convention exists for: *"code against the interface; pick the implementation
at the composition root."*

If that reading holds, the shape is **one System-1 decision interface with hosted Jev and local CLM
as implementations**, which is exactly what the user's stated goal requires — hosted in production,
local in the inner loop, consumer code unchanged.

**But do not adopt that because the brief says so.** The competing shape is a CLM-specific client
with no abstraction, on the grounds that one verified implementation plus one unverifiable hosted API
is not enough to design an interface against, and a premature interface is worse than none
(`CODING_STANDARDS.md` § *Avoid Over-Engineering*: "Three similar lines is better than a premature
abstraction"). **Argue it out and decide.** If you cannot see Jev's actual wire format — it is in
limited early access — say what that does to the confidence of an interface designed to span it.

## Constraints the design must address, not discover later

1. **The 2048-token state bound, and silent truncation.** This collides with repo convention:
   `TaskContextRenderer` bounds context at 8,000 characters by default, and I1a went to real trouble
   ensuring nothing is dropped unannounced (every omitted page item is named). A wrapper that
   inherits silent truncation would be the same defect one layer out. Decide what fgv does: refuse,
   report, pre-measure, or bound at the caller. **Name it.**
2. **The GPU and vLLM requirement versus "inner loop."** `clm-serve` wants vLLM serving an 8B encoder
   on an NVIDIA GPU under Linux. "Locally hostable" is not "runs on a developer laptop," and the
   user's whole motivation is the inner loop. Establish honestly what the floor is, whether the GGUF
   path lowers it, and whether this is viable for the use the user actually has. **If it is not, that
   is the single most valuable thing this design can report.**
3. **A localhost sidecar and `safer-fetch`.** The server-side default is `blockPrivateNetworks`, so
   reaching port 8090 requires a deliberate address-guard choice. Say which, and why it is safe for a
   loopback sidecar when the guard exists to stop SSRF.
4. **Where it lives.** A new `@fgv/ts-extras-clm` (or interface-named) package, versus a packlet in an
   existing one. Note the lockstep version policy: a new package publishes with everything else.
5. **Python in the loop.** The only client is Python. Decide whether fgv talks HTTP to `clm-serve`
   (no Python dependency for consumers, a process to run) or something else — and whether a
   consumer is expected to operate that process, as `ts-extras-ollama` expects an Ollama host.

## Prospective consumers, which make this more than a toy

Do not design these; establish whether the interface would actually serve them, because a System-1
scorer with no consumer is an interesting demo.

- **`ts-agent-tasks`** is the strongest: `createTaskTools` already hands a model *"the commands the
  view reports available"* for a task — a **declared candidate action set**, which is literally
  `/v1/rank`'s input shape. (On `integration/agent-tasks-v1`, promoting shortly.)
- **`ts-prompt-assist`** safety screeners — a typed true/false judgement per policy.
- **`ts-agent-memory`** retrieval ranking — candidate records scored against a state.

## Phases inside this one

1. **Establish the facts.** Fetch the model card (or record that you cannot). Read the CLM repo's
   actual server code and request/response types, not just its README. Pin the four unverified items.
2. **Test the orchestrator's pressure test** against the two conventions. Write down which existing
   fgv shape this is, or that it is none.
3. **Decide interface-versus-client**, with the argument both ways and what evidence would change it.
4. **Resolve the five constraints**, each with a stated decision rather than a survey.
5. **Assess the consumers** — would any of the three actually use this, and what would they need?
6. **Write the design** to `docs/design/system-one-decisions/design.md`, following the shape of
   `docs/design/agent-tasks/development-design.md` (read it for the house style — numbered sections,
   explicit open questions, a deferred list).
7. **Open questions, numbered**, each with what would resolve it. Phase B triage will work these.

## Acceptance criteria

- [ ] `docs/design/system-one-decisions/design.md` exists, with numbered sections and numbered open
      questions
- [ ] **Every external fact is marked verified or unverified, with its source.** Load-bearing: a
      design that presents an unread model card's contents as fact is worse than no design
- [ ] The four HuggingFace items are either confirmed with citations or listed as blocked
- [ ] The orchestrator's pressure test is explicitly confirmed or overturned, with reasoning
- [ ] The interface-versus-client decision is made and argued, not deferred to Phase B
- [ ] All five constraints have stated decisions
- [ ] The GPU/inner-loop viability question has an honest answer, including "this does not serve the
      stated use" if that is what you find
- [ ] A numbered deferred list and a numbered open-questions list, for Phase B
- [ ] **No code, no package, no dependency, no change under any `src/`** — verify with
      `git diff --name-only` and state it
- [ ] `rush change --verify --target-branch origin/integration/system-one-decisions` — do what it says
- [ ] The ledger entry in `docs/WORKSTREAMS.md` for this stream, written as Phase A complete
- [ ] No revert matrix — there is no protection here. Say so rather than leaving the gate unmet

## Skills to load, and when

| when you are about to | load |
|---|---|
| write anything that "feels general" | `/published-primitives-reflex` |
| reason about a `Result<T>`-returning surface | `/result-pattern` |
| think about a validator or wire schema for the request/response | `/type-safe-validation` |

## Required reading, in order

1. This brief.
2. `.ai/conventions/result-integration-boundary.md` — the pattern the user assumed applies.
3. `.ai/conventions/cross-runtime-interfaces.md` — the pattern the orchestrator thinks applies.
4. `libraries/ts-extras-ollama/CAPABILITIES.md` — the nearest sibling: a local-sidecar integration,
   and note what it deliberately **cuts** because ai-assist owns it.
5. `libraries/ts-extras-transformers/CAPABILITIES.md` — the other HuggingFace-shaped integration, and
   why an 8B vLLM model is probably not its business.
6. `docs/design/agent-tasks/development-design.md` — house style for a design document.
7. `https://github.com/Contrastive-LM/CLM` — the server and client code, not only the README.
8. `https://huggingface.co/Contrastive-LM/CLM-v0.1-8B` — if your environment can reach it.
9. `.ai/instructions/CODING_STANDARDS.md` § *Extending Core Libraries Over Working Around Them* and
   § *We Build General Capabilities* — the second matters here: a driving consumer shapes priorities,
   not designs.

## Traps

1. **A brief's claims are claims.** Everything in the two "established" sections above came from the
   orchestrator, who could not read the model card and whose premises were overturned in four of six
   streams last cluster. Verify before building on any of it.
2. **"Not yet" is a result.** The GPU floor or the 2048-token bound may make this unsuitable for the
   inner loop the user wants. Reporting that clearly is worth more than a design for something nobody
   can run.
3. **Do not design for a hosted API you cannot see.** Jev is in limited early access. If its wire
   format is unavailable, an interface claiming to span both implementations is a guess — say so.
4. **No premature abstraction.** One verified implementation may not justify an interface.
5. **Route anything outliving this phase to `docs/TECH_DEBT.md` or the design's deferred list.**

## Exit artifact

`result.md` in this stream's directory, opening with a one-line `**Shipped:** …`. It must record:

- The verified/unverified split, with sources.
- Whether the orchestrator's pressure test survived.
- The interface-versus-client decision and its argument.
- The five constraint decisions.
- The honest answer on inner-loop viability.
- What Phase B triage must resolve, numbered.

Keep `state.md` current; `state.md` plus this brief must be enough to resume cold.

## Missing-input rule

If a required-reading file does not exist, or does not say what this brief claims, **STOP and surface
the gap** rather than reconstructing intent. Blocked network access is **not** a reason to stop — it
is a reason to mark things unverified and continue.
