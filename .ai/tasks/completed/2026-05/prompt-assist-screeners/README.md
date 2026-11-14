# prompt-assist-screeners (completed 2026-05)

Pluggable safety screeners for `@fgv/ts-prompt-assist` — a breaking change that
replaced the regex-only, synchronous, closed-kind safety pipeline with an async,
per-finding-disposition `IScreener` model.

## TL;DR

`IPromptSafetyPolicy.screeners: ReadonlyArray<IScreener>` replaces the former
`suspiciousPatterns` / `screenedSources` / `onSuspicious` policy fields. Each screener
is invoked once per non-empty slot value (post-binding, pre-render) and returns
`Promise<Result<ReadonlyArray<ISafeguardFinding>>>`. The built-in
`createPatternScreener({ patterns, onMatch, screenedSources?, name? })` reproduces the
prior regex semantics. `defaultMaxLength` and `antiJailbreakPreface` stayed policy-level.

## Files in this folder

| File | What it is |
|---|---|
| `brief.md` | The binding implementation contract (locked interfaces, the seven required changes, acceptance criteria, scope boundary). |
| `state.md` | Decisions log + dependency context captured at commission time. |
| `result.md` | Implementation outcome: what shipped, decisions, stop-and-surface resolutions, gate results, downstream notes. |

## Migration (how a consumer reproduces the old behavior)

```typescript
// BEFORE
const policy: IPromptSafetyPolicy = {
  suspiciousPatterns: [/jailbreak/i],
  screenedSources: ['user-input'],
  onSuspicious: 'warn'
};

// AFTER
import { createPatternScreener } from '@fgv/ts-prompt-assist';
const policy: IPromptSafetyPolicy = {
  screeners: [
    createPatternScreener({
      patterns: [/jailbreak/i],
      onMatch: 'warn',
      screenedSources: ['user-input']
    })
  ]
};
```

## Origin / downstream

Upstream gap-fix for the `local-ai-exploration` cluster's B-3 scenario (local classifier
→ `IPromptSafetyPolicy` backend), which could not be built against the old regex-only sync
surface. After merge to `release`, `local-ai-exploration` absorbs it and B-3's classifier
implements `IScreener` directly. The change benefits any consumer wanting custom screeners.
