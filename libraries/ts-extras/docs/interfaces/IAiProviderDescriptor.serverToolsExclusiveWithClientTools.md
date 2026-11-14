[Home](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > serverToolsExclusiveWithClientTools

## IAiProviderDescriptor.serverToolsExclusiveWithClientTools property

Server tools this provider's API refuses to accept in the *same request* as
client (function) tools. Absent or empty means the provider imposes no such
constraint and any supported server tool may be mixed with client tools.

**Signature:**

```typescript
readonly serverToolsExclusiveWithClientTools: readonly "web_search"[];
```
