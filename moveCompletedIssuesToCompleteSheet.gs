function moveCompletedIssuesToCompleteSheet(){
  // シートのインスタンス作成
  var sheets        = SpreadsheetApp.getActiveSpreadsheet();
  var srcSheet      = sheets.getSheetByName(srcSheetName);
  var completeSheet = sheets.getSheetByName(completeSheetName);
  
  //　シート全体を見るためのハンドルとデータ型を取得
  var dataRange = srcSheet.getRange(1,1,srcSheet.getLastRow(),srcSheet.getLastColumn());
  var value     = dataRange.getValues();

  // 行を下から見ていく
  for(let i = srcSheet.getLastRow()-1;i >= 0 ; i--){
    
    //該当セルが目的のキーワードであれば行を完了シートに移動
    if(value[i][progressLabelColumnPosition-1] === keyWord){    
      // 行のハンドル取得
      var srcRowHandle = srcSheet.getRange(i+1,1,1,srcSheet.getLastColumn());
    
      // 移動元の月と編集者
      var srcMonth = value[i][monthColumnPosition-1];
      var srcName  = value[i][authorColumnPosition-1];

      // 挿入する行番号
      var rowPos = searchPosition(srcMonth,srcName,completeSheet);

      // 挿入
      rowPos = insertRows(rowPos, completeSheet, topRowPosition, 1);

      // コピー、削除
      srcRowHandle.copyTo(completeSheet.getRange(rowPos,1), SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);
      srcSheet.deleteRow( i+1 );
    }
  }
}

// 挿入する場所を特定する関数
// 引数: srcMonth　　　　　　　=　入力するデータの月
//    　　　　　srcAuthor　　　　　=　入力するデータの名前
//      　targetSheet　=　入力先シート
//　返り値: 挿入したい行番号(＊配列のキーではなくスプレッドシート上の行番号)
//月の一致->名前の一致の順に見ていく
function searchPosition(srcMonth,srcAuthor,targetSheet){
  // 入力先シートが空じゃなければ
  if(targetSheet.getLastRow()){
      // 移動先シートのデータ取得
    var targetRange   = targetSheet.getRange(1,monthColumnPosition,targetSheet.getLastRow(),2);
    var diffCheckData = targetRange.getValues();

    // 配列で扱えるキーに変換
    let monthIndex = monthColumnPosition-monthColumnPosition;
    let nameIndex  = authorColumnPosition-monthColumnPosition;

    for(let i=0; i < targetSheet.getLastRow(); i++){
      if(typeof diffCheckData[i][monthIndex] === 'string' || typeof diffCheckData[i][monthIndex] === 'integer'){
          // もし月が空文字じゃなくて月が一致してなかったらその時点の行の一つ前の行番号を返す
        if(diffCheckData[i][monthIndex] != "" && diffCheckData[i][monthIndex] != srcMonth){
          return i;
        }
        // もし月が一致していたら
        else if(diffCheckData[i][monthIndex] == srcMonth){
          for(let j=i; j < targetSheet.getLastRow();j++){
            // もし名前一致してたらその時点の行番号を返す
            if(diffCheckData[j][nameIndex] == srcAuthor){
              return j+1;
            }
            else if(diffCheckData[j][monthIndex] != srcMonth){
              return j+1;
            }
          }
        }
      }
    }
    return topRowPosition;
  }else{
    return topRowPosition;
  }
}

// 設定している行の上限を超えないように行を挿入する関数
// 引数  : rowPos　 　　　　　　　　   　　= 挿入予定の行
//        targetSheet     = 挿入先シート
// 返り値 : rowPos         = 補正後の行番号
function insertRows(rowPos, targetSheet, topRowPosition, insertRowsPosition){
  insertRowsPosition = Math.max( insertRowsPosition, 0);
  while(rowPos < topRowPosition){
    targetSheet.insertRowBefore(insertRowsPosition);
    targetSheet.getRange(insertRowsPosition, 1, 1, targetSheet.getLastColumn()).setBackground("#ffffff");
    targetSheet.getRange(insertRowsPosition, 1, 1, targetSheet.getLastColumn()).clearDataValidations();
    rowPos += 1;
  }
  targetSheet.insertRowBefore( Math.max(1,rowPos) );
  return rowPos;
}