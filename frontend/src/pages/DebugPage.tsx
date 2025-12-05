import React, { useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Grid,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HttpIcon from '@mui/icons-material/Http';

type TestName = 'health' | 'register';
type Status = 'idle' | 'running' | 'success' | 'error';

const statusLabel: Record<Status, string> = {
  idle: '待測試',
  running: '進行中',
  success: '成功',
  error: '失敗',
};

const DebugPage: React.FC = () => {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<Record<TestName, Status>>({
    health: 'idle',
    register: 'idle',
  });

  const getApiBaseUrl = () => {
    if (process.env.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }

    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return `http://${hostname}:8000`;
  };

  const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

  const updateTestStatus = (name: TestName, value: Status) => {
    setTestStatus((prev) => ({ ...prev, [name]: value }));
  };

  const appendLog = (title: string, detail?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = detail ? `${timestamp} · ${title}\n${detail}` : `${timestamp} · ${title}`;
    setLogs((prev) => [entry, ...prev].slice(0, 10));
  };

  const copyToClipboard = async (text: string) => {
    setInfo('');
    try {
      if (!navigator.clipboard) {
        setInfo('瀏覽器不支援自動複製，請手動選取指令');
        return;
      }
      await navigator.clipboard.writeText(text);
      setInfo('已複製指令，可以直接貼到終端或 API 測試工具');
    } catch {
      setInfo('複製失敗，請手動選取指令');
    }
  };

  const testHealth = async () => {
    setError('');
    setResult('');
    setInfo('');
    updateTestStatus('health', 'running');
    appendLog('開始測試 /health');

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setResult(`✅ Health OK (${response.status})\nURL: ${API_BASE_URL}/health\n回應: ${JSON.stringify(data, null, 2)}`);
      updateTestStatus('health', 'success');
      appendLog('Health 成功', JSON.stringify(data, null, 2));
    } catch (err: any) {
      const message = err?.message || 'Unknown error';
      setError(`❌ Health 失敗\nURL: ${API_BASE_URL}/health\n錯誤: ${message}`);
      updateTestStatus('health', 'error');
      appendLog('Health 失敗', message);
    }
  };

  const testRegister = async () => {
    setError('');
    setResult('');
    setInfo('');
    updateTestStatus('register', 'running');
    const username = `testuser_${Date.now()}`;
    const payload = {
      username,
      email: `${username}@example.com`,
      password: 'testpass123',
    };

    appendLog('開始測試 /api/auth/register', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const message = `狀態碼: ${response.status}\nURL: ${API_BASE_URL}/api/auth/register\n傳送: ${JSON.stringify(payload, null, 2)}\n回應: ${JSON.stringify(data, null, 2)}`;
      if (!response.ok) {
        setError(`❌ Register 失敗\n${message}`);
        updateTestStatus('register', 'error');
      } else {
        setResult(`✅ Register 成功\n${message}`);
        updateTestStatus('register', 'success');
      }
      appendLog('Register 回應', JSON.stringify(data, null, 2));
    } catch (err: any) {
      const message = err?.message || 'Unknown error';
      setError(`❌ Register 失敗\nURL: ${API_BASE_URL}/api/auth/register\n錯誤: ${message}`);
      updateTestStatus('register', 'error');
      appendLog('Register 失敗', message);
    }
  };

  const curlHealth = `curl -X GET "${API_BASE_URL}/health"`;
  const curlRegister = [
    `curl -X POST "${API_BASE_URL}/api/auth/register" \\`,
    '  -H "Content-Type: application/json" \\',
    `  -d '{"username":"debug-user","email":"debug@example.com","password":"testpass123"}'`,
  ].join('\n');

  const renderStatusChip = (label: string, current: Status) => {
    const colorMap: Record<Status, 'default' | 'info' | 'success' | 'error'> = {
      idle: 'default',
      running: 'info',
      success: 'success',
      error: 'error',
    };

    const iconMap: Partial<Record<Status, JSX.Element>> = {
      running: (
        <RefreshIcon
          sx={{
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      ),
      success: <CheckCircleIcon />,
      error: <ErrorOutlineIcon />,
    };

    return (
      <Chip
        key={label}
        label={`${label}：${statusLabel[current]}`}
        color={colorMap[current]}
        icon={iconMap[current]}
        variant="filled"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #e2e8f0 100%)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: 'linear-gradient(145deg, #1d4ed8 0%, #0ea5e9 100%)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <BugReportIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              調試工具
            </Typography>
            <Typography variant="body2" color="text.secondary">
              快速檢查 API 連線、環境變數與常見註冊流程
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                環境概覽
              </Typography>
              <Typography component="pre" sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, overflow: 'auto', fontSize: 14 }}>
{`當前 URL: ${window.location.href}
主機名: ${window.location.hostname}
API 基礎 URL: ${API_BASE_URL}
REACT_APP_API_BASE_URL: ${process.env.REACT_APP_API_BASE_URL || '未設置'}
NODE_ENV: ${process.env.NODE_ENV}
User Agent: ${navigator.userAgent}`}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                {renderStatusChip('Health', testStatus.health)}
                {renderStatusChip('Register', testStatus.register)}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                快速操作
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<CheckCircleIcon />}
                onClick={testHealth}
                disabled={testStatus.health === 'running'}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {testStatus.health === 'running' ? 'Health 測試中…' : '測試 Health API'}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<HttpIcon />}
                onClick={testRegister}
                disabled={testStatus.register === 'running'}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {testStatus.register === 'running' ? 'Register 測試中…' : '測試 Register API'}
              </Button>
              <Divider />
              <Typography variant="body2" color="text.secondary">
                會自動帶入偵測到的 API 基礎 URL，並在下方記錄詳細 request 與 response，方便比對部署與本地環境。
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  常用 cURL
                </Typography>
                <Tooltip title="重新複製指令">
                  <IconButton onClick={() => copyToClipboard(curlHealth)} size="small">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box sx={{ bgcolor: '#0f172a', color: '#e2e8f0', p: 2, borderRadius: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                <Typography component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap' }}>
                  {curlHealth}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  將指令貼到終端即可重現前端的健康檢查。
                </Typography>
                <Button variant="text" size="small" onClick={() => copyToClipboard(curlHealth)} startIcon={<ContentCopyIcon fontSize="small" />}>
                  複製
                </Button>
              </Stack>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                註冊請求範例
              </Typography>
              <Box sx={{ bgcolor: '#0f172a', color: '#e2e8f0', p: 2, borderRadius: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                <Typography component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap' }}>
                  {curlRegister}
                </Typography>
              </Box>
              <Button variant="text" size="small" onClick={() => copyToClipboard(curlRegister)} startIcon={<ContentCopyIcon fontSize="small" />}>
                複製註冊指令
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                最新結果
              </Typography>
              {info && (
                <Alert severity="info" onClose={() => setInfo('')}>
                  {info}
                </Alert>
              )}
              {result && (
                <Alert severity="success" sx={{ whiteSpace: 'pre-wrap' }} onClose={() => setResult('')}>
                  {result}
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                執行紀錄
              </Typography>
              <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 1, p: 2, minHeight: 160, maxHeight: 220, overflow: 'auto' }}>
                {logs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    尚未有紀錄，先跑一次測試吧。
                  </Typography>
                ) : (
                  logs.map((entry, idx) => (
                    <Typography key={idx} component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: 13, mb: 1.5 }}>
                      {entry}
                    </Typography>
                  ))
                )}
              </Box>
              <Button variant="outlined" size="small" onClick={() => setLogs([])} disabled={logs.length === 0}>
                清除紀錄
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default DebugPage;
