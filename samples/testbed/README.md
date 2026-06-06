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

# run the CLI
rushx cli

# rebuild the generated data tree from data/
rushx build:data
```

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

| id | Title | Surfaces |
|----|-------|---------|
| `local-classifier-safety` | Local Classifier Safety | web, cli |
| `local-embedding-search` | Local Embedding Search | web, cli |

## Cluster context

This package is part of the `local-ai-exploration` orchestrator cluster.
Phase B-1 scaffolded the shell; B-2 populated the transformer facades;
B-3 added the classifier-safety scenario; B-4a added the embedding-search scenario;
B-5 wired the shell and CLI to actually run them.
The testbed keeps growing scenarios over time.
