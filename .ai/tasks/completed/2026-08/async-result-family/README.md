# `async-result-family`

**Shipped to `release`** (2026-08-02), PRs #596.

Five bounded-parallel collectors (`mapResultsAsync` / `mapDetailedResultsAsync` / `mapSuccessAsync` / `mapFailuresAsync` / `allSucceedAsync`) plus the two serial-by-contract members (`populateObjectAsync`, `firstSuccessAsync`), each mirroring its sync sibling's name, parameter order and fold, and taking *deferred* work rather than materialized promises so already-started work is structurally inexpressible.


## Artifacts — reconstructed, and incomplete

**This stream never wrote a `result.md`.** What survives on disk is only what is listed
below; everything else in this record was reconstructed from git history on
2026-08-16, and is therefore limited to what the commits and PRs say. Where the
reconstruction could not establish something, the field is left blank rather than
guessed at — the artifacts are the evidence, and if they do not say it, we do not know it.

Specifically **unrecoverable**: the stream's own account of what it deviated from in its
brief, any findings it dispositioned along the way, and any open questions it left behind.
If a later stream trips over something this one already knew, that is why.

### Surviving artifacts

`brief.md` only, archived read-only alongside this file, plus the reconstructed `meta.yaml`.
