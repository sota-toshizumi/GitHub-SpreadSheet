const templateSheetName = "開発メンバー";  // テンプレートなど記載シート
const srcSheetName      = "開発";   // 使用シート
const completeSheetName = "完了";      // 開発完了移動先シート
const keyWord           = "完了";      // keyWordであれば移動

// 行
let defaultRowHeight    = 5;
const topRowPosition    = 3;
const srcTopRowPosition = 11;

// 列
const idColumnPosition            = 8; // issueId
const envColumnPosition           = 9; // 修正の環境
const progressLabelColumnPosition = 2; // 進捗状況ラベル
const monthColumnPosition         = 6; // 現在の月
const authorColumnPosition        = 7; // 作成者
const titleColumnPosition         = 10; // タイトル
const releaseDateColumnPosition   = 5; // 反映予定日

// 初期設定
// 環境
const enviornments = {
  "www.office-navi.jp": "www",
  "rental-office-search.jp": "レンタルオフィス",
  "oni.office-navi.jp": "oni",
  "Sample-issue-" : "その他",
}
// ラベル
const initialProgressLabel = '未着手';

// ラベルの対応設定をスプレッドシートから読み取るための設定
var progressLabels = [];
const templateLabelTitle             = 'git_label';
const templateGitProgressLabelColPos = 4;
const templateProgressLabelColPos    = 5;
const templateGitIdColumnPosition    = 1;
const templateAuthorColumnPosition   = 2;

// スプレッドシートを開くイベントで実行される関数
function onOpen(e){
  setConsts();
  // 完了になっているか毎回確認
  moveCompletedIssuesToCompleteSheet();

  // メニューバーに完了確認を追加
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('完了！')
      .addItem('完了！', 'moveCompletedIssuesToCompleteSheet')
      .addToUi();
}

// httpリクエストが来たら発火されるシンプルトリガー
function doPost(e){
  setConsts();

  if (e == null || e.postData == null || e.postData.contents == null) {
    return;
  }

  // postデータから抽出
  var data    = JSON.parse(e.postData.contents);
  var issue   = data.issue;

  var srcSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(srcSheetName);
  if(data.action == "opened"){
    insertIssue(srcSheet, data);
  }
  else if(data.action == "labeled"){
    updateProgressLabel(srcSheet, data);
  }
  else if(data.action == "unlabeled"){
    removeProgressLabel(srcSheet, data);
  }
  else if(data.action == "edited"){
    editReleaseDate(srcSheet, data);
  }
}

// スプレッドシートから必要になる定数を宣言する関数
// 宣言定数　　　　　　　　　　　　: 詳細
// progressLabels : 進捗状況ラベル(github上での進捗状況ラベルと)
function setConsts(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(templateSheetName);

  // ラベルの対応をスプレッドシートから読み込む
  var labelValue   = sheet.getRange(2, templateGitProgressLabelColPos, sheet.getLastRow(), 2).getValues();
  var targertIndex = templateProgressLabelColPos-templateGitProgressLabelColPos;
  for(var key in labelValue){
    if(labelValue[key][0] != "" && labelValue[key][0] != templateLabelTitle){
      progressLabels[labelValue[key][0]] = labelValue[key][targertIndex];
    }
  }
}