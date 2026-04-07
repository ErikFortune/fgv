# ts-res getting started sample

This sample shows how to:

- declare a resource object type
- configure a few qualifiers
- import mixed JSON and YAML sample data from the filesystem
- resolve a single item
- resolve a composed resource
- manually compose a result by resolving all matches and flattening them yourself

## Layout

- `src/index.ts` - sample entry point
- `src/resources/` - resource files imported from the filesystem

## Notes

The sample keeps the resource files in the package so the filesystem import can load them through `ImportManager`.
It uses structured file names so qualifiers are visible directly in the import path.
