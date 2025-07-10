import { AuthenticatedRequest, withAuth } from '../../lib/middleware/auth';
import { DatabaseFactory, DatabaseType } from '../../lib/database/factory';

import { NextApiResponse } from 'next';

// 從環境變數取得資料庫類型，預設使用 MongoDB
const dbType = (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.MONGODB;

interface ShorteeData {
  origin: string;
  title?: string;
  userId?: string;
  provider?: string;
  providerId?: string;
  createdAt: Date;
}

interface ApiResponse {
  message?: string;
  success?: boolean;
  data?: {
    shortee: string;
    origin: string;
    title?: string;
  };
  origin?: string;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>): Promise<void> {
  const { method } = req;
  switch (method) {
    case 'GET': {
      await getShortee(req, res);
      return;
    }
    case 'POST': {
      await addShortee(req, res);
      return;
    }
    default: {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
      return;
    }
  }
}

async function getShortee(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  console.log(`getShortee API (${dbType}) called with query:`, req.query);
  const { shortee } = req.query;

  if (!shortee || typeof shortee !== 'string') {
    console.warn('getShortee: Missing or invalid shortee parameter.');
    return res.status(400).json({ message: 'Shortee parameter is required and must be a string.', success: false });
  }

  try {
    const db = await DatabaseFactory.getDatabase(dbType);
    const data = await db.getShortee(shortee);
    
    if (data) {
      // 記錄使用統計
      try {
        await db.recordUsage(shortee, {
          shorteeCode: shortee,
          userId: req.user?.userId,
          accessedAt: new Date(),
          userAgent: req.headers['user-agent'],
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        });
      } catch (usageError) {
        console.warn('Failed to record usage:', usageError);
        // 不中斷主要流程
      }

      return res.status(200).json({ origin: data.origin });
    } else {
      console.log(`getShortee: Code ${shortee} not found.`);
      return res.status(404).json({ message: `Shortee '${shortee}' not found.`, success: false });
    }
  } catch (error) {
    console.error('Error in getShortee:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching shortee.';
    return res.status(500).json({
      message: errorMessage,
      success: false,
    });
  }
}

async function addShortee(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  console.log(`addShortee API (${dbType}) called with body:`, req.body);
  const { origin, shortee, title } = req.body;

  if (!origin || typeof origin !== 'string' || !shortee || typeof shortee !== 'string') {
    console.warn('addShortee: Missing or invalid origin or shortee in request body.');
    return res
      .status(400)
      .json({ message: 'Both origin URL and shortee code are required and must be strings.', success: false });
  }

  try {
    let parsedOriginUrl: URL;
    try {
      parsedOriginUrl = new URL(origin);
      if (!isValidWebUrl(parsedOriginUrl)) {
        throw new Error('Invalid origin URL format or scheme according to server-side validation.');
      }
    } catch (urlError) {
      console.warn(`addShortee: Invalid origin URL format: ${origin}. Error: ${(urlError as Error).message}`);
      return res.status(400).json({ message: `無效的原始網址格式: ${(urlError as Error).message}`, success: false });
    }

    // 移除 URL 片段（以 # 開頭的部分）以進行可達性檢查
    parsedOriginUrl.hash = '';
    const urlForValidation = parsedOriginUrl.href;

    console.log(`addShortee: Checking reachability for: ${urlForValidation}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(urlForValidation, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 400 && response.status !== 403 && response.status !== 405) {
        console.warn(
          `addShortee: URL reachability check failed for ${urlForValidation} - Status: ${response.status}`
        );
        return res.status(400).json({
          message: `目標網址似乎無法訪問或不存在 (狀態碼: ${response.status})。請檢查網址是否正確。`,
          success: false,
        });
      }
      console.log(
        `addShortee: URL reachability check successful for ${urlForValidation} - Status: ${response.status}`
      );
    } catch (fetchError) {
      console.warn(
        `addShortee: URL reachability check threw an error for ${urlForValidation}: ${(fetchError as Error).name} - ${(fetchError as Error).message}`
      );
      let userMessage = '無法驗證目標網址的可達性。請檢查網址是否正確，或稍後再試。';
      if ((fetchError as Error).name === 'AbortError') {
        userMessage = '驗證目標網址超時，它可能不存在或回應過慢。';
      } else if ((fetchError as any).cause && (fetchError as any).cause.code) {
        const nodeErrorCode = (fetchError as any).cause.code;
        if (nodeErrorCode === 'ENOTFOUND' || nodeErrorCode === 'EAI_AGAIN') {
          userMessage = '目標網址的主機名稱無法解析，它可能不存在。';
        }
      }
      return res.status(400).json({
        message: userMessage,
        success: false,
      });
    }

    console.log(`addShortee: Attempting to save shortee: code=${shortee}, origin=${origin}, title=${title}`);
    try {
      const db = await DatabaseFactory.getDatabase(dbType);
      
      const shorteeData: ShorteeData = {
        origin: origin,
        title: title || undefined,
        userId: req.user?.userId,
        provider: req.user?.provider,
        providerId: req.user?.providerId,
        createdAt: new Date()
      };

      await db.addShortee(shortee, shorteeData);
      console.log(`addShortee: Successfully saved shortee: ${shortee}`);
    } catch (dbError) {
      if ((dbError as Error).message === '此短網址代碼已被使用') {
        console.warn(`addShortee: Duplicate shortee code: ${shortee}`);
        return res.status(409).json({
          message: '此短網址代碼已被使用，請重試。',
          success: false,
        });
      }
      console.error(`addShortee: Failed to save shortee ${shortee}:`, dbError);
      return res.status(500).json({
        message: '儲存短網址時發生內部錯誤，請稍後再試。',
        success: false,
      });
    }

    return res.status(201).json({
      message: 'Shortee added successfully',
      success: true,
      data: {
        shortee,
        origin: origin,
        title: title,
      },
    });
  } catch (error) {
    // Catchall for unexpected errors in addShortee function body
    console.error('Error in addShortee [Outer Try-Catch]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while adding shortee.';
    return res.status(500).json({
      message: errorMessage,
      success: false,
    });
  }
}

/**
 * Checks if the given URL object is a valid web URL (http or https)
 * with a TLD and not localhost.
 *
 * @param {URL} urlObject The URL object to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
function isValidWebUrl(urlObject: URL): boolean {
  if (!(urlObject instanceof URL)) {
    // This case should ideally be caught by new URL() constructor failing first,
    // but as a safeguard for direct calls:
    console.warn('isValidWebUrl: Input is not a valid URL object.');
    return false;
  }
  const { protocol, hostname } = urlObject;
  if (protocol !== 'http:' && protocol !== 'https:') {
    // console.debug(`isValidWebUrl: Invalid protocol - ${protocol}`); // Debug level, can be noisy
    return false;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    // console.debug(`isValidWebUrl: Localhost detected - ${hostname}`); // Debug level, can be noisy
    return false;
  }
  if (!hostname.includes('.')) {
    // console.debug(`isValidWebUrl: No TLD detected - ${hostname}`); // Debug level, can be noisy
    return false;
  }
  return true;
}

export default withAuth(handler); 