# Brief — ai-assist: surface Gemini image-generation refusals cleanly

**Branch:** `claude/ai-assist-gemini-image-refusal` (off `release`).
**Surface:** `@fgv/ts-extras` → `src/packlets/ai-assist` (**active** surface — additive OK per `.ai/instructions/ACTIVE_DEVELOPMENT.md`).
**Ships under the enforced coverage gate** (#517/#518) — 100% coverage is real; hit it for real.

## Problem (real consumer bug report)

A PersonAIlity avatar render using a character-reference image failed. Gemini's `:generateContent` returned a **refusal candidate** — a candidate carrying `finishReason: "IMAGE_OTHER"` + a `finishMessage` ("Unable to show the generated image. The model could not generate the image based on the prompt provided… Try rephrasing…") and **no `content`**. Our adapter surfaced this as:

```
Gemini image API response: candidates[0].content: Field not found
```

That is a mis-signal: a well-behaved Gemini *refusal* is reported as if **we** couldn't parse the response (a wire-shape mismatch). The consumer can't distinguish "our integration broke" from "the model declined; rephrase and retry."

**Root cause** in `libraries/ts-extras/src/packlets/ai-assist/apiClient.ts` (the `gemini-image-out` path, function `callGeminiImageOutGeneration`, ~line 1160):

- `IGeminiImageOutCandidate` (line 877) declares `content` **required**; the validator `geminiImageOutCandidate` (line 899) has `content: geminiImageOutContent` with no `.optional()`. A content-less refusal candidate fails validation at the missing `content` field → the cryptic error.
- `finishReason` is captured (optional, line 900) but **never read**. `finishMessage` **isn't modeled at all**.
- The `images.length === 0` fallback (line 1210) `'no image parts in response'` can't tell "empty" from "refused" either.

## Do (additive, minimal, one file + tests)

In `apiClient.ts`:

1. **Model the refusal fields.** Add `finishMessage?: string` to `IGeminiImageOutCandidate` (line 877-880) and its validator (line 897-901): `finishMessage: Validators.string.optional()`.
2. **Make `content` optional.** `IGeminiImageOutContent` on the candidate becomes `content?: IGeminiImageOutContent` (interface) and `content: geminiImageOutContent.optional()` (validator). A refusal candidate now validates instead of erroring.
3. **Relax the `parts` non-empty constraint** on `geminiImageOutContent` (line 894-896) — drop `.withConstraint((arr) => arr.length > 0)`. Emptiness is now handled uniformly in the extraction loop's `images.length === 0` branch (below), so a `content`-present-but-empty-`parts` candidate also degrades to the clean refusal/empty error rather than a cryptic validation failure.
4. **Guard the content deref + build a legible refusal error.** In the extraction loop (line 1197-1213):
   - Iterate `candidate.content?.parts ?? []` so a content-less candidate is skipped safely (no more unconditional `candidate.content.parts`).
   - When `images.length === 0`, before failing, scan `response.candidates` for any `finishReason`. If one is present, fail with a message that surfaces it, e.g.:
     `Gemini image generation declined: <finishReason>[ — <finishMessage>]` (include the ` — <finishMessage>` segment only when `finishMessage` is present). If **no** candidate carries a `finishReason`, keep the existing `Gemini image API response: no image parts in response` message.
   - Keep the outer `.withErrorFormat((msg) => \`Gemini image API response: ${msg}\`)` for the validation stage. The refusal message is returned from inside `.onSuccess`, so decide the final wording deliberately — the declined-message should read cleanly on its own (it's fine for it to NOT carry the `Gemini image API response:` prefix, or to carry it — pick one and be consistent; prefer a form a consumer can substring-match, e.g. stable leading text `Gemini image generation declined:`).

Keep it surgical. Do not touch the other provider image paths (OpenAI/xAI), the completion/streaming paths, or the dispatcher.

## Constraints

- No `any`; `Result<T>` for fallible ops; Validators for shape validation (no manual-typeof-then-cast). `__`-prefix unused params (lint-mandated).
- Additive only — no removed/renamed exports (these interfaces are `@internal`). The two behavior changes (content optional, parts constraint dropped) only *widen* what validates; every previously-valid response still validates and still yields the same images.
- Regenerate `etc/ts-extras.api.md` if anything public shifts (these are `@internal`, so likely no api.md change — confirm the diff is empty or additive).
- **100% coverage — actually enforced now.**

## Tests

Add to the existing ai-assist image-generation test suite (find the current `callProviderImageGeneration` / gemini-image-out tests and colocate). Drive through the public `callProviderImageGeneration` entry with a mocked/fixtured Gemini response body where possible; if the suite already fixtures `fetchJson`/wire JSON, follow that pattern.

- **Refusal candidate** (`finishReason: 'IMAGE_OTHER'`, `finishMessage: '...'`, **no `content`**) → `toFailWith(/Gemini image generation declined: IMAGE_OTHER/)` and assert the `finishMessage` text is included.
- **Refusal candidate with `finishReason` but no `finishMessage`** → fails with the reason, no dangling ` — `.
- **Empty-parts candidate** (`content.parts: []`, no image, with a `finishReason`) → same clean declined error (proves the dropped `parts` constraint routes through the refusal branch).
- **No-finishReason empty** (candidate with content but zero inlineData parts and no finishReason) → preserves the existing `no image parts in response` message.
- **Happy path unchanged** — a normal `content.parts[].inlineData` response still yields the image(s). Confirm the existing success test still passes untouched.

## Sequence

Implement → `code-reviewer` on the diff **before** coverage-chasing → `rushx build && rushx lint` (fixlint first) + `rushx test` @ 100% + api-extractor regen (confirm no/additive api.md diff) → `rush change` (`--bulk --bump-type patch --target-branch origin/release` — this is a bugfix) → commit + push + open PR onto `release`.

## Proof of work

`git log --oneline -3`; build/lint/test tails (100%); the refusal-path test output (declined message with finishReason + finishMessage); confirmation the happy-path test is unchanged; `code-reviewer` findings + dispositions; api.md diff (expected empty/additive since the touched interfaces are `@internal`).
