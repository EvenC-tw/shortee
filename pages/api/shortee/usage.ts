import { AuthenticatedRequest, withRequiredAuth } from '../../../lib/middleware/auth';
import { DatabaseFactory, DatabaseType } from '../../../lib/database/factory';

import { NextApiResponse } from 'next';

// 從環境變數取得資料庫類型，預設使用 MongoDB
const dbType = (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.MONGODB;

interface UsageResponse {
  usage: Array<{
    shorteeCode: string;
    userId?: string;
    accessedAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }>;
  total: number;
  hasMore: boolean;
}

interface ErrorResponse {
  message: string;
  success: false;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse<UsageResponse | ErrorResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed', success: false });
  }

  try {
    const { shorteeCode, limit = '20', offset = '0' } = req.query;
    
    if (!shorteeCode || typeof shorteeCode !== 'string') {
      return res.status(400).json({ message: 'Shortee code is required', success: false });
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 100); // 最大 100 筆
    const offsetNum = parseInt(offset as string) || 0;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required', success: false });
    }

    const db = await DatabaseFactory.getDatabase(dbType);
    const usage = await db.getShorteeUsage(shorteeCode, limitNum, offsetNum);

    // 轉換資料格式
    const formattedUsage = usage.map(record => ({
      shorteeCode: record.shorteeCode,
      userId: record.userId,
      accessedAt: record.accessedAt,
      userAgent: record.userAgent,
      ipAddress: record.ipAddress,
    }));

    // 計算是否有更多資料
    const hasMore = usage.length === limitNum;

    res.status(200).json({
      usage: formattedUsage,
      total: formattedUsage.length,
      hasMore,
    });
  } catch (error) {
    console.error('Error in usage API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching usage.';
    res.status(500).json({
      message: errorMessage,
      success: false,
    });
  }
}

export default withRequiredAuth(handler); 