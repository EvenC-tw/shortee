import { DatabaseInterface } from './interface';
import { MongoDBDatabase } from './mongodb';
import { VercelKVDatabase } from './vercel-kv';

/**
 * 資料庫類型列舉
 */
export enum DatabaseType {
  MONGODB = 'mongodb',
  VERCEL_KV = 'vercel-kv',
}

/**
 * 資料庫工廠類別
 */
export class DatabaseFactory {
  private static instance: DatabaseInterface;

  /**
   * 取得資料庫實例
   * @param type 資料庫類型
   * @returns 資料庫實例
   */
  public static async getDatabase(type: DatabaseType = DatabaseType.MONGODB): Promise<DatabaseInterface> {
    if (!DatabaseFactory.instance) {
      switch (type) {
        case DatabaseType.MONGODB:
          DatabaseFactory.instance = await MongoDBDatabase.getInstance();
          break;
        case DatabaseType.VERCEL_KV:
          DatabaseFactory.instance = await VercelKVDatabase.getInstance();
          break;
        default:
          throw new Error(`不支援的資料庫類型: ${type}`);
      }
    }
    return DatabaseFactory.instance;
  }

  /**
   * 關閉資料庫連線
   */
  public static async closeDatabase(): Promise<void> {
    if (DatabaseFactory.instance) {
      await DatabaseFactory.instance.close();
      DatabaseFactory.instance = null;
    }
  }
} 