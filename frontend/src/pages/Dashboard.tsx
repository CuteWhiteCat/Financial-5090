import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Timeline,
  StackedLineChart,
  QueryStats,
  Insights,
  Refresh,
  PlayArrow,
  Addchart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { strategyAPI, Strategy } from '../services/api';
import PageHeader from '../components/PageHeader';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStrategies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadStrategies = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await strategyAPI.getAll(token);
      setStrategies(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load strategies:', err);
      setError('無法載入策略數據');
    } finally {
      setLoading(false);
    }
  };

  // 計算統計數據
  const strategyCount = strategies.length;
  const strategyTypes = {
    moving_average: strategies.filter(s => s.strategy_type === 'moving_average').length,
    rsi: strategies.filter(s => s.strategy_type === 'rsi').length,
    macd: strategies.filter(s => s.strategy_type === 'macd').length,
    bollinger_bands: strategies.filter(s => s.strategy_type === 'bollinger_bands').length,
    grid_trading: strategies.filter(s => s.strategy_type === 'grid_trading').length,
  };

  const stats = [
    {
      title: '總策略數',
      value: strategyCount.toString(),
      icon: <StackedLineChart fontSize="large" />,
      color: '#90caf9',
      subtitle: '已建立的策略',
    },
    {
      title: '移動平均策略',
      value: strategyTypes.moving_average.toString(),
      icon: <Timeline fontSize="large" />,
      color: '#f48fb1',
      subtitle: 'MA策略',
    },
    {
      title: 'RSI策略',
      value: strategyTypes.rsi.toString(),
      icon: <Insights fontSize="large" />,
      color: '#a5d6a7',
      subtitle: '相對強弱指標',
    },
    {
      title: '其他策略',
      value: (strategyTypes.macd + strategyTypes.bollinger_bands + strategyTypes.grid_trading).toString(),
      icon: <QueryStats fontSize="large" />,
      color: '#ffcc80',
      subtitle: 'MACD, BB, Grid',
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 4,
        mb: 4,
        color: 'white',
      }}
    >
      <PageHeader
        title={`歡迎回來，${user?.username || '用戶'}！`}
        subtitle="這是您的投資策略儀表板"
        icon={<Insights fontSize="large" />}
        eyebrow="Dashboard"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 統計卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${stat.color}33 0%, ${stat.color}11 100%)`,
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 快速操作 */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          color: 'white',
        }}
      >
        <Typography variant="h6" gutterBottom>
          快速開始
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<Addchart />}
              onClick={() => navigate('/strategy')}
            >
              建立新策略
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<PlayArrow />}
              onClick={() => navigate('/backtest')}
            >
              執行回測
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<Refresh />}
              onClick={loadStrategies}
            >
              刷新數據
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 最近策略 */}
      <Paper
        sx={{
          p: 3,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          color: 'white',
        }}
      >
        <Typography variant="h6" gutterBottom>
          最近的策略
        </Typography>
        {strategies.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            {strategies.slice(0, 5).map((strategy) => (
              <Box
                key={strategy.id}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {strategy.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    類型: {strategy.strategy_type} | 初始資金: NT${strategy.initial_capital.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    創建時間: {new Date(strategy.created_at).toLocaleDateString('zh-TW')}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/backtest', { state: { strategyId: strategy.id } })}
                >
                  執行回測
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ mt: 2, textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              尚無策略
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              開始建立您的第一個策略吧！
            </Typography>
              <Button
                variant="contained"
                startIcon={<StackedLineChart />}
                onClick={() => navigate('/strategy')}
                sx={{ mt: 2 }}
              >
                建立策略
              </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;
