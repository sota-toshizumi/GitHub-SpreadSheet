function insertIssue(sheet,data){
  // テンプレートの取得
  var templateSheet      = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(templateSheetName);
  var templateRowHandle  = templateSheet.getRange(1, 1, 1, templateSheet.getLastColumn());

  // 挿入するデータ
  var issue                 = data.issue;
  var url                   = issue.html_url;
  var user                  = issue.user.login;
  var [author, authorColor] = getAuthorInfo(user);
  var nowMonth              = (new Date().getMonth() + 1) + "月";
  
  // 進捗状況は最終に登録したlabelを反映する
  var status = '未着手';
  for(var key in data.issue.labels){
    status = getLabel(data.issue.labels[key].name, status);
  }

  // 挿入する行の行番号
  let rowPos = topRowPosition;
  if(sheet.getLastRow()){
    rowPos = searchPosition(nowMonth, author, sheet);
  }
  
  // コメントからログ記録の選択を抽出
  var logToSheet = /<!-- スプレッドシートに記録するかどうか（はい: 1、いいえ: 0）: (\d) -->/.exec(issue.body);

  // スプレッドシート挿入処理
  if (logToSheet && logToSheet[1] === '1' && rowPos != -1) {
    // 挿入する行が一番上だったら一行追加する(常に一番上は空行)
    if(rowPos == 0){
      rowPos += 1;
      sheet.insertRowBefore(rowPos);
      sheet.getRange(rowPos,1, 1, sheet.getLastRow()).setBackground("#ffffff");
    }

    if(rowPos == 1){
      rowPos += 1;
      sheet.insertRowBefore(rowPos);
      sheet.getRange(rowPos,1, 1, sheet.getLastRow()).setBackground("#ffffff");
    }

    // 新しい行を追加
    var trgRowHandle = sheet.getRange(rowPos, 1);
    sheet.insertRowBefore(rowPos);

    // データ入力
    sheet.getRange(rowPos, idColumnPosition).setValue(issue.id);
    sheet.getRange(rowPos, monthColumnPosition).setValue(nowMonth);
    sheet.getRange(rowPos, authorColumnPosition).setValue(author);
    sheet.getRange(rowPos, progressLabelColumnPosition).setValue(status);
    sheet.getRange(rowPos, envColumnPosition).setValue(enviornments[data.repository.name]);

    // データ入力規則の貼り付け
    sheet.getRange(rowPos, titleColumnPosition).setFormula('=HYPERLINK("' + url + '", "' + issue.title + '")');

    // スタイル
    templateRowHandle.copyTo(trgRowHandle, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    templateRowHandle.copyTo(trgRowHandle, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    // セルにカラーをつける
    sheet.getRange(rowPos, monthColumnPosition).setBackgrounds(authorColor);
    sheet.getRange(rowPos, authorColumnPosition).setBackgrounds(authorColor);
    sheet.getRange(rowPos, idColumnPosition).setBackgrounds(authorColor);
  }
}

// githubのid -> スプレッドシートに記載する名前の変換
// 引数: githubのid
// 返り値: bufAuthor      = スプレッドシートに記載する名前
//    　　　　　　　bufAuthorColor = その人のセルのカラー
function getAuthorInfo(author){
  // テンプレートシートからデータ取得
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(templateSheetName);
  var range = sheet.getRange(1,template_gitIdColumnPosition,sheet.getLastRow(),1);
  var value = range.getValues();

  // 該当する名前の登録があればbufAuthorRowを更新
  let bufAuthorRow = 0;
  for(let i=0; i<sheet.getLastRow(); i++){
    if(value[i] == author) bufAuthorRow = i + 1;
  }

  // もし該当がなければ[author,#fffff]を返す
  var bufAuthor      = author;
  var bufAuthorColor = "#ffffff";
  if(bufAuthorRow){
    bufAuthor      = sheet.getRange(bufAuthorRow,template_AuthorColumnPosition).getValue();
    bufAuthorColor = sheet.getRange(bufAuthorRow,template_AuthorColumnPosition).getBackgrounds();
  }

  return [bufAuthor,bufAuthorColor];
}
