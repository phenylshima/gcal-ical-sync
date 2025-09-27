/**
 * iCalイベント情報を表すインターフェース
 */
export interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
}

/**
 * 同期結果を表すインターフェース
 */
export interface SyncResult {
  totalEvents: number;
  createdEvents: number;
  updatedEvents: number;
  deletedEvents: number;
  errors: string[];
}
