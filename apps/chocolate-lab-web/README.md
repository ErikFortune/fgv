# Chocolate Lab Web Application

Interactive web application for chocolate recipe management and calculation.

## Overview

This web application provides:
- Ingredient database browsing
- Interactive recipe scaling
- Recipe composition visualization
- Custom ingredient and recipe management

### Structure
The Chocolate Lab application contains libraries of useful data for working with chocolate, including:
- ingredients
- molds (forms)
- filling recipes
- confection recipes

It contains built-in data an supports loading and saving of collections, including protected (encrypted) collections.

## Status

NOTE: the ts-chocolate library is brand new and exists to support this library so if we encounter limitations in the library we should fix them instead of working around them, and good general-purpose capabilities should be implemented in the library rather than the tool.   The same is true of other libraries to a lesser extent - if there's value in creating a reusable capability or helper in one of the other libraries in this repo we should do so.  Try to solve problems instead of working around them, and when in doubt ask.

Next up, start building out the real UX.  We want this to eventually be commercial grade, so plan for that - leave a placeholder for a logo, support theming (at least light & dark), etc.   We should support persistent settings with a reasonable settings UX.

The ts-chocolate package contains a library comprised of several sub-libraries:
- ingredients
- molds (forms)
- filling recipes
- confection recipes

Each sub-library is comprised of one or more collections, some of which are encrypted.  We will want some _secure_ way to load collection keys on startup as well as a mechanism to enter a key or password at runtime to open and add a collection that wasn't loaded at runtime.   Most of that capability exists in the core library but we'll need to figure out e.g. option storage & loading, etc.  We'll also need to pass web crypto as an injected dependency.

We'll need top level panes for a number of different tasks:
- ingredient browse and edit
- mold browse and edit
- filling recipe browse and edit
- confection recipe browse and edit

We will want search and filter by name, collection, etc. as well as a way to enable disable collections and to load protected collections that were not decrypted on start up, so we'll need an indication those exist and some way to browse them.  When saving edits to an immutable library, we will have to offer the user a way to save a new entity in a collection that is writable.

Note that recipes and confection recipes have multiple versions - if we save a version from an immutable collection in a different collection, it becomes the base version of a _new_ recipe in that collection.   Note that the recipe and recipe collection entities have properties to track the origin of a recipe, so we should be sure to keep those up to date for proper attribution.

Also note that "just" scaling a recipe doesn't really count as editing or creating a new version.  We might record that in our journal, but it doesn't count as a new version until we make an actual change (add/remove/change quantity of an ingredient)

Recipes and confection recipes also have "procedures" - a sequence of steps or instructions.  When editing procedures we should determine if we want to edit the procedure in place or create a new procedure.

In a future update we will add:
- cooking sessions
- a journal
- much more sophisticated modeling

The library contains classes intended to support some of those things but they are unproven and frankly possibly overdesigned.  When we get to cooking sessions & journals we should feel free to change anything we need to in those classes as appropriate.

## Technology Stack

- **React** 19.2
- **Tailwind CSS** 3.4
- **Heroicons** 2.0
- **Webpack** 5.102
- **TypeScript** 5.9

## Development

```bash
# Start development server
rushx dev

# Build for production
rushx build

# Clean build artifacts
rushx clean
```

The app will be available at `http://localhost:8080` when running in development mode.

## License

MIT
