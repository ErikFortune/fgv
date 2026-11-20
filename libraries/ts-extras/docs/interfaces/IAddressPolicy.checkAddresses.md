[Home](../README.md) > [IAddressPolicy](./IAddressPolicy.md) > checkAddresses

## IAddressPolicy.checkAddresses() method

Decides whether a connection may be made to a destination that resolved to
`addresses`.

**Signature:**

```typescript
checkAddresses(addresses: readonly string[]): Result<IAddressCheckVerdict>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>addresses</td><td>readonly string[]</td><td>every address the destination resolved to, or the
single literal address when the destination was an IP literal.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IAddressCheckVerdict](IAddressCheckVerdict.md)&gt;

`Success` with the IAddressCheckVerdict | verdict when
*every* address is permitted, `Failure` naming every address that is not.
An empty list is a failure for any policy that offers a guarantee: nothing
was verified, so nothing may be reached.
