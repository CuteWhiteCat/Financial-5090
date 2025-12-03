import React, { useState } from 'react';
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
} from '@mui/material';
import { PlayArrow, ShowChart } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';

const BacktestPage: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState('2330.TW');
  const [selectedStrategy, setSelectedStrategy] = useState('');

  const stocks = [
    { symbol: '2330.TW', name: '台積電' },
    { symbol: '2317.TW', name: '鴻海' },
    { symbol: '2454.TW', name: '聯發科' },
    { symbol: '2308.TW', name: '台達電' },
    { symbol: '2882.TW', name: '國泰金' },
    { symbol: '2891.TW', name: '中信金' },
    { symbol: '2412.TW', name: '中華電' },
    { symbol: '2881.TW', name: '富邦金' },
    { symbol: '1301.TW', name: '台塑' },
    { symbol: '1303.TW', name: '南亞' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader
        title="回測執行"
        subtitle="設定標的與策略，開始模擬"
        icon={<PlayArrow />}
        eyebrow="Backtest"
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* 左側：設定區 */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              回測設定
            </Typography>

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

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>選擇策略</InputLabel>
              <Select
                value={selectedStrategy}
                label="選擇策略"
                onChange={(e) => setSelectedStrategy(e.target.value)}
              >
                <MenuItem value="">
                  <em>尚無已保存的策略</em>
                </MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              回測時間範圍
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="開始日期"
                  type="date"
                  defaultValue="2023-01-01"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="結束日期"
                  type="date"
                  defaultValue="2024-12-31"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="初始資金"
              type="number"
              defaultValue={100000}
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>NT$</Typography>,
              }}
            />

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrow />}
              sx={{ mt: 3 }}
            >
              開始回測
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              sx={{ mt: 1 }}
              href="/strategy"
            >
              建立新策略
            </Button>
          </Paper>
        </Grid>

        {/* 右側：結果預覽區 */}
        <Grid item xs={12} md={7}>
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

          {/* 績效指標卡片（範例） */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    總報酬率
                  </Typography>
                  <Typography variant="h6">--</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    夏普比率
                  </Typography>
                  <Typography variant="h6">--</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    最大回撤
                  </Typography>
                  <Typography variant="h6">--</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    勝率
                  </Typography>
                  <Typography variant="h6">--</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* 台灣熱門股票快速選擇 */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          熱門股票
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {stocks.map((stock) => (
            <Chip
              key={stock.symbol}
              label={`${stock.symbol.replace('.TW', '')} ${stock.name}`}
              onClick={() => setSelectedStock(stock.symbol)}
              color={selectedStock === stock.symbol ? 'primary' : 'default'}
              variant={selectedStock === stock.symbol ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default BacktestPage;
