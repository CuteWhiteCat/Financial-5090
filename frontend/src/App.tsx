import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import StrategyPage from './pages/StrategyPage';
import BacktestPageV2 from './pages/BacktestPageV2';
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
          borderRadius: 8,
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
                    <BacktestPageV2 />
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
