import requests
import json

# Test all strategies
strategies_to_test = [
    {
        "name": "MA",
        "symbol": "2330.TW",
        "start_date": "2024-01-01",
        "end_date": "2024-10-31",
        "initial_capital": 100000,
        "strategy_type": "moving_average",
        "short_period": 5,
        "long_period": 20
    },
    {
        "name": "RSI",
        "symbol": "2330.TW",
        "start_date": "2024-01-01",
        "end_date": "2024-10-31",
        "initial_capital": 100000,
        "strategy_type": "rsi",
        "rsi_period": 14,
        "rsi_overbought": 70,
        "rsi_oversold": 30
    },
    {
        "name": "MACD",
        "symbol": "2330.TW",
        "start_date": "2024-01-01",
        "end_date": "2024-10-31",
        "initial_capital": 100000,
        "strategy_type": "macd",
        "macd_fast": 12,
        "macd_slow": 26,
        "macd_signal": 9
    },
    {
        "name": "Bollinger Bands",
        "symbol": "2330.TW",
        "start_date": "2024-01-01",
        "end_date": "2024-10-31",
        "initial_capital": 100000,
        "strategy_type": "bollinger_bands",
        "bb_period": 20,
        "bb_std_dev": 2.0
    },
    {
        "name": "Grid Trading",
        "symbol": "2330.TW",
        "start_date": "2024-01-01",
        "end_date": "2024-10-31",
        "initial_capital": 100000,
        "strategy_type": "grid_trading",
        "grid_lower_price": 0,
        "grid_upper_price": 0,
        "grid_num_grids": 10,
        "grid_investment_per_grid": 10000
    }
]

url = "http://localhost:8000/api/backtest/run"

print("Testing all strategies:\n")
print("="*60)

for strategy in strategies_to_test:
    name = strategy.pop('name')
    try:
        response = requests.post(url, json=strategy, timeout=30)
        if response.status_code == 200:
            result = response.json()
            r = result['results']
            print(f"{name:20} | Return: {r['total_return']:7.2f}% | Trades: {r['total_trades']:3} | Win Rate: {r['win_rate']:5.1f}%")
        else:
            print(f"{name:20} | FAIL: {response.status_code}")
    except Exception as e:
        print(f"{name:20} | ERROR: {e}")

print("="*60)
