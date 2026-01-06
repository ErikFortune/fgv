# @fgv/ts-chocolate

Chocolate recipe helpers and calculations library.

## Overview

This library provides utilities for managing chocolate recipes, including:
- Ingredient database management
- Recipe scaling calculations
- Ganache validation
- Multi-source ingredient and recipe management

## Status

🚧 Under active development - Stage 1 (Package Setup)

## Installation

```bash
rush add -p @fgv/ts-chocolate
```

## Usage

Documentation will be added as functionality is implemented.

### Workflows

#### Editing

1. We start with a library of recipes derived from multiple collections, some of which are readonly
2. the user selects a recipe either for production or design.
    - by default we get the "golden" version of the recipe but the user can select any version to work from
3. production or design:
    - the user can scale to target weight or by a scale factor with easy to use controls
    - the user can edit (add, remove or update) ingredients. 
3. When the user selects done, we:
    - if the recipe has been modified other than scale, we save the new version:
        - if the recipe comes from a writable collection, save it there by default as a new version
        - If the recipe comes from a read-only collection, we need to create a new recipe in collection that we can write, link the new recipe to the old, and add the edited version as the golden version of the new recipe.  We should allow the user to select the desired base weight of the new version and scale to that before saving.
    - record a usage event for the new or prior version, with a scale factor relative to the base weight of the version we stored

#### Browse
- the user should be able to browse and search recipes
    - the user should be able to choose any version of a recipe from the recipe view
    - the user should be able to see all usages of whichever version is displayed
    - version notes, tags and ratings should be editable but ingredients should not
- the user should be able to browse all usage events


## Development

```bash
# Build
rushx build

# Test
rushx test

# Lint
rushx lint
```

## License

MIT
