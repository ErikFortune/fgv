[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceCapabilities

# Interface: ISourceCapabilities

What a source declares about stopping one binding (design § 5, § 10 step 6).

## Remarks

- `pause: 'stable-until-explicit-resume'` — an acknowledged pause prevents autonomous restart or
  new work until an explicitly authorized resume. Only this makes a paused target `confirmed`.
- `pause: 'sampled'` — the source can report a paused state, but it may restart on its own: the
  target is `unsupported` for a standing stop even when observed paused.
- `cancel: 'terminal-absorbing'` — a terminal state never reopens.

`pauseCommand` / `cancelCommand` name the command the kind registry declares for the mode, and its
parameters; a mode declared without one is not stoppable. `contractVersion` is persisted as
evidence and compared after every reopen. **No library assertion manufactures external fencing**:
this is the source's declaration, and a later contradicting observation degrades the stop.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-cancel"></a> `cancel` | `readonly` | `"unsupported"` \| `"terminal-absorbing"` |
| <a id="property-cancelcommand"></a> `cancelCommand?` | `readonly` | [`ISourceStopCommand`](ISourceStopCommand.md) |
| <a id="property-contractversion"></a> `contractVersion` | `readonly` | `string` |
| <a id="property-pause"></a> `pause` | `readonly` | `"unsupported"` \| `"sampled"` \| `"stable-until-explicit-resume"` |
| <a id="property-pausecommand"></a> `pauseCommand?` | `readonly` | [`ISourceStopCommand`](ISourceStopCommand.md) |
