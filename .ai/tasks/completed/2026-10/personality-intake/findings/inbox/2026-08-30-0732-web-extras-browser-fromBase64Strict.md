# ts-web-extras' `browserCryptoProvider` calls `fromBase64Strict`, which ts-extras' browser entry omits — breaks recovery unlock in the browser

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#648](https://github.com/ErikFortune/personaility/issues/648) — an issue (a bug report filed as an ask), label `fgv-ask`, open. Title: "[fgv] ts-web-extras' browserCryptoProvider calls a Node-only helper — breaks recovery unlock in the browser".
- **Author / date:** ErikFortune, 2026-08-30T07:32:01Z. Three comments, all by ErikFortune: [2026-08-30](https://github.com/ErikFortune/personaility/issues/648#issuecomment-5467425764) (correction of the mechanism), [2026-09-20](https://github.com/ErikFortune/personaility/issues/648#issuecomment-5749240141) (re-verified at `-56`), [2026-09-23](https://github.com/ErikFortune/personaility/issues/648#issuecomment-5804623369) (re-verified at `-57`).
- **Long form:** [`.ai/notes/fgv-share/ASK-2026-08-30-web-extras-node-only-base64.md`](https://github.com/ErikFortune/personaility/blob/integration/v2/.ai/notes/fgv-share/ASK-2026-08-30-web-extras-node-only-base64.md) on `integration/v2` (corrected at `7928f64` per the first comment).

## The request, in their terms

The issue body's original diagnosis (bundler dropping a Node-only module) was **retracted by the requester** in the first comment: "**That was wrong** — a guess presented as a finding." The corrected request:

> "**The fix is one line** — add `fromBase64Strict` to `crypto-utils/index.browser` (and check `Constants`). Not a module reorganization, so suggestion (1) in the issue body is heavier than needed."

> "`fromBase64Strict` is a pure string→bytes helper with no Node dependency, and **its sibling `fromBase64` is exported to the browser** — so this reads as an accidental omission from the browser barrel, not a policy decision."

Also asked (comment 1, "The guard still worth having"):

> "Nothing in `ts-web-extras` should reference a `ts-extras` symbol absent from `index.browser`. That's mechanically checkable against the two barrels and catches the class rather than this instance — cheaper than a browser-bundle test, though that would be better still."

And (issue body, "What would help most"):

> "A `ts-web-extras` test that exercises `browserCryptoProvider` **through a browser bundle** rather than under Node. Under Node every one of these resolves, which is why it shipped — the unit tests structurally cannot see it."

## Stated motivation

> "**Impact:** breaks a shipped journey — recovery-passphrase unlock in the v2 app's browser."

> "On screen, in red: **`CryptoUtils.fromBase64Strict is not a function`**."

> "**There is no console error and no failed network request** — the app catches the throw and renders it."

## Stated constraints or acceptance

- > "**There is no consumer-side workaround**, and that's correct behavior: the types accurately describe the browser barrel, so TypeScript refuses. The types are right and the barrel is wrong."
- Latest status (comment 3, 2026-09-23): "**Re-verified against `@fgv/ts-extras@5.1.0-57` and `@fgv/ts-web-extras@5.1.0-57` … — still open, no change since `-56`.**"
- Comment 2: "This doesn't reach the V1 (`personaility`) track's own code … zero references to `browserCryptoProvider`/`fromBase64Strict`." The consumer is the V2 track (`integration/v2`).
- No priority stated.

## Package(s) it appears to touch

`@fgv/ts-extras` (`crypto-utils/index.browser`), `@fgv/ts-web-extras` (`browserCryptoProvider`).

## Stated dependencies

None.

## Observations (intake agent's, not the requester's)

- On `integration/agent-tasks-v1` @ `2a95fbb2`, `libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts` still exports `fromBase64` but not `fromBase64Strict`, while `index.ts:58` exports it. `Constants` is exported as a namespace from `index.ts:31`; the browser barrel exports the individual constants instead.
- `ts-web-extras` calls `CryptoUtils.fromBase64Strict` at two sites, not one: `browserCryptoProvider.ts:354` and `file-tree/httpTreeAccessors.ts:471`. The second is not mentioned in the issue.
