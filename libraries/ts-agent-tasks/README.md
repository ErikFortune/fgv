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
capacity model — and a snapshot-only context renderer: hand `TaskContextRenderer` task
snapshots and get bounded, escaped prompt text plus a pure receipt of exactly what it
included, with no storage and no broker. Storage, the broker and delivery follow in later
slices.

## License

MIT — see [LICENSE](./LICENSE).
