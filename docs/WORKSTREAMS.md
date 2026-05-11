# Workstreams — fgv

The canonical doc for in-flight and completed parallel workstreams.
Each entry is a kickoff brief — designed so a fresh agent (or fresh
human) can pick it up cold from this doc plus the linked reading
list, without re-creating any of the design discussion that produced
it.

---

## Repo shape (load-bearing context)

This repo is a set of related but distinct utility libraries under
`libraries/` (plus CLI tools under `tools/`), not a single coherent
product. Work is mostly **reactive, consumer-driven, feature-shaped**:
external consumers batch up feature requests as they do major work;
we service those batches and publish an alpha; consumers integrate;
once at least one consumer has applied a feature end-to-end, we
treat that surface as validated. A feature commonly touches 1–3
packages, so the unit of work is the **feature**, not the package.

**Lockstep version policy.** When we publish, we publish everything.
Independent roadmaps per library, single shared version. Sizing the
blast radius of any stream needs to account for this — a change in
one package ships in the same alpha as every other package's changes.

**Stability-via-consumption.** We presume instability until at least
one consumer has applied a feature end-to-end. `release` and the
alphas published from `prerelease` are post-feature-PR but
pre-validation. Production promotion is gated on observed consumer
use, not just CI green. Case in point: a -25 → -26 type-tightening
that would have been a production regression if -25 had shipped to
main.

## Branch flow

```
agent feature branches ─PR─▶ release ──mirror──▶ prerelease ──npm-publish─▶ alpha
                                │
                                └── promote (test/docs gate, not code review) ──▶ main
```

- **`release`** is the buffer line. Feature PRs merge here. Iterative
  review cycles, followups, and slips are absorbed here.
- **`prerelease`** mirrors `release` immediately. The only deltas vs.
  `release` are `package.json` / version-policy files and Rush
  changelogs. Alphas publish from `prerelease` via the
  `npm-publish` GitHub workflow.
- **`main`** is the canonical line. Promotion `release` → `main` is
  a release event — it accumulates a long delta and is gated on
  **test/docs/sibling-sweep, not code review** (each constituent PR
  was reviewed on its way into `release`; the unified delta is too
  large for meaningful re-review).

A branch-model evolution to a more conventional "main is tip,
hotfix branches off main" topology is on the roadmap; see the
relevant entry in this file when it's drafted.

## Status conventions

- 🟢 ready to start (all hard dependencies met)
- 🟡 ready but trailing on a soft dependency, or trigger TBD
- 🔵 in flight (active design or implementation)
- 🔴 blocked (hard dependency unmet)
- ✅ shipped (merged to `release`)

## Stream entry shape

Every stream entry declares, at minimum:

- **Mission** — 1–2 sentences.
- **Package surface** — explicit list of packages this stream
  expects to modify (e.g. `ts-extras/ai-assist`, `ts-app-shell/ai-assist`).
  This is both the reading-aid and the collision-avoidance metadata
  for parallel streams.
- **Out-of-scope** — paths this stream will NOT touch, when
  collision avoidance with another stream depends on it.
- **Acceptance criteria** — exit gates.
- **Artifact pointer** — `.ai/tasks/active/<stream-id>/`.

Full kickoff-prompt shape: `.ai/conventions/workflow/kickoff-prompt-shape.md`.

## Branch base

New streams branch from current `release` HEAD. There is no shared
"wave base" — streams are mostly independent, and the few real
file-boundary conflicts are caught by the package-surface and
out-of-scope declarations in the stream entry. `.ai/BASELINE.md`
pins the last `release` → `main` promotion (i.e. the last
published lockstep version), used as a recovery referent and for
sizing blast radius, not as a stream-start gate.

## Stream versions

Used when a stream's deliverable splits into independently-shippable
phases. Each version has its own brief, status, dependencies, PR,
and task-artifact directory. Reserve for streams where the phases
are genuinely separable shipping units.

## Shared types between parallel streams

When two parallel streams share a type, pick exactly one pattern:

1. **Coordination commit**: land the shared type as a small commit
   before either stream branches.
2. **Narrower consumer interface**: consumer defines a smaller,
   distinctly-named interface exposing only the methods it needs.
3. **Lock ownership in kickoff prompts**: exactly one stream owns
   each shared symbol; the other is told explicitly NOT to define it.

Never have two parallel streams publishing the same symbol.

## Artifact protocol

Every workstream maintains live artifacts at
`.ai/tasks/active/<stream-id>/{brief.md, state.md, result.md}`
throughout the run. **Migrate to `.ai/tasks/completed/<YYYY-MM>/<stream-id>/`
and write a polished `README.md` as part of the PR — before merge,
not as a follow-up.** See `.ai/conventions/workflow/artifact-protocol.md`.

## Out-of-scope packages

The sudoku packages (`ts-sudoku-lib`, `ts-sudoku-ui`) are slated to
move to their own monorepo and are out of scope for the workflow
substrate. Don't queue streams against them here.

---

## Active workstreams

*(No active workstreams.)*

### `ai-assist-image-generation` 🟢

**Status:** 🟢 phase A (research + design) ready to start
**Phase B sequencing:** strictly after this stream's design signoff
**Branch base:** `claude/ai-assist-features` (integration branch off `release`)
**Package surface:** `@fgv/ts-extras/ai-assist`, `@fgv/ts-app-shell/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** sudoku packages, audio/video generation, the thinking-config surface (parallel stream)

**Mission.** Complete the image-generation feature properly across all four providers (OpenAI dall-e-2/3 + gpt-image-1; Google Imagen + Gemini Flash Image; xAI Grok image; openai-compat). Inventory current per-model capability divergences (size sets, quality vocabularies, reference-image support, response-format handling), design a coherent caller-facing API and registry shape, document migration impact under lockstep version policy. Phase A produces a design doc; orchestrator/user gate before phase B implementation is commissioned.

**Origin.** Personaility integration surfaced two concrete failures (`gpt-image-1` + `response_format` → 400; `dall-e-3` + `count > 1` → silent provider error) — symptoms of partial provider-surface modeling, not fix-shaped bugs.

**Phase A artifacts:** `.ai/tasks/active/ai-assist-image-generation/{brief.md, state.md}` → produces `design.md`.

### `ai-assist-thinking-config` 🟢

**Status:** 🟢 phase A (research + design) ready to start
**Phase B sequencing:** strictly after this stream's design signoff AND after `ai-assist-image-generation` phase B lands
**Branch base:** `claude/ai-assist-features` (integration branch off `release`)
**Package surface:** `@fgv/ts-extras/ai-assist`, `@fgv/ts-app-shell/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** sudoku packages, image-generation surface (parallel stream)

**Mission.** Complete thinking/reasoning-model support across all four providers. AiAssist currently always sends `temperature` on chat completions; thinking models (Anthropic extended thinking, OpenAI o-series, Gemini 2.5 thinking, xAI Grok reasoning) reject this. Design `IThinkingConfig` (or alternative) abstracting provider thinking surfaces, decide sampling-param interaction policy, decide model-capability signaling in the registry, address streaming and non-streaming response shapes. Phase A produces a design doc; orchestrator/user gate before phase B implementation is commissioned.

**Origin.** Personaility integration surfaced thinking-model 400s; downstream of completing the feature properly across all providers.

**Phase A artifacts:** `.ai/tasks/active/ai-assist-thinking-config/{brief.md, state.md}` → produces `design.md`.

### Integration branch convention (active for the ai-assist cluster)

Both ai-assist streams (and any followups within the cluster) share an integration branch `claude/ai-assist-features` based off `release`. Each phase PRs into the integration branch, not `release`, to keep `release` history grouped at one cohesive cluster-level merge. The integration branch merges to `release` at the end of the cluster after all stream artifacts have migrated to `completed/`. This is a per-cluster pattern, not a default — single-stream features can continue to PR directly to `release`.

---

## Completed workstreams

### `auth-primitives-batch1` ✅

**Status:** ✅ shipped — merged in [#322](https://github.com/ErikFortune/fgv/pull/322) (`bb913392`); published in `5.1.0-26` alpha
**Package surface:** `@fgv/ts-extras` (crypto-utils), `@fgv/ts-web-extras` (crypto-utils), `@fgv/ts-utils` (base/normalize), `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Cross-repo consumer:** [`ErikFortune/personaility`](https://github.com/ErikFortune/personaility) — `claude/auth-primitives-foundation-h34cG` (unblocked on `5.1.0-26` publish)

**What shipped.** Four primitives:
1. X25519 keypair (`'x25519'` added to `KeyPairAlgorithm`; both providers picked it up table-driven)
2. RFC 8785 `canonicalize()` on the base `Normalizer` (moved from `HashingNormalizer` per code review)
3. Multibase/SPKI helpers in `@fgv/ts-extras/crypto-utils` (`exportPublicKeyAsMultibaseSpki`, `importPublicKeyFromMultibaseSpki`, `multibaseBase64UrlEncode`/`Decode`)
4. `LIBRARY_CAPABILITIES.md` cryptography + canonicalization sections

**Artifacts:** `.ai/tasks/completed/2026-05/auth-primitives-batch1/` ([README](../.ai/tasks/completed/2026-05/auth-primitives-batch1/README.md))
