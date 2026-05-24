# @fgv/testbed

**Status:** shipping — two scenarios live (`local-classifier-safety`, `local-embedding-search`); the sample-browser shell + scenario contract are established and grow over time. See
`.ai/tasks/completed/2026-05/local-ai-exploration/brief.md` for the cluster contract.

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

## Cluster context

This package was scaffolded as phase B-1 of the `local-ai-exploration` orchestrator cluster.
Phase B-2 populates the companion `@fgv/ts-extras-transformers` /
`@fgv/ts-web-extras-transformers` packages; phase B-3 lands the first scenario (a local
classifier wired as an `IPromptSafetyPolicy` backend) and runs the done-or-discard gate on
the facade. The testbed itself is not gated on that outcome — it keeps growing scenarios
over time.
