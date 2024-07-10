function insertIssue(sheet,data){
  // テンプレートの取得
  var tmpSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tmpSheetName);
  var tmpRowHandle = tmpSheet.getRange(1,1,1,tmpSheet.getLastColumn());

  // 挿入するデータ
  var issue = data.issue;
  var commentBody = issue.body;
  var title = issue.title;
  var url = issue.html_url;
  var user = issue.user.login;
  var authorInf = authorInfo(user);
  var name = authorInf[0];
  var color = authorInf[1];
  var currentDate = new Date();
  var month = currentDate.getMonth() + 1;
  var nowMonth = month + "月";
  
  // 進捗状況は最終に登録したlabelを反映する
  var status = '未着手';
  for(var key in data.issue.labels){
    status = getLabel(data.issue.labels[key].name,status);
  }

  // 挿入する行の行番号
  let rowPos = topPosition;
  if(sheet.getLastRow()){
    rowPos = searchPosition(nowMonth,name,sheet);
  }
  
  // コメントからログ記録の選択を抽出
  var logToSheet = /<!-- スプレッドシートに記録するかどうか（はい: 1、いいえ: 0）: (\d) -->/.exec(commentBody);

  // ここからスプレッドシート挿入処理
  if (logToSheet && logToSheet[1] === '1' && rowPos != -1) {
    // 挿入する行が一番上だったら一行追加する
    // 常に一番上は空行
    if(rowPos == 0){
      rowPos +=1;
      sheet.insertRowBefore(rowPos);
      sheet.getRange(rowPos,1,1,sheet.getLastRow()).setBackground("#ffffff");
    }

    // 新しい行を追加
    var trgRowHandle = sheet.getRange(rowPos,1);
    sheet.insertRowBefore(rowPos);

    // データ入力
    sheet.getRange(rowPos,idColumnPosition).setValue(issue.id);
    sheet.getRange(rowPos,monthColumnPosition).setValue(nowMonth);
    sheet.getRange(rowPos,authorColumnPosition).setValue(name);
    sheet.getRange(rowPos,statusPosition).setValue(status);
    sheet.getRange(rowPos,envColumnPosition).setValue(enviornments[data.repository.name]);
    sheet.getRange(rowPos,titleColumnPosition).setFormula('=HYPERLINK("' + url + '", "' + title + '")');

    // スタイル
    tmpRowHandle.copyTo(trgRowHandle,SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);
    tmpRowHandle.copyTo(trgRowHandle,SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,false);
    sheet.getRange(rowPos,monthColumnPosition).setBackgrounds(color);
    sheet.getRange(rowPos,authorColumnPosition).setBackgrounds(color);
    sheet.getRange(rowPos,idColumnPosition).setBackgrounds(color);
  }
}

// githubのid -> スプレッドシートに記載する名前の変換
// 引数: githubのid
// 返り値: buf[0] = スプレッドシートに記載する名前
//    　　　　　　　buf[1] = その人のセルのカラー
function authorInfo(name){
  // テンプレートシートからデータ取得
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tmpSheetName);
  var range = sheet.getRange(1,tmp_gitIdPosition,sheet.getLastRow(),1);
  var value = range.getValues();

  // 該当する名前の登録があればbufNameRowを更新
  let bufNameRow = 0;
  for(let i=0;i<sheet.getLastRow();i++){
    if(value[i]==name)bufNameRow = i+1;
  }
  // もし該当がなければ[name,#fffff]を返す
  var bufName=name;
  var bufColor="#ffffff";
  if(bufNameRow){
    bufName = sheet.getRange(bufNameRow,tmp_NamePosition).getValue();
    bufColor = sheet.getRange(bufNameRow,tmp_NamePosition).getBackgrounds();
  }

  var buf=[];
  buf[0]=bufName;
  buf[1]=bufColor;
  
  return buf;
}
