# `testbed-wire-probe`: what each provider wire accepts, compared with our keyword tables

**Shipped 2026-10-18** onto `integration/asks` (PR #TBD). Origin: user decision 5, 2026-10-18
(`personality-asks-2026-10/followups.md` § "Decisions, 2026-10-18"). Follows `json-schema-constraints`
(#734) and `json-schema-shapes` (#736), whose tables it checks.

---

## What it is

`ai-assist` adapts every tool and structured-output schema with a per-wire keyword-capability
table: pass, fold, translate, drop or refuse. Most entries are cited from provider documentation.
Three from #736 are inferences:
- OpenAI and xAI pass a numeric `enum`;
- Anthropic tools pass `{}`;
- OpenAI function tools refuse `{}`.

This stream builds the instrument that turns the table into observations.

## What shipped

- **`wire-probe` testbed scenario (CLI-only, live keys, never in CI).**
  - It sends 22 fixture schemas **unadapted** to each configured wire: Anthropic tools and JSON
    outputs, OpenAI and xAI Responses tools and strict output, and Gemini tools and
    `responseSchema`. The fixtures are a control, every constraint keyword, every annotation,
    numeric and boolean enums, and `{}` at the root, in properties and in items.
  - It records accept or reject with the provider's error text, then classifies each row against
    the library's own table as **agrees**, **conservative** or **unsafe**.
  - It sends each fixture **through** `ai-assist` and confirms the adapted request is accepted, or
    refused before anything is sent where the table refuses.
  - It exits non-zero only on an unsafe row.
  - A control fixture gates each wire, so a bad key or a retired model reads as inconclusive rather
    than unsafe.
- **`@fgv/ts-extras` (additive):** `AiAssist.structuredOutputSchemaKeywords` (the structured-output
  sibling of `clientToolSchemaKeywords`) and a public `AiAssist.toGeminiParameterSchema`.

## What changed shape

- **The brief expected a testbed-only change. It needed `ts-extras` too.** The Anthropic
  JSON-outputs table had no public route, and a testbed copy of it could drift and report "agrees"
  against something that no longer ships. Gemini's dialect translation had to be public so the raw
  request is valid apart from the keyword under test.
- **An adapted request the provider rejects also counts as unsafe**, since it is the request we
  actually send.

## Not done

- **No live run.** The session had no provider keys, so the #736 inferences are still inferences.
  Run it with all four keys (README: "Provider wire probe").
- **`pattern`** gets a fixture after `json-schema-pattern` lands, and the probe is re-run then.

## Artifacts

`brief.md` (frozen) and `result.md` (method, model table, gates, self-review). There is no
`state.md`: no question was raised in flight.
