import { COOKIE_NAMES, ERROR_MESSAGES } from '@utils/auth/constants';
import type { NextApiRequest, NextApiResponse } from 'next';

import { clearCookie } from '@utils/auth/utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }
  clearCookie(res, COOKIE_NAMES.AUTH_TOKEN);
  res.status(200).json({ message: 'Logged out successfully' });
} 