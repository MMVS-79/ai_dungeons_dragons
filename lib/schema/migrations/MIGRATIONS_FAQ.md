# Database Migrations

## Why These Migrations?

The LLM service needs to save **full event history** (description + type + stat effects) to enable context chaining. Your original `event_history` table only had a `message` field.

## How to Run

### Option 1: MySQL Command Line
```bash
mysql -u root -p < lib/schema/migrations/001_add_event_data_to_logs.sql
```

### Option 2: MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Open `001_add_event_data_to_logs.sql`
4. Execute the script

## What This Changes

### Before:
```sql
event_history (id, campaign_id, message, created_at)
```

### After:
```sql
event_history (id, campaign_id, message, event_type, event_data, created_at)
```

## Migration Order

1. ✅ Run your existing `rebuild.sql` (sets up base schema)
2. ✅ Run `seed.sql` (adds sample data)
3. ✅ Run `001_add_event_data_to_logs.sql` (adds LLM columns)

## Verify Migration

```sql
-- Check the new columns exist
DESCRIBE event_history;

-- Should show:
-- | Field        | Type         |
-- |--------------|--------------|
-- | id           | int          |
-- | campaign_id  | int          |
-- | message      | text         |
-- | event_type   | varchar(50)  |  ← NEW
-- | event_data   | json         |  ← NEW
-- | created_at   | timestamp    |
```

## Rollback (if needed)

If something goes wrong, you can remove the new columns:

```sql
ALTER TABLE event_history 
DROP COLUMN event_type,
DROP COLUMN event_data;
```

