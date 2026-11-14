# State: `agent-memory-scope-decoding`

Worker-owned. Base `integration/asks` at `84fc3cef4`; brief at `37a4c9b2a`.

## Decisions taken inside the brief

- **Signature.** `scopeDecoding?: (encoded: string) => Result<MemoryScopeKey>`, mirroring
  `scopeEncoding` and the shape `ts-prompt-assist`'s `FileTreePromptStore` already uses.
- **Decoding alone is allowed.** The brief refuses an encoding without a decoding and says nothing
  of the reverse. A decoding supplied alone pairs with `defaultMemoryScopeEncoding`, and the
  round-trip check applies to it unchanged, so no second refusal is needed.
- **"Every walked directory" is read as "every walked directory that holds a record file".** An
  intermediate directory of an encoded layout need not decode to a scope. Under a per-segment
  prefix, `s-conversations` holds no records and is not a scope. Decoding it would refuse a
  correct vault. Each record-holding directory is decoded once, as walked.
- **The check also runs on reads and writes.** All directory resolution goes through
  `encodeScope`. It requires the encoded directory to decode back to the requested scope.
  Without this, a write to a scope the pair does not round-trip would succeed and make the vault
  unopenable on the next `create`. That is the failure D4 exists to remove.
- **`ISkippedRecord`.** `scope` becomes optional, absent when a directory does not decode, because
  there is no validated scope to report. `path` is the on-disk path. Both are the same as before
  in the identity case.
- **Identity case.** With neither option, `decode` is `undefined`. The walk then indexes the raw
  path exactly as before, unvalidated, and `encodeScope` is the bare encoding.

## Open questions

None.
