import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const textFieldSx = {
    '& .MuiInputBase-input': { color: 'white' },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.75)' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.light' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
  };

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.username, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查用戶名和密碼');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 20% 20%, #1e2a4a 0, #0b1020 35%), radial-gradient(circle at 80% 0%, #0d4b8f 0, #0b1020 45%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 5,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 70px rgba(0,0,0,0.45)',
            color: 'white',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="overline" color="primary.light" sx={{ letterSpacing: 2 }}>
              Trading Strategy Simulator
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
              歡迎回來
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="用戶名"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
              autoComplete="username"
              sx={textFieldSx}
              helperText="請輸入註冊時使用的用戶名"
            />

            <TextField
              fullWidth
              label="密碼"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="current-password"
              sx={textFieldSx}
              helperText="忘記密碼請聯絡系統管理員重置"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="切換密碼顯示"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 1.5, py: 1.4 }}
            >
              {loading ? '登入中...' : '登入'}
            </Button>

            <Box sx={{ textAlign: 'center', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                登入問題請確認帳密無誤，或稍後再試
              </Typography>
            </Box>

            <Divider sx={{ my: 2, opacity: 0.3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                還沒有帳號？{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  sx={{ cursor: 'pointer' }}
                >
                  立即註冊
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
