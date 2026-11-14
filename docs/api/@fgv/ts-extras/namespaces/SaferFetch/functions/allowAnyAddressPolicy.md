[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / allowAnyAddressPolicy

# Function: allowAnyAddressPolicy()

> **allowAnyAddressPolicy**(): [`IAddressPolicy`](../interfaces/IAddressPolicy.md)

Creates a policy that permits every address, including loopback, link-local
and private ones.

**This policy provides no protection whatsoever.** It classifies nothing,
rejects nothing, and never fails — not even for an empty address list or an
address that is not a well-formed literal. It exists so that choosing to go
without an address guarantee is a deliberate, named, greppable act at the
call site rather than something reachable by omission, and so that tests and
genuinely trusted-input paths do not hand-roll something worse.

It is the only correct choice in a browser, where neither name resolution nor
redirect interposition is available and no address guarantee is possible.

## Returns

[`IAddressPolicy`](../interfaces/IAddressPolicy.md)

the policy.
