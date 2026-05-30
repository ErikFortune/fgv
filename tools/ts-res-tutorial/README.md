# @fgv/ts-res-tutorial

A hands-on, end-to-end tutorial for the [`@fgv/ts-res`](../../libraries/ts-res)
multidimensional resource management library. It walks through the five
concepts you actually need to build something with ts-res:

1. Loading a qualifier configuration.
2. Setting up the importer with a pre-processor so you can load YAML
   (or any other serialization) transparently.
3. Wiring the runtime - context qualifier provider, custom qualifier
   types, resource resolver.
4. Resolving resources in all four supported ways - best match, all
   matches, composed, and manually composed.
5. Letting the importer infer qualifiers from folder and file names,
   and composing resource ids from the filesystem layout.

Unlike [`@fgv/ts-res-cli`](../ts-res-cli), this package is not a tool.
It is a small, commented application that you are meant to read as much
as run. Every lesson lives in its own file, each function takes an
`ITutorialPrinter` so tests can capture and assert on the narrative,
and the sample data is YAML on purpose - it demonstrates the importer
preprocessor end to end.

## Running the tutorial

From the repo root:

```bash
rush install
rush build --to @fgv/ts-res-tutorial
```

From `tools/ts-res-tutorial`:

```bash
rushx lesson1   # just lesson 1
rushx lesson2   # lessons 1 + 2
rushx lesson3   # lessons 1 + 2 + 3
rushx lesson4   # lessons 1 + 2 + 3 + 4
rushx lesson5   # lesson 1 + 5 (lesson 5 is independent of 2-4)
rushx all       # everything in one run
```

Every lesson after lesson 1 depends on the output of the previous one,
so the CLI runs the prerequisites for you when you invoke a single
lesson directly.

## Tutorial layout

```
tools/ts-res-tutorial/
├── data/
│   ├── config/system.yaml           # Qualifier types + qualifiers + resource types
│   ├── resources/                   # Lessons 2-4 (explicit conditions)
│   │   ├── strings.yaml             # Language + territory priority demo
│   │   ├── theme.yaml               # Composition with full + partial candidates
│   │   └── icons.yaml               # Custom density qualifier type demo
│   └── inferred/                    # Lesson 5 (path-inferred conditions)
│       ├── messages.yaml            # default
│       ├── messages.fr.yaml         # language=fr (tokenless filename)
│       ├── messages.US.yaml         # territory=US (tokenless filename)
│       ├── messages.geo=GB,lang=en.yaml  # comma-separated tokens
│       ├── en/messages.yaml         # language=en (tokenless folder)
│       └── geo=CA/                  # territory=CA (explicit geo token)
│           ├── messages.yaml
│           └── lang=fr/messages.yaml  # stacked: CA + fr
└── src/
    ├── cli.ts                       # Commander wiring, kept intentionally thin
    ├── lessons/
    │   ├── lesson01LoadConfig.ts
    │   ├── lesson02Import.ts
    │   ├── lesson03Runtime.ts
    │   ├── lesson04Resolve.ts
    │   └── lesson05Inference.ts
    ├── qualifierTypes/
    │   ├── densityQualifierType.ts         # Custom QualifierType subclass
    │   └── densityQualifierTypeFactory.ts  # Config factory that builds it
    └── utils/
        ├── paths.ts                 # Paths to the bundled sample data
        └── printer.ts               # ITutorialPrinter abstraction
```

## Lesson 1 - Loading a qualifier configuration

`src/lessons/lesson01LoadConfig.ts`

A ts-res application needs a _system configuration_ that declares:

- the **qualifier types** it understands (language, territory, literal,
  custom types like `density`),
- the named **qualifiers** that reference those types (and their priorities),
- the **resource types** your resources are allowed to be.

Lesson 1 does three things in sequence:

1. Calls `Config.getPredefinedSystemConfiguration('default')` and
   inspects the result. Use this when you just want territory + language
   and nothing else - ts-res ships `default`, `language-priority`,
   `territory-priority` and `extended-example`.

2. Loads a custom configuration from `data/config/system.yaml`. To show
   the moving parts we read the YAML file by hand, pipe it through
   `Yaml.yamlConverter(JsonConverters.jsonObject)` from `@fgv/ts-extras`,
   then hand the parsed declaration to
   `Config.Convert.systemConfiguration.convert(...)` to validate its
   shape.

3. Builds the validated declaration into a `SystemConfiguration` while
   injecting a `QualifierTypeFactory` that knows about our custom
   `density` type. Without the custom factory, the built-in factory
   would fail at `systemType: density` because it only handles
   `language`, `territory`, and `literal`.

The key detail is that `Config.QualifierTypeFactory`'s constructor
automatically appends the built-in factory to the end of the chain, so
you only have to supply your own additions.

## Lesson 2 - Importing YAML transparently

`src/lessons/lesson02Import.ts`

`ImportManager.create()` accepts two parameters that turn the importer
into a general "read resources from files" pipeline:

```ts
Import.ImportManager.create({
  resources: resourceManagerBuilder,
  fileTree: FileTree.forFilesystem().orThrow(),
  fileContentConverter: Yaml.yamlConverter(JsonConverters.jsonObject),
  fileContentExtensions: ['.yaml', '.yml']
});
```

- `fileContentConverter` is any `Converter<JsonValue>`. Its job is to
  turn raw file text into a JSON value the rest of the pipeline can
  consume. It runs **before** the normal JSON import logic.
- `fileContentExtensions` tells the importer which extensions should
  flow through the converter. `.json` is still handled natively, so
  you can mix JSON and YAML in the same folder if you want.

The lesson then calls `importFromFileSystem(RESOURCES_ROOT)` to walk
the tree. The imported resource IDs look like
`resources.strings.greetings`, `resources.theme.theme`,
`resources.icons.icons` - the importer prefixes every explicit `id`
inside the collection with the path it came from (parent directories
+ file basename).

Nothing in the lesson code mentions YAML past the one-line converter
setup. That is the whole point: a new file format is exactly one
`Converter<JsonValue>` away.

## Lesson 3 - Wiring the runtime

`src/lessons/lesson03Runtime.ts`

At runtime you need two objects of your own:

- A **context qualifier provider** that holds the current values of
  every qualifier. The tutorial uses
  `Runtime.ValidatingSimpleContextQualifierProvider`, which accepts
  plain `Record<string, string>` and validates the values against the
  qualifier collection.
- A **resource resolver** that combines the resource manager, the
  qualifier types, and the context provider. It owns O(1) caches for
  condition, condition set, and decision resolution results.

Lesson 3 also demonstrates `resolver.withContext({...})`, which returns
a brand-new resolver tied to a different context provider while sharing
the same built resources. That's the supported way to evaluate the
same resource set under multiple contexts.

### Custom qualifier types

Lesson 3 relies on the `DensityQualifierType` shipped under
`src/qualifierTypes/`:

- `DensityQualifierType` subclasses `QualifierTypes.QualifierType` and
  overrides `isValidConditionValue` and `_matchOne`. It recognises five
  Android-style density buckets (`ldpi` → `xxhdpi`) and gives adjacent
  buckets a partial match so that "close" is still useful.
- `DensityQualifierTypeFactory` implements
  `Config.IConfigInitFactory<IAnyQualifierTypeConfig, QualifierType>`,
  matches on `config.systemType === 'density'`, and otherwise fails so
  the chained built-in factory can take over.

This is the only pattern you need to know to add a qualifier type.

## Lesson 4 - Resolving resources

`src/lessons/lesson04Resolve.ts`

There are four resolution strategies, and each one has a right place to
use it:

| Strategy | API | When you want it |
|---|---|---|
| Best match | `resolver.resolveResource(id)` | "Just give me the winning candidate." This is the normal case. |
| All matches | `resolver.resolveAllResourceCandidates(id)` | Debugging, fallbacks, rendering every alternate. Returns descending priority. |
| Composed | `resolver.resolveComposedResourceValue(id)` | Theme-style overlays. Finds the highest-priority full candidate as the base and deep-merges higher-priority partial candidates on top. |
| Manually composed | `JsonEditor.create(...).mergeObjectsInPlace(...)` on candidates you picked yourself | When you need custom composition rules, extra inputs from outside the resource system, or to pick a non-standard subset of candidates. |

The lesson exercises every strategy against the bundled resources:

- `resources.strings.greetings` demonstrates best-match and all-matches
  behaviour. With the default context (`language=fr`,
  `currentTerritory=CA`, `theme=dark`, `density=xhdpi`) and the
  territory-priority qualifier ordering, the combined `fr + CA`
  candidate wins.
- `resources.icons.icons` shows that the custom density type allows
  _partial_ matches: with `density=xhdpi` the candidates for `xhdpi`
  (best), `hdpi` and `xxhdpi` (adjacent, partial) all appear in
  `resolveAllResourceCandidates`.
- `resources.theme.theme` shows composition. The `theme=dark` candidate
  is the base; the `language=fr` partial overlays a new typography
  family; at `density=xxhdpi` a second partial would bump the base
  font size, but the active context is `xhdpi` so it doesn't fire.
- The manual composition section merges every theme candidate plus a
  synthetic runtime override into a fresh object using
  `JsonEditor.create({ merge: { arrayMergeBehavior: 'replace', nullAsDelete: true } })`.
  This is the escape hatch for anything the built-in composition can't
  express.

## Lesson 5 - Path-driven qualifier inference

`src/lessons/lesson05Inference.ts`

Lessons 2-4 put the conditions for each candidate inside the YAML file.
That's fine, but it means every file has to repeat the qualifier
structure even for trivial cases. The importer supports a much more
compact alternative: encode the conditions in **folder** and **file**
names.

### The inference rules

When the `FsItemImporter` walks a file tree it inspects the basename of
every folder and file and applies the following rules:

1. **Split on `.`**. The importer only inspects the LAST dot-separated
   segment for qualifier tokens. Everything else becomes the name
   fragment.
2. **Split the last segment on `,`**. Each piece is parsed as a
   `[qualifier=]value` pair.
3. **Explicit tokens** (`geo=CA`, `lang=fr`) are resolved by looking up
   the left-hand side as a qualifier name first, then as a qualifier
   token. Token names are declared in `data/config/system.yaml` via the
   `token` field.
4. **Tokenless values** (`CA`, `fr`) are only resolved when
   `tokenIsOptional: true`. The importer tries each token-optional
   qualifier's type validator in turn, and accepts the value only if
   exactly one qualifier matches. Our `system.yaml` sets
   `tokenIsOptional: true` on both `currentTerritory` and `language`;
   `CA` validates as a territory but not as a BCP47 language tag, and
   `fr` does the opposite, so the choice is unambiguous.
5. **Folders whose entire name parses as a token** contribute the
   condition but no name fragment, so you can add arbitrary
   organisational nesting without polluting the resource id.
6. **Path composition** joins every surviving name fragment, plus the
   explicit candidate `id` inside the file, with `.` to produce the
   final resource id.

### What the sample tree exercises

`data/inferred/` contains seven YAML files, all of which collapse to a
single resource id `inferred.messages.text` with one candidate each:

| File | Inferred conditions | Mechanism |
|---|---|---|
| `messages.yaml` | _(none)_ | default fallback |
| `messages.fr.yaml` | `language=fr` | tokenless value in filename |
| `messages.US.yaml` | `currentTerritory=US` | tokenless value in filename |
| `en/messages.yaml` | `language=en` | tokenless value in folder |
| `geo=CA/messages.yaml` | `currentTerritory=CA` | explicit token in folder |
| `geo=CA/lang=fr/messages.yaml` | `currentTerritory=CA, language=fr` | stacked tokens across folders |
| `messages.geo=GB,lang=en.yaml` | `currentTerritory=GB, language=en` | comma-separated tokens in one segment |

Notice that the YAML files themselves contain **no** `conditions`
blocks - the layout alone is enough.

### What the lesson prints

Lesson 5 imports the tree into its own resource manager, lists what the
importer discovered, and then resolves the resource under several
contexts so you can watch the priority rules you learned in Lessons 1
and 4 pick different candidates on the fly. Remember that
`currentTerritory` outranks `language` (850 vs 800), so a context like
`{ fr, US }` still selects the US candidate - the lesson includes a
`{ fr, DE }` case to show that language-only contexts do pick the
language candidate when no territory matches.

## Testing

```bash
rushx test
```

The tests live under `src/test/unit/`:

- `densityQualifierType.test.ts` covers the custom qualifier type and
  its factory comprehensively - this is the reusable unit.
- `lessons.test.ts` smoke-tests every lesson via the
  `CapturingTutorialPrinter` in `src/utils/printer.ts`. That way the
  tests run the _real_ lesson code (including the sample data) and can
  assert on what it produces without depending on the CLI layer or
  intercepting `console.log`.

## Where to go next

- [`libraries/ts-res/README.md`](../../libraries/ts-res/README.md) -
  the canonical ts-res documentation.
- [`tools/ts-res-cli`](../ts-res-cli) - a production CLI for compiling
  resource trees into bundles, filter contexts, and emit JS/TS code.
- [`data/test/ts-res`](../../data/test/ts-res) - the repo-wide sample
  data. Most of it predates the pre-processor; use this tutorial's
  bundled data as a YAML-native reference.
