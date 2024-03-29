/**
 * This handles submissions to the Announcement & Event Form (Also 
 * referred to as the Daily Bulletin Add/Edit/Delete Form). The code 
 * tries to automatically create announcements with the autoAddAnnouncement_
 * function and calls the handleCalendarAddition_ function defined in 
 * Calendar Approval Handler.gs to try to add calendar events. If the 
 * request is for anything other than adding an announcement or adding an 
 * event, or if the automatic processes fail, an email is formed and sent 
 * to the DailyBulletin-Group@isd391.org email group. This email contains 
 * all the information needed to fulfill the requests. 
 */


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

/**
 * Process the form submission and direct the request through the 
 * proper functions and automations. 
 */
function onSubmit(sheetResponse) {
  const Items = getQuestionItems_();
  var formResponse = getFormAppResponse_(sheetResponse);
  
  if(formResponse != null){
    //Gets the respose to the "What would you like to do?" question
    var action = formResponse.getResponseForItem(Items.actionQuestion).getResponse(); 

    if(action == "Add a new ANNOUNCEMENT."){
      if(autoAddAnnouncement_(formResponse, Items) == "success"){
        return
      }
      else{  
        sendEmailofResponse_(sheetResponse);
        return
      }
    }
    else if(action == "Add, change, or remove an UPCOMING EVENT."){
      let alsoAddAnnouncement = formResponse.getResponseForItem(Items.alsoAddAnnouncement).getResponse();
      if(alsoAddAnnouncement == "Yes"){
        if(autoAddAnnouncement_(formResponse, Items) != "success"){ 
          sendEmailofResponse_(sheetResponse);
        }
      }

      let eventAction = formResponse.getResponseForItem(Items.eventAction).getResponse();
      if(eventAction == "Add"){
        if(handleCalendarAddition_(formResponse, Items) == "success"){
          return
        }
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
          lastDate:thisForm.getItemById("228187413"),
          alsoAddAnnouncement:thisForm.getItemById("761102068"),
          eventAction:thisForm.getItemById("434864585"),
          eventCalendar:thisForm.getItemById("1296892701"),
          eventTitle:thisForm.getItemById("252394138"),
          eventStart:thisForm.getItemById("458566727"),
          eventEnd:thisForm.getItemById("1625141392"),
          eventExtra:thisForm.getItemById("1232852418")
        }
}

/**
 * Formats the subject line of the email, calls a function to generate
 * the body, and then send the email.
 */
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
    emailSubject = "Daily Bulletin Form: Change or Delete Event";
  }

  var emailBody = sheetResponse["Email Address"] + ' submitted a response to the "Daily Bulletin Add/Edit/Delete" google form at ' 
                  + sheetResponse["Timestamp"] +" and it was not able to be processed automatically. The questions and their responses are listed below: <br><br>" + toString_(sheetResponse);

  Logger.log(emailBody);

  //GmailApp.sendEmail(Emails,emailSubject,emailBody);
  MailApp.sendEmail({to:Emails, subject:emailSubject, htmlBody: emailBody});

}

/**
 * This function takes in a form response and loads the data for all future 
 * bulletins. It checks whether the announcement is for a single day or 
 * multiple days and adds the announcement to all the days its supposed to 
 * be on. Then it writes that data back to the spreadsheet. 
 */
function autoAddAnnouncement_(formResponse, Items){
  try{
    var Status = "";

    //Retrieves the data from the Bulletin_Data sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var upcoming_sheet = ss.getSheetByName("Bulletin_Data");
    var bulletin ={bulletins:upcoming_sheet.getRange("A3:D300").getDisplayValues(), bulletinLen:0, success:true}
    //Filters out empty rows, then converts the text date to a date object
    for(var i =0 ; i <bulletin.bulletins.length; i++){
      if(bulletin.bulletins[i][0] != ""){
        bulletin.bulletins[i][0] = Date.parse(bulletin.bulletins[i][0]);
        bulletin.bulletinLen++;
      }
    }

    //retrieves the announcement that was submitted through the form 
    var announcement = formResponse.getResponseForItem(Items.announcement).getResponse();

    try{Logger.log(formResponse.getRespondentEmail())}catch(e){};
    
    //gets the response to the "Should the announcement appear on multiple days?" question
    var multiple = formResponse.getResponseForItem(Items.multipleDays).getResponse();
    if(multiple == 'No'){
      Logger.log("Single Day");
      //Adds the announcement to the bulletin data for a single day 
      bulletin = addToDate_(announcement, toDateVal_(formResponse.getResponseForItem(Items.singleDate).getResponse()), bulletin)
      if(bulletin.success){
        Status = "success";
      }
      else{
        Status = "failure";
      }
    }
    else{
      Logger.log("Multiple Days");
      var startDate = new Date(toDateVal_(formResponse.getResponseForItem(Items.startDate).getResponse()));
      var lastDate = new Date(toDateVal_(formResponse.getResponseForItem(Items.lastDate).getResponse()));

      if(startDate.getTime() > lastDate.getTime()){
        Status = "failure";
      }
      else{
        var resultList = [];
        var currentDate = startDate;

        //loops through the dates adding the announcement to the bulletin days
        while (currentDate.getTime() <= lastDate.getTime()){
          bulletin = addToDate_(announcement, currentDate.getTime() , bulletin);
          if(bulletin.success){
            resultList.push("success");
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        //If the announcement wasn't sucessfully added to at least 1 day, mark the status failed
        if(resultList.indexOf("success")==-1){
          Status = "failure";
        }
        else{
          Status = "success";
        }
      }
    }

    //Logger.log(bulletin.bulletins);

    //If successful write back the new announcement column to the spreadsheet.
    if(Status == "success"){
      var announcementDataColumn = [];
      for(var i=0; i<bulletin.bulletins.length; i++){
        announcementDataColumn.push([bulletin.bulletins[i][3]])
      }
      //Logger.log(announcementDataColumn)
      upcoming_sheet.getRange("D3:D300").setValues(announcementDataColumn);
    }
    //update the cache to improve retreival speed.
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

/**
 * Adds the provided announcement to the stored bulletin data
 * The data must still be written back to the spreadsheet elsewhere
 */
function addToDate_(announcement, dateVal, bulletin){
  Logger.log(dateVal);
  Logger.log(new Date(dateVal));

  var bulletinRowIndex = searchingMatchForm_(bulletin.bulletins,0,bulletin.bulletinLen-1, dateVal);

  Logger.log("bulletinRowIndex: "+ bulletinRowIndex);
  if(bulletinRowIndex == -1){
    bulletin.success = false;
    return bulletin;
  }
  else{
    bulletin.bulletins[bulletinRowIndex][3] = (bulletin.bulletins[bulletinRowIndex][3] +"\n\n"+ announcement).trim();
    bulletin.success = true;
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


/** 
 * Makes an ordered and formatted string out of the response object
 * used to make the emails straightfoward and easy to read
 */
function toString_(obj){
  const order = ["What would you like to do?",
                 "Would you like to add, remove, or edit the event?",
                 "Which calendar should the event be on?",
                 "What is the event title?",
                 "When does the event start?",
                 "When does the event end?",
                 "Optional: If you are editing the event, what change would you like to make?",
                 "Would you like to add an announcement for the event as well?",
                 "Enter the announcement EXACTLY as you want it to appear in the daily bulletin.",
                 "Should the announcement appear on multiple days?",
                 "What day should it be in the Daily Bulletin?",
                 "What day should it start appearing in the daily bulletin?",
                 "What day is the last day it should appear in the daily bulletin?",
                 "What is the announcement that you would like to change or remove? Please copy the text straight from the daily bulletin.",
                 "On what date does it first appear?",
                 "Does it appear on multiple daily bulletins?",
                 "Would you like to remove it or change it?",
                 "If you answered change it, what would you like to change it too?",
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
    Logger.log("Key "+i+": "+obj[keys[i]]);
    if(obj[keys[i]] != null){
      string += "    <b>" + keys[i] + ":</b>   " + obj[keys[i]] + "<br>";
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








