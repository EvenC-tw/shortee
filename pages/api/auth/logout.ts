import { NextApiRequest, NextApiResponse } from 'next';

interface LogoutResponse {
  message: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<LogoutResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 清除 auth token cookie
  res.setHeader('Set-Cookie', [
    'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  ]);

  res.status(200).json({ message: 'Logged out successfully' });
} 