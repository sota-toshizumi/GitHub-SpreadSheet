import {
  srcSheetName,
  completeSheetName,
  keyWords,
  progressLabelColumnPosition,
  monthColumnPosition,
  authorColumnPosition,
  topRowPosition,
} from "./triggers";
import { searchPosition, insertRows } from "./utils";

export function moveCompletedIssuesToCompleteSheet() {
  // シートのインスタンス作成
  const sheets = SpreadsheetApp.getActiveSpreadsheet();
  const srcSheet = sheets.getSheetByName(srcSheetName);
  const completeSheet = sheets.getSheetByName(completeSheetName);

  if (!srcSheet || !completeSheet) {
    throw new Error("シートが見つかりませんでした");
  }

  //　シート全体を見るためのハンドルとデータ型を取得
  const dataRange = srcSheet.getRange(
    1,
    1,
    srcSheet.getLastRow(),
    srcSheet.getLastColumn()
  );
  const value = dataRange.getValues();

  // 行を下から見ていく
  for (let i = srcSheet.getLastRow() - 1; i >= 0; i--) {
    //該当セルが目的のキーワードであれば行を完了シートに移動
    if (keyWords.includes(value[i][progressLabelColumnPosition - 1])) {
      // 行のハンドル取得
      const srcRowHandle = srcSheet.getRange(
        i + 1,
        1,
        1,
        srcSheet.getLastColumn()
      );

      // 移動元の月と編集者
      const srcMonth = value[i][monthColumnPosition - 1];
      const srcName = value[i][authorColumnPosition - 1];

      // 挿入する行番号
      let rowPos = searchPosition(srcMonth, srcName, completeSheet);

      // 挿入
      rowPos = insertRows(rowPos, completeSheet, topRowPosition, 1);

      // コピー、削除
      srcRowHandle.copyTo(
        completeSheet.getRange(rowPos, 1),
        SpreadsheetApp.CopyPasteType.PASTE_NORMAL,
        false
      );
      srcSheet.deleteRow(i + 1);
    }
  }
}
