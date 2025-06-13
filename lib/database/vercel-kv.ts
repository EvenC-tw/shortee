import { DatabaseInterface, ShorteeData } from './interface';

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
      const data = await kv.get<ShorteeData>(shorteeCode);
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
      const exists = await kv.exists(shorteeCode);
      if (exists) {
        throw new Error('此短網址代碼已被使用');
      }
      await kv.set(shorteeCode, data);
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
  async close(): Promise<void> {
    // Vercel KV 不需要特別關閉連線
    return;
  }
} 