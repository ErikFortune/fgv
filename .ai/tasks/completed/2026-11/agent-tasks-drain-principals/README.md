# agent-tasks-drain-principals — only named principals may drain a subscription

**Shipped**: 2026-11-12 into `integration/agent-tasks-host` via #TBD, beside #762, whose promotion to
`release` this unblocks. Package: `@fgv/ts-agent-tasks` (`broker`, `storage`, `converters`, `types`,
`host`); `@fgv/testbed` journey. Change file `minor`, `BREAKING:`.

## Summary

`bindDelivery` used to check only that a subscription existed under `consumerId`, so any host code
able to name a consumer could bind it and drain it. Now:

- **`subscribe` records `drainPrincipals`** — by default the registering principal alone; a host
  that subscribes on an agent's behalf names the agent (the registrant is not added implicitly).
- **`bindDelivery` refuses anyone else** with `not-found-or-denied`, the same answer as a missing
  subscription, and `TaskDeliveryPump.create` inherits it. **Every bound-delivery operation applies
  the rule again** to the subscription as it stands, so a binding made before a principal was removed
  is refused from then on.
- **Records written before the field existed** are drained by their registrant alone
  (`drainPrincipalsOf`).
- **`TaskBroker.setSubscriptionDrain`** replaces the list (and the policy identity), through the
  registering principal's binding.
- **`disposeWithheld`** requires the subscription's recorded `policyIdentity` to equal the binding's
  `ITaskAuthorization.policyIdentity` — closing #762's accepted residual — and accepts any drain
  principal.

## What a reader should know

- `subscribe` is **not** an update path: a retry after `setSubscriptionDrain` is `conflict`.
- A subscription with no recorded policy identity refuses every `disposeWithheld`.
- The identity is a host-given name, not a credential.
- Step 0 (merging `release`) is described in `result.md`: #758 as the effective merge base, and a
  capability-router trim to stay under CI's character cap.
- Open: a receipt a removed principal prepared stays acknowledgeable by a principal still named.

## Files

`brief.md` (frozen), `state.md` (worker's log), `result.md` (outcome, revert matrix, check-then-act
table, gates), `revert-matrix.py`, `meta.yaml`.
