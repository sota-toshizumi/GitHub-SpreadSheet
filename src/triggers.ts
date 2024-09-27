import { moveCompletedIssuesToCompleteSheet } from './moveCompletedIssuesToCompleteSheet';
import { Updater } from './updater';
import { Writer } from './writer';
import { IssuesEvent } from '@octokit/webhooks-types';
import { sheetConfigs } from './sheetConfigs';

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
  const { templateSheetName, srcSheetName } = sheetConfigs();
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
