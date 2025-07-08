import { COOKIE_NAMES, ERROR_MESSAGES } from '../../../../utils/auth/constants';
import { clearCookie } from '../../../../utils/auth/utils';

/**
 * 登出端點
 * 清除用戶認證 cookie
 */
export default function handler(req, res) {
  // 驗證 HTTP 方法
  if (req.method !== 'POST') {
    return res.status(405).json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  // 清除認證 cookie
  clearCookie(res, COOKIE_NAMES.AUTH_TOKEN);

  res.status(200).json({ message: 'Logged out successfully' });
} 