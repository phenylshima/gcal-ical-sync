/**
 * iCalデータをHTTPでフェッチするクラス
 */
export class ICalFetcher {
  /**
   * 指定されたURLからiCalデータを取得する
   * @param url - iCalファイルのURL
   * @returns iCal形式の文字列データ、またはnull（データがない場合）
   */
  static async fetchICalData(url: string): Promise<string | null> {
    try {
      Logger.log(`Fetching iCal data from: ${url}`);

      const response = UrlFetchApp.fetch(url, {
        method: "get",
        headers: {
          "User-Agent": "Google-Apps-Script-iCal-Sync/1.0",
        },
        followRedirects: true,
        muteHttpExceptions: true,
      });

      const responseCode = response.getResponseCode();

      if (responseCode >= 200 && responseCode < 300) {
        const content = response.getContentText();
        Logger.log(
          `Successfully fetched iCal data (${content.length} characters)`,
        );
        return content;
      } else if (responseCode == 404) {
        // 予定がないとき，UTASは404を返すので，空文字列を返す
        Logger.log(`No iCal data found at ${url} (HTTP 404)`);
        return null;
      } else {
        throw new Error(`HTTP ${responseCode}: Failed to fetch iCal data`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.log(`Error fetching iCal data: ${errorMessage}`);
      throw new Error(`Failed to fetch iCal data from ${url}: ${errorMessage}`);
    }
  }
}
