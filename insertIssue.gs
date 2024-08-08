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
  var progressLabel = initialProgressLabel;
  for(var key in data.issue.labels){
    progressLabel = getProgressLabel(data.issue.labels[key].name, progressLabel);
  }
  
  // コメントからログ記録の選択を抽出
  var logToSheet = /<!-- スプレッドシートに記録するかどうか（はい: 1、いいえ: 0）: (\d) -->/.exec(issue.body);

  // スプレッドシート挿入処理
  if (logToSheet && logToSheet[1] === '1' && rowPos != -1) {
    // 挿入する行の特定
    var rowPos = searchPosition(nowMonth, author, sheet);

    // rowPosが上限を超していたら補正
    rowPos = insertRows(rowPos, sheet, srcTopRowPosition, rowPos);

    // データ入力
    sheet.getRange(rowPos, idColumnPosition).setValue(issue.id);
    sheet.getRange(rowPos, monthColumnPosition).setValue(nowMonth);
    sheet.getRange(rowPos, authorColumnPosition).setValue(author);
    sheet.getRange(rowPos, progressLabelColumnPosition).setValue(progressLabel);
    sheet.getRange(rowPos, envColumnPosition).setValue(enviornments[data.repository.name]);

    // データ入力規則の貼り付け
    sheet.getRange(rowPos, titleColumnPosition).setFormula('=HYPERLINK("' + url + '", "' + issue.title + '")');

    // スタイル
    var trgRowHandle = sheet.getRange(rowPos, 1);
    templateRowHandle.copyTo(trgRowHandle, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    templateRowHandle.copyTo(trgRowHandle, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    defaultRowHeight = templateSheet.getRowHeight(1);
    // セルにカラーをつける
    sheet.getRange(rowPos, monthColumnPosition).setBackgrounds(authorColor);
    sheet.getRange(rowPos, authorColumnPosition).setBackgrounds(authorColor);
    sheet.getRange(rowPos, idColumnPosition).setBackgrounds(authorColor);
    sheet.setRowHeight(rowPos, defaultRowHeight);
  }
}

// githubのid -> スプレッドシートに記載する名前の変換
// 引数: githubのid
// 返り値: bufAuthor      = スプレッドシートに記載する名前
//    　　　　　　　bufAuthorColor = その人のセルのカラー
function getAuthorInfo(author){
  // テンプレートシートからデータ取得
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(templateSheetName);
  var range = sheet.getRange(1,templateGitIdColumnPosition,sheet.getLastRow(),1);
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
    bufAuthor      = sheet.getRange(bufAuthorRow,templateAuthorColumnPosition).getValue();
    bufAuthorColor = sheet.getRange(bufAuthorRow,templateAuthorColumnPosition).getBackgrounds();
  }

  return [bufAuthor,bufAuthorColor];
}
