const templateSheetName = "template";  // テンプレートなど記載シート
const srcSheetName      = "開発リスト";   // 使用シート
const completeSheetName = "完了";      // 開発完了移動先シート
const keyWord           = "完了";      // keyWordであれば移動

// 行
const topPosition = 2;

// 列
const idColumnPosition          = 1; // issueId
const envColumnPosition         = 6; // 修正の環境
const statusLabelColumnPosition = 8; // 進捗
const monthColumnPosition       = 2; // 現在の月
const authorColumnPosition      = 3; // 作成者
const titleColumnPosition       = 4; // タイトル

const template_gitIdColumnPosition = 1;
const template_AuthorColumnPosition  = 2;

// 環境
const enviornments = {
  "Sample-issue-" : "www",
}

// ラベルの対応設定をスプレッドシートから読み取るための設定
const template_labelTitle                     = 'git_label';
const template_gitProgressLabelColPos = 4;
const template_progressLabelColPos    = 5;
var labels = [];

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
  var payload = JSON.parse(e.postData.contents);
  var issue   = payload.issue;

  var srcSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(srcSheetName);
  if(payload.action == "opened"){
    insertIssue(srcSheet,payload);
  }
  else if(payload.action == "labeled"){
    updateStatus(srcSheet,payload);
  }
  else if(payload.action == "unlabeled"){
    unLabel(srcSheet,payload);
  }
}

// スプレッドシートから必要になる定数を宣言する関数
// 宣言定数　　　　　　　　　　　　: 詳細
// statuslabels : 進捗状況ラベル(github上での進捗状況ラベルと)
function setConsts(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(templateSheetName);

  // ラベルの対応をスプレッドシートから読み込む
  var labelValue   = sheet.getRange(2, template_gitProgressLabelColPos, sheet.getLastRow(), 2).getValues();
  var targertIndex = template_progressLabelColPos-template_gitProgressLabelColPos;
  for(var key in labelValue){
    if(labelValue[key][0] != "" && labelValue[key][0] != template_labelTitle){
      labels[labelValue[key][0]] = labelValue[key][targertIndex];
    }
  }
}