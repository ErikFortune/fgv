[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / ConditionSetToken

# Type Alias: ConditionSetToken

> **ConditionSetToken** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"ConditionSetToken"`\>

A string representing a validated condition set token.  Condition set tokens are
typically extracted from the name of some resource (e.g. file or folder) being
imported.  A condition set token is a comma-separated list of one or more
[condition tokens](ConditionToken.md), where a condition token has either
the form `<qualifierName>=<value>` or `<value>`.
