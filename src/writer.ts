import {
  authorColumnPosition,
  envColumnPosition,
  environments,
  idColumnPosition,
  initialProgressLabel,
  Labels,
  monthColumnPosition,
  progressLabelColumnPosition,
  releaseDateColumnPosition,
  srcTopRowPosition,
  templateAuthorColumnPosition,
  templateGitIdColumnPosition,
  titleColumnPosition,
} from './triggers';
import { getDueDate, searchPosition, insertRows } from './utils';
import { UniqueId } from './uniqueId';
import { IssuesOpenedEvent } from '@octokit/webhooks-types';

export class Writer {
  templateSheet: GoogleAppsScript.Spreadsheet.Sheet;
  srcSheet: GoogleAppsScript.Spreadsheet.Sheet;
  progressLabels: Labels;
  defaultRowHeight = 5;

  constructor(
    templateSheet: GoogleAppsScript.Spreadsheet.Sheet,
    srcSheet: GoogleAppsScript.Spreadsheet.Sheet,
    progressLabels: Labels,
  ) {
    this.templateSheet = templateSheet;
    this.srcSheet = srcSheet;
    this.progressLabels = progressLabels;
  }

  insertIssue(data: IssuesOpenedEvent) {
    const issue = data.issue;
    if (!issue.body) {
      throw new Error('Issueの本文がありませんでした');
    }

    // テンプレートの取得
    const templateRowHandle = this.templateSheet.getRange(
      1,
      1,
      1,
      this.templateSheet.getLastColumn(),
    );

    // 挿入するデータ
    const url = issue.html_url;
    const user = issue.user.login;
    const { author, authorColor } = this.getAuthorInfo(user);
    const nowMonth = new Date().getMonth() + 1 + '月';
    const releaseDate = getDueDate(issue.body);
    const uniqueId = new UniqueId(data.repository.id, data.issue.id);

    // 進捗状況は最終に登録したlabelを反映する
    let progressLabel = initialProgressLabel;
    for (const label in data.issue.labels) {
      progressLabel = this.progressLabels[label] || progressLabel;
    }

    // コメントからログ記録の選択を抽出
    const logToSheet =
      /<!--\s*スプレッドシートに記録するかどうか（\s*y\s*,\s*n\s*）:\s*\[\s*(.)\s*]\s*-->/.exec(
        issue.body,
      );

    // スプレッドシート挿入処理
    if (logToSheet && (logToSheet[1] === 'y' || logToSheet[1] === 'Y')) {
      // 挿入する行の特定
      let rowPos = searchPosition(nowMonth, author, this.srcSheet);

      // rowPosが上限を超していたら補正
      rowPos = insertRows(rowPos, this.srcSheet, srcTopRowPosition, rowPos);

      // データ入力
      this.srcSheet
        .getRange(rowPos, idColumnPosition)
        .setValue(uniqueId.toString());
      this.srcSheet.getRange(rowPos, monthColumnPosition).setValue(nowMonth);
      this.srcSheet.getRange(rowPos, authorColumnPosition).setValue(author);
      this.srcSheet
        .getRange(rowPos, progressLabelColumnPosition)
        .setValue(progressLabel);
      this.srcSheet
        .getRange(rowPos, envColumnPosition)
        .setValue(environments[data.repository.name]);
      this.srcSheet
        .getRange(rowPos, releaseDateColumnPosition)
        .setValue(releaseDate);

      // データ入力規則の貼り付け
      this.srcSheet
        .getRange(rowPos, titleColumnPosition)
        .setFormula('=HYPERLINK("' + url + '", "' + issue.title + '")');

      // スタイル
      const trgRowHandle = this.srcSheet.getRange(rowPos, 1);
      templateRowHandle.copyTo(
        trgRowHandle,
        SpreadsheetApp.CopyPasteType.PASTE_FORMAT,
        false,
      );
      templateRowHandle.copyTo(
        trgRowHandle,
        SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,
        false,
      );
      this.defaultRowHeight = this.templateSheet.getRowHeight(1);
      // セルにカラーをつける
      this.srcSheet
        .getRange(rowPos, monthColumnPosition)
        .setBackground(authorColor);
      this.srcSheet
        .getRange(rowPos, authorColumnPosition)
        .setBackground(authorColor);
      this.srcSheet
        .getRange(rowPos, idColumnPosition)
        .setBackground(authorColor);
      this.srcSheet.setRowHeight(rowPos, this.defaultRowHeight);
    }
  }

  // githubのid -> スプレッドシートに記載する名前の変換
  // 引数: githubのid
  // 返り値: author      = スプレッドシートに記載する名前
  //        authorColor = その人のセルのカラー
  private getAuthorInfo(author_id: string): {
    author: string;
    authorColor: string;
  } {
    // テンプレートシートからデータ取得
    const range = this.templateSheet.getRange(
      1,
      templateGitIdColumnPosition,
      this.templateSheet.getLastRow(),
      1,
    );
    const values = range.getValues();

    // 該当する名前の登録があればbufAuthorRowを更新
    let bufAuthorRow = 0;
    for (let i = 0; i < this.templateSheet.getLastRow(); i++) {
      if (values[i][0] == author_id) bufAuthorRow = i + 1;
    }

    // もし該当がなければ[author,#fffff]を返す
    let bufAuthor = author_id;
    let bufAuthorColor = '#ffffff';

    if (bufAuthorRow) {
      bufAuthor = this.templateSheet
        .getRange(bufAuthorRow, templateAuthorColumnPosition)
        .getValue();
      bufAuthorColor = this.templateSheet
        .getRange(bufAuthorRow, templateAuthorColumnPosition)
        .getBackground();
    }

    return { author: bufAuthor, authorColor: bufAuthorColor };
  }
}
