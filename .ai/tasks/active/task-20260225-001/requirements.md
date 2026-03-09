# Requirements: Complete E2E Encrypted Collection Support

## Requirements Understanding Checkpoint

**User Request:** Complete end-to-end encrypted collection support in chocolate-lab-web application

**My Understanding:**
The infrastructure for encrypted collections already exists, but there are critical gaps preventing the feature from working end-to-end. Specifically:
- Primary goal: Enable users to create, save, and load encrypted collections with persistent keystore across page reloads
- Key components to build:
  - Keystore persistence abstraction (save back to localStorage after modifications)
  - Helper for encrypted collection save workflow
  - SecuritySection UI for password management
  - Wire up keystore persistence after add/change operations
- Success looks like: User can set a password, create an encrypted collection, reload the page, unlock the keystore, and access the encrypted collection

**Scope Confirmation:**
Based on the request, this task includes:
- ✅ Complete keystore persistence pipeline (load → modify → save → reload)
- ✅ SecuritySection UI implementation (password dialogs, status display)
- ✅ Helper utilities for encrypted collection save workflow
- ✅ Integration with existing create/export collection flows
- ✅ 100% test coverage for new components

This task assumes these are OUT of scope (unless specified otherwise):
- ❌ Modifying core crypto primitives in ts-extras (already complete)
- ❌ Changing KeyStore class API (already complete)
- ❌ Redesigning the two-stage platform init architecture
- ❌ Adding new encryption algorithms beyond AES-256-GCM
- ❌ Implementing collection-level encryption toggle UI (already exists in CreateCollectionDialog)
- ❌ Cloud sync or multi-device keystore synchronization

**Approach:**
Fill gaps in existing architecture with minimal new abstractions:
1. Create `keystoreStorage.ts` - save/load helpers for localStorage persistence
2. Create `saveEditableCollection.ts` - helper for optional encryption during save
3. Implement SecuritySection UI with password dialogs
4. Wire persistence into platform init and collection creation flows

---

## Functional Requirements

### FR001: Keystore Storage Abstraction
**Priority:** High
**Description:** System SHALL provide utilities for persisting KeyStore to localStorage and loading on next session

**Rationale:** KeyStore loads during platform init but modifications (password changes, adding secrets) are lost on page reload. Need persistent storage layer.

**Acceptance Criteria:**
- Given a KeyStore instance and storage key, when `saveKeystoreToStorage()` is called, then the keystore file is serialized and saved to localStorage
- Given a storage key with saved keystore data, when `loadKeystoreFromStorage()` is called, then a valid IKeyStoreFile is returned
- Given an empty/missing storage key, when `loadKeystoreFromStorage()` is called, then Failure is returned with descriptive message
- Given invalid JSON in localStorage, when `loadKeystoreFromStorage()` is called, then Failure is returned
- Given a corrupt keystore structure, when `loadKeystoreFromStorage()` is called, then converter validation fails with clear error

### FR002: Keystore Save After Password Initialization
**Priority:** High
**Description:** System SHALL automatically persist keystore to localStorage after password initialization during collection creation

**Rationale:** When user creates first encrypted collection and sets password, keystore.initialize() succeeds but keystore is lost on page reload.

**Acceptance Criteria:**
- Given a new keystore that has been initialized with password, when collection creation completes, then keystore is saved to localStorage
- Given keystore save failure, when attempting to persist, then user is warned but collection creation continues
- Given successful keystore save, when page is reloaded, then keystore file loads from localStorage during platform init
- Given keystore with unsaved changes, when user reloads page, then changes are persisted (no data loss)

### FR003: Keystore Save After Secret Addition
**Priority:** High
**Description:** System SHALL automatically persist keystore after adding new encryption secrets

**Rationale:** Adding a secret for new encrypted collection marks keystore dirty but doesn't save - secret lost on reload.

**Acceptance Criteria:**
- Given an unlocked keystore, when `addSecret()` succeeds, then keystore is automatically saved to localStorage
- Given keystore save failure, when attempting to persist after secret addition, then operation returns Failure with error context
- Given successful secret addition and save, when page is reloaded and keystore unlocked, then the secret is available
- Given concurrent secret additions, when saving keystore, then all secrets are persisted atomically

### FR004: Keystore Save After Password Change
**Priority:** Medium
**Description:** System SHALL persist keystore after user changes master password via SecuritySection

**Rationale:** Password changes via UI need to survive page reloads.

**Acceptance Criteria:**
- Given an unlocked keystore, when user changes password via SecuritySection, then new password-encrypted keystore is saved
- Given incorrect current password, when user attempts password change, then Failure is returned without saving
- Given successful password change, when page reloads, then old password no longer works and new password unlocks keystore
- Given password change failure, when attempting to save, then user receives clear error message

### FR005: SecuritySection UI - Status Display
**Priority:** Medium
**Description:** System SHALL display current keystore status in SecuritySection

**Rationale:** Users need visibility into whether keystore exists, is locked/unlocked, and how many secrets are stored.

**Acceptance Criteria:**
- Given no keystore file in localStorage, when SecuritySection renders, then status shows "No keystore configured"
- Given locked keystore, when SecuritySection renders, then status shows "Locked" with unlock button
- Given unlocked keystore, when SecuritySection renders, then status shows "Unlocked" with secret count
- Given keystore state changes, when workspace notifies, then SecuritySection re-renders with updated status

### FR006: SecuritySection UI - Password Set/Change Dialog
**Priority:** Medium
**Description:** System SHALL provide UI for setting initial password and changing existing password

**Rationale:** Users need ability to manage keystore password after initial setup.

**Acceptance Criteria:**
- Given no keystore, when user clicks "Set Password", then dialog prompts for new password (no current password required)
- Given locked keystore, when user clicks "Change Password", then dialog first prompts to unlock, then prompts for new password
- Given unlocked keystore, when user clicks "Change Password", then dialog prompts for current password and new password
- Given password mismatch in confirmation field, when user submits, then validation error is shown
- Given successful password set/change, when dialog closes, then SecuritySection updates to show new status
- Given password change failure, when operation fails, then error message is displayed in dialog

### FR007: SecuritySection UI - Unlock Keystore
**Priority:** Medium
**Description:** System SHALL allow user to unlock a locked keystore from SecuritySection

**Rationale:** Keystore may be locked on page load; users need UI to unlock without creating a collection.

**Acceptance Criteria:**
- Given locked keystore, when user clicks "Unlock", then password prompt dialog appears
- Given correct password, when user submits, then keystore unlocks and status updates to "Unlocked"
- Given incorrect password, when user submits, then error message shown and keystore remains locked
- Given unlock in progress, when user cancels dialog, then keystore remains locked

### FR008: Encrypted Collection Save Helper
**Priority:** High
**Description:** System SHALL provide helper function for saving EditableCollection with optional encryption

**Rationale:** Collection save logic with encryption is complex - centralize in reusable helper to avoid duplication.

**Acceptance Criteria:**
- Given collection without secretName, when `saveEditableCollection()` is called, then collection is serialized to YAML and saved
- Given collection with secretName and available key, when `saveEditableCollection()` is called, then collection is encrypted to JSON and saved
- Given collection with secretName but key unavailable, when `saveEditableCollection()` is called, then Failure is returned with context
- Given encryption failure, when attempting to save, then Failure is returned and original file remains unchanged
- Given successful save, when file is re-loaded, then decrypted content matches original collection data

### FR009: Keystore Unlocking During Collection Export
**Priority:** Low
**Description:** System SHOULD prompt for keystore password if needed during encrypted collection export

**Rationale:** User may export encrypted collection before unlocking keystore. Current flow falls back to plain YAML silently.

**Acceptance Criteria:**
- Given locked keystore and collection with secretName, when user exports collection, then system prompts for password
- Given user provides correct password, when unlocking during export, then collection exports as encrypted JSON
- Given user cancels password prompt, when exporting, then export is cancelled (not silently downgraded to plain)
- Given incorrect password during export, when user submits, then error shown and export fails

---

## Non-Functional Requirements

### NFR001: Security - Keystore Protection
**Category:** Security
**Description:** Keystore SHALL be encrypted at rest in localStorage using PBKDF2-derived key

**Metric:** All keystore files in localStorage must be in IKeyStoreFile format with encrypted vault contents
**Threshold:** 100% of keystores encrypted; no plaintext secrets in localStorage

### NFR002: Security - Password Validation
**Category:** Security
**Description:** Password inputs SHALL validate minimum strength requirements

**Metric:** Minimum password length, optionally character requirements
**Threshold:** At least 8 characters required; warnings for weak passwords

### NFR003: Performance - Keystore Save Latency
**Category:** Performance
**Description:** Keystore save operations SHALL complete within acceptable time for user interactions

**Metric:** Time from save initiation to localStorage write completion
**Threshold:** < 500ms for typical keystore (< 10 secrets)

### NFR004: Usability - Error Messages
**Category:** Usability
**Description:** Crypto operation failures SHALL provide actionable error messages

**Metric:** Error messages include context (which operation failed, why, what to do)
**Threshold:** All crypto errors have user-facing messages; no raw exception strings shown

### NFR005: Reliability - Atomic Saves
**Category:** Reliability
**Description:** Keystore save operations SHALL be atomic (no partial writes on failure)

**Metric:** If save fails, previous keystore state remains intact
**Threshold:** 100% of save failures leave keystore in consistent state

---

## Technical Constraints

### C001: localStorage Availability
**Type:** Technical
**Description:** Browser localStorage must be available and enabled
**Impact:** Keystore persistence fails if localStorage disabled or quota exceeded
**Mitigation:** Detect localStorage availability during platform init; gracefully degrade to session-only keystore

### C002: Existing KeyStore API
**Type:** Technical
**Description:** Cannot modify KeyStore class API in ts-extras (locked interface)
**Impact:** Must work with existing KeyStore.save() method returning IKeyStoreFile
**Mitigation:** Wrapper functions handle localStorage serialization outside KeyStore class

### C003: FileTree Abstraction
**Type:** Technical
**Description:** Collection persistence uses FileTree abstraction, not direct file access
**Impact:** Encrypted collections must serialize to JSON string stored via FileTree
**Mitigation:** Use existing EditableCollection.serialize() → FileTree.setRawContents() flow

### C004: React State Management
**Type:** Technical
**Description:** SecuritySection must integrate with existing reactive workspace pattern
**Impact:** UI updates must trigger via workspace.notifyChange(), not direct state mutations
**Mitigation:** Follow existing pattern from useCollectionActions

---

## Assumptions

### A001: BrowserCryptoProvider Availability
**Assumption:** WebCrypto API is available in all target browsers
**Risk if False:** High - encryption operations fail completely
**Validation Method:** Platform init checks for crypto.subtle availability

### A002: localStorage Quota Sufficient
**Assumption:** localStorage has sufficient quota for keystore + encrypted collections
**Risk if False:** Medium - save operations fail with quota exceeded errors
**Validation Method:** Detect quota errors during save and notify user

### A003: Single-Device Usage
**Assumption:** Keystore is device-local; no multi-device sync required
**Risk if False:** Low - feature still works, just isolated per-device
**Validation Method:** Documentation clarifies device-local nature

### A004: Password Not Forgotten
**Assumption:** Users manage their own password recovery (no password reset flow)
**Risk if False:** Medium - users locked out of encrypted collections permanently
**Validation Method:** UI warnings about password recovery responsibility

---

## Out of Scope

### Cloud Keystore Sync
**Description:** Synchronizing keystore across devices via cloud storage
**Reason:** Adds significant complexity; device-local is sufficient for MVP
**Future Consideration:** true

### Password Strength Meter
**Description:** Visual feedback on password strength during entry
**Reason:** Nice-to-have; basic validation sufficient for now
**Future Consideration:** true

### Keystore Export/Import
**Description:** UI for exporting keystore to file and importing on another device
**Reason:** Advanced feature; can be added if multi-device demand emerges
**Future Consideration:** true

### Secret-Level Access Control
**Description:** Per-secret permissions or access logs
**Reason:** Over-engineering for single-user local app
**Future Consideration:** false

### Hardware Security Module Integration
**Description:** Storing keys in OS keychain or hardware tokens
**Reason:** Beyond scope of web app; requires native capabilities
**Future Consideration:** false

---

## Exit Criteria

### EC001: Keystore Persistence Functional
**Category:** Functional
**Description:** User can set password, create encrypted collection, reload page, unlock keystore, and access collection
**Verification Method:** Manual user workflow test
**Responsible Party:** Senior SDET
**Completion Evidence:** End-to-end workflow video or test report
**Blocking:** true

### EC002: All Functional Tests Pass
**Category:** Validation
**Description:** 100% test coverage achieved for keystoreStorage, saveEditableCollection, SecuritySection
**Verification Method:** Automated test suite
**Responsible Party:** Developer
**Completion Evidence:** Coverage report showing 100% across all metrics
**Blocking:** true

### EC003: No Linting or Type Errors
**Category:** Technical
**Description:** All new code passes TypeScript strict checks and linting
**Verification Method:** Automated CI pipeline
**Responsible Party:** Developer
**Completion Evidence:** rush build && rush lint succeeds with no errors
**Blocking:** true

### EC004: SecuritySection UI Complete
**Category:** Functional
**Description:** SecuritySection displays status and provides password management dialogs
**Verification Method:** Manual UI testing
**Responsible Party:** Senior SDET
**Completion Evidence:** UI screenshots showing all states (no keystore, locked, unlocked)
**Blocking:** true

### EC005: Keystore Survives Page Reload
**Category:** Functional
**Description:** After setting password and adding secret, page reload preserves keystore state
**Verification Method:** Manual test
**Responsible Party:** Senior SDET
**Completion Evidence:** Test demonstrating keystore unlock after reload with same password
**Blocking:** true

### EC006: Error Handling Comprehensive
**Category:** Validation
**Description:** All error paths have tests and produce user-friendly messages
**Verification Method:** Automated tests + manual error scenario testing
**Responsible Party:** Senior SDET
**Completion Evidence:** Error scenario test report
**Blocking:** true

### EC007: Integration with Existing Flows
**Category:** Functional
**Description:** Keystore persistence integrates seamlessly with create/export collection actions
**Verification Method:** Manual integration testing
**Responsible Party:** Senior SDET
**Completion Evidence:** Integration test report covering collection create → encrypt → reload → export
**Blocking:** true

### EC008: Documentation Updated
**Category:** Technical
**Description:** TSDoc comments complete for all public APIs
**Verification Method:** Code review
**Responsible Party:** Developer
**Completion Evidence:** API documentation generated successfully
**Blocking:** false

### EC009: No console.error in Happy Path
**Category:** Validation
**Description:** Normal workflows (create encrypted collection, set password) produce no console errors
**Verification Method:** Manual testing with DevTools console monitoring
**Responsible Party:** Senior SDET
**Completion Evidence:** Console log screenshots showing clean execution
**Blocking:** false

### EC010: Backward Compatibility Maintained
**Category:** Technical
**Description:** Existing unencrypted collections continue to work without regression
**Verification Method:** Automated regression test suite
**Responsible Party:** Developer
**Completion Evidence:** All existing collection tests pass
**Blocking:** true

---

## Edge Cases and Error Scenarios

### Edge Case: localStorage Quota Exceeded
**Scenario:** User creates many large encrypted collections until localStorage quota exceeded
**Expected Behavior:** Save operation fails with clear quota error; existing data intact
**Test Strategy:** Mock localStorage to simulate quota error; verify graceful failure

### Edge Case: Concurrent Keystore Modifications
**Scenario:** User triggers multiple operations that modify keystore simultaneously (e.g., rapid collection creation)
**Expected Behavior:** Operations serialize or fail gracefully; no keystore corruption
**Test Strategy:** Simulate concurrent addSecret calls; verify final state consistency

### Edge Case: Browser localStorage Disabled
**Scenario:** User has disabled localStorage in browser settings
**Expected Behavior:** Platform init detects unavailability; provides warning; session-only mode
**Test Strategy:** Mock localStorage as unavailable; verify fallback behavior

### Edge Case: Invalid Keystore Data in localStorage
**Scenario:** localStorage contains corrupt or malicious keystore data
**Expected Behavior:** Load fails with validation error; allows creating new keystore
**Test Strategy:** Inject invalid JSON/structure into localStorage; verify recovery path

### Edge Case: Password Changed While Keystore Locked
**Scenario:** User tries to change password without unlocking keystore first
**Expected Behavior:** UI prompts to unlock before allowing password change
**Test Strategy:** Manual UI flow test; verify unlock-before-change enforcement

### Edge Case: Encrypted Collection Without Secret
**Scenario:** Collection metadata has secretName but secret not in keystore
**Expected Behavior:** Export/save fails with clear "secret not found" error
**Test Strategy:** Create collection referencing non-existent secret; verify error handling

### Error Scenario: Decryption Failure on Load
**Scenario:** Collection encrypted with key that was removed from keystore
**Expected Behavior:** Load fails with "unable to decrypt" error; collection inaccessible
**Test Strategy:** Encrypt collection, remove secret from keystore, attempt load

### Error Scenario: Keystore Password Forgotten
**Scenario:** User forgets keystore password; no recovery mechanism
**Expected Behavior:** Keystore remains locked; user can create new keystore (losing old secrets)
**Test Strategy:** Manual flow test; verify new keystore creation option available

---

## Success Metrics

**Primary Success Criterion:** User can complete full encrypted collection lifecycle without data loss:
1. Create keystore with password
2. Create encrypted collection
3. Reload browser page
4. Unlock keystore with password
5. Access encrypted collection data
6. Export encrypted collection
7. Change keystore password
8. Reload page and unlock with new password

**Technical Success Criteria:**
- 100% test coverage (statements, branches, functions, lines)
- No TypeScript errors or linting violations
- All edge cases handled with Result pattern (no exceptions thrown)
- Zero regressions in existing unencrypted collection workflows

**User Experience Success Criteria:**
- Clear status visibility (locked/unlocked, secret count)
- Actionable error messages (no cryptic crypto errors)
- No silent downgrades (encrypted collections don't fall back to plain without warning)
- Workflow completes in < 5 user actions (set password → create collection → reload → unlock)

---

## Implementation Notes

### File Locations
- **keystoreStorage.ts:** `/libraries/chocolate-lab-ui/src/packlets/workspace/keystoreStorage.ts`
- **saveEditableCollection.ts:** `/libraries/chocolate-lab-ui/src/packlets/workspace/saveEditableCollection.ts`
- **SecuritySection.tsx:** `/libraries/chocolate-lab-ui/src/packlets/settings/sections/SecuritySection.tsx` (already exists, needs implementation)

### Integration Points
- **browserPlatformInit.ts:** After loading keystore, expose storage key for later saves
- **useCollectionActions.ts:** After `keystore.initialize()` or `keystore.addSecret()`, call save helper
- **Workspace.ts:** Expose keystore instance to UI layer for SecuritySection access

### Testing Strategy
1. **Unit Tests:**
   - keystoreStorage: save/load round-trip, error cases, validation
   - saveEditableCollection: encryption paths, fallback paths, error handling
   - SecuritySection: component rendering, dialog interactions (with mock workspace)

2. **Integration Tests:**
   - Full platform init → create encrypted collection → reload → unlock flow
   - Password change workflow
   - Export encrypted collection workflow

3. **Manual Tests:**
   - Browser localStorage persistence across real page reloads
   - DevTools console monitoring for errors
   - UI/UX flow validation

### Dependencies
- **ts-extras:** CryptoUtils.KeyStore (no changes needed)
- **ts-chocolate:** EditableCollection, platformInit interfaces (no changes needed)
- **chocolate-lab-ui:** Workspace, useCollectionActions (modify for persistence)

---

## Risk Assessment

### High Risk: Password Lost = Data Lost
**Mitigation:** Clear UI warnings; documentation about password responsibility; consider future export feature

### Medium Risk: localStorage Quota Exceeded
**Mitigation:** Detect quota errors; provide clear guidance to user; consider compression for large keystores

### Low Risk: Browser Compatibility
**Mitigation:** WebCrypto API widely supported in modern browsers; fallback to warning if unavailable

### Low Risk: Performance with Many Secrets
**Mitigation:** PBKDF2 iteration count may cause UI lag with many secrets; acceptable for < 100 secrets

---

## Verification Plan

### Developer Self-Test Checklist
- [ ] All new functions have TSDoc comments
- [ ] All public APIs return Result<T>
- [ ] No `any` type usage
- [ ] 100% test coverage (run `rushx coverage`)
- [ ] All tests pass (run `rushx test`)
- [ ] No linting errors (run `rushx lint`)
- [ ] Manual workflow test: create encrypted collection → reload → unlock → export

### Senior SDET Validation Checklist
- [ ] End-to-end encrypted collection workflow successful
- [ ] Keystore persistence across page reloads verified
- [ ] Password change workflow tested
- [ ] Error scenarios produce user-friendly messages
- [ ] No console errors during happy path
- [ ] UI states (no keystore, locked, unlocked) render correctly
- [ ] Backward compatibility: unencrypted collections still work

### Final Acceptance Criteria
All exit criteria marked as blocking=true must be satisfied before task completion. Non-blocking criteria should be addressed but won't block merge.
