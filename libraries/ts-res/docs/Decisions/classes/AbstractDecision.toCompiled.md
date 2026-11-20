[Home](../../README.md) > [Decisions](../README.md) > [AbstractDecision](./AbstractDecision.md) > toCompiled

## AbstractDecision.toCompiled() method

Converts this abstract decision to a compiled abstract decision representation.

**Signature:**

```typescript
toCompiled(options?: ICompiledResourceOptions): ICompiledAbstractDecision;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>ICompiledResourceOptions</td><td>Optional compilation options controlling the output format.</td></tr>
</tbody></table>

**Returns:**

[ICompiledAbstractDecision](../../interfaces/ICompiledAbstractDecision.md)

A compiled abstract decision object that can be used for serialization or runtime processing.
