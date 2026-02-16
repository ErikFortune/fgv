[Home](../README.md) > [EditedDecoration](./EditedDecoration.md) > setRating

## EditedDecoration.setRating() method

Sets or updates a rating for a specific category.

**Signature:**

```typescript
setRating(category: RatingCategory, score: RatingScore, notes?: readonly ICategorizedNote[]): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>category</td><td>RatingCategory</td><td>Rating category</td></tr>
<tr><td>score</td><td>RatingScore</td><td>Rating score (1-5)</td></tr>
<tr><td>notes</td><td>readonly ICategorizedNote[]</td><td>Optional categorized notes</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success
