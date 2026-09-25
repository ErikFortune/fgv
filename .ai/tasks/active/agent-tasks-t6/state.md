# State — `agent-tasks-t6`

**Branch:** `claude/agent-tasks-t6` (off `integration/agent-tasks-v1` at `30da0578`, plus the
orchestrator's `5bcae5ce` deciding the dereference question). PR target: `integration/agent-tasks-v1`.

## Inputs confirmed

- Brief, plan § T6, design § 5 / § 8.3 / § 8.6, T4/T5 results, TECH_DEBT capacity + T5 hand-off
  entries: all present.
- **Locator discrepancy (not a gap):** the brief says "§ 5 of the plan" carries
  `'latest-snapshot' | 'replayable-updates'`. It is **`development-design.md` § 5** (lines ~304, 317,
  319), plus `multi-agent-chat-adoption.md:409`. The plan's § 5 is "Broker and delivery" and never
  spells the history contract. Corrected in the design doc (and the adoption doc's stray spelling).
- **Dereference question:** decided by the orchestrator (`5bcae5ce`): no dereference at terminal
  presentation. T6 builds against it.

## Design (decisions, in the order they bind)

1. **Spelling.** § 8.6's `'observed-state' | 'source-replay'` is right (T1 built on it; it names the
   *guarantee*, not the mechanism). `ITaskSource.history` uses it; design § 5 corrected.
2. **`ITaskSource`** (types/source.ts) per design § 5, plus: `SourceRead`, `ISourceReconcilePage`
   with `coverage: 'all-bindings' | 'active-only'`, `SourceCommandResult` (rejected carries a closed
   reason; a `key-expired` state for dedup-key expiry), optional `lookupCommand`.
   `RecoveryResult.unrecoverable` gains the source `revision` it is declared at (T1 revision — not
   persisted anywhere, so no storage-format change) so the broker can apply a source-confirmed
   failure as an ordinary observation with dedup evidence.
3. **Sources are attached at `TaskBroker.create({ sources })`.** A task whose source is not attached is
   left exactly as it is: commands fail `source-unavailable` recording nothing; observation passes
   report it. Open never touches a source.
4. **Observation application (one gated section per binding).** `compare(committed, observed)`:
   newer → observation commit (execution fields only; catalog merged from the latest record);
   same + equal execution projection → freshness **maintenance** commit when `observedAt` is later
   (no revision, no update) — the freshness-refresh property; same + different projection →
   `source-gap`; older → stale, ignored; incomparable → ignored until explicit recovery.
   Health transitions (current↔stale/unavailable) are semantic → an observation commit at the
   **same** source revision that changes health only (storage extended to admit exactly that).
5. **`source-replay` sources: only the feed commits projections.** `observe`/push hints/command
   `applied` observations are hints that run a feed pass from the committed cursor; they never commit
   a projection directly. Per-binding revisions in a page must strictly increase; `gap` or broken order
   stops the page with the cursor unmoved.
6. **Source checkpoint record** `source-<id>.json` (header + history + cursor + checkpoint + record
   revision). Written only after every observation in the page committed. Created record-first then
   manifest-live; a retry adopts an exactly-initial record left by a crash between the two.
7. **External commands** (design § 5 protocol): intent (`not-sent`, receipt `accepted`) commits and
   **mints an `accepted-operation-settlement` claim in storage** (A3: reserved before dispatch) →
   release gate → recheck authority (revoked ⇒ settle `rejected: denied`, nothing sent) → marker
   `possibly-sent` → dispatch outside the gate → persist result (merged onto the latest record).
   Claim consumed when dispatch becomes `settled`. Replay-source `applied` answers leave the receipt
   `accepted` with an `awaiting` source revision; the feed commit that reaches it settles `applied`.
8. **Uncertain dispatch** (`possibly-sent` with no result): a bound-writer pump. `lookupCommand` if the
   source has one; else re-dispatch under the same key only when the kind's command handle is
   `idempotency: 'source-key'`; else **held** (`indeterminate`, never resent). `key-expired` → held.
9. **A3 replay envelope.** `registerExternal` against a `source-replay` source must declare a finite
   envelope; storage mints an `admitted-source-replay` claim on the task; each committed required
   feed revision spends one; exceeding it is a `source-gap` with the cursor unmoved; terminal
   consumes the remainder; extension is new admission (`extendReplayEnvelope`).

## Done

- Implementation, tests (1,353, 100 % coverage, zero `c8 ignore`), layer-1 review and its fixes.
- Post-review self-audit of ordering windows found W4 (pump resend unfenced) — fixed (`605e482b`).
- Revert check: 18 protections, all red (script: see result.md list).
- Docs: `CAPABILITIES.md` External sources section; router shortcut + package row; design § 5
  spelling; TECH_DEBT capacity amendment + T6 hand-off entry (T5's T6 item marked resolved);
  `result.md`.

## Open

- Repo-wide `rebuild` + `test` and the verify scripts on the final source.
- Plan T6 status line + WORKSTREAMS entry anticipating merge (needs the PR number).
- Open PR into `integration/agent-tasks-v1`; drive the Copilot loop; record rounds in result.md.

## Next concrete step

Run the repo-wide gates; open the PR; commit the status lines with its number; request Copilot.
