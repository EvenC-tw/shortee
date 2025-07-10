import { NextApiRequest, NextApiResponse } from 'next';

import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: string;
  name: string;
  email: string;
  provider?: string;
  providerId?: string;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user?: AuthenticatedUser;
}

/**
 * 認證中介軟體
 * 驗證 JWT token 並將使用者資訊附加到請求物件
 */
export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
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
        // 沒有 token 不代表錯誤，只是匿名使用者
        return handler(req, res);
      }

      // 驗證 JWT token
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
      
      // 將使用者資訊附加到請求物件
      req.user = {
        userId: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        provider: decoded.provider,
        providerId: decoded.providerId,
      };

      return handler(req, res);
    } catch (error) {
      console.error('Token verification error:', error);
      // token 無效也不代表錯誤，只是匿名使用者
      return handler(req, res);
    }
  };
}

/**
 * 強制認證中介軟體
 * 要求必須有有效的 JWT token
 */
export function withRequiredAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
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
        return res.status(401).json({ message: 'Authentication required' });
      }

      // 驗證 JWT token
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
      
      // 將使用者資訊附加到請求物件
      req.user = {
        userId: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        provider: decoded.provider,
        providerId: decoded.providerId,
      };

      return handler(req, res);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
} 