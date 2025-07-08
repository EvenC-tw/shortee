import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, state, error } = req.query;
  const { LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_CALLBACK_URL, JWT_SECRET } = process.env;

  // 檢查是否有錯誤
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
  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !LINE_CALLBACK_URL || !JWT_SECRET) {
    console.error('Missing LINE environment variables');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    // 驗證 state 參數（這裡簡化處理，實際應該從 cookie 中取得）
    const cookies = req.headers.cookie;
    const stateCookie = cookies?.split(';').find(c => c.trim().startsWith('line_state='));
    const expectedState = stateCookie?.split('=')[1];

    if (state !== expectedState) {
      console.error('State mismatch');
      return res.redirect('/?error=state_mismatch');
    }

    // 使用授權碼取得 access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: LINE_CALLBACK_URL,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token request failed:', await tokenResponse.text());
      return res.redirect('/?error=token_request_failed');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token } = tokenData;

    // 驗證 ID token
    const decodedIdToken = jwt.verify(id_token, LINE_CHANNEL_SECRET, { algorithms: ['HS256'] });
    
    // 取得用戶資料
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Profile request failed:', await profileResponse.text());
      return res.redirect('/?error=profile_request_failed');
    }

    const profile = await profileResponse.json();

    // 建立用戶資料
    const userData = {
      lineId: profile.userId,
      name: profile.displayName,
      email: decodedIdToken.email || null,
      picture: profile.pictureUrl || null,
    };

    // 生成 JWT token
    const token = jwt.sign(
      {
        userId: userData.lineId,
        name: userData.name,
        email: userData.email,
      },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '7d',
        issuer: 'shortee',
      }
    );

    // 設定 JWT token 到 cookie
    res.setHeader('Set-Cookie', [
      `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`,
      'line_state=; HttpOnly; Path=/; Max-Age=0',
      'line_nonce=; HttpOnly; Path=/; Max-Age=0'
    ]);

    // 重定向到首頁
    res.redirect('/?login=success');

  } catch (error) {
    console.error('Line callback error:', error);
    res.redirect('/?error=callback_failed');
  }
} 