# `agent-memory-fragment-id`

> **Amended 2026-08-16.** One claim in the archived `result.md` is now false; see
> [Appendix A](#appendix-a--corrections-2026-08-16). Nothing else in this record changed.

**Shipped to `release` via PR #585 (`67e128480`, 2026-07-31).**

Gives a fragment a durable, opaque identity so a consumer can correlate a retrieval hit back to
its own chunk across re-embeds.

`IEmbeddedFragment` and `IVectorQueryHit` carry two optional identity fields — `locator` (an
**advisory** `[start, end)` span, explicitly *not* a slice guaranteed to reproduce the fragment's
text, since a rewriting segmenter may not leave it as a substring) and `fragmentId` (an opaque
consumer-minted bytestring, stored and returned verbatim, never parsed, never in the query path).
**At least one of the two is required**, enforced by `embeddedFragmentConverter` and re-checked by
both index implementations.

Fragment-id stability across re-embeds is the **consumer's** responsibility — whole-record-replace
re-emits the whole set. The library's guarantee is only "we never parse it".

**Neither field discriminates a fragment hit from a record hit**, and the disjunction is not
offered as a discriminator either: fragment-ness is determined by *which index produced the hit*.
The consumer's own proposed fix — discriminate on `fragmentId` — has the same flaw one level down,
because the at-least-one rule permits locator-only fragments.

## Artifacts

`brief.md` and `result.md` are archived read-only alongside this file; `meta.yaml` carries the
machine-readable record.

## Appendix A — corrections (2026-08-16)

### A.1 — `result.md` records the PR as unmerged

`result.md` states:

> Branch `agent-memory-fragment-id` (from `origin/release`) → **PR #585** against
> `release` (not merged).

That was true when written and is **false now**. PR #585 merged as `67e128480` on 2026-07-31,
under the title *"feat(agent-memory): durable fragment identity — opaque `fragmentId` + advisory
`locator` (#585)"*, and `fragmentId` is present in `libraries/ts-agent-memory/etc/ts-agent-memory.api.md`
on `release` today. Verified by `git log -S fragmentId` against the checked-in API report.

`result.md` is authored-in-flight evidence and is left unedited per the artifact protocol; this
appendix is the correction of record.

### Checked and unchanged

The shipped-surface description above, the advisory-locator semantics, the at-least-one-of rule
and its two enforcement points, the consumer-owned stability guarantee, and the
not-a-discriminator argument were all re-verified against `result.md` and against the API report
on `release`, and stand as written.
