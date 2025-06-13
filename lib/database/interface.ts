/**
 * 短網址資料結構
 */
export interface ShorteeData {
  origin: string;
  createdAt?: Date;
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
   * 關閉資料庫連線
   */
  close(): Promise<void>;
} 