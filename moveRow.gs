
function moveRow(){
  // シートのインスタンス作成
  var sheets = SpreadsheetApp.getActiveSpreadsheet();
  var srcSheet = sheets.getSheetByName(srcSheetName);
  var targetSheet = sheets.getSheetByName(targetSheetName);
  
  //　シート全体を見るためのハンドルとデータ型を取得
  var dataRange = srcSheet.getRange(1,1,srcSheet.getLastRow(),srcSheet.getLastColumn());
  var value = dataRange.getValues();

  // 行を下から見ていって該当カラムがkeyWordであればシートを移動
  for(let i = srcSheet.getLastRow()-1;i > 0 ; i--){
    //該当セルが目的のキーワードであれば..
    if(value[i][statusPosition-1] === keyWord){    
      //行のハンドル取得
      var srcRowHandle = srcSheet.getRange(i+1,1,1,srcSheet.getLastColumn());

      // 移動先のシートが空じゃなければ
      if(targetSheet.getLastRow()){
        // 移動元の月と編集者
        var srcMonth = value[i][monthColumnPosition-1];
        var srcName = value[i][authorColumnPosition-1];

        // 挿入する行番号
        var pos = searchPosition(srcMonth,srcName,targetSheet);

        if(pos != -1){
          // 挿入
          targetSheet.insertRowBefore(pos);
          var targetRowHandle = targetSheet.getRange(pos,1);

          if(pos==1){
            targetSheet.insertRowBefore(pos);
            pos+=1;
            var targetRowHandle = targetSheet.getRange(pos,1);
          }

          // コピー、削除
          srcRowHandle.copyTo(targetRowHandle,SpreadsheetApp.CopyPasteType.PASTE_NORMAL,false);
          srcSheet.deleteRow(i+1);

        }
      }else{
        targetSheet.insertRowBefore(2);
        var targetRowHandle = targetSheet.getRange(2,1);
        srcRowHandle.copyTo(targetRowHandle,SpreadsheetApp.CopyPasteType.PASTE_NORMAL,false);
        srcSheet.deleteRow(i+1);
      }
      
    }
  }
}

// 挿入する場所を特定する関数
// 引数: srcMonth=入力するデータの月
//    　　　　　srcAuthor=入力するデータの名前
//      　targetSheet=入力先シート
//　返り値: 挿入したい行番号
//月の一致->名前の一致の順に見ていく
function searchPosition(srcMonth,srcAuthor,targetSheet){
  // 移動先シートのデータ取得
  var targetRange = targetSheet.getRange(1,monthColumnPosition,targetSheet.getLastRow(),2);
  var diffCheckData = targetRange.getValues();

  let mP = monthColumnPosition-monthColumnPosition;
  let nP = authorColumnPosition-monthColumnPosition;

  for(let i=0; i < targetSheet.getLastRow(); i++){
    // もし月が空文字じゃなくて月が一致してなかったらその時点の行の一つ前の行番号を返す
    if(diffCheckData[i][mP]!="" && diffCheckData[i][mP]!=srcMonth){
      return i;
    }
    // もし月が一致していたら
    else if(diffCheckData[i][mP]==srcMonth){
      for(let j=i; j < targetSheet.getLastRow();j++){
        // もし名前一致してたらその時点の行番号を返す
        if(diffCheckData[j][nP]==srcAuthor){
          return j+1;
        }
        else if(diffCheckData[j][mP] != srcMonth){
          return j+1;
        }
      }
    }
  }
  return targetRange.getLastRow()+1;
}