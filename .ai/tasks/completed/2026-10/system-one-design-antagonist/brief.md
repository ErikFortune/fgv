# Stream brief — `system-one-design-antagonist`

**Verify Phase A's evidence before Phase B reasons from it. Re-check every `derived` claim and every
citation read from a moving ref against the version actually depended on.** Amend
`docs/design/system-one-decisions/design.md` in place. One PR.

This is a **verification** pass, not a redesign and not a second opinion on the decisions.

---

## Why this pass exists, and what it is not

`docs/design/system-one-decisions/design.md` (Phase A, PR #710) is unusually disciplined. Every
external fact in § 2 carries an explicit status — **verified** / **derived** / **reported** /
**unverified** — with a file and line. It refutes two of its own brief's premises in writing, it
overturns the orchestrator's framing and the user's "just wrap the library" premise, and it answers
"why not the alternatives" for each decision. Twelve open questions route what it could not settle.

So the usual antagonist question — *where does this overstate?* — has **low yield here**, and you
should not spend the stream on it. Several things a reviewer would naturally attack are already
handled and already numbered:

| the obvious attack | already covered by |
|---|---|
| Jev's `confidence`, bound, truncation and error bodies are unknown | E14 (**unverified**) and OQ-5 |
| CLM's `422` vs openjev's `400` — the failure surface is not one wire | OQ-6 |
| Ollama drops `truncate_prompt_tokens`, truncates keeping the start, pooling unknown | § 7.1 item 6 and OQ-12, with the acceptance threshold required to be written down before the run |
| the character bound cannot bound tokens exactly | § 6.1 says so explicitly; OQ-4 |

**Do not re-raise those.** If you think one is wrong, say why with a source; otherwise leave them.

**Where the yield actually is:** this design's own discipline has least to say about its **derived**
claims, because a derived claim is where several verified sources were combined without the chain
being seen end to end. One of those chains carries a decision. The orchestrator tested it and found a
real defect in roughly five minutes — see below. That is the shape to hunt.

## Two findings already verified — fold these in, do not re-derive them

The orchestrator verified both on 2026-10-02 against the live sources. Reproduce them if you want, but
they are not open questions.

### F1 — E16's vLLM citation points at code in no released version (conclusion survives)

**E16 is the evidence for decision 4** — "an over-long state loses its question" — which is why the
mandatory `inputLimit` exists at all. Its vLLM link is `vllm/renderers/params.py` **on `main`**.

That path is **404 on v0.6.0, v0.6.6 and v0.9.0**, while E3 establishes CLM's dependency as
`vllm>=0.6`. The range now spans 0.6 through **0.30.0** (PyPI, checked 2026-10-02). So the citation
describes code that no release in the pinned range contains.

**The conclusion is correct, and the released code is better evidence than what was cited.** At
v0.6.6, `vllm/entrypoints/openai/serving_engine.py`, `_normalize_prompt_text_to_input` (lines
~235–249):

```python
encoded = tokenizer(prompt,
                    add_special_tokens=add_special_tokens,
                    truncation=True,
                    max_length=truncate_prompt_tokens)
```

**No `truncation_side` is passed at all**, so the tokenizer's own default governs. That is E16's
mechanism visible in one call rather than inferred across three links, in a version CLM can actually
install.

**What to do:** re-cite E16 to the released path, state the version(s) you checked, and reclassify.
Decide honestly whether it is still `derived` (the tokenizer-default half — `truncation_side: null`
in Qwen3-8B's config, transformers defaulting to `"right"`, right-truncation keeping the first N — is
still a chain) or now **verified** for the vLLM half specifically. Split the row if the two halves
have different statuses; a single marker on a compound claim is part of what let this through.

### F2 — OQ-7 is answerable now: vLLM refuses rather than truncates

OQ-7 asks whether `'unchecked'` is safe to offer, noting that *no* backend is verified to refuse
rather than truncate, and that vLLM-without-`truncate_prompt_tokens` "should refuse, which is
unverified."

It refuses. Same file at v0.6.6, `_validate_input`:

```
if token_num > self.max_model_len:
    raise ValueError(f"This model's maximum context length is {self.max_model_len} tokens. "
                     f"However, you requested {token_num} tokens in the input for embedding "
                     f"generation. Please reduce the length of the input.")
```

Note also that the embedding path **errors** when `truncate_prompt_tokens` exceeds `max_model_len`
rather than clamping (`serving_embedding.py:91-98` at v0.6.6).

**What to do:** resolve OQ-7 in the design with this evidence, and say what it decides about keeping
`'unchecked'`. The condition OQ-7 itself set — find a backend that refuses — is met. Whether that is
*sufficient* to ship `'unchecked'` is yours to argue, not mine: CLM-via-vLLM is configured with
`truncate_prompt_tokens` by `clm-serve` (E15), so the refusing path is vLLM used *directly*, which
may not be a backend this package targets. Say which.

## The primary target: citations read from a moving ref

F1 is one instance of a class. **Every citation to a `main` branch is a claim about a moving target,
and the design depends on pinned or released versions.** Go through § 2 and find them all. Known
candidates, not an exhaustive list — enumerate by reading, not from this table:

| rows | why they are suspect |
|---|---|
| E25, E26, E27 | all cite ollama `main` (`openai/openai.go`, `server/routes.go`, `api/types.go`). `tokens[:ctxLen]` in E26 is load-bearing for § 7.1 item 6's whole Ollama analysis |
| E16 | the transformers citation (`tokenization_utils_base.py:975`) and the Qwen3 `tokenizer_config.json` — which ref, and does the line still say that? |
| E20 | llama.cpp `tools/server/README.md:175, 210` |
| E23 | explicitly "raw `main` against the sdist" — that one is *about* `main` by design, so it is fine; say so rather than leaving it ambiguous |

For each: name the ref you checked, and prefer a released tag over `main` wherever the design's own
reasoning depends on a version. Where `main` is genuinely the right thing to cite (E23), say why.

**A line number without a ref is not a citation.** The fix is cheap: `path:line @ <tag>`.

## Egress — read this before concluding anything is unreachable

The Phase A agent reported "github.com (web, API, codeload) and typesafe.ai blocked," and that is
accurate as far as it goes. But **`raw.githubusercontent.com` is reachable, at any ref including
tags**, which is what made F1 and F2 possible. Verified by the orchestrator 2026-10-02:

| host | result |
|---|---|
| `raw.githubusercontent.com/<org>/<repo>/<ref>/<path>` — **tags work, not just `main`** | **200** |
| `registry.npmjs.org` | **200** |
| `pypi.org/pypi/<pkg>/json` | **200** |
| `huggingface.co` | **200** |
| `typesafe.ai`, `docs.typesafe.ai` | **blocked** (confirms E14 / OQ-5 stays open) |
| `olares.com` | **blocked** (confirms E24 stays secondary-sourced) |
| `api.github.com` | **403** — so CLM issues #3 and #6 stay unreadable (confirms E22's **reported** status) |

Do not spend the stream retrying the blocked hosts; their rows are already marked honestly. Do use
the tag trick aggressively on the reachable ones.

## The secondary target: one design asymmetry, as a question not a verdict

The design makes omitting `inputLimit` a **compile error**, explicitly so that every call site's
posture is greppable (§ 6.1). That is the repo's instinct: make the wrong thing unrepresentable.

It then handles a structurally similar hazard with a sentence of advice. `confidence` means different
things per backend — CLM's is top probability minus the mean of the rest (E7); openjev's is
`1 − H(p)/ln K` (E21); Jev's is unknown (E14). § 7.1 item 4's remedy is "branch on `probabilities`."

**The question to answer in the design, not to me:** why does one hazard get a type and the other get
prose? A consumer who branches on `confidence` gets silently different behaviour between development
and production — the design says so itself, "by construction." Options worth weighing explicitly,
with a decision and a reason:

- pass `confidence` through as-is, documented (status quo);
- omit it from the boundary's result and let consumers compute what they want from `probabilities`;
- return it wrapped with its definition, so a consumer cannot read the number without the formula;
- name it per backend so the two are not the same field.

Any of those may be right. **A stated decision with reasoning is the deliverable**; "branch on
probabilities" as advice is what is being questioned. If after weighing it you conclude the status quo
is correct, say that and why — that is a complete answer.

## Out of scope — do not do these

- **No redesign.** Decisions 1–6 stand unless a *fact* you verify contradicts one. If that happens it
  is the most important thing in your `result.md`; say so loudly and do not quietly soften the text.
- **No new open questions invented to look thorough.** Twelve is already a lot. Add one only if a
  verification you ran exposed something genuinely unsettled, and say which verification.
- **No code.** No package, no dependency, nothing under any `src/`. This is Phase A still.
- **No Phase B triage.** Sequencing, scoping and priority are not yours.
- **Do not resolve OQ-5, OQ-10's Olares items, or OQ-8** — their sources are blocked from here. Leave
  them, and do not downgrade them to guesses.

## Branch and PR posture

- **Branch:** `claude/system-one-design-antagonist`, cut off `integration/system-one-decisions`.
- **Precondition: #710 must have merged into `integration/system-one-decisions` first.** You amend
  `design.md`, and so does #710; running in parallel guarantees a conflict on the one file that
  matters. If #710 is still open when you start, **stop and say so.**
- **Also bring the base up to the promoted `release`** (`git merge origin/release`) before checking any
  `ts-agent-tasks` citation. The design read those from `origin/integration/agent-tasks-v1` at
  `2a95fbb2`; that cluster is now squashed onto `release` at `febf0b2b4` and the integration branch is
  gone. § 9 and the two refuted-premise bullets cite `types/trackedCommands.ts:18-30` and
  `tools/schemas.ts:236-243` — verify those against `release`, and repoint the "inspected checkout"
  header, which currently names `30713277c`.
- **One PR into `integration/system-one-decisions`, not `release`.** Phase A design does not land on
  `release` as its own commit — `.ai/conventions/workflow/kickoff-prompt-shape.md`. It rides with
  Phase C.
- Artifacts in `.ai/tasks/active/system-one-design-antagonist/`. **Do not run `/finalize-task`**; this
  stream finalizes with the design-triage-implement cycle.

## Acceptance criteria

- [ ] Every § 2 row's citation names the **ref** it was read at, and a released tag is preferred wherever
      the design's reasoning depends on a version
- [ ] Every row still marked **derived** has its chain stated link by link, with each link's source and
      ref — or is split so each half carries its own honest marker
- [ ] F1 folded in: E16 re-cited to the released path, status reconsidered, decision 4's text checked
      against the corrected evidence
- [ ] F2 folded in: OQ-7 resolved, with a stated decision on `'unchecked'`
- [ ] The `confidence` asymmetry answered with a decision and a reason (any of the four options, or a
      fifth)
- [ ] `ts-agent-tasks` citations verified against `release`, and the header's inspected-checkout updated
- [ ] **No file under any `src/` changed** — verify with `git diff --name-only` and say so
- [ ] `rush change --verify --target-branch origin/integration/system-one-decisions` — do what it says
- [ ] `verify-capability-docs` and `generate-capability-feed --check` pass
- [ ] **No revert matrix** — docs only, no behaviour to protect. State that in `result.md` rather than
      leaving the gate silently unmet

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …`. It must record:

- **Every citation you corrected, and every one you checked and left alone.** The second list is as
  valuable as the first: it is the evidence that the pass was systematic rather than opportunistic.
- **Any claim whose status you downgraded** (verified → derived, derived → reported). This is the single
  most valuable thing this stream can surface.
- **Any fact that contradicts a decision** — loudly, at the top, if it happened. "None" is a legitimate
  answer stated as one.
- The `confidence` decision and its reasoning.
- What remains unverifiable **from this environment specifically**, distinguished from what is
  unverifiable in principle. Those are different, and the egress table above makes the distinction
  checkable.

Keep `state.md` current.

## Required reading, in order

1. This brief.
2. `docs/design/system-one-decisions/design.md` — all of it, § 2 and § 12 most carefully.
3. `.ai/tasks/active/system-one-decisions-design/result.md` — Phase A's own account of what it could
   not do.
4. `.ai/instructions/TESTING_GUIDELINES.md` § *Measurement Harnesses* — for why a pre-stated threshold
   is load-bearing in OQ-12, which you are **not** resolving but may need to read against.
5. `.ai/conventions/workflow/kickoff-prompt-shape.md` § the multi-phase PR-base rule.

## Missing-input rule

If a required-reading file does not exist, or does not say what this brief claims, **STOP and surface
the gap.** Do not reconstruct intent and proceed. In particular: if #710 has not merged, stop.

**And one specific to this stream:** if you cannot reach a host this brief's egress table says is
reachable, say so and stop rather than marking a row **unverified** that the orchestrator verified two
days earlier. A disagreement about egress is information, not an obstacle to route around.
