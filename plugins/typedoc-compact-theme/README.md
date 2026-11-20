# @fgv/typedoc-compact-theme

A [TypeDoc](https://typedoc.org/) plugin that writes API documentation as compact Markdown pages,
with members laid out in tables in the style of
[api-documenter](https://api-extractor.com/pages/setup/generating_docs/). It produces the `docs/`
folders of the fgv monorepo's libraries.

## Installation

```sh
npm install --save-dev @fgv/typedoc-compact-theme typedoc typedoc-plugin-markdown
```

`typedoc` (`>=0.28`) and `typedoc-plugin-markdown` (`>=4`) are peer dependencies.

## Usage

Load it as a TypeDoc plugin and set `out`:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "plugin": ["@fgv/typedoc-compact-theme"],
  "entryPoints": ["../src/index.ts"],
  "out": "../docs"
}
```

```sh
typedoc --options ./config/typedoc.json
```

Inside the monorepo, each library's `config/typedoc.json` loads the plugin by relative path
(`../../../plugins/typedoc-compact-theme/lib/index.js`) and extends
`typedoc.compact-base.json` from [`@fgv/heft-dual-rig`](../../rigs/heft-dual-rig), which excludes
private, protected and internal members and maps `@fgv/*` symbols to their docs on GitHub.

## Output

The plugin replaces TypeDoc's renderer rather than theming it. Once TypeDoc has resolved the
project, the plugin **deletes the `out` directory**, writes its own Markdown into it, and exits the
process, so TypeDoc's HTML output never runs. Point `out` at a directory that holds nothing else.

`out/README.md` is the index. Declarations go in `classes/`, `interfaces/`, `enums/`,
`type-aliases/`, `functions/` and `variables/`, and each namespace gets its own directory with the
same layout. Class and interface pages list properties (including accessors) and methods in tables.

## Options

| option | default | effect |
|---|---|---|
| `includeInheritedMemberPages` | `false` | write a detail page for each inherited member, instead of linking to the declaring type's page |

## License

MIT — see [LICENSE](./LICENSE).
