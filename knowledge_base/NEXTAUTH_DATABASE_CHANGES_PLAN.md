# Auth.js v5 Database Schema Changes

"⚠️ This is a planned change. Current accounts table has NOT been migrated yet."

## Overview

This document outlines all database schema modifications required to integrate Auth.js v5 with Google OAuth authentication into the AI Dungeons & Dragons project. Auth.js requires specific tables to manage user authentication, sessions, and OAuth provider accounts.

## Current State

**Current `accounts` table:**

```sql
CREATE TABLE accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

This table will be replaced/repurposed by Auth.js requirements.

## Required Schema Changes

### 1. New `users` Table (Replaces/Extends Current `accounts`)

This is the primary user table that Auth.js uses for core user identity.

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    emailVerified TIMESTAMP NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_email (email)
)
```

**Key Differences from Current Schema:**

- `id` changed from auto-increment INT to VARCHAR(255) (Auth.js uses UUIDs)
- Added `name` field (populated from Google profile)
- Added `emailVerified` (nullable timestamp for email verification)
- Added `image` field (populated from Google profile picture)
- Removed custom timestamps for auto-managed Auth.js timestamps

**Migration Strategy:**

- Current `accounts` data must be migrated to new `users` table
- Generate UUIDs for existing email entries
- New users will be created automatically by Auth.js during OAuth signup

---

### 2. New `accounts` Table (OAuth Provider Mapping)

This table maps user accounts to OAuth providers and provider account IDs. **Note:** This is different from the current `accounts` table—it stores provider-specific data.

```sql
CREATE TABLE accounts (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    providerAccountId VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    access_token TEXT,
    expires_at INT,
    token_type VARCHAR(255),
    scope TEXT,
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_provider_account (provider, providerAccountId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_userId (userId)
)
```

**Purpose:**

- Links OAuth providers (Google, etc.) to user accounts
- Stores OAuth tokens and related metadata
- For Google OAuth, this will store the Google account ID and refresh tokens

**Example Data:**

```
id: "uuid-123"
userId: "uuid-user-456"
type: "oauth"
provider: "google"
providerAccountId: "118364965413298765432"
access_token: "ya29.a0AfH6SMB..."
refresh_token: "1//..."
expires_at: 1635701234
scope: "profile email"
```

---

### 3. New `sessions` Table

Manages user session data for authentication persistence.

```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    sessionToken VARCHAR(255) NOT NULL UNIQUE,
    userId VARCHAR(255) NOT NULL,
    expires DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_userId (userId),
    KEY idx_expires (expires)
)
```

**Purpose:**

- Tracks active user sessions
- Stores session tokens used for authentication
- Sessions expire based on the `expires` field
- Database cleanup of expired sessions should run periodically (optional)

---

### 4. New `verification_tokens` Table

Optional table for email verification (included for completeness, though not needed for OAuth-only setup).

```sql
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (identifier, token),
    KEY idx_expires (expires)
)
```

**Purpose:**

- Email verification tokens for passwordless/email authentication flows
- Not required for Google OAuth-only setup, but recommended for future flexibility

---

## Schema Diagram

```
users (core user identity)
├── One-to-Many → accounts (OAuth provider accounts)
├── One-to-Many → sessions (active sessions)
└── One-to-Many → logs/campaigns (game data)

accounts (OAuth provider mapping)
└── Many-to-One → users

sessions (session management)
└── Many-to-One → users

verification_tokens (optional, for future use)
```

---

## Important Notes

### Data Types

- IDs are VARCHAR(255) to accommodate UUIDs from Auth.js
- Token fields are TEXT to store long JWT/OAuth tokens
- Timestamps use DATETIME for compatibility with Auth.js queries

### Foreign Keys

- All foreign keys use CASCADE ON DELETE for automatic cleanup
- Indexes on `userId` and `expires` for query performance
- UNIQUE constraint on provider account mapping to prevent duplicates

### Backward Compatibility

- Existing `logs`, `campaigns`, `characters`, and other game tables remain unchanged
- Can add `user_id` foreign key to `logs` table later to track which user performed actions (optional enhancement)
- Current game functionality will continue to work during migration

### Session Management

- Sessions are automatically managed by Auth.js
- Expired sessions should be cleaned up periodically (can be done via cron job)
- Session token is used for cookie-based authentication

---

## References

- Auth.js MySQL Adapter: <https://authjs.dev/guides/adapters/mysql>
- Auth.js Session Management: <https://authjs.dev/concepts/session-strategies>
- OAuth 2.0 Specification: <https://oauth.net/2/>
