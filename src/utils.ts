// 文字型から定型分に含まれている反映予定日を抽出してDate型で返す。

import {
  monthColumnPosition,
  authorColumnPosition,
  topRowPosition,
} from './triggers';

// text: 抽出元
export function getDueDate(text: string): Date {
  // 正規表現パターンを定義: 📆  反映予定日 yyyy/mm/dd
  const datePattern = /📆\s*反映予定日\s*(\w{4})?\/?(\w{2})?\/?(\w{2})?/;

  // 正規表現を使用してテキストを検索
  const result = text.match(datePattern);

  if (result) {
    let year = result[1] ? parseInt(result[1], 10) : null; // yyyyがある場合はそのまま、ない場合はnull
    let month = result[2] ? parseInt(result[2], 10) - 1 : null; // mmがある場合はそのまま、ない場合はnull
    let day = result[3] ? parseInt(result[3], 10) : null; // ddがある場合はそのまま、ない場合はnull

    // 現在の日付情報を取得
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // 日が指定されていない場合は現在の日を設定
    if (day === null || isNaN(day)) {
      day = currentDay;
    }

    // 月が指定されていない場合は現在の月を設定
    if (month === null || isNaN(month)) {
      month = day < currentDay ? currentMonth + 1 : currentMonth;
    }

    // 年が指定されていない場合の処理
    if (year === null || isNaN(year)) {
      // 月が指定されていて、それが現在の月より若い場合は来年を設定
      year = month < currentMonth ? currentYear + 1 : currentYear;
    }

    // 日付オブジェクトを作成
    const date = new Date(year, month, day);
    if (date.toString() == 'Invalid Date') {
      return new Date();
    } else {
      return date;
    }
  } else {
    return new Date();
  }
}

// 挿入する場所を特定する関数
// 引数: srcMonth    = 入力するデータの月
//      srcAuthor   = 入力するデータの名前
//      targetSheet = 入力先シート
// 返り値: 挿入したい行番号(＊配列のキーではなくスプレッドシート上の行番号)
// 月の一致->名前の一致の順に見ていく
export function searchPosition(
  srcMonth: any,
  srcAuthor: any,
  targetSheet: GoogleAppsScript.Spreadsheet.Sheet,
): number {
  // 入力先シートが空じゃなければ
  if (targetSheet.getLastRow()) {
    // 移動先シートのデータ取得
    const targetRange = targetSheet.getRange(
      1,
      monthColumnPosition,
      targetSheet.getLastRow(),
      2,
    );
    const diffCheckData = targetRange.getValues();

    // 配列で扱えるキーに変換
    let monthIndex = monthColumnPosition - monthColumnPosition;
    let nameIndex = authorColumnPosition - monthColumnPosition;

    for (let i = 0; i < targetSheet.getLastRow(); i++) {
      if (
        typeof diffCheckData[i][monthIndex] == 'string' ||
        typeof diffCheckData[i][monthIndex] == 'number'
      ) {
        // もし月が空文字じゃなくて月が一致してなかったらその時点の行の一つ前の行番号を返す
        if (
          diffCheckData[i][monthIndex] != '' &&
          diffCheckData[i][monthIndex] != srcMonth
        ) {
          return i;
        }
        // もし月が一致していたら
        else if (diffCheckData[i][monthIndex] == srcMonth) {
          for (let j = i; j < targetSheet.getLastRow(); j++) {
            // もし名前一致してたらその時点の行番号を返す
            if (diffCheckData[j][nameIndex] == srcAuthor) {
              return j + 1;
            } else if (diffCheckData[j][monthIndex] != srcMonth) {
              return j + 1;
            }
          }
        }
      }
    }
    return topRowPosition;
  } else {
    return topRowPosition;
  }
}

// 設定している行の上限を超えないように行を挿入する関数
// 引数 : rowPos      = 挿入予定の行
//       targetSheet = 挿入先シート
// 返り値 : rowPos    = 補正後の行番号
export function insertRows(
  rowPos: number,
  targetSheet: GoogleAppsScript.Spreadsheet.Sheet,
  topRowPosition: number,
  insertRowsPosition: number,
): number {
  insertRowsPosition = Math.max(insertRowsPosition, 0);
  while (rowPos < topRowPosition) {
    targetSheet.insertRowBefore(insertRowsPosition);
    targetSheet
      .getRange(insertRowsPosition, 1, 1, targetSheet.getLastColumn())
      .setBackground('#ffffff');
    targetSheet
      .getRange(insertRowsPosition, 1, 1, targetSheet.getLastColumn())
      .clearDataValidations();
    rowPos += 1;
  }
  targetSheet.insertRowBefore(Math.max(1, rowPos));
  return rowPos;
}
