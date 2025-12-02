import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  ShowChart,
  Assessment,
  AccountCircle,
  TrendingUp,
  Logout,
  Login,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(11,16,32,0.7)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mr: 4,
          }}
        >
          <TrendingUp sx={{ color: 'primary.light' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            Trading Strategy Simulator
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={() => navigate('/')}
            sx={{ borderRadius: 999, px: 2.4, textTransform: 'none' }}
          >
            儀表板
          </Button>
          {isAuthenticated && (
            <>
              <Button
                color="inherit"
                startIcon={<ShowChart />}
                onClick={() => navigate('/strategy')}
                sx={{ borderRadius: 999, px: 2.4, textTransform: 'none' }}
              >
                策略管理
              </Button>
              <Button
                color="inherit"
                startIcon={<Assessment />}
                onClick={() => navigate('/backtest')}
                sx={{ borderRadius: 999, px: 2.4, textTransform: 'none' }}
              >
                回測執行
              </Button>
            </>
          )}
        </Box>

        {isAuthenticated ? (
          <>
            <Chip
              icon={<AccountCircle />}
              label={user?.username || '用戶'}
              onClick={handleMenuOpen}
              sx={{
                mr: 1,
                cursor: 'pointer',
                bgcolor: 'rgba(255,255,255,0.08)',
                color: 'white',
              }}
              variant="outlined"
            />
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  bgcolor: '#131b31',
                  color: 'white',
                },
              }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout fontSize="small" sx={{ mr: 1 }} />
                登出
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            color="inherit"
            startIcon={<Login />}
            onClick={() => navigate('/login')}
            sx={{ borderRadius: 999, px: 2.4, textTransform: 'none' }}
          >
            登入
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
