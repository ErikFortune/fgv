# Tech Debt — fgv

Already-shipped imperfections. Priority-ranked; addressed
opportunistically when the right surface area is touched.

---

## Priority key

- **P1** — blocking / structural; address before resuming major feature work.
- **P2** — fix before the next major feature in the affected area.
- **P3** — opportunistic cleanup.
- **P4** — doc / minor consistency.

## Entry format

```markdown
- **[Pn] Title.**
  Description with file pointers.

  **Trigger**: when this should be addressed.

  **Scope sketch**: one-paragraph fix shape.

  **Not a P(n+1)**: why this priority and not lower.

  **Reference**: PR / commit / session context that surfaced it.
```

---

## P1 — Blocking

*(None.)*

## P2 — Fix before next major feature in affected area

- **[P2] Replace try/catch + instanceof-Error boilerplate in `ai-assist/apiClient.ts` with `captureAsyncResult`.**
  Four identical `catch (err: unknown) { const detail = err instanceof Error ? err.message : String(err); return fail(...detail...); }` blocks at lines ~158, 217, 272, 316. Each carries a `/* c8 ignore next 1 - defensive: fetch errors are always Error instances in practice */` directive to suppress the untestable catch branch — a signal that `captureAsyncResult()` is the right replacement. `captureAsyncResult` handles the `Error`-vs-string normalisation internally and makes the `c8 ignore` directives unnecessary.

  **Trigger**: next time `apiClient.ts` is open for substantive changes (e.g. adding a new provider).

  **Scope sketch**: wrap each `try { response = await fetch(...) } catch` block with `captureAsyncResult(() => fetch(...))`, then chain `.withErrorFormat((msg) => \`AI API request failed: ${msg}\`)`. The `c8 ignore` directives on the catch lines can be removed once the blocks are gone.

  **Not a P3**: the `c8 ignore` directives are suppressing real untestability; the boilerplate pattern appears four times and will grow with each new provider endpoint.

  **Reference**: PR #329 review — patterns pre-existed the PR, absolved from that review.

## P3 — Opportunistic cleanup

- **[P3] `resolveImageCapability` in `ai-assist/registry.ts` returns `| undefined` instead of `Result<IAiImageModelCapability>`.**
  `registry.ts:328–339`. The function returns `undefined` when no capability matches `modelId`, silently swallowing the "unknown model" case. Callers must null-check rather than chain. Returning `Result<IAiImageModelCapability>` with a contextual error message would let callers propagate the failure cleanly.

  **Trigger**: next substantive change to the provider registry or capability resolution path.

  **Scope sketch**: change return type to `Result<IAiImageModelCapability>`; return `fail(\`model '${modelId}' not found in provider '${descriptor.name}' image capabilities\`)` when the reduce produces `undefined`; update call sites (primarily in `apiClient.ts`) to chain off the result.

  **Not a P2**: the function is currently only called in contexts that already handle `undefined` defensively; behaviour is correct, just non-idiomatic.

  **Reference**: PR #329 review — pattern pre-existed the PR, absolved from that review.

## P4 — Doc / minor consistency

*(None.)*
