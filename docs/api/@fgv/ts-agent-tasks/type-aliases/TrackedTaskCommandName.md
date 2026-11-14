[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TrackedTaskCommandName

# Type Alias: TrackedTaskCommandName

> **TrackedTaskCommandName** = `"start"` \| `"wait"` \| `"pause"` \| `"resume"` \| `"succeed"` \| `"fail"` \| `"cancel"` \| `"set-title"` \| `"set-description"` \| `"set-progress"` \| `"set-attention"`

The commands `fgv.tracked@1` registers.

## Remarks

These are narrow transitions, not an arbitrary external `setStatus`. Responsibility,
scopes and parentage move through separate broker metadata operations and are
deliberately absent here.
