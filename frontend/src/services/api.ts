/**
 * API 服務層
 * 處理所有與後端的通信
 */

// 自動檢測 API 基礎 URL
// 優先使用環境變數，否則自動檢測
const getApiBaseUrl = () => {
  // 1. 優先使用 .env 中的設定
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // 2. 自動檢測：根據訪問來源決定後端地址
  const hostname = window.location.hostname;

  // 如果是 localhost 或 127.0.0.1，使用 localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  // 否則使用當前主機名/IP + 後端端口
  return `http://${hostname}:8000`;
};

const API_BASE_URL = getApiBaseUrl();

// API 錯誤處理
export class APIError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'APIError';
  }
}

// 解析 Pydantic 驗證錯誤
function parsePydanticError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  // 如果是 detail 字符串
  if (error.detail && typeof error.detail === 'string') {
    return error.detail;
  }
  
  // 如果是 Pydantic 驗證錯誤陣列
  if (Array.isArray(error.detail)) {
    return error.detail
      .map((err: any) => `${err.loc?.[1] || 'field'}: ${err.msg}`)
      .join('; ');
  }
  
  return 'API request failed';
}

// 通用請求函數
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 自動從 localStorage 取得 token
  const token = localStorage.getItem('auth_token');
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    const message = parsePydanticError(error);
    throw new APIError(response.status, message, error);
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
  // 獲取所有策略 (已新增排序功能)
  getAll: (sortBy: string = 'created_at', order: string = 'desc', token?: string) => {
    const params = new URLSearchParams();
    if (sortBy) params.append('sort_by', sortBy);
    if (order) params.append('order', order);
    
    return request<Strategy[]>(`/api/strategies/?${params.toString()}`, {
      headers: getAuthHeader(token),
    });
  },

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
  id: string;
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
  id: string;
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
