# `safer-fetch`

**Shipped to `release`** (2026-08-06), PRs #597, #599, #601, #602.

`saferFetchBytes` / `saferFetchText` / `saferFetchJson` in `@fgv/ts-extras` with a **required** `addressGuard` (omitting it is a compile error), `blockPrivateNetworks` / `allowAnyAddress`, four guard seams, `redirectPolicy: 'validate-each-hop'` unifying redirect following with the SSRF guard, opt-in retry, and the browser entry points in `@fgv/ts-web-extras` that refuse `validate-each-hop` up front rather than degrading it.


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

four sub-stream briefs (`brief-s1-core.md`, `brief-s2a-address-classification.md`, `brief-s2b-guard-and-redirect-walk.md`, `brief-s3-browser-retry-docs.md`) and `plan.md`, archived read-only alongside this file, plus the reconstructed `meta.yaml`.
