# prompt-composition-metadata — what a rendered template and a resolved prompt are made of

**Status**: ✅ shipped 2026-09-02 via [#663](https://github.com/ErikFortune/fgv/pull/663) (stacked
on #661, same pattern as #662).

## Summary

The question was the user's, not a consumer's, and it was asked as exploration: *what would it look
like to produce a metadata object alongside each generated prompt, indicating the order and
absolute size of each section that makes up the prompt?* The answer turned out to need a primitive
one layer down, so it shipped as two surfaces in one change.

**`@fgv/ts-extras` — `MustacheTemplate.renderWithSegments(context)`** returns the same `text`
`render()` produces plus `segments`: a document-ordered, contiguous, gapless attribution of every
code unit to either literal template text or a named interpolation.

**`@fgv/ts-prompt-assist` — opt-in `IPromptComposition` on `PromptLibrary.resolve`.** Pass
`composition` on the request; the result carries `totalChars` plus ordered sections for the
anti-jailbreak preface, literal template text, and each slot — each slot section carrying the
winning binding's `source`, `directive`, `wasEnforced` and `winningScope`.

## The load-bearing decision: offsets are computed, never searched

The obvious implementation renders the prompt and then recovers each section's offset by searching
the finished text for the value that was substituted. It is a few lines, it needs no new primitive,
and it is wrong in four distinct ways:

| case | what searching reports |
|---|---|
| a value used twice | the first occurrence, for both |
| a value that is a substring of the literal text — `the {{w}} the`, `w: 'the'` | offset 0; the substitution is at 4 |
| a value that renders empty | nothing to search for at all |
| a value escaping alters — `<b>&</b>` → 29 escaped chars | the input appears nowhere in the output |

Each is now a test. What makes this worth a primitive rather than a caveat is that the failure is
**silent**: it returns plausible offsets, and a diagnostic that lies plausibly is worse than no
diagnostic. Computing the offsets during the render is the only sound way, and doing it inside
`MustacheTemplate` — which owns the token list — is the only place it can be done.

This is also the reason the work did not stay inside `ts-prompt-assist`. Per
`CODING_STANDARDS.md` § *Extending Core Libraries Over Working Around Them*: the consumer hitting a
limitation in a sibling `@fgv/*` library extends the sibling. `renderWithSegments` is purely
additive; `render()` is untouched.

## What the self-check caught — and why the first fix was a shortcut

`renderWithSegments` compares its accumulated text against `render()` before returning. That was
written as a belt-and-braces invariant, expected to be unreachable.

It was not. The first implementation rendered each interpolation by slicing the raw template and
handing the slice back to the writer — which **re-parses it with the default delimiters**. A
**set-delimiter tag** changes the delimiters for every tag that follows it, so
`A{{=<% %>=}}<%v%>B` renders `AXB` but was being mapped as `A<%v%>B`. The check caught it.

**The first response to that was to refuse such templates, and that was the shortcut.** It was
filed alongside the refusal of sections, inverted sections and partials, as though the four were
alike. They are not:

| construct | why it is refused |
|---|---|
| section / inverted section / partial | **no correct answer exists** — a section may repeat its body or omit it, so the output is not a linear image of the token order |
| set-delimiter | there *is* a correct answer; the implementation could not compute it |

Refusing a case with a well-defined answer because of how one chose to render is a property of the
implementation dressed up as a property of the problem. The fix removes the cause instead:

**Each interpolation is now rendered from its already-parsed token**, via `Writer.escapedValue` /
`Writer.unescapedValue` — the same primitives `render()` reaches through `renderTokens`. Delimiters
are a *parse-time* concern, so once a token exists, what the delimiters were is invisible. The
whole hazard class disappears rather than being documented.

It also stops reimplementing value semantics. Dotted paths, lambdas, `null`/`undefined` rendering
empty, and non-string coercion are now mustache.js's behaviour by delegation rather than by care —
verified across eleven shapes against `render()` before the change was written.

One typings wrinkle, handled without a cast: `@types/mustache` declares both primitives'
`token` parameter as `string[]`, while a parsed span carries its source offsets as numbers. Since
both read only `token[1]`, the helper builds the `[type, name]` pair they actually read. The repo
forbids casting around the type system; constructing the value the callee needs is not a cast.

**And then the check itself had to go, for the same reason.** It was kept at first behind the
stream's only `c8 ignore`, on the argument that it was now unreachable. A `code-reviewer` pass
disproved that with a probe: the check costs a **second full render**, and mustache's
`Context.lookup` invokes a function-valued lookup afresh every time — so

| | `render()` | `renderWithSegments` (with the check) |
|---|---|---|
| lambda invocations | 1 | **2** |
| lambda that answers differently per call | renders | **fails** |

A caller cannot be asked to make its context idempotent in order to use a diagnostic, and a
template `render()` handles must not fail here. So the branch was reachable from ordinary
documented input, the `c8 ignore`'s stated rationale was false, and paying for the check was itself
the cause of the bug. **Removed.** The concatenation identity is asserted across every shape in the
test suite instead, where a second render costs nobody anything — and the package now carries **no
coverage directive at all**.

Worth noting how thin the margin was: the check had genuinely earned its keep by catching the
slice-and-reparse defect, which is exactly the argument that nearly kept a real bug in the tree. A
thing that has proved useful once is not thereby correct.

The general form: *an invariant check you expected to be unreachable is worth probing before you
ignore it* — and *when you find yourself defending a mechanism by what it once caught, price what
it costs now.*

## Coverage: three branches, three different right answers

None of the three initially-uncovered branches wanted a directive, and they wanted three different
things — which is the argument for asking "should this branch exist?" before asking "how do I cover
it?", per `TESTING_GUIDELINES.md` § *Coverage Gap Resolution*.

- **`sec.measured ?? 0`** — genuinely dead. When a measure is supplied, every section has one; the
  fallback existed only because the total was summed after the fact. **Removed** by accumulating as
  sections are built.
- **`entry === undefined`** on the slot lookup — looked unreachable (every declared slot gets a
  `merged` entry, including optional unbound ones, and `validateAndRender` fails the resolve for any
  template variable absent from the context). Two candidate probes were wrong before the third was
  right: a dotted path (`{{{topic.length}}}`) is rejected because `_lookupPath` refuses to descend
  through a primitive; `{{{.}}}` interpolates the whole render context, is never a declared slot,
  and no scanner rejects it. **Reachable, and now tested.**
- **`winningScope === undefined`** — needed a scope-supplied rather than default binding, which the
  test helper could not seed. **Helper extended, tested.**

## Watched-it-fail: the neuter that proved nothing

Sixteen neutering edits, applied one at a time so each red test is red for its own reason rather
than for a neighbour's. The four covering the rewritten interpolation path include **reinstating
the slice-and-reparse**, which turns exactly the two new set-delimiter tests red — so the fix is
pinned by tests that fail against the code it replaced.

The instructive failure is the first `indexOf` neuter, which was meant to simulate the unsound
implementation and produced **zero** red tests. It computed
`Math.max(text.indexOf(rendered), text.length)` against the accumulated *prefix* — where `indexOf`
is almost always `-1`, so the `Math.max` handed back the correct value. The neuter was a no-op, and
had it been read as "the tests do not bite", the conclusion would have been exactly backwards.

Rewritten as the genuine unsound implementation — recover each substitution's offset by searching
the **final** text for the raw binding value — it turns exactly the four soundness tests red, plus
the fifth zero-length case.

Two lesser process notes from the same run: two neuters (`false ? …`, `true ? …`) never reached
jest because they tripped `no-constant-condition` in the build's lint pass, and the first detection
script parsed for a `●` marker this reporter does not emit, so it reported six no-ops in a row. **A
watched-it-fail run needs its own sanity check** — if *nothing* goes red, suspect the harness before
the tests.

## Also in this PR

- One lint **warning** fixed rather than tolerated (`no-unsafe-regexp`, a runtime-built `RegExp` in
  a `test.each` table). A warning is a CI failure in this repo.
- **No coverage directives.** The one that was briefly added is gone with the branch that needed it.
- Two further `code-reviewer` findings acted on. **P2:** `prefaceLength` was recovered as
  `finalBody.length - rendered.length` — correct only while the preface method exclusively
  *prepends*, and it would keep returning a plausible number if that stopped being true, silently
  shifting every reported offset. That is this stream's own thesis turned on its own code, so the
  method now *returns* the split point. **P3:** a dead `value === null` operand removed (both
  mustache primitives guard with `if (value != null)` and return `undefined`, never `null` —
  verified in the vendored source, not taken on the reviewer's word), and the provenance test now
  asserts concrete values rather than only agreeing with `r.slots`, which is a projection of the
  same map and so could be wrong in the same direction.
- Six `ae-unresolved-link` warnings that the new TSDoc baked into `etc/ts-extras.api.md` — the
  committed `MustacheTemplate` class had zero, so all six were new. Rewritten as prose and code
  spans to match its siblings.

## Open for whoever goes next

`.ai/instructions/LIBRARY_CAPABILITIES.md` is at **17,870 of its 18,000-char cap** after this
stream's two shortcuts. The next router entry needs an existing one compressed first. The cap was
raised once already (16,000 → 18,000) with "the router grew is NOT a reason" recorded alongside it.
