[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / createNodeWorkspace

# Function: createNodeWorkspace()

> **createNodeWorkspace**(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Workspace`](../classes/Workspace.md)\>

Defined in: [ts-chocolate/src/packlets/workspace/nodeFactory.ts:34](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/workspace/nodeFactory.ts#L34)

Creates a workspace with Node.js platform defaults.
Uses nodeCryptoProvider for key store and encryption operations.

## Parameters

### params?

[`IWorkspaceFactoryParams`](../interfaces/IWorkspaceFactoryParams.md)

Workspace creation parameters (without crypto provider)

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Workspace`](../classes/Workspace.md)\>

Success with workspace, or Failure if creation fails
