# fgv → PersonAIlity: consolidated response to the round-3 batch

> **Landed 2026-08-16, held since 2026-07-31.** This note was written on the date above and
> deliberately kept out of `release` while the exchange was still moving (fgv #581). The exchange
> has since settled and **every question this note leaves open has been answered by shipped work** —
> `fragmentId` and the advisory `locator` (#585), the `IMemoryIndex` injection seam (#582) and the
> partial-read redesign that superseded its premise (#633), strict UTF-8 reads
> (`getFileTextStrict`), and the unified redirect/SSRF walk (`redirectPolicy:
> 'validate-each-hop'`). It is preserved **as written**, as the record of what was said at the
> time; read its open questions as historical, not outstanding.


**Date:** 2026-07-31. **Verified against:** `release` @ `fbb08cd55`.

Five asks, plus your follow-up on N-Ask5 Q3. Every claim below was checked against the code
and, where behaviour was at issue, executed rather than read.

**Headline:** we're accepting all five in substance. Two are smaller than you think because
parts already exist; two need a different shape than you proposed for reasons that would
otherwise ship a hole; one is a genuine greenfield primitive we'd want to design before
building.

| # | Ask | Decision |
|---|---|---|
| 1 | N-Ask5 Q3 — opaque `fragmentId` | **Accepted as specified**, plus your `locator?` follow-up |
| 2 | FileTree bytes path | **Accepted**, as a capability interface rather than widened core interfaces |
| 3 | Record index seam | **Accepted, split in two** — most of what you asked for already exists |
| 4 | Provenance query axis | **Accepted, as the sharper version of your option 1** |
| 5 | Result-returning fetch primitive | **Accepted, design-first** — the ask as written has an SSRF hole |

---

## 1. N-Ask5 Q3 — `fragmentId`, and `locator` optional on input

**Settled.** `fragmentId?: string` on `IEmbeddedFragment` and `IVectorQueryHit`; opaque
bytestring; never parsed, never filtered on; third auxiliary column beside
`+start_off`/`+end_off`. `locator` becomes **optional on input**, with the "at least one of
`locator` / `fragmentId`" invariant enforced **in the converter, not the type**. Your
reasoning for the converter over a conditional-required union is right and we're adopting it
verbatim: the union costs at every construction site and buys nothing at the read site, where
the field is `IFragmentLocator | undefined` either way.

Your two-ways-to-lie framing is the better argument for absence, and it's the one we'll put
in the docstring.

### Your reciprocal catch is correct — and your fix has the same flaw one level down

You're right that this falsifies a shipped promise. Confirmed both docstrings in
`vectorIndex.ts`:

- **line 115** — `IFragmentVectorIndex` reuses `IVectorQueryHit` *"(whose `locator` is always
  populated here)"*. Goes false the moment input `locator` is optional.
- **lines 38–39** — `IVectorQueryHit.locator` is *"present only on hits from a
  `IFragmentVectorIndex` … Record-granular `IVectorIndex` hits omit it."* This actively
  invites presence-branching, exactly as you said.

But **`fragmentId` is not a reliable fragment-ness discriminator either.** Under the "at least
one" rule you just proposed, a fragment may legitimately carry **`locator` only, with no
`fragmentId`** — which is precisely what every consumer that doesn't adopt `fragmentId`
emits, including every existing one. So a caller branching on `fragmentId`-presence
misclassifies a locator-only fragment hit as a record hit. Same bug, mirrored.

With both fields optional, no single field discriminates. The honest rule:

> **Fragment-ness is determined by which index produced the hit, not by field presence.**
> `IFragmentVectorIndex.query` returns fragment hits; `IVectorIndex.query` returns record
> hits. Neither `locator` nor `fragmentId` is a type discriminant, and callers must not treat
> either as one.

So we'll strike the "always populated" claim (line 115), rewrite the `locator?` docstring to
say absence carries no fragment-vs-record meaning, and **remove the invitation to branch on
presence** rather than relocating it to a different field. That's docs plus a stated rule,
lands in the same change as you asked, and doesn't require a new discriminant.

If you *do* want a self-describing hit that survives being passed around without its
provenance, say so — that's an explicit discriminant field and a different (small) design. We
don't think you need it, since you query the index you chose.

### Exactness — declined, recorded as a decision

Agreed and recorded: no `exact`/`verbatim` flag. Your rationale (durable fragment state means
you stop re-deriving fragments from the body, so span-to-text reproduction isn't an operation
you perform) is sound, and we're noting explicitly that this was **decided, not overlooked**,
so a future consumer who needs slicing reopens it as a new ask rather than assuming it was
missed. No other consumer needs it today.

### Re-index policy — agreed, and it's moving

You're right that a PR thread is the wrong home: *"the consumer who meets it is by definition
upgrading and not reading this conversation."* The drop-and-re-index rule goes into
`LIBRARY_CAPABILITIES.md` alongside the `@fgv/ts-agent-memory-sqlite-vec` entry, plus the
package README. Noted that you have no fragment DB at all — the package isn't installed in
your repo — so you'll adopt against the post-change schema and the migration is a non-event
for you.

Alongside it we'll make the mismatch **diagnosable**: the index already parses its stored
`CREATE VIRTUAL TABLE` SQL to recover the dimension, so the same parse can compare the
auxiliary-column set and fail with expected-vs-found instead of the opaque
`no such column: fragment_id` you'd get at statement-prepare time.

### Id stability

Agreed and correctly scoped: our opacity guarantee is "we never parse it," not "we keep it
stable across re-embeds." Q4's whole-record re-embed means you re-emit fragments on update,
so id stability is yours. We won't imply otherwise in the docs.

---

## 2. FileTree — a bytes path

**Accepted.** Your factual survey is exactly right: zero `Uint8Array` / `ArrayBuffer` /
`Buffer` anywhere in the file-tree packlet; `zipFileTreeAccessors.ts:377` is
`new TextDecoder().decode(fileData)`; `zipFileTreeWriter.ts:61` is `strToU8(f.contents)`. The
archive container takes bytes and text-ifies every entry.

**Two things to adjust.**

**The adapter count is larger than you listed — six across three packages.** You named node
`fsTree`, browser File-API + FSA, and zip. The repo also has in-memory (`ts-json-base`),
`localStorageTreeAccessors`, and **`httpTreeAccessors`** (both `ts-web-extras`). The HTTP one
is the most interesting for you: bytes are *more* natural there than text
(`response.arrayBuffer()`), and it's a plausible path for document ingestion.

**Adding the methods to the existing interfaces is additive for callers but breaking for
implementers — and it would silently break a runtime guard.** `fileTreeAccessors.ts` carries
capability-probing type guards (`isMutableAccessors`, `isMutableFileItem`,
`isMutableDirectoryItem`) that test `typeof x.method === 'function'`. Add `setRawBytes` to
`isMutableFileItem`'s probe list and **every existing implementation silently starts returning
`false` from that guard at runtime**, with no compile error anywhere.

So we'll model bytes the way the packlet already models mutability and persistence: a
**separate optional capability interface with its own guard** —
`IBinaryFileTreeAccessors` / `isBinaryCapableAccessors` and the item-level equivalents. That
is genuinely additive for implementers, lets adapters opt in incrementally (node / zip / FSA /
HTTP first; localStorage via base64 whenever), and — the part that answers your actual
complaint — gives a caller a **runtime way to ask** "can this tree do bytes?" instead of
having to know the detour out of band. There's precedent for a capability with no implementers
yet: `isPersistentAccessors` ships with a `c8 ignore` noting nothing implements it.

`ts-json-base` is a **stable, non-active-development** surface, so additive-only is mandatory
here; the capability shape satisfies that, widening the core interfaces would not.

**On the U+FFFD sharp edge: Ask 1 subsumes your option 1.** Once `getRawBytes` exists, a
strict read is `new TextDecoder('utf-8', { fatal: true }).decode(bytes)` — you have it without
new API. So we'll do **Ask 1 + your option 3** (the docstring note on the text accessors,
pointing at the bytes pair) and treat `getRawContentsStrict` and the `strictTextDecoding` init
flag as sugar we can add later **if you tell us you want them**. Say so if you do.

Zip (Ask 2) lands the same way: `createZipFromFiles` accepting
`{ path, contents: string | Uint8Array }` beside the existing text writer, and a
byte-returning entry read beside the text one.

---

## 3. Record index seam — accepted, but split, and smaller than you think

**Three of the four things you asked for already exist.** Please re-scope on this:

- **`IMemoryIndex` exists.** `MemoryIndex implements IMemoryIndex`, and
  `temporalRetrievers.ts` already takes it as an injected dependency. "There is no
  `IMemoryIndex` interface and no injection point" is half wrong.
- **Incremental maintenance exists.** The interface has `patch(op, entry)` — *"Apply a single
  incremental change. `'put'` inserts or replaces … `'delete'` removes"* — and the store's own
  class doc says the index is *"a derived in-memory view patched on every write."* Writes do
  not degenerate into full rebuilds today.
- **The per-record content hash exists.** `IMemoryEnvelope.contentHash` (CRC32 over
  `{kind, body, links}`) is stamped on every write and is one of the immutable identity
  fields. Your staleness-detection primitive is already there.
- The store *internally* already types the index as `IMemoryIndex` (`params.index`,
  `this._index = params.index`); `create()` just hardcodes `MemoryIndex.create()` into those
  internal params.

**But the seam alone buys you nothing for the ceiling you actually care about.** You were
explicit that boot latency is secondary and *"resident memory is the thing only this fixes."*
That cannot be delivered behind the current interface: `IMemoryIndex`'s read surface returns
full records **by construction** — `entries()` yields `IIndexedMemoryRecord` (scope + record),
and `byKind`/`byTag`/`byRecency`/`byRank` all return `IMemoryRecord<unknown>`, i.e.
`{envelope, body}`. A persisted implementation behind that contract must materialise every
body to satisfy its own signature. You'd move the storage and keep the ceiling.

Note *why* `IVectorIndex` works as your precedent: it returns **hits** (`target` + `score`),
not records — the caller re-resolves. The record index needs the same discipline: return
addresses and metadata, with a separate body fetch. That's a change to the **return types of a
shipped interface** — breaking, not additive. Permitted (`ts-agent-memory` is active
development) but it must be a deliberate design decision, not a side effect of "add a seam."

**So we're splitting it:**

1. **Injection point** — expose `index?: IMemoryIndex` on the public create params, defaulting
   to the current implementation. Small, additive, ships independently. Lets you experiment
   with an alternative index without forking the store.
2. **Partial-read redesign** — the one that actually fixes resident memory. Design-first: what
   the index returns, how `linkedFrom` / `byRank` work without bodies, the body-fetch
   contract, and how reconcile/validate uses the existing `contentHash`.

**Your concurrency flag is honoured.** The store currently serialises writes through a
**per-instance** async write-lock — exactly the single-writer assumption you named. We agree a
persisted index with transactions is where cross-process coordination would live, and the
design pass will be required not to foreclose it. We're not solving it now.

---

## 4. Provenance query axis — your option 1, sharpened

**Your preference is right, and it's cheaper than you think — with one trap.**

`derivedFrom` is already an `IEdgeTarget`, the identical type as `IEdge.target`; its own
docstring calls it *"the cross-kind provenance spine."* The backlink index is
`Map<targetKey, Map<sourceKey, IEdgeTarget>>`, built in `_add(entry)` from `envelope.links`,
and `patch` already drops prior associations so a changed record can't strand stale
references. Registering `derivedFrom` as a backlink is a few lines; the keying, incremental
invalidation, and `backlinks()` read surface all exist and are already correct.

**The trap: `backlinks()` discards edge type.** It returns a flat
`ReadonlyArray<IEdgeTarget>` with no discrimination. Fold `derivedFrom` into that same map and
every existing caller of `linkedFrom` silently gets a larger reachable set —
`LinkTraversalRetriever` does bounded BFS over backlinks, so provenance derivations would
start surfacing as semantic relationships in traversals that never saw them. A behavioural
break dressed as an additive change, and no type error catches it.

The underlying defect is that **`IEdge` already carries a `type` (`LinkType`) and the backlink
index throws it away** — a lossy projection of data the store already holds correctly.

**So: make the backlink index type-discriminated, and project `derivedFrom` under a reserved
link type.** One change that serves retraction, serves the "what did this record contribute
to" question you haven't formally asked, keeps semantic and provenance traversal
distinguishable, and — notably — is what makes your flagged-but-unasked orphan query
(*"records with no inbound edges"*) **well-posed**. Asked against an undiscriminated index it
returns the wrong answer, because a record whose only inbound arrow is a provenance derivation
is arguably still an orphan. Breaking on `backlinks()`'s return type; permitted on this
surface.

Your instinct that option 2 is "option 1 asked for twice" is correct, and we agree — we're not
adding a `derivedFrom` filter to `IMemoryStoreListFilter` (confirmed today as exactly
`scope | kind | tag | asOf`).

**Sequencing note:** this and ask 3 both rewrite `MemoryIndex`, and the partial-read design
determines what a type-discriminated backlink read should *return* (addresses vs records).
They will be one sequenced piece of work, not two parallel ones.

---

## 5. Result-returning fetch primitive — accepted, design-first

**Your premise holds completely.** Verified: `fetchJson` appears **zero** times in
`etc/ts-extras.api.md` (genuinely `@internal`, unexported); there are exactly four bare
`fetch(` sites in `ts-extras/src`, matching your inventory; and no generic helper with
timeout / size-cap / allowlist exists anywhere. Your read that prying open the provider
transport would make the AI path worse is right — it's bearer-auth plus model-specific error
mapping, not a client.

**Three findings, one of which is a hole in the ask as written.**

**The redirect policy and the SSRF guard are the same feature, not two bullets.** A guard that
validates only the initial URL is worthless: a `302` to `http://169.254.169.254/latest/meta-data/`
or to `127.0.0.1` defeats it entirely. Closing it requires `redirect: 'manual'` and
re-validating **every hop**. Your list treats these as independent items, which is exactly how
this ships with the guard apparently present and the protection absent.

**The SSRF guard cannot exist in the browser.** No DNS resolution, no view of the resolved IP,
no reliable interposition on redirect hops; the actual control there is CORS and network
position. So this splits along the repo's existing cross-runtime pattern: a runtime-agnostic
core (timeout, size cap, content-type dispatch, structured failure taxonomy, retry), a **Node**
implementation that adds the allowlist / private-IP guard, and a **browser** implementation
that documents that it cannot offer one. A single primitive implying uniform guarantees would
give you a false sense of protection on the browser side — worse than knowing you have none.

**DNS rebinding is the residual hole even in Node, and will be documented rather than
implied.** Validating a resolved IP then calling `fetch(url)` re-resolves; hostile DNS can
return a public address for the check and a private one for the connection. Fully closing it
means resolving once and connecting to the pinned IP with a `Host` override. That may be more
than you want to buy — tell us — but it will be a **stated limit**, not an unstated
assumption. A primitive that advertises a guarantee it doesn't have is worse than five lines
at a call site, because it transfers responsibility without transferring protection.

Smaller: the size cap must stream via `response.body.getReader()` and count as it reads,
treating `Content-Length` as a fast-reject path only (absent on chunked, and it lies when
hostile) — your "during read rather than after" instinct is right. And the structured-failure
ask fits existing idiom; the discriminated `found`/`unclosed`/`none` shape in `jsonResponse.ts`
is the local precedent for a failure-reason union.

**Framing correction:** this is *not* a "Result-integration boundary" package in our sense.
Those wrap a well-maintained upstream and add **no opinion**. This one is all opinion —
timeout defaults, redirect policy, SSRF posture — and that's the point. It'll be scoped as a
first-class primitive with an explicit threat model, not forced into the thin-wrapper mould.

---

## Open questions we need from you

1. **Self-describing hits (ask 1).** Do you want an explicit fragment-vs-record discriminant
   on `IVectorQueryHit`, or is "you know which index you queried" sufficient? We think
   sufficient; it's a small design either way, and cheaper to decide now.
2. **Strict text decoding (ask 2).** Do you want `getRawContentsStrict` and/or the
   `strictTextDecoding` init flag, or is bytes-plus-docstring enough? We'd default to enough.
3. **DNS-rebinding closure (ask 5).** Is pinned-IP connection worth the complexity for your
   URL-ingestion threat model, or is a documented limit acceptable?
4. **Ask 3 priority.** The injection point is days; the partial-read redesign is a design
   cycle. Do you want the injection point early as an experimentation seam, or is it not worth
   shipping on its own ahead of the redesign?

## Sequencing

- Asks 3 + 4 are **one sequenced `ts-agent-memory` work item**, design-first (they both
  rewrite `MemoryIndex`).
- Ask 1 is independent and can start now.
- Ask 2 spans three packages (`ts-json-base`, `ts-extras`, `ts-web-extras`) — one stream, all
  shipping in the same lockstep alpha.
- Ask 5 is greenfield and security-sensitive: threat model written and reviewed before
  implementation.

Nothing in this batch blocks you, and nothing blocks our pending publish.

---

# RESOLVED — consumer answers received 2026-07-31

All four open questions answered; the batch is settled and commissioned. Recorded here so
the durable record is the agreement, not the intermediate draft.

## Their corrections to us, accepted

**Our "neither field is a discriminant" phrasing was too strong, and we're fixing it.** True
of each field *alone*; false of the pair — under the at-least-one invariant, neither-present
necessarily means a record hit and either-present necessarily means a fragment hit, so the
disjunction *does* discriminate.

They asked us **not** to document the disjunction as supported (it couples callers to an
invariant enforced at a different boundary, so it fails silently if that invariant is ever
relaxed), but to say **"no *single* field discriminates"** rather than a flat denial. Their
reasoning, which we're adopting verbatim as the standard: *"A reader who works out the
disjunction and finds the docs denying it trusts the docs less, not more."* Docs must not be
*conveniently* wrong.

## Q1 — self-describing hits: **not needed**

"We query the index we chose." No new discriminant field. Docstring wording per above;
fragment-ness is determined by which index produced the hit.

## Q2 — strict decoding: **bytes + docstring is enough**, with a structural reason we hadn't stated

Their argument is better than ours: strict decoding is only meaningful **where a byte layer
exists**. A localStorage tree storing strings natively never had invalid UTF-8 to detect,
because nothing decoded. So `getRawContentsStrict` on the *core* interface would be a method
that cannot mean anything on some implementations — the capability shape puts it where it
belongs. This is independent confirmation that the capability-interface design is right.

**One concrete ask adopted:** put the *recipe* in the docstring —
`new TextDecoder('utf-8', { fatal: true }).decode(bytes)` — not merely a pointer at the bytes
pair. Their failure mode was never "couldn't find the method"; it was that **nothing told them
a detour was required**.

## Q3 — DNS rebinding: **documented limit accepted, but the API must keep pinning additive**

Not a preference — a **condition**. Today the hub is single-tenant self-hosted: whoever
submits a URL operates the machine, so SSRF buys access to a host they already control. The
moment it is hosted multi-tenant, **the rebinding attacker and the basic-SSRF attacker are the
same person** — whoever submits a URL controls its DNS. A first-hop-only guard then stops the
accidental case and not the deliberate one, which is the population it exists for.

Binding consequences for the design:

1. Stated limit now — no pinning built on their account.
2. **Keep pinning addable without a breaking change**: the guard must be an **option or a
   swappable resolver on the params**, not baked into the call.
3. Doc placement: *"does not stop DNS rebinding"* sits in the **same paragraph** as *"blocks
   private-IP targets"* — not in a separate caveats section.

## Q4 — injection point early, as an **instrumentation** seam (not experimentation)

Our own analysis killed the experimentation rationale and they accepted it: behind the current
return types any injected index still materialises every body, so it cannot be used to
experiment with the ceiling they care about.

Its real value is **measurement**: wrapping the shipped `MemoryIndex` in a counting/timing
decorator yields resident bytes by kind, open cost against vault size, and where the curve
actually bends. Their words: *"We've been asserting 'won't scale past thousands' without
measuring it once, which is a weak input to a design cycle whose output is a breaking change
to a shipped interface."* Ship it early so the redesign runs on numbers.

**This reframes the sequencing:** the injection point is no longer a nice-to-have ahead of the
redesign — it is the redesign's **input**.

## Ask 4 — the trap is concrete, not hypothetical

Undiscriminated `backlinks()` widens `LinkTraversalRetriever`'s BFS, and **traversal feeds
recall** — so every ingested document would pull its own derived claims into contexts that
asked only for semantically linked memory. It **scales with success**: better extraction →
more derived records per document → more noise per traversal. They want the type-discriminated
index and accept the break on `backlinks()`.

And our orphan-query point was why they flagged it as not-asking-yet: a record whose only
inbound arrow is provenance is arguably still an orphan, and that ambiguity is what stopped
them stating the query. Discriminating dissolves it.

## Ask 2 — `httpTreeAccessors` has a real consumer

Not URL ingestion (that's the fetch primitive's job; a read-only tree over a fixed `baseUrl`
is the wrong shape for untrusted URLs). It's a **hosted built-in corpus for agent creation** —
a fixed-baseUrl read-only tree, where bytes are the natural form. So the adapter we flagged as
the one they'd missed is in fact the one with a named use case.

## Commissioned

| Work | Status |
|---|---|
| `agent-memory-fragment-id` (ask 1) | 🔵 in flight |
| `agent-memory-index-injection-seam` (ask 3, part 1) | 🔵 in flight |
| Backlink type-discrimination + partial-read redesign (asks 3+4) | ⏸️ design-first, gated on the injection seam's measurements |
| FileTree bytes capability (ask 2) | 🟢 ready to commission |
| Fetch primitive (ask 5) | 🟢 ready, threat-model first |

---

# CORRECTION — we were wrong about `httpTreeAccessors` (2026-07-31, later)

Surfaced by the implementing agent on the bytes stream (PR #586) and verified against
`origin/release` before accepting it. **This corrects something we told you**, so it goes back
rather than being quietly dropped.

## What we said

In "2. FileTree — a bytes path" we listed `httpTreeAccessors` as the adapter you'd missed and
justified it this way:

> The HTTP one is the most interesting for you: bytes are *more* natural there than text
> (`response.arrayBuffer()`), and it's a plausible path for document ingestion.

## What is actually true

Two things make that wrong as written:

1. **`HttpTreeAccessors` is not a lazy fetch-per-file tree.** It preloads the whole tree in
   `fromHttp()` from a JSON REST API whose file response is
   `{ path: string, contents: string, contentType?: string }` — `contents` is typed `string`.
   It is a storage-service client, not a byte transport.
2. **The entire `IFileTreeAccessors` read surface is synchronous** — `Result<T>`, not
   `Promise<Result<T>>`. So `response.arrayBuffer()` can never be called from inside
   `getFileBytes` on this class, regardless of what the wire format is. Making it byte-native
   on the wire is a wire-format change plus an async-surface change, not an adapter tweak.

## What this does and does not change

**Does not change:** your hosted-built-in-corpus use case is still served. The adapter
implements the byte read (via the inherited in-memory path), so a caller can ask a hosted
corpus tree for bytes and get them.

**Does change:** the *justification* we gave. Bytes are not "more natural" in this adapter as
written — they are a decode of text that arrived as text. If your corpus contains genuinely
binary artifacts (images, PDFs, anything non-UTF-8), this adapter is **not** currently a safe
path for them, because the bytes it returns are a UTF-8 encode of an already-decoded string.
Text corpora are fine.

**Tell us if you need binary-safe hosted corpus content.** That is a real piece of work — a
wire-format change on the HTTP storage protocol and an async seam on the read surface — and we
would want it scoped deliberately rather than assumed to have shipped with this stream. We are
not doing it speculatively.

## Also: one name changed from what we wrote

We said the guards would be `isBinaryCapableAccessors` and item-level equivalents. They
shipped as **`isBinaryAccessors`** / `isMutableBinaryAccessors` / `isBinaryFileItem` /
`isMutableBinaryFileItem`, matching the packlet's existing guard idiom (`isMutableAccessors`,
`isPersistentAccessors`). The interfaces are as described: `IBinaryFileTreeAccessors`
(`getFileBytes`), `IMutableBinaryFileTreeAccessors` (`saveFileBytes`),
`IBinaryFileTreeFileItem` (`getRawBytes`), `IMutableBinaryFileTreeFileItem` (`setRawBytes`).

**Byte read ships on all six adapters; byte *write* ships on Node fs only.** Five of the six
extend the in-memory accessors and persist text, so a byte write through them would be lossy
on non-UTF-8 or would silently never persist. Deferred deliberately: FSA byte write,
localStorage base64 (would change an on-disk format deployments already hold), HTTP binary
transport, and binary directory items.
