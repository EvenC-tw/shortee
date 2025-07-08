import {
  COOKIE_NAMES,
  ERROR_MESSAGES,
  LINE_CONFIG
} from '../../../lib/auth/constants';
import {
  clearCookie,
  getCookieValue,
  setCookie,
  validateEnvironmentVariables
} from '../../../lib/auth/utils';

import jwt from 'jsonwebtoken';

/**
 * Line 登入回調端點
 * 處理 Line 授權碼並建立用戶會話
 */
export default async function handler(req, res) {
  // 驗證 HTTP 方法
  if (req.method !== 'GET') {
    return res.status(405).json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  const { code, state, error } = req.query;
  
  // 檢查 Line 授權錯誤
  if (error) {
    console.error('Line login error:', error);
    return res.redirect('/?error=line_login_failed');
  }

  // 驗證必要參數
  if (!code || !state) {
    console.error('Missing code or state parameter');
    return res.redirect('/?error=invalid_parameters');
  }

  // 驗證環境變數
  const requiredEnvVars = ['LINE_CHANNEL_ID', 'LINE_CHANNEL_SECRET', 'LINE_CALLBACK_URL', 'JWT_SECRET'];
  if (!validateEnvironmentVariables(requiredEnvVars)) {
    console.error('Missing LINE environment variables');
    return res.status(500).json({ message: ERROR_MESSAGES.MISSING_ENV_VARS });
  }

  const { LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_CALLBACK_URL, JWT_SECRET } = process.env;

  try {
    // 驗證 state 參數防止 CSRF 攻擊
    const expectedState = getCookieValue(req.headers.cookie, COOKIE_NAMES.LINE_STATE);
    if (state !== expectedState) {
      console.error('State mismatch');
      return res.redirect('/?error=state_mismatch');
    }

    // 使用授權碼取得 access token
    const tokenData = await exchangeCodeForToken(code, LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_CALLBACK_URL);
    
    // 驗證 ID token
    const decodedIdToken = jwt.verify(tokenData.id_token, LINE_CHANNEL_SECRET, { 
      algorithms: [LINE_CONFIG.JWT_OPTIONS.ALGORITHM] 
    });
    
    // 取得用戶資料
    const profile = await fetchUserProfile(tokenData.access_token);

    // 建立用戶資料
    const userData = {
      lineId: profile.userId,
      name: profile.displayName,
      email: decodedIdToken.email || null,
      picture: profile.pictureUrl || null,
    };

    // 生成 JWT token
    const authToken = jwt.sign(
      {
        userId: userData.lineId,
        name: userData.name,
        email: userData.email,
      },
      JWT_SECRET,
      LINE_CONFIG.JWT_OPTIONS
    );

    // 設定認證 cookie 並清除臨時 cookie
    setCookie(res, COOKIE_NAMES.AUTH_TOKEN, authToken, { 
      MaxAge: 7 * 24 * 60 * 60 // 7 days
    });
    clearCookie(res, COOKIE_NAMES.LINE_STATE);
    clearCookie(res, COOKIE_NAMES.LINE_NONCE);

    // 重定向到首頁
    res.redirect('/?login=success');

  } catch (error) {
    console.error('Line callback error:', error);
    res.redirect('/?error=callback_failed');
  }
}

/**
 * 使用授權碼交換 access token
 */
async function exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
  const response = await fetch(LINE_CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    console.error('Token request failed:', await response.text());
    throw new Error(ERROR_MESSAGES.TOKEN_REQUEST_FAILED);
  }

  return await response.json();
}

/**
 * 取得用戶資料
 */
async function fetchUserProfile(accessToken) {
  const response = await fetch(LINE_CONFIG.PROFILE_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error('Profile request failed:', await response.text());
    throw new Error(ERROR_MESSAGES.PROFILE_REQUEST_FAILED);
  }

  return await response.json();
} 