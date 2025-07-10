import { AuthenticatedRequest, withRequiredAuth } from '../../../lib/middleware/auth';
import { DatabaseFactory, DatabaseType } from '../../../lib/database/factory';

import { NextApiResponse } from 'next';

// 從環境變數取得資料庫類型，預設使用 MongoDB
const dbType = (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.MONGODB;

interface HistoryResponse {
  shortees: Array<{
    shorteeCode: string;
    origin: string;
    title?: string;
    createdAt: Date;
    usageCount?: number;
  }>;
  total: number;
  hasMore: boolean;
}

interface ErrorResponse {
  message: string;
  success: false;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse<HistoryResponse | ErrorResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed', success: false });
  }

  try {
    const { limit = '20', offset = '0' } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100); // 最大 100 筆
    const offsetNum = parseInt(offset as string) || 0;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required', success: false });
    }

    const db = await DatabaseFactory.getDatabase(dbType);
    const shortees = await db.getUserShortees(req.user.userId, limitNum, offsetNum);

    // 轉換資料格式
    const formattedShortees = shortees.map(shortee => ({
      shorteeCode: shortee.shorteeCode || '',
      origin: shortee.origin,
      title: shortee.title,
      createdAt: shortee.createdAt || new Date(),
    }));

    // 計算是否有更多資料
    const hasMore = shortees.length === limitNum;

    res.status(200).json({
      shortees: formattedShortees,
      total: formattedShortees.length,
      hasMore,
    });
  } catch (error) {
    console.error('Error in history API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching history.';
    res.status(500).json({
      message: errorMessage,
      success: false,
    });
  }
}

export default withRequiredAuth(handler); 