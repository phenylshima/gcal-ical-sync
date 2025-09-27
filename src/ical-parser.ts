import { ICalEvent } from "./types";
import ICAL from "ical.js";

/**
 * iCalデータをパースしてイベント情報を抽出する
 */
export class ICalParser {
  /**
   * iCal文字列をパースしてイベントリストを返す
   * @param icalData - iCal形式の文字列データ
   * @returns パースされたイベントの配列
   */
  static parseEvents(icalData: string): ICalEvent[] {
    try {
      const jcalData = ICAL.Component.fromString(icalData);
      const vevents = jcalData.getAllSubcomponents("vevent");

      const events: ICalEvent[] = [];

      for (const vevent of vevents) {
        try {
          const event = this.parseVEvent(vevent);
          if (event) {
            events.push(event);
          }
        } catch (error) {
          Logger.log("Error parsing individual event: " + error);
        }
      }

      return events;
    } catch (error) {
      Logger.log("Error parsing iCal data: " + error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse iCal data: ${errorMessage}`);
    }
  }

  /**
   * 単一のVEVENTコンポーネントをパースする
   */
  private static parseVEvent(vevent: ICAL.Component): ICalEvent | null {
    const uid = vevent.getFirstPropertyValue("uid") as string;
    const summary = vevent.getFirstPropertyValue("summary") as string;

    if (!uid || !summary) {
      Logger.log("Event missing required fields (uid or summary)");
      return null;
    }

    // 開始時刻と終了時刻を取得
    const dtstart = vevent.getFirstProperty("dtstart");
    const dtend = vevent.getFirstProperty("dtend");

    if (!dtstart || !dtend) {
      Logger.log("Event missing start or end time");
      return null;
    }

    const startTime = dtstart.getFirstValue() as ICAL.Time;
    const endTime = dtend.getFirstValue() as ICAL.Time;

    // オプション項目を取得
    const description = vevent.getFirstPropertyValue("description") as
      | string
      | undefined;
    const location = vevent.getFirstPropertyValue("location") as
      | string
      | undefined;

    return {
      uid,
      summary,
      description,
      location,
      startTime: startTime.toJSDate(),
      endTime: endTime.toJSDate(),
    };
  }
}
