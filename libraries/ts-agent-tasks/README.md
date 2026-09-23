# @fgv/ts-agent-tasks

Recording, observation and command mediation for agent work.

This library **records** work and **mediates** observations and commands. It runs no
agent loop: there is no scheduler, no executor, no retry policy and no model invocation.
A host drives it by calling it; nothing here runs on its own. Reconciliation and delivery
will be host-called APIs too — they arrive in later releases, not this one.

See [CAPABILITIES.md](./CAPABILITIES.md) for the published surface.

## Status

Early. This release ships the vocabulary — value types, converters, the versioned kind
and command registry, typed handles, the injected clock/ID/logger seam, and the finite
capacity model — a snapshot-only context renderer (hand `TaskContextRenderer` task
snapshots and get bounded, escaped prompt text plus a pure receipt of exactly what it
included), and **`FileTreeTaskRepository`**: task records over an injected `FileTree` root,
each task's state, owed updates and dedup evidence committed in one atomic replacement, with
scope/lifecycle queries, due candidates and owed updates answered from resident indexes (no
record reads), keyset paging, a staged index rebuild, and a conformance suite for custom
repositories.

Durable mode claims **process-crash survival only**, and only on a root the FileTree atomic
capability qualifies — Linux ext2/ext3/ext4 or tmpfs. A container's writable layer is
overlayfs and is refused: put a durable root on a named volume or a Linux bind mount. Check a
root with `node -e "console.log('0x'+require('fs').statfsSync('<root>').type.toString(16))"`
(`0xef53` or `0x1021994` qualify). The broker, subscriptions and delivery follow in later
slices.

## License

MIT — see [LICENSE](./LICENSE).
