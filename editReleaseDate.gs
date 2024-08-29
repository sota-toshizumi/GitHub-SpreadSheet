function editReleaseDate(srcSheet, data){
  // コメントからログ記録の選択を抽出
  var logToSheet = /<!--\s*スプレッドシートに記録するかどうか（\s*y\s*,\s*n\s*）:\s*\[\s*(.)\s*]\s*-->/.exec(data.issue.body);

  // スプレッドシート挿入処理
  if (logToSheet && (logToSheet[1] === 'y' || logToSheet[1] === 'Y')){
    const uniqueId = new UniqueId(data.repository.id, data.issue.id);
    
    // 行を上から見ていく
    for(let i=1; i<=srcSheet.getLastRow(); i++){
      var range = srcSheet.getRange(i,idColumnPosition);

      const currentRowUniqueId = UniqueId.from(range.getValue());
      if (currentRowUniqueId === null)
        continue; // 手動で作られた課題の行の可能性が高い

      // idが一致
      if(uniqueId.isSame(currentRowUniqueId)){
        // 現在の完了予定日を追加
        var bDate = srcSheet.getRange(i,releaseDateColumnPosition).getValue();
        var releaseDate = getDueDate(data.issue.body);
        srcSheet.getRange(i,releaseDateColumnPosition).setValue(releaseDate);
        return 0;
      }
    }
  }
  return 0;
}
