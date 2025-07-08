import { COOKIE_NAMES, ERROR_MESSAGES, LINE_CONFIG } from '@utils/auth/constants';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getCookieValue, validateEnvironmentVariables } from '@utils/auth/utils';

import jwt from 'jsonwebtoken';

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
      algorithms: [LINE_CONFIG.JWT_OPTIONS.ALGORITHM],
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