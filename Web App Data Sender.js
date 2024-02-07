/**
 * This file contains main functions for the web app deployment. It 
 * includes the function that serves the html pages as well as the 
 * function the retrieves bulletin data for the requested day. 
 */


/**
 * This function is the default function to handle a get request for 
 * a web app. As our site is only serving data to users, it only needs 
 * to handle get requests. First it checks if the user is a part of the 
 * cps-staff@isd391.org email group. If the user is not, it returns the 
 * DenyAccess.html file. This is just an extra layer of security incase 
 * someone got ahold of the direct link, as the Google Site also 
 * requires you to be signed in as a member of the group. If the user is 
 * a member of the staff group, it checks if they are also a member of 
 * the DailyBulletin-Group@isd391.org group. This determines whether it
 * fills in the Edit Spreadsheet Data button before it sends the 
 * DailyBulletin.html file to the user. 
 */
function doGet() {

  //re-enable once access is given
  if(!GroupsApp.getGroupByEmail("CPS-All-Staff@isd391.org").hasUser(Session.getActiveUser())){
     return HtmlService.createHtmlOutputFromFile("DenyAccess") //Show the access denied page to users not part of the all staff group
  }

  
  var bulletinPageT = HtmlService.createTemplateFromFile('DailyBulletin');
  
  //**************************//re-enable once access is given
  bulletinPageT.IsMod = GroupsApp.getGroupByEmail("DailyBulletin-Group@isd391.org").hasUser(Session.getActiveUser());
  if(bulletinPageT.IsMod){
    bulletinPageT.HasClassListAuth = true;
    bulletinPageT.HasMailingListAuth = true;
  }
  else{
    bulletinPageT.HasClassListAuth = ClassLists.isAuthorizedUser();
    bulletinPageT.HasMailingListAuth = MailingLists.isAuthorizedUser();
  }

  return bulletinPageT.evaluate();
}


function getJsonData(fetchDateText){
  return getJsonDataPrivate_(fetchDateText)
}

/**
 * This function directs bulletin requests to the cache, archive, or upcoming bulletins
 */
function getJsonDataPrivate_(fetchDateText) { 
  var today = new Date();
  today.setHours(0,0,0,0);
  today = today.getTime();
  var oneWeek = today + 7*24*60*60*1000; //Time values in milliseconds
  var yesterday = today - 24*60*60*1000; //Time values in milliseconds 

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
  try{return JSON.parse(PropertiesService.getScriptProperties().getProperty(dateVal))}
  catch(e){return {staffOut:"No Bulletin Found, Try Another Date", birthday:"No Bulletin Found, Try Another Date", announcement:"No Bulletin Found, Try Another Date", status:""} }  

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
        var values = sheet.getRange(i + 3, 1,1,7).getDisplayValues();
        var rowData = {date:values[0][0], staffOut:values[0][1], birthday:values[0][2], announcement:values[0][3], status:values[0][4], fixed:false, maintenace:false}

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
            newString = newString + rowData.status + '" target="_blank">Learn more</a>';
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

        return rowData;

    }
  }
  
  return {date:dateStr, staffOut:"No Bulletin Found, Try Another Date", birthday:"No Bulletin Found, Try Another Date", announcement:"No Bulletin Found, Try Another Date", status:""}   
}

//  function test345t(){

//    var dateStr = "9/6/2022"
    
//    console.log(getBulletinData_(dateStr));
//  }
