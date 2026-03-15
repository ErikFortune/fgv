# Chocolate Lab Web UI Components and Web App

We will build a set of components to handle presentation and modification of entities defined in the ts-chocolate library, and use those components to build a full-featured chocolate kitchen app called "Chocolate Lab Web Edition".

## Chocolate UI components

The chocolate-lab-ui package will contain a set of components to handle presentation and modification of entities defined in the ts-chocolate library.

The UI library and application can assume that they work in the context of a Workspace and utilize materialized runtime objects (rather than normalized raw data-layer entities), with the possible exception of key-generation and keystore operations.

For each supported runtime object, we will define one or more components to handle presentation and editing of the associated object, either as the primary view or as a modal, panel or embedded component.

A primary workspace view will maintain the library and implement hooks to orchestrate typical UX workflows or actions.  The workspace will also anchor an ObservabilityContext (see ts-res-ui-components) for use by all child components and provide a common implementation of a messages window (integrated with the observability context) which allows filtered display of messages.

The UI library might provide other components or helper functions as needed, but only for web- or-browser specific functionality - anything that is also applicable to node.js should go into the base ts-chocolate library.

The UI library should have thorough tests and generated tsdocs (see ts-res-ui-components for examples).

## Chocolate Lab Web Application

The chocolate-lab-web app will provide a full-featured chocolate kitchen experience using the ts-chocolate library and components from the chocolate-lab-ui package.

### Modes of operation

The app supports three primary modes of operation, each of which is comprised of several (tabbed) views:
1. Production mode - manage live sessions, a journal of past sessions and inventory of molds and ingredients
2. Library mode - manage ingredients, molds, filling and confection recipes, tasks and procedures.
3. Settings mode - manage user preferences, workspace settings and integration configurations.

#### Navigation Between Views

Navigation between views in either mode is via a horizontal tab control in the header.  Whether we have a single header for all views or toggle between production & library is tbd.

#### View Sidebars
For consistency across modes, the app will use a consistent color scheme, typography and layout - each view will have a sidebar which consists of:
1. a search box (optional and suppressed for entities that don't support search)
2. a collapsible set of entity-specific filters
3. a collapsible collection management section which lists and allows management of the collections available within that particular view.  Suggest a column of one tile per collection, with a summary and buttons for various available actions.

A reusable sidebar should be one of the components from the chocolate-lab-ui package, with pluggable filters and search.  Collection presentation can probably be shared across all object types (perhaps with a template parameter for the object type).

#### Main Pane
The main pane will display 1, or more columns of content, resizing or expanding to the right with horizontal scrolling as needed.   The starting view will typically be a collection (list, tile, or grid view) of the available entities, filtered by the sidebar filters & search.

The intent is that a sequence of related actions can be carried out in a single view without navigating away.

For example, we might be working in a session and decide to edit the confection recipe that we are producing, which opens a column to the right.   We could then decide to edit one of the fillings in the confection recipe, which opens another column.  While editing the filling, we decide to add an ingredient, which expands to the right again.  At the completion of each step, the associated pane closes and we return to the parent.

For library views, consider integrating ways to easily leverage AI agents to find e.g. ingredient details.  An earlier prototype had a "copy instructions" button that produced agent instructions suitable for online agents like chatgpt or grok, which instructed them to return results a a JSON object matching the corresponding entity, plus a drop target that accepted the answer and used it to fill a form.   That was a little clunky but still very useful, so that's our min bar - if we can come up with a cleaner integration, we should.

#### Messages Pane

A collapsible message panel (implemented in the chocolate-lab-ui package) should sit across the bottom of the main panel, collapsed by default.  When collapsed it should show simple status (e.g. a count of messages and possibly a live status).

### Implementation Details

Rely on the packages from this monorepo first, and follow all MONOREPO coding guidelines and best practices, including:
- use of the Result pattern with chaining
- no unsafe cast - prefer union types or templated classes to generic base classes that cannot be distinguished with a simple type guard.

For consistency with other applications in the monorepo we will use tailwind CSS and heroicons, and we will use Webpack due to limitations of Vite when working within a monorepo.

When in doubt or when something seems off, look at the ts-res-browser application and ts-res-ui-components configuration for inspiration - we encountered and solved a number of odd issues with tailwind configuration and so forth.

We can make changes to any library in the monorepo as needed.  ts-chocolate is brand new with no external dependencies, so we can make breaking changes - compatibility shims or re-exports are *NOT* required and are strongly discouraged - the complexity they introduce is counterproductive.

ts-utils and most other libraries have been deployed for years, so we should try to stick to non-breaking additive changes in those.

All libraries export a browser index that should be safe in browser applications.  If we discover a need to polyfill, start a side quest to fix the underlying issue in the library rather than just adding a polyfill or other workaround.

Use the FileTree abstraction for all chocolate library I/O.  There are in-memory and node-specific implementations in ts-json-base, a zip-compatible file tree in ts-extras and versions for both the browser file API and browser local storage in ts-web-extras.

### Test

Always focus first on testing *functionality* - ensure that we have tests for all important behaviors, both positive and negative, including edge cases and error conditions.

Do not focus on measured coverage during active development - when each development phase winds down we'll assess coverage gaps and appropriate disposition (e.g. fix vs annotate).

In general:
- gaps that represent some externally observable functionality (including error behavior) should be closed by adding tests.
- tests that use complicated mocks or sophisticated techniques to inject implementation-specific errors are discouraged - such tests are brittle and hard to maintain.
- defense in depth tests that should not be hit in practice can be annotated to exclude them from coverage
- files that contain only barrel exports (e.g browser.index.ts) can be omitted entirely in the jest config
- we have experienced intermittent coverage gaps in code that is clearly covered - such gaps can be annotate for exclusion *but* they must have a comment indicating the reason for exclusion including the word "coverage"

note that proper use of the result pattern greatly reduces the number of required "defense-in-depth" exclusions required, and rewriting code to properly use the result pattern is the preferred means of resolving such issues.  For example:

```typescript

// the if statement below is unreachable if doSomething doesn't fail so needs annotation
const fooResult = doSomething();
if (fooResult.isFailure()) {
    return Failure.with(`Oops! ${fooResult.error}`);
}
return doSomethingElse(fooResult.value);

// whereas this is easier to read *and* does not require annotation
return doSomething()
    .withErrorMessage((msg) => `Oops! ${msg}`);
    .onSuccess((foo) => doSomethingElse(foo));

```

