import { DatabaseInterface, ShorteeData, ShorteeUsage } from './interface';
import { Db, MongoClient } from 'mongodb';

/**
 * MongoDB 實現的資料庫操作
 */
export class MongoDBDatabase implements DatabaseInterface {
  private client: MongoClient;
  private db: Db;
  private static instance: MongoDBDatabase;

  private constructor() {}

  /**
   * 取得 MongoDB 實例（單例模式）
   */
  public static async getInstance(): Promise<MongoDBDatabase> {
    if (!MongoDBDatabase.instance) {
      const instance = new MongoDBDatabase();
      await instance.initialize();
      MongoDBDatabase.instance = instance;
    }
    return MongoDBDatabase.instance;
  }

  /**
   * 初始化資料庫連線
   */
  private async initialize(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!uri) {
      throw new Error('MongoDB URI 未設定');
    }

    if (!dbName) {
      throw new Error('MongoDB 資料庫名稱未設定');
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      
      console.log('MongoDB 連線成功');
    } catch (error) {
      console.error('MongoDB 連線失敗:', error);
      throw new Error('無法連接到 MongoDB 資料庫');
    }
  }

  /**
   * @inheritdoc
   */
  async getShortee(shorteeCode: string): Promise<ShorteeData | null> {
    try {
      const result = await this.db.collection('shortees').findOne({ shorteeCode });
      if (!result) {
        return null;
      }
      return {
        origin: result.origin,
        title: result.title,
        userId: result.userId,
        provider: result.provider,
        providerId: result.providerId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      console.error('MongoDB 查詢失敗:', error);
      throw new Error('查詢短網址時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async addShortee(shorteeCode: string, data: ShorteeData): Promise<void> {
    try {
      const now = new Date();
      await this.db.collection('shortees').insertOne({
        shorteeCode,
        origin: data.origin,
        title: data.title,
        userId: data.userId,
        provider: data.provider,
        providerId: data.providerId,
        createdAt: data.createdAt || now,
        updatedAt: now,
      });
    } catch (error) {
      if ((error as any).code === 11000) {
        throw new Error('此短網址代碼已被使用');
      }
      console.error('MongoDB 新增失敗:', error);
      throw new Error('新增短網址時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async getUserShortees(userId: string, limit: number = 50, offset: number = 0): Promise<ShorteeData[]> {
    try {
      const cursor = this.db.collection('shortees')
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      const results = await cursor.toArray();
      return results.map(result => ({
        shorteeCode: result.shorteeCode,
        origin: result.origin,
        title: result.title,
        userId: result.userId,
        provider: result.provider,
        providerId: result.providerId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }));
    } catch (error) {
      console.error('MongoDB 查詢使用者短網址失敗:', error);
      throw new Error('查詢使用者短網址時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async recordUsage(shorteeCode: string, usage: ShorteeUsage): Promise<void> {
    try {
      await this.db.collection('shortee_usage').insertOne({
        shorteeCode,
        userId: usage.userId,
        accessedAt: usage.accessedAt,
        userAgent: usage.userAgent,
        ipAddress: usage.ipAddress,
      });
    } catch (error) {
      console.error('MongoDB 記錄使用統計失敗:', error);
      throw new Error('記錄使用統計時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async getShorteeUsage(shorteeCode: string, limit: number = 50, offset: number = 0): Promise<ShorteeUsage[]> {
    try {
      const cursor = this.db.collection('shortee_usage')
        .find({ shorteeCode })
        .sort({ accessedAt: -1 })
        .skip(offset)
        .limit(limit);

      const results = await cursor.toArray();
      return results.map(result => ({
        shorteeCode: result.shorteeCode,
        userId: result.userId,
        accessedAt: result.accessedAt,
        userAgent: result.userAgent,
        ipAddress: result.ipAddress,
      }));
    } catch (error) {
      console.error('MongoDB 查詢使用統計失敗:', error);
      throw new Error('查詢使用統計時發生錯誤');
    }
  }

  /**
   * @inheritdoc
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log('MongoDB 連線已關閉');
    }
  }
} 