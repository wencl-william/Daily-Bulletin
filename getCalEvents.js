function getCalEvents(dateStr) {
  var calStart = new Date()//Date.parse(dateStr));
  calStart.setHours(0);
  calStart.setMinutes(0);
  var calOneWeek = new Date(calStart.getTime() + 5*24*60*60*1000);
  var events = CalendarApp.getCalendarById("cleveland@cleveland.k12.mn.us").getEvents(calStart, calOneWeek);
  
  var eventJsons = [];
  for(var i=0;i<events.length; i++){
    var temp = {extendedProps:{}};
    temp.title = events[i].getTitle();
    temp.id = events[i].getId();
    try{temp.start = events[i].getStartTime().getTime();}catch(e){temp.start = null;}
    try{temp.end = events[i].getEndTime().getTime();}catch(e){temp.end = null;}
    try{temp.extendedProps.location = events[i].getLocation();}catch(e){temp.extendedProps.location = "";}
    try{temp.extendedProps.description = events[i].getDescription();}catch(e){temp.extendedProps.description = "";}
    eventJsons.push(temp);
  }

  return JSON.stringify(eventJsons);

}