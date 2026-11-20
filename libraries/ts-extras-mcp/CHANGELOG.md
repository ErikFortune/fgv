# Change Log - @fgv/ts-extras-mcp

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: a Result boundary over `@modelcontextprotocol/sdk` that connects to MCP servers and adapts their tools into `@fgv/ts-extras` ai-assist client tools for `executeClientToolTurn`.
- Stdio, HTTP and custom transports; `connectMcpSession`, `listMcpTools`, `callMcpTool` and `closeMcpSession` with timeouts, cancellation and a classified `McpFailureReason`.
- `adaptMcpTools` converts each tool's input schema through `JsonSchema.fromJson`, and reports every tool it cannot adapt instead of failing the whole list.

