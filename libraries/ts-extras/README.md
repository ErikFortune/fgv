<div align="center">
  <h1>ts-extras</h1>
  Assorted TypeScript Utilities
</div>

<hr/>

## Summary

Assorted less-developed or more specialized utilities borrowed from various projects - much less polished and more likely to change or disappear:

* **ExtendedArray\<T\>** - adds useful operations to the built-in Array
* **Formattable\<T\>** - simple helpers to create mustache wrappers for objects and make them easily printable  
* **Logger** - A very basic logger suitable for hobby projects
* **RangeOf\<T\>** - Generic open or closed ranges of orderable items (numbers, dates, etc)
* **ZIP FileTree** - FileTree implementation for reading from ZIP archives (Node.js)
* **Converters** - Type-safe data conversion utilities
* **CSV Helpers** - Utilities for CSV processing
* **Hash Utilities** - MD5 normalization and hashing utilities
* **RecordJar Helpers** - Utilities for record collection management

---

- [Summary](#summary)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Overview](#overview)
- [API](#api)
  - [ExtendedArray\<T\>](#extendedarrayt)
  - [Formattable\<T\>](#formattablet)
  - [Logger](#logger)
  - [RangeOf\<T\>](#rangeoft)
  - [ZIP FileTree](#zip-filetree)
  - [Converters](#converters)
  - [Other Utilities](#other-utilities)

## Installation

With npm:
```sh
npm install @fgv/ts-extras
```

## API Documentation
Extracted API documentation is [here](./docs/ts-extras.md).

## Overview

This package provides various utility functions and classes that are commonly needed across TypeScript projects, particularly those working with data processing, file handling, and type-safe operations.

## API

### ExtendedArray\<T\>

Extended array functionality with additional operations beyond the built-in Array methods.

### Formattable\<T\>

Simple helpers for creating mustache-style wrappers around objects to make them easily printable and templatable.

### Logger

A basic logging utility suitable for development and hobby projects.

### RangeOf\<T\>

Generic implementation for representing open or closed ranges of orderable items like numbers, dates, or other comparable values.

### ZIP FileTree

**Node.js-compatible** FileTree implementation for reading from ZIP archives using AdmZip:

```typescript
import { ZipFileTree } from '@fgv/ts-extras';
import { FileTree } from '@fgv/ts-utils';

// Create ZIP FileTree from buffer
const zipAccessors = ZipFileTree.ZipFileTreeAccessors.fromBuffer(zipBuffer);
const fileTree = FileTree.FileTree.create(zipAccessors.value);

// Access files and directories
const file = fileTree.value.getFile('/path/to/file.json');
const contents = file.value.getContents(); // Parsed JSON
const rawContents = file.value.getRawContents(); // Raw string
```

**Note**: This implementation uses Node.js-specific dependencies (AdmZip, Buffer). For browser environments, see the browser-specific implementations in individual projects.

### Converters  

Type-safe data conversion utilities for transforming between different data formats while maintaining type safety.

### Other Utilities

- **CSV Helpers**: Utilities for processing CSV data
- **Hash Utilities**: MD5 normalization and hashing functions
- **RecordJar Helpers**: Utilities for managing record collections and data structures

## Dependencies

This package depends on:
- `@fgv/ts-utils` - Core utilities and Result pattern
- `adm-zip` - ZIP file processing (Node.js only)
- Various other utility packages for specific functionality

## Platform Notes

- **ZIP FileTree**: Node.js only (uses AdmZip and Buffer)  
- **Other utilities**: Cross-platform compatible
- **Browser usage**: Most utilities work in browsers, but ZIP functionality requires browser-specific implementations
