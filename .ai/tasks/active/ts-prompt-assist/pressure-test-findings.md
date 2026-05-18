# ts-prompt-assist v0.1 — consumer pressure-test findings

**Context:** internal consumer-port pressure-test on
`samples/ai-image-gen-sample`. The integration replaces a hardcoded
system-prompt string in the chat path with a `PromptLibrary.resolve`
call, and adds a `tone` qualifier-conditional candidate (base → formal)
wired to a UI toggle. Findings logged in-flight as friction was
encountered, not post-hoc.

The integration itself is small; the value is the friction list below.

---

## F1. `PromptLibrary.create` requires both `qualifiers` decls AND `qualifierTypes` — and the failure mode is silent in the type system

**Surface:** `IPromptLibraryCreateParams` / the decl-array branch of `qualifiers`.

**Friction:** the README's "Quick start — in-memory fixture" example
builds a `QualifierCollector` end-to-end (10+ lines) to wire up a single
qualifier. The shorter `qualifiers: IQualifierDecl[]` overload is
documented but the cardinality of the requirement is buried: if you
pass decls without `qualifierTypes`, you get a runtime failure even
though the type system accepts the call. For a consumer that just wants
"one tone qualifier", the minimum viable wiring is still:
```ts
const types = QualifierTypes.QualifierTypeCollector.create({
  qualifierTypes: [QualifierTypes.LiteralQualifierType.create({ name: 'tone' }).orThrow()]
}).orThrow();
const qualifiers = Qualifiers.QualifierCollector.create({
  qualifierTypes: types,
  qualifiers: [{ name: 'tone', typeName: 'tone', defaultPriority: 500 }]
}).orThrow();
```
…which is four `orThrow`s and a double-naming dance (`name: 'tone'` /
`typeName: 'tone'`) for the simplest possible case. The library accepts
both pre-built collectors and decls, but neither variant is concise.

**Workaround used:** copied the README pattern verbatim.

**Severity:** P2 friction.

**Suggested fix:** ship a `Qualifiers.simpleLiteral({ name, priority? })`
helper (or a `PromptLibrary.create` convenience that takes an array of
literal qualifier names) so the trivial case is one line. Most chat
consumers will start with one or two literal axes.

---

## F2. The `chain: ScopeKey[]` argument repeats the same value on every call

**Surface:** `IPromptResolveRequest.chain`.

**Friction:** every `resolve` call from the chat path passes
`chain: [GLOBAL_SCOPE]` — the chain is a property of the consumer's
deployment topology, not the per-request context. In the app shell the
same chain is rebuilt on every `handleSendChat` call. A request-level
default (or library-level binding of "default chain") would let
consumers ergonomically express "this scope chain is constant for this
runtime."

**Workaround used:** captured `[SCOPE]` in a module-level `const`.

**Severity:** P3 polish.

**Suggested fix:** allow `PromptLibrary.create` to accept a
`defaultChain` that `resolve` falls back to when `chain` is omitted —
e.g. `library.resolve({ id, qualifiers })`.

---

## F3. No `Convert.qualifierContext` / strongly typed qualifier-context builder

**Surface:** `IPromptResolveRequest.qualifiers: IQualifierContext`.

**Friction:** the request takes `qualifiers: { [axis: string]: string }`
(via `IQualifierContext` from ts-res). There is no compile-time tie
between the qualifier names declared on the library and the keys allowed
in the request. A typo (`tonr: 'formal'`) silently does the wrong thing
— ts-res's candidate selector treats the unknown axis as "no value"
and falls through to the base candidate. We caught this once while
iterating.

**Workaround used:** named the axis with a module-level `const TONE_AXIS = 'tone'`
and used it on both the decl and request side.

**Severity:** P2 friction.

**Suggested fix:** parameterise `PromptLibrary<TResponse, TAxes>` on a
string-union of qualifier names so request `qualifiers` becomes
`Partial<Record<TAxes, string>>`. The type parameter could be inferred
from the decls passed to `create()`. Alternatively, surface a typed
`makeContext({ tone: 'formal' })` helper bound to a specific library.

---

## F4. Branded ids force five `Convert.<id>.convert(...).orThrow()` calls in setup

**Surface:** `Convert.scopeKey` / `Convert.promptId` / `Convert.slotName`.

**Friction:** the README shows the pattern; in practice every consumer
file that authors fixture data, names a prompt id, or refers to a scope
ends up with a block like:
```ts
const SCOPE = Convert.scopeKey.convert('global').orThrow();
const PROMPT_ID = Convert.promptId.convert('chat-system-prompt').orThrow();
```
The `Convert.*.convert(...).orThrow()` shape is verbose for what is
fundamentally a literal-string brand. Compared to ts-utils-style
template-literal brands (where a literal `'global'` could be branded by
TS itself via a tagged template tag function or a `as const`-friendly
brand factory), this is six tokens per branded literal.

**Workaround used:** centralised in `promptLibrary.ts` module scope so
the verbosity hits once per consumer file, not per call site.

**Severity:** P3 polish.

**Suggested fix:** offer a compile-time-only `brand` helper for
known-static literals — e.g. `Convert.promptId.literal('chat-system-prompt')`
or a tagged template `promptId\`chat-system-prompt\`` — that returns the
branded type without going through `Result` for known-good string
literals. Runtime validation is genuinely needed for user/file-provided
ids, but module-level constants are not user input.

---

## F5. ~~`PromptLibrary.resolve` returns `Promise<Result<IResolvedPrompt>>` — three layers a consumer has to peel~~ **RETRACTED on review**

**Surface:** `PromptLibrary.resolve`.

**Original framing:** the return is `Promise<Result<IResolvedPrompt>>`, so
a consumer that wants "just the body" has to peel three layers
(Promise → Result → `.body`) before the string lands.

**Why retracted:** the ts-utils async-chaining surface
(`.thenOnSuccess` / `.thenOnFailure`, which bridge `Result<T>` into a
fluent `AsyncResult<T>` that can be `await`ed directly) plus the plain
`.onSuccess(r => succeed(r.body))` shape after an `await` make this a
non-issue in practice. My own integration uses exactly that pattern in
`promptLibrary.ts:resolveSystemPrompt` and it reads cleanly — one
`await`, one `.onSuccess`, one `succeed`. The "three layers" framing
was a paper complaint that didn't survive looking at the code I
actually wrote. The async-chaining helpers are exactly the right
ergonomics for this case.

**Severity:** retracted (was P3 polish).

**Note:** the original "convenience `resolveBody()` shorthand"
suggestion is a small marginal-win at best and not worth the surface
expansion — the library's diagnostic story leans on the full
`IResolvedPrompt` (trace + descriptor + id), and shaving off
`.onSuccess(r => succeed(r.body))` doesn't justify another public
method.

---

## F6. `PromptStoreFixture.build` is async — but the seed is synchronous in-memory data

**Surface:** `PromptStoreFixture.build(seed)`.

**Friction:** the seed is a plain object literal; nothing in its
construction is async. But `PromptStoreFixture.build` returns
`Promise<Result<...>>`, which forces the whole library-construction
chain to be async. A React `useMemo` that needs to produce a synchronous
value can't await; consumers end up reaching for `useEffect` + a
state machine, or a top-of-module IIFE, just to construct a library
from synchronous data.

In this integration we walked into exactly that and worked around it
with a module-level `let library: PromptLibrary | undefined` + a one-shot
async initialiser called from `useEffect` (rendering a "loading…" state
until the library lands). For a sample with no real async I/O this is
ceremony.

**Workaround used:** module-level `let library` + `useEffect`
initialiser + a `null` body-string fallback that short-circuits the
chat send until the library is ready.

**Severity:** P2 friction.

**Suggested fix:** offer a `PromptStoreFixture.buildSync(seed)` for the
common case where the seed is synchronous in-memory data. The async
path is justified for file-tree backends; the fixture path is not. If
the descriptor-load Result-chain genuinely runs sync, this is a pure
type-signature change.

---

## F7. `IResolvedPrompt.trace` is rich but not easy to feed straight to a logger

**Surface:** `IPromptResolveTrace`.

**Friction:** the trace has nested arrays of candidate matches, merged
bindings (a `Map<SlotName, ...>`), resource-binding inner traces, and
safeguard findings. Logging it via `console.log(JSON.stringify(trace))`
fails on the `Map`. A `trace.toJSON()` or a published
`Trace.toLoggable(trace)` helper would let consumers drop the trace
straight into a structured logger. We didn't actually hit this in the
hot path (we didn't log the trace), but the moment a consumer wants to
trace-log a failure, they'll hit it.

**Workaround used:** none — surfaced, not blocked.

**Severity:** P3 polish.

**Suggested fix:** publish `Trace.toLoggable(trace)` that converts
`Map`s to plain `Record`s. Or implement `toJSON()` on the trace's
returned object so `JSON.stringify` works out-of-the-box.

---

## F8. Library construction does not surface a `library.warmUp(prompts)` for known-static prompt ids

**Surface:** `PromptLibrary.create` lifecycle.

**Friction:** the library materialises a prompt into ts-res on first
`resolve`. For a chat app that always resolves the same system prompt,
this means the very first message of a session takes the materialisation
cost. A `warmUp(['chat-system-prompt'])` convenience would let consumers
front-load this at startup.

We didn't measure the cost (likely small) but it's a friction a
chat-app consumer will think about.

**Workaround used:** none — surfaced.

**Severity:** P3 polish (perf).

**Suggested fix:** add `library.warmUp(ids: PromptId[]): Promise<Result<true>>`
that materialises each id under the default chain.

---

## F9. README "Quick start — in-memory fixture" sets up `tone: 'formal'` but doesn't demonstrate the React-app pattern

**Surface:** README docs.

**Friction:** the quick-start example is great for understanding the
API but it doesn't address how a React/web-app consumer should
construct the library (where to put `PromptLibrary.create`, how to
handle the async + Result, how to gate the UI until ready). Every web
consumer will redo this work.

**Workaround used:** copied + adapted from the quick-start.

**Severity:** P3 polish (doc gap, not API gap).

**Suggested fix:** add a "Wiring into a React app" mini-section that
sketches the `useEffect`-initialiser pattern (or, ideally, after F6 lands,
the synchronous-fixture pattern). Five lines of code, big consumer
ergonomics win.

---

## F10. ~~No "default qualifier context" — every `resolve` must supply `qualifiers: {}` even when the prompt has no qualified candidates~~ **RETRACTED on review**

**Surface:** `IPromptResolveRequest.qualifiers`.

**Original framing:** `qualifiers` is required even for descriptors
that only have an unconditional base candidate, so the trivial resolve
is `library.resolve({ id, chain: [SCOPE], qualifiers: {} })` — ~50%
boilerplate.

**Why retracted:** "no qualifiers" isn't the dominant case in the real
world. A consumer who adopts a library specifically built around
qualifier-conditional candidate selection is almost certainly going to
use qualifiers — `{}` is the pressure-test artefact of "we have one
toy axis", not a shape worth optimising for. The trivial-resolve win
isn't worth a default that nudges consumers away from supplying real
context.

`chain` is the better optionality target — it really is constant per
deployment topology in many cases — and F2 already covers that. The
fix proposed in F10 (make `qualifiers` optional defaulting to `{}`)
would weaken the API's "you must commit to a context" affordance for
marginal call-site savings.

**Severity:** retracted (was P3 polish).

**Note:** F2's `defaultChain` suggestion stands on its own. If
`defaultChain` lands, the dominant-case API becomes
`library.resolve({ id, qualifiers: {...} })` which is the right shape —
the consumer is forced to think about the qualifier context (the
interesting axis) but not the chain (the boring axis).

---

## F11. ~~`Logging.NoOpLogger` is the default but the library param is `Logging.ILogger` from `@fgv/ts-utils` — not re-exported~~ **RETRACTED on review**

**Surface:** `IPromptLibraryCreateParams.logger`.

**Original framing:** consumers who want to wire a logger have to
import `Logging` from `@fgv/ts-utils` directly because
`ts-prompt-assist` doesn't re-export it.

**Why retracted:** wrong on two counts. (a) The fgv convention is the
opposite of what I suggested — packages do not re-export from sibling
packages; consumers import primitives from their source library. The
"re-export for convenience" reflex is a habit from less-structured
ecosystems and doesn't apply here. (b) "Didn't wire a logger" was a
lazy workaround, not a real friction — adding
`import { Logging } from '@fgv/ts-utils'` is one line. The pressure-test
integration didn't need a custom logger; if it had, the import would
have been trivial.

The real "I didn't know `@fgv/ts-utils` had a logging packlet"
discoverability concern, if it exists, is a `LIBRARY_CAPABILITIES.md`
question, not a re-export question.

**Severity:** retracted (was P3 polish).

---

## F13. `Result.Failure<T>` is invariant in `T` — `if (storeResult.isFailure()) return storeResult;` doesn't compile when the outer Result has a different success type

**Surface:** `@fgv/ts-utils` `Result<T>` (consumed via ts-prompt-assist).

**Friction:** the canonical Result early-return pattern:
```ts
const storeResult = await PromptStoreFixture.build(seed);
if (storeResult.isFailure()) {
  return storeResult;  // <-- TS error: Failure<IPromptStore> not assignable to Result<PromptLibrary>
}
return PromptLibrary.create({ store: storeResult.value, ... });
```
fails TS because `Failure<IPromptStore>` is not assignable to
`Result<PromptLibrary>`. The Failure variant only carries a string
message — it has no `T`-shaped data — so this is a soundness-vs-ergonomics
trade-off in ts-utils, not specific to ts-prompt-assist. But every
consumer who composes two fallible async ops in sequence will hit it.

The Result-pattern doc says to use `.thenOnSuccess` for async chains
(which doesn't have this problem); we tried that and the resulting
type is `AsyncResult<PromptLibrary>` which is also not directly
assignable to a `Promise<Result<PromptLibrary>>` return without an
extra step. The least-bad path was to re-fail explicitly:
```ts
return fail(storeResult.message);
```

**Workaround used:** `return fail(storeResult.message)`.

**Severity:** P2 friction (ts-utils API, surfaced via ts-prompt-assist).

**Suggested fix:** either (a) widen `Failure<T>`'s declared `T` to `unknown`
on `isFailure()`'s narrowing so the early-return assigns to any
`Result<U>`, or (b) publish a `Result.recast<U>()` helper for the
common "I want to propagate this failure under a different success
type" pattern. This is a ts-utils finding triggered by ts-prompt-assist
usage; logging it here so the orchestrator can route it.

---

## F14. `IQualifierContext` is `Readonly<Record<string, string>>` — TS object-literal narrowing rejects optional keys

**Surface:** `IPromptResolveRequest.qualifiers: IQualifierContext`
(from `@fgv/ts-res`).

**Friction:** a natural shape for a UI-driven qualifier context is:
```ts
const qualifierContext = tone === 'formal' ? { tone: 'formal' } : {};
```
TS infers this as `{ tone: string } | { tone?: undefined }`, which does
NOT assign to `Readonly<Record<string, string>>` because the
empty-object branch fails the index-signature check (`undefined` is not
`string`). The fix is to widen the type explicitly:
```ts
const ctx: Readonly<Record<string, string>> =
  tone === 'formal' ? { tone: 'formal' } : {};
```
A first-time consumer will paper over this with `as unknown as
IQualifierContext`, which is the wrong reflex.

**Workaround used:** explicit annotation.

**Severity:** P3 polish (TS ergonomics, ts-res surface).

**Suggested fix:** consider `IQualifierContext = Readonly<Partial<Record<string, string>>>`.
That would let `{}` and `{ tone: 'formal' }` both assign cleanly.
Semantically equivalent — the candidate selector treats missing keys
and explicit-undefined the same way.

---

## F12. `IPromptStoreFixtureSeed.records[].descriptor.id` vs the outer `records[].id` is a redundancy

**Surface:** `IPromptStoreFixtureSeed`.

**Friction:** the fixture record requires both an outer `id` and a
nested `descriptor.id` — they must match (the loader will reject a
mismatch). Authoring is fragile: a copy-paste of a record will easily
desynchronise them. The outer `id` keys the storage layout (filename
stem in on-disk YAML); the descriptor's `id` is part of the descriptor
shape. But for the fixture path there is no filename; the outer `id`
is redundant.

**Workaround used:** wrote both.

**Severity:** P2 friction.

**Suggested fix:** in the fixture seed schema, make `descriptor.id`
optional and default it from the outer `id`. The on-disk-YAML schema
can keep its current shape (the filename-stem check is real there).

---
