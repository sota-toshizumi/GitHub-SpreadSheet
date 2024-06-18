# Githubのissueをスプレッドシートに反映

### 概要
githubのwebhookを用いて、githubのissueが更新されたらスプレッドシートにリクエストを送信しスプレッドシート上に情報の追加,更新を行う。
### 実装機能
- 新規issue作成時にスプレッドシートにも同様の内容を追加する。 
- issueのラベル更新時に対応したスプレッドシート上の進捗状況も更新する。
- スプレッドシート上の進捗状況が[完了]になれば別途専用のシートに対象行を移動する。
### 実装内容
#### github側
githubのwebhookの登録を行う。

- settings-webhookにて設定を行う。
- スプレッドシート(GAS)デプロイ時に発行されるurlの登録。
#### spreadsheet側
スプレッドシート拡張機能Google Apps Script(GAS)でシート操作,httpリクエスト処理を行う。
下記のコードが前述した機能実装である。これらコードはgithub上で管理している。
```js
/* triggers.gs 
*  各種イベントの登録と定数の定義
* */

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
```

```js
/* insertIssue.gs
* issueの作成時に行追加
* */
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

    if (logToSheet && logToSheet[1] === '1' && rowPos != -1) {
        // 挿入する行が一番上だったら
        if(rowPos == 0){
            rowPos +=1;
            sheet.insertRowBefore(rowPos);
            sheet.getRange(rowPos,1,1,sheet.getLastRow()).setBackground("#ffffff");
        }
        // 新しい行を追加
        var trgRowHandle = sheet.getRange(rowPos,1);
        sheet.insertRowBefore(rowPos);
        // データ入力
        sheet.getRange(rowPos,idPosition).setValue(issue.id);
        sheet.getRange(rowPos,monthPosition).setValue(nowMonth);
        sheet.getRange(rowPos,namePosition).setValue(name);
        sheet.getRange(rowPos,statusPosition).setValue(status);
        sheet.getRange(rowPos,envPosition).setValue(enviornments[data.repository.name]);
        sheet.getRange(rowPos,titlePosition).setFormula('=HYPERLINK("' + url + '", "' + title + '")');

        // スタイル
        tmpRowHandle.copyTo(trgRowHandle,SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);
        tmpRowHandle.copyTo(trgRowHandle,SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,false);
        sheet.getRange(rowPos,monthPosition).setBackgrounds(color);
        sheet.getRange(rowPos,namePosition).setBackgrounds(color);
        sheet.getRange(rowPos,idPosition).setBackgrounds(color);
    }
}

// テンプレートから名前の変換と色の取得
function authorInfo(name){
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tmpSheetName);
    var range = sheet.getRange(1,tmp_gitIdPosition,sheet.getLastRow(),1);
    var value = range.getValues();

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
```

```js
/* updateStatus.gs
* ラベル更新時進捗状況更新
* */
// 進捗状況の更新　(github上のラベル更新)
function updateStatus(sheet,data){
    // issueIdの取得
    const issueId = data.issue.id;
    // 行を上から見ていく
    for(let i=1; i<=sheet.getLastRow(); i++){
        var range = sheet.getRange(i,idPosition);
        var id = range.getValue();
        // idが一致
        if(id === issueId){
            // 現在のステータスを取得
            var bStatus = sheet.getRange(i,statusPosition).getValue();
            // テンプレートにラベルに対応する情報があれば更新、なければ変更なし
            sheet.getRange(i,statusPosition).setValue(getLabel(data.label.name,bStatus));
            return 0;
        }
    }
    return 0;
}

// unLabelのリクエスト
function unLabel(sheet,data){
    // issueのid取得
    const issueId = data.issue.id;

    for(let i=1; i<=sheet.getLastRow(); i++){
        var range = sheet.getRange(i,idPosition);
        var id = range.getValue();
        if(id === issueId){
            var status = '未着手';
            for(var key in data.issue.labels){
                status = getLabel(data.issue.labels[key].name,status);
            }
            sheet.getRange(i,statusPosition).setValue(status);
            return 0;
        }
    }
    return 0;
}

// テンプレートの中にlabelのキーがあればその値を返す
// なければそのまま返す
function getLabel(label,bLabel){
    if(label in labels){
        return labels[label];
    }
    return bLabel;
}
```

```js
/* moveRow.gs
* 進捗状況が完了の時シート移動
* */

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
                var srcMonth = value[i][monthPosition-1];
                var srcName = value[i][namePosition-1];

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
function searchPosition(srcMonth,srcAuthor,targetSheet){
    // 移動先シートのデータ取得
    var targetRange = targetSheet.getRange(1,monthPosition,targetSheet.getLastRow(),2);
    var diffCheckData = targetRange.getValues();

    let mP = monthPosition-monthPosition;
    let nP = namePosition-monthPosition;

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
```

