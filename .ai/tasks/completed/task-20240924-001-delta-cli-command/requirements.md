# Delta CLI Command Requirements

## Feature Overview
Implement a new CLI command in ts-res-cli to generate deltas between two sets of resource values, building on the existing DeltaGenerator class in the ts-res library.

## User Story
As a developer working with localized resources, I want to generate minimal delta files between different resource sets so that I can create incremental updates and track changes between different localization contexts.

## Acceptance Criteria

### Primary Functionality
- **AC1**: CLI command `ts-res-cli delta` generates deltas between baseline and target resource sets
- **AC2**: Command supports `--baseline`, `--target`, and `--output` parameters
- **AC3**: Generated output contains only resources that differ between baseline and target
- **AC4**: Delta generation uses three-way diff algorithm for minimal changes

### Resource Handling
- **AC5**: Follows existing CLI patterns for resource specification and import
- **AC6**: Supports existing CLI context handling mechanisms
- **AC7**: Handles resource sets with different runtime contexts appropriately
- **AC8**: Applies runtime qualifiers from target context to new/changed strings

### Output Support
- **AC9**: Supports all existing CLI output formats (JSON, bundle, etc.)
- **AC10**: Output can be written to file or stdout based on user specification
- **AC11**: Generated delta files can be used as input for subsequent delta operations

### Integration Requirements
- **AC12**: Uses ILogger/ILogReporter from ts-utils for consistent logging
- **AC13**: CLI remains a thin wrapper - core logic stays in ts-res library
- **AC14**: Harmonizes flag formats and behavior with existing CLI tools
- **AC15**: Follows standard CLI error handling patterns

### Example Use Cases
- **AC16**: en-US baseline + en-GB target → delta with only en-GB differences
- **AC17**: Sequential operations: (baseline + en-GB) → (result + en-CA) works correctly
- **AC18**: Command supports debug/verbose modes consistent with other CLI commands

## Technical Constraints
- Must use existing DeltaGenerator class from ts-res library
- Must follow established CLI architecture patterns
- Must maintain compatibility with existing resource formats
- Must not duplicate business logic between CLI and core library

## Non-Requirements
- Batch processing multiple delta operations in single command (deferred)
- GUI or web interface components (out of scope)
- New resource file formats (use existing formats)
- Modifications to DeltaGenerator core logic (use as-is)

## Success Metrics
- Command integrates seamlessly with existing ts-res-cli interface
- Generated deltas are functionally equivalent to manual resource editing
- Performance is acceptable for typical resource set sizes
- Error messages are clear and actionable
- Documentation is complete and follows existing patterns

## Dependencies
- Existing DeltaGenerator implementation in ts-res library
- Current ts-res-cli architecture and patterns
- ILogger/ILogReporter interfaces from ts-utils

## Risk Mitigation
- Leverage existing CLI patterns to minimize integration issues
- Use proven DeltaGenerator implementation to avoid business logic bugs
- Follow established testing patterns for CLI commands
- Maintain clear separation between CLI and core library concerns