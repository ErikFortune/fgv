[Home](../README.md) > [ValidationReportBuilder](./ValidationReportBuilder.md) > buildResult

## ValidationReportBuilder.buildResult() method

Build and return as Result.
Returns success(report) if no errors, fail with error summary if errors exist.

**Signature:**

```typescript
buildResult(): Result<ValidationReport>;
```

**Returns:**

Result&lt;[ValidationReport](ValidationReport.md)&gt;

Result containing validation report or failure
