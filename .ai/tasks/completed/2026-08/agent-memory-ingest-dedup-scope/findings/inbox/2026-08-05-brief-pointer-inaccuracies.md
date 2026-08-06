# Finding — two brief pointers do not resolve

**Stream:** `agent-memory-ingest-dedup-scope`
**Severity:** low — neither blocked work; both are provisioning hygiene for future briefs
**Status:** worked around in-stream, recorded here so the brief template can be corrected

Neither triggered the brief's missing-input STOP rule: that rule governs required-reading **files**
that don't exist or can't be read. In both cases below the file exists and is readable, and the
needed content was available — only the pointer is wrong. Escalating either would have been a false
stop, but silently absorbing them would hide a repeatable authoring error.

## 1. `types/memoryStore.ts` does not exist

The brief lists, under in-scope paths:

> - `libraries/ts-agent-memory/src/packlets/types/memoryStore.ts` — the seam (deliverable 1)

and again in required reading, and again in the `docs/WORKSTREAMS.md` package surface.

There is no such file. `src/packlets/types/` contains `envelope.ts`, `filenameSafety.ts`,
`identityCodec.ts`, `ids.ts`, `index.ts`, `temporal.ts`, `writePolicy.ts`.

**`IMemoryStore` is declared in `store/fileTreeMemoryStore.ts:110`** — co-located with
`FileTreeMemoryStore`, its only in-repo implementation.

**Action taken:** added `dedupScopeFor` to `IMemoryStore` where it actually lives. Deliberately did
**not** extract the interface into a new `types/memoryStore.ts`: that is a real refactor (it moves a
`@public` declaration between packlets and churns import paths across `ingest/`, `tools/`, and the
test suite) with no bearing on the defect, and the brief's out-of-scope list does not authorize it.

**Note for the ledger:** the brief's separate bullet — "`store/fileTreeMemoryStore.ts` — implement
the accessor" — reads as though interface and impl were expected in different files. They are in
one. The two bullets collapse into one file.

## 2. `CODING_STANDARDS.md § "Docs ship with the code"` does not exist

Cited by the acceptance criterion:

> **Docs ship with the code, in this PR:** ... Not a follow-up docs PR — see
> `CODING_STANDARDS.md` § "Docs ship with the code"

`.ai/instructions/CODING_STANDARDS.md` has these `##` sections: Table of Contents, TypeScript
Standards, Result Pattern, Type-Safe Validation, Error Handling, Extending Core Libraries Over
Working Around Them, Code Style, Pre-PR Validation Checklist, Review-loop discipline. No
docs-ship-with-the-code section exists, under that or any similar name, anywhere in the repo
(the only matches are inside the brief itself).

**Action taken:** none needed — the requirement is fully specified by the bullet's own text, and it
was met (capabilities entry, design note, README, and ledger entry all ship in this PR). Recording
only because the citation will keep failing for every future stream that inherits the template.

**Suggested fix:** either add the section to `CODING_STANDARDS.md`, or drop the citation and let the
bullet stand on its own.
