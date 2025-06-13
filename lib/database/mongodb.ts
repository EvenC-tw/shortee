import { DatabaseInterface, ShorteeData } from './interface';
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
        createdAt: result.createdAt,
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
      await this.db.collection('shortees').insertOne({
        shorteeCode,
        origin: data.origin,
        createdAt: data.createdAt || new Date(),
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
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log('MongoDB 連線已關閉');
    }
  }
} 