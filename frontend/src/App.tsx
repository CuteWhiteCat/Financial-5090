import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import StrategyPage from './pages/StrategyPage';
import BacktestPage from './pages/BacktestPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// 創建深色主題
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6ab8ff', light: '#9cd3ff' },
    secondary: { main: '#f48fb1' },
    background: { default: '#0b1020', paper: '#11182f' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: 0.2,
          transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border 180ms ease',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
          '&:hover': {
            transform: 'translateY(-1px) scale(1.01)',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
          },
          '&:active': {
            transform: 'scale(0.99)',
            boxShadow: '0 3px 12px rgba(0,0,0,0.22)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(120deg, rgba(106,184,255,0.7), rgba(79,143,217,0.7))',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 26px rgba(74,144,226,0.2)',
          '&:hover': {
            background: 'linear-gradient(120deg, rgba(121,195,255,0.8), rgba(92,164,245,0.8))',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Box
            sx={{
              minHeight: '100vh',
              background:
                'radial-gradient(circle at 20% 20%, #1e2a4a 0, #0b1020 35%), radial-gradient(circle at 80% 0%, #0d4b8f 0, #0b1020 45%)',
              color: 'common.white',
            }}
          >
            <Navbar />
            <Routes>
              {/* 公開路由 */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* 受保護的路由 */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/strategy"
                element={
                  <ProtectedRoute>
                    <StrategyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backtest"
                element={
                  <ProtectedRoute>
                    <BacktestPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Box>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
