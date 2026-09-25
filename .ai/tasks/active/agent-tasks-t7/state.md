# State — `agent-tasks-t7`

**Branch:** `claude/agent-tasks-t7` (off `integration/agent-tasks-v1` at `6a0e6c4ea`). PR target:
`integration/agent-tasks-v1`. Artifacts stay here; no `/finalize-task` (cluster close).

## Inputs confirmed

Brief; plan § T7 and A3; design § 7, § 8.3, § 8.6, § 9; TECH_DEBT T5 + T6 hand-offs and the capacity
entry; T6/T5/T2 `result.md`; `broker/`, `storage/`, `context/`. All present and saying what the brief
says. No missing-input stop.

## Design (decisions, in the order they bind)

1. **Storage owns subscriptions.** A subscription is a consumer record (`consumer-<id>.json`) named in
   the manifest's `consumers` inventory, persisted through an **injected, synchronous**
   `IConsumerCheckpointStore` (default: the repository's own FileTree root). Sync because the whole
   storage layer is sync (open's scan, the commit path); an async store would make open async for no
   consumer need. Recorded as a deviation from the design sketch.
2. **Audience is computed by storage and verified on every commit.** An update of category `C` at a
   commit `(before, after)` is owed to active subscription `S` iff `C ∈ S.policy.categories` and `S`'s
   selection matches `before` **or** `after`. The broker plans updates through
   `repository.audience(...)` inside its gated section; storage recomputes each new update's audience
   and refuses a commit whose audience differs (and any audience naming a non-subscription). The
   internal `createTaskBroker(params, resolver)` seam and `noAudience` are removed.
3. **Potential audience and the cap.** `PA(T)` = active subscriptions *catalog*-matching `T` (scope,
   parent, responsibility — lifecycle ignored, since any open status and every terminal status is
   reachable). Invariant: `|PA(T)| ≤ maxAudiencePerUpdate` for every non-archived task. Checked at
   subscription activation and at every registration/commit. Because the closeout, resolution,
   settlement and replay claims already reserve `maxAudiencePerUpdate` links per update, the terminal
   path is covered for every subscription that can ever be in its audience.
4. **Spend, never mint (T6 hand-off).** A commit's growth now includes the acknowledgement evidence of
   the links it adds (`acknowledgement-ids` +1, `logical-bytes` +E per link). The existing spend
   (settlement → replay → resolution/closeout) takes that growth from the task's own claims; the
   consumer's derived *owed* reservation grows by the same amount. Net ledger change for a protected
   step: zero. Claims' `logical-bytes` gain `links × E` so they can pay it.
5. **Consumer ledger entry (derived, rebuilt at open).** used: 1 subscription, baseline updates/links,
   history (acked + disposed) as `acknowledgement-ids`, record/logical bytes, baseline resident bytes.
   reserved: `owed(S)` ack-ids, `owed × E` logical, record-bytes `owed × E + units(S) × c_S × E`, and
   the receipt-preparation claim. `units(S)` = Σ over tasks in whose PA `S` is of (2 unresolved / 1
   open / 0 terminal, + unsettled commands + remaining replay updates). Per-owner check:
   `history + owed + units × c_S ≤ maxAcknowledgementIdsPerSubscription`.
6. **Receipt preparation claim** (reusable cleanup preparation): charges
   `max(0, M − Σ outstanding manifest bytes)` of record and logical bytes, `M = maxIssuedReceiptBytes`.
   Issuing the first manifest converts it; eviction restores it; neither grows `used + reserved`.
7. **Activation**: ordered protocol — pending consumer inventory entry holding a
   `subscription-activation` claim (the first record's full footprint) → record through the store →
   live entry. Replaces T1's unused `subscription-acknowledgement` purpose (a per-link stored claim
   would be committed in one record and consumed in another; the derived owed reservation has no such
   window — the link *is* the reservation until its exact ID lands in history).
8. **Exact-ID acknowledgement.** Consumer record holds the exact sorted `acknowledged` ID set and issued
   manifests keyed by delivery ID. Storage's `acknowledgeReceipt` adds exactly the manifest's IDs that
   are owed and marks it acknowledged — the only way history grows. No revision watermark anywhere.
9. **Broker delivery.** `TaskBroker.subscribe` (host), `TaskBroker.bindDelivery` →
   `pending` / `prepare` / `acknowledge` / `abandon`. Prepare: capture outside the writer, render purely,
   then in the writer recheck epoch + consumer revision + availability and issue; else regenerate
   (bounded). Acknowledge: strict receipt, exact canonical match against the unexpired manifest, every
   entry re-authorized, then storage acknowledges.

## Done

- Implementation complete (types, converters, storage, broker delivery); all suites green.
- Tests: delivery/{receipts,subscribe,accounting,checkpoints,windows,crash,retention}, storage/subscriptions,
  plus migrated T3–T6 suites. Neutered checkpoint store → 17/22 checkpoint tests red (pre-review run).
- Layer 1 `code-reviewer`: no P1; two P2 (per-task authorization windows in acknowledge and prepare)
  fixed with record/task-revision fences (W6, W8), each verified red when removed; four dead members removed.
- Docs: result.md (draft; Gates, revert matrix and review rounds to fill), TECH_DEBT (capacity amendment,
  T5/T6 hand-offs resolved, new T7→T8 entry), plan status line and WORKSTREAMS entry (with `PRNUM`
  placeholder to replace once the PR exists), package CAPABILITIES delivery section, router line,
  design-doc "as implemented" note, change file (`rush change --verify` passes).

## Next concrete step

All gates green on the final source; PR [#695](https://github.com/ErikFortune/fgv/pull/695) open into
`integration/agent-tasks-v1`. Revert matrix (22 rows) and coverage closure recorded in result.md.
Now: drive the Copilot loop (expect a long one — authorization boundary); fold each round's fixes in
with a revert check, update result.md § Review per round.
