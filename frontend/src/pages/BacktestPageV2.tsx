import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Link,
  FormControlLabel,
  Radio,
  RadioGroup,
  InputAdornment,
} from '@mui/material';
import { PlayArrow, ShowChart, TrendingUp, TrendingDown, Info, OpenInNew } from '@mui/icons-material';
import { stocksAPI, backtestAPI, strategyAPI, Stock, BacktestResults, Strategy } from '../services/api';
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ReferenceLine,
  Cell,
  ReferenceDot,
} from 'recharts';

const BacktestPageV2: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);

  const [stockInputMode, setStockInputMode] = useState<'predefined' | 'custom'>('predefined');
  const [selectedStock, setSelectedStock] = useState('2330.TW');
  const [customStockSymbol, setCustomStockSymbol] = useState('');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-10-31');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BacktestResults | null>(null);

  // 載入股票列表和策略
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stocksData, strategiesData] = await Promise.all([
          stocksAPI.getAll(),
          strategyAPI.getAll(),
        ]);
        setStocks(stocksData);
        setStrategies(strategiesData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  // 執行回測
  const handleRunBacktest = async () => {
    if (!selectedStrategyId) {
      setError('請先選擇一個策略');
      return;
    }

    const strategy = strategies.find(s => s.id === selectedStrategyId);
    if (!strategy) {
      setError('找不到選擇的策略');
      return;
    }

    // 驗證股票代碼
    const stockSymbol = stockInputMode === 'custom' ? customStockSymbol.trim() : selectedStock;
    if (!stockSymbol) {
      setError('請輸入或選擇股票代碼');
      return;
    }

    // 驗證自訂股票代碼格式
    if (stockInputMode === 'custom') {
      const symbolPattern = /^[A-Z0-9]+\.(TW|TWO)$/i;
      if (!symbolPattern.test(stockSymbol)) {
        setError('股票代碼格式不正確，請使用格式：代號.TW 或 代號.TWO（例如：2330.TW）');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await backtestAPI.run({
        symbol: stockSymbol,
        start_date: startDate,
        end_date: endDate,
        initial_capital: strategy.initial_capital,
        strategy_type: strategy.strategy_type,
        short_period: strategy.short_period,
        long_period: strategy.long_period,
        rsi_period: strategy.rsi_period,
        rsi_overbought: strategy.rsi_overbought,
        rsi_oversold: strategy.rsi_oversold,
        macd_fast: strategy.macd_fast,
        macd_slow: strategy.macd_slow,
        macd_signal: strategy.macd_signal,
        bb_period: strategy.bb_period,
        bb_std_dev: strategy.bb_std_dev,
        grid_lower_price: strategy.grid_lower_price,
        grid_upper_price: strategy.grid_upper_price,
        grid_num_grids: strategy.grid_num_grids,
        grid_investment_per_grid: strategy.grid_investment_per_grid,
      });

      setResults(response.results);
    } catch (err: any) {
      setError(err.message || '回測執行失敗');
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 準備圖表數據
  const prepareChartData = () => {
    if (!results) return [];

    const buyHoldInitialShares = results.initial_capital / results.prices[0];

    // 創建交易日期到價格的映射
    const tradeMap = new Map<string, { action: string; price: number }>();
    if (results.trades) {
      results.trades.forEach(trade => {
        tradeMap.set(trade.date, { action: trade.action, price: trade.price });
      });
    }

    return results.dates.map((date, index) => {
      const trade = tradeMap.get(date);
      return {
        date: date.substring(5), // 只顯示月-日
        fullDate: date,
        price: results.prices[index],
        open: results.ohlc?.open[index] || results.prices[index],
        high: results.ohlc?.high[index] || results.prices[index],
        low: results.ohlc?.low[index] || results.prices[index],
        close: results.ohlc?.close[index] || results.prices[index],
        volume: results.ohlc?.volume[index] || 0,
        strategyValue: results.portfolio_values[index],
        buyHoldValue: buyHoldInitialShares * results.prices[index],
        // 添加買賣信號標記（只在有交易的日期顯示）
        buySignal: trade?.action === 'BUY' ? trade.price : null,
        sellSignal: trade?.action === 'SELL' ? trade.price : null,
      };
    });
  };

  // 計算移動平均線
  const calculateMA = (data: any[], period: number, key: string = 'close') => {
    return data.map((item, index) => {
      if (index < period - 1) return null;
      const sum = data.slice(index - period + 1, index + 1).reduce((acc, curr) => acc + curr[key], 0);
      return sum / period;
    });
  };

  // 準備買賣信號數據
  const prepareSignalData = () => {
    if (!results || !results.trades || results.trades.length === 0) {
      return { buySignals: [], sellSignals: [] };
    }

    const buySignals: any[] = [];
    const sellSignals: any[] = [];

    results.trades.forEach((trade) => {
      const dateIndex = results.dates.indexOf(trade.date);
      if (dateIndex !== -1 && trade.price) {
        const signalData = {
          date: trade.date.substring(5),
          fullDate: trade.date,
          price: trade.price,
          shares: trade.shares,
          signal: trade.signal,
        };

        if (trade.action === 'BUY') {
          buySignals.push(signalData);
        } else if (trade.action === 'SELL') {
          sellSignals.push(signalData);
        }
      }
    });

    return { buySignals, sellSignals };
  };

  // 判斷策略績效顏色
  const getPerformanceColor = () => {
    if (!results) return '#8b949e';

    const strategyReturn = results.total_return;
    const buyHoldReturn = results.buy_hold_return;

    if (strategyReturn < 0) {
      // 虧損：紅色
      return '#f85149';
    } else if (strategyReturn < buyHoldReturn) {
      // 獲益但不如持有：黃色
      return '#ffa657';
    } else {
      // 獲益且勝過持有：綠色
      return '#3fb950';
    }
  };

  // 判斷策略是否跑贏持有
  const isStrategyWinning = results && results.total_return > results.buy_hold_return;

  // 準備K線圖數據（使用收盤價作為高度基準，通過顏色區分漲跌）
  const prepareCandlestickData = () => {
    if (!results) return [];
    return prepareChartData().map((item) => ({
      ...item,
      // 為漲跌分別準備數據
      upCandle: item.close >= item.open ? item.close : null,
      downCandle: item.close < item.open ? item.close : null,
      // 影線數據
      upperShadow: item.high,
      lowerShadow: item.low,
    }));
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        回測執行
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* 左側：設定區 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              回測設定
            </Typography>

            {/* 策略選擇 */}
            <FormControl fullWidth sx={{ mt: 2 }} required>
              <InputLabel>選擇策略 *</InputLabel>
              <Select
                value={selectedStrategyId || ''}
                label="選擇策略 *"
                onChange={(e) => setSelectedStrategyId(e.target.value as number)}
              >
                {strategies.map((strategy) => (
                  <MenuItem key={strategy.id} value={strategy.id}>
                    <Box>
                      <Typography variant="body1">{strategy.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {strategy.strategy_type} - NT${strategy.initial_capital.toLocaleString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {strategies.length === 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                還沒有保存的策略。
                <Link href="/strategy" sx={{ ml: 1, color: 'inherit', fontWeight: 'bold' }}>
                  前往創建策略
                </Link>
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            {/* 股票選擇模式 */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              股票選擇
            </Typography>
            <RadioGroup
              value={stockInputMode}
              onChange={(e) => setStockInputMode(e.target.value as 'predefined' | 'custom')}
            >
              <FormControlLabel
                value="predefined"
                control={<Radio size="small" />}
                label="從熱門清單選擇"
              />
              <FormControlLabel
                value="custom"
                control={<Radio size="small" />}
                label="自訂股票代碼"
              />
            </RadioGroup>

            {stockInputMode === 'predefined' ? (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>選擇股票</InputLabel>
                <Select
                  value={selectedStock}
                  label="選擇股票"
                  onChange={(e) => setSelectedStock(e.target.value)}
                >
                  {stocks.map((stock) => (
                    <MenuItem key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {stock.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="輸入股票代碼"
                  value={customStockSymbol}
                  onChange={(e) => setCustomStockSymbol(e.target.value.toUpperCase())}
                  placeholder="例如：2330.TW"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ShowChart fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    <Box component="span">
                      格式：股票代號.TW（上市）或 股票代號.TWO（上櫃）
                    </Box>
                  }
                />
                <Alert severity="info" icon={<Info />} sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="caption" component="div">
                    <strong>如何查詢股票代碼？</strong>
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Link
                      href="https://isin.twse.com.tw/isin/C_public.jsp?strMode=2"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}
                    >
                      上市股票查詢 <OpenInNew sx={{ fontSize: 12 }} />
                    </Link>
                    <Typography variant="caption" component="span" sx={{ mx: 1 }}>
                      |
                    </Typography>
                    <Link
                      href="https://isin.twse.com.tw/isin/C_public.jsp?strMode=4"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}
                    >
                      上櫃股票查詢 <OpenInNew sx={{ fontSize: 12 }} />
                    </Link>
                    <Typography variant="caption" component="span" sx={{ mx: 1 }}>
                      |
                    </Typography>
                    <Link
                      href="https://tw.stock.yahoo.com/quote/2330.TW"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}
                    >
                      Yahoo股市 <OpenInNew sx={{ fontSize: 12 }} />
                    </Link>
                  </Box>
                  <Typography variant="caption" component="div" sx={{ mt: 0.5, color: 'text.secondary' }}>
                    <strong>格式說明：</strong>上市股票加 .TW（如 2330.TW），上櫃股票加 .TWO（如 6547.TWO）
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                    <strong>常見範例：</strong>2330.TW (台積電)、2454.TW (聯發科)、2317.TW (鴻海)、0050.TW (元大台灣50)
                  </Typography>
                </Alert>
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              時間範圍
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="開始日期"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="結束日期"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={handleRunBacktest}
              disabled={loading || !selectedStrategyId || strategies.length === 0}
              sx={{ mt: 3 }}
            >
              {loading ? '執行中...' : '開始回測'}
            </Button>
          </Paper>

          {/* 熱門股票快選 */}
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              熱門股票
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {stocks.slice(0, 10).map((stock) => (
                <Chip
                  key={stock.symbol}
                  label={`${stock.symbol.replace('.TW', '')} ${stock.name}`}
                  onClick={() => setSelectedStock(stock.symbol)}
                  color={selectedStock === stock.symbol ? 'primary' : 'default'}
                  variant={selectedStock === stock.symbol ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* 右側：結果區 */}
        <Grid item xs={12} md={8}>
          {!results && !loading && (
            <Paper sx={{ p: 3, minHeight: 400 }}>
              <Typography variant="h6" gutterBottom>
                回測結果
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  flexDirection: 'column',
                }}
              >
                <ShowChart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary" align="center">
                  選擇股票和策略後，點擊「開始回測」
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  系統將自動爬取歷史資料並執行回測分析
                </Typography>
              </Box>
            </Paper>
          )}

          {loading && (
            <Paper sx={{ p: 3, minHeight: 400 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 350,
                  flexDirection: 'column',
                }}
              >
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>執行回測中...</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  正在爬取股票歷史資料並計算策略績效
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    mt: 2,
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    minWidth: 300,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      步驟 1/3: 爬取歷史股價資料...
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      步驟 2/3: 執行策略模擬...
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      步驟 3/3: 計算績效指標...
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          {results && (
            <>
              {/* 績效對比卡片 */}
              <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  績效對比
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: (() => {
                          const color = getPerformanceColor();
                          // 使用半透明背景
                          if (color === '#3fb950') return 'rgba(63, 185, 80, 0.15)'; // 綠色半透明
                          if (color === '#ffa657') return 'rgba(255, 166, 87, 0.15)'; // 黃色半透明
                          return 'rgba(248, 81, 73, 0.15)'; // 紅色半透明
                        })(),
                        borderColor: getPerformanceColor(),
                        borderWidth: 2,
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            策略報酬
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              results.total_return < 0
                                ? '虧損'
                                : results.total_return < results.buy_hold_return
                                  ? '不如持有'
                                  : '超越持有'
                            }
                            sx={{
                              bgcolor: getPerformanceColor(),
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                        <Typography variant="h4" sx={{ mt: 1, mb: 1, color: getPerformanceColor(), fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                          {results.total_return >= 0 ? <TrendingUp /> : <TrendingDown />}
                          {results.total_return.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#c9d1d9' }}>
                          NT$ {results.initial_capital.toLocaleString()} → NT$ {results.final_value.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          單純持有報酬
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>
                          {results.buy_hold_return >= 0 ? <TrendingUp /> : <TrendingDown />}
                          {results.buy_hold_return.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2">
                          {isStrategyWinning ? '策略跑贏持有！' : '策略不如持有'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          夏普比率
                        </Typography>
                        <Typography variant="h6">{results.sharpe_ratio.toFixed(2)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          最大回撤
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {results.max_drawdown.toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          勝率
                        </Typography>
                        <Typography variant="h6">{results.win_rate.toFixed(2)}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          交易次數
                        </Typography>
                        <Typography variant="h6">{results.total_trades}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* K線圖 + 成交量 - 真實股市風格 */}
              <Paper sx={{ p: 3, mb: 2, bgcolor: '#0d1117' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#c9d1d9' }}>
                    股價K線圖與投資績效 (Candlestick & Performance)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: '#3fb950', border: '1px solid #3fb950' }} />
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>漲/買</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: '#f85149', border: '1px solid #f85149' }} />
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>跌/賣</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 16, height: 2, bgcolor: '#ffa657' }} />
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>MA5</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 16, height: 2, bgcolor: '#58a6ff' }} />
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>MA20</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 16, height: 3, bgcolor: getPerformanceColor(), borderRadius: '2px' }} />
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>策略價值</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 16, height: 2, bgcolor: '#c9d1d9', opacity: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>持有價值</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* K線圖主圖 */}
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart
                    data={(() => {
                      const chartData = prepareChartData();
                      const ma5 = calculateMA(chartData, 5, 'close');
                      const ma20 = calculateMA(chartData, 20, 'close');
                      return chartData.map((d, i) => ({ ...d, ma5: ma5[i], ma20: ma20[i] }));
                    })()}
                    margin={{ top: 10, right: 60, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#58a6ff" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="strategyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={getPerformanceColor()} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={getPerformanceColor()} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" strokeOpacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#8b949e"
                      style={{ fontSize: '10px' }}
                      tickLine={false}
                      axisLine={{ stroke: '#30363d' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="price"
                      stroke="#8b949e"
                      style={{ fontSize: '10px' }}
                      tickLine={false}
                      axisLine={{ stroke: '#30363d' }}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                      domain={['auto', 'auto']}
                      orientation="right"
                      label={{ value: '股價', angle: -90, position: 'insideRight', style: { fill: '#8b949e', fontSize: 12 } }}
                    />
                    <YAxis
                      yAxisId="portfolio"
                      stroke="#8b949e"
                      style={{ fontSize: '10px' }}
                      tickLine={false}
                      axisLine={{ stroke: '#30363d' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      domain={['auto', 'auto']}
                      orientation="left"
                      label={{ value: '投資組合價值', angle: -90, position: 'insideLeft', style: { fill: '#8b949e', fontSize: 12 } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161b22',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                      content={(props: any) => {
                        if (!props.active || !props.payload || !props.payload[0]) return null;
                        const data = props.payload[0].payload;
                        const isUp = data.close >= data.open;
                        return (
                          <Box sx={{ bgcolor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', p: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            <Typography variant="caption" sx={{ color: '#c9d1d9', fontWeight: 'bold', display: 'block', mb: 1 }}>
                              {data.fullDate}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isUp ? '#3fb950' : '#f85149', display: 'block' }}>
                              開: ${data.open?.toFixed(2)} 高: ${data.high?.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isUp ? '#3fb950' : '#f85149', display: 'block' }}>
                              低: ${data.low?.toFixed(2)} 收: ${data.close?.toFixed(2)}
                            </Typography>
                            {data.ma5 && (
                              <Typography variant="caption" sx={{ color: '#ffa657', display: 'block', mt: 0.5 }}>
                                MA5: ${data.ma5.toFixed(2)}
                              </Typography>
                            )}
                            {data.ma20 && (
                              <Typography variant="caption" sx={{ color: '#58a6ff', display: 'block' }}>
                                MA20: ${data.ma20.toFixed(2)}
                              </Typography>
                            )}
                            <Divider sx={{ my: 0.5, borderColor: '#30363d' }} />
                            <Typography variant="caption" sx={{ color: getPerformanceColor(), display: 'block', fontWeight: 'bold' }}>
                              策略價值: ${data.strategyValue?.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', opacity: 0.7 }}>
                              持有價值: ${data.buyHoldValue?.toLocaleString()}
                            </Typography>
                            {data.volume > 0 && (
                              <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 0.5 }}>
                                成交量: {(data.volume / 1000).toFixed(1)}K
                              </Typography>
                            )}
                          </Box>
                        );
                      }}
                    />

                    {/* K線蠟燭圖 - 使用Bar來繪製 */}
                    <Bar yAxisId="price" dataKey="close" maxBarSize={10}>
                      {prepareChartData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.close >= entry.open ? '#3fb950' : '#f85149'}
                          fillOpacity={entry.close >= entry.open ? 0.8 : 1}
                        />
                      ))}
                    </Bar>

                    {/* MA5 移動平均線 */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="ma5"
                      stroke="#ffa657"
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                      name="MA5"
                    />

                    {/* MA20 移動平均線 */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="ma20"
                      stroke="#58a6ff"
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                      name="MA20"
                    />

                    {/* 策略價值曲線 - 使用面積圖和線條 */}
                    <Area
                      yAxisId="portfolio"
                      type="monotone"
                      dataKey="strategyValue"
                      fill="url(#strategyGradient)"
                      stroke={getPerformanceColor()}
                      strokeWidth={3}
                      dot={false}
                      name="策略價值"
                      fillOpacity={1}
                    />

                    {/* 持有價值曲線 */}
                    <Line
                      yAxisId="portfolio"
                      type="monotone"
                      dataKey="buyHoldValue"
                      stroke="#c9d1d9"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="持有價值"
                      opacity={0.6}
                    />

                    {/* 買賣信號標記 - 使用 ReferenceDot，更大更清晰 */}
                    {results.trades && results.trades.map((trade, idx) => {
                      const dateStr = trade.date.substring(5);
                      return trade.action === 'BUY' ? (
                        <ReferenceDot
                          key={`buy-${idx}`}
                          x={dateStr}
                          y={trade.price}
                          yAxisId="price"
                          r={0}
                          shape={(props: any) => {
                            const { cx, cy } = props;
                            if (!cx || !cy) return null;
                            return (
                              <g>
                                {/* 外圈光暈效果 */}
                                <circle cx={cx} cy={cy} r={12} fill="#3fb950" opacity={0.15} />
                                {/* 三角形箭頭 - 向上 */}
                                <polygon
                                  points={`${cx},${cy - 10} ${cx - 8},${cy + 8} ${cx + 8},${cy + 8}`}
                                  fill="#3fb950"
                                  stroke="#2ea043"
                                  strokeWidth={2}
                                />
                                {/* 中心點 */}
                                <circle cx={cx} cy={cy} r={2} fill="#fff" />
                              </g>
                            );
                          }}
                        />
                      ) : (
                        <ReferenceDot
                          key={`sell-${idx}`}
                          x={dateStr}
                          y={trade.price}
                          yAxisId="price"
                          r={0}
                          shape={(props: any) => {
                            const { cx, cy } = props;
                            if (!cx || !cy) return null;
                            return (
                              <g>
                                {/* 外圈光暈效果 */}
                                <circle cx={cx} cy={cy} r={12} fill="#f85149" opacity={0.15} />
                                {/* 三角形箭頭 - 向下 */}
                                <polygon
                                  points={`${cx},${cy + 10} ${cx - 8},${cy - 8} ${cx + 8},${cy - 8}`}
                                  fill="#f85149"
                                  stroke="#da3633"
                                  strokeWidth={2}
                                />
                                {/* 中心點 */}
                                <circle cx={cx} cy={cy} r={2} fill="#fff" />
                              </g>
                            );
                          }}
                        />
                      );
                    })}
                  </ComposedChart>
                </ResponsiveContainer>

                {/* 成交量圖 - 只有在有成交量數據時才顯示 */}
                {results && results.ohlc && results.ohlc.volume && results.ohlc.volume.some(v => v > 0) && (
                  <ResponsiveContainer width="100%" height={100}>
                    <ComposedChart
                      data={prepareChartData()}
                      margin={{ top: 0, right: 50, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" strokeOpacity={0.3} vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#8b949e"
                        style={{ fontSize: '10px' }}
                        tickLine={false}
                        axisLine={{ stroke: '#30363d' }}
                        hide
                      />
                      <YAxis
                        stroke="#8b949e"
                        style={{ fontSize: '10px' }}
                        tickLine={false}
                        axisLine={{ stroke: '#30363d' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        orientation="right"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161b22',
                          border: '1px solid #30363d',
                          borderRadius: '6px',
                        }}
                        formatter={(value: any) => [`${(Number(value) / 1000).toFixed(1)}K`, '成交量']}
                      />
                      <Bar dataKey="volume" fill="url(#volumeGradient)" radius={[2, 2, 0, 0]}>
                        {prepareChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#3fb95066' : '#f8514966'} />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                )}

                <Typography variant="caption" sx={{ color: '#8b949e', mt: 1, display: 'block' }}>
                  K線圖展示股價走勢（OHLC）與投資組合價值變化，雙Y軸顯示股價（右）與投資組合價值（左）
                </Typography>
              </Paper>

              {/* 投資組合價值對比圖 */}
              <Paper sx={{ p: 3, mb: 2, bgcolor: '#0d1117' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#c9d1d9' }}>
                    投資組合價值對比
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 16, height: 3, bgcolor: getPerformanceColor(), borderRadius: 1 }} />
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>策略價值</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 16, height: 3, bgcolor: '#c9d1d9', borderRadius: 1,
                        border: '1px dashed #c9d1d9', background: 'transparent' }} />
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>單純持有</Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1 }}>
                  策略線顏色：
                  <Box component="span" sx={{ color: '#3fb950', fontWeight: 'bold' }}> 綠色=獲益且超越持有</Box>、
                  <Box component="span" sx={{ color: '#ffa657', fontWeight: 'bold' }}> 黃色=獲益但不如持有</Box>、
                  <Box component="span" sx={{ color: '#f85149', fontWeight: 'bold' }}> 紅色=虧損</Box>
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart
                    data={prepareChartData()}
                    margin={{ top: 10, right: 50, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getPerformanceColor()} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={getPerformanceColor()} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="holdGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c9d1d9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#c9d1d9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#8b949e"
                      style={{ fontSize: '11px' }}
                      tickLine={false}
                      axisLine={{ stroke: '#30363d' }}
                    />
                    <YAxis
                      stroke="#8b949e"
                      style={{ fontSize: '11px' }}
                      tickLine={false}
                      axisLine={{ stroke: '#30363d' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161b22',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                      labelStyle={{ color: '#c9d1d9', fontWeight: 'bold' }}
                      itemStyle={{ color: '#8b949e' }}
                      formatter={(value: any, name: string) => {
                        const labels: any = {
                          strategyValue: '策略價值',
                          buyHoldValue: '單純持有',
                        };
                        return [`NT$ ${Number(value).toLocaleString()}`, labels[name] || name];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => {
                        const labels: any = {
                          strategyValue: '策略價值',
                          buyHoldValue: '單純持有',
                        };
                        return <span style={{ color: '#c9d1d9' }}>{labels[value] || value}</span>;
                      }}
                    />

                    {/* 初始投資參考線 */}
                    <ReferenceLine
                      y={results?.initial_capital}
                      stroke="#6e7681"
                      strokeDasharray="3 3"
                      label={{
                        value: '初始資金',
                        position: 'right',
                        fill: '#8b949e',
                        fontSize: 11,
                      }}
                    />

                    {/* 單純持有線 */}
                    <Area
                      type="monotone"
                      dataKey="buyHoldValue"
                      stroke="#c9d1d9"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="url(#holdGradient)"
                      name="buyHoldValue"
                      opacity={0.7}
                    />

                    {/* 策略價值線 - 使用三色邏輯 */}
                    <Area
                      type="monotone"
                      dataKey="strategyValue"
                      stroke={getPerformanceColor()}
                      strokeWidth={3}
                      fill="url(#performanceGradient)"
                      name="strategyValue"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#161b22', borderRadius: 1, border: '1px solid #30363d' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>初始資金</Typography>
                      <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 'bold' }}>
                        NT$ {results?.initial_capital.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>策略最終價值</Typography>
                      <Typography variant="body2" sx={{
                        color: getPerformanceColor(),
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}>
                        {results && results.total_return >= 0 ? '▲' : '▼'}
                        NT$ {results?.final_value.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>持有最終價值</Typography>
                      <Typography variant="body2" sx={{
                        color: results && results.buy_hold_return >= 0 ? '#3fb950' : '#f85149',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}>
                        {results && results.buy_hold_return >= 0 ? '▲' : '▼'}
                        NT$ {results && (results.initial_capital * (1 + results.buy_hold_return / 100)).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              {/* 交易記錄 */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  交易記錄 ({results.total_trades} 筆)
                </Typography>
                <TableContainer sx={{ mt: 2, maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>日期</TableCell>
                        <TableCell>動作</TableCell>
                        <TableCell align="right">價格</TableCell>
                        <TableCell align="right">股數</TableCell>
                        <TableCell align="right">金額</TableCell>
                        <TableCell>訊號</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.trades.map((trade, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{trade.date}</TableCell>
                          <TableCell>
                            <Chip
                              label={trade.action}
                              color={trade.action === 'BUY' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">NT$ {trade.price.toFixed(2)}</TableCell>
                          <TableCell align="right">{trade.shares}</TableCell>
                          <TableCell align="right">NT$ {trade.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Typography variant="caption">{trade.signal}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default BacktestPageV2;
