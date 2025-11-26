"""
回測引擎
執行策略回測並計算績效指標
修正Look-ahead Bias: 信號產生在i-1天，交易執行在i天的開盤價
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime


class BacktestEngine:
    """回測引擎"""

    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.position = 0  # 持有股數
        self.trades = []  # 交易記錄

    def run_ma_strategy(
        self,
        df: pd.DataFrame,
        short_period: int = 5,
        long_period: int = 20
    ) -> Dict:
        """
        執行移動平均線策略

        Args:
            df: 股票資料 DataFrame
            short_period: 短期均線週期
            long_period: 長期均線週期

        Returns:
            回測結果字典
        """
        # 計算移動平均線
        df = df.copy()
        df['MA_short'] = df['close'].rolling(window=short_period).mean()
        df['MA_long'] = df['close'].rolling(window=long_period).mean()

        # 初始化
        self.cash = self.initial_capital
        self.position = 0
        self.trades = []
        portfolio_values = []

        # 回測邏輯 - 修正Look-ahead Bias
        # 信號產生在i-1天，交易執行在i天的開盤價
        for i in range(len(df)):
            row = df.iloc[i]

            # 計算當前投資組合價值
            portfolio_value = self.cash + self.position * row['close']
            portfolio_values.append(portfolio_value)

            # 需要至少2天的數據才能檢查交叉
            if i < 2:
                continue

            prev_row = df.iloc[i-1]
            prev_prev_row = df.iloc[i-2]

            # 檢查前一天是否有有效的指標數據
            if pd.isna(prev_row['MA_short']) or pd.isna(prev_row['MA_long']):
                continue
            if pd.isna(prev_prev_row['MA_short']) or pd.isna(prev_prev_row['MA_long']):
                continue

            # 買入信號：前一天短期均線上穿長期均線，今天以開盤價執行交易
            if (prev_row['MA_short'] > prev_row['MA_long'] and
                prev_prev_row['MA_short'] <= prev_prev_row['MA_long'] and
                self.position == 0):

                # 以今天的開盤價買入（更真實）
                price = row['open'] if not pd.isna(row['open']) else row['close']
                shares_to_buy = int(self.cash / price)
                if shares_to_buy > 0:
                    cost = shares_to_buy * price
                    self.cash -= cost
                    self.position += shares_to_buy

                    self.trades.append({
                        'date': row['date'],
                        'action': 'BUY',
                        'price': price,
                        'shares': shares_to_buy,
                        'amount': cost,
                        'signal': f'MA short cross above long (signal day: {prev_row["date"]})'
                    })

            # 賣出信號：前一天短期均線下穿長期均線，今天以開盤價執行交易
            elif (prev_row['MA_short'] < prev_row['MA_long'] and
                  prev_prev_row['MA_short'] >= prev_prev_row['MA_long'] and
                  self.position > 0):

                # 以今天的開盤價賣出（更真實）
                price = row['open'] if not pd.isna(row['open']) else row['close']
                revenue = self.position * price
                self.cash += revenue

                self.trades.append({
                    'date': row['date'],
                    'action': 'SELL',
                    'price': price,
                    'shares': self.position,
                    'amount': revenue,
                    'signal': f'MA short cross below long (signal day: {prev_row["date"]})'
                })

                self.position = 0

        # 計算最終價值
        final_value = self.cash + self.position * df.iloc[-1]['close']

        # 計算績效指標
        metrics = self._calculate_metrics(
            portfolio_values,
            df,
            final_value
        )

        # 計算買入持有策略
        buy_hold_value = (self.initial_capital / df.iloc[0]['close']) * df.iloc[-1]['close']
        buy_hold_return = ((buy_hold_value - self.initial_capital) / self.initial_capital) * 100

        return {
            'initial_capital': self.initial_capital,
            'final_value': final_value,
            'total_return': metrics['total_return'],
            'buy_hold_return': buy_hold_return,
            'sharpe_ratio': metrics['sharpe_ratio'],
            'max_drawdown': metrics['max_drawdown'],
            'total_trades': len(self.trades),
            'winning_trades': metrics['winning_trades'],
            'losing_trades': metrics['losing_trades'],
            'win_rate': metrics['win_rate'],
            'trades': self.trades,
            'portfolio_values': portfolio_values,
            'dates': df['date'].tolist(),
            'prices': df['close'].tolist(),
            'ohlc': {
                'open': df['open'].tolist(),
                'high': df['high'].tolist(),
                'low': df['low'].tolist(),
                'close': df['close'].tolist(),
                'volume': df['volume'].tolist() if 'volume' in df.columns else []
            }
        }

    def _calculate_metrics(
        self,
        portfolio_values: List[float],
        df: pd.DataFrame,
        final_value: float
    ) -> Dict:
        """計算績效指標"""

        # 總報酬率
        total_return = ((final_value - self.initial_capital) / self.initial_capital) * 100

        # 計算每日報酬率
        returns = pd.Series(portfolio_values).pct_change().dropna()

        # 夏普比率 (假設無風險利率為0)
        if len(returns) > 0 and returns.std() != 0:
            sharpe_ratio = (returns.mean() / returns.std()) * (252 ** 0.5)  # 年化
        else:
            sharpe_ratio = 0

        # 最大回撤
        portfolio_series = pd.Series(portfolio_values)
        cumulative_max = portfolio_series.cummax()
        drawdown = (portfolio_series - cumulative_max) / cumulative_max
        max_drawdown = drawdown.min() * 100

        # 計算勝率
        winning_trades = 0
        losing_trades = 0

        for i in range(0, len(self.trades) - 1, 2):
            if i + 1 < len(self.trades):
                buy_trade = self.trades[i]
                sell_trade = self.trades[i + 1]

                if sell_trade['amount'] > buy_trade['amount']:
                    winning_trades += 1
                else:
                    losing_trades += 1

        total_closed_trades = winning_trades + losing_trades
        win_rate = (winning_trades / total_closed_trades * 100) if total_closed_trades > 0 else 0

        return {
            'total_return': round(total_return, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'max_drawdown': round(max_drawdown, 2),
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': round(win_rate, 2)
        }

    def run_rsi_strategy(
        self,
        df: pd.DataFrame,
        rsi_period: int = 14,
        rsi_overbought: int = 70,
        rsi_oversold: int = 30
    ) -> Dict:
        """
        執行RSI策略
        當RSI < oversold 買入，RSI > overbought 賣出
        修正Look-ahead Bias: 使用前一天的RSI值來產生今天的交易信號
        """
        df = df.copy()

        # 計算RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))

        # 初始化
        self.cash = self.initial_capital
        self.position = 0
        self.trades = []
        portfolio_values = []

        # 回測邏輯 - 修正Look-ahead Bias
        # 使用前一天的RSI來產生今天的交易信號
        for i in range(len(df)):
            row = df.iloc[i]
            portfolio_value = self.cash + self.position * row['close']
            portfolio_values.append(portfolio_value)

            # 需要至少1天前的數據
            if i < 1:
                continue

            prev_row = df.iloc[i-1]

            # 檢查前一天的RSI是否有效
            if pd.isna(prev_row['RSI']):
                continue

            # 買入信號：前一天RSI < oversold，今天以開盤價買入
            if prev_row['RSI'] < rsi_oversold and self.position == 0:
                price = row['open'] if not pd.isna(row['open']) else row['close']
                shares_to_buy = int(self.cash / price)
                if shares_to_buy > 0:
                    cost = shares_to_buy * price
                    self.cash -= cost
                    self.position += shares_to_buy

                    self.trades.append({
                        'date': row['date'],
                        'action': 'BUY',
                        'price': price,
                        'shares': shares_to_buy,
                        'amount': cost,
                        'signal': f'RSI oversold (prev day RSI: {prev_row["RSI"]:.1f} < {rsi_oversold})'
                    })

            # 賣出信號：前一天RSI > overbought，今天以開盤價賣出
            elif prev_row['RSI'] > rsi_overbought and self.position > 0:
                price = row['open'] if not pd.isna(row['open']) else row['close']
                revenue = self.position * price
                self.cash += revenue

                self.trades.append({
                    'date': row['date'],
                    'action': 'SELL',
                    'price': price,
                    'shares': self.position,
                    'amount': revenue,
                    'signal': f'RSI overbought (prev day RSI: {prev_row["RSI"]:.1f} > {rsi_overbought})'
                })

                self.position = 0

        # 計算最終結果
        final_value = self.cash + self.position * df.iloc[-1]['close']
        metrics = self._calculate_metrics(portfolio_values, df, final_value)
        buy_hold_value = (self.initial_capital / df.iloc[0]['close']) * df.iloc[-1]['close']
        buy_hold_return = ((buy_hold_value - self.initial_capital) / self.initial_capital) * 100

        return {
            'initial_capital': self.initial_capital,
            'final_value': final_value,
            'total_return': metrics['total_return'],
            'buy_hold_return': buy_hold_return,
            'sharpe_ratio': metrics['sharpe_ratio'],
            'max_drawdown': metrics['max_drawdown'],
            'total_trades': len(self.trades),
            'winning_trades': metrics['winning_trades'],
            'losing_trades': metrics['losing_trades'],
            'win_rate': metrics['win_rate'],
            'trades': self.trades,
            'portfolio_values': portfolio_values,
            'dates': df['date'].tolist(),
            'prices': df['close'].tolist(),
            'ohlc': {
                'open': df['open'].tolist(),
                'high': df['high'].tolist(),
                'low': df['low'].tolist(),
                'close': df['close'].tolist(),
                'volume': df['volume'].tolist() if 'volume' in df.columns else []
            }
        }

    def run_macd_strategy(
        self,
        df: pd.DataFrame,
        macd_fast: int = 12,
        macd_slow: int = 26,
        macd_signal: int = 9
    ) -> Dict:
        """
        執行MACD策略
        MACD線上穿信號線買入，下穿賣出
        修正Look-ahead Bias: 使用前一天的MACD交叉來產生今天的交易信號
        """
        df = df.copy()

        # 計算MACD
        ema_fast = df['close'].ewm(span=macd_fast, adjust=False).mean()
        ema_slow = df['close'].ewm(span=macd_slow, adjust=False).mean()
        df['MACD'] = ema_fast - ema_slow
        df['MACD_signal'] = df['MACD'].ewm(span=macd_signal, adjust=False).mean()
        df['MACD_hist'] = df['MACD'] - df['MACD_signal']

        # 初始化
        self.cash = self.initial_capital
        self.position = 0
        self.trades = []
        portfolio_values = []

        # 回測邏輯 - 修正Look-ahead Bias
        # 使用前一天和前兩天的數據來檢測交叉，今天執行交易
        for i in range(len(df)):
            row = df.iloc[i]
            portfolio_value = self.cash + self.position * row['close']
            portfolio_values.append(portfolio_value)

            # 需要至少2天的數據才能檢查交叉
            if i < 2:
                continue

            prev_row = df.iloc[i-1]
            prev_prev_row = df.iloc[i-2]

            # 檢查前面兩天的MACD是否有效
            if pd.isna(prev_row['MACD']) or pd.isna(prev_row['MACD_signal']):
                continue
            if pd.isna(prev_prev_row['MACD']) or pd.isna(prev_prev_row['MACD_signal']):
                continue

            # 買入信號：前一天MACD上穿信號線，今天以開盤價買入
            if (prev_row['MACD'] > prev_row['MACD_signal'] and
                prev_prev_row['MACD'] <= prev_prev_row['MACD_signal'] and
                self.position == 0):

                price = row['open'] if not pd.isna(row['open']) else row['close']
                shares_to_buy = int(self.cash / price)
                if shares_to_buy > 0:
                    cost = shares_to_buy * price
                    self.cash -= cost
                    self.position += shares_to_buy

                    self.trades.append({
                        'date': row['date'],
                        'action': 'BUY',
                        'price': price,
                        'shares': shares_to_buy,
                        'amount': cost,
                        'signal': f'MACD cross above signal (signal day: {prev_row["date"]})'
                    })

            # 賣出信號：前一天MACD下穿信號線，今天以開盤價賣出
            elif (prev_row['MACD'] < prev_row['MACD_signal'] and
                  prev_prev_row['MACD'] >= prev_prev_row['MACD_signal'] and
                  self.position > 0):

                price = row['open'] if not pd.isna(row['open']) else row['close']
                revenue = self.position * price
                self.cash += revenue

                self.trades.append({
                    'date': row['date'],
                    'action': 'SELL',
                    'price': price,
                    'shares': self.position,
                    'amount': revenue,
                    'signal': f'MACD cross below signal (signal day: {prev_row["date"]})'
                })

                self.position = 0

        # 計算最終結果
        final_value = self.cash + self.position * df.iloc[-1]['close']
        metrics = self._calculate_metrics(portfolio_values, df, final_value)
        buy_hold_value = (self.initial_capital / df.iloc[0]['close']) * df.iloc[-1]['close']
        buy_hold_return = ((buy_hold_value - self.initial_capital) / self.initial_capital) * 100

        return {
            'initial_capital': self.initial_capital,
            'final_value': final_value,
            'total_return': metrics['total_return'],
            'buy_hold_return': buy_hold_return,
            'sharpe_ratio': metrics['sharpe_ratio'],
            'max_drawdown': metrics['max_drawdown'],
            'total_trades': len(self.trades),
            'winning_trades': metrics['winning_trades'],
            'losing_trades': metrics['losing_trades'],
            'win_rate': metrics['win_rate'],
            'trades': self.trades,
            'portfolio_values': portfolio_values,
            'dates': df['date'].tolist(),
            'prices': df['close'].tolist(),
            'ohlc': {
                'open': df['open'].tolist(),
                'high': df['high'].tolist(),
                'low': df['low'].tolist(),
                'close': df['close'].tolist(),
                'volume': df['volume'].tolist() if 'volume' in df.columns else []
            }
        }

    def run_bollinger_bands_strategy(
        self,
        df: pd.DataFrame,
        bb_period: int = 20,
        bb_std_dev: float = 2.0
    ) -> Dict:
        """
        執行布林通道策略
        價格觸及下軌買入，觸及上軌賣出
        修正Look-ahead Bias: 使用前一天的價格和布林通道來產生今天的交易信號
        """
        df = df.copy()

        # 計算布林通道
        df['BB_middle'] = df['close'].rolling(window=bb_period).mean()
        df['BB_std'] = df['close'].rolling(window=bb_period).std()
        df['BB_upper'] = df['BB_middle'] + (df['BB_std'] * bb_std_dev)
        df['BB_lower'] = df['BB_middle'] - (df['BB_std'] * bb_std_dev)

        # 初始化
        self.cash = self.initial_capital
        self.position = 0
        self.trades = []
        portfolio_values = []

        # 回測邏輯 - 修正Look-ahead Bias
        # 使用前一天的價格和布林通道來產生今天的交易信號
        for i in range(len(df)):
            row = df.iloc[i]
            portfolio_value = self.cash + self.position * row['close']
            portfolio_values.append(portfolio_value)

            # 需要至少1天前的數據
            if i < 1:
                continue

            prev_row = df.iloc[i-1]

            # 檢查前一天的布林通道是否有效
            if pd.isna(prev_row['BB_upper']) or pd.isna(prev_row['BB_lower']):
                continue

            # 買入信號：前一天價格觸及下軌，今天以開盤價買入
            if prev_row['close'] <= prev_row['BB_lower'] and self.position == 0:
                price = row['open'] if not pd.isna(row['open']) else row['close']
                shares_to_buy = int(self.cash / price)
                if shares_to_buy > 0:
                    cost = shares_to_buy * price
                    self.cash -= cost
                    self.position += shares_to_buy

                    self.trades.append({
                        'date': row['date'],
                        'action': 'BUY',
                        'price': price,
                        'shares': shares_to_buy,
                        'amount': cost,
                        'signal': f'Price at lower band (prev day: {prev_row["close"]:.2f} <= {prev_row["BB_lower"]:.2f})'
                    })

            # 賣出信號：前一天價格觸及上軌，今天以開盤價賣出
            elif prev_row['close'] >= prev_row['BB_upper'] and self.position > 0:
                price = row['open'] if not pd.isna(row['open']) else row['close']
                revenue = self.position * price
                self.cash += revenue

                self.trades.append({
                    'date': row['date'],
                    'action': 'SELL',
                    'price': price,
                    'shares': self.position,
                    'amount': revenue,
                    'signal': f'Price at upper band (prev day: {prev_row["close"]:.2f} >= {prev_row["BB_upper"]:.2f})'
                })

                self.position = 0

        # 計算最終結果
        final_value = self.cash + self.position * df.iloc[-1]['close']
        metrics = self._calculate_metrics(portfolio_values, df, final_value)
        buy_hold_value = (self.initial_capital / df.iloc[0]['close']) * df.iloc[-1]['close']
        buy_hold_return = ((buy_hold_value - self.initial_capital) / self.initial_capital) * 100

        return {
            'initial_capital': self.initial_capital,
            'final_value': final_value,
            'total_return': metrics['total_return'],
            'buy_hold_return': buy_hold_return,
            'sharpe_ratio': metrics['sharpe_ratio'],
            'max_drawdown': metrics['max_drawdown'],
            'total_trades': len(self.trades),
            'winning_trades': metrics['winning_trades'],
            'losing_trades': metrics['losing_trades'],
            'win_rate': metrics['win_rate'],
            'trades': self.trades,
            'portfolio_values': portfolio_values,
            'dates': df['date'].tolist(),
            'prices': df['close'].tolist(),
            'ohlc': {
                'open': df['open'].tolist(),
                'high': df['high'].tolist(),
                'low': df['low'].tolist(),
                'close': df['close'].tolist(),
                'volume': df['volume'].tolist() if 'volume' in df.columns else []
            }
        }

    def run_grid_trading_strategy(
        self,
        df: pd.DataFrame,
        grid_lower_price: float = 0,
        grid_upper_price: float = 0,
        grid_num_grids: int = 10,
        grid_investment_per_grid: float = 10000
    ) -> Dict:
        """
        執行網格交易策略
        在價格區間內設置多個網格，價格下跌時買入，上漲時賣出
        修正Look-ahead Bias: 使用前一天的收盤價來判斷是否觸及網格

        Args:
            df: 股票資料 DataFrame
            grid_lower_price: 網格下限價格（0表示自動設定為最低價）
            grid_upper_price: 網格上限價格（0表示自動設定為最高價）
            grid_num_grids: 網格數量
            grid_investment_per_grid: 每個網格的投資金額

        Returns:
            回測結果字典
        """
        df = df.copy()

        # 自動設定網格範圍（如果未指定）
        if grid_lower_price == 0:
            grid_lower_price = df['close'].min() * 0.9  # 最低價的90%
        if grid_upper_price == 0:
            grid_upper_price = df['close'].max() * 1.1  # 最高價的110%

        # 計算網格價格
        grid_step = (grid_upper_price - grid_lower_price) / grid_num_grids
        grid_prices = [grid_lower_price + i * grid_step for i in range(grid_num_grids + 1)]

        print(f"   Grid range: NT${grid_lower_price:.2f} - NT${grid_upper_price:.2f}")
        print(f"   Grid step: NT${grid_step:.2f}")
        print(f"   Grid prices: {[f'{p:.2f}' for p in grid_prices[:5]]}...")

        # 初始化
        self.cash = self.initial_capital
        self.position = 0
        self.trades = []
        portfolio_values = []

        # 追蹤每個網格的狀態（是否已買入）
        grid_status = {i: False for i in range(grid_num_grids)}

        # 回測邏輯 - 修正Look-ahead Bias
        # 使用前一天的價格判斷是否觸及網格，今天以開盤價執行交易
        for i in range(len(df)):
            row = df.iloc[i]
            portfolio_value = self.cash + self.position * row['close']
            portfolio_values.append(portfolio_value)

            # 需要至少1天前的數據
            if i < 1:
                continue

            prev_row = df.iloc[i-1]
            prev_price = prev_row['close']
            current_price = row['open'] if not pd.isna(row['open']) else row['close']

            # 檢查是否觸及買入網格（價格下跌）
            for grid_idx in range(grid_num_grids):
                grid_buy_price = grid_prices[grid_idx]

                # 前一天價格低於網格價格，且該網格未買入，且有足夠資金
                if (prev_price <= grid_buy_price and
                    not grid_status[grid_idx] and
                    self.cash >= grid_investment_per_grid):

                    shares_to_buy = int(grid_investment_per_grid / current_price)
                    if shares_to_buy > 0:
                        actual_cost = shares_to_buy * current_price
                        if actual_cost <= self.cash:
                            self.cash -= actual_cost
                            self.position += shares_to_buy
                            grid_status[grid_idx] = True

                            self.trades.append({
                                'date': row['date'],
                                'action': 'BUY',
                                'price': current_price,
                                'shares': shares_to_buy,
                                'amount': actual_cost,
                                'signal': f'Grid buy at level {grid_idx} (NT${grid_buy_price:.2f})'
                            })

            # 檢查是否觸及賣出網格（價格上漲）
            for grid_idx in range(grid_num_grids):
                grid_sell_price = grid_prices[grid_idx + 1] if grid_idx < grid_num_grids else grid_upper_price

                # 前一天價格高於網格價格，且該網格已買入，且有持倉
                if (prev_price >= grid_sell_price and
                    grid_status[grid_idx] and
                    self.position > 0):

                    # 賣出該網格對應的股數（簡化：平均分配）
                    shares_to_sell = int(self.position / sum(grid_status.values()))
                    if shares_to_sell > 0:
                        revenue = shares_to_sell * current_price
                        self.cash += revenue
                        self.position -= shares_to_sell
                        grid_status[grid_idx] = False

                        self.trades.append({
                            'date': row['date'],
                            'action': 'SELL',
                            'price': current_price,
                            'shares': shares_to_sell,
                            'amount': revenue,
                            'signal': f'Grid sell at level {grid_idx + 1} (NT${grid_sell_price:.2f})'
                        })

        # 計算最終結果
        final_value = self.cash + self.position * df.iloc[-1]['close']
        metrics = self._calculate_metrics(portfolio_values, df, final_value)
        buy_hold_value = (self.initial_capital / df.iloc[0]['close']) * df.iloc[-1]['close']
        buy_hold_return = ((buy_hold_value - self.initial_capital) / self.initial_capital) * 100

        return {
            'initial_capital': self.initial_capital,
            'final_value': final_value,
            'total_return': metrics['total_return'],
            'buy_hold_return': buy_hold_return,
            'sharpe_ratio': metrics['sharpe_ratio'],
            'max_drawdown': metrics['max_drawdown'],
            'total_trades': len(self.trades),
            'winning_trades': metrics['winning_trades'],
            'losing_trades': metrics['losing_trades'],
            'win_rate': metrics['win_rate'],
            'trades': self.trades,
            'portfolio_values': portfolio_values,
            'dates': df['date'].tolist(),
            'prices': df['close'].tolist(),
            'ohlc': {
                'open': df['open'].tolist(),
                'high': df['high'].tolist(),
                'low': df['low'].tolist(),
                'close': df['close'].tolist(),
                'volume': df['volume'].tolist() if 'volume' in df.columns else []
            }
        }
