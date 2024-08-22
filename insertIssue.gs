function createId(data){
  return `${data.repository.id}_${data.issue.id}`;
}

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
  var releaseDate           = dateParse(issue.body);
  
  // 進捗状況は最終に登録したlabelを反映する
  var progressLabel = initialProgressLabel;
  for(var key in data.issue.labels){
    progressLabel = getProgressLabel(data.issue.labels[key].name, progressLabel);
  }
  
  // コメントからログ記録の選択を抽出
  var logToSheet = /<!--\s*スプレッドシートに記録するかどうか（\s*y\s*,\s*n\s*）:\s*\[\s*(.)\s*]\s*-->/.exec(issue.body);

  // スプレッドシート挿入処理
  if (logToSheet && (logToSheet[1] === 'y' || logToSheet[1] === 'Y') && rowPos != -1) {
    // 挿入する行の特定
    var rowPos = searchPosition(nowMonth, author, sheet);

    // rowPosが上限を超していたら補正
    rowPos = insertRows(rowPos, sheet, srcTopRowPosition, rowPos);

    // データ入力
    sheet.getRange(rowPos, idColumnPosition).setValue(createId(data));
    sheet.getRange(rowPos, monthColumnPosition).setValue(nowMonth);
    sheet.getRange(rowPos, authorColumnPosition).setValue(author);
    sheet.getRange(rowPos, progressLabelColumnPosition).setValue(progressLabel);
    sheet.getRange(rowPos, envColumnPosition).setValue(enviornments[data.repository.name]);
    sheet.getRange(rowPos, releaseDateColumnPosition).setValue(releaseDate);

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

// 文字型から定型分に含まれている反映予定日を抽出してDate型で返す。
// text: 抽出元
function dateParse( text ){
   // 正規表現パターンを定義: 📆  反映予定日 yyyy/mm/dd
  var datePattern = /📆\s*反映予定日\s*(\w{4})?\/?(\w{2})?\/?(\w{2})?/;

  // 正規表現を使用してテキストを検索
  var result = text.match(datePattern);

  if (result) {
    var year = result[1] ? parseInt(result[1], 10) : null; // yyyyがある場合はそのまま、ない場合はnull
    var month = result[2] ? parseInt(result[2], 10) - 1 : null; // mmがある場合はそのまま、ない場合はnull
    var day = result[3] ? parseInt(result[3], 10) : null; // ddがある場合はそのまま、ない場合はnull
    
    // 現在の日付情報を取得
    var currentDate = new Date();
    var currentYear = currentDate.getFullYear();
    var currentMonth = currentDate.getMonth();
    var currentDay = currentDate.getDate();

    // 日が指定されていない場合は現在の日を設定
    if (day === null || isNaN(day)) {
      day = currentDay;
    }

    // 月が指定されていない場合は現在の月を設定
    if (month === null || isNaN(month)) {
      month = (day < currentDay) ? currentMonth + 1 : currentMonth;
    }

    // 年が指定されていない場合の処理
    if (year === null || isNaN(year)) {
      // 月が指定されていて、それが現在の月より若い場合は来年を設定
      year = (month < currentMonth) ? currentYear + 1 : currentYear;
    }

    // 日付オブジェクトを作成
    var date = new Date(year, month, day);
    if( date.toString() == 'Invalid Date'){
      return new Date();
    }else{
      return date;
    }
  }else {
    return new Date();
  }
}
