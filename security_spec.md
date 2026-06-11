# Security Specification: Photos, Collections, and Settings ABAC Rules

This document outlines the security architecture and invariants for the Minimalist Photo Portfolio database collections.

## Core Data Invariants

1. **Portfolio Content Integrity**:
   - Only the authenticated and verified owner, `willymorinigo@gmail.com`, can create, update, or delete `photos`, `collections`, and `settings`.
   - General public (including unauthenticated guests) can `get` and `list` `photos` and `collections` to view the public portfolio.
   - General public CANNOT read, list, update, or delete `settings`. Only the verified owner can read or write settings.

2. **Contact Inbox Confidentiality**:
   - Any public visitor can `create` a message in the `messages` collection (contact form).
   - Once a message is created, it cannot be edited or viewed by the public. Only the verified owner (`willymorinigo@gmail.com`) can list, get, update, or delete messages in the inbox.

3. **Immutable Auditing**:
   - Creation timestamps (`createdAt`) must exactly match `request.time` upon document creation.
   - Last updated timestamps (`updatedAt`) must exactly match `request.time` upon update.
   - Standard structural schema keys must be verified upon creation to prevent shadow fields.

---

## The "Dirty Dozen" Threat Vectors

Below are 12 specific payloads or operations that our firestore rules must strictly block to maintain a Zero-Trust profile:

1. **Unsigned-In Photo Creation**: Guest attempts to inject a spam image into the `/photos` collection.
2. **Owner Spoofing on Photo Update**: Malicious logged-in user (not the owner) trying to modify or delete of a photo.
3. **Ghost Fields on Photo Update**: Attempting to inject a custom field `authorRating: 9999` to compromise schema layouts.
4. **Invalid Photo ID Injecting**: Attempting to upload a photo with a 1MB string or high-charset ID like `/photos/SOME_POISON_STRING_WITH_JUNK_CHARACTERS` causing denial of service or path navigation vulnerabilities.
5. **Collection Theft**: Unauthenticated user trying to delete or rename a curated manual photography collection.
6. **Setting Espionage**: Non-admin authenticated user seeking to read the Owner's Instagram access token in `/settings/config`.
7. **Bypassing Verification**: Setting a user as owner with `email_verified: false` and asserting owner privilege.
8. **Shadow Field spam in Messages**: A chatbot trying to submit a guest message with excessive custom parameters outside `name, email, message, status, createdAt`.
9. **Message Tampering**: Guest attempting to mark another guest's contact message as `read` or modifying the content of existing submissions.
10. **Message Listing Leak**: Guest trying to read or list all submissions in `/messages` to scrape physical emails of other users.
11. **Timestamp Forgery**: Owner or client attempting to set a fictitious historical time (e.g., year 2000) inside `createdAt` during creation instead of using the server's authoritative `request.time`.
12. **Status Shortcut Escape**: Attempting to update a setting block with an invalid status values or unapproved keys.

---

## Technical Security Rule Map

- **Match Path**: `/photos/{photoId}`
  - `read`, `get`, `list`: `true` (universal guest access)
  - `create`, `update`, `delete`: Authorized ONLY if `request.auth.uid != null && request.auth.token.email == "willymorinigo@gmail.com" && request.auth.token.email_verified == true`.
- **Match Path**: `/collections/{collectionId}`
  - `read`, `get`, `list`: `true` (universal guest access)
  - `create`, `update`, `delete`: Authorized ONLY if `request.auth.uid != null && request.auth.token.email == "willymorinigo@gmail.com" && request.auth.token.email_verified == true`.
- **Match Path**: `/messages/{messageId}`
  - `create`: `true` (public submission), matches schema size restriction helper.
  - `read`, `get`, `list`, `update`, `delete`: Authorized ONLY if `request.auth.token.email == "willymorinigo@gmail.com"`.
- **Match Path**: `/settings/{settingId}`
  - `read`, `write`: Authorized ONLY if `request.auth.token.email == "willymorinigo@gmail.com"`.
