/**
 * 使用者資料結構
 */
export interface UserData {
  userId: string;
  name: string;
  email: string | null;
  provider: string;
  providerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 短網址使用統計資料結構
 */
export interface ShorteeUsage {
  shorteeCode: string;
  userId?: string;
  accessedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * 短網址資料結構
 */
export interface ShorteeData {
  shorteeCode?: string; // 用於查詢結果
  origin: string;
  title?: string;
  userId?: string;
  provider?: string;
  providerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 資料庫操作介面
 */
export interface DatabaseInterface {
  /**
   * 根據短網址代碼取得原始網址
   * @param shorteeCode 短網址代碼
   * @returns 原始網址資料，若不存在則回傳 null
   */
  getShortee(shorteeCode: string): Promise<ShorteeData | null>;

  /**
   * 新增短網址
   * @param shorteeCode 短網址代碼
   * @param data 原始網址資料
   * @throws {Error} 當短網址代碼已存在時
   */
  addShortee(shorteeCode: string, data: ShorteeData): Promise<void>;

  /**
   * 取得使用者的短網址歷史記錄
   * @param userId 使用者 ID
   * @param limit 限制數量
   * @param offset 偏移量
   * @returns 短網址列表
   */
  getUserShortees(userId: string, limit?: number, offset?: number): Promise<ShorteeData[]>;

  /**
   * 記錄短網址使用統計
   * @param shorteeCode 短網址代碼
   * @param usage 使用統計資料
   */
  recordUsage(shorteeCode: string, usage: ShorteeUsage): Promise<void>;

  /**
   * 取得短網址使用統計
   * @param shorteeCode 短網址代碼
   * @param limit 限制數量
   * @param offset 偏移量
   * @returns 使用統計列表
   */
  getShorteeUsage(shorteeCode: string, limit?: number, offset?: number): Promise<ShorteeUsage[]>;

  /**
   * 關閉資料庫連線
   */
  close(): Promise<void>;
} 