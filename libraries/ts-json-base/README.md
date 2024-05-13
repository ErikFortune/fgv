<div align="center">
  <h1>ts-json</h1>
  Typescript Utilities for JSON
</div>

<hr/>

## Summary

Assorted JSON-related typescript utilities that I'm tired of copying from project to project. 

---
- [Summary](#summary)
- [Installation](#installation)
- [Overview](#overview)
  - [Type-Safe JSON](#type-safe-json)
## Installation

With npm:
```sh
npm install ts-json
```

## Overview

### Type-Safe JSON
A handful of types express valid JSON as typescript types:
```ts
type JsonPrimitive = boolean | number | string | null;
interface JsonObject { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
interface JsonArray extends Array<JsonValue> { }
```

