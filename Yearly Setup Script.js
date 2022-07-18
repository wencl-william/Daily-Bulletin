/*Globals*/

const School_Start_Date = new Date(Date.parse("9-06-2022"));
const School_End_Date = new Date(Date.parse("06-02-2023"));

/* This Code Is Commented to avoid accedental executions. Uncomment when needed*/

// function fill_bulletin_days_School_Year(){
//   var endOfBulletinsMS =  School_End_Date.getTime();

//   //opens the Bulletin_Data Spreadsheet
//   var ss = SpreadsheetApp.getActiveSpreadsheet();
//   var upcoming_sheet = ss.getSheetByName("Bulletin_Data");

//   var currentDay = School_Start_Date; //Starts Making bulletins from the start of school

//   while(currentDay.getTime() < endOfBulletinsMS){
//     if(currentDay.getDay() >=1 && currentDay.getDay() <= 5){ //Doesn't Create bulletins for sunday (day 0) or Saturday (day 6)
//       upcoming_sheet.appendRow([(currentDay.getMonth()+1)+"/"+currentDay.getDate()+"/"+currentDay.getFullYear()]);
//     }
//     currentDay.setDate(currentDay.getDate()+1);
//     Logger.log(currentDay);
//   }
// }


function load_birthdays(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var upcoming_sheet = ss.getSheetByName("Bulletin_Data");
  var bulletins = upcoming_sheet.getRange("A3:C300").getDisplayValues(); //Make Sure the Sheet is this big
  var bulletinLen = 0;
  for(var i =0 ; i <bulletins.length; i++){
    if(bulletins[i][0] != ""){
      bulletins[i][0] = Date.parse(bulletins[i][0]);
      bulletinLen++;
    }
  }

  var summerBirthday = [];
  var weekendBirthday = [];

  /* sheet has columns: [ Last Name | First Name | Grade | Birthdate ]*/
  var birthday_sheet = ss.getSheetByName("Birthday_Data");
  var birthdayData = birthday_sheet.getRange("A2:D1000").getDisplayValues(); //Make Sure the Sheet is this big
  for(var i =0 ; i <birthdayData.length; i++){
    if(birthdayData[i][0] != ""){//i is row 0 is column

      var nameStr = capFirstLetter_(birthdayData[i][1]) + " " + capFirstLetter_(birthdayData[i][0]).slice(0,1)
                      + "- " + codeToGrade_(birthdayData[i][2]) //Creates a string of the form John Smith- Grade 1

      var dateStr = birthdayData[i][3];
      if(isDuringSchoolYear_(new Date(Date.parse(dateStr)))){
        dateStr = convertToCurrentYearValue_(dateStr);
        var dateVal = Date.parse(dateStr);
        //Logger.log(dateStr + " Placing Student: " + nameStr);

        var bulletinRowIndex = searchingMatch_(bulletins,0,bulletinLen-1, dateVal);

        if(bulletinRowIndex == -1){
          weekendBirthday.push({dateVal:dateVal, name:nameStr});
          //Logger.log("not found");
        }
        else{
          //Logger.log("found");
          bulletins[bulletinRowIndex][2] = bulletins[bulletinRowIndex][2] + nameStr + "\n";
        }

      }
      else{
        summerBirthday.push({dateVal:Date.parse(convertToCurrentYear_Summer_(dateStr)), name:nameStr});
       // Logger.log(dateStr + " Summer Student: " + nameStr);
      }
    }
  }

  //Logger.log(bulletins);

  var weekendDates = consolidateDates_(weekendBirthday);
  //Logger.log(weekendDates);

  //add weekend dates to following monday
  for(var i=0; i<weekendDates.length; i++){
    //Logger.log(weekendDates[i].dateVal + "   "+weekendDates[i].names);
    var bulletinIndex = searchingNearest_(bulletins, 0, bulletinLen-1, weekendDates[i].dateVal);
    bulletins[bulletinIndex][2] = bulletins[bulletinIndex][2] +"\n" + toDateString_(weekendDates[i].dateVal) + " Birthdays:\n";
    for(var j=0; j<weekendDates[i].names.length; j++){
      //Logger.log("individual name: "+weekendDates[i].names[j])
      bulletins[bulletinIndex][2] = bulletins[bulletinIndex][2] + weekendDates[i].names[j] + "\n";
    }
  }
  Logger.log(bulletins)


  //add summer
  var summerDates = consolidateDates_(summerBirthday);
  for(var i=0; i<summerDates.length; i++){
    var halfBirthday = toHalfBirthdayDate_(summerDates[i].dateVal);
    Logger.log(new Date(halfBirthday))
    var bulletinIndex = searchingNearest_(bulletins, 0, bulletinLen-1, halfBirthday);
    bulletins[bulletinIndex][2] = bulletins[bulletinIndex][2] +"\n" + toDateString_(summerDates[i].dateVal) + " Half-Birthdays:\n";
    for(var j=0; j<summerDates[i].names.length; j++){
      //Logger.log("individual name: "+summerDates[i].names[j])
      bulletins[bulletinIndex][2] = bulletins[bulletinIndex][2] + summerDates[i].names[j] + "\n";
    }
  }

  printArrayItems_(bulletins);

  //write data to sheet.

  var happyBirthdayDataColumn = [];
  for(var i=0; i<bulletins.length; i++){
    happyBirthdayDataColumn.push([bulletins[i][2]])
  }
  //Logger.log(happyBirthdayDataColumn)
  upcoming_sheet.getRange("C3:C300").setValues(happyBirthdayDataColumn);   //.getRange("A2:D1000")
}

function printArrayItems_(array){
  for(var i=0; i<array.length; i++){
    Logger.log(array[i]);
  }
}

function toDateString_(dateVal){
  var date = new Date(dateVal);
  return date.getMonth()+1 + "/" + date.getDate();
}

function capFirstLetter_(word){
  const specialChars = [" ", "-", "'"];
  
  word = word.trim();

  try{
    for(var j = 0; j<specialChars.length; j++){
      index = word.indexOf(specialChars[j]);
      if(index != -1){
        return word[0].toUpperCase() + word.slice(1,index+1).toLowerCase()+word[index+1].toUpperCase() + word.slice(index+2).toLowerCase();
      }
    }
  }catch(e){Logger.log("Error Caught & Only first letter capitalized. "+e)}
 
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

function convertToCurrentYearValue_(stringDate){/*format mm-dd-yyyy*/
var date = new Date(Date.parse(stringDate));
  var year;
  if(date.getMonth() > 6){
    year = School_Start_Date.getFullYear();
  }
  else{
    year = School_End_Date.getFullYear();
  }

  return stringDate.slice(0,-4) + year;
}

function convertToCurrentYear_Summer_(stringDate){/*format mm-dd-yyyy*/
var date = new Date(Date.parse(stringDate));
  var year;
  if(date.getMonth() <= 5){ //getMonth retuns month index 0 - 11 not  1 - 12 so june is 5
    year = School_Start_Date.getFullYear();
  }
  else{
    year = School_End_Date.getFullYear();
  }

  return stringDate.slice(0,-4) + year;
}

function toHalfBirthdayDate_(dateVal){
  var date = new Date(dateVal); 
  var dateStr = ((date.getMonth() + 6)%12 + 1) +"/"//getMonth retuns month index 0 - 11 not  1 - 12
  dateStr += (date.getDate() + "/" + date.getFullYear());
  return Date.parse(dateStr);
}

function codeToGrade_(code){
  if(code == "KG" || code == "HK"){return "Kindergarten"}
  else if (code == "EC"){return "PreK"}
  else {return "Grade " + code}
}


function searchingMatch_(array, start, end, val){
  if(start > end){
    return -1 //not found
  }

  var middle = Math.floor((start + end)/2);
  //Logger.log("Length: "+array.length+"\nStart: "+start+"\nEnd: "+end+"\nMiddle: "+middle+"\nval: "+val+"\nMiddle Val: "+array[middle]);

  if(val < array[middle][0]){
    return searchingMatch_(array, start, middle - 1, val);
  }
  else if (array[middle][0] < val){
    return searchingMatch_(array, middle + 1, end, val);
  }
  else{
    return middle;
  }
}


function searchingNearest_(array, start, end, val){
  if(Math.abs(start - end) == 1){
    if(val > array[start][0]){
      return start + 1; //return index 1 above for next largest number
    }
    else{
      return start
    }
  }

  var middle = Math.floor((start + end)/2);
  //Logger.log("Length: "+array.length+"\nStart: "+start+"\nEnd: "+end+"\nMiddle: "+middle+"\nval: "+val+"\nMiddle Val: "+array[middle]);

  if(val < array[middle][0]){
    return searchingNearest_(array, start, middle, val);
  }
  else if (array[middle][0] < val){
    return searchingNearest_(array, middle, end, val);
  }
  else{
    return middle;
  }
}



function isDuringSchoolYear_(date){
  var startMonth = School_Start_Date.getMonth();
  var endMonth = School_End_Date.getMonth();
  var month = date.getMonth();

  if(month > startMonth || month < endMonth){
    return true;
  }
  else if(month == startMonth){
    return date.getDate() > School_Start_Date.getDate();
  }
  else if(month == endMonth){
    return date.getDate() < School_End_Date.getDate();
  }
  else{
    return false;
  }
}

function consolidateDates_(arrayOfData){
  var consolidatedDateArray = [];
  for(var i=0; i< arrayOfData.length;i++){
    var j = 0;
    var added = false;
    while(!added && j<consolidatedDateArray.length){
      if(consolidatedDateArray[j].dateVal == arrayOfData[i].dateVal){
        consolidatedDateArray[j].names.push(arrayOfData[i].name);
        added = true;
      }
      j++;
    }
    if(!added){
      consolidatedDateArray.push({dateVal:arrayOfData[i].dateVal, names:[arrayOfData[i].name]});
    }
  }

  return consolidatedDateArray
}








