# Result — `system-one-triage` (Phase B of `system-one-decisions`)

**Shipped:**

- § 12 of [`design.md`](../../../docs/design/system-one-decisions/design.md), worked through in place;
- E28–E35 added to its evidence table, plus dated refinements to § 7.1 item 5, § 8 and § 11;
- [`implementation-plan.md`](../../../docs/design/system-one-decisions/implementation-plan.md), which
  Phase C is held to;
- the ledger update.

Docs only. Nothing was built, and no server answered a request.

## Decisions for the user

Neither decision changes the package surface (plan § 3), so **neither blocks commissioning Phase C**.
They change only which live legs are required and when the cluster may close.

### U1 — E27a: does the Ollama leg stay in the topology?

**What is being decided.** You chose a topology in which some environments serve Qwen through Ollama
(design § 7.1 item 6). E27a says that on Ollama `v0.35.0` with base `qwen3:8b`, the encoder request
probably **fails outright**. Ollama starts `llama-server` with `--embedding` only when the GGUF
carries `pooling_type`; without it the embedding request is refused, `clm-serve` answers 502, and the
boundary reports `server`. The failure is loud, not a silent mis-pooling.

**What Phase B added (E34).** The brief's "one unchecked link" is right, and it is now narrower:

- **Neither converter that could have produced the library blob writes `pooling_type` for Qwen3**:
  llama.cpp at Qwen3's release (`b5250`), and Ollama's own converter, which did not exist for Qwen3
  until after `v0.12.0` and writes none at `v0.20.0`.
- At `v0.35.0`, every model runs in `llama-server`, and "embedding model" means exactly "has
  `pooling_type`".
- **Still unread:** the blob itself (`registry.ollama.ai` is blocked here).

**Options.**

- **A. Keep Ollama, gated on one round trip (recommended).** Each Ollama environment's first live step
  is a single probe (plan L4). A refusal is recorded as a refusal, and that environment falls back to
  a remote vLLM-backed CLM, as OQ-12 already says.
  - **What changes in the plan:** nothing. This is the plan as written.
- **B. Drop Ollama for CLM now.** Ollama environments use a remote vLLM-backed CLM (the Olares or
  another vLLM box).
  - **What changes in the plan:** L4 and L5 are removed; the README states that Ollama-backed CLM is
    not supported; OQ-12 is closed as moot.
- **C. Keep Ollama with an operator-built GGUF that declares `pooling_type = last`**, imported with
  `ollama create`. `llama-server` would then start with `--embedding` and pool as declared.
  - **What changes in the plan:** the README gains a recipe (outside the package). L4 becomes a probe
    of that model, and L5 is mandatory before any Ollama result is read.
  - **Cost:** a model artifact somebody must build and maintain. Its parity with vLLM's last-token
    pooling, and whether an EOS is appended (E26), are unverified. It fixes the refusal, not
    fidelity.
- **D. Run vLLM, not Ollama, as the encoder in those environments**, where the hardware allows.
  - **What changes in the plan:** the same as B, except that the environments keep a local encoder.

**Recommendation: A.** E27a is derived, not observed, and the round trip that settles it costs
minutes. Deciding B or C now would act on an inference when the observation is that cheap. A also
loses nothing if E27a holds, because OQ-12's fallback is already written down.

**The round trip that settles it.** It needs no GPU: CPU is enough for the request, at the cost of a
5 GB download. On any machine with Ollama `v0.35.0`:

1. `ollama pull qwen3:8b`
2. `curl -s localhost:11434/v1/embeddings -H 'content-type: application/json' -d '{"model":"qwen3:8b","input":"hello"}'`
   - E27a predicts an error saying the model does not support embeddings.
   - A 200 refutes E27a. The pooling question (§ 7.1 item 6.2, the older-runner case) then applies
     instead.
3. A cheaper metadata-only check: `ollama show qwen3:8b`, or `@fgv/ts-extras-ollama`'s `showModel`.
   Its capabilities list includes `embedding` exactly when the GGUF has `pooling_type`
   (`server/images.go:197-200` @ `v0.35.0`, verified). That the CLI prints the capabilities is
   reported, not checked here.

### U2 — Who runs the live legs, and does the cluster close wait for any?

**What is being decided.** Design § 10 forbids claiming success from fixtures alone. This environment
cannot run any live leg:

- `typesafe.ai` is blocked;
- there is no GPU;
- there is no Olares.

A Phase C worker in a similar sandbox will report every leg as "not run live". So whether the
squash to `release` waits is a call about your credentials and hardware, not a design question.

**Options.**

- **(a) The close waits on L1 only (recommended).** L1 is the remote development leg: Jev with your
  early-access key, or openjev/Codiv. The deployed legs (L2–L5) gate the consumer's experiment, not
  the release.
- **(b) The close waits on every leg**, including the Olares and Ollama legs.
- **(c) The close waits on none.** The package ships with every leg recorded as "not run live".

**Recommendation: (a).**

- With no live leg at all, the package's one load-bearing claim, wire compatibility (§ 5.2), rests on
  fixtures written from the SDK's types and CLM's source. That is the mocked-only position § 10
  exists to prevent, so (c) is out.
- L1 needs only egress and a key: one `perf/systemOneLive.js probe` run.
- The deployed legs need hardware that is not on a release's critical path, and their results are
  the consumer's experiment, which the package does not decide (§ 9).

**What each answer changes.**

- **(a):** plan § 10's close gate becomes "L1 recorded". Phase C may finish with L1 "not run live".
  The orchestrator holds the cluster close until someone with egress runs L1 and appends the record.
- **(b):** the close waits on the Olares and on U1's outcome.
- **(c):** no gate; the README states plainly that no live round trip has been run.

## Facts that contradict a decision

**None.** Decisions 1–6, OQ-7 and the omission of `confidence` stand. Phase B's new facts refine the
§ 8 contract sketch without moving any decision (design § 8, Phase B amendment):

1. **§ 8 omitted the `fetch` seam that § 10 item 1 requires.** The sketch's
   `createSystemOneClient({ baseUrl, model, apiKey, timeoutMs?, retry?, logger? })` has no `fetch`,
   but the unit tests must go "through its `fetch` seam". Phase C adds `fetch?`, which is also D7's
   future plug point. § 6.3's "no per-call URL" is unaffected.
2. **§ 7.1 item 5 named three environment fallbacks; there are four** (E29). `TYPESAFE_LOG_LEVEL=debug`
   in a deployed process's environment would make the SDK log every request body, which carries the
   state. The boundary pins `logLevel`, and never to `debug`.
3. **E17's "candidate texts are the descriptions" is incomplete** (E32). For a `noul` with no
   criteria, CLM embeds `"Yes. This is true: "` plus the **instructions** as the candidate. A long
   instruction can therefore exceed the bound on the candidate side when it does not on the state
   side. The plan measures what CLM actually embeds (plan § 3.3, R5b).
4. **OQ-9's "three weeks apart" is wrong.** 0.5.7 and 0.6.0 are three and a half days apart (E28).
   The package is three weeks old. The churn signal is stronger than stated, which supports a review
   gate on every minor.
5. **E13's "throws if no API key" means `undefined`.** An explicit `''` is accepted and sent as
   `Bearer ` (E29). This makes the README's keyless-sidecar advice simpler, not wrong.

## The orchestrator's beliefs, checked

**Belief 1 (E27a bears on your decision; frame it, do not decide it): right.** One refinement: it does
not gate Phase C, because the package surface is the same under every option (U1). Its "one unchecked
link" is accurate and is now narrower (E34).

**Belief 2 (D7 is the same primitive as personaility#672): agree.**

- D7 needs a guarded function the SDK will accept as `fetch`. Any global-fetch-shaped function is
  assignable to the SDK's `Fetch` (E31).
- #672 needs a guarded, `FetchLike`-shaped, **non-buffering** fetch that enforces the guard per hop
  (`followups.md` entry 12 on `integration/asks` @ `8659253e`).
- A non-buffering guard serves D7, because the SDK buffers inside each attempt (E31). A buffering one
  would not serve #672. So #672's primitive is the general one. It belongs in safer-fetch, designed
  once with its security review loop, not in this package.

**What Phase C needs from it: no adapter for v1**, as you expected. Under the decided topology,
production is loopback and development is a composition-root `https` URL, so nothing is
attacker-steerable (design § 6.3). **But Phase C does need one thing in its own surface: the
`fetch?` parameter**, so the primitive can plug in later without a contract change. The § 8 sketch
had omitted it (contradiction-adjacent finding 1).

## Resolved, and on what evidence

| question | outcome | evidence |
|---|---|---|
| OQ-2 | `@fgv/ts-extras-system-one` | § 6.4's constraints; the sibling-naming rule (`ts-extras-mcp` names a protocol); npm `E404` (E28) |
| OQ-9 | `~0.6.0`, direct; patches by suite; **review gate on every minor** | `~` and `^` are the same set on 0.x; the `ts-extras-transformers` `~4.2.0` precedent; E28's cadence |
| OQ-4 | **resolved for upstream CLM**: `maxChars = floor(B × r_min × 0.9)`; README values 2,400 (unknown or ID-dense) and 4,400 (measured prose, Markdown, code or JSON) | E33 (derived): Qwen3-8B's `vocab.json` and `merges.txt` are not LFS objects and are reachable, which is the route the brief asked me to look for. Measured with transformers 4.55.0 over 388 windows; slow and fast tokenizers agree. L3 confirms it against the real tokenizer |
| OQ-6 | **specified for Phase C**: named unit tests U12–U14, U17, U19 and U20, plus live L1 and L2 | E29–E31: the SDK read at source (retry set includes 529; 404 has its own class; a non-JSON 2xx is returned as a string; `requestId` may be `undefined`) |
| OQ-12 / D10 | **the harness ships** as `perf/systemOneLive.js`; it refuses to compare without thresholds given up front; the E27a probe comes first | D10's own argument; `TESTING_GUIDELINES.md` § *Measurement Harnesses* |
| OQ-11 | noted; the consumer's | L1 records which remote was used |
| § 10 coverage | every item maps to a named test or live check | plan § 11 |

## Left open, and why

- **OQ-5** (Jev's semantics): needs `typesafe.ai`, which is blocked. Unchanged, as the brief required.
  It does not block v1 (design § 5.2).
- **OQ-8** (CLM `score` reliability): needs a running CLM. Unchanged. The plan folds its reproduction
  into L2.
- **OQ-10's Olares items** (Blackwell vLLM build, memory budget): need the device. Unchanged. The plan
  records them during L2.
- **E16b** (`tokenizer.json`'s `truncation` section): still unreachable, because the redirect goes to
  `us.aws.cdn.hf.co/xet-bridge-us/…`. L3's optional `/tokenizer_info` call (E35) would close it.
- **E27a**: open until U1's round trip.

## Follow-ups, in the brief's four buckets

- **Chore:** none. The two wording errors found (OQ-9's cadence, § 7.1 item 5's count) are corrected
  in place.
- **Tech debt:** none. No code was written.
- **Future:**
  - D5 (exact token pre-measurement) now has a concrete route: Qwen3's `vocab.json` and `merges.txt`
    are reachable and enough to build the tokenizer (E33). Record that against D5 in `docs/FUTURE.md`
    when the stream finalizes.
  - D7 folds into personaility#672's safer-fetch sibling and needs no separate entry.
- **Left for the implementer:**
  - one file or a few modules (plan § 9);
  - the exact message wording;
  - the fixture recording format;
  - the mutation-matrix row patterns;
  - whether `ISystemOneClient` exposes its `model` read-only.

## What the brief got wrong

1. **Belief 2 was right about the adapter and missed the seam.** "Nothing for v1" holds for D7, but
   § 8 itself lacked the `fetch` parameter that § 10 needs and that D7 would plug into.
2. **"Check for another route, but do not spend long on it" (OQ-4) understated what was reachable.**
   The verification pass's "HF LFS CDN blocked" was accurate, but the tokenizer does not need the LFS
   file. That route made OQ-4 decidable rather than only specifiable.
3. **The four follow-up buckets are not `DESIGN_PROCESS.md`'s.** That file's four are visuals, assets,
   emergent capabilities and follow-ups. The brief's (chore, tech debt, future, implementer) are a
   routing of the last one. I used the brief's, as instructed.
4. **The branch.** The session's harness designated `claude/system-one-phase-b-triage-kint3n`; the
   brief and kickoff say `system-one-phase-b`. I pushed to `system-one-phase-b`, as the kickoff
   instructed.

## Gates

All run 2026-10-03.

- `git diff --name-only origin/integration/system-one-decisions...HEAD`: only `docs/WORKSTREAMS.md`,
  `docs/design/system-one-decisions/{design.md,implementation-plan.md}` and
  `.ai/tasks/active/system-one-triage/*`. No `src/` file and no `package.json`.
- `node common/scripts/verify-capability-docs.mjs`: **exit 0** (24/24 libraries, 75 reflexes,
  0 failed).
- `node common/scripts/generate-capability-feed.mjs --check`: **exit 0** (0 stale).
- `/finalize-task` was not run. The cycle finalizes after Phase C.
- **No revert matrix for this phase.** It is docs only. Phase C's is plan § 5.2.
