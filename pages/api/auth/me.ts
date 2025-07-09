import { NextApiRequest, NextApiResponse } from 'next';

import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  name: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface UserResponse {
  user: {
    userId: string;
    name: string;
    email: string;
  };
  authenticated: boolean;
}

interface ErrorResponse {
  message: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<UserResponse | ErrorResponse>) {
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
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as DecodedToken;

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