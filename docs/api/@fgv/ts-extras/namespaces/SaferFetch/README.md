[**@fgv Monorepo API Documentation**](../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../README.md) / [@fgv/ts-extras](../../README.md) / SaferFetch

# SaferFetch

A safer `fetch` primitive with an explicit threat model.

This is deliberately **not** a thin, unopinionated boundary over an upstream library. There
is no upstream to wrap — `fetch` is a platform global — and the opinion *is* the product:
the deadlines, the scheme refusal, the streaming size cap, the redirect posture, and the
required address guard are the deliverable. A caller who strips the opinion out has `fetch`,
which is where they started.

The guiding constraint: *a primitive that advertises a guarantee it does not have is worse
than five lines at a call site, because it transfers responsibility without transferring
protection.* Every entry point's documentation names what it does **not** protect against
next to what it does.

## Classes

- [GuardedFetchError](classes/GuardedFetchError.md)

## Interfaces

- [IAddressCheckVerdict](interfaces/IAddressCheckVerdict.md)
- [IAddressGuard](interfaces/IAddressGuard.md)
- [IAddressPolicy](interfaces/IAddressPolicy.md)
- [IBlockPrivateNetworksGuardOptions](interfaces/IBlockPrivateNetworksGuardOptions.md)
- [IBlockPrivateNetworksOptions](interfaces/IBlockPrivateNetworksOptions.md)
- [IClassifiedAddress](interfaces/IClassifiedAddress.md)
- [IEmbeddedIpv4](interfaces/IEmbeddedIpv4.md)
- [IFetchTransport](interfaces/IFetchTransport.md)
- [IFetchTransportHints](interfaces/IFetchTransportHints.md)
- [IGuardedFetchOptions](interfaces/IGuardedFetchOptions.md)
- [IGuardVerdict](interfaces/IGuardVerdict.md)
- [IRequestGuard](interfaces/IRequestGuard.md)
- [IRequestHop](interfaces/IRequestHop.md)
- [IResolvedGuards](interfaces/IResolvedGuards.md)
- [IResponseBodyGuard](interfaces/IResponseBodyGuard.md)
- [IResponseHeadersGuard](interfaces/IResponseHeadersGuard.md)
- [IRetryPolicy](interfaces/IRetryPolicy.md)
- [ISaferFetchJsonOptions](interfaces/ISaferFetchJsonOptions.md)
- [ISaferFetchOptions](interfaces/ISaferFetchOptions.md)
- [ISaferFetchRequest](interfaces/ISaferFetchRequest.md)
- [ISaferFetchResponse](interfaces/ISaferFetchResponse.md)
- [ISaferFetchResponseHead](interfaces/ISaferFetchResponseHead.md)

## Type Aliases

- [AddressClassification](type-aliases/AddressClassification.md)
- [AddressFamily](type-aliases/AddressFamily.md)
- [FetchFailureKind](type-aliases/FetchFailureKind.md)
- [FetchFailureReason](type-aliases/FetchFailureReason.md)
- [FetchTimeoutPhase](type-aliases/FetchTimeoutPhase.md)
- [GuardedFetch](type-aliases/GuardedFetch.md)
- [HostResolver](type-aliases/HostResolver.md)
- [Ipv4EmbeddingKind](type-aliases/Ipv4EmbeddingKind.md)
- [SaferFetchMethod](type-aliases/SaferFetchMethod.md)
- [SaferFetchRedirectPolicy](type-aliases/SaferFetchRedirectPolicy.md)

## Variables

- [ALWAYS\_STRIPPED\_HEADERS](variables/ALWAYS_STRIPPED_HEADERS.md)
- [DEFAULT\_HEADERS\_TIMEOUT\_MS](variables/DEFAULT_HEADERS_TIMEOUT_MS.md)
- [DEFAULT\_MAX\_REDIRECTS](variables/DEFAULT_MAX_REDIRECTS.md)
- [DEFAULT\_MAX\_RESPONSE\_BYTES](variables/DEFAULT_MAX_RESPONSE_BYTES.md)
- [DEFAULT\_RETRY\_BASE\_DELAY\_MS](variables/DEFAULT_RETRY_BASE_DELAY_MS.md)
- [DEFAULT\_RETRY\_MAX\_DELAY\_MS](variables/DEFAULT_RETRY_MAX_DELAY_MS.md)
- [DEFAULT\_TIMEOUT\_MS](variables/DEFAULT_TIMEOUT_MS.md)
- [IDEMPOTENT\_METHODS](variables/IDEMPOTENT_METHODS.md)
- [nodeHostResolver](variables/nodeHostResolver.md)
- [platformFetchTransport](variables/platformFetchTransport.md)
- [REDIRECT\_STATUSES](variables/REDIRECT_STATUSES.md)
- [RETRY\_AFTER\_STATUSES](variables/RETRY_AFTER_STATUSES.md)
- [RETRYABLE\_HTTP\_STATUSES](variables/RETRYABLE_HTTP_STATUSES.md)
- [SAFER\_FETCH\_METHODS](variables/SAFER_FETCH_METHODS.md)
- [SUPPORTED\_SCHEMES](variables/SUPPORTED_SCHEMES.md)

## Functions

- [allowAnyAddress](functions/allowAnyAddress.md)
- [allowAnyAddressPolicy](functions/allowAnyAddressPolicy.md)
- [allowContentTypes](functions/allowContentTypes.md)
- [blockPrivateNetworks](functions/blockPrivateNetworks.md)
- [blockPrivateNetworksPolicy](functions/blockPrivateNetworksPolicy.md)
- [classifyAddress](functions/classifyAddress.md)
- [createGuardedFetch](functions/createGuardedFetch.md)
- [saferFetchBytes](functions/saferFetchBytes.md)
- [saferFetchJson](functions/saferFetchJson.md)
- [saferFetchText](functions/saferFetchText.md)
