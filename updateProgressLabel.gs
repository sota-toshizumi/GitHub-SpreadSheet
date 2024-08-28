// 進捗状況の更新　(github上のラベル更新)
function updateProgressLabel(sheet,data){
  const uniqueId = new UniqueId(data.repository.id, data.issue.id);

  // 行を上から見ていく
  for(let i=1; i<=sheet.getLastRow(); i++){
    var range = sheet.getRange(i,idColumnPosition);

    const currentRowUniqueId = UniqueId.from(range.getValue());
    if (currentRowUniqueId === null)
      continue; // 手動で作られた課題の行の可能性が高い

    // idが一致
    if(uniqueId.isSame(currentRowUniqueId)){
      // 現在のステータスを取得
      var bStatus = sheet.getRange(i,progressLabelColumnPosition).getValue();
      // テンプレートにラベルに対応する情報があれば更新、なければ変更なし
      sheet.getRange(i,progressLabelColumnPosition).setValue(getProgressLabel(data.label.name,bStatus));
      return 0;
    }
  }
  return 0;
}

// unLabelのリクエスト
function removeProgressLabel(sheet,data){
  const uniqueId = new UniqueId(data.repository.id, data.issue.id);

  // シートを上からissueIdが一致するか確認する
  for(let i=1; i<=sheet.getLastRow(); i++){
    var range = sheet.getRange(i,idColumnPosition);

    const currentRowUniqueId = UniqueId.from(range.getValue());
    if (currentRowUniqueId === null)
      continue; // 手動で作られた課題の行の可能性が高い

    // idが一致すれば一番最近つけられたラベルに対応する進捗状況に更新する。なければ"未着手"
    if(uniqueId.isSame(currentRowUniqueId)){ 
      var progressLabel = initialProgressLabel;
      for(var key in data.issue.labels){
        progressLabel = getProgressLabel(data.issue.labels[key].name, progressLabel);
      }
      sheet.getRange(i,progressLabelColumnPosition).setValue(progressLabel);
      break;
    }
  }
}

// 進捗テンプレートの中にlabelと同一のキーがあるかチェック
// 引数 :  label = 検索したいlabel名
//.       blabel = テンプレートに存在しなかった場合のlabel
// 返り値: progressLabels[label] = テンプレートに対応した進捗情報
//        blabel = テンプレートに存在しなかった場合のlabel
function getProgressLabel(label,bLabel){
  if(label in progressLabels){
    return progressLabels[label];
  }
  return bLabel;
}
