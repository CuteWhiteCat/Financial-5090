import React, { useState } from 'react';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';

const DebugPage: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 檢測 API URL
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

  const API_BASE_URL = getApiBaseUrl();

  const testHealth = async () => {
    setError('');
    setResult('Testing health endpoint...\n');
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setResult(`✅ Success!\n\nURL: ${API_BASE_URL}/health\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      setError(`❌ Failed!\n\nURL: ${API_BASE_URL}/health\nError: ${err.message}`);
    }
  };

  const testRegister = async () => {
    setError('');
    setResult('Testing register endpoint...\n');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser' + Date.now(),
          email: 'test' + Date.now() + '@example.com',
          password: 'testpass123'
        })
      });
      const data = await response.json();
      setResult(`Status: ${response.status}\n\nURL: ${API_BASE_URL}/api/auth/register\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      setError(`❌ Failed!\n\nURL: ${API_BASE_URL}/api/auth/register\nError: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          調試資訊
        </Typography>

        <Box sx={{ my: 3 }}>
          <Typography variant="h6">環境資訊:</Typography>
          <Typography component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto' }}>
            {`當前 URL: ${window.location.href}
主機名: ${window.location.hostname}
API 基礎 URL: ${API_BASE_URL}
環境變數 REACT_APP_API_BASE_URL: ${process.env.REACT_APP_API_BASE_URL || '(未設置)'}
NODE_ENV: ${process.env.NODE_ENV}`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button variant="contained" onClick={testHealth}>
            測試 Health API
          </Button>
          <Button variant="contained" color="secondary" onClick={testRegister}>
            測試 Register API
          </Button>
        </Box>

        {result && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {result}
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error">
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {error}
            </Typography>
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default DebugPage;
