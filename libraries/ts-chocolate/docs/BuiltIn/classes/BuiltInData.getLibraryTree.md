[Home](../../README.md) > [BuiltIn](../README.md) > [BuiltInData](./BuiltInData.md) > getLibraryTree

## BuiltInData.getLibraryTree() method

Gets the full built-in library tree.
The tree is structured to mirror a real filesystem library:
```
/
└── data/
    ├── ingredients/
    │   ├── common.json
    │   ├── felchlin.json
    │   ├── cacao-barry.json
    │   └── guittard.json
    ├── fillings/
    │   └── common.json
    ├── molds/
    │   └── common.json
    ├── procedures/
    │   └── common.json
    ├── tasks/
    │   └── common.json
    └── confections/
        └── common.json
```

**Signature:**

```typescript
static getLibraryTree(): Result<IFileTreeDirectoryItem<string>>;
```

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

`Success` with the library tree root directory, or `Failure` with an error message.
