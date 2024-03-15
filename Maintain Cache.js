/**
 * This file maintains a cache of the daily bulletins for the next 
 * 5 days as well as the bulletin for the current day and the previous 
 * day. These bulletins are used the most and by caching them it speeds 
 * loading the bulletin. The cache updates every night between 4am and
 * 5am and anytime a change is made to the spreadsheet. It preps the 
 * data for each bulletin and stores it as a script property with the 
 * date as its key.
 */

function onEdit(){
  cacheWeek();
}
function cacheWeek() {
  var Cache = {};
  /* Previous Day */
  var values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Archived_Bulletins").getRange(3,1,1,7).getDisplayValues();
  var rowData = {date:values[0][0], staffOut:values[0][1], birthday:values[0][2], announcement:values[0][3], status:values[0][4], fixed:false, maintenance:false}
  if(rowData.staffOut == ""){
    rowData.staffOut = "No Staff Out Today";
  }
  else{
    rowData.staffOut = formatStaffOut(rowData.staffOut)
  }

  if(rowData.birthday == ""){
    rowData.birthday = "No Birthdays Today";
  }else{
    rowData.birthday = "<p>" + rowData.birthday;
    rowData.birthday= rowData.birthday.replaceAll("\n\n", "</p><p>");
    rowData.birthday +="</p>"
  }

  if(rowData.announcement == ""){
    rowData.announcement = "No Anouncements Today"
  }
  else{
    try{
      let announcementString = rowData.announcement;

      let http = announcementString.search("https://");
      let newString = "";

      while(http != -1){
        newString += announcementString.slice(0,http);
        announcementString = announcementString.slice(http, announcementString.length);

        newString += '<a href="';
        let space = announcementString.search(/\s/);
        if(space == -1){
          newString = newString + announcementString + '" target="_blank">'+ announcementString + '</a>';
          announcementString = "";
        }
        else{
          let url = announcementString.slice(0,space);
          announcementString = announcementString.slice(space, announcementString.length);

          newString += url + '" target="_blank">'+ url + '</a>';
        }

        http = announcementString.search("https://");
      }
      newString += announcementString;

      rowData.announcement = newString;
    }
    catch(e){
      console.log(e);
    }

  }

  if(rowData.status == ""){
    if(values[0][6] != "" && values[0][5] != ""){
      rowData.maintenance = true;
      rowData.status = values[0][6]+ " <br><br>"+values[0][5];
    }
    else if(values[0][6] != ""){
      rowData.maintenance = true;
      rowData.status = values[0][6];
    }
    else if(values[0][5] != ""){
      rowData.fixed = true;
      rowData.status = values[0][5];
    }
  }
  else{
    if(values[0][6] != ""){
      rowData.status += " <br><br>"+values[0][6];
    }
    if(values[0][5] != ""){
      rowData.status += " <br><br>"+values[0][5];
    }
  }

  let http = rowData.status.search("https://");
  let newString = "";

  while(http != -1){
    newString += rowData.status.slice(0,http);
    rowData.status = rowData.status.slice(http, rowData.status.length);

    newString += '<a href="';
    let space = rowData.status.search(/\s/);
    if(space == -1){
      newString = newString + rowData.status + '" target="_blank">Learn more.</a>';
      rowData.status = "";
    }
    else{
      let url = rowData.status.slice(0,space);
      rowData.status = rowData.status.slice(space, rowData.status.length);

      newString += url + '" target="_blank">Learn more.</a>';
    }

    http = rowData.status.search("https://");
  }
  newString += rowData.status;

  rowData.status = newString;

  Cache[Date.parse(rowData.date)] = JSON.stringify(rowData);
  
  /* Next 7 days */
  var values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bulletin_Data").getRange(3,1,6,7).getDisplayValues();
  for(var i=0; i<values.length; i++){
    var rowData = {date:values[i][0], staffOut:values[i][1], birthday:values[i][2], announcement:values[i][3], status:values[i][4], fixed:false, maintenance:false}
    if(rowData.staffOut == ""){
      rowData.staffOut = "No Staff Out Today";
    }
    else{
      rowData.staffOut = formatStaffOut(rowData.staffOut)
    }

    if(rowData.birthday == ""){
      rowData.birthday = "No Birthdays Today";
    }else{
      rowData.birthday = "<p>" + rowData.birthday;
      rowData.birthday= rowData.birthday.replaceAll("\n\n", "</p><p>");
      rowData.birthday +="</p>"
    }

    if(rowData.announcement == ""){
      rowData.announcement = "No Anouncements Today"
    }
    else{
      try{
        let announcementString = rowData.announcement;

        let http = announcementString.search("https://");
        let newString = "";

        while(http != -1){
          newString += announcementString.slice(0,http);
          announcementString = announcementString.slice(http, announcementString.length);

          newString += '<a href="';
          let space = announcementString.search(/\s/);
          if(space == -1){
            newString = newString + announcementString + '" target="_blank">'+ announcementString + '</a>';
            announcementString = "";
          }
          else{
            let url = announcementString.slice(0,space);
            announcementString = announcementString.slice(space, announcementString.length);

            newString += url + '" target="_blank">'+ url + '</a>';
          }

          http = announcementString.search("https://");
        }
        newString += announcementString;

        rowData.announcement = newString;
      }
      catch(e){
        console.log(e);
      }

    }

   if(rowData.status == ""){
    if(values[i][6] != "" && values[i][5] != ""){
      rowData.maintenance = true;
      rowData.status = values[i][6]+ " <br><br>"+values[i][5];
    }
    else if(values[i][6] != ""){
      rowData.maintenance = true;
      rowData.status = values[i][6];
    }
    else if(values[i][5] != ""){
      rowData.fixed = true;
      rowData.status = values[i][5];
    }
  }
  else{
    if(values[0][6] != ""){
      rowData.status += " <br><br>"+values[i][6];
    }
    if(values[0][5] != ""){
      rowData.status += " <br><br>"+values[i][5];
    }
  }


    http = rowData.status.search("https://");
    newString = "";

    while(http != -1){
      newString += rowData.status.slice(0,http);
      rowData.status = rowData.status.slice(http, rowData.status.length);

      newString += '<a href="';
      let space = rowData.status.search(/\s/);
      if(space == -1){
        newString = newString + rowData.status + '" target="_blank">Learn more</a>';
        rowData.status = "";
      }
      else{
        let url = rowData.status.slice(0,space);
        rowData.status = rowData.status.slice(space, rowData.status.length);

        newString += url + '" target="_blank">Learn more</a>';
      }

      http = rowData.status.search("https://");
    }
    newString += rowData.status;

    rowData.status = newString;

    Cache[Date.parse(rowData.date)] = JSON.stringify(rowData);
  }
  
  PropertiesService.getScriptProperties().deleteAllProperties()
  PropertiesService.getScriptProperties().setProperties(Cache)
}