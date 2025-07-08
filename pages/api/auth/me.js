import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { JWT_SECRET } = process.env;
  
  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    // 從 cookie 中取得 token
    const cookies = req.headers.cookie;
    const authCookie = cookies?.split(';').find(c => c.trim().startsWith('auth_token='));
    const token = authCookie?.split('=')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // 驗證 JWT token
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

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
    res.status(401).json({ message: 'Invalid token' });
  }
} 