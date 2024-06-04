const tmpSheetName = "template";
const srcSheetName = "開発リスト";  // 使用シート
const targetSheetName = "完了"; // 移動先シート
const keyWord = "完了"; // keyWordであれば移動
// 列
const topPosition = 2;

const idPosition = 1;
const envPosition = 6;
const statusPosition = 8; // 進捗
const monthPosition = 2; // 現在の月
const namePosition = 3; // 作成者
const titlePosition = 4; // タイトル

const tmp_gitIdPosition = 1;
const tmp_NamePosition = 2;
const tmp_StatusTitle = 'git_label';
const tmp_GitStatusLabel = 4;
const tmp_StatusLabel =5;
const tmp_enviornmentTitle = 'git_repository';
const tmp_gitRepository = 7;
const tmp_enviornment = 8;

 var enviornments =[];
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
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tmpSheetName);

  var labelValue = sheet.getRange(2,tmp_GitStatusLabel,sheet.getLastRow(),2).getValues();
  for(var key in labelValue){
    if(labelValue[key][0] != "" && labelValue[key][0] != tmp_StatusTitle){
      labels[labelValue[key][0]] = labelValue[key][1];
    }
  }


  var envValue = sheet.getRange(2,tmp_gitRepository,sheet.getLastRow(),2).getValues();
  for(var key in envValue){
    if(envValue[key][0] != "" && envValue[key][0] != tmp_enviornmentTitle){
      enviornments[envValue[key][0]] = envValue[key][1];
    }
  }

}