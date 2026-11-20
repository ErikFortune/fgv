[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskEncodedBounds

# Interface: ITaskEncodedBounds

The encoded-size maxima the capacity ledger reserves against.

## Remarks

Bytes are canonical UTF-8 serialized lengths, never estimated heap sizes. Every
reservation uses a *schema maximum* from this table rather than an optimistic guess
at a final outcome's size — which is what makes the maximum completion and settlement
charges computable before acceptance (see [maximumClosureCharges](../functions/maximumClosureCharges.md) and
[maximumSettlementCharges](../functions/maximumSettlementCharges.md)).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxacknowledgementevidencebytes"></a> `maxAcknowledgementEvidenceBytes` | `readonly` | `number` | Maximum encoded bytes one exact acknowledgement or disposition adds to a subscription's record. **Remarks** The unit of *acknowledgement evidence* (design § 8.6, protected allocation 2): every audience link a commit adds reserves one acknowledgement id and this many bytes before it is accepted, so the acknowledgement that later discharges it never needs new capacity. (T7: added.) |
| <a id="property-maxconsumerrecordbytes"></a> `maxConsumerRecordBytes` | `readonly` | `number` | Maximum encoded bytes of one whole consumer record. |
| <a id="property-maxdetailbytes"></a> `maxDetailBytes` | `readonly` | `number` | Maximum encoded bytes of a task's kind-specific details. |
| <a id="property-maxdispositionreasonbytes"></a> `maxDispositionReasonBytes` | `readonly` | `number` | Maximum encoded bytes of one disposition reason. |
| <a id="property-maxenvelopebytes"></a> `maxEnvelopeBytes` | `readonly` | `number` | Maximum encoded bytes of a task summary/envelope. |
| <a id="property-maxinventoryrecordbytes"></a> `maxInventoryRecordBytes` | `readonly` | `number` | Maximum encoded bytes of the repository inventory record. |
| <a id="property-maxissuedreceiptbytes"></a> `maxIssuedReceiptBytes` | `readonly` | `number` | Maximum encoded bytes of one issued receipt manifest. |
| <a id="property-maxoperationrequestbytes"></a> `maxOperationRequestBytes` | `readonly` | `number` | Maximum encoded bytes of one command or catalog operation request. |
| <a id="property-maxquerydescriptorbytes"></a> `maxQueryDescriptorBytes` | `readonly` | `number` | Maximum encoded bytes of one normalized selection or query descriptor. |
| <a id="property-maxsourcecursorbytes"></a> `maxSourceCursorBytes` | `readonly` | `number` | Maximum encoded bytes of one source cursor or revision token. |
| <a id="property-maxsourceidentitybytes"></a> `maxSourceIdentityBytes` | `readonly` | `number` | Maximum encoded bytes of one canonical source identity. |
| <a id="property-maxsourcerecordbytes"></a> `maxSourceRecordBytes` | `readonly` | `number` | Maximum encoded bytes of one broker source-checkpoint record. |
| <a id="property-maxstoredoperationbytes"></a> `maxStoredOperationBytes` | `readonly` | `number` | Maximum encoded bytes of one stored operation, request and receipt together. |
| <a id="property-maxtaskrecordbytes"></a> `maxTaskRecordBytes` | `readonly` | `number` | Maximum encoded bytes of one whole task record. |
| <a id="property-maxupdatebytes"></a> `maxUpdateBytes` | `readonly` | `number` | Maximum encoded bytes of one immutable update payload. |
