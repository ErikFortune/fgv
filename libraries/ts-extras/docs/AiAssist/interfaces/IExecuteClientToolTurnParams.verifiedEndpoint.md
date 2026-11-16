[Home](../../README.md) > [AiAssist](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > verifiedEndpoint

## IExecuteClientToolTurnParams.verifiedEndpoint property

The host's assertion that `endpoint` reaches the descriptor's own provider, so this request's
schemas are adapted with that provider's keyword table instead of the conservative one.
Ignored without `endpoint`, and honoured only as `IAiVerifiedEndpoint` describes.

**Signature:**

```typescript
readonly verifiedEndpoint: IAiVerifiedEndpoint;
```
