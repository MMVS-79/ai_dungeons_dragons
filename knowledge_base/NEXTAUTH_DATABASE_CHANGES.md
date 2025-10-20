users (core user identity)
├── One-to-Many → accounts (OAuth provider accounts)
├── One-to-Many → sessions (active sessions)
└── One-to-Many → event_history/campaigns (game data)

accounts (OAuth provider mapping)
└── Many-to-One → users

sessions (session management)
└── Many-to-One → users

verification_tokens (optional, for future use)

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

- Existing `event_history`, `campaigns`, `characters`, and other game tables remain unchanged
- Can add `user_id` foreign key to `event_history` table later to track which user performed actions (optional enhancement)
