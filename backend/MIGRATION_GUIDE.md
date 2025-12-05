# Database Migration Guide

## Issue Fixed
Fixed UUID vs int type mismatch between PostgreSQL database schema and Pydantic models.

## Changes Made

### 1. Updated Pydantic Models
- `app/api/auth.py`: Changed `UserResponse.id` from `int` to `UUID`
- `app/api/strategies.py`: Changed `StrategyResponse.id` and `user_id` from `int` to `UUID`
- Updated all route parameters in `strategies.py` from `int` to `UUID`

### 2. Database Schema Update
The database schema needs to be updated to add individual columns for strategy parameters.

## Running the Migration

### Option 1: Using psql command line
```bash
# Connect to your database
psql -U postgres -d trading_simulator

# Run the migration
\i migration_add_strategy_columns.sql
```

### Option 2: Using Python
```python
import psycopg2
from psycopg2 import sql

# Read your .env file for database connection
conn = psycopg2.connect("postgresql://postgres:your_password@localhost:5432/trading_simulator")
cur = conn.cursor()

with open('migration_add_strategy_columns.sql', 'r') as f:
    cur.execute(f.read())

conn.commit()
cur.close()
conn.close()
```

### Option 3: Using pgAdmin
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Load and execute `migration_add_strategy_columns.sql`

## Verification

After running the migration, verify the changes:

```sql
-- Check strategies table structure
\d strategies

-- Or in SQL:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'strategies'
ORDER BY ordinal_position;
```

You should see the new columns:
- initial_capital (numeric)
- short_period (integer)
- long_period (integer)
- rsi_period (integer)
- rsi_overbought (integer)
- rsi_oversold (integer)
- macd_fast (integer)
- macd_slow (integer)
- macd_signal (integer)
- bb_period (integer)
- bb_std_dev (numeric)
- grid_lower_price (numeric)
- grid_upper_price (numeric)
- grid_num_grids (integer)
- grid_investment_per_grid (numeric)
- stop_loss_pct (numeric)
- take_profit_pct (numeric)
- position_size_pct (numeric)

## Rollback (if needed)

If you need to rollback this migration:

```sql
ALTER TABLE strategies
DROP COLUMN IF EXISTS initial_capital,
DROP COLUMN IF EXISTS short_period,
DROP COLUMN IF EXISTS long_period,
DROP COLUMN IF EXISTS rsi_period,
DROP COLUMN IF EXISTS rsi_overbought,
DROP COLUMN IF EXISTS rsi_oversold,
DROP COLUMN IF EXISTS macd_fast,
DROP COLUMN IF EXISTS macd_slow,
DROP COLUMN IF EXISTS macd_signal,
DROP COLUMN IF EXISTS bb_period,
DROP COLUMN IF EXISTS bb_std_dev,
DROP COLUMN IF EXISTS grid_lower_price,
DROP COLUMN IF EXISTS grid_upper_price,
DROP COLUMN IF EXISTS grid_num_grids,
DROP COLUMN IF EXISTS grid_investment_per_grid,
DROP COLUMN IF EXISTS stop_loss_pct,
DROP COLUMN IF EXISTS take_profit_pct,
DROP COLUMN IF EXISTS position_size_pct;

ALTER TABLE strategies ALTER COLUMN parameters SET NOT NULL;
```

## Notes
- The `parameters` JSONB column is kept for backward compatibility but is now optional
- Existing data in `parameters` will be migrated to the new columns
- Future strategy records will use the individual columns instead of JSONB
