import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// 暫時內聯常數，避免 import 路徑問題
const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
} as const;

const ERROR_MESSAGES = {
  METHOD_NOT_ALLOWED: 'Method not allowed',
  MISSING_ENV_VARS: 'Server configuration error',
  NO_TOKEN_PROVIDED: 'No token provided',
  INVALID_TOKEN: 'Invalid token',
} as const;

const JWT_OPTIONS = {
  ALGORITHM: 'HS256',
} as const;

function getCookieValue(cookieString: string | undefined, name: string): string | null {
  if (!cookieString) return null;
  const cookie = cookieString
    .split(';')
    .find(c => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

function validateEnvironmentVariables(requiredVars: string[]): boolean {
  return requiredVars.every(varName => process.env[varName]);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  if (!validateEnvironmentVariables(['JWT_SECRET'])) {
    return res.status(500).json({ message: ERROR_MESSAGES.MISSING_ENV_VARS });
  }

  const { JWT_SECRET } = process.env;

  try {
    const token = getCookieValue(req.headers.cookie, COOKIE_NAMES.AUTH_TOKEN);

    if (!token) {
      return res.status(401).json({ message: ERROR_MESSAGES.NO_TOKEN_PROVIDED });
    }

    const decoded = jwt.verify(token, JWT_SECRET!, {
      algorithms: [JWT_OPTIONS.ALGORITHM],
    }) as any;

    res.status(200).json({
      user: {
        userId: decoded.userId,
        name: decoded.name,
        email: decoded.email,
      },
      authenticated: true,
    });

  } catch (error) {
    res.status(401).json({ message: ERROR_MESSAGES.INVALID_TOKEN });
  }
} 