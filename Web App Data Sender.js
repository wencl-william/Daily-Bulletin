function doGet() {

  //re-enable once access is given
  if(!GroupsApp.getGroupByEmail("CPS-All-Staff@isd391.org").hasUser(Session.getActiveUser())){
     return HtmlService.createHtmlOutputFromFile("DenyAccess")
  }

  
  var bulletinPageT = HtmlService.createTemplateFromFile('DailyBulletin');
  
  //**************************//re-enable once access is given
  bulletinPageT.IsMod = GroupsApp.getGroupByEmail("DailyBulletin-Group@isd391.org").hasUser(Session.getActiveUser());

  return bulletinPageT.evaluate();
}

function getJsonData(fetchDateText){
  return getJsonDataPrivate_(fetchDateText)
}

function getJsonDataPrivate_(fetchDateText) { 
  var today = new Date();
  today.setHours(0,0,0,0);
  today = today.getTime();
  var oneWeek = today + 7*24*60*60*1000;
  var yesterday = today - 24*60*60*1000;

  /****************************************************************************************************** */
  const fetchDateVal = Date.parse(fetchDateText);


  if(fetchDateVal > oneWeek){
    return getBulletinData_(fetchDateText);
  }
  else if(fetchDateVal < yesterday){
    return getArchivedBulletinData_(fetchDateText);
  }
  else{
    return getCachedDate_(fetchDateVal)
  }
}

function getCachedDate_(dateVal){
  try{return Utilities.jsonParse(ScriptProperties.getProperty(dateVal))}
  catch(e){return {staffOut:"No Bulletin Found, Try Another Date", birthday:"No Bulletin Found, Try Another Date", announcement:"No Bulletin Found, Try Another Date"} }  

}




function getArchivedBulletinData_(dateStr){
  let data = getRowFromSheet_(dateStr, "Archived_Bulletins");
  try{
    let announcementString = data.announcement;

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

    data.announcement = newString;
  }
  catch(e){
    console.log(e);
  }

  return data;
}

function getBulletinData_(dateStr){
  let data = getRowFromSheet_(dateStr, "Bulletin_Data");
  try{
    let announcementString = data.announcement;

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

    data.announcement = newString;
  }
  catch(e){
    console.log(e);
  }
  return data;
}

function requireCalAppForPermissions_(){
  CalendarApp.getEventsForDay(new Date());
}

function getRowFromSheet_(dateStr, sheetName){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName); 
  var column = 1; //column Index   
  var columnValues = sheet.getRange(3, column, sheet.getLastRow(),1).getDisplayValues(); //1st & 2nd rows are header
  for(var i=0; i< columnValues.length; i++){
    if(columnValues[i][0] == dateStr){
        var values = sheet.getRange(i + 3, 1,1,4).getDisplayValues();
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

        return rowData;

    }
  }
  
  return {date:dateStr, staffOut:"No Bulletin Found, Try Another Date", birthday:"No Bulletin Found, Try Another Date", announcement:"No Bulletin Found, Try Another Date"}   
}

//  function test345t(){

//    var dateStr = "9/6/2022"
    
//    console.log(getBulletinData_(dateStr));
//  }
