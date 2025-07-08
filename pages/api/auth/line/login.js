export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { LINE_CHANNEL_ID, LINE_CALLBACK_URL } = process.env;
  
  if (!LINE_CHANNEL_ID || !LINE_CALLBACK_URL) {
    console.error('Missing LINE environment variables');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Line Login OAuth 2.0 授權碼流程
  const state = Math.random().toString(36).substring(2, 15);
  const nonce = Math.random().toString(36).substring(2, 15);
  
  // 將 state 和 nonce 儲存到 session 或 cookie 中（這裡簡化處理）
  res.setHeader('Set-Cookie', [
    `line_state=${state}; HttpOnly; Path=/; Max-Age=300`,
    `line_nonce=${nonce}; HttpOnly; Path=/; Max-Age=300`
  ]);

  const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', LINE_CHANNEL_ID);
  authUrl.searchParams.set('redirect_uri', LINE_CALLBACK_URL);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'profile openid email');
  authUrl.searchParams.set('nonce', nonce);

  res.redirect(authUrl.toString());
} 