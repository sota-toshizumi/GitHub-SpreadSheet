import { moveCompletedIssuesToCompleteSheet } from './moveCompletedIssuesToCompleteSheet';
import { Updater } from './updater';
import { Writer } from './writer';
import { IssuesEvent } from '@octokit/webhooks-types';

// テンプレートなど記載シート
const templateSheetName = '開発メンバー';
const srcSheetName = '開発';
const completeSheetName = '完了';
const keyWords = ['完了', '処理済み'];

// 行
const topRowPosition = 3;
const srcTopRowPosition = 11;

// 列
const idColumnPosition = 8; // UniqueIdクラス
const envColumnPosition = 9; // 修正の環境
const progressLabelColumnPosition = 2; // 進捗状況ラベル
const monthColumnPosition = 6; // 現在の月
const authorColumnPosition = 7; // 作成者
const titleColumnPosition = 10; // タイトル
const releaseDateColumnPosition = 5; // 反映予定日

// 初期設定
// 環境
type Environments = {
  [key: string]: string;
};
const environments: Environments = {
  'www.office-navi.jp': 'www',
  'rental-office-search.jp': 'レンタルオフィス',
  'oni.office-navi.jp': 'oni',
  'Sample-issue-': 'その他',
};

// ラベル
type Labels = {
  [key: string]: string;
};
const initialProgressLabel = '未着手';

// ラベルの対応設定をスプレッドシートから読み取るための設定
const templateLabelTitle = 'git_label';
const templateGitProgressLabelColPos = 4;
const templateProgressLabelColPos = 5;
const templateGitIdColumnPosition = 1;
const templateAuthorColumnPosition = 2;

// 設定用の定数をエクスポートする関数
export const sheetConfigs = (
  templateSheet?: GoogleAppsScript.Spreadsheet.Sheet,
) => {
  let progressLabels: Labels = {};
  if (templateSheet) {
    // ラベルの対応をスプレッドシートから読み込む
    const labelValue = templateSheet
      .getRange(
        2,
        templateGitProgressLabelColPos,
        templateSheet.getLastRow(),
        2,
      )
      .getValues();
    const targertIndex =
      templateProgressLabelColPos - templateGitProgressLabelColPos;
    for (const key in labelValue) {
      if (
        labelValue[key][0] != '' &&
        labelValue[key][0] != templateLabelTitle
      ) {
        progressLabels[labelValue[key][0]] = labelValue[key][targertIndex];
      }
    }
  }

  return {
    templateSheetName,
    srcSheetName,
    completeSheetName,
    keyWords,
    topRowPosition,
    srcTopRowPosition,
    idColumnPosition,
    envColumnPosition,
    progressLabelColumnPosition,
    monthColumnPosition,
    authorColumnPosition,
    titleColumnPosition,
    releaseDateColumnPosition,
    environments,
    initialProgressLabel,
    progressLabels,
    templateGitIdColumnPosition,
    templateAuthorColumnPosition,
  };
};

// スプレッドシートを開くイベントで実行される関数
export function onOpen() {
  // 完了になっているか毎回確認
  moveCompletedIssuesToCompleteSheet();

  // メニューバーに完了確認を追加
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('完了！')
    .addItem('完了！', 'moveCompletedIssuesToCompleteSheet')
    .addToUi();
}

// httpリクエストが来たら発火されるシンプルトリガー
export function doPost(e: GoogleAppsScript.Events.DoPost) {
  if (e == null || e.postData == null || e.postData.contents == null) {
    throw new Error('POSTデータが正しくありません');
  }

  // POSTデータから抽出
  const data: IssuesEvent = JSON.parse(e.postData.contents);

  const templateSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(templateSheetName);
  const srcSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(srcSheetName);

  if (!templateSheet || !srcSheet) {
    throw new Error('シートが見つかりませんでした');
  }

  const writer = new Writer(templateSheet, srcSheet);
  const updater = new Updater(templateSheet, srcSheet);

  if (data.action == 'opened') {
    writer.insertIssue(data);
  } else if (data.action == 'labeled') {
    updater.updateProgressLabel(data);
  } else if (data.action == 'unlabeled') {
    updater.removeProgressLabel(data);
  } else if (data.action == 'edited') {
    updater.updateDueDate(data);
  }
}
