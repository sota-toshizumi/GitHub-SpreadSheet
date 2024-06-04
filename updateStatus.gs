function updateStatus(sheet,data){
  const issueId = data.issue.id;

  for(let i=1; i<=sheet.getLastRow(); i++){
    var range = sheet.getRange(i,idPosition);
    var id = range.getValue();
    if(id === issueId){
      var bStatus = sheet.getRange(i,1).getValue();
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


function getLabel(label,bLabel){
  if(label in labels){
    return labels[label];
  }
  return bLabel;
}

