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
│   └── system.yaml                # Qualifier types, qualifiers, resource types
├── resources/                     # Used by Lessons 2-4
│   ├── strings.yaml               # Language + territory priority demo
│   ├── theme.yaml                 # Composition with full + partial candidates
│   └── icons.yaml                 # Custom density qualifier type demo
└── inferred/                      # Used by Lesson 5 (path inference)
    ├── messages.yaml                       # default
    ├── messages.fr.yaml                    # language=fr (tokenless filename)
    ├── messages.US.yaml                    # territory=US (tokenless filename)
    ├── messages.geo=GB,lang=en.yaml        # GB+en (comma-separated tokens)
    ├── en/
    │   └── messages.yaml                   # language=en (tokenless folder)
    └── geo=CA/
        ├── messages.yaml                   # territory=CA (explicit "geo" token)
        └── lang=fr/
            └── messages.yaml               # CA + fr (stacked across folders)
```

## Resource IDs

The importer prefixes every resource id with the path it was imported
from (parent directories + file basename). After loading `data/resources/`
you get:

```
resources.strings.greetings
resources.strings.uiLabels
resources.theme.theme
resources.icons.icons
```

Every file under `data/inferred/` collapses to the same resource id:

```
inferred.messages.text
```

with a different candidate per file. Folders whose name is just a
qualifier token (`geo=CA`, `lang=fr`, or a tokenless value like `en`)
contribute a condition but no name fragment, so the id stays clean
regardless of how deeply nested the file is.

## Why YAML?

Nothing in ts-res is YAML-specific. The importer accepts any
`Converter<JsonValue>` as a content preprocessor plus a list of file
extensions to apply it to. The tutorial uses `@fgv/ts-extras`
`Yaml.yamlConverter` as the preprocessor, but you could swap in a TOML
parser, JSON5, a templated format, or anything else that produces a
`JsonValue`.
