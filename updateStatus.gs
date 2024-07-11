// 進捗状況の更新　(github上のラベル更新)
function updateProgressLabel(sheet,data){
  // issueIdの取得
  const issueId = data.issue.id;
  // 行を上から見ていく
  for(let i=1; i<=sheet.getLastRow(); i++){
    var range = sheet.getRange(i,idColumnPosition);
    var id    = range.getValue();
    // idが一致
    if(id === issueId){
      // 現在のステータスを取得
      var bStatus = sheet.getRange(i,progressLabelColumnPosition).getValue();
      // テンプレートにラベルに対応する情報があれば更新、なければ変更なし
      sheet.getRange(i,progressLabelColumnPosition).setValue(getLabel(data.label.name,bStatus));
      return 0;
    }
  }
  return 0;
}

// unLabelのリクエスト
function unLabel(sheet,data){
  // issueのid取得
  const issueId = data.issue.id;

  // シートを上からissueIdが一致するか確認する
  for(let i=1; i<=sheet.getLastRow(); i++){
    var range = sheet.getRange(i,idColumnPosition);
    var id    = range.getValue();
    // idが一致すれば一番最近つけられたラベルに対応する進捗状況に更新する。なければ"未着手"
    if(id === issueId){  
      var status = '未着手';
      for(var key in data.issue.progressLabels){
        status = getLabel(data.issue.progressLabels[key].name,status);
      }
      sheet.getRange(i,progressLabelColumnPosition).setValue(status);
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

