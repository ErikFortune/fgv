# Brief — agent-memory antagonist: adversarial torture tests for the near-miss invariant classes

> **STATUS: COMMISSIONED (phase 1) — #527 merged to `release` (`124c19c73`); the antagonist tortures the *corrected* substrate.**
>
> **Two-phase plan (principal-directed):**
> - **Phase 1 (this brief, running now):** `@fgv/ts-agent-memory` (temporal + L3 ingest + L2 write path) — the seven near-miss invariant classes below.
> - **Phase 2 (GO/NO-GO after phase 1):** a sibling `ai-assist-antagonist` (provider response-shape + param-rejection class — Gemini image-refusal finishReason, frontier routing, thinking/temperature conflicts, converter field-drop). **Do NOT start phase 2** — it is gated on phase 1 proving valuable (real bugs found and/or genuinely-adversarial tests judged worth the pattern). Phase 1's report feeds the go/no-go.

**Surface:** `@fgv/ts-agent-memory` (**active** — additive test-only work; no production behavior change unless a torture test surfaces a real bug, in which case STOP and report it, don't paper over it).
**Ships under the enforced coverage gate.** New tests only; existing 100% coverage must not regress.

## Charter — hole-driven, not coverage-driven

You are an **antagonist**, not an SDET writing happy-path coverage. Your mandate: **assume every invariant below is subtly violable, and for each, construct the minimal input or sequence that breaks it, then write the test that would FAIL against a plausible-but-wrong implementation.** A torture test that passes on the first run is only interesting if you can articulate the wrong implementation it would have caught. Where a test surfaces a *real* current bug: **STOP, do not fix it silently, report it** (per TESTING_GUIDELINES "never paper over failures") — the point of this stream is to find the bugs the happy-path suite missed.

**Output form is open — choose per target:**
- **Adversarial unit tests** for pure functions (dedup keys, cycle guard, seq decode, temporal boundary math).
- **Integration tests** for multi-step sequences (crash-mid-write, corrupt-then-read, merge-into-then-read, contradicts-then-asOf) over a REAL `FileTreeMemoryStore` + `InMemoryCosineIndex` (mirror the L3 e2e fixtures — no stubbed store/index).
- **One-shot property / fuzz harnesses** where the input space is large (random `valid_at`/`invalid_at` interval sets; random edge graphs for the cycle guard; random version-write interleavings). Keep them deterministic (seeded) so they're CI-stable, OR mark them clearly as one-shot exploratory (run-once, not in the gated suite) and report findings.

## Target inventory — the near-miss invariant classes (each caught LATE this arc)

For each, the "wrong implementation" to hunt is in parentheses.

### 1. Write-path union vs. replace
- **merge-into must UNION the target's prior `tags`/`links`/`provenance`, never replace** (the store's `applyUpdate` uses `arrayMergeBehavior:'replace'`). *This shipped broken and was caught by a 2nd review.* Torture: target with rich prior links/tags + a sparse merge-into candidate; two candidates merge-into the same target in one batch (edge/tag dedup); merge-into where the candidate's links overlap the target's; merge-into onto a target that itself was previously merged-into. (Wrong impl: builds the write from the candidate's envelope alone.)
- **Stage-4 exact-dedup key stability across phases** — `{kind,body}` must NOT include `links` (which stage 5 mutates). Torture: same fact ingested twice where stage-5 attaches different edge counts → must still dedup. (Wrong impl: keys on `{kind,body,links}`.)

### 2. Bi-temporal / two-clock boundaries
- **Invalidation closes the prior version's world-truth interval at the new `valid_at`, not transaction `now`.** *Shipped broken (P2-1), caught by review.* Torture: backdated write (`valid_at` < now); future-dated write (`valid_at` > now) → assert NO `asOf` gap in `[now, valid_at)` and no overlap; a sequence of out-of-order `valid_at`s; `asOf` exactly at a boundary (`asOf === invalid_at` exclusive, `asOf === valid_at` inclusive). (Wrong impl: closes at `now`.)
- **`list({asOf})` / retriever boundary math** — half-open interval `[valid_at, invalid_at)`; multiple entities; `asOf` before any version; `asOf` after all invalidated.

### 3. Partial-failure / crash-mid-write self-healing
- **Persist-new-version-first-then-invalidate must be crash-recoverable, and a stuck 2nd-current must self-heal on the next write/delete.** *Shipped with an orphan-marker gap (P2-7), caught by review.* Torture: inject a failing `_invalidateVersion` (a store/index seam that fails after the new version persists) → assert `selectCurrentVersion` still resolves the newest, then a subsequent put/delete invalidates ALL stuck currents; seed two/three simultaneously-"current" versions and assert self-heal. (Wrong impl: invalidates only the highest-seq pick.)

### 4. Corrupt / adversarial on-disk data
- **`decodeVersion` rejects a `seq` outside the safe-integer range** and non-canonical stems. *Caught by CodeRabbit.* Torture: `-v` + 30-digit suffix; `-v007` (non-canonical) round-trip; `-v-1`; `-v` with no digits; an `entityId` that itself ends in `-v<digits>`.
- **Non-string body from a store is a loud store-integrity failure, not a silent cast.** *Shipped as a blind `as string` (P1), caught by review.* Torture: a store/mock whose `list()` returns a record with a non-string body → ingest exact-dedup must fail with context, not miscompute the hash.
- Tampered/duplicate version files under one entity subtree; a version file whose `envelope.entityId` disagrees with its subtree scope.

### 5. Host-boundary hostility (the host is adversarial/buggy)
- **A non-compliant `IEntityResolver` returning a bogus/foreign-kind/nonexistent target must be rejected loudly, uniformly across `duplicate-of`/`supersede`/`merge-into`.** *Shipped with inconsistent validation (only merge-into checked), caught by 2nd review.* Torture: resolver returns a target id not in the surfaced `similar` set; a target of a different `kind`; a target that doesn't exist; for each of the three target-bearing verdicts.
- **A `handleFor` (L2) / embedder / host stage that THROWS must be caught at the Result boundary, not escape.** *L2 `handleFor` shipped unguarded, caught by CodeRabbit.* Torture: throwing `handleFor`, throwing/ rejecting classifier/extractor/resolver/relation-extractor, throwing embedder → each degrades or fails-with-context, never an unhandled rejection.
- A classifier/extractor returning a candidate whose `body` fails the kind's Converter → rejected before any store write.

### 6. Cycle guard adversarial graphs
- **Write-time cycle guard rejects any edge that closes a directed cycle over the union (existing + proposed) graph.** Torture: a proposed edge that closes a cycle *through existing store edges* (not just proposed ones); a long chain A→B→C→…→A; a self-loop; a diamond with a back-edge; duplicate proposed edges (canonical-key dedup); an edge whose `target` is a sibling candidate vs. an existing record vs. neither (loud reject); the `cycleGuard:'off'` escape actually disables it.

### 7. Enum-branch parity & convert/validate symmetry
- **Every verdict/branch of an enum gets the same validation** (the target-existence gap was one branch missing it). Torture: exercise EVERY arm of `ResolutionVerdict`, `IngestDisposition`, the temporal retriever set, and assert none has a validation hole its siblings have.
- (Cross-ref, likely already covered but worth an adversarial pass:) a converter that drops a field the type carries (the `aiClientToolConfig`/`annotations` class) — for any `@fgv/ts-agent-memory` Converter, round-trip a value with every optional field set and assert none is silently dropped.

## Constraints

- No `any`; `Result<T>`; declarative `@fgv/ts-utils-jest` matchers; real store/index in integration tests (no over-mocking that hides the real path — the exact failure mode TESTING_GUIDELINES warns about). Deterministic/seeded for anything CI-gated.
- **If a torture test surfaces a real bug: STOP and report it with the failing input + the invariant it violates. Do NOT fix production code silently and do NOT weaken the test to pass.** A found bug is the deliverable, not a failure of this stream.
- New tests must not drop existing 100% coverage.

## Sequence

Per target class: enumerate the "wrong implementations" → construct the breaking input → write the test → run it → (pass: note the wrong-impl it guards; fail: STOP + report). Then `rushx fixlint`/`lint`/`build`/`test` @ 100% → `code-reviewer` on the diff (test-quality: are these genuinely adversarial or dressed-up happy paths?) → `rush change` (`--bump-type patch`, test-only) → PR onto `release`.

## Proof of work

`git log`; gate tails (100%, no regression); per-target-class: the torture tests added + a one-line "wrong implementation this would catch" for each; **any real bug found, reported prominently at the top of the report** with failing input + violated invariant; `code-reviewer` disposition (did it judge the tests genuinely adversarial?).

## Why this stream exists

Across the agent-memory arc, every listed invariant was **implemented plausibly and passed its happy-path tests, but had a hole a second adversarial pass found** (merge-into data loss, temporal valid-time gap, orphaned invalidation, seq overflow, non-string body cast, inconsistent verdict validation, unguarded host callback). The happy-path suite + a single review is not sufficient for substrate this load-bearing (the L3 `contradicts` interlock, L2 agent writes, and PersonAIlity's durable memory all sit on it). An explicit antagonist, run once against the corrected code, converts "we got lucky on the second review" into "we hunted these classes deliberately."
