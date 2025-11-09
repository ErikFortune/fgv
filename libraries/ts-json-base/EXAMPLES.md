# JsonCompatible Usage Examples

This document provides comprehensive examples of using the `JsonCompatibleType<T>` type and the MapOf pattern.

## Table of Contents

- [Basic Type Validation](#basic-type-validation)
- [MapOf Pattern](#mapof-pattern)
- [Real-World Use Cases](#real-world-use-cases)
- [Error Detection Examples](#error-detection-examples)
- [Advanced Patterns](#advanced-patterns)

## Basic Type Validation

### Simple Interfaces

```typescript
import { JsonCompatible } from '@fgv/ts-json-base';

// ✅ Fully compatible interface
interface PersonData {
  id: string;
  name: string;
  age: number;
  isActive: boolean;
  metadata: Record<string, string | number>;
}

type ValidatedPerson = JsonCompatibleType<PersonData>;
// Result: PersonData (unchanged)

// ❌ Interface with methods
interface PersonWithMethods {
  id: string;
  name: string;
  greet(): string;
  save(): Promise<void>;
}

type InvalidPerson = JsonCompatibleType<PersonWithMethods>;
// Result: {
//   id: string;
//   name: string;
//   greet: ['Error: Function is not JSON-compatible'];
//   save: ['Error: Function is not JSON-compatible'];
// }
```

### Arrays and Collections

```typescript
// ✅ Compatible array types
interface ArrayExamples {
  strings: string[];
  numbers: number[];
  booleans: boolean[];
  objects: Array<{ id: number; value: string }>;
  nested: Array<Array<number>>;
  mixed: Array<string | number | boolean>;
}

type ValidArrays = JsonCompatibleType<ArrayExamples>;
// Result: ArrayExamples (unchanged)

// ❌ Arrays with functions
interface BadArrays {
  callbacks: Array<() => void>;
  mixedWithFunctions: Array<string | (() => number)>;
  processors: Array<{ name: string; process: (x: any) => any }>;
}

type InvalidArrays = JsonCompatibleType<BadArrays>;
// Result: {
//   callbacks: Array<['Error: Function is not JSON-compatible']>;
//   mixedWithFunctions: Array<string | ['Error: Function is not JSON-compatible']>;
//   processors: Array<{ name: string; process: ['Error: Function is not JSON-compatible'] }>;
// }
```

## MapOf Pattern

### Basic Implementation

```typescript
class MapOf<T, TV extends JsonCompatibleType<T> = JsonCompatibleType<T>> extends Map<string, TV> {
  public override set(key: string, value: TV): this {
    return super.set(key, value);
  }

  public override get(key: string): TV | undefined {
    return super.get(key);
  }
}
```

### Usage Examples

```typescript
// ✅ Works with compatible types
interface Product {
  id: string;
  name: string;
  price: number;
  categories: string[];
  metadata: {
    created: string;
    updated?: string;
  };
}

const productMap = new MapOf<Product>();
productMap.set('prod1', {
  id: 'prod1',
  name: 'Widget',
  price: 29.99,
  categories: ['electronics', 'gadgets'],
  metadata: { created: '2024-01-01' }
});

// ❌ Fails with incompatible types
interface ProductWithMethods extends Product {
  calculateDiscount(percent: number): number;
  save(): Promise<void>;
}

const badProductMap = new MapOf<ProductWithMethods>();
// Methods become 'never', making the type unusable
```

## Real-World Use Cases

### API Response Caching

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: number;
  requestId: string;
  metadata?: Record<string, string | number>;
}

interface UserResponse {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    preferences: {
      language: string;
      timezone: string;
    };
  };
}

class ApiResponseCache<T> extends MapOf<ApiResponse<T>> {
  private readonly ttlMs: number;
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(ttlMs: number = 300000) { // 5 minutes default
    super();
    this.ttlMs = ttlMs;
  }

  public override set(key: string, response: ApiResponse<T>): this {
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new value
    super.set(key, response);

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
      this.timers.delete(key);
    }, this.ttlMs);
    
    this.timers.set(key, timer);
    return this;
  }

  public override delete(key: string): boolean {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return super.delete(key);
  }
}

// Usage
const userCache = new ApiResponseCache<UserResponse>();
```

### Configuration Management

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  ssl: boolean;
  poolConfig: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
}

interface AppConfig {
  server: {
    port: number;
    host: string;
  };
  database: DatabaseConfig;
  features: Record<string, boolean>;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    destinations: Array<'console' | 'file' | 'remote'>;
  };
}

class ConfigurationStore extends MapOf<AppConfig> {
  public loadFromEnvironment(): void {
    const config: AppConfig = {
      server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost'
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'app',
        ssl: process.env.DB_SSL === 'true',
        poolConfig: {
          min: parseInt(process.env.DB_POOL_MIN || '2'),
          max: parseInt(process.env.DB_POOL_MAX || '10'),
          idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000')
        }
      },
      features: {
        newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',
        advancedReporting: process.env.FEATURE_ADVANCED_REPORTING === 'true'
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        destinations: (process.env.LOG_DESTINATIONS?.split(',') as any) || ['console']
      }
    };

    this.set('current', config);
  }

  public exportToJson(): string {
    const config = this.get('current');
    return config ? JSON.stringify(config, null, 2) : '{}';
  }
}
```

### Event Data Storage

```typescript
interface BaseEvent {
  id: string;
  timestamp: number;
  type: string;
  userId?: string;
  sessionId?: string;
}

interface UserLoginEvent extends BaseEvent {
  type: 'user_login';
  email: string;
  source: 'web' | 'mobile' | 'api';
}

interface PageViewEvent extends BaseEvent {
  type: 'page_view';
  path: string;
  referrer?: string;
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
  };
}

interface PurchaseEvent extends BaseEvent {
  type: 'purchase';
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  currency: string;
}

type AppEvent = UserLoginEvent | PageViewEvent | PurchaseEvent;

class EventStore extends MapOf<AppEvent> {
  public addEvent(event: AppEvent): void {
    this.set(event.id, event);
  }

  public getEventsByType<T extends AppEvent['type']>(
    type: T
  ): Array<Extract<AppEvent, { type: T }>> {
    const events: Array<Extract<AppEvent, { type: T }>> = [];
    
    for (const event of this.values()) {
      if (event.type === type) {
        events.push(event as Extract<AppEvent, { type: T }>);
      }
    }
    
    return events;
  }

  public exportEvents(): string {
    return JSON.stringify(Array.from(this.values()), null, 2);
  }
}
```

## Error Detection Examples

### Functions Anywhere in Structure

```typescript
// ❌ Functions at any level are detected
interface DeepStructure {
  level1: {
    level2: {
      level3: {
        data: string[];
        process: (items: string[]) => string[]; // Function deep in structure
      };
    };
  };
}

type DeepResult = JsonCompatibleType<DeepStructure>;
// Result: {
//   level1: {
//     level2: {
//       level3: {
//         data: string[];
//         process: ['Error: Function is not JSON-compatible'];
//       };
//     };
//   };
// }

const deepMap = new MapOf<DeepStructure>();
// Cannot set values because of the 'never' property
```

### Mixed Array Types

```typescript
interface MixedArrayExample {
  validArray: Array<string | number | boolean>;
  invalidArray: Array<string | (() => void)>;
  nestedInvalidArray: Array<{
    id: number;
    handler: () => void;
  }>;
}

type MixedResult = JsonCompatibleType<MixedArrayExample>;
// Result: {
//   validArray: Array<string | number | boolean>;
//   invalidArray: Array<string | ['Error: Function is not JSON-compatible']>;
//   nestedInvalidArray: Array<{
//     id: number;
//     handler: ['Error: Function is not JSON-compatible'];
//   }>;
// }
```

### Non-JSON Built-in Types

```typescript
interface ProblematicTypes {
  date: Date;          // Becomes object when stringified
  regex: RegExp;       // Becomes object when stringified  
  symbol: symbol;      // Not JSON-serializable
  func: Function;      // Not JSON-serializable
  map: Map<string, number>; // Not JSON-serializable
}

type ProblematicResult = JsonCompatibleType<ProblematicTypes>;
// All properties become error types because they're not JSON-serializable
```

## Advanced Patterns

### Generic JSON-Safe Storage

```typescript
class JsonStorage<T> {
  private store = new MapOf<T>();
  
  public set(key: string, value: T & JsonCompatibleType<T>): void {
    this.store.set(key, value);
  }
  
  public get(key: string): (T & JsonCompatibleType<T>) | undefined {
    return this.store.get(key);
  }
  
  public serialize(): string {
    const data: Record<string, any> = {};
    for (const [key, value] of this.store) {
      data[key] = value;
    }
    return JSON.stringify(data);
  }
  
  public deserialize(json: string): void {
    const data = JSON.parse(json);
    this.store.clear();
    for (const [key, value] of Object.entries(data)) {
      this.store.set(key, value as any);
    }
  }
}
```

### Validation at Construction

```typescript
class ValidatedMap<T> extends MapOf<T> {
  constructor(private validator: (value: any) => value is T) {
    super();
  }
  
  public override set(key: string, value: T & JsonCompatibleType<T>): this {
    if (!this.validator(value)) {
      throw new Error(`Invalid value for key ${key}`);
    }
    return super.set(key, value);
  }
}

// Usage with type guard
function isUserData(value: any): value is UserData {
  return typeof value === 'object' &&
         typeof value.id === 'string' &&
         typeof value.name === 'string';
}

const validatedUserMap = new ValidatedMap<UserData>(isUserData);
```

### Conditional JSON Compatibility

```typescript
type OnlyJsonCompatibleType<T> = JsonCompatibleType<T> extends never 
  ? 'Type is not JSON compatible' 
  : T;

// Usage in function signatures
function storeData<T>(
  key: string, 
  data: T & OnlyJsonCompatibleType<T>
): void {
  // data is guaranteed to be JSON-compatible
  localStorage.setItem(key, JSON.stringify(data));
}

// ✅ Works with compatible types
storeData('user', { id: '123', name: 'Alice' });

// ❌ Compile error with incompatible types
// storeData('handler', { fn: () => {} });
```

This comprehensive set of examples demonstrates how `JsonCompatibleType<T>` and the MapOf pattern provide robust compile-time guarantees for JSON serialization while maintaining type safety and developer ergonomics.