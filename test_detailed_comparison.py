import requests
import json

# Test one strategy with detailed output
strategy = {
    "symbol": "2330.TW",
    "start_date": "2024-01-01",
    "end_date": "2024-10-31",
    "initial_capital": 100000,
    "strategy_type": "moving_average",
    "short_period": 5,
    "long_period": 20
}

url = "http://localhost:8000/api/backtest/run"

print("Testing Moving Average Strategy with detailed comparison:\n")
print("="*70)

try:
    response = requests.post(url, json=strategy, timeout=30)
    if response.status_code == 200:
        result = response.json()
        r = result['results']

        print(f"Symbol: {strategy['symbol']}")
        print(f"Period: {strategy['start_date']} to {strategy['end_date']}")
        print(f"Strategy: MA({strategy['short_period']}/{strategy['long_period']})")
        print("="*70)
        print(f"\nInitial Capital: NT$ {r['initial_capital']:,.0f}")
        print(f"Final Value:     NT$ {r['final_value']:,.0f}")
        print(f"\nStrategy Return:   {r['total_return']:7.2f}%")
        print(f"Buy & Hold Return: {r['buy_hold_return']:7.2f}%")
        print(f"Alpha (Difference): {r['total_return'] - r['buy_hold_return']:7.2f}%")
        print(f"\nTotal Trades:   {r['total_trades']}")
        print(f"Winning Trades: {r['winning_trades']}")
        print(f"Losing Trades:  {r['losing_trades']}")
        print(f"Win Rate:       {r['win_rate']:.1f}%")
        print(f"\nSharpe Ratio:   {r['sharpe_ratio']:.2f}")
        print(f"Max Drawdown:   {r['max_drawdown']:.2f}%")

        print(f"\n{'='*70}")
        print("Trade History:")
        print("="*70)
        for i, trade in enumerate(r['trades'][:10], 1):  # Show first 10 trades
            print(f"{i}. {trade['date']} | {trade['action']:4} | Price: NT${trade['price']:.2f} | Shares: {trade['shares']} | Amount: NT${trade['amount']:,.0f}")
            print(f"   Signal: {trade['signal']}")

        if len(r['trades']) > 10:
            print(f"\n... and {len(r['trades']) - 10} more trades")

    else:
        print(f"FAIL: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"ERROR: {e}")

print("="*70)
