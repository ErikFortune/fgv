[Home](../README.md) > [IQualifierCollectorCreateParams](./IQualifierCollectorCreateParams.md) > qualifierTypes

## IQualifierCollectorCreateParams.qualifierTypes property

The QualifierTypes.QualifierTypeCollector | qualifier types used to
create Qualifiers.Qualifier | qualifiers from Qualifiers.IQualifierDecl | declarations.

Optional only when every entry in `qualifiers` is a bare axis-name string
(in which case the library synthesizes a literal qualifier type per name).

**Signature:**

```typescript
qualifierTypes: ReadOnlyQualifierTypeCollector;
```
