/**
 * This file contains all the functions needed to handle the addition 
 * and moderation of new calendar events. It has two access point. The
 * first is handleCalendar Addition_ which is called from Form Submission 
 * Handler.gs when someone requests a new event be added. The second is 
 * onApprovalFormTriggerSubmit which is triggered when someone submits a
 * response to the Daily Bulletin Events Approval Google Form. 
 */

const Daily_Bulletin_Cal_Approval_FormId = "1XFaQ7kak6_3KpsLUclGKjJxbqATq8o_3h-OOzT5DORA";


function handleCalendarAddition_(formResponse, items) {
  try{
    let email = formResponse.getRespondentEmail();
    console.log("Submited by: "+email);

    //Get form data into variables
    let calendarRequested = processSelectedCalendar_(formResponse, items);
    let eventName = formResponse.getResponseForItem(items.eventTitle).getResponse();
    let eventStart = formatDateString(formResponse.getResponseForItem(items.eventStart).getResponse());
    let eventEnd = formatDateString(formResponse.getResponseForItem(items.eventEnd).getResponse());
    let eventExtra;
    try{
      eventExtra = formResponse.getResponseForItem(items.eventExtra).getResponse();
    } catch(e){ eventExtra = "" };
    
    
    if(calendarRequested == "School & Community"){
      //Add events going to our public calendar to a moderated form for approval
      let approvalForm = FormApp.openById(Daily_Bulletin_Cal_Approval_FormId );

      console.info("Question is being created.");

      let modEmailBody = email + ' submitted a response to the "Daily Bulletin Add/Edit/Delete" google form. They requested to an event be added to the google calendar. <br><br>Use the linked google form to approve or reject their request: https://forms.gle/yrdZTqJ5j73keusX8. Their request is also shown below for your convenience.<br><br>';

      let question = approvalForm.addMultipleChoiceItem();
      question.setChoiceValues(["Approve", "Approve - I will manually add this event", "Reject", "Ignore for now"]);
      question.setTitle(calendarRequested + ": " + eventName);
      
      question.setHelpText("From "+eventStart +" to "+eventEnd+". Submitted by: "+email + ". They included the additional information: "+eventExtra);

      modEmailBody += "<b>Which calendar should the event be on?: </b>" + calendarRequested + "<br>";
      modEmailBody += "<b>What is the event title?: </b>" +eventName+"<br>";
      modEmailBody += "<b>When does the event start?: </b>"+ eventStart + "<br>";
      modEmailBody += "<b>When does the event end?: </b>" + eventEnd + "<br>";
      modEmailBody += "<b>Optional: If you are editing the event, what change would you like to make?: </b>" + eventExtra +"<br>"
      

      console.info("Question Has Been Created. Sending Email");

      //email moderators the request to approve or reject
      let modEmailSubject = "Daily Bulletin Form: Add Event";

      MailApp.sendEmail({to:Emails, subject:modEmailSubject, htmlBody: modEmailBody});
      return "success";
    }
    else{
      //add staff calendar events straight to calendar
      let data = {};
      data.calendarRequested = calendarRequested;
      data.eventName = eventName;
      data.eventStart = eventStart;
      data.eventEnd = eventEnd;
      addToCalendar_(data);
      return "success";

    }

  }catch(e){
    console.warn(e);
    return "failure";  
  }
}

/**
 * Shortens the calendar name to its expected name
 */
function processSelectedCalendar_(formResponse, items){
  let calResponse =  formResponse.getResponseForItem(items.eventCalendar).getResponse();

  if(calResponse.search("School & Community Public Calendar") != -1){
    calResponse = "School & Community";
  }

  return calResponse
}

function formatDateString(datestr){
  var date = datestr.split(" ")[0];
  var time = datestr.split(" ")[1];

  var dateSplit = date.split("-");
  var date = dateSplit[1] + "/"+dateSplit[2]+"/"+dateSplit[0];

  return date + " " + time;
}


/** Approval Form **/
// function addFormTrigger(){
//   let approvalForm = FormApp.openById(Daily_Bulletin_Cal_Approval_FormId );

//   ScriptApp.newTrigger("onApprovalFormTriggerSubmit").forForm(approvalForm).onFormSubmit().create()

// }


/**
 * These functions handle the approval form responses. For any accepted events 
 * it adds them to the events calendar. For rejected events and events that 
 * are going to be manually added it just removes them from the form.
 */
function onApprovalFormTriggerSubmit(event){
  try{onApprovalFormSubmit_(event)}catch(e){
    try{
      MailApp.sendEmail("wencl.william@isd391.org", "Daily Bulletin Event Approval Error", JSON.stringify(event, null, 4)+" \n\n "+JSON.stringify(e,null,4)) 
      MailApp.sendEmail({to:Emails, subject: "Error - Daily Bulletin Form: Add Event", htmlBody: "There was an error processing the approval form. Please ensure that the event was posted as expected. If not try to approve it again in a few minutes. If the error persists, please manually add the event and contact the Tech office. <br><br>Approval form: https://forms.gle/yrdZTqJ5j73keusX8"});
    }catch(e){
      MailApp.sendEmail("wencl.william@isd391.org", "Daily Bulletin Event Approval Error",event+" \n\n "+e)
      MailApp.sendEmail({to:Emails, subject: "Error - Daily Bulletin Form: Add Event", htmlBody: "There was an error processing the approval form. Please ensure that the event was posted as expected. If not try to approve it again in a few minutes. If the error persists, please manually add the event and contact the Tech office. <br><br>Approval form: https://forms.gle/yrdZTqJ5j73keusX8"});
    }
    throw e
  }
}
function onApprovalFormSubmit_(formResponse){
  let approvalForm = FormApp.openById(Daily_Bulletin_Cal_Approval_FormId );

  let approveList = [];

  let itemResponses = formResponse.response.getItemResponses();
  let item = null;
  for(let i=0; i< itemResponses.length; i++){
    item = itemResponses[i];
    if(item.getResponse() == "Approve"){
      item = item.getItem();
      approveList.push({title:item.getTitle(), helpText: item.getHelpText()});
      approvalForm.deleteItem(item);
    }
    else if(item.getResponse() == "Reject"){
      item = item.getItem();
      approvalForm.deleteItem(item);
    }
    else if(item.getResponse() == "Approve - I will manually add this event"){
      item = item.getItem();
      approvalForm.deleteItem(item);
    }
  }
  approveAllOnList_(approveList);
  Logger.log("Complete");
}

function approveAllOnList_(list){
  for(let i=0; i<list.length;i++){
    let data = extractData_(list[i])
    addToCalendar_(data)
  }
}

function extractData_(itemData){
  var data = {};//data object to fill

  var title =  itemData.title.split(":"); //Splits "Staff Only: test" into ["Staff Only", " test"]
  data.calendarRequested = title[0].trim();
  data.eventName = title[1].trim();

  //From 05/04/2023 03:40 to 05/04/2023 04:30. Submitted by: webmaster@isd391.org. They included the additional information: 
  const regx = /From (?<startDate>\d?\d[/]\d?\d[/]\d\d\d\d \d?\d:\d\d) to (?<endDate>\d?\d[/]\d?\d[/]\d\d\d\d \d?\d:\d\d)./i;
  var helpTextSplit = itemData.helpText.match(regx);
  console.log(helpTextSplit);
  if(helpTextSplit != null){

      data.eventStart = helpTextSplit[1];
      data.eventEnd = helpTextSplit[2];
  }
  else{
    throw "helpText splitting error"
  }
  


  return data
}


function addToCalendar_(itemData){
  var calendar = getCalendar_(itemData.calendarRequested);

  let startSplit = itemData.eventStart.split(" ");
  startSplit = startSplit[0].split("/");
  let startTimeZone = "CST";
  if(isDuringDaylightSavings_(startSplit[2], startSplit[0], startSplit[1]) ){
    startTimeZone = "CDT";
  }
  let startDate = new Date(itemData.eventStart + " "+startTimeZone)

  let endSplit = itemData.eventEnd.split(" ");
  endSplit = endSplit[0].split("/");
  let endTimeZone = "CST";
  if(isDuringDaylightSavings_(endSplit[2], endSplit[0], endSplit[1]) ){
    endTimeZone = "CDT";
  }
  let endDate = new Date(itemData.eventEnd + " "+endTimeZone)



  calendar.createEvent(itemData.eventName, startDate, endDate);
}

function getCalendar_(calendarRequested){
  switch (calendarRequested){
    case "School & Community": return CalendarApp.getCalendarById("c_7ueu4b0leo6otmfp8rkam08b94@group.calendar.google.com");
    case "Staff Only": return CalendarApp.getCalendarById("cleveland@cleveland.k12.mn.us");
  }
}




