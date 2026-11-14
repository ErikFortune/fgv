[Home](../../README.md) > [SaferFetch](../README.md) > [IAddressGuard](./IAddressGuard.md) > check

## IAddressGuard.check() method



**Signature:**

```typescript
check(chain: readonly IRequestHop[]): Promise<Result<IGuardVerdict>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>chain</td><td>readonly IRequestHop[]</td><td>Every hop so far, oldest first. The URL under consideration is the last
entry; `chain.length === 1` is the initial request. There is deliberately no separate
"is this a redirect" flag — hop 0 is not a special case, and a guard that compares only
against the immediately previous hop cannot see an `A → B → A` laundering hop.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IGuardVerdict](../../interfaces/IGuardVerdict.md)&gt;&gt;
