[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / defaultStringEqualityQualifierResolver

# Variable: defaultStringEqualityQualifierResolver

> `const` **defaultStringEqualityQualifierResolver**: [`IQualifierResolver`](../interfaces/IQualifierResolver.md)

Default [IQualifierResolver](../interfaces/IQualifierResolver.md) — naive string equality on the supplied
(defined) axes. Records resolved under a richer ts-res match (e.g. BCP47
`lang=fr-CA` matching a candidate gated on `lang=fr`) will NOT be returned
by a query asking for the broader axis value under this resolver. See
[IQualifierResolver](../interfaces/IQualifierResolver.md) for the broader contract and the rationale for
the divergence.
