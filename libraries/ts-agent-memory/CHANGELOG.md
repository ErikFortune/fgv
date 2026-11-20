# Change Log - @fgv/ts-agent-memory

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: a FileTree-backed storage and retrieval substrate for agent memory and knowledge — a vault of markdown records with YAML front matter that git can track.
- `FileTreeMemoryStore`: typed record bodies per kind, attributed edges, dedup, write policies, compare-and-set writes, and crash-safe atomic record writes on filesystem roots.
- Retrieval over an in-memory envelope index (by kind, tag, recency or rank), with semantic recall through the `IVectorIndex` and `IFragmentVectorIndex` seams and the in-memory cosine indexes.
- Index consistency: vector indexes report `size` / `has` and rebuild with a per-kind report, so a store can check its derived state against its records.

