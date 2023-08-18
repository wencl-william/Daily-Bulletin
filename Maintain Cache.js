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
  var values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Archived_Bulletins").getRange(3,1,1,4).getDisplayValues();
  var rowData = {date:values[0][0], staffOut:values[0][1], birthday:values[0][2], announcement:values[0][3]}
  if(rowData.staffOut == ""){
    rowData.staffOut = "No Staff Out Today";
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

  Cache[Date.parse(rowData.date)] = Utilities.jsonStringify(rowData);
  
  /* Next 7 days */
  var values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bulletin_Data").getRange(3,1,6,4).getDisplayValues();
  for(var i=0; i<values.length; i++){
    var rowData = {date:values[i][0], staffOut:values[i][1], birthday:values[i][2], announcement:values[i][3]}
    if(rowData.staffOut == ""){
      rowData.staffOut = "No Staff Out Today";
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

    Cache[Date.parse(rowData.date)] = Utilities.jsonStringify(rowData);
  }
  
  ScriptProperties.deleteAllProperties()
  ScriptProperties.setProperties(Cache)
}