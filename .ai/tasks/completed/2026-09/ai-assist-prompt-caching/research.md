# Phase A research — cross-provider prompt caching

**Stream:** `ai-assist-prompt-caching`
**Date of research:** 2026-09-07
**Scope:** OpenAI, Google Gemini, xAI/Grok, and a cross-provider question about
breakpoint-style control. **Anthropic deliberately not researched** — treated as
established per the brief.

**This document is fact-finding only. It contains no API design.**

---

## ⚠️ Headline: the brief's three-shape model is invalidated

The brief's central framing is that the providers implement *three different
mechanisms*, and that a per-section cache directive would be "write-only" on
OpenAI because **"on OpenAI there is nowhere to send it"** (brief line 42).

**That is no longer true.** OpenAI's current API has an inline, content-block
breakpoint mechanism that is structurally near-identical to Anthropic's,
including the same hard cap of **four cache writes per request**:

- `prompt_cache_breakpoint: { mode: "explicit" }` attached to an input content
  block — on both the Responses API and Chat Completions. `[confirmed]`
- `prompt_cache_options: { mode: "implicit" | "explicit", ttl: "30m" }` at
  request level, controlling whether OpenAI also places its own automatic
  breakpoint. `[confirmed]`
- "Each request can write up to four breakpoints." `[confirmed]`

Source: OpenAI's own OpenAPI specification,
<https://github.com/openai/openai-openapi> (raw:
`https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml`),
fetched 2026-09-07; and the released `openai-python` v3.8.0 (2026-09-03) type
`ResponseInputTextParam.prompt_cache_breakpoint`.

**The corrected picture** (fact, not design):

| shape | providers that offer it |
|---|---|
| inline breakpoint on a content block, max 4 writes/request | Anthropic **and OpenAI** |
| automatic with no directive | xAI; Gemini implicit; **OpenAI in its default `implicit` mode** |
| out-of-band `CachedContent` resource | Gemini explicit only |

So "shape" is **not a property of a provider** any more — OpenAI occupies two
shapes at once and the caller chooses between them per request. Anthropic's
inline-breakpoint model is no longer idiosyncratic; it now has one other
adherent, and that adherent copied the 4-breakpoint cap.

Two further findings that bear on the brief's stated priorities:

- **OpenAI now ships native cache-miss diagnostics** (`prompt_cache_diagnostics`,
  with an enumerated miss reason). The brief calls diagnostics "arguably the
  highest-value, lowest-risk deliverable" on the grounds that miss causes are
  "silent everywhere else" (brief lines 143–146). On OpenAI they are no longer
  silent. `[confirmed]`
- One of OpenAI's enumerated miss reasons is `reasoning_effort_changed`,
  independently confirming the brief's "caching and thinking config are coupled"
  note (brief line 95) for OpenAI as well as Anthropic. `[confirmed]`

---

## Sources and access constraints — read this before trusting a `[unverified]`

**Every provider's prose documentation site is blocked** by this session's
organization egress policy (`CONNECT tunnel failed, response 403`). Confirmed
blocked hosts, each probed directly:

`platform.openai.com`, `developers.openai.com`, `openai.com`, `ai.google.dev`,
`cloud.google.com`, `docs.cloud.google.com`, `discuss.ai.google.dev`,
`docs.x.ai`, `api.x.ai`, `learn.microsoft.com`, `openrouter.ai`, `github.com`
(HTML).

Per `/root/.ccr/README.md` these are organization policy denials and were not
retried or routed around.

**What *was* reachable, and what it is worth.** The blocked set is the *prose*
documentation. Machine-readable primary sources survived, and for API surface
questions they are arguably stronger evidence than a guide page:

| id | source | why it is primary |
|---|---|---|
| S1 | `raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml` | OpenAI's own published OpenAPI specification — the document their SDKs are generated from |
| S2 | `raw.githubusercontent.com/openai/openai-python/main/…` (v3.8.0, 2026-09-03) | OpenAI's official SDK, generated from S1; proves a field is *shipped*, not merely spec'd |
| S3 | `https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta` — **revision `20260904`** | Google's live service discovery document for the Gemini API. Three days old at time of research |
| S4 | `https://aiplatform.googleapis.com/$discovery/rest?version=v1` — **revision `20260831`** | Google's live Vertex AI discovery document |
| S5 | `raw.githubusercontent.com/googleapis/googleapis/master/google/ai/generativelanguage/v1beta/cached_content.proto` | Google's published API definition |
| S6 | `raw.githubusercontent.com/googleapis/python-genai/main/README.md` | Google's official Gemini SDK |
| S7 | `raw.githubusercontent.com/google-gemini/cookbook/main/quickstarts/Caching.ipynb` | Google first-party sample — narrative, **not** API reference; anything from it is marked `[inferred]` |
| S8 | `raw.githubusercontent.com/xai-org/xai-sdk-python/main/src/xai_sdk/proto/v6/{chat,usage}_pb2.pyi` | xAI's official SDK, generated from their service protos |

**The structural consequence of the blockage.** Machine-readable sources are
excellent for *parameters, field names, enums, and cardinality*, and useless for
*prices, token thresholds, and discounts* — which are prose facts that live only
on the blocked pages. So this document is strong on mechanism and weak on
numbers, and that split is not an accident of effort. **Every threshold and
every discount rate below is `[unverified]`.** Given the brief's own warning
that a wrong threshold produces a silently-non-caching implementation, none of
them should reach the design doc as a constant without independent confirmation
against the live guide pages.

Where WebSearch returned a synthesized claim from a third-party page, it is
recorded verbatim as `[unverified — third-party]` and clearly quarantined. It is
recorded only so a later verifier knows what to check, **not** as an answer.

---

## 1. OpenAI

### 1.1 Is caching still fully automatic with no opt-in? — **No, not any more**

Caching is still **automatic by default**, but explicit control now exists.
`prompt_cache_options.mode` defaults to `implicit`. `[confirmed]` (S1)

Verbatim from S1, `PromptCacheOptionsParam.mode`:

> Controls whether OpenAI automatically creates an implicit cache breakpoint.
> Defaults to `implicit`. With `implicit`, OpenAI creates one implicit
> breakpoint and writes up to the latest three explicit breakpoints in the
> request. With `explicit`, OpenAI does not create an implicit breakpoint and
> writes up to the latest four explicit breakpoints. **If there are no explicit
> breakpoints, the request does not use prompt caching.**

And from the schema description:

> Options for prompt caching. Supported for `gpt-5.6` and later models. By
> default, OpenAI automatically chooses one implicit cache breakpoint. You can
> add explicit breakpoints to content blocks with `prompt_cache_breakpoint`.
> Each request can write up to four breakpoints. For cache matching, OpenAI
> considers up to the latest 80 breakpoints in the conversation, without a
> content-block lookback limit. Set `mode` to `explicit` to disable the implicit
> breakpoint. The `ttl` defaults to `30m`, which is currently the only supported
> value.

Facts to carry forward, all `[confirmed]` (S1):

- **Model gate:** `prompt_cache_options` is "Supported for `gpt-5.6` and later
  models." Older models get automatic caching only.
- **Write cap: 4 per request.** In `implicit` mode the implicit breakpoint
  consumes one of the four, leaving three explicit.
- **Excess breakpoints are dropped silently by recency** — "up to the latest
  three/four". Not an error.
- **Match window: the latest 80 breakpoints** in the conversation, with no
  content-block lookback limit.
- **A trap worth flagging for design:** `mode: "explicit"` with zero explicit
  breakpoints disables caching entirely. It is the one setting that can make
  caching *worse* than the default.
- **TTL:** `PromptCacheTTLEnum` has exactly one member, `30m`, described as a
  *minimum* lifetime ("The backend may retain cache entries for longer").

### 1.2 The breakpoint marker

`PromptCacheBreakpointConfig` / `PromptCacheBreakpointParam` — a single required
field `mode` with the constant value `"explicit"`. `[confirmed]` (S1, S2)

Verbatim description:

> Marks the exact end of a reusable prompt prefix. The breakpoint inherits its
> TTL from the request's `prompt_cache_options.ttl`; **the boundary is not
> rounded to a token block.**

That last clause matters: unlike the automatic path (which historically matched
in fixed increments), an explicit breakpoint is exact.

**Where the breakpoint may be attached** `[confirmed]` (S1) — content blocks
only, on both APIs:

- Responses API input content: `InputTextContent`, `InputImageContent`,
  `InputFileContent`, `ComputerScreenshotContent` (and the `…Param` and `Beta…`
  variants of each).
- Chat Completions message content parts:
  `ChatCompletionRequestMessageContentPartText`, `…PartImage`, `…PartFile`,
  `…PartAudio`.

**Not** attachable to `tools`, to a system message as a whole, or to any
request-level position other than via `prompt_cache_options`. `[confirmed]` —
`prompt_cache_breakpoint` occurs 22 times in S1 and every occurrence is on a
content-block schema.

### 1.3 Cache-routing key — `prompt_cache_key`, and `user` is deprecated

`[confirmed]` (S1, schema `ModelResponseProperties`). The brief's belief is
correct and the `user` migration has happened. Verbatim:

- On `user` (marked `deprecated: true`): "This field is being replaced by
  `safety_identifier` and `prompt_cache_key`. Use `prompt_cache_key` instead to
  maintain caching optimizations."
- On `prompt_cache_key` (type `string | null`): "Used by OpenAI to cache
  responses for similar requests to optimize your cache hit rates. Replaces the
  `user` field."

The old single `user` field has been split in two by concern: `safety_identifier`
(abuse detection, max 64 chars, hashing recommended) and `prompt_cache_key`
(cache routing). `[confirmed]`

Availability: `prompt_cache_key` lives on `ModelResponseProperties`, which
`CreateModelResponseProperties` extends, which both `CreateChatCompletionRequest`
and `CreateResponse` compose via `allOf`. **So it is accepted on both Chat
Completions and Responses.** `[confirmed]` (S1)

`openai-python`'s changelog contains an entry "remove `prompt_cache_key` param
from responses" — that is historical; the current spec has it on both. `[confirmed]`

### 1.4 Retention — `prompt_cache_retention` is deprecated in favour of `prompt_cache_options.ttl`

`[confirmed]` (S1). Verbatim, on `prompt_cache_retention` (`deprecated: true`,
enum `in_memory | 24h`):

> Deprecated. Use `prompt_cache_options.ttl` instead. The retention policy for
> the prompt cache. Set to `24h` to enable extended prompt caching… This field
> expresses a **maximum retention policy**, while `prompt_cache_options.ttl`
> expresses a **minimum cache lifetime**. The two fields are independent and do
> not interact.
> For `gpt-5.5`, `gpt-5.5-pro`, and future models, only `24h` is supported.
> For older models that support both `in_memory` and `24h`, the default depends
> on your organization's data retention policy:
> - Organizations without ZDR enabled default to `24h`.
> - Organizations with ZDR enabled default to `in_memory` when
>   `prompt_cache_retention` is not specified.

Note the awkwardness, since it will confuse a design reader: the deprecated
field is a *maximum* (up to 24h) and its replacement is a *minimum* (at least
30m), and the spec explicitly says they do not interact. They are not the same
quantity, so "deprecated in favour of" is doing some violence to the semantics.
`[confirmed]` that the spec says this; the practical interaction is `[unverified]`.

**ZDR is a design-relevant hazard:** an organization with zero-data-retention
enabled gets a materially different default cache lifetime. `[confirmed]`

### 1.5 Usage fields reporting cache hits

`[confirmed]` (S1). **The two APIs do not report the same thing.**

**Responses API** — `ResponseUsage.input_tokens_details`, with **both** subfields
`required`:

| field | description (verbatim) |
|---|---|
| `cached_tokens` | "The number of tokens that were retrieved from the cache." |
| `cache_write_tokens` | "The number of input tokens that were written to the cache." |

**Chat Completions** — `CompletionUsage.prompt_tokens_details`:

| field | description (verbatim) |
|---|---|
| `cached_tokens` | "Cached tokens present in the prompt." |

There is **no `cache_write_tokens` on Chat Completions.** `[confirmed]` — on
that API a caller cannot observe cache writes at all, only reads. If the design
wants a normalized "writes" figure, Chat Completions cannot supply it.

The organization-level Usage/Costs API reports `input_cached_tokens` and
`input_uncached_tokens` as separate line items. `[confirmed]` (S1) — an
independent indication that cached and uncached input are billed at different
rates, though it does not state the rates.

### 1.6 Native cache diagnostics — new, and directly relevant to the brief's phase B

`[confirmed]` (S1). This was not anticipated by the brief and should be read
before deciding what diagnostics `ts-prompt-assist` should compute itself.

**Request side:** `prompt_cache_options.comparison_response_id` — "The ID of a
response to compare when diagnosing prompt cache reuse. Supplying this field
requests prompt cache diagnostics when the feature is enabled."

**Response side:** `Response.prompt_cache_diagnostics`, a discriminated union on
`type`:

| variant | payload |
|---|---|
| `cache_hit` | — |
| `cache_miss` | `reason`, `cache_missed_tokens` ("estimated number of input tokens affected after the first detected divergence"), `comparison_reusable_tokens` ("raw token count of the reusable prefix in the compared response") |
| `comparison_response_not_found` | — |
| `unavailable` | — |

**`CacheMissReasonTypeEnum` — the complete enumerated list of why a cache missed:**

`model_changed`, `prompt_cache_key_changed`, `tools_changed`,
`text_format_changed`, `reasoning_effort_changed`, `verbosity_changed`,
`context_compacted`, `input_changed`, `service_tier_changed`.

Two observations for the designer:

1. `reasoning_effort_changed` and `service_tier_changed` are invalidators that a
   composition-aware library **cannot** see, because they are not properties of
   the prompt text at all. Prefix-stability analysis is necessarily incomplete
   against this list.
2. `tools_changed` is a separate reason from `input_changed`, so tools are part
   of the cached prefix on OpenAI as well.

`Response.prompt_cache_options` is echoed back on the response with `ttl` and
`mode` **required**, plus the `comparison_response_id` that was supplied — so a
caller can confirm what caching policy was actually applied. `[confirmed]`

### 1.7 Threshold and discount — **could not confirm from primary documentation**

`[unverified]`. The minimum cacheable prompt length and the cached-token discount
are prose facts stated only in OpenAI's prompt-caching guide, and every OpenAI
documentation host is egress-blocked (§ Sources). They appear **nowhere** in the
OpenAPI specification: a grep of S1 for threshold language returns only TTL
descriptions, and the spec carries no pricing at all.

Recorded solely so a verifier knows what to check, and **not to be used**:

> `[unverified — third-party]` A WebSearch summary of third-party pages asserted
> "The minimum cacheable prompt length is 1,024 tokens for GPT-5.6 and later and
> 2,048 tokens for models older than GPT-5.6", and "For GPT-5.6 and later, cache
> writes cost 1.25× the standard, uncached input-token rate. Subsequent reads
> cost only 0.1× that rate."

Note that the brief's own working assumption (line 69) is "OpenAI's floor is
believed to be ~1024 tokens". That belief is **neither confirmed nor refuted**
here. The existence of `cache_write_tokens` as a required response field (§1.5)
is consistent with a non-zero write premium but does not establish one.

### 1.8 Recency

`[confirmed]` that this is a recent change, `[inferred]` as to exactly when.
`prompt_cache_options` is gated on "`gpt-5.6` and later models", and the
`gpt-5.6` family first appears in the `openai-python` changelog at **v2.53.0,
dated 2026-08-03** — roughly five weeks before this research. The changelog's
generated entries never name `prompt_cache_breakpoint`, so the exact landing
release could not be pinned. The feature is **shipped, not preview**: it is
present in released SDK v3.8.0 (2026-09-03).

**Treat OpenAI as a moving target.** Within the window this spec covers, `user`
was split and deprecated, `prompt_cache_retention` was added and then deprecated
in favour of `prompt_cache_options.ttl`, `prompt_cache_key` was removed from and
restored to Responses, and the whole breakpoint + diagnostics surface appeared.
The spec also carries a parallel `Beta*` family (`BetaCreateResponse`,
`BetaPromptCacheOptions`, …) with the same cache fields, which suggests further
churn in flight. `[confirmed]` (S1, S2)

---

## 2. Google Gemini

### 2.1 Implicit caching — **no API surface whatsoever**

`[confirmed]` (S3, S4). This is a strong negative result and it is worth stating
precisely, because it is confirmable even though the prose docs are blocked.

The string `implicit` **does not occur anywhere** in the Gemini API v1beta
discovery document (revision `20260904`), and occurs in the Vertex AI v1
discovery document (revision `20260831`) only in three unrelated prose contexts
(feature-substring matching, colour representation, project IDs).

Consequently:

- There is **no request parameter** to enable, disable, tune, or hint implicit
  caching on a per-request basis in the Gemini API. `[confirmed]`
- There is **no distinct usage field** for implicit cache hits. `[confirmed]`
- The only implicit-cache control found anywhere is a **Vertex-only,
  project-level singleton admin resource**: `GoogleCloudAiplatformV1CacheConfig`
  — "Config of GenAI caching features. This is a singleton resource", name
  `projects/{project}/cacheConfig`, with one field `disableCache`: "If set to
  true, disables GenAI caching. Otherwise caching is enabled." `[confirmed]` (S4)
  This is an org-administration control, not something a request-assembly library
  would touch.

**Implicit caching's thresholds, discount, and model coverage could not be
answered from primary provider documentation.** `[unverified]` — they are stated
only on `ai.google.dev`, which is egress-blocked. Recorded for a verifier, not
for use:

> `[unverified — third-party]` A WebSearch summary asserted implicit caching is
> "enabled by default for all Gemini 2.5 and newer models" and that "for Gemini 3
> Flash specifically, the minimum implicit caching threshold is 1024 tokens".
> A search result also surfaced `googleapis/python-genai` issue #2064, titled
> "gemini-3-flash-preview implicit caching dead zone: `cached_content_token_count`
> drops to 0 between ~9K-17K prompt tokens" — which, if real, would mean the
> implicit threshold is not even monotonic. **Neither claim was verified and the
> issue was not read** (github.com HTML is blocked). Flagged because a
> non-monotonic threshold would be hostile to any "is my prefix above the
> threshold?" diagnostic.

### 2.2 Explicit caching — the `cachedContents` resource

`[confirmed]` (S3, S5, S6). Fully specified and stable-looking.

**Control-plane methods** on `cachedContents` (Gemini API v1beta):

| method | HTTP | notes |
|---|---|---|
| `create` | `POST v1beta/cachedContents` | |
| `get` | `GET v1beta/{+name}` | |
| `list` | `GET v1beta/cachedContents` | `pageSize`, `pageToken` |
| `delete` | `DELETE v1beta/{+name}` | |
| `patch` | `PATCH v1beta/{+name}` | **"Updates CachedContent resource (only expiration is updatable)."** |

**`CachedContent` schema** `[confirmed]` (S3):

| field | mutability | notes |
|---|---|---|
| `model` | **Required. Immutable.** | format `models/{model}` |
| `contents` | Optional. **Input only. Immutable.** | the content to cache |
| `systemInstruction` | Optional. Input only. Immutable. | "Currently text only" |
| `tools` | Optional. Input only. Immutable. | |
| `toolConfig` | Optional. Input only. Immutable. | shared for all tools |
| `displayName` | Optional. Immutable. | max 128 Unicode chars |
| `ttl` | **Input only** | `google-duration`, e.g. `"3600s"` |
| `expireTime` | output (and settable on input) | "always provided on output, regardless of what was sent on input" |
| `name` | Output only. Identifier. | format `cachedContents/{id}` |
| `createTime` / `updateTime` | Output only | |
| `usageMetadata` | Output only | `CachedContentUsageMetadata.totalTokenCount` |

**Reference call shape:** `GenerateContentRequest.cachedContent` — a string,
"The name of the content cached to use as context to serve the prediction.
Format: `cachedContents/{cachedContent}`". `[confirmed]` (S3)

Idiomatic usage per Google's own SDK `[confirmed]` (S6):

```python
cached_content = client.caches.create(
    model='gemini-3.5-flash',
    config=types.CreateCachedContentConfig(
        contents=[...], system_instruction='...', display_name='test cache',
        ttl='3600s'))

response = client.models.generate_content(
    model='gemini-3.5-flash', contents='Summarize the pdfs',
    config=types.GenerateContentConfig(cached_content=cached_content.name))
```

**Model-scoping is explicit in the API definition** `[confirmed]` (S3, S5):
"Cached content can be only used with model it was created for." Google's own
cookbook adds the reason: "caches are model specific. You cannot use a cache made
with a different model as their tokenization might be slightly different."
`[inferred]` (S7 — narrative, not reference).

**Everything except expiry is immutable.** A "cache update" is a delete plus a
create, and the new resource has a new `name` that every caller must re-reference.
`[confirmed]` — this is the lifecycle cost the brief anticipated, and the API
definition confirms it is real.

**TTL semantics** `[confirmed]` (S4, phrased most clearly in the Vertex schema):
"Input only. The TTL for this resource. The expiration time is computed:
`now + TTL`." A `patch` may reset expiry; the content itself cannot be touched.
There is **no stated default TTL** in either discovery document. `[unverified]`
as to the default — Google's own cookbook narrative says a cache "by default …
is only saved for an hour", which is `[inferred]` (S7), not reference-grade.

### 2.3 Storage billing — hourly retention charge is real, but the rate could not be confirmed

`[inferred]` (S7). Google's first-party cookbook states plainly that an explicit
cache "has a small **recurring storage cost** (cf. [pricing]) so by default it is
only saved for an hour."

This **corroborates the brief's premise** that explicit caching bills for
retention independently of use. It does **not** confirm the unit (per hour vs.
per some other period), the rate, or how it varies by model — the pricing page it
links to (`ai.google.dev/pricing`) is egress-blocked. `[unverified]` for all
numbers.

The billing model is visible in the API's shape even without the price:
`CachedContentUsageMetadata.totalTokenCount` is the *stored* token count and is
reported on the resource itself, independent of any generation call — i.e. the
resource knows its own size because its size is what gets billed for retention.
`[inferred]` (S3).

### 2.4 Usage fields reporting cache hits

`[confirmed]` (S3), `UsageMetadata` on the generate-content response:

| field | description (verbatim) |
|---|---|
| `cachedContentTokenCount` | "Number of tokens in the cached part of the prompt (the cached content)" |
| `cacheTokensDetails` | Output only. "List of modalities of the cached content in the request input" — array of `ModalityTokenCount` |
| `promptTokenCount` | "…When `cached_content` is set, this is still the **total effective prompt size** meaning this includes the number of tokens in the cached content." |

The `promptTokenCount` note is a genuine footgun for a normalized reporting
shape: on Gemini, cached tokens are **inside** the prompt token count, whereas
OpenAI's `cached_tokens` sits in a `…_details` sub-object alongside a separate
total. Any cross-provider "uncached input tokens" figure must subtract on Gemini
and not on OpenAI. `[confirmed]`

There is **no cache-write token field** on Gemini — consistent with writes being
the out-of-band `create` call rather than part of a generation request.
`[confirmed]` (S3)

**Whether implicit cache hits populate `cachedContentTokenCount`:**
`[inferred]`, not confirmed. Nothing in S3/S4/S5 says so — the field's
description names "the cached content", which is the explicit resource's term of
art. The third-party issue title cited in §2.1 refers to
`cached_content_token_count` in an implicit-caching context, which suggests the
same field serves both. **If true, a caller cannot distinguish an implicit hit
from an explicit one from usage alone** — worth verifying empirically, since it
determines whether cache-effectiveness reporting can attribute savings.

### 2.5 Recency

No evidence of recent churn found. Both discovery documents were fetched live and
are days old (`20260904` / `20260831`), the `cachedContents` surface is present
in both v1beta and Vertex v1 with matching shape, and `cached_content.proto` in
`googleapis/googleapis` matches. Gemini's explicit-caching surface looks
**stable**. `[inferred]` — absence of churn evidence is not proof of stability,
and the implicit-caching *behaviour* could change without any API-surface change,
precisely because it has no API surface.

---

## 3. xAI / Grok

### 3.1 Automatic — no directive of any kind

`[confirmed]` (S8). The complete field list of `GetCompletionsRequest` in xAI's
official SDK protos (v6) is:

> `messages`, `model`, `user`, `n`, `max_tokens`, `seed`, `stop`, `temperature`,
> `top_p`, `logprobs`, `top_logprobs`, `tools`, `tool_choice`, `response_format`,
> `frequency_penalty`, `presence_penalty`, `reasoning_effort`,
> `search_parameters`, `parallel_tool_calls`, `previous_response_id`,
> `store_messages`, `use_encrypted_content`, `max_turns`, `include`,
> `agent_count`, `service_tier`

**There is no cache parameter, no cache key, no breakpoint, and no TTL.** The
only cache-adjacent field anywhere in the request path is `user`. Whether `user`
influences cache routing on xAI is `[unverified]` — `docs.x.ai` is blocked, and
the protos carry no comment saying so.

Message content parts likewise carry no cache marker. `[confirmed]` (S8) — this
was checked directly, since that is where OpenAI put theirs.

### 3.2 Usage fields

`[confirmed]` (S8), `SamplingUsage`:

| field | notes |
|---|---|
| `cached_prompt_text_tokens` | the cache-hit field |
| `prompt_text_tokens` | text prompt tokens |
| `prompt_image_tokens` | image prompt tokens — **no cached counterpart** |
| `prompt_tokens`, `completion_tokens`, `reasoning_tokens`, `total_tokens` | |
| `cost_in_usd_ticks` | xAI reports cost directly on the response |

Confirmed reachable from the SDK's own telemetry, which emits
`gen_ai.usage.cached_prompt_text_tokens = response.usage.cached_prompt_text_tokens`.
`[confirmed]` (S8, `src/xai_sdk/chat.py`)

Two design-relevant notes:

- **Text only.** The field is `cached_prompt_**text**_tokens`, and the
  image-token field has no cached sibling. Whether image prompt tokens can be
  cached at all is `[unverified]`.
- **No cache-write field.** Reads are reported; writes are not. `[confirmed]`
- `cost_in_usd_ticks` is an unusual and possibly useful escape hatch — xAI
  reports the actual charged cost per response, so cache effectiveness could be
  measured in currency without knowing the discount rate. `[confirmed]` that the
  field exists; its unit ("ticks") is `[unverified]`.

xAI's `DebugOutput` message additionally carries `cache_read_count`,
`cache_read_input_bytes`, `cache_write_count`, `cache_write_input_bytes`.
`[confirmed]` (S8) — these are debug/telemetry fields on a debug channel, not
part of normal usage reporting, and should not be relied on.

### 3.3 Threshold and discount — **could not confirm from primary documentation**

`[unverified]`. `docs.x.ai` and `api.x.ai` are both egress-blocked, and the SDK
protos carry no threshold, discount, or TTL information. No third-party claim
about xAI's threshold or discount was surfaced with enough specificity to be
worth recording even as a lead. **This is a genuine gap.**

### 3.4 Note on the REST surface

The above is from xAI's **gRPC** protos. xAI also exposes an
OpenAI-compatible REST endpoint, on which the usage shape is presumably
`usage.prompt_tokens_details.cached_tokens` rather than
`cached_prompt_text_tokens`. `[unverified]` — not confirmable with docs blocked.
**If `ai-assist` talks to xAI over the OpenAI-compatible REST path (which is the
likely case for an OpenAI-compatible client), the field name in this document is
probably not the one the code will see.** Verify against a live response before
coding to either name.

---

## 4. Cross-provider — has anyone else added breakpoint-style control?

**Yes: OpenAI.** Detailed in §1.1–1.2. `[confirmed]`

| provider | breakpoint-style explicit control? |
|---|---|
| Anthropic | yes (established; not researched here per brief) |
| **OpenAI** | **yes — `prompt_cache_breakpoint` on a content block, max 4 writes/request** `[confirmed]` |
| Google Gemini | no — out-of-band `CachedContent` resource only `[confirmed]` |
| xAI / Grok | no — no cache field in the request at all `[confirmed]` |
| Azure OpenAI | `[unverified]` — `learn.microsoft.com` blocked. Azure hosts the same models and typically tracks the OpenAI surface, so it likely follows, but this was not confirmed |
| OpenAI-compatible third parties (Ollama, OpenRouter, self-hosted) | `[unverified]` — not researched; `openrouter.ai` blocked |

**So the answer to the brief's question 4 is that Anthropic's inline-breakpoint
model is no longer idiosyncratic.** Two of the four providers now implement it,
with the *same* cardinality limit of four writes per request. Whether that
convergence is convention or coincidence is not something this research can
establish — but the numeric coincidence of "4" is striking enough to note.

The convergence is partial, and the differences are as load-bearing as the
similarity:

- OpenAI's breakpoint attaches **only to content blocks**, not to tools.
  `[confirmed]`
- OpenAI drops **excess breakpoints by recency** rather than erroring.
  `[confirmed]`
- OpenAI's TTL is a **request-level** setting inherited by every breakpoint
  (currently only `30m`), not per-breakpoint. `[confirmed]`
- OpenAI has a **request-level mode switch** with a foot-gun setting
  (`explicit` + no breakpoints = no caching). `[confirmed]`

---

## 5. Comparison table

Read `[unverified]` here as "the blocked prose docs are the only place this
lives" — see § Sources. Anthropic column omitted per the brief.

| | **OpenAI** | **Google Gemini** | **xAI / Grok** |
|---|---|---|---|
| **Mechanism** | automatic by default **plus** inline breakpoints on content blocks `[confirmed]` | implicit: automatic, zero API surface `[confirmed]` · explicit: out-of-band `cachedContents` resource `[confirmed]` | automatic only `[confirmed]` |
| **Directive or automatic** | **both** — `prompt_cache_options.mode` = `implicit` (default) \| `explicit`; `prompt_cache_breakpoint: {mode:"explicit"}` per content block `[confirmed]` | implicit: none · explicit: `caches.create(...)` → `GenerateContentRequest.cachedContent = "cachedContents/{id}"` `[confirmed]` | none — no cache field in `GetCompletionsRequest` `[confirmed]` |
| **Write cap** | 4 breakpoints/request (implicit mode consumes one) `[confirmed]` | n/a — one resource per cache `[confirmed]` | n/a |
| **Threshold** | **`[unverified]`** — absent from the OpenAPI spec; guide blocked. Brief's "~1024" neither confirmed nor refuted | **`[unverified]`** for implicit; explicit has a minimum token count stated only on the blocked docs | **`[unverified]`** |
| **Discount** | **`[unverified]`** — no pricing in spec | **`[unverified]`** | **`[unverified]`** |
| **Write premium** | `[unverified]`; `cache_write_tokens` exists as a required response field, implying separate billing `[confirmed]` | n/a — write is the `create` call; retention billed hourly `[inferred]` | `[unverified]`; no write field reported |
| **TTL** | `prompt_cache_options.ttl`, enum with **only** `30m`, a *minimum* `[confirmed]`. Deprecated `prompt_cache_retention` (`in_memory`\|`24h`) is a separate *maximum* `[confirmed]` | `CachedContent.ttl` (duration, input-only); `expireTime = now + ttl`; `patch` may extend `[confirmed]`. Default `[unverified]` (cookbook says 1h `[inferred]`) | none `[confirmed]` |
| **Routing key** | `prompt_cache_key` (replaces deprecated `user`) `[confirmed]` | none — the resource `name` is the handle `[confirmed]` | none; `user` exists, cache role `[unverified]` |
| **Usage: reads** | Responses: `usage.input_tokens_details.cached_tokens` · Chat: `usage.prompt_tokens_details.cached_tokens` `[confirmed]` | `usageMetadata.cachedContentTokenCount` (+ `cacheTokensDetails` by modality); **included in `promptTokenCount`** `[confirmed]` | `SamplingUsage.cached_prompt_text_tokens` — **text only** `[confirmed]` |
| **Usage: writes** | Responses: `usage.input_tokens_details.cache_write_tokens` `[confirmed]` · **Chat Completions: none** `[confirmed]` | none `[confirmed]` | none `[confirmed]` |
| **Native miss diagnostics** | **yes** — `prompt_cache_diagnostics` + 9-value `CacheMissReasonTypeEnum` `[confirmed]` | no `[confirmed]` | no `[confirmed]` |
| **Model-scoped** | `model_changed` is an enumerated miss reason `[confirmed]` | stated in the API definition `[confirmed]` | `[unverified]` |
| **Recently changed?** | **yes, heavily** — breakpoints/diagnostics gated on `gpt-5.6`, which appeared in the SDK ~2026-08-03 `[inferred]`; `user` deprecated, `prompt_cache_retention` deprecated, parallel `Beta*` surface in flight `[confirmed]` | no churn evidence; discovery docs days old `[inferred]` | no churn evidence `[inferred]` |

---

## 6. Things the designer should not miss

1. **The three-shape model in the brief is wrong** (§0). OpenAI is not "nowhere
   to send a directive" — it is the second inline-breakpoint provider, with the
   same 4-write cap. The brief's argument that a per-section directive is
   "write-only for two of the three" now holds for **one** of the four
   (xAI), plus Gemini's implicit path.

2. **The 4-breakpoint mapping problem is now shared, not Anthropic-specific**
   (brief line 130). OpenAI additionally resolves overflow *by recency, silently* —
   an over-annotated composition loses its **earliest** breakpoints, which are
   usually the most stable and therefore the most valuable ones.

3. **`mode: "explicit"` with no breakpoints disables OpenAI caching entirely.**
   The one configuration that is strictly worse than doing nothing is reachable
   by an obvious-looking API call.

4. **OpenAI already answers the "why did my cache miss" question natively**, with
   a 9-value enumerated reason and an affected-token estimate. Two of those
   reasons (`reasoning_effort_changed`, `service_tier_changed`) are invisible to
   any prefix-stability analysis, which bounds how complete a home-grown
   diagnostic can be.

5. **Cached tokens are inside `promptTokenCount` on Gemini and outside the total
   on OpenAI.** Any normalized "uncached input" figure must special-case this.

6. **Chat Completions cannot report cache writes.** If the normalized report has
   a write-tokens field, it is structurally unfillable on that API.

7. **Every number is unverified.** Thresholds and discounts for all three
   providers are `[unverified]`, because every provider's pricing and guide page
   is egress-blocked in this environment. Per the brief's own reasoning about
   silent non-caching, **the design must not hard-code a threshold constant on
   the strength of this document.** If the design needs thresholds, either
   re-run this research from an unrestricted network, or treat the threshold as
   caller-supplied configuration rather than a library constant.

8. **A possible non-monotonic Gemini implicit threshold** was surfaced but not
   verified (§2.1). If real, "is my prefix above the threshold" is not a
   well-formed question on Gemini, which would matter for the diagnostic the
   brief calls the highest-value deliverable.

9. **xAI's `cost_in_usd_ticks`** reports charged cost per response directly —
   a way to measure cache effectiveness without knowing the discount rate.

10. **OpenAI's caching surface is actively churning** and the design should
    expect it to move again. Gemini's and xAI's show no churn evidence.
