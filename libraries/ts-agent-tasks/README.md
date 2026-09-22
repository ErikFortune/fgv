# @fgv/ts-agent-tasks

Recording, observation and command mediation for agent work.

This library **records** work and **mediates** observations and commands. It runs no
agent loop: there is no scheduler, no executor, no retry policy and no model invocation.
Hosts call its reconciliation and delivery APIs; nothing here runs on its own.

See [CAPABILITIES.md](./CAPABILITIES.md) for the published surface.

## Status

Early. This release ships the vocabulary — value types, converters, the versioned kind
and command registry, typed handles, the injected clock/ID/logger seam, and the finite
capacity model. Storage, the broker, context rendering and delivery follow in later
slices.

## License

MIT — see [LICENSE](./LICENSE).
