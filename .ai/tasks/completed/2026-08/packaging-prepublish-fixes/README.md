# `packaging-prepublish-fixes` — not a stream

**This directory was never a workstream.** It has no brief and no `result.md`, and none was
lost: it is an **orphaned findings inbox**, created to hold one finding raised incidentally
by `publish-tarball-gate` while it was measuring tarball contents. Recorded here as
`status: abandoned` so it stops appearing in reconciliation as an unfinished stream.

## The finding, and its disposition

> **15 published packages declare `"license": "MIT"` and ship no LICENSE file** — a declared
> licence whose text is not distributed. Raised 2026-08-09, marked *"detected, not fixed,
> deliberately"*, and then never dispositioned.

**Resolved by subsequent work, verified 2026-08-16.** Of the packages in `libraries/` and
`tools/` declaring MIT, exactly **one** now lacks a `LICENSE` file — `@fgv/ts-res-ui-playground`
— and it carries `"shouldPublish": false` in `rush.json`, so it distributes nothing and the
finding does not apply to it. Every package that actually publishes now ships its licence text.

Verified by walking `libraries/*/package.json` and `tools/*/package.json` for a `"license":
"MIT"` declaration with no sibling `LICENSE` file, and cross-checking the single hit against
its `rush.json` publish flag.

**The finding needed no further action; it needed someone to say so.** Left undispositioned it
would have been re-found by the next packaging sweep and re-investigated from scratch — which
is the specific cost of an inbox nobody closes.
