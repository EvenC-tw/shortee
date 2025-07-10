import { DatabaseInterface, ShorteeData, ShorteeUsage } from './interface';

import { kv } from '@vercel/kv';

/**
 * Vercel KV 實現的資料庫操作
 */
export class VercelKVDatabase implements DatabaseInterface {
  private static instance: VercelKVDatabase;

  private constructor() {}

  /**
   * 取得 Vercel KV 實例（單例模式）
   */
  public static async getInstance(): Promise<VercelKVDatabase> {
    if (!VercelKVDatabase.instance) {
      VercelKVDatabase.instance = new VercelKVDatabase();
    }
    return VercelKVDatabase.instance;
  }

  /**
   * @inheritdoc
   */
  async getShortee(shorteeCode: string): Promise<ShorteeData | null> {
    try {
      const data = await kv.get<ShorteeData>(`shortee:${shorteeCode}`);
      return data;
    } catch (error) {
      console.error('Vercel KV 查詢失敗:', error);
      throw new Error('查詢短網址時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async addShortee(shorteeCode: string, data: ShorteeData): Promise<void> {
    try {
      const exists = await kv.exists(`shortee:${shorteeCode}`);
      if (exists) {
        throw new Error('此短網址代碼已被使用');
      }

      const now = new Date();
      const shorteeData: ShorteeData = {
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: now,
      };

      await kv.set(`shortee:${shorteeCode}`, shorteeData);

      // 如果使用者已登入，也儲存到使用者歷史記錄
      if (data.userId) {
        const userKey = `user:${data.userId}:shortees`;
        const userShortees = await kv.lrange(userKey, 0, -1) as string[];
        userShortees.unshift(shorteeCode);
        // 只保留最新的 100 筆記錄
        const trimmedShortees = userShortees.slice(0, 100);
        await kv.del(userKey);
        if (trimmedShortees.length > 0) {
          await kv.rpush(userKey, ...trimmedShortees);
        }
      }
    } catch (error) {
      if (error.message === '此短網址代碼已被使用') {
        throw error;
      }
      console.error('Vercel KV 新增失敗:', error);
      throw new Error('新增短網址時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async getUserShortees(userId: string, limit: number = 50, offset: number = 0): Promise<ShorteeData[]> {
    try {
      const userKey = `user:${userId}:shortees`;
      const shorteeCodes = await kv.lrange(userKey, offset, offset + limit - 1) as string[];
      
      const shortees: ShorteeData[] = [];
      for (const code of shorteeCodes) {
        const data = await kv.get<ShorteeData>(`shortee:${code}`);
        if (data) {
          shortees.push({
            ...data,
            shorteeCode: code,
          });
        }
      }
      
      return shortees;
    } catch (error) {
      console.error('Vercel KV 查詢使用者短網址失敗:', error);
      throw new Error('查詢使用者短網址時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async recordUsage(shorteeCode: string, usage: ShorteeUsage): Promise<void> {
    try {
      const usageKey = `usage:${shorteeCode}`;
      const usageData = {
        ...usage,
        accessedAt: usage.accessedAt,
      };
      
      await kv.rpush(usageKey, JSON.stringify(usageData));
      
      // 限制使用記錄數量，只保留最新的 1000 筆
      const usageCount = await kv.llen(usageKey);
      if (usageCount > 1000) {
        await kv.ltrim(usageKey, -1000, -1);
      }
    } catch (error) {
      console.error('Vercel KV 記錄使用統計失敗:', error);
      throw new Error('記錄使用統計時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async getShorteeUsage(shorteeCode: string, limit: number = 50, offset: number = 0): Promise<ShorteeUsage[]> {
    try {
      const usageKey = `usage:${shorteeCode}`;
      const usageStrings = await kv.lrange(usageKey, offset, offset + limit - 1) as string[];
      
      return usageStrings.map(str => JSON.parse(str) as ShorteeUsage);
    } catch (error) {
      console.error('Vercel KV 查詢使用統計失敗:', error);
      throw new Error('查詢使用統計時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async close(): Promise<void> {
    // Vercel KV 不需要特別關閉連線
    return;
  }
} 