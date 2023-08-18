/**
 * The purpose of the code within this file is to set the daily bulletin up 
 * for the new school year. Detailed instructions on how to complete that 
 * setup can be found under the Yearly Setup section of this document. The 
 * file has 2 executable functions (fill_bulletin_days_School_Year & 
 * load_birthdays) and many helper functions.
 */

/*Global Varibles For Setup*/

const School_Start_Date = new Date(Date.parse("9-05-2023"));
const School_End_Date = new Date(Date.parse("05-30-2024"));




/** This Code Is Commented to avoid accedental executions. Uncomment when needed**/
// /**
//  * This function takes the start and end dates and appends a new row to the 
//  * Bulletin_Data sheet for each weekday between those dates. The only data 
//  * that the new row contains is the date the row is for. 
//  */
// function fill_bulletin_days_School_Year(){
//   var endOfBulletinsMS =  School_End_Date.getTime(); //Convert the end date to value in milliseconds

//   //opens the Bulletin_Data Spreadsheet
//   var ss = SpreadsheetApp.getActiveSpreadsheet();
//   var upcoming_sheet = ss.getSheetByName("Bulletin_Data");

//   var currentDay = School_Start_Date; //Starts Making bulletins from the start of school

//   while(currentDay.getTime() < endOfBulletinsMS){
//     if(currentDay.getDay() >=1 && currentDay.getDay() <= 5){ //Doesn't Create bulletins for sunday (day 0) or Saturday (day 6)
//       upcoming_sheet.appendRow([(currentDay.getMonth()+1)+"/"+currentDay.getDate()+"/"+currentDay.getFullYear()]);
//     }
//     currentDay.setDate(currentDay.getDate()+1);//increment the "current" date
//     //Logger.log(currentDay);
//   }
// }
/*************************************************************************************/

/**
 * It loads in the data in the Birthday_Data spreadsheet and all the filled 
 * in dates on the Bulletin_Data spreadsheet. First it sorts out summer birthdays.
 * Then it checks all the remaining birthdays against the list of bulletin dates
 * and places any birthday on its matching date. Birthdays that don’t match are 
 * placed on the first bulletin date after they happened. Summer birthdays are 
 * converted to their half birthdays, labeled, and then have the same process 
 * applied to them. After all the birthdays are placed the data is written back
 * to the spreadsheet. 
 */
function load_birthdays(){

  //Load Bulletin_Data Spreadsheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var upcoming_sheet = ss.getSheetByName("Bulletin_Data");

  //Retrieves Bulletin Data
  var bulletins = upcoming_sheet.getRange("A3:C300").getDisplayValues(); //Make Sure the Sheet is this big
  var bulletinLen = 0;
  
  //Filters Bulletin data to filled rows and converts the text dates to date objects
  for(var i =0 ; i <bulletins.length; i++){
    if(bulletins[i][0] != ""){
      bulletins[i][0] = Date.parse(bulletins[i][0]);
      bulletinLen++;
    }
  }

  var summerBirthday = [];
  var weekendBirthday = [];

  //Retrieve the birthdays data
  /* sheet has columns: [ Last Name | First Name | Grade | Birthdate ]*/
  var birthday_sheet = ss.getSheetByName("Birthday_Data");
  var birthdayData = birthday_sheet.getRange("A2:D1000").getDisplayValues(); //Make Sure the Sheet is this big
  
  //Loops over birthdays
  for(var i =0 ; i <birthdayData.length; i++){
    if(birthdayData[i][0] != ""){//i is row 0 is column

      //Creates a string of the form John Smith- Grade 1
      var nameStr = capFirstLetter_(birthdayData[i][1]) + " " + capFirstLetter_(birthdayData[i][0]).slice(0,1)
                      + "- " + codeToGrade_(birthdayData[i][2]) 

      var dateStr = birthdayData[i][3];

      if(isDuringSchoolYear_(new Date(Date.parse(dateStr)))){

        // changes birthdays to the current year to compare with the dates in the bulletins
        dateStr = convertToCurrentYearValue_(dateStr);
        var dateVal = Date.parse(dateStr);
        //Logger.log(dateStr + " Placing Student: " + nameStr);

        //searches the bulletin data dates to check for matches
        var bulletinRowIndex = searchingMatch_(bulletins,0,bulletinLen-1, dateVal);

        if(bulletinRowIndex == -1){
          //if no match add it to the weekend birthday list to process later
          weekendBirthday.push({dateVal:dateVal, name:nameStr});
          //Logger.log("not found");
        }
        else{
          //Logger.log("found");
          //adds the birthday kid to the copy of the bulletin data for their birthday
          bulletins[bulletinRowIndex][2] = bulletins[bulletinRowIndex][2] + nameStr + "\n";
        }

      }
      else{
        //adds summer birthdays to a list to be processed later
        summerBirthday.push({dateVal:Date.parse(convertToCurrentYear_Summer_(dateStr)), name:nameStr});
       // Logger.log(dateStr + " Summer Student: " + nameStr);
      }
    }
  }

  //Logger.log(bulletins);
  // Group weekend birthdays by date for quicker processing
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


  //add summer birthdays to their half birthday
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

  /* ****** write data to sheet. ****** */
  //seperate the column of birthday data out so that its the only column that is edited
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
  else if (code == "EE"){return "PreK"}
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








