/**
 * API 服務層
 * 處理所有與後端的通信
 */

const API_BASE_URL = 'http://localhost:8000';

// API 錯誤處理
class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// 通用請求函數
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new APIError(response.status, error.detail || 'API request failed');
  }

  return response.json();
}

// 股票相關 API
export const stocksAPI = {
  // 獲取所有股票
  getAll: () => request<Stock[]>('/api/stocks/'),

  // 獲取股票詳情
  getDetail: (symbol: string) =>
    request<Stock>(`/api/stocks/${symbol}`),

  // 獲取股票價格
  getPrices: (symbol: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ symbol: string; count: number; prices: StockPrice[] }>(
      `/api/stocks/${symbol}/prices${query}`
    );
  },
};

// 回測相關 API
export const backtestAPI = {
  // 執行回測
  run: (params: BacktestRequest) =>
    request<BacktestResponse>('/api/backtest/run', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // 獲取回測歷史
  getHistory: () => request('/api/backtest/history'),
};

// Helper function to get auth header
function getAuthHeader(token?: string): HeadersInit {
  const authToken = token || localStorage.getItem('auth_token');
  if (authToken) {
    return {
      'Authorization': `Bearer ${authToken}`,
    };
  }
  return {};
}

// 認證相關 API
export const authAPI = {
  // 用戶註冊
  register: (username: string, email: string, password: string, fullName?: string) =>
    request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        full_name: fullName,
      }),
    }),

  // 用戶登入
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(response.status, error.detail || 'Login failed');
    }

    return response.json() as Promise<LoginResponse>;
  },

  // 獲取當前用戶信息
  getCurrentUser: (token?: string) =>
    request<User>('/api/auth/me', {
      headers: getAuthHeader(token),
    }),

  // 登出
  logout: () =>
    request('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeader(),
    }),
};

// 策略相關 API（需要認證）
export const strategyAPI = {
  // 獲取所有策略
  getAll: (token?: string) =>
    request<Strategy[]>('/api/strategies/', {
      headers: getAuthHeader(token),
    }),

  // 獲取單個策略
  get: (id: number, token?: string) =>
    request<Strategy>(`/api/strategies/${id}`, {
      headers: getAuthHeader(token),
    }),

  // 創建策略
  create: (strategy: StrategyCreate, token?: string) =>
    request<Strategy>('/api/strategies/', {
      method: 'POST',
      body: JSON.stringify(strategy),
      headers: getAuthHeader(token),
    }),

  // 更新策略
  update: (id: number, strategy: StrategyCreate, token?: string) =>
    request<Strategy>(`/api/strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(strategy),
      headers: getAuthHeader(token),
    }),

  // 刪除策略
  delete: (id: number, token?: string) =>
    request<{ success: boolean; message: string }>(`/api/strategies/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(token),
    }),
};

// TypeScript 類型定義
export interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  sector: string;
  is_active: boolean;
}

export interface StockPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestRequest {
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  strategy_type: string;
  short_period?: number;
  long_period?: number;
}

export interface Trade {
  date: string;
  action: string;
  price: number;
  shares: number;
  amount: number;
  signal: string;
}

export interface OHLCData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export interface BacktestResults {
  initial_capital: number;
  final_value: number;
  total_return: number;
  buy_hold_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  trades: Trade[];
  portfolio_values: number[];
  dates: string[];
  prices: number[];
  ohlc: OHLCData;
}

export interface BacktestResponse {
  success: boolean;
  message: string;
  results: BacktestResults;
}

export interface Strategy {
  id: number;
  name: string;
  description: string;
  strategy_type: string;
  initial_capital: number;

  // Moving Average
  short_period?: number;
  long_period?: number;

  // RSI
  rsi_period?: number;
  rsi_overbought?: number;
  rsi_oversold?: number;

  // MACD
  macd_fast?: number;
  macd_slow?: number;
  macd_signal?: number;

  // Bollinger Bands
  bb_period?: number;
  bb_std_dev?: number;

  // Grid Trading
  grid_lower_price?: number;
  grid_upper_price?: number;
  grid_num_grids?: number;
  grid_investment_per_grid?: number;

  // Risk Management
  stop_loss_pct?: number;
  take_profit_pct?: number;
  position_size_pct?: number;

  created_at: string;
}

export interface StrategyCreate {
  name: string;
  description?: string;
  strategy_type: string;
  initial_capital: number;

  // Moving Average
  short_period?: number;
  long_period?: number;

  // RSI
  rsi_period?: number;
  rsi_overbought?: number;
  rsi_oversold?: number;

  // MACD
  macd_fast?: number;
  macd_slow?: number;
  macd_signal?: number;

  // Bollinger Bands
  bb_period?: number;
  bb_std_dev?: number;

  // Grid Trading
  grid_lower_price?: number;
  grid_upper_price?: number;
  grid_num_grids?: number;
  grid_investment_per_grid?: number;

  // Risk Management
  stop_loss_pct?: number;
  take_profit_pct?: number;
  position_size_pct?: number;
}

// 用戶相關類型
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
