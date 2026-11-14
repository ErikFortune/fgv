# Design note: `ai-assist-message-ordering`

**Stream:** `ai-assist-message-ordering` (off `release`). **Breaking change — sanctioned**
(ai-assist active surface). Companion to `brief.md`; pins the decisions the brief asked
for before implementation.

## 1. The decided shape — unified `{ system?, messages }` for BOTH entry points

A new public interface carries the ordered conversation:

```ts
/** An ordered chat request: optional system instructions plus the conversation
 *  turns. The LAST entry in `messages` is the current turn; everything before
 *  it is prior history. @public */
export interface IChatRequest {
  readonly system?: string;
  readonly messages: ReadonlyArray<IChatMessage>;
}
```

Every turn entry point takes this shape (via `extends IChatRequest`), replacing the
two asymmetric pairs:

| Entry point | Was | Now |
|---|---|---|
| `callProviderCompletion` | `{ prompt: AiPrompt, additionalMessages? }` | `{ system?, messages }` |
| `callProviderCompletionStream` | `{ prompt: AiPrompt, messagesBefore? }` | `{ system?, messages }` |
| `generateJsonCompletion` | inherits completion params | `{ system?, messages }` (still `extends IProviderCompletionParams`) |
| `executeClientToolTurn` | `{ prompt: AiPrompt, messagesBefore?, continuationMessages? }` | `{ system?, messages, continuationMessages? }` |
| `callProxiedCompletion` | `{ prompt, additionalMessages? }` (wire) | `{ system?, messages }` (wire) |
| `callProxiedCompletionStream` | `{ prompt, messagesBefore? }` (wire) | `{ system?, messages }` (wire) |

### Why `system` stays a distinct top-level field (not a `system`-role message)

The three provider builders already separate system from the turn list (Anthropic
top-level `system`, Gemini `systemInstruction`, OpenAI a leading `system`-role
message). Keeping `system` distinct in the API matches that internal reality and
sidesteps the "is the first message the system prompt or the first user turn?"
ambiguity. `messages` is therefore the user/assistant turn list only. (Stray
`system`-role entries inside `messages` are still filtered by the Anthropic/Gemini
builders, as today — but the documented contract is "system goes in `system`".)

### The single linearization (the footgun fix)

Both paths now linearize identically:

```
[ system (provider-appropriate slot) ] + [ ...history ] + [ current user turn ] + [ ...continuationMessages ]
```

The mechanism: a shared `splitChatRequest(system, messages)` helper (in
`chatRequestBuilders.ts`) peels the **last** message as the current user turn and
treats the **preceding** messages as history (`head`). The per-provider builders
already accept ordered history via their `head` option and already place the user
turn after it. The completion path previously fed history through `tail` (after the
user) — **that is the entire bug**, and the fix is to route history through `head`
for the completion path too, exactly as the streaming/tool-turn path already does.

`splitChatRequest` enforces:
- `messages` is non-empty (there must be a current turn);
- the last message has `role: 'user'` (the current turn is the user's). This is a
  structural guard: relabelling a trailing assistant message as `user` would be a
  silent footgun, so it fails loudly instead. Assistant-prefill, if ever needed, is
  a separate additive change.

The builders' now-unused `tail` option is **removed** (active-surface convention:
no dead code). `head` and `rawTail` remain. `rawTail` is exactly
`continuationMessages` (see §3).

## 2. `AiPrompt` disposition — kept as a convenience, removed from the entry-point contract

`AiPrompt` (system + user + attachments, plus `combined` for copy/paste) **stays
public**. It is no longer a parameter to any entry point. It gains one method:

```ts
public toRequest(): IChatRequest {
  return {
    system: this.system,
    messages: [{ role: 'user', content: this.user,
                 ...(this.attachments.length > 0 ? { attachments: this.attachments } : {}) }]
  };
}
```

This keeps migration mechanical (`prompt: p` → `...p.toRequest()`) and preserves the
copy-paste flow (`AiPrompt.combined`) that `ts-app-shell`'s `copyPrompt` depends on.

### Attachments on the current turn

`IChatMessage` gains an optional `attachments?: ReadonlyArray<IAiImageAttachment>`.
Only the current turn (last message) honours it — `splitChatRequest` lifts it onto
the internal `AiPrompt`, so the existing vision-content builders are unchanged. This
matches today's behaviour exactly (attachments were only ever on the user turn) while
keeping `IChatMessage` the single message type.

## 3. `continuationMessages` stays distinct (NOT history)

`continuationMessages` is the **post-current-user** tool-continuation axis:
provider-native wire objects (Anthropic thinking/tool_use blocks, OpenAI
`function_call`/`function_call_output` items, Gemini `functionCall`/`functionResponse`
turns) from a prior tool turn. It is **not** `IChatMessage` history and must not blur
into `messages`: the normalized-message path would strip the provider-native fields
(signatures, redacted thinking) the server requires. It continues to flow through the
builders' `rawTail` and is appended **after** the unified `messages` list. Unchanged
semantics; it composes after the now-unified history+user prefix.

## 4. Proxy wire-contract change (breaking — proxy servers must update)

Both proxied paths drop the `prompt` object + `additionalMessages`/`messagesBefore`
fields and send the unified shape:

```jsonc
// POST {proxyUrl}/api/ai/completion        (and .../completion-stream with "stream": true)
{
  "providerId": "...",
  "apiKey": "...",
  "system": "…",                 // omitted when undefined
  "messages": [ { "role": "user", "content": "…", "attachments": [ … ] } ],
  "temperature": 0.7,
  "modelOverride": …, "tools": …, "thinking": …   // unchanged, optional
}
```

**Delta a proxy server must apply:** read `body.system` (string, optional) +
`body.messages` (ordered `IChatMessage[]`, attachments inline on the relevant turn)
instead of `body.prompt.{system,user,attachments}` + `body.additionalMessages` /
`body.messagesBefore`. The current turn is `messages[messages.length - 1]`.

## 5. Caller migration (in-repo, lockstep)

- `ts-app-shell` `useAiAssist.ts`: `generateDirect` builds
  `messages = [{ role:'user', content: prompt.user, attachments? }, ...correctionMessages]`
  + `system = prompt.system` (the JSON-retry correction loop appends to `messages` —
  corrections naturally land after the user turn, identical wire output to before).
  `streamDirect` builds `messages = [...messagesBefore, currentUser]`. The hook's own
  external signatures (taking `AiPrompt`) are unchanged — it lowers internally.
- `samples/testbed/src/scenarios/{anthropic,gemini,openai,xai}ClientTools`: replace
  `new AiPrompt(USER_QUESTION, SYSTEM_PROMPT)` + `prompt,` with
  `system: SYSTEM_PROMPT, messages: [{ role:'user', content: USER_QUESTION }]`.
  `continuationMessages` calls unchanged.
- `ts-extras` ai-assist tests: `prompt: testPrompt` → `...testPrompt.toRequest()`;
  `additionalMessages: [...]` correction tests → fold into `messages` after the user
  turn (identical wire output, assertions unchanged); proxy body assertions
  (`body.prompt.*`) → `body.system` / `body.messages[*]`.

## 6. The load-bearing regression test (the structural guard)

`messageOrdering.test.ts`: for Anthropic + an OpenAI-shaped provider + Gemini, feed
the **same** ordered `messages = [user h1, assistant h2, user current]` (+ system)
through the completion path (`callProviderCompletion`) and the tool-turn path
(`executeClientToolTurn`), capture the wire request body for each, and assert the
conversation linearization (history position relative to the current user turn) is
**identical** across the two paths. This is the guard that the head/tail asymmetry
cannot return.

## 7. Gates

`rushx build`/`lint`/`test` (100%) in `ts-extras`, `ts-app-shell`, `samples/testbed`;
regenerate `etc/ts-extras.api.md`; Rush change file for `@fgv/ts-extras` (type `none`,
per ai-assist convention); `code-reviewer` before coverage-chasing; `fixlint` before
final commit.
