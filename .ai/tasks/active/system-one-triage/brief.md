# Brief — `system-one-triage` (Phase B of `system-one-decisions`)

**Orchestrator-owned. Frozen at kickoff.** Put questions and disagreements in `state.md`; do not edit
this file.

**Workflow position.** `system-one-decisions` is a design-triage-implement stream. In this repo's
integration-branch numbering:

- **Phase A** (design): done. `docs/design/system-one-decisions/design.md`, plus a verification pass
  over it.
- **Phase B** (triage): this brief.
- **Phase C** (implementation): commissioned only after the user signs off on this phase's outputs.

Everything lands on `integration/system-one-decisions`, and the whole cycle squashes to `release`
after Phase C. *(`docs/DESIGN_PROCESS.md` uses a different A–D numbering built around UI design
bundles and a staging tree. That shape does not apply here, because Phase A produced a design
document, not a bundle. Follow this brief's outputs.)*

## Mission

Turn the Phase A design into something Phase C can build without re-deriving it:

- close every open question that can be closed from here;
- frame the decisions that belong to the user;
- write the implementation plan Phase C will be held to.

**Design only. No package, no dependency, no change under any `src/`.**

## Read first, in this order

1. `.ai/tasks/active/system-one-design-antagonist/result.md`: the verification pass. **Read it before
   the design.** It corrects several of the design's citations, resolves OQ-7, decides the
   `confidence` field, and carries **E27a**.
2. `docs/design/system-one-decisions/design.md`, in full. Especially:
   - § 1, decisions 1–6;
   - § 7.1, the decided topology;
   - § 8, the proposed contract;
   - § 10, the required validation;
   - § 11, deferred items;
   - § 12, the open questions.
3. `.ai/tasks/active/system-one-decisions-design/{brief.md,result.md}`: Phase A's own contract and
   account.
4. `docs/design/agent-tasks/implementation-plan.md`: the most recent precedent for an implementation
   plan in this repo. **Use it for shape only**; most of its content is unrelated.
5. `.ai/instructions/LIBRARY_CAPABILITIES.md` and
   `.ai/conventions/result-integration-boundary.md`: the boundary-package convention Phase C's package
   follows. `libraries/ts-extras-ollama/` is the nearest sibling.

## What the orchestrator believes — verify; do not build on it

The orchestrator has read § 1, § 8 (part), §§ 10–12 and the verification result. It has **not**
checked the claims below against source. Your job includes deciding whether they are right.

1. **E27a bears on a decision the user made.** The user chose a topology in which some environments
   serve Qwen through Ollama (§ 7.1 item 6, OQ-10). E27a says that on Ollama `v0.35.0` with base
   `qwen3:8b`, `llama-server` is probably started without `--embedding`, so `/v1/embeddings` is
   refused and `clm-serve` returns `502`. The one unchecked link is the registry blob's
   `pooling_type`, and `registry.ollama.ai` is blocked from here.
   **This is the user's decision, not yours.** Frame it: what changes for the topology if E27a holds,
   what the alternatives are (for example, Ollama environments using a remote vLLM-backed CLM, which
   § 12 OQ-12 already names as the fallback), and what one round trip would settle it. Do not decide
   it.
2. **Design § 11's D7 (a `fetch`-shaped safer-fetch adapter) is probably the same primitive as a live
   PersonAIlity ask.** That ask is entry 12 of `followups.md` on branch `integration/asks`, for
   personaility#672: a guarded, **non-buffering**, `FetchLike`-shaped fetch for MCP's HTTP transport.
   If the two are one primitive, it should be designed once, outside this package. Say whether you
   agree, and what Phase C needs from it, if anything. Under the decided topology the sidecar is on
   loopback, so the orchestrator expects the answer to be "nothing for v1". Check that.

## Outputs

1. **§ 12 worked through.** Record each question's outcome in the design doc in place, with the date
   and the evidence:
   - **OQ-2 (package name): decide.** The constraints are § 6.4's.
   - **OQ-9 (SDK pin and churn): decide.** Choose `~0.6.0` or an exact pin, and say whether a minor
     bump needs a review gate.
   - **OQ-4 (`maxChars` per backend):** decide if the Qwen3 tokenizer can be measured from here.
     Note that the verification pass found the HF LFS CDN blocked; check for another route, but do
     not spend long on it. Otherwise, specify the measurement Phase C runs and the margin rule, so
     that Phase C's acceptance can state it.
   - **OQ-6 (SDK against non-Jev servers):** turn it into named fixture tests and live checks in the
     plan.
   - **OQ-12 / D10 (encoder-parity harness):** decide whether it ships as a `perf/` script in the
     package, with E27a's precondition carried.
   - **OQ-11:** note only. It is the consumer's experiment plan.
   - **Leave OQ-5, OQ-8 and OQ-10's Olares items open**, exactly as they stand. They need egress or
     hardware this environment lacks, and guessing them would be worse than leaving them open. Do not
     re-argue them.
2. **`docs/design/system-one-decisions/implementation-plan.md`**, which Phase C is held to:
   - the slice breakdown, or the case for a single slice;
   - per slice:
     - surface;
     - acceptance criteria;
     - the **revert matrix**: each protection, and the mutation that should turn it red, with fixture
       values chosen so that the right and wrong answers differ (the previous cycle had a row green for
       the wrong protection);
     - required tests, including every § 10 item.
   - the package scaffold: what `libraries/ts-extras-ollama/` gives Phase C, and what differs;
   - every place the cycle must update at close (`LIBRARY_CAPABILITIES.md`, the package's
     `CAPABILITIES.md`, the ledger, change files);
   - what is explicitly **not** established until a live round trip runs, and how the result reports
     a leg that was not run live (§ 10 item 2: "not run live", never inferred).
3. **A decisions-for-the-user list**, at the top of `result.md`. Each entry carries:
   - what is being decided;
   - the options;
   - your recommendation and its reason;
   - what each answer changes in the plan.

   E27a is the first entry. Anything you could not decide from the design's own principles goes here.
   Per `CODING_STANDARDS.md` § "We Build General Capabilities", do not route a question to the user
   whose answer is derivable from a principle already written down.
4. **`docs/WORKSTREAMS.md` § `system-one-decisions`:** update the status to "Phase B complete; Phase C
   ready to commission" (anticipating the merge), and point it at the plan.
5. **Follow-ups**, sorted per `docs/DESIGN_PROCESS.md`'s four buckets: chore, tech debt, future, or
   left for the implementer.

## Out of scope

- Any code, test, package, `package.json`, or `common/` change.
- Re-litigating Phase A decisions 1–6 or the verification pass's conclusions. If you find a fact that
  **contradicts** one, record it at the top of `result.md`; do not rework the design around it.
- `integration/asks` and the PersonAIlity asks, other than reading `followups.md` entry 12 for
  belief 2.

## Acceptance

- [ ] Every § 12 question carries a status: resolved (with evidence), specified for Phase C, or left
      open (with the reason it was not attempted).
- [ ] The implementation plan exists, and every § 10 validation item maps to a named test or live
      check in it.
- [ ] The decisions-for-the-user list exists, with E27a first.
- [ ] Every new external fact is marked verified, derived, reported or unverified, in the design's
      own convention, and pinned to a ref.
- [ ] `git diff --name-only origin/integration/system-one-decisions...HEAD` shows no file under any
      `src/`, and no `package.json`.
- [ ] `node common/scripts/verify-capability-docs.mjs` and
      `node common/scripts/generate-capability-feed.mjs --check` exit 0. These need only `node`; no
      install is required.
- [ ] `/finalize-task` is **not** run. The cycle finalizes after Phase C, as Phase A did.

## Mechanics

- Work on branch `system-one-phase-b`, created from `integration/system-one-decisions` with this
  brief on it. Push there. **Do not open a PR**; the orchestrator opens it onto
  `integration/system-one-decisions` after review.
- **Egress:** per the verification pass, github.com over git works, huggingface.co API works, and the
  HF LFS CDN, `typesafe.ai`, `registry.ollama.ai` and `olares.com` are blocked. Never disable TLS
  verification or unset `HTTPS_PROXY`. If a host is blocked, record it and move on.
- **Stop and surface**, with a final message of at most 300 words, if:
  - you find a fact that contradicts a Phase A decision;
  - the plan cannot be written without a user decision you could not frame.

## Exit artifacts

- `state.md`: your working surface.
- `result.md`, containing:
  - the decisions-for-the-user list first;
  - then what was resolved and on what evidence;
  - what was left open and why;
  - the follow-ups;
  - anything this brief got wrong.
