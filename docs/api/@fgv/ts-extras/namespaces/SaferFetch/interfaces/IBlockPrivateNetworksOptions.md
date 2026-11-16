[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IBlockPrivateNetworksOptions

# Interface: IBlockPrivateNetworksOptions

Options shared by [blockPrivateNetworksPolicy](../functions/blockPrivateNetworksPolicy.md) and the address guard built over it.

## Extended by

- [`IBlockPrivateNetworksGuardOptions`](IBlockPrivateNetworksGuardOptions.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-allowloopback"></a> `allowLoopback?` | `readonly` | `boolean` | Permits `127.0.0.0/8` and `::1` (and their IPv4-mapped forms). Off by default: the polarity that ships a guard permitting `http://127.0.0.1:6379/` so a local-development convenience keeps working is the wrong one. A caller talking to a local sidecar opts in here, and the opt-in is independently greppable at the call site. |
