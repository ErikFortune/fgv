[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > changePassword

## KeyStore.changePassword() method

Changes the master password.
Re-encrypts the vault with the new password-derived key.

**Signature:**

```typescript
changePassword(currentPassword: string, newPassword: string): Promise<Result<KeyStore>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>currentPassword</td><td>string</td><td>Current master password (for verification)</td></tr>
<tr><td>newPassword</td><td>string</td><td>New master password</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[KeyStore](../../classes/KeyStore.md)&gt;&gt;

Success when password changed, Failure if locked or current password incorrect
