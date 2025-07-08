import {
  COOKIE_NAMES,
  ERROR_MESSAGES,
  LINE_CONFIG
} from '../../../../utils/auth/constants';
import {
  buildLineAuthUrl,
  generateRandomString,
  setCookie,
  validateEnvironmentVariables
} from '../../../../utils/auth/utils';

/**
 * Line 登入起始端點
 * 重定向用戶到 Line 授權頁面
 */
export default function handler(req, res) {
  // 驗證 HTTP 方法
  if (req.method !== 'GET') {
    return res.status(405).json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  // 驗證環境變數
  const requiredEnvVars = ['LINE_CHANNEL_ID', 'LINE_CALLBACK_URL'];
  if (!validateEnvironmentVariables(requiredEnvVars)) {
    console.error('Missing LINE environment variables');
    return res.status(500).json({ message: ERROR_MESSAGES.MISSING_ENV_VARS });
  }

  const { LINE_CHANNEL_ID, LINE_CALLBACK_URL } = process.env;

  // 生成 OAuth 2.0 安全參數
  const state = generateRandomString(LINE_CONFIG.STATE_LENGTH);
  const nonce = generateRandomString(LINE_CONFIG.NONCE_LENGTH);
  
  // 設定安全 cookie
  setCookie(res, COOKIE_NAMES.LINE_STATE, state, { MaxAge: LINE_CONFIG.COOKIE_OPTIONS.MAX_AGE });
  setCookie(res, COOKIE_NAMES.LINE_NONCE, nonce, { MaxAge: LINE_CONFIG.COOKIE_OPTIONS.MAX_AGE });

  // 建立授權 URL 並重定向
  const authUrl = buildLineAuthUrl(LINE_CHANNEL_ID, LINE_CALLBACK_URL, state, nonce);
  res.redirect(authUrl);
} 