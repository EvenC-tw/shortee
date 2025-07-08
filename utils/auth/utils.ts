import { COOKIE_NAMES, LINE_CONFIG } from './constants';

/**
 * 生成隨機字串
 * @param {number} length - 字串長度
 * @returns {string} 隨機字串
 */
export function generateRandomString(length) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * 設定 cookie
 * @param {Object} res - Express response 物件
 * @param {string} name - Cookie 名稱
 * @param {string} value - Cookie 值
 * @param {Object} options - Cookie 選項
 */
export function setCookie(res, name, value, options = {}) {
  const cookieOptions = {
    HttpOnly: LINE_CONFIG.COOKIE_OPTIONS.HTTP_ONLY,
    Path: LINE_CONFIG.COOKIE_OPTIONS.PATH,
    SameSite: LINE_CONFIG.COOKIE_OPTIONS.SAME_SITE,
    ...options,
  };

  const cookieString = `${name}=${value}; ${Object.entries(cookieOptions)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')}`;

  res.setHeader('Set-Cookie', cookieString);
}

/**
 * 清除 cookie
 * @param {Object} res - Express response 物件
 * @param {string} name - Cookie 名稱
 */
export function clearCookie(res, name) {
  setCookie(res, name, '', { MaxAge: 0 });
}

/**
 * 從 cookie 字串中取得指定 cookie 的值
 * @param {string} cookieString - Cookie 字串
 * @param {string} name - Cookie 名稱
 * @returns {string|null} Cookie 值或 null
 */
export function getCookieValue(cookieString, name) {
  if (!cookieString) return null;
  
  const cookie = cookieString
    .split(';')
    .find(c => c.trim().startsWith(`${name}=`));
  
  return cookie ? cookie.split('=')[1] : null;
}

/**
 * 驗證環境變數
 * @param {string[]} requiredVars - 需要的環境變數名稱
 * @returns {boolean} 是否所有環境變數都存在
 */
export function validateEnvironmentVariables(requiredVars) {
  return requiredVars.every(varName => process.env[varName]);
}

/**
 * 建立 Line 授權 URL
 * @param {string} clientId - Line Channel ID
 * @param {string} redirectUri - 回調 URL
 * @param {string} state - 狀態參數
 * @param {string} nonce - Nonce 參數
 * @returns {string} 授權 URL
 */
export function buildLineAuthUrl(clientId, redirectUri, state, nonce) {
  const url = new URL(LINE_CONFIG.AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', LINE_CONFIG.SCOPES.join(' '));
  url.searchParams.set('nonce', nonce);
  
  return url.toString();
} 