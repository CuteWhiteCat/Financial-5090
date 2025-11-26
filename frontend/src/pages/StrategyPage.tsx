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
  Slider,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow,
  Edit,
  Delete,
  Add,
  ExpandMore,
} from '@mui/icons-material';
import { strategyAPI, Strategy, StrategyCreate } from '../services/api';

const StrategyPage: React.FC = () => {
  // 策略列表狀態
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);

  // 表單狀態
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [formData, setFormData] = useState<StrategyCreate>({
    name: '',
    description: '',
    strategy_type: 'moving_average',
    initial_capital: 100000,
    // MA
    short_period: 5,
    long_period: 20,
    // RSI
    rsi_period: 14,
    rsi_overbought: 70,
    rsi_oversold: 30,
    // MACD
    macd_fast: 12,
    macd_slow: 26,
    macd_signal: 9,
    // Bollinger Bands
    bb_period: 20,
    bb_std_dev: 2.0,
    // Grid Trading
    grid_lower_price: 0,
    grid_upper_price: 0,
    grid_num_grids: 10,
    grid_investment_per_grid: 10000,
    // Risk Management
    stop_loss_pct: 5.0,
    take_profit_pct: 10.0,
    position_size_pct: 100.0,
  });

  // 通知狀態
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // 載入策略列表
  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await strategyAPI.getAll();
      setStrategies(data);
    } catch (error: any) {
      showSnackbar('載入策略失敗: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // 打開創建對話框
  const handleOpenCreate = () => {
    setEditingStrategy(null);
    setFormData({
      name: '',
      description: '',
      strategy_type: 'moving_average',
      initial_capital: 100000,
      short_period: 5,
      long_period: 20,
      rsi_period: 14,
      rsi_overbought: 70,
      rsi_oversold: 30,
      macd_fast: 12,
      macd_slow: 26,
      macd_signal: 9,
      bb_period: 20,
      bb_std_dev: 2.0,
      grid_lower_price: 0,
      grid_upper_price: 0,
      grid_num_grids: 10,
      grid_investment_per_grid: 10000,
      stop_loss_pct: 5.0,
      take_profit_pct: 10.0,
      position_size_pct: 100.0,
    });
    setIsDialogOpen(true);
  };

  // 打開編輯對話框
  const handleOpenEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name,
      description: strategy.description,
      strategy_type: strategy.strategy_type,
      initial_capital: strategy.initial_capital,
      short_period: strategy.short_period || 5,
      long_period: strategy.long_period || 20,
      rsi_period: strategy.rsi_period || 14,
      rsi_overbought: strategy.rsi_overbought || 70,
      rsi_oversold: strategy.rsi_oversold || 30,
      macd_fast: strategy.macd_fast || 12,
      macd_slow: strategy.macd_slow || 26,
      macd_signal: strategy.macd_signal || 9,
      bb_period: strategy.bb_period || 20,
      bb_std_dev: strategy.bb_std_dev || 2.0,
      grid_lower_price: strategy.grid_lower_price || 0,
      grid_upper_price: strategy.grid_upper_price || 0,
      grid_num_grids: strategy.grid_num_grids || 10,
      grid_investment_per_grid: strategy.grid_investment_per_grid || 10000,
      stop_loss_pct: strategy.stop_loss_pct || 5.0,
      take_profit_pct: strategy.take_profit_pct || 10.0,
      position_size_pct: strategy.position_size_pct || 100.0,
    });
    setIsDialogOpen(true);
  };

  // 關閉對話框
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStrategy(null);
  };

  // 保存策略
  const handleSaveStrategy = async () => {
    try {
      setLoading(true);
      if (editingStrategy) {
        await strategyAPI.update(editingStrategy.id, formData);
        showSnackbar('策略更新成功！', 'success');
      } else {
        await strategyAPI.create(formData);
        showSnackbar('策略創建成功！', 'success');
      }
      handleCloseDialog();
      loadStrategies();
    } catch (error: any) {
      showSnackbar('保存策略失敗: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 刪除策略
  const handleDeleteStrategy = async (id: number, name: string) => {
    if (!window.confirm(`確定要刪除策略「${name}」嗎？`)) {
      return;
    }

    try {
      setLoading(true);
      await strategyAPI.delete(id);
      showSnackbar('策略刪除成功！', 'success');
      loadStrategies();
    } catch (error: any) {
      showSnackbar('刪除策略失敗: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 策略類型名稱映射
  const strategyTypeNames: { [key: string]: string } = {
    moving_average: '移動平均線 (MA)',
    rsi: 'RSI 相對強弱指標',
    macd: 'MACD 指標',
    bollinger_bands: '布林通道',
    grid_trading: '網格交易',
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          策略管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
        >
          創建新策略
        </Button>
      </Box>

      {/* 策略列表 */}
      <Grid container spacing={3}>
        {strategies.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                還沒有保存的策略
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                點擊「創建新策略」開始設定您的第一個策略
              </Typography>
            </Paper>
          </Grid>
        )}

        {strategies.map((strategy) => (
          <Grid item xs={12} md={6} lg={4} key={strategy.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strategy.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {strategy.description || '無描述'}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>類型:</strong> {strategyTypeNames[strategy.strategy_type] || strategy.strategy_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>初始資金:</strong> NT$ {strategy.initial_capital.toLocaleString()}
                  </Typography>
                  {strategy.strategy_type === 'moving_average' && (
                    <>
                      <Typography variant="body2">
                        <strong>短期/長期:</strong> {strategy.short_period}/{strategy.long_period} 天
                      </Typography>
                    </>
                  )}
                  {strategy.strategy_type === 'rsi' && (
                    <>
                      <Typography variant="body2">
                        <strong>RSI週期:</strong> {strategy.rsi_period} 天
                      </Typography>
                      <Typography variant="body2">
                        <strong>超買/超賣:</strong> {strategy.rsi_overbought}/{strategy.rsi_oversold}
                      </Typography>
                    </>
                  )}
                  {strategy.strategy_type === 'macd' && (
                    <>
                      <Typography variant="body2">
                        <strong>快/慢/訊號:</strong> {strategy.macd_fast}/{strategy.macd_slow}/{strategy.macd_signal}
                      </Typography>
                    </>
                  )}
                  {strategy.strategy_type === 'bollinger_bands' && (
                    <>
                      <Typography variant="body2">
                        <strong>週期:</strong> {strategy.bb_period} 天
                      </Typography>
                      <Typography variant="body2">
                        <strong>標準差:</strong> {strategy.bb_std_dev}
                      </Typography>
                    </>
                  )}
                  {strategy.strategy_type === 'grid_trading' && (
                    <>
                      <Typography variant="body2">
                        <strong>網格數量:</strong> {strategy.grid_num_grids}
                      </Typography>
                      <Typography variant="body2">
                        <strong>每格投資:</strong> NT$ {strategy.grid_investment_per_grid?.toLocaleString()}
                      </Typography>
                    </>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    創建時間: {new Date(strategy.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenEdit(strategy)}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteStrategy(strategy.id, strategy.name)}
                >
                  <Delete />
                </IconButton>
                <Button
                  size="small"
                  startIcon={<PlayArrow />}
                  href="/backtest"
                >
                  回測
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 創建/編輯對話框 */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStrategy ? '編輯策略' : '創建新策略'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* 基本資訊 */}
            <Typography variant="h6" gutterBottom>
              基本資訊
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="策略名稱"
                  placeholder="例如：MA交叉策略"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  variant="outlined"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="策略描述"
                  placeholder="簡單描述您的策略..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="初始資金 (NT$)"
                  type="number"
                  value={formData.initial_capital}
                  onChange={(e) => setFormData({ ...formData, initial_capital: Number(e.target.value) })}
                  variant="outlined"
                  required
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* 策略類型 */}
            <Typography variant="h6" gutterBottom>
              策略類型
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>選擇策略類型</InputLabel>
              <Select
                value={formData.strategy_type}
                label="選擇策略類型"
                onChange={(e) => setFormData({ ...formData, strategy_type: e.target.value })}
              >
                <MenuItem value="moving_average">移動平均線 (MA)</MenuItem>
                <MenuItem value="rsi">RSI 相對強弱指標</MenuItem>
                <MenuItem value="macd">MACD 指標</MenuItem>
                <MenuItem value="bollinger_bands">布林通道</MenuItem>
                <MenuItem value="grid_trading">網格交易</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            {/* 移動平均線參數 */}
            {formData.strategy_type === 'moving_average' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  移動平均線參數
                </Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      短期均線週期: {formData.short_period} 天
                    </Typography>
                    <Slider
                      value={formData.short_period}
                      onChange={(e, val) => setFormData({ ...formData, short_period: val as number })}
                      min={3}
                      max={50}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      長期均線週期: {formData.long_period} 天
                    </Typography>
                    <Slider
                      value={formData.long_period}
                      onChange={(e, val) => setFormData({ ...formData, long_period: val as number })}
                      min={10}
                      max={200}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* RSI參數 */}
            {formData.strategy_type === 'rsi' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  RSI 參數
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      RSI 週期: {formData.rsi_period} 天
                    </Typography>
                    <Slider
                      value={formData.rsi_period}
                      onChange={(e, val) => setFormData({ ...formData, rsi_period: val as number })}
                      min={5}
                      max={30}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="超買門檻"
                      type="number"
                      value={formData.rsi_overbought}
                      onChange={(e) => setFormData({ ...formData, rsi_overbought: Number(e.target.value) })}
                      inputProps={{ min: 50, max: 90 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="超賣門檻"
                      type="number"
                      value={formData.rsi_oversold}
                      onChange={(e) => setFormData({ ...formData, rsi_oversold: Number(e.target.value) })}
                      inputProps={{ min: 10, max: 50 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* MACD參數 */}
            {formData.strategy_type === 'macd' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  MACD 參數
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="快線週期"
                      type="number"
                      value={formData.macd_fast}
                      onChange={(e) => setFormData({ ...formData, macd_fast: Number(e.target.value) })}
                      inputProps={{ min: 5, max: 30 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="慢線週期"
                      type="number"
                      value={formData.macd_slow}
                      onChange={(e) => setFormData({ ...formData, macd_slow: Number(e.target.value) })}
                      inputProps={{ min: 15, max: 50 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="訊號線週期"
                      type="number"
                      value={formData.macd_signal}
                      onChange={(e) => setFormData({ ...formData, macd_signal: Number(e.target.value) })}
                      inputProps={{ min: 5, max: 20 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* 布林通道參數 */}
            {formData.strategy_type === 'bollinger_bands' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  布林通道參數
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      週期: {formData.bb_period} 天
                    </Typography>
                    <Slider
                      value={formData.bb_period}
                      onChange={(e, val) => setFormData({ ...formData, bb_period: val as number })}
                      min={10}
                      max={50}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="標準差倍數"
                      type="number"
                      value={formData.bb_std_dev}
                      onChange={(e) => setFormData({ ...formData, bb_std_dev: Number(e.target.value) })}
                      inputProps={{ min: 1, max: 3, step: 0.1 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* 網格交易參數 */}
            {formData.strategy_type === 'grid_trading' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  網格交易參數
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="下界價格 (NT$)"
                      type="number"
                      value={formData.grid_lower_price}
                      onChange={(e) => setFormData({ ...formData, grid_lower_price: Number(e.target.value) })}
                      helperText="網格交易的最低價格"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="上界價格 (NT$)"
                      type="number"
                      value={formData.grid_upper_price}
                      onChange={(e) => setFormData({ ...formData, grid_upper_price: Number(e.target.value) })}
                      helperText="網格交易的最高價格"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="網格數量"
                      type="number"
                      value={formData.grid_num_grids}
                      onChange={(e) => setFormData({ ...formData, grid_num_grids: Number(e.target.value) })}
                      inputProps={{ min: 5, max: 50 }}
                      helperText="將價格區間分為幾格"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="每格投資金額 (NT$)"
                      type="number"
                      value={formData.grid_investment_per_grid}
                      onChange={(e) => setFormData({ ...formData, grid_investment_per_grid: Number(e.target.value) })}
                      helperText="每個網格的投資額"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* 風險管理（所有策略通用） */}
            <Divider sx={{ my: 3 }} />
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  風險管理（選填）
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="止損百分比 (%)"
                      type="number"
                      value={formData.stop_loss_pct}
                      onChange={(e) => setFormData({ ...formData, stop_loss_pct: Number(e.target.value) })}
                      inputProps={{ min: 1, max: 20, step: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="止盈百分比 (%)"
                      type="number"
                      value={formData.take_profit_pct}
                      onChange={(e) => setFormData({ ...formData, take_profit_pct: Number(e.target.value) })}
                      inputProps={{ min: 1, max: 50, step: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="單次投入比例 (%)"
                      type="number"
                      value={formData.position_size_pct}
                      onChange={(e) => setFormData({ ...formData, position_size_pct: Number(e.target.value) })}
                      inputProps={{ min: 10, max: 100, step: 10 }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            取消
          </Button>
          <Button
            onClick={handleSaveStrategy}
            variant="contained"
            disabled={!formData.name || loading}
          >
            {editingStrategy ? '更新' : '創建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StrategyPage;
