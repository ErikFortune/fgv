[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / McpOAuthClientProvider

# Type Alias: McpOAuthClientProvider

> **McpOAuthClientProvider** = `OAuthClientProvider`

The MCP SDK's OAuth client provider — the object that holds a client's registration and tokens
and starts the interactive authorization — under this package's name.

## Remarks

This is the SDK's own `OAuthClientProvider` interface from
`@modelcontextprotocol/sdk/client/auth.js`, unchanged: implement it (over your own keystore, for
example) and pass it as [IMcpHttpTransportParams.authProvider](../interfaces/IMcpHttpTransportParams.md#property-authprovider). The package wraps it before
handing it to the SDK, so that the interactive steps — `state`, `saveCodeVerifier` and
`redirectToAuthorization` — run only inside [connectMcpSession](../functions/connectMcpSession.md).
