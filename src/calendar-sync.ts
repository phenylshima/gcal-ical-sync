import { ICalEvent, SyncResult } from "./types";

/**
 * Googleカレンダーとの同期を管理するクラス
 */
export class CalendarSyncManager {
  private calendar: GoogleAppsScript.Calendar.Calendar;
  private eventCache: Map<string, GoogleAppsScript.Calendar.CalendarEvent> =
    new Map();

  constructor(calendarId: string) {
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw new Error(`Calendar with ID ${calendarId} not found`);
    }
    this.calendar = calendar;
  }

  /**
   * iCalイベントリストとGoogleカレンダーを同期する
   */
  syncEvents(_iCalEvents: ICalEvent[]): SyncResult {
    const iCalEvents = CalendarSyncManager.filteriCalEventsInRange(_iCalEvents);
    Logger.log(`Syncing ${iCalEvents.length} events to Google Calendar`);

    const result: SyncResult = {
      totalEvents: iCalEvents.length,
      createdEvents: 0,
      updatedEvents: 0,
      deletedEvents: 0,
      errors: [],
    };

    try {
      // 既存のイベントをキャッシュに読み込み（過去1年から未来1年の範囲）
      this.loadExistingEvents();

      const processedUids = new Set<string>();

      // iCalイベントを処理
      for (const iCalEvent of iCalEvents) {
        try {
          processedUids.add(iCalEvent.uid);

          const existingEvent = this.eventCache.get(iCalEvent.uid);

          if (existingEvent) {
            // 既存のイベントを更新（必要な場合のみ）
            if (this.shouldUpdateEvent(existingEvent, iCalEvent)) {
              this.updateEvent(existingEvent, iCalEvent);
              result.updatedEvents++;
              Logger.log(`Updated event: ${iCalEvent.summary}`);
            }
          } else {
            // 新しいイベントを作成
            this.createEvent(iCalEvent);
            result.createdEvents++;
            Logger.log(`Created event: ${iCalEvent.summary}`);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          result.errors.push(
            `Error processing event ${iCalEvent.uid}: ${errorMessage}`,
          );
          Logger.log(
            `Error processing event ${iCalEvent.uid}: ${errorMessage}`,
          );
        }
      }

      // 削除すべきイベントを特定（iCalに存在しないが、カレンダーには存在するもの）
      for (const [uid, event] of this.eventCache) {
        if (!processedUids.has(uid)) {
          try {
            // iCalから同期されたイベントかどうかを確認（説明文にUIDが含まれているかチェック）
            if (this.isICalSyncedEvent(event)) {
              event.deleteEvent();
              result.deletedEvents++;
              Logger.log(`Deleted event: ${event.getTitle()}`);
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            result.errors.push(`Error deleting event ${uid}: ${errorMessage}`);
            Logger.log(`Error deleting event ${uid}: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(`Sync operation failed: ${errorMessage}`);
      Logger.log(`Sync operation failed: ${errorMessage}`);
    }

    return result;
  }

  /**
   * イベント取得範囲を決定する（今年度分）
   */
  private static eventFetchRange() {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    if (now.getMonth() < 3) {
      // 1月〜3月の場合、去年の4月1日から今年の4月1日
      startDate = new Date(now.getFullYear() - 1, 3, 1);
      endDate = new Date(now.getFullYear(), 3, 1);
    } else {
      // 4月〜12月の場合、今年の4月1日から来年の4月1日
      startDate = new Date(now.getFullYear(), 3, 1);
      endDate = new Date(now.getFullYear() + 1, 3, 1);
    }
    return { startDate, endDate };
  }

  /** iCalイベントを，取得範囲に入っているものに絞り込む */
  private static filteriCalEventsInRange(iCalEvents: ICalEvent[]) {
    const { startDate, endDate } = CalendarSyncManager.eventFetchRange();
    return iCalEvents.filter((event) => {
      return event.endTime >= startDate && event.startTime <= endDate;
    });
  }

  /**
   * 既存のイベントをキャッシュに読み込む
   */
  private loadExistingEvents(): void {
    const { startDate, endDate } = CalendarSyncManager.eventFetchRange();

    const events = this.calendar.getEvents(startDate, endDate);

    this.eventCache.clear();

    for (const event of events) {
      // イベントの説明からUIDを抽出
      const uid = this.extractUidFromDescription(event.getDescription());
      if (uid) {
        this.eventCache.set(uid, event);
      }
    }

    Logger.log(`Loaded ${this.eventCache.size} existing events into cache`);
  }

  /**
   * イベントの説明文からUIDを抽出する
   */
  private extractUidFromDescription(description: string | null): string | null {
    if (!description) return null;

    const uidMatch = description.match(/\[UID:([^\]]+)\]/);
    return uidMatch ? uidMatch[1] : null;
  }

  /**
   * iCalから同期されたイベントかどうかを判定する
   */
  private isICalSyncedEvent(
    event: GoogleAppsScript.Calendar.CalendarEvent,
  ): boolean {
    const description = event.getDescription();
    return description ? description.includes("[UID:") : false;
  }

  /**
   * 既存のイベントを更新する必要があるかどうかを判定する
   */
  private shouldUpdateEvent(
    existingEvent: GoogleAppsScript.Calendar.CalendarEvent,
    iCalEvent: ICalEvent,
  ): boolean {
    // タイトル、場所、時間が異なる場合は更新
    if (existingEvent.getTitle() !== iCalEvent.summary) {
      return true;
    }

    if (existingEvent.getLocation() !== (iCalEvent.location || "")) {
      return true;
    }

    if (
      existingEvent.getStartTime().getTime() !== iCalEvent.startTime.getTime()
    ) {
      return true;
    }

    if (existingEvent.getEndTime().getTime() !== iCalEvent.endTime.getTime()) {
      return true;
    }

    return false;
  }

  /**
   * 新しいイベントを作成する
   */
  private createEvent(iCalEvent: ICalEvent): void {
    const description = this.buildEventDescription(iCalEvent);

    const event = this.calendar.createEvent(
      iCalEvent.summary,
      iCalEvent.startTime,
      iCalEvent.endTime,
      {
        description: description,
        location: iCalEvent.location || "",
      },
    );

    // キャッシュに追加
    this.eventCache.set(iCalEvent.uid, event);
  }

  /**
   * 既存のイベントを更新する
   */
  private updateEvent(
    existingEvent: GoogleAppsScript.Calendar.CalendarEvent,
    iCalEvent: ICalEvent,
  ): void {
    existingEvent.setTitle(iCalEvent.summary);
    existingEvent.setLocation(iCalEvent.location || "");
    existingEvent.setTime(iCalEvent.startTime, iCalEvent.endTime);

    const description = this.buildEventDescription(iCalEvent);
    existingEvent.setDescription(description);
  }

  /**
   * イベントの説明文を構築する（UIDを含める）
   */
  private buildEventDescription(iCalEvent: ICalEvent): string {
    let description = iCalEvent.description || "";

    // UIDを説明文に追加（同期管理用）
    description += `\n\n[UID:${iCalEvent.uid}]`;

    return description.trim();
  }
}
