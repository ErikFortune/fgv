[Home](../README.md) > [IResult](./IResult.md) > shouldNotFail

## IResult.shouldNotFail() method

Asserts at the call site that this IResult | result MUST be a success.
Returns the value on success; on failure, throws an `Error` whose message
is composed from the original failure message and the captured call-site
location (file, line, and where useful function name).

**Signature:**

```typescript
shouldNotFail(label?: string, frameDepth?: number): T;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>label</td><td>string</td><td>Optional human-meaningful identifier (e.g. the constant
name) prefixed to the error message.</td></tr>
<tr><td>frameDepth</td><td>number</td><td>Optional 1-indexed depth into the caller stack.
Default `1` (immediate caller). Library authors wrapping `shouldNotFail`
inside their own helper pass `2` to attribute to their caller.</td></tr>
</tbody></table>

**Returns:**

T

The result value, if the operation was successful.
