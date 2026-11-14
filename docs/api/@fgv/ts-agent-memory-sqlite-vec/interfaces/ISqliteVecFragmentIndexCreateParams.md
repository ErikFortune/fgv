[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / ISqliteVecFragmentIndexCreateParams

# Interface: ISqliteVecFragmentIndexCreateParams

Parameters for [SqliteVecFragmentIndex.create](../classes/SqliteVecFragmentIndex.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-database"></a> `database` | `readonly` | `Database` | A `better-sqlite3` `Database` the consumer owns (bring-your-own, mirroring [ISqliteVecVectorIndexCreateParams.database](ISqliteVecVectorIndexCreateParams.md#property-database)). The consumer opens it and owns its lifecycle — this index never closes it. `create` loads the `sqlite-vec` extension onto the connection and, if the fragment table already exists (a reopened persistent file), recovers its established dimension so no re-embedding is required on open. |
| <a id="property-identity"></a> `identity?` | `readonly` | `string` | The embedding identity this handle expects the stored fragment vectors to have — an opaque string such as a model name and version. Optional. **Remarks** Same contract as [ISqliteVecVectorIndexCreateParams.identity](ISqliteVecVectorIndexCreateParams.md#property-identity): stored in the database file, compared by [SqliteVecFragmentIndex.identity](../classes/SqliteVecFragmentIndex.md#identity), and fenced on `addFragments` and `query` while the status is `'mismatch'` or `'incomplete'`. Each table carries its own identity, so a record index and a fragment index in one file are checked independently. |
| <a id="property-tablename"></a> `tableName?` | `readonly` | `string` | Name of the `vec0` virtual table that holds the fragment embeddings. Must be a simple SQL identifier (`[A-Za-z_][A-Za-z0-9_]*`). Defaults to `'memory_fragments'`. Supply a distinct name (distinct from any record-level [SqliteVecVectorIndex](../classes/SqliteVecVectorIndex.md) table) to hold more than one independent index in a single database file. |
