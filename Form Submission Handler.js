const Daily_Bulletin_AddEditDelete_FormId = "1cC0fHhidsm-5FchOQrHHt6o0Y6tJ79QFcPh0PqiveUQ";
const Emails = "DailyBulletin-Group@isd391.org";

// function testingDebug(){
//   var form = FormApp.openById(Daily_Bulletin_AddEditDelete_FormId);
//   var formResponses = form.getResponses();
//   var formResponse = formResponses[formResponses.length-1];

//   Logger.log(formResponse.getRespondentEmail())

//   Logger.log("continue");
//   const Items = getQuestionItems_();

//   Logger.log(autoAddAnnouncement_(formResponse, Items));
// }

function onSubmit(sheetResponse) {
  const Items = getQuestionItems_();
  var formResponse = getFormAppResponse_(sheetResponse);
  
  if(formResponse != null){
    var action = formResponse.getResponseForItem(Items.actionQuestion).getResponse();
    if(action == "Add a new ANNOUNCEMENT."){
      if(autoAddAnnouncement_(formResponse, Items) == "sucess"){
        return
      }
      else{  
        sendEmailofResponse_(sheetResponse);
        return
      }
    }
  }

  sendEmailofResponse_(sheetResponse);
  return 1
}

function getQuestionItems_(){
  thisForm = FormApp.openById(Daily_Bulletin_AddEditDelete_FormId);
  return{
          actionQuestion:thisForm.getItemById("1563184588"),
          announcement:thisForm.getItemById("748172995"),
          multipleDays:thisForm.getItemById("1043846175"),
          singleDate:thisForm.getItemById("2013911231"),
          startDate:thisForm.getItemById("2135405645"),
          lastDate:thisForm.getItemById("228187413")
        }
}

function sendEmailofResponse_(sheetResponse){
  sheetResponse = trimObject_(sheetResponse.namedValues);
  Logger.log(JSON.stringify(sheetResponse,null,4));

  var emailSubject = "Daily Bulletin Form: Add/Edit/Delete";
  if(sheetResponse["What would you like to do?"] == "Add a new ANNOUNCEMENT."){
    emailSubject = "Daily Bulletin Form: Add Announcement";
  }
  else if(sheetResponse["What would you like to do?"] == "Change or remove an existing ANNOUNCEMENT."){
    emailSubject = "Daily Bulletin Form: Change/Delete Announcement";
  }
  else if(sheetResponse["What would you like to do?"] == "Add, change, or remove an UPCOMING EVENT."){
    emailSubject = "Daily Bulletin Form: Add/Change/Delete Event";
  }

  var emailBody = sheetResponse["Email Address"] + ' submitted a response to the "Daily Bulletin Add/Edit/Delete" google form at ' 
                  + sheetResponse["Timestamp"] +" and it was not able to be processed automatically. The questions and their responses are listed below: <br><br>" + toString_(sheetResponse);

  Logger.log(emailBody);

  //GmailApp.sendEmail(Emails,emailSubject,emailBody);
  MailApp.sendEmail({to:Emails, subject:emailSubject, htmlBody: emailBody});

}

function autoAddAnnouncement_(formResponse, Items){
  try{
    var Status = "";

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var upcoming_sheet = ss.getSheetByName("Bulletin_Data");
    var bulletin ={bulletins:upcoming_sheet.getRange("A3:D300").getDisplayValues(), bulletinLen:0, sucess:true}
    for(var i =0 ; i <bulletin.bulletins.length; i++){
      if(bulletin.bulletins[i][0] != ""){
        bulletin.bulletins[i][0] = Date.parse(bulletin.bulletins[i][0]);
        bulletin.bulletinLen++;
      }
    }

    var announcement = formResponse.getResponseForItem(Items.announcement).getResponse();

    try{Logger.log(formResponse.getRespondentEmail())}catch(e){};
    
    var multiple = formResponse.getResponseForItem(Items.multipleDays).getResponse();
    if(multiple == 'No'){
      Logger.log("Single Day");
      bulletin = addToDate_(announcement, toDateVal_(formResponse.getResponseForItem(Items.singleDate).getResponse()), bulletin)
      if(bulletin.sucess){
        Status = "sucess";
        Logger.log("sucess 78")
      }
      else{
        Status = "failure";
        Logger.log("failure 81")
      }
    }
    else{
      Logger.log("Multiple Days");
      var startDate = new Date(toDateVal_(formResponse.getResponseForItem(Items.startDate).getResponse()));
      var lastDate = new Date(toDateVal_(formResponse.getResponseForItem(Items.lastDate).getResponse()));

      if(startDate.getTime() > lastDate.getTime()){
        Status = "failure";
        Logger.log("failure 90")
      }
      else{
        var resultList = [];
        var currentDate = startDate;

        while (currentDate.getTime() <= lastDate.getTime()){
          bulletin = addToDate_(announcement, currentDate.getTime() , bulletin);
          if(bulletin.sucess){
            resultList.push("sucess");
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        if(resultList.indexOf("sucess")==-1){
          Status = "failure";
          //Logger.log("failure 105")
          Logger.log("print 105");
        }
        else{
          Status = "sucess";
          //Logger.log("sucess 108")
          Logger.log("print 108");
        }
      }
    }

    //Logger.log(bulletin.bulletins);
    if(Status == "sucess"){
      var announcementDataColumn = [];
      for(var i=0; i<bulletin.bulletins.length; i++){
        announcementDataColumn.push([bulletin.bulletins[i][3]])
      }
      //Logger.log(announcementDataColumn)
      upcoming_sheet.getRange("D3:D300").setValues(announcementDataColumn);
    }
    cacheWeek();
    return Status
  }catch(e){
    console.warn(e);
    return "failure"
  }
}


function toDateVal_(dateStr){//format in "2021-10-01"
  return Date.parse(dateStr.slice(5) + "-" + dateStr.slice(0,4))
}

function addToDate_(announcement, dateVal, bulletin){
  Logger.log(dateVal);
  Logger.log(new Date(dateVal));

  var bulletinRowIndex = searchingMatchForm_(bulletin.bulletins,0,bulletin.bulletinLen-1, dateVal);

  Logger.log("bulletinRowIndex: "+ bulletinRowIndex);
  if(bulletinRowIndex == -1){
    bulletin.sucess = false;
    return bulletin;
  }
  else{
    bulletin.bulletins[bulletinRowIndex][3] = (bulletin.bulletins[bulletinRowIndex][3] +"\n\n"+ announcement).trim();
    bulletin.sucess = true;
    return bulletin;
  }
}

function searchingMatchForm_(array, start, end, val){
  if(start > end){
    return -1 //not found
  }

  var middle = Math.floor((start + end)/2);
  //Logger.log("Length: "+array.length+"\nStart: "+start+"\nEnd: "+end+"\nMiddle: "+middle+"\nval: "+val+"\nMiddle Val: "+array[middle]);

  if(val < array[middle][0]){
    return searchingMatchForm_(array, start, middle - 1, val);
  }
  else if (array[middle][0] < val){
    return searchingMatchForm_(array, middle + 1, end, val);
  }
  else{
    return middle;
  }
}

function toString_(obj){
  const order = ["What would you like to do?",
                 "Enter the announcement EXACTLY as you want it to appear in the daily bulletin",
                 "Should the announcement appear on multiple days?",
                 "What day should it be in the Daily Bulletin?",
                 "What day should it start appearing in the daily bulletin?",
                 "What day is the last day it should appear in the daily bulletin?",
                 "What is the announcement that you would like to change or remove? Please copy the text straight from the daily bulletin.",
                 "On what date does it first appear?",
                 "Does it appear on multiple daily bulletins?",
                 "Would you like to remove it or change it?",
                 "If you answered change it, what would you like to change it too?",
                 "Would you like to add, remove, or edit the event?",
                 "Which calendar should the event be on?",
                 "What is the event title?",
                 "When does the event start?",
                 "When does the event end?",
                 "Optional: If you are editing the event, what change would you like to make?",
                 "Enter any relevant information needed",
                ]

  
  delete obj["Email Address"];
  delete obj["Timestamp"];
    
  var string = "";
  for(var i =0; i<order.length;i++){
    if(obj[order[i]] != null){
      string += "    <b>" + order[i] + ":</b>   " + obj[order[i]] + "<br>";
      delete obj[order[i]];
    }
  }

  var keys = Object.keys(obj);
  for(var i = 0; i<keys.length; i++){
    if(obj[order[i]] != null){
      string += "    <b>" + order[i] + ":</b>   " + obj[order[i]] + "<br>";
      delete obj[order[i]];
    }
  }
  return string
}

function trimObject_(obj){
  var keys = Object.keys(obj);
  for(var i = 0; i<keys.length; i++){
    if(obj[keys[i]][0] == ""){
      delete obj[keys[i]];
    }
    else{
      obj[keys[i]] = obj[keys[i]][0];
    }
  }
  return obj
}

/**
 * Gets the FormApp Response for the google sheet response
 */
function getFormAppResponse_(sheetResponse){
  var sheetTimeStampStr = sheetResponse.namedValues.Timestamp[0];
  Logger.log(sheetTimeStampStr);
  var sheetTSlist = sheetTimeStampStr.match(/(?<Month>[\d]?\d)[/](?<date>[\d]?\d)[/](?<year>\d\d\d\d)/i)
  //sheetTSlist is formatted as [9/30/2021, 9, 30, 2021] for string "9/30/2021 23:10:56"

  if(isDuringDaylightSavings_(sheetTSlist[3],sheetTSlist[1],sheetTSlist[2])){
    sheetTimeStampStr += " GMT-05:00";
  } else{
    sheetTimeStampStr += " GMT-06:00";
  }

  var form = FormApp.openById(Daily_Bulletin_AddEditDelete_FormId);
  var formResponses = form.getResponses();

  var sameTime = Math.abs(formResponses[formResponses.length-1].getTimestamp().getTime()- Date.parse(sheetTimeStampStr)) < 2000;
  var sameEmail = formResponses[formResponses.length-1].getRespondentEmail() == sheetResponse.namedValues['Email Address'][0];;
  if(sameTime && sameEmail){
    return formResponses[formResponses.length-1];
  }
  
  return null
}

/**
 * Checks whether a given date occurs within Daylight Savings time
 * @param year The year(yyyy) of the day to check
 * @param month The month(01-12) of the day to check
 * @param day The date(1-31) of the day to check
 */
function isDuringDaylightSavings_(year, month, day){
  return isDateInRange_(year, month, day, getDaylightSavingsStart_(year), getDaylightSavingsEnd_(year));
}

/**
 * Checks if a supplied day is within a given range
 * @param year The year(yyyy) of the day to check
 * @param month The month(01-12) of the day to check
 * @param day The date(1-31) of the day to check
 * @param startRange The date object for the start of the range
 * @param endRange The date object for the end of the range
 * @return true if the supplied date is within the given range, false otherwise
 */
function isDateInRange_(year, month, day, startRange, endRange){
  var temp = new Date(year, month-1, day);

  if(temp.getTime() >= startRange.getTime() && temp.getTime() < endRange.getTime()){
    return true;
  }
  else{
    return false;
  }
}

/**
 * Calculates the start date for daylight savings time in a given year
 * @param year the year to find the date for
 * @return the date obeject for the day daylight savings starts
 */
function getDaylightSavingsStart_(year){
  var dsStart = new Date(year, 02, 01);
  var sundays = 0;
  var done = false;

  while(!done){
    if(dsStart.getDay() == 0){
      sundays++;
      if(sundays == 2){
        done = true;
      }
      else{
        dsStart.setDate(dsStart.getDate()+1);
      }
    }
    else{
      dsStart.setDate(dsStart.getDate()+1);
    } 
  }

  return dsStart;
}

/**
 * Calculates the end date for daylight savings time in a given year
 * @param year the year to find the date for
 * @return the date obeject for the day daylight savings ends
 */
function getDaylightSavingsEnd_(year){
  dsEnd = new Date(year, 10, 01);

  while(dsEnd.getDay() != 0){
    dsEnd.setDate(dsEnd.getDay()+1);
  }

  return dsEnd;
}

// function helperGetQuestionIDS(){
//   ThisForm = FormApp.openById(Daily_Bulletin_AddEditDelete_FormId);
//   var questions = ThisForm.getItems();
//   for(var i =0; i< questions.length; i++){
//     var item = questions[i];
//     Logger.log("Title: "+ item.getTitle()+" ID: "+item.getId());
//   }
// }








