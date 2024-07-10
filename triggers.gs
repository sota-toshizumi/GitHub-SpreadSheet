const templateSheetName = "template";
const srcSheetName = "開発リスト";  // 使用シート
const targetSheetName = "完了"; // 移動先シート
const keyWord = "完了"; // keyWordであれば移動

// 行
const topPosition = 2;

// 列
const idColumnPosition = 1;
const envColumnPosition = 6;
const statusPosition = 8; // 進捗
const monthColumnPosition = 2; // 現在の月
const authorColumnPosition = 3; // 作成者
const titleColumnPosition = 4; // タイトル

const template_gitIdColumnPosition = 1;
const template_NameColumnPosition  = 2;

// 環境
const enviornments = {
  "Sample-issue-" : "www",
}

// ラベルの対応設定をスプレッドシートから読み取るための設定
const tmp_StatusTitle = 'git_label';
const tmp_GitStatusLabel = 4;
const tmp_StatusLabel =5;
var labels = [];

// 開くたびに発火されるシンプルトリガー
function onOpen(e){
  setConsts();
  // 完了になっているか毎回確認
  moveRow();

  // メニューバーに完了確認を追加
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('完了！')
      .addItem('完了！', 'moveRow')
      .addToUi();
}

// httpリクエストが来たら発火されるシンプルトリガー
function doPost(e){
  setConsts();
  if (e == null || e.postData == null || e.postData.contents == null) {
    return;
  }

  var payload = JSON.parse(e.postData.contents);
  var issue = payload.issue;

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

// スプレッドシートから必要になる定数を返す関数
function setConsts(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(templateSheetName);

  // ラベルの対応をスプレッドシートから読み込む
  var labelValue = sheet.getRange(2,tmp_GitStatusLabel,sheet.getLastRow(),2).getValues();
  for(var key in labelValue){
    if(labelValue[key][0] != "" && labelValue[key][0] != tmp_StatusTitle){
      labels[labelValue[key][0]] = labelValue[key][1];
    }
  }

  /*
  var envValue = sheet.getRange(2,tmp_gitRepository,sheet.getLastRow(),2).getValues();
  for(var key in envValue){
    if(envValue[key][0] != "" && envValue[key][0] != tmp_enviornmentTitle){
      enviornments[envValue[key][0]] = envValue[key][1];
    }
  }
  */
}