# Tutorial Sample Data

Every file in this tree is YAML. The ts-res library natively reads JSON;
the tutorial plugs a YAML preprocessor into the importer so that `.yaml`
files are parsed into JSON before the normal import pipeline runs. See
`../src/lessons/lesson02Import.ts` for the wiring and `../README.md` for
the narrative.

## Layout

```
data/
├── config/
│   └── system.yaml       # Qualifier types, qualifiers, resource types
└── resources/
    ├── strings.yaml      # Language + territory priority demo
    ├── theme.yaml        # Composition with full + partial candidates
    └── icons.yaml        # Custom density qualifier type demo
```

## Resource IDs

The importer prefixes every resource id with the path it was imported
from (parent directories + file basename), so after loading this tree
you get:

```
resources.strings.greetings
resources.strings.uiLabels
resources.theme.theme
resources.icons.icons
```

## Why YAML?

Nothing in ts-res is YAML-specific. The importer accepts any
`Converter<JsonValue>` as a content preprocessor plus a list of file
extensions to apply it to. The tutorial uses `@fgv/ts-extras`
`Yaml.yamlConverter` as the preprocessor, but you could swap in a TOML
parser, JSON5, a templated format, or anything else that produces a
`JsonValue`.
