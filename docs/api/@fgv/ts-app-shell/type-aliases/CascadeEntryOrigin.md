[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / CascadeEntryOrigin

# Type Alias: CascadeEntryOrigin

> **CascadeEntryOrigin** = `"primary"` \| `"nested"`

How a cascade entry was opened — determines save/cancel behavior.

- `'primary'` — selected from the entity list. Save/cancel transitions to view mode in-place.
- `'nested'` — reached via drill-down, typeahead-create, or sub-entity editing. Save/cancel pops (removes entry).

Entries without an explicit origin are treated as `'primary'` for backwards compatibility.
