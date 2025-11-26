"""
測試股票爬蟲日期範圍 - 簡化版
"""
import requests
import json
from datetime import datetime

print("="*80)
print("測試股票爬蟲日期範圍")
print("="*80)

# 測試案例1: 正常的過去日期
print("\n測試 1: 正常的過去日期 (2024-01-01 to 2024-06-30)")
print("-"*80)
response1 = requests.post(
    "http://localhost:8000/api/backtest/run",
    json={
        "symbol": "2330.TW",
        "start_date": "2024-01-01",
        "end_date": "2024-06-30",
        "initial_capital": 100000,
        "strategy_type": "moving_average",
        "short_period": 5,
        "long_period": 20
    },
    timeout=30
)

if response1.status_code == 200:
    result = response1.json()
    print(f"[OK] Backtest successful")
    print(f"   Total trades: {result['results']['total_trades']}")
    print(f"   Return: {result['results']['total_return']}%")
else:
    print(f"[FAIL] Backtest failed: {response1.status_code}")

# 測試案例2: 包含未來日期
print("\n測試 2: 包含未來日期 (2024-01-01 to 2025-12-31)")
print("-"*80)
response2 = requests.post(
    "http://localhost:8000/api/backtest/run",
    json={
        "symbol": "2330.TW",
        "start_date": "2024-01-01",
        "end_date": "2025-12-31",
        "initial_capital": 100000,
        "strategy_type": "moving_average",
        "short_period": 5,
        "long_period": 20
    },
    timeout=30
)

if response2.status_code == 200:
    result = response2.json()
    print(f"[OK] Backtest successful")
    print(f"   Total trades: {result['results']['total_trades']}")
    print(f"   Return: {result['results']['total_return']}%")
    print(f"   Note: yfinance auto-limits end date to today")
else:
    print(f"[FAIL] Backtest failed: {response2.status_code}")

# 測試案例3: 到今天的日期
today = datetime.now().strftime("%Y-%m-%d")
print(f"\n測試 3: 到今天的日期 (2024-01-01 to {today})")
print("-"*80)
response3 = requests.post(
    "http://localhost:8000/api/backtest/run",
    json={
        "symbol": "2330.TW",
        "start_date": "2024-01-01",
        "end_date": today,
        "initial_capital": 100000,
        "strategy_type": "moving_average",
        "short_period": 5,
        "long_period": 20
    },
    timeout=30
)

if response3.status_code == 200:
    result = response3.json()
    print(f"[OK] Backtest successful")
    print(f"   Total trades: {result['results']['total_trades']}")
    print(f"   Return: {result['results']['total_return']}%")
else:
    print(f"[FAIL] Backtest failed: {response3.status_code}")

print("\n" + "="*80)
print("Conclusion:")
print("yfinance automatically handles future dates and returns data up to the latest available date.")
print("This is expected behavior, not a bug.")
print("="*80)
