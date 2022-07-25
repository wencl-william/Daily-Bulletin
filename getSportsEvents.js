










function getSportsEvents(dateStr){
  var events = CalendarApp.getCalendarById('c_7ueu4b0leo6otmfp8rkam08b94@group.calendar.google.com').getEventsForDay(new Date(Date.parse(dateStr)));
  var eventJsons =[];

  for(var i =0; i<events.length; i++){
    if(events[i].getTag("sports") != null){
      eventJsons.push({title:events[i].getTitle(), location:events[i].getLocation().replace("Clevland Public School CPS - ","").replace("Clevland Public School", "Home"), description:events[i].getDescription(), time:events[i].getStartTime().toLocaleTimeString('en-US',{hour:"numeric", minute:"numeric"})})   ;
    }
  }
  return eventJsons
}
