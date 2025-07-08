// Line Login 相關常數
export const LINE_CONFIG = {
  AUTH_URL: 'https://access.line.me/oauth2/v2.1/authorize',
  TOKEN_URL: 'https://api.line.me/oauth2/v2.1/token',
  PROFILE_URL: 'https://api.line.me/v2/profile',
  SCOPES: ['profile', 'openid', 'email'],
  STATE_LENGTH: 13,
  NONCE_LENGTH: 13,
  COOKIE_OPTIONS: {
    HTTP_ONLY: true,
    PATH: '/',
    MAX_AGE: 300, // 5 minutes
    SAME_SITE: 'Lax',
  },
  JWT_OPTIONS: {
    ALGORITHM: 'HS256',
    EXPIRES_IN: '7d',
    ISSUER: 'shortee',
  },
};

// Cookie 名稱
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  LINE_STATE: 'line_state',
  LINE_NONCE: 'line_nonce',
};

// API 路徑
export const API_ROUTES = {
  LINE_LOGIN: '/api/auth/line/login',
  LINE_CALLBACK: '/api/auth/line/callback',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
};

// 錯誤訊息
export const ERROR_MESSAGES = {
  METHOD_NOT_ALLOWED: 'Method not allowed',
  MISSING_ENV_VARS: 'Server configuration error',
  INVALID_PARAMETERS: 'Invalid parameters',
  STATE_MISMATCH: 'State mismatch',
  TOKEN_REQUEST_FAILED: 'Token request failed',
  PROFILE_REQUEST_FAILED: 'Profile request failed',
  CALLBACK_FAILED: 'Callback failed',
  NO_TOKEN_PROVIDED: 'No token provided',
  INVALID_TOKEN: 'Invalid token',
}; 