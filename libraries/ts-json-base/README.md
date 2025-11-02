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

### JsonCompatible Type

The `JsonCompatibleType<T>` type provides compile-time validation that a type is JSON-serializable, unlike `JsonValue` which requires an index signature. This is particularly useful for strongly-typed interfaces.

#### Basic Usage

```typescript
import { JsonCompatible } from '@fgv/ts-json-base';

// ✅ JSON-compatible interface
interface UserData {
  id: string;
  name: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

// ✅ This type remains unchanged because it's fully JSON-compatible
type ValidatedUserData = JsonCompatibleType<UserData>;

// ❌ Interface with non-JSON properties
interface UserWithMethods {
  id: string;
  name: string;
  save(): Promise<void>;  // Functions are not JSON-serializable
}

// ❌ This type transforms 'save' to an error type
type InvalidUserData = JsonCompatibleType<UserWithMethods>;
// Result: { id: string; name: string; save: ['Error: Function is not JSON-compatible'] }
```

#### The MapOf Pattern

The most powerful application is using `JsonCompatibleType<T>` as a constraint with default type parameters:

```typescript
class MapOf<T, TV extends JsonCompatibleType<T> = JsonCompatibleType<T>> extends Map<string, TV> {
  public override set(key: string, value: TV): this {
    return super.set(key, value);
  }
}

// ✅ Works perfectly with JSON-compatible types
const userMap = new MapOf<UserData>();
userMap.set('user1', {
  id: 'user1',
  name: 'Alice',
  preferences: { theme: 'dark', notifications: true }
});

// ❌ Prevents usage with non-JSON-compatible types
const badMap = new MapOf<UserWithMethods>();
// The 'save' method becomes type 'never', making the interface unusable
```

#### Real-World Examples

**API Response Caching:**
```typescript
interface ApiResponse {
  id: string;
  data: unknown;
  timestamp: number;
  metadata: Record<string, string | number>;
}

class ApiCache extends MapOf<ApiResponse> {
  setWithTTL(key: string, response: ApiResponse, ttlMs: number) {
    this.set(key, response);
    setTimeout(() => this.delete(key), ttlMs);
  }
}
```

**Configuration Management:**
```typescript
interface AppConfig {
  features: Record<string, boolean>;
  limits: {
    maxUsers: number;
    maxStorage: number;
  };
  ui: {
    theme: 'light' | 'dark';
    language: string;
  };
}

// Ensures config is always serializable for storage/transmission
const configStore = new MapOf<AppConfig>();
```

**Data Transfer Objects:**
```typescript
// ✅ Perfect for DTOs - no methods, just data
interface CreateUserRequest {
  name: string;
  email: string;
  preferences?: {
    newsletter: boolean;
    theme: string;
  };
}

const requestCache = new MapOf<CreateUserRequest>();

// ❌ Domain objects with behavior are rejected
interface User extends CreateUserRequest {
  id: string;
  save(): Promise<void>;
  validate(): boolean;
}

// This won't work - methods become 'never'
// const userStore = new MapOf<User>();
```

#### Array and Nested Validation

```typescript
// ✅ Arrays of JSON-compatible types work fine
interface DataStructure {
  numbers: number[];
  objects: Array<{ id: number; name: string }>;
  matrix: number[][];
}

const dataMap = new MapOf<DataStructure>();

// ❌ Arrays with functions are detected
interface WithHandlers {
  callbacks: Array<() => void>;  // Functions in arrays also become 'never'
  data: string[];
}

// The 'callbacks' property becomes Array<['Error: Function is not JSON-compatible']>
const handlersMap = new MapOf<WithHandlers>();
```

#### Benefits

1. **Compile-time safety**: Non-serializable types are caught during development
2. **Clear interfaces**: Makes it obvious which types are meant for serialization
3. **Architecture enforcement**: Separates data objects from behavior objects
4. **Runtime protection**: Prevents serialization errors in production
5. **IDE support**: Full autocomplete and error highlighting

