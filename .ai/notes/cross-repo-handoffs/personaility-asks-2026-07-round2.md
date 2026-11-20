# PersonAIlity → fgv asks, 2026-07 round 2

**Received:** 2026-07-28 (Erik relayed). **All non-blocking** per the consumer.
**Triaged against:** `release` @ `b689c99ca` (post #570 / #573 / #574) — i.e. one alpha
*ahead* of the `5.1.0-45` the consumer adopted.

Every claim below was checked against the code, and where possible **executed** rather than
read. Two of the four asks turn out to be already answered; one is real and broader than
reported; one is real as described.

---

## 1. Model-alias sharp edges — `@fgv/ts-extras` ai-assist (consumer P0)

### (A) `resolveProviderModel`'s `context` has no `'tools'` member

**Verdict: working as designed. The consumer's conclusion ("must hand-compose") is
incorrect — but the doc defect that produced it is real.**

`ModelSpecKey` is `'base' | 'advanced' | 'frontier' | 'image' | 'embedding'`
(`model.ts`). The absence of `'tools'` is deliberate: `tools` and `thinking` were
**removed** from the key set when the quality-tier axis landed. The design rule is
*composition, not competition* — tools (server-side tools) and thinking (reasoning effort)
are orthogonal **request** params that ride on top of whatever model the tier selected;
they never select a model.

So the chokepoint **is** usable from the tool path:

```ts
// tool-path caller — pass the tier (or omit for base). No hand-composition needed.
const model = AiAssist.resolveProviderModel(descriptor, modelOverride, tier).orThrow();
// tools/thinking then ride on the request, independent of which model came back.
```

**But the doc gap is genuine and worth fixing.** `resolveProviderModel`'s TSDoc documents
the *mechanism* (ModelSpecKey walk → alias resolution) and says nothing about the
tools/thinking rule; that rule lives only in `LIBRARY_CAPABILITIES.md`. A consumer reading
the API surface alone sees a key set that omits their case and reasonably concludes the
chokepoint doesn't cover them. Two independent consumers hand-rolled the walk — that is
evidence about the docs, not about the API.

**Proposed action (additive, cheap):** a `@remarks` block on `resolveProviderModel`
stating that `tools`/`thinking` are not model selectors and that tool-path callers pass a
tier; plus a matching note on `ModelSpecKey` explaining why the two keys are absent
(they were removed, so their absence looks like an oversight rather than a decision).

### (B) `resolveImageCapability` matches raw prefixes with no alias guard

**Verdict: confirmed real — and materially worse than reported. Also affects a sibling
function the consumer did not test, and has an in-repo instance.**

The report describes a confident *"not capable"*. What actually happens is worse: the
alias form matches the catch-all `modelPrefix: ''` and returns a **different, wrong
capability** — so the caller gets confident *wrong* metadata, not an obvious negative.

Executed against `release`:

| Provider | Alias form | Capability from alias | Capability from concrete id |
|---|---|---|---|
| `openai` | `@openai:image` | `{prefix:'', style:'response-format'}` | `{prefix:'gpt-image-', refs:true, style:'output-format'}` |
| `xai-grok` | `@xai-grok:imagine` | `{format:'xai-images', refs:false}` | `{format:'xai-images-edits', refs:true}` |
| `google-gemini` | `@google-gemini:flash-image` | *(no mismatch — single catch-all rule)* | same |

Note the xAI row flips both the **wire format** (`xai-images` vs `xai-images-edits`) and
`acceptsImageReferenceInput`. A consumer branching on those builds the wrong request.

**The sibling has it too.** `resolveEmbeddingCapability` is the same prefix-match shape and
the same hazard — untested by the consumer:

| Provider | Alias form | From alias | From concrete |
|---|---|---|---|
| `openai` | `@openai:embedding` | `{prefix:'', format:'openai-embeddings'}` | `{prefix:'text-embedding-3', supportsDimensions:true, maxBatchSize:2048}` |

So the alias form silently drops `supportsDimensions` and the `maxBatchSize` guard.

**The library's own call path is safe.** `callProviderImageGeneration` resolves the alias
(`apiClient.ts:1336`) *before* resolving capability (`:1341`). The hazard is exclusively
for consumers calling the public helpers directly — which is what these are exported for.

**In-repo instance (ours).** `samples/testbed`'s `image-generation` scenario does exactly
this: `defaultModelFor` returns `AiAssist.resolveModel(descriptor.defaultModel, 'image')`
— the **alias** form (`index.tsx:45`) — and feeds it to `resolveImageCapability`
(`index.tsx:89`). Result: for the OpenAI and xAI defaults the scenario resolves the wrong
capability, suppressing the "use as reference" affordance and offering the wrong
size/quality options. Not published (it is a sample), but it is the scenario that just
replaced the retired `ai-image-gen-sample`, so it should be fixed.

**Proposed action:** make both capability resolvers alias-aware, or fail loudly when handed
a `MODEL_ALIAS_SIGIL`-prefixed id. Failing loudly is the smaller change and matches the
registry-gated posture everywhere else (an unregistered `@alias` already fails rather than
hitting the wire); silently matching `''` is the outlier. Then fix the testbed call site.

---

## 2. Record-provenance merge contract — `@fgv/ts-agent-memory` (consumer P0)

**Verdict: yes to both halves of the narrowed question. Evidence below.**

**Is it intended and stable, or incidental?** Intended. `provenance` sits in
`KnowledgeLwwPolicy.mutableFields` alongside `body` / `tags` / `links` / `embeddingRef`,
under a TSDoc block headed **"Merge-surface pin (resolves design-lock §5.3's
body-vs-envelope muddle)"** — it is a deliberately pinned contract that resolves a named
design ambiguity, not a side effect of the current merge config.

**Is clearing a provenance sub-key via `null` sanctioned?** Yes — and the block itself is
protected. Executed against the built library:

| Patch | Result |
|---|---|
| `{provenance: {note: null}}` | `note` removed; `source`/`confidence` preserved ✅ |
| `{provenance: {confidence: 0.5}}` | per-key merge; `note` preserved ✅ |
| `{provenance: null}` | **fails loudly**: `"knowledge LWW: merge patch may not delete required field(s): provenance"` |
| `{tags: ['x']}` | provenance untouched ✅ |

So: sub-key `null` clearing works per RFC-7386 and is safe to depend on; whole-block
deletion is explicitly rejected rather than silently accepted. The per-key merge guarantee
the consumer depends on holds.

**Action: none in code.** This is an answer to relay, optionally with the guarantee written
into the package README so the next consumer doesn't have to ask.

---

## 3. WebAuthn server/client — R11 / R12 (consumer P2)

**Verdict: already shipped. This is a discovery failure, not a capability gap — and the
open decision it carries (Q3) was decided and shipped 2.5 months ago.**

The consumer reports "zero WebAuthn or passkey surface in any installed @fgv package."
That is accurate *about their install set* and misleading as a conclusion:

- **`@fgv/ts-extras-webauthn`** and **`@fgv/ts-web-extras-webauthn`** exist on `release`,
  `shouldPublish: true`, version `5.1.0`.
- They landed **2026-05-12** via #351 (crypto-batch-2 cluster) — roughly 2.5 months before
  the `-45` alpha they adopted.
- They are **separate packages**, not surface inside `@fgv/ts-extras` /
  `@fgv/ts-web-extras`. R11/R12 were originally filed against those two packages, so a
  search of the installed set finds nothing and looks like absence.

The six primitives are exactly the four server-side (`generateRegistrationOptions`,
`verifyRegistrationResponse`, `generateAuthenticationOptions`,
`verifyAuthenticationResponse`) plus the two browser-side ceremony starters.

**Q3 (wrap vs delegate) is already answered by what shipped:** a thin Result-integration
boundary over `@simplewebauthn/*` — exception → `Result<T>` and nothing else. Ceremony
orchestration, challenge management, credential storage, PRF helpers, and attestation
policy are all **explicitly out of scope** and enumerated as such in the package README.
That also disposes of the RP-ID adjudication concern: nothing in the shipped surface takes
a position on RP-ID or native-passkey policy, so there is no decision left to defer.

**Action: none for us** beyond confirming the packages are in the next alpha (they are —
`shouldPublish: true`). For the consumer: install the two packages, and re-read the ask
against the shipped README before re-filing.

---

## 4. `fencedStringifiedJson` failure diagnostics (consumer P3)

**Verdict: real, accurately characterized, correctly prioritized.**

A property-name-position parse failure still surfaces the bare `JSON.parse` message with no
typed reason, offending token, or offset — so unquoted key / single-quoted key /
unterminated name / elision are indistinguishable, and they do want opposite handling
(repair vs re-prompt vs fail).

The consumer's own caveat is correct and worth echoing: #573 added a distinct
truncation-aware message for an adjacent case (structure opened but never closed → points
at `truncated` / `maxTokens`), but it fires in the **extractor**, before `JSON.parse`, and
does not touch the property-name-position case.

**Proposed action:** a typed failure reason on the JSON path (discriminated, in the shape
of the `found`/`unclosed`/`none` scan result #573 introduced) carrying reason + offset +
offending token. Genuinely opportunistic — no consumer is blocked.

---

## Summary for the reply

| Ask | Verdict | Work for us |
|---|---|---|
| (A) `'tools'` ModelSpecKey | By design; consumer's workaround unnecessary | TSDoc `@remarks` only |
| (B) capability alias guard | **Real, broader than reported** (also `resolveEmbeddingCapability`; wrong-metadata not just false-negative) | Guard both resolvers + fix testbed call site |
| Provenance merge contract | **Answered yes, both halves** (evidence above) | None; optionally document in README |
| WebAuthn R11/R12 | **Already shipped** since 2026-05-12; separate packages | None; tell them to install |
| Fenced-JSON diagnostics | Real, P3 | Typed failure reason, opportunistic |

Net: one genuine bug to fix (B, plus its sibling and our own call site), two doc/relay
answers, one opportunistic ergonomic improvement. Nothing blocks the current publish.
