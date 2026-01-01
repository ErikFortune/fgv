# Requirements: Chocolate Recipe Helpers Library & Applications

**Task ID**: chocolate-library-2026-01-01
**Date**: 2026-01-01
**Type**: Feature Development
**Complexity**: Moderate

## Executive Summary

Build a comprehensive chocolate recipe management system consisting of:
1. **Core Library** (`@fgv/ts-chocolate`) - Ingredient database, recipe scaling, and calculations
2. **CLI Tool** (`@fgv/chocolate-cli`) - Command-line interface for recipe management
3. **Web Application** (`chocolate-web`) - Web-based interface for recipe management

The system will focus initially on ganache recipes with extensibility for other chocolate fillings and confections.

## Detailed Requirements

### 1. Ingredients Database

#### 1.1 Ingredient Characteristics
**Requirement**: Support comprehensive ingredient definitions with key chemical/physical properties

**For Ganache Calculations**:
- Cacao fat percentage
- Sugar content percentage
- Milk fat percentage
- Water content percentage
- Non-fat cocoa solids percentage
- Other fats percentage

**Attributes**:
- Ingredient name (required)
- Category (chocolate, dairy, fat, sweetener, flavoring, etc.)
- Manufacturer/brand (optional)
- All percentage fields must sum to 100% (validation required)

#### 1.2 Built-in Ingredient Library
**Requirement**: Provide comprehensive database of common chocolate ingredients

**Must Include**:
- Dark chocolate varieties (50%, 60%, 70%, 80%, 85%, 90% cacao)
- Milk chocolate varieties (common commercial percentages)
- White chocolate
- Heavy cream (various fat percentages: 35%, 40%, 48%)
- Butter (salted, unsalted)
- Common additions (glucose, invert sugar, alcohol, etc.)

**Data Format**: JSON-based ingredient definitions with schema validation

#### 1.3 Custom Ingredients
**Requirement**: Allow users to define custom ingredients

**Features**:
- Create new ingredient definitions
- Validate against ingredient schema
- Persist custom ingredients (application-local storage)
- Import/export ingredient definitions

#### 1.4 Multiple Ingredient Sources
**Requirement**: Support ingredient definitions from multiple sources with precedence rules

**Source Types** (Phase 1):
- Built-in library (shipped with package, highest precedence for conflicts)
- Application-local (user-defined, medium precedence)
- Future: Cloud-based shared repository (lowest precedence)

**Source Management**:
- Combine ingredients from all active sources
- Handle naming conflicts with clear precedence
- Allow source enable/disable
- Validation across all sources

### 2. Recipes

#### 2.1 Base Recipe Definition
**Requirement**: Define recipes at their "natural" weight with scaling support

**Recipe Structure**:
```typescript
interface Recipe {
  id: string;
  name: string;
  description?: string;
  category: RecipeCategory; // ganache, truffle, etc.
  baseWeight: number; // grams (natural recipe size)
  ingredients: RecipeIngredient[];
  metadata?: RecipeMetadata;
}

interface RecipeIngredient {
  ingredientId: string;
  weight: number; // grams in base recipe
  percentage?: number; // calculated from baseWeight
  optional?: boolean;
  notes?: string;
}
```

#### 2.2 Recipe Scaling
**Requirement**: Scale recipes from base definition to user-desired output weight

**Calculation Flow**:
1. Parse base recipe (ingredients in grams)
2. Calculate percentage of each ingredient relative to total base weight
3. Apply percentages to desired output weight
4. Emit scaled recipe with recalculated gram amounts

**Features**:
- Maintain ratio integrity during scaling
- Round scaled weights appropriately (to 0.1g precision)
- Validate scaled output (minimum/maximum weight constraints)
- Handle optional ingredients in scaling

#### 2.3 Recipe Procedures (Phased Approach)
**Phase 1** (Current Scope):
- Focus exclusively on ingredient lists and weights
- Procedures follow small set of fixed patterns (not user-customizable)
- System assigns appropriate procedure template based on recipe category

**Phase 2** (Future):
- Templated procedures with variable substitution
- Generate full recipe instructions with populated values
- Support for custom procedure templates

#### 2.4 Multiple Recipe Sources
**Requirement**: Support recipes from multiple sources with proprietary recipe protection

**Source Types**:
- Built-in example recipes (shipped with package, open source)
- Application-local recipes (user-created, stored locally)
- Future: Cloud-based personal/shared recipes (user authentication required)

**Critical Constraint**:
- Proprietary recipes MUST NOT be checked into source control
- Clear separation between example/template recipes and user recipes
- Recipe storage location configurable by application

#### 2.5 Recipe Validation
**Requirement**: Validate recipes against quality criteria from multiple sources

**Validation Rules**:
- All ingredient references must resolve to valid ingredients
- Total ingredient percentages should sum to 100% (with tolerance)
- Ganache-specific validations:
  - Fat content within acceptable range (prevents splitting)
  - Water content within acceptable range (affects shelf life)
  - Chocolate to cream ratio validation
- Custom validation rules from multiple sources

**Validation Sources**:
- Built-in validation rules (common best practices)
- Application-provided validators (custom rules)
- Future: LLM-based subjective estimates (texture, suitability, etc.)

### 3. Units and Conversions

#### 3.1 Internal Representation
**Requirement**: Use grams as native unit throughout the system

**Rationale**:
- Weight-based recipes are more accurate than volume
- Grams are standard in professional baking/confectionery
- Easier to maintain precision in calculations

#### 3.2 Output Conversion
**Requirement**: Convert to user-preferred units on output

**Supported Units**:
- Weight: grams (g), kilograms (kg), ounces (oz), pounds (lb)
- Future: Volume conversions (cups, tablespoons) with density data

**Conversion Requirements**:
- Maintain precision through conversion pipeline
- Round appropriately for display (no false precision)
- Support unit preferences per user/application

### 4. Applications

#### 4.1 CLI Tool (`@fgv/chocolate-cli`)
**Requirement**: Command-line interface for recipe and ingredient management

**Core Commands**:
```bash
# Ingredient management
choco ingredient list [--source=all|builtin|local]
choco ingredient show <name>
choco ingredient add <definition-file>
choco ingredient validate <definition-file>

# Recipe management
choco recipe list [--source=all|builtin|local] [--category=ganache]
choco recipe show <name>
choco recipe scale <name> <target-weight> [--unit=g|oz]
choco recipe validate <recipe-file>
choco recipe create <recipe-file>

# Analysis
choco analyze <recipe-name> # Show composition breakdown
```

**Features**:
- Colorized output for better readability
- JSON output mode for scripting
- Interactive prompts for recipe creation
- Configuration file support (~/.chocorc)

#### 4.2 Web Application (`chocolate-web`)
**Requirement**: Web-based interface with same capabilities as CLI

**Technology Stack**:
- Framework: Next.js or similar (to be determined in design phase)
- UI: React with component library
- State: Local storage for user data initially
- Future: Backend API for cloud features

**Core Features**:
- Browse ingredient database with search/filter
- Create and edit custom ingredients
- Browse recipe library with search/filter
- Scale recipes interactively with live preview
- Visualize recipe composition (charts/graphs)
- Export recipes (PDF, JSON)
- Import/export ingredient and recipe collections

**User Experience**:
- Responsive design (desktop and mobile)
- Accessibility compliant (WCAG 2.1 AA)
- Print-friendly recipe output

### 5. Technical Requirements

#### 5.1 Monorepo Integration
**Requirement**: Follow FGV Rush monorepo patterns and standards

**Structure**:
```
libraries/
  └── ts-chocolate/              # @fgv/ts-chocolate
      ├── src/
      │   ├── index.ts
      │   └── packlets/
      │       ├── ingredients/   # Ingredient database and management
      │       ├── recipes/       # Recipe definitions and scaling
      │       ├── validation/    # Validation rules and engines
      │       ├── calculations/  # Ganache and other calculations
      │       └── sources/       # Multi-source management
      ├── data/
      │   ├── ingredients/       # Built-in ingredient definitions
      │   └── recipes/           # Example recipes (open source)
      └── package.json

tools/
  └── chocolate-cli/             # @fgv/chocolate-cli
      ├── src/
      │   ├── commands/
      │   └── cli.ts
      └── package.json

apps/
  └── chocolate-web/             # Web application
      ├── src/
      ├── public/
      └── package.json
```

#### 5.2 Dependencies
**Required Monorepo Packages**:
- `@fgv/ts-utils` - Result pattern, collections, validation, conversion
- `@fgv/ts-json` - JSON handling and validation
- `@fgv/ts-utils-jest` - Testing utilities

**External Dependencies** (CLI):
- Command-line framework (e.g., commander, yargs)
- Terminal formatting (chalk, ora)

**External Dependencies** (Web):
- To be determined in design phase (Next.js, React, charting library)

#### 5.3 Code Quality Standards
**Requirement**: Follow all monorepo guidelines

- **Result Pattern**: All fallible operations return `Result<T>`
- **No `any` Type**: Strict TypeScript with proper types
- **Converters/Validators**: Type-safe validation for all inputs
- **Error Handling**: Descriptive error messages with context
- **Testing**: 100% test coverage requirement
- **Documentation**: TSDoc comments for all public APIs

#### 5.4 Build and Tooling
**Requirement**: Use standard monorepo toolchain

- **Build**: Heft build system
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with monorepo rules
- **Formatting**: Prettier
- **API Docs**: API Extractor

## Exit Criteria

### Functional Exit Criteria

#### Ingredients
- [ ] **F-ING-01**: Built-in ingredient database contains at least 20 common chocolate ingredients
- [ ] **F-ING-02**: Custom ingredient creation validates all required fields and percentage constraints
- [ ] **F-ING-03**: Ingredient sources can be combined with proper precedence rules
- [ ] **F-ING-04**: Ingredient definitions can be imported and exported in JSON format

#### Recipes
- [ ] **F-REC-01**: Base recipes can be defined with ingredients and weights
- [ ] **F-REC-02**: Recipe scaling produces accurate weights at any target weight (0.1g precision)
- [ ] **F-REC-03**: Recipe validation detects invalid ingredient references
- [ ] **F-REC-04**: Recipe validation detects composition issues (fat/water content for ganache)
- [ ] **F-REC-05**: Multiple recipe sources are supported with proprietary recipe protection

#### Applications (CLI)
- [ ] **F-CLI-01**: CLI can list all ingredients from all sources
- [ ] **F-CLI-02**: CLI can display detailed ingredient information
- [ ] **F-CLI-03**: CLI can list all recipes with filtering by category/source
- [ ] **F-CLI-04**: CLI can scale recipes to target weight with unit conversion
- [ ] **F-CLI-05**: CLI can validate ingredient and recipe files
- [ ] **F-CLI-06**: CLI provides helpful error messages for invalid operations

#### Applications (Web)
- [ ] **F-WEB-01**: Web app displays browsable ingredient database
- [ ] **F-WEB-02**: Web app supports ingredient search and filtering
- [ ] **F-WEB-03**: Web app displays browsable recipe library
- [ ] **F-WEB-04**: Web app provides interactive recipe scaling with live preview
- [ ] **F-WEB-05**: Web app visualizes recipe composition graphically
- [ ] **F-WEB-06**: Web app is responsive on desktop and mobile devices

### Technical Exit Criteria

#### Code Quality
- [ ] **T-QUA-01**: All code follows Result pattern (no unchecked exceptions)
- [ ] **T-QUA-02**: No use of `any` type anywhere in the codebase
- [ ] **T-QUA-03**: All input validation uses Converters or Validators
- [ ] **T-QUA-04**: All public APIs have TSDoc documentation
- [ ] **T-QUA-05**: ESLint passes with no warnings
- [ ] **T-QUA-06**: Prettier formatting is consistent

#### Testing
- [ ] **T-TST-01**: 100% statement coverage across all library code
- [ ] **T-TST-02**: 100% branch coverage across all library code
- [ ] **T-TST-03**: 100% function coverage across all library code
- [ ] **T-TST-04**: All tests use Result pattern matchers appropriately
- [ ] **T-TST-05**: Edge cases tested (empty inputs, boundary values, invalid data)
- [ ] **T-TST-06**: Integration tests verify multi-source ingredient/recipe loading

#### Build and Integration
- [ ] **T-BLD-01**: Library builds successfully with Heft
- [ ] **T-BLD-02**: CLI tool builds successfully and is executable
- [ ] **T-BLD-03**: Web app builds successfully and serves locally
- [ ] **T-BLD-04**: All packages pass `rush build`
- [ ] **T-BLD-05**: All packages pass `rush test`
- [ ] **T-BLD-06**: API documentation generates without errors

#### Architecture
- [ ] **T-ARC-01**: Clear separation between library, CLI, and web app
- [ ] **T-ARC-02**: CLI and web app both use shared library (no duplication)
- [ ] **T-ARC-03**: Packlet organization follows monorepo conventions
- [ ] **T-ARC-04**: Multi-source system is extensible for future cloud sources
- [ ] **T-ARC-05**: Recipe procedure system is extensible for Phase 2 templates

### Validation Exit Criteria

#### Requirements Validation
- [ ] **V-REQ-01**: TPM confirms all functional requirements are testable
- [ ] **V-REQ-02**: All exit criteria map to specific requirements
- [ ] **V-REQ-03**: No ambiguous requirements remain

#### Test Coverage Alignment
- [ ] **V-COV-01**: Senior SDET confirms test coverage matches all requirements
- [ ] **V-COV-02**: Senior SDET confirms no over-testing or redundant tests
- [ ] **V-COV-03**: Test architecture review passes

#### User Verification
- [ ] **V-USR-01**: User can create a custom ingredient and use it in a recipe (CLI)
- [ ] **V-USR-02**: User can scale a ganache recipe to desired weight (CLI)
- [ ] **V-USR-03**: User can browse ingredients and recipes (Web)
- [ ] **V-USR-04**: User can scale a recipe interactively (Web)
- [ ] **V-USR-05**: Recipe validation correctly identifies composition issues

## Out of Scope (Phase 1)

The following are explicitly out of scope for Phase 1:

1. **Templated Procedures**: Full recipe instructions with variable substitution (Phase 2)
2. **Cloud Storage**: Backend API and user authentication (future)
3. **LLM Integration**: Subjective estimates of texture, suitability (future)
4. **Volume Conversions**: Cups, tablespoons (requires density data)
5. **Recipe Categories Beyond Ganache**: Mousses, truffles, etc. (extensible but not implemented)
6. **Mobile Native Apps**: iOS/Android native applications
7. **Collaboration Features**: Sharing recipes, commenting, versioning
8. **Recipe Optimization**: Suggesting ingredient substitutions or improvements

## Assumptions

1. Users have basic understanding of chocolate making and ganache
2. Recipe weights are reasonable (10g - 10kg range)
3. Users will manually verify recipe results initially
4. Built-in ingredient data is accurate (sourced from manufacturer specifications)
5. Web application runs on modern browsers (last 2 versions of Chrome, Firefox, Safari, Edge)

## Dependencies and Risks

### Dependencies
- Rush monorepo infrastructure must be stable
- Existing monorepo libraries (`@fgv/ts-utils`, etc.) must be compatible

### Risks
- **Risk**: Ingredient composition data accuracy
  - **Mitigation**: Source data from manufacturer specifications, allow user corrections

- **Risk**: Recipe scaling edge cases (very small or very large weights)
  - **Mitigation**: Define and enforce reasonable weight ranges with validation

- **Risk**: Web app technology choices may need revision
  - **Mitigation**: Design library to be UI-framework agnostic

## Success Metrics

1. **Functional Success**: All exit criteria validated
2. **Code Quality**: 100% test coverage, zero lint warnings
3. **Usability**: User can create and scale a ganache recipe in under 2 minutes (both CLI and web)
4. **Performance**: Recipe scaling completes in <100ms for typical recipes
5. **Maintainability**: Clear packlet organization, comprehensive documentation

## Timeline Estimate

- **Requirements & Design**: 0.5 hours
- **Library Implementation**: 2-3 hours
- **CLI Implementation**: 1 hour
- **Web App Implementation**: 1.5-2 hours
- **Testing & Coverage**: 2-3 hours
- **Review & Validation**: 1 hour

**Total Estimated Duration**: 8-10 hours

---

**Document Status**: Draft for Review
**Next Step**: Present execution plan for user approval
