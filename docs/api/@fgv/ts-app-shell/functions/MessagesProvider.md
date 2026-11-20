[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / MessagesProvider

# Function: MessagesProvider()

> **MessagesProvider**(`props`): `ReactElement`

Provides the global message stream to the component tree.

On mount, runs a one-shot probe that detects whether the consuming app's Tailwind
configuration is missing the `@fgv/ts-app-shell` content path. The probe applies a
sentinel arbitrary-value class ([TAILWIND\_PROBE\_CLASS](../variables/TAILWIND_PROBE_CLASS.md)) that is vanishingly
unlikely to appear in any consumer's source — Tailwind will only generate the rule
when it scans the package's built JS via the content path. If the probe finds the
element unsized, a `'warning'` message is appended to the stream with a link to the
setup documentation. The probe runs exactly once per provider lifecycle (idempotent
under React.StrictMode double-render and HMR) and uses inline styles so it is not
affected by the failure mode it detects.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`IMessagesProviderProps`](../interfaces/IMessagesProviderProps.md) |

## Returns

`ReactElement`
