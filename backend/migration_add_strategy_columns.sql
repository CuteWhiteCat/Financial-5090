-- Migration: Add individual strategy parameter columns to strategies table
-- This migration adds columns for strategy parameters that were previously stored in JSONB

-- Add strategy parameter columns
ALTER TABLE strategies
ADD COLUMN IF NOT EXISTS initial_capital NUMERIC(15, 2) DEFAULT 100000,
ADD COLUMN IF NOT EXISTS short_period INTEGER,
ADD COLUMN IF NOT EXISTS long_period INTEGER,
ADD COLUMN IF NOT EXISTS rsi_period INTEGER,
ADD COLUMN IF NOT EXISTS rsi_overbought INTEGER,
ADD COLUMN IF NOT EXISTS rsi_oversold INTEGER,
ADD COLUMN IF NOT EXISTS macd_fast INTEGER,
ADD COLUMN IF NOT EXISTS macd_slow INTEGER,
ADD COLUMN IF NOT EXISTS macd_signal INTEGER,
ADD COLUMN IF NOT EXISTS bb_period INTEGER,
ADD COLUMN IF NOT EXISTS bb_std_dev NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS grid_lower_price NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS grid_upper_price NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS grid_num_grids INTEGER,
ADD COLUMN IF NOT EXISTS grid_investment_per_grid NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS stop_loss_pct NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS take_profit_pct NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS position_size_pct NUMERIC(10, 2);

-- Make parameters column nullable since we're now using individual columns
ALTER TABLE strategies ALTER COLUMN parameters DROP NOT NULL;

-- Update existing records to extract parameters from JSONB (if any exist)
UPDATE strategies
SET
    initial_capital = COALESCE((parameters->>'initial_capital')::numeric, 100000),
    short_period = (parameters->>'short_period')::integer,
    long_period = (parameters->>'long_period')::integer,
    rsi_period = (parameters->>'rsi_period')::integer,
    rsi_overbought = (parameters->>'rsi_overbought')::integer,
    rsi_oversold = (parameters->>'rsi_oversold')::integer,
    macd_fast = (parameters->>'macd_fast')::integer,
    macd_slow = (parameters->>'macd_slow')::integer,
    macd_signal = (parameters->>'macd_signal')::integer,
    bb_period = (parameters->>'bb_period')::integer,
    bb_std_dev = (parameters->>'bb_std_dev')::numeric,
    grid_lower_price = (parameters->>'grid_lower_price')::numeric,
    grid_upper_price = (parameters->>'grid_upper_price')::numeric,
    grid_num_grids = (parameters->>'grid_num_grids')::integer,
    grid_investment_per_grid = (parameters->>'grid_investment_per_grid')::numeric,
    stop_loss_pct = (parameters->>'stop_loss_pct')::numeric,
    take_profit_pct = (parameters->>'take_profit_pct')::numeric,
    position_size_pct = (parameters->>'position_size_pct')::numeric
WHERE parameters IS NOT NULL AND parameters != 'null'::jsonb;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added strategy parameter columns';
END $$;
