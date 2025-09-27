import { ICalFetcher } from "./ical-fetcher";
import { ICalParser } from "./ical-parser";
import { CalendarSyncManager } from "./calendar-sync";
import { SyncResult } from "./types";

declare const globalThis: {
  syncICalToGoogleCalendar: () => Promise<void>;
  showCurrentConfiguration: () => void;
  testSync: () => void;
};

/**
 * スクリプトプロパティのキー名
 */
const SCRIPT_PROPERTIES = {
  ICAL_URL: "ICAL_URL",
  CALENDAR_ID: "CALENDAR_ID",
} as const;

/**
 * メイン同期処理を実行する関数
 * Google Apps Scriptのトリガーから呼び出される
 */
async function syncICalToGoogleCalendar(): Promise<void> {
  try {
    Logger.log("Starting iCal to Google Calendar sync...");

    // スクリプトプロパティから設定を取得
    const config = getScriptConfiguration();

    // iCalデータを取得
    const iCalData = await ICalFetcher.fetchICalData(config.iCalUrl);

    // iCalデータをパース
    const events = ICalParser.parseEvents(iCalData);
    Logger.log(`Parsed ${events.length} events from iCal data`);

    // Googleカレンダーと同期
    const syncManager = new CalendarSyncManager(config.calendarId);
    const syncResult = syncManager.syncEvents(events);

    // 結果をログ出力
    logSyncResult(syncResult);

    Logger.log("iCal to Google Calendar sync completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.log(`Sync failed: ${errorMessage}`);
    throw error;
  }
}

/**
 * スクリプトプロパティから設定を取得する
 */
function getScriptConfiguration(): { iCalUrl: string; calendarId: string } {
  const properties = PropertiesService.getScriptProperties();

  const iCalUrl = properties.getProperty(SCRIPT_PROPERTIES.ICAL_URL);
  const calendarId = properties.getProperty(SCRIPT_PROPERTIES.CALENDAR_ID);

  if (!iCalUrl) {
    throw new Error(
      `Script property '${SCRIPT_PROPERTIES.ICAL_URL}' is not set. ` +
        "Please set the iCal URL in the script properties.",
    );
  }

  if (!calendarId) {
    throw new Error(
      `Script property '${SCRIPT_PROPERTIES.CALENDAR_ID}' is not set. ` +
        "Please set the Google Calendar ID in the script properties.",
    );
  }

  return { iCalUrl, calendarId };
}

/**
 * 同期結果をログ出力する
 */
function logSyncResult(result: SyncResult): void {
  Logger.log("=== Sync Result ===");
  Logger.log(`Total events processed: ${result.totalEvents}`);
  Logger.log(`Events created: ${result.createdEvents}`);
  Logger.log(`Events updated: ${result.updatedEvents}`);
  Logger.log(`Events deleted: ${result.deletedEvents}`);

  if (result.errors.length > 0) {
    Logger.log(`Errors encountered: ${result.errors.length}`);
    result.errors.forEach((error, index) => {
      Logger.log(`Error ${index + 1}: ${error}`);
    });
  } else {
    Logger.log("No errors encountered");
  }
  Logger.log("==================");
}

/**
 * 現在の設定を表示するヘルパー関数
 */
function showCurrentConfiguration(): void {
  try {
    const config = getScriptConfiguration();
    Logger.log("Current configuration:");
    Logger.log(`iCal URL: ${config.iCalUrl}`);
    Logger.log(`Calendar ID: ${config.calendarId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.log(`Configuration error: ${errorMessage}`);
  }
}

/**
 * テスト実行用の関数（手動実行用）
 */
function testSync(): void {
  syncICalToGoogleCalendar().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.log(`Test sync failed: ${errorMessage}`);
  });
}

// 関数をグローバルスコープに追加（Google Apps Scriptで呼び出し可能にするため）
globalThis.syncICalToGoogleCalendar = syncICalToGoogleCalendar;
globalThis.showCurrentConfiguration = showCurrentConfiguration;
globalThis.testSync = testSync;
