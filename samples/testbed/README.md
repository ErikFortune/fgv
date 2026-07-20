# @fgv/testbed

**Status:** Active — two scenarios shipped (B-3 local-classifier-safety, B-4a local-embedding-search);
shell wired to run them (B-5). See `.ai/tasks/active/local-ai-exploration/brief.md` for the cluster contract.

Long-lived sample browser app + companion CLI showcasing fgv capabilities. Scenarios are
first-class entities: a scenario module declares metadata (id, title, category, tags), an
optional web React component, and/or an optional CLI `run` function. The shell composes
`@fgv/ts-app-shell` primitives — sidebar list + main scenario host + collapsible status bar
at the bottom.

## Quick start

```bash
# build the library code (heft)
rushx build

# run the unit tests with full coverage
rushx test

# build the browser bundle
rushx build:web

# launch the dev server
rushx dev

# list the available CLI scenarios (bare invocation)
rushx cli

# rebuild the generated data tree from data/
rushx build:data
```

## Running scenarios

A scenario can expose a **web** surface (a React component in the browser app), a **CLI**
surface (a `run` function), or both. Run them two ways:

### CLI

The CLI shim is `bin/testbed.js` (also wired as `rushx cli`). Build first (`rushx build`),
then:

```bash
# list every scenario with its id and which surfaces it has
node bin/testbed.js
node bin/testbed.js --help          # usage banner

# run a single scenario by id
node bin/testbed.js --scenario sqlite-vec-fragment-persistence
node bin/testbed.js --scenario sqlite-vec-memory-persistence
```

`rushx cli` runs the same shim (`rushx cli` to list; `rushx cli -- --scenario <id>` to pass
flags through). Structured output goes to stdout; scenario diagnostics go to stderr.

### Web

```bash
rushx dev            # webpack dev server — pick scenarios from the sidebar
rushx build:web      # production bundle into dist-web/
```

Only scenarios with a web surface appear in the sidebar.

### Two things to know

- **Some scenarios are CLI-only.** Any scenario that uses a Node-native dependency —
  `better-sqlite3` (the `sqlite-vec-*` scenarios) or the local ONNX runtime (the `local-*`
  scenarios) — loads it via a `webpackIgnore` dynamic import so it never enters the browser
  bundle. Those scenarios therefore have **no web surface** and run only under
  `--scenario <id>`.
- **Live-model scenarios need network.** Scenarios that embed/classify/summarize with a local
  `@huggingface/transformers` model (`Xenova/*`) download the model from `huggingface.co` on
  first run and cache it. In a network-restricted environment that fetch is blocked and the
  scenario fails at model load (`Forbidden access to huggingface.co`); run them where
  `huggingface.co` is reachable. The **unit tests** stub the model with a deterministic
  embedder, so `rushx test` covers the real logic (including the actual file-backed
  `sqlite-vec` round-trip) fully offline.

## Adding a scenario

See [`src/conventions.md`](./src/conventions.md). Short version: drop a file under
`src/scenarios/`, append it to the registry in `src/scenarios/index.ts`, and write tests.

## Layout

```
src/
  cli.ts                 # CLI entry (orchestration glue c8-ignored)
  shell/                 # IScenario contract + IScenarioContext plumbing
    index.ts
    secretResolver.ts
  scenarios/             # one file per scenario, registered manually in index.ts
    index.ts
  web/
    App.tsx              # composed shell — testable
    index.tsx            # ReactDOM mount — c8-ignored
  generated/             # checked-in build-data.ts output
    dataFileTree.ts
data/                    # source YAML/JSON consumed by scripts/build-data.ts
scripts/
  build-data.ts          # manually invoked via `rushx build:data`
bin/
  testbed.js             # CLI shim invoked by package.json `bin`
```

## Scenarios

The scenario registry grows over time, so rather than duplicate it here (and let it drift),
list the current set — with ids and which surfaces each exposes — straight from the CLI:

```bash
node bin/testbed.js        # or: rushx cli
```

The registry itself is [`src/scenarios/index.ts`](./src/scenarios/index.ts).

## Cluster context

This package is part of the `local-ai-exploration` orchestrator cluster.
Phase B-1 scaffolded the shell; B-2 populated the transformer facades;
B-3 added the classifier-safety scenario; B-4a added the embedding-search scenario;
B-5 wired the shell and CLI to actually run them.
The testbed keeps growing scenarios over time.
