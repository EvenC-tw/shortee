import { COOKIE_NAMES, ERROR_MESSAGES, LINE_CONFIG } from '../../../../utils/auth/constants';
import { getCookieValue, validateEnvironmentVariables } from '../../../../utils/auth/utils';

import jwt from 'jsonwebtoken';

/**
 * 用戶狀態檢查端點
 * 驗證 JWT token 並回傳用戶資訊
 */
export default function handler(req, res) {
  // 驗證 HTTP 方法
  if (req.method !== 'GET') {
    return res.status(405).json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  // 驗證環境變數
  if (!validateEnvironmentVariables(['JWT_SECRET'])) {
    return res.status(500).json({ message: ERROR_MESSAGES.MISSING_ENV_VARS });
  }

  const { JWT_SECRET } = process.env;

  try {
    // 從 cookie 中取得 token
    const token = getCookieValue(req.headers.cookie, COOKIE_NAMES.AUTH_TOKEN);

    if (!token) {
      return res.status(401).json({ message: ERROR_MESSAGES.NO_TOKEN_PROVIDED });
    }

    // 驗證 JWT token
    const decoded = jwt.verify(token, JWT_SECRET, { 
      algorithms: [LINE_CONFIG.JWT_OPTIONS.ALGORITHM] 
    });

    res.status(200).json({
      user: {
        userId: decoded.userId,
        name: decoded.name,
        email: decoded.email,
      },
      authenticated: true,
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: ERROR_MESSAGES.INVALID_TOKEN });
  }
} 