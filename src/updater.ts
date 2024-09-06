import {
  IssuesEditedEvent,
  IssuesLabeledEvent,
  IssuesUnlabeledEvent,
} from "@octokit/webhooks-types";
import {
  idColumnPosition,
  initialProgressLabel,
  Labels,
  progressLabelColumnPosition,
  releaseDateColumnPosition,
} from "./triggers";
import { UniqueId } from "./uniqueId";
import { getDueDate } from "./utils";

export class Updater {
  templateSheet: GoogleAppsScript.Spreadsheet.Sheet;
  srcSheet: GoogleAppsScript.Spreadsheet.Sheet;
  progressLabels: Labels;

  constructor(
    templateSheet: GoogleAppsScript.Spreadsheet.Sheet,
    srcSheet: GoogleAppsScript.Spreadsheet.Sheet,
    progressLabels: Labels
  ) {
    this.templateSheet = templateSheet;
    this.srcSheet = srcSheet;
    this.progressLabels = progressLabels;
  }

  updateProgressLabel(data: IssuesLabeledEvent) {
    if (!data.label) {
      throw new Error("ラベルがありませんでした");
    }

    const uniqueId = new UniqueId(data.repository.id, data.issue.id);

    // 行を上から見ていく
    for (let i = 1; i <= this.srcSheet.getLastRow(); i++) {
      const range = this.srcSheet.getRange(i, idColumnPosition);

      const currentRowUniqueId = UniqueId.from(range.getValue());
      if (currentRowUniqueId === null) continue; // 手動で作られた課題の行の可能性が高い

      // idが一致
      if (uniqueId.isSame(currentRowUniqueId)) {
        // 現在のステータスを取得
        const bStatus = this.srcSheet
          .getRange(i, progressLabelColumnPosition)
          .getValue();
        // テンプレートにラベルに対応する情報があれば更新、なければ変更なし
        this.srcSheet
          .getRange(i, progressLabelColumnPosition)
          .setValue(this.progressLabels[data.label.name] || bStatus);
      }
    }
  }

  // unLabelのリクエスト
  removeProgressLabel(data: IssuesUnlabeledEvent) {
    const uniqueId = new UniqueId(data.repository.id, data.issue.id);

    // シートを上からissueIdが一致するか確認する
    for (let i = 1; i <= this.srcSheet.getLastRow(); i++) {
      const range = this.srcSheet.getRange(i, idColumnPosition);

      const currentRowUniqueId = UniqueId.from(range.getValue());
      if (currentRowUniqueId === null) continue; // 手動で作られた課題の行の可能性が高い

      // idが一致すれば一番最近つけられたラベルに対応する進捗状況に更新する。なければ"未着手"
      if (uniqueId.isSame(currentRowUniqueId)) {
        let progressLabel = initialProgressLabel;
        for (const label in data.issue.labels) {
          progressLabel = this.progressLabels[label] || progressLabel;
        }
        this.srcSheet
          .getRange(i, progressLabelColumnPosition)
          .setValue(progressLabel);
        break;
      }
    }
  }

  updateDueDate(data: IssuesEditedEvent) {
    if (!data.issue.body) {
      throw new Error("Issueの本文がありませんでした");
    }

    // コメントからログ記録の選択を抽出
    const logToSheet =
      /<!--\s*スプレッドシートに記録するかどうか（\s*y\s*,\s*n\s*）:\s*\[\s*(.)\s*]\s*-->/.exec(
        data.issue.body
      );

    // スプレッドシート挿入処理
    if (logToSheet && (logToSheet[1] === "y" || logToSheet[1] === "Y")) {
      const uniqueId = new UniqueId(data.repository.id, data.issue.id);

      // 行を上から見ていく
      for (let i = 1; i <= this.srcSheet.getLastRow(); i++) {
        const range = this.srcSheet.getRange(i, idColumnPosition);

        const currentRowUniqueId = UniqueId.from(range.getValue());
        if (currentRowUniqueId === null) continue; // 手動で作られた課題の行の可能性が高い

        // idが一致
        if (uniqueId.isSame(currentRowUniqueId)) {
          // 現在の完了予定日を追加
          const releaseDate = getDueDate(data.issue.body);
          this.srcSheet
            .getRange(i, releaseDateColumnPosition)
            .setValue(releaseDate);
        }
      }
    }
  }
}
