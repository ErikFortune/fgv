# fgv → PersonAIlity: reply to the 2026-07 round-2 asks

**Date:** 2026-07-28. **Triaged against:** `release` @ `b689c99ca` — one alpha *ahead* of the
`5.1.0-45` you adopted. Every claim below was checked against the code and, where the answer
depended on runtime behaviour, **executed** rather than read.

Thanks — the reports were precise and the repro sequences were what made two of them
diagnosable in minutes. Two of the five need no work from you beyond a change of address;
one is a real bug that was **broader than you found**; one is a doc fix; one is queued.

---

## Short version

| Your ask | Our answer | Your next action |
|---|---|---|
| (A) no `'tools'` in `ModelSpecKey` | Working as designed — your workaround is unnecessary | Drop the hand-rolled walk; pass a tier |
| (B) `resolveImageCapability` alias-unsafe | **Confirmed. Also affects `resolveEmbeddingCapability`** | Fix landing; see interim guidance |
| Provenance merge contract | **Yes** — intended, stable, and sub-key `null` is sanctioned | Depend on it |
| WebAuthn R11 / R12 | **Already shipped since 2026-05-12** — separate packages | `npm install` two packages |
| Fenced-JSON diagnostics | Real; typed reason being added | None |

---

## 1(A). `resolveProviderModel`'s `context` has no `'tools'` — working as designed

**You do not need to hand-compose `resolveModel` + `resolveModelAlias`.** The chokepoint
covers the tool path today:

```ts
// tool-path caller. `tier` is undefined (→ base), 'advanced', or 'frontier'.
const model = AiAssist.resolveProviderModel(descriptor, modelOverride, tier).orThrow();
// tools + thinking then ride on the request itself — they do not select the model.
```

The absence of `'tools'` is a deliberate removal, not an oversight. When the quality-tier
axis landed, `tools` and `thinking` were **taken out** of `ModelSpecKey` under a rule we
call *composition, not competition*: tools (server-side tools) and thinking (reasoning
effort) are orthogonal **request** parameters that ride on top of whatever model the tier
selected. They never select a model. `tier: 'base'` + a thinking config resolves the cheap
base model and sends the thinking param to it; every base model is thinking-capable, so
thinking composes with any tier with zero capability checks.

**That said, your conclusion was reasonable and the fault is ours.** That rule is currently
documented only in our internal `LIBRARY_CAPABILITIES.md`, not on the API surface. Reading
`resolveProviderModel`'s TSDoc alone, you see a key set that omits your case and it looks
like the chokepoint doesn't cover you. You are the **second** consumer to hand-roll the walk
for this reason, which is a docs defect, not a coincidence. We are adding a `@remarks` block
to `resolveProviderModel` and a note on `ModelSpecKey` recording why the two keys are absent.

**Action for you:** delete the hand-composition and pass a tier. No API change needed.

---

## 1(B). `resolveImageCapability` alias-unsafe — confirmed, and worse than you found

You described a confident *"not capable"*. What actually happens is worse: the alias matches
the catch-all `modelPrefix: ''` and returns a **different, wrong capability** — so a caller
gets confident *wrong metadata*, not an obvious negative. Reproduced on `release`:

| Provider | Alias | Capability from alias | Capability from concrete id |
|---|---|---|---|
| `openai` | `@openai:image` | `{modelPrefix:'', outputParamStyle:'response-format'}` | `{modelPrefix:'gpt-image-', acceptsImageReferenceInput:true, outputParamStyle:'output-format'}` |
| `xai-grok` | `@xai-grok:imagine` | `{format:'xai-images', acceptsImageReferenceInput:false}` | `{format:'xai-images-edits', acceptsImageReferenceInput:true}` |
| `google-gemini` | `@google-gemini:flash-image` | *(no mismatch — single catch-all rule)* | same |

The xAI row flips the **wire format** *and* `acceptsImageReferenceInput`. If you branch on
either, you build the wrong request — and Gemini masks the problem in testing because it has
only one rule, so a Gemini-first integration looks fine.

**The sibling has it too — you did not test this one.** `resolveEmbeddingCapability` is the
same prefix-match shape with the same flaw:

| Provider | Alias | From alias | From concrete |
|---|---|---|---|
| `openai` | `@openai:embedding` | `{modelPrefix:''}` | `{modelPrefix:'text-embedding-3', supportsDimensions:true, maxBatchSize:2048}` |

So the alias form silently reports **no dimensions support** and **drops the `maxBatchSize`
guard** — the latter means an oversized batch reaches the wire instead of failing fast.
Worth auditing your embedding path for the same pattern.

**Our own call paths were never affected**, which is why this didn't surface earlier:
`callProviderImageGeneration` resolves the alias before resolving capability. The hazard is
exclusively for consumers calling the exported helpers directly — which is precisely what
they're exported for, so this is our bug, not a misuse. We also found an instance in our own
testbed sample, so your report caught a live one.

**Fix in flight.** A stream is implementing a guard so an unresolved alias cannot silently
produce a wrong answer, on **both** resolvers, plus the testbed fix.

**Interim guidance (works on `-45` today, and stays correct after the fix):** resolve to a
concrete id first, then ask for capability.

```ts
const model = AiAssist.resolveProviderModel(descriptor, modelOverride, 'image').orThrow();
const capability = AiAssist.resolveImageCapability(descriptor, model); // concrete id
```

Never pass a `defaultModel` slot value or a `resolveModel(...)` result straight into a
capability resolver — both can be alias-shaped.

---

## 2. Record-provenance merge contract — yes, on both halves

**Is it intended and stable, or incidental?** Intended, and pinned. `provenance` sits in
`KnowledgeLwwPolicy.mutableFields` alongside `body` / `tags` / `links` / `embeddingRef`,
under a TSDoc block headed **"Merge-surface pin (resolves design-lock §5.3's
body-vs-envelope muddle)"**. It is a deliberate resolution of a named design ambiguity, not
a by-product of the current merge config. You can depend on it.

**Is clearing a provenance sub-key via `null` sanctioned?** Yes — and the block itself is
protected from deletion. Executed against the built library:

| Patch | Result |
|---|---|
| `{provenance: {note: null}}` | `note` removed; `source` / `confidence` preserved ✅ |
| `{provenance: {confidence: 0.5}}` | per-key merge; `note` preserved ✅ |
| `{provenance: null}` | **rejected loudly**: `knowledge LWW: merge patch may not delete required field(s): provenance` |
| `{tags: ['x']}` | provenance untouched ✅ |

So: sub-key `null` clearing is sanctioned and safe to build on; whole-block deletion fails
loudly rather than silently destroying provenance; and the per-key merge guarantee you
depend on holds.

**One precision worth carrying:** this guarantee is stated for `KnowledgeLwwPolicy`, whose
`mutableFields` we pin. `MemoryCapCullPolicy` takes a **caller-supplied** `mutableFields`, so
if you use it, the mutable surface is the one *you* declared. We are documenting this
distinction in the package README so it stops being tribal knowledge.

---

## 3. WebAuthn R11 / R12 — already shipped; you're looking in the wrong package

This is the one where the finding is a change of address rather than a build.

- **`@fgv/ts-extras-webauthn`** (server) and **`@fgv/ts-web-extras-webauthn`** (browser)
  exist, are `shouldPublish: true`, and are at **v5.1.0**.
- They landed **2026-05-12** via PR #351 (the crypto-batch-2 cluster) — roughly **2.5 months
  before** the `-45` alpha you adopted. They were in your alpha.
- They are **separate packages**. R11/R12 were originally filed against `@fgv/ts-extras` /
  `@fgv/ts-web-extras`, so a search of your installed set finds nothing there and reads as
  absence. That is exactly what happened.

The surface is six primitives — four server-side (`generateRegistrationOptions`,
`verifyRegistrationResponse`, `generateAuthenticationOptions`,
`verifyAuthenticationResponse`) and two browser-side ceremony starters (`startRegistration`,
`startAuthentication`).

**Your open Q3 (wrap vs delegate) is already decided, and shipped as "wrap thinly."** The
packages are a Result-integration boundary over `@simplewebauthn/*`: they convert
throw-on-failure into `Promise<Result<T>>` and add nothing else. Explicitly out of scope, and
enumerated as such in the README: ceremony orchestration, challenge generation/storage,
credential or user database abstractions, session token issuance, attestation policy
presets, algorithm allowlists, and PRF/salt helpers.

**That also disposes of the RP-ID adjudication.** Nothing in the shipped surface takes a
position on RP-ID, native passkeys, or `webauthn-prf` — so there is no deferred decision
blocking you. Build your ceremony orchestration on top; for anything outside the six
primitives, call `@simplewebauthn/*` directly with your own `captureAsyncResult` wrapper.

**Action for you:** install the two packages and re-read the ask against the shipped README.
If something you need is genuinely absent after that, re-file — but please re-file against
the shipped surface, since the original R11/R12 text predates it.

---

## 4. `fencedStringifiedJson` failure diagnostics — real, queued

Confirmed exactly as you described: property-name-position parse failures still surface the
bare `JSON.parse` message, so unquoted key / single-quoted key / unterminated name / elision
are indistinguishable — and they do want opposite handling.

Your own caveat was correct and saved us a wrong turn: the `-45` addition of a distinct
message for the unclosed-brace case fires in the **extractor**, before `JSON.parse`, and does
not reach this. We are keeping that behaviour byte-identical.

A stream is adding a **typed failure reason** following the same discriminated-result shape,
carrying the failure class plus offending token and offset where determinable.

**One caveat on what you'll get.** Engine parse-error message formats vary across Node
versions, so classification is conservative by design: where a case cannot be identified
structurally with confidence, it lands in an honest catch-all rather than being guessed.
A confidently wrong classification would be worse than an unknown one, given you plan to
branch on it. We would rather ship four solid classes and one honest "unclassified" than
five shaky ones — tell us if that trade is wrong for your use.

---

## Summary of what we're changing

| Item | Change |
|---|---|
| (A) | TSDoc `@remarks` on `resolveProviderModel` + `ModelSpecKey`. No API change. |
| (B) | Guard on `resolveImageCapability` **and** `resolveEmbeddingCapability`; testbed call-site fix. |
| Provenance | README + TSDoc documenting the guarantee (incl. the per-policy distinction) + a test pinning it. No behaviour change. |
| WebAuthn | Nothing — already shipped. |
| Fenced JSON | Typed failure reason, conservative classification. |

Nothing here was blocking, and nothing blocked our current publish. The (B) guard is the only
item that changes runtime behaviour, and only in the direction of refusing to answer
confidently when it cannot answer correctly.
