# Workstreams — fgv

The canonical doc for in-flight and completed parallel workstreams.
Each entry is a kickoff brief — designed so a fresh agent (or fresh
human) can pick it up cold from this doc plus the linked reading
list, without re-creating any of the design discussion that produced
it.

---

## Status conventions

- 🟢 ready to start (all hard dependencies met)
- 🟡 ready but trailing on a soft dependency
- 🔵 in flight (active design or implementation)
- 🔴 blocked (hard dependency unmet)
- ✅ shipped (merged to the buffer line)

## Branch model

Feature branches PR into `release`. The orchestrator gates
buffer→main promotions via a unified automated-review pass.
See `.ai/conventions/workflow/branch-buffer-and-promotion.md`.

## Baseline check before kickoff

Every workstream session verifies its branch base against `.ai/BASELINE.md`
before doing any work. The baseline pins the minimum release-branch
commit a new branch must descend from so a wave of parallel streams
shares the same foundation; bumped when a new wave launches.

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

---

## Active workstreams

### `auth-primitives-batch1` 🔵

**Status:** 🔵 in flight  
**Branch:** `claude/auth-primitives-batch1` → PR to `release`  
**Baseline:** `9c4fd555`  
**Scope:** `@fgv/ts-extras`, `@fgv/ts-web-extras`, `@fgv/ts-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`  
**Blocked by:** nothing  
**Blocking:** personaility `auth-primitives-foundation` phase 1 (X25519) and phase 2 (canonical JSON + SPKI helpers)

**Mission.** Add four primitives required by the personaility auth-primitives workstream for prerelease publish `5.1.0-26`:
1. X25519 keypair support in `CryptoUtils.KeyPairAlgorithm`
2. RFC 8785 `canonicalize()` on `Hash.Normalizer`
3. Multibase/SPKI encoding helpers (`exportPublicKeyAsMultibaseSpki`, `importPublicKeyFromMultibaseSpki`, `multibaseBase64UrlEncode`/`Decode`) in `@fgv/ts-extras/crypto-utils`
4. `LIBRARY_CAPABILITIES.md` doc update (cryptography + keystore + canonicalization sections)

**Cross-repo context:** personaility side is `ErikFortune/personaility`, branch `claude/auth-primitives-foundation-h34cG`. Signal "shipped" to the user when `5.1.0-26` publishes; user routes to personaility orchestrator.

**Artifacts:** `.ai/tasks/active/auth-primitives-batch1/`

---

## Completed workstreams

*(No completed workstreams yet.)*
