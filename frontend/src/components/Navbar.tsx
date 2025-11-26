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
    <AppBar position="static">
      <Toolbar>
        <TrendingUp sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Trading Strategy Simulator
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button color="inherit" startIcon={<Dashboard />} onClick={() => navigate('/')}>
            儀表板
          </Button>
          {isAuthenticated && (
            <>
              <Button color="inherit" startIcon={<ShowChart />} onClick={() => navigate('/strategy')}>
                策略管理
              </Button>
              <Button color="inherit" startIcon={<Assessment />} onClick={() => navigate('/backtest')}>
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
              sx={{ mr: 1, cursor: 'pointer' }}
              color="default"
              variant="outlined"
            />
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
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
          >
            登入
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
