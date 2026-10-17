# `json-schema-constraints`: constraint keywords are enforced, emitted and adapted per provider

**Shipped 2026-10-17** onto `integration/asks` (PR #TBD; the orchestrator fills in the number).
Origin: ErikFortune/personaility#682. Builds on `json-schema-fromjson-widening` (#723).

---

## What it is

`JsonSchema.fromJson` accepted `minimum`, `maxLength` and the rest, then dropped them. The model
never saw the range, and the validator accepted values the schema forbade. That broke the package's
founding rule: what the validator accepts is what the wire states.

## What shipped

- **Typed options on the node.**
  - `number`/`integer`: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`.
  - `string`: `minLength`, `maxLength`, `format`.
  - Every factory: `title`, `default`, `examples`.
- **Validating keywords are enforced**, and the failure names the keyword and the bound.
  **Annotations are emitted only.** Every keyword round-trips through `fromJson`.
- **Incoherent option sets are refused.** A factory throws at construction; `fromJson` returns the
  same check as a `Failure` naming the path.
- **`JsonSchema.adaptSchemaKeywords`** passes, translates or folds each keyword for one wire. A
  folded keyword becomes `Constraints: minimum 1; maximum 10.` in the description.
- **Per-format tables in ai-assist** (`schemaKeywords.ts`) apply on every tool and structured-output
  path. Each pass or translate entry is cited from fetched provider documentation. Ollama folds
  everything.
- **MCP:** an adapted tool declaring `minimum` refuses an out-of-range model call before it reaches
  the server.

## What changed shape

- **The fold transform lives in `ts-json-base`**, so `ts-extras-ollama` can share it.
- **The OpenAI-family tables apply to OpenAI and xAI only.** Their wires are shared by every
  OpenAI-format provider, and the others' support could not be verified. Those providers fold
  everything.
- **`const`, array and key-count constraints remain open** in `docs/TECH_DEBT.md`.

See `result.md` for the full capability table, the citations, the belief verdicts and the gate
counts, and `state.md` for the deviations.
