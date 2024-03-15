/**
 * The purpose of the code within this file is to set the daily bulletin up 
 * for the new school year. Instructions on how to complete that setup 
 * can be found below and under the Yearly Setup section of the Daily Bulletin Documentation 
 * at https://github.com/wencl-william/Documentation/blob/main/Daily%20Bulletin/Daily%20Bulletin.pdf. 
 * The file has 1 executable functions (Yearly_Setup_Script_Run_This_Each_Summer) and a helper function.
 */


/**
 *   ░██████╗████████╗███████╗██████╗░  ░░███╗░░
 *   ██╔════╝╚══██╔══╝██╔════╝██╔══██╗  ░████║░░
 *   ╚█████╗░░░░██║░░░█████╗░░██████╔╝  ██╔██║░░
 *   ░╚═══██╗░░░██║░░░██╔══╝░░██╔═══╝░  ╚═╝██║░░
 *   ██████╔╝░░░██║░░░███████╗██║░░░░░  ███████╗
 *   ╚═════╝░░░░╚═╝░░░╚══════╝╚═╝░░░░░  ╚══════╝
 *   
 * Step 1:
 * Make sure the "Bulletin_Data" page of the Daily Bulletin SpreadSheet  
 * contains only the 2 header rows. It should otherwise be empty. 
 * 
 * Note: It is fine if the other pages/sheets still contain data.
 */


/**
 * 
 *   ░██████╗████████╗███████╗██████╗░  ██████╗░
 *   ██╔════╝╚══██╔══╝██╔════╝██╔══██╗  ╚════██╗
 *   ╚█████╗░░░░██║░░░█████╗░░██████╔╝  ░░███╔═╝
 *   ░╚═══██╗░░░██║░░░██╔══╝░░██╔═══╝░  ██╔══╝░░
 *   ██████╔╝░░░██║░░░███████╗██║░░░░░  ███████╗
 *   ╚═════╝░░░░╚═╝░░░╚══════╝╚═╝░░░░░  ╚══════╝
 *
 * Step 2:
 * Set the dates below to match the upcoming school year
 */
/*Global Varibles For Setup*/
const School_Start_Date ="09-05-2023";
const School_End_Date = "05-30-2024";


/**
 * 
 *   ░██████╗████████╗███████╗██████╗░  ██████╗░
 *   ██╔════╝╚══██╔══╝██╔════╝██╔══██╗  ╚════██╗
 *   ╚█████╗░░░░██║░░░█████╗░░██████╔╝  ░█████╔╝
 *   ░╚═══██╗░░░██║░░░██╔══╝░░██╔═══╝░  ░╚═══██╗
 *   ██████╔╝░░░██║░░░███████╗██║░░░░░  ██████╔╝
 *   ╚═════╝░░░░╚═╝░░░╚══════╝╚═╝░░░░░  ╚═════╝░
 *
 * Step 3: 
 * Run the below function. This is done by making sure it is selected in the dropdown
 * menu in the bar at the top of the window and clicking "run". 
 * 
 * This function populates all the bulletin dates for the upcoming school year. 
 * 
 * Birthdays are automatically added and updated each night. 
 */

function Yearly_Setup_Script_Run_This_Each_Summer (){
 // Birthdays.setYearData({sheetId:SpreadsheetApp.getActiveSpreadsheet().getId(), startDate:School_Start_Date, endDate:School_End_Date});

  //fill_bulletin_days_School_Year_();
}


/**
 * 
 *   ░██████╗████████╗███████╗██████╗░  ░░██╗██╗
 *   ██╔════╝╚══██╔══╝██╔════╝██╔══██╗  ░██╔╝██║
 *   ╚█████╗░░░░██║░░░█████╗░░██████╔╝  ██╔╝░██║
 *   ░╚═══██╗░░░██║░░░██╔══╝░░██╔═══╝░  ███████║
 *   ██████╔╝░░░██║░░░███████╗██║░░░░░  ╚════██║
 *   ╚═════╝░░░░╚═╝░░░╚══════╝╚═╝░░░░░  ░░░░░╚═╝
 * 
 * Step 4:
 * Go through and delete the rows in the spreadshet for days there is no school.
 * Weekends are automatically excluded, so this is only for breaks and random days off
 */


/**
 * 
 *   ██████╗░░█████╗░███╗░░██╗███████╗
 *   ██╔══██╗██╔══██╗████╗░██║██╔════╝
 *   ██║░░██║██║░░██║██╔██╗██║█████╗░░
 *   ██║░░██║██║░░██║██║╚████║██╔══╝░░
 *   ██████╔╝╚█████╔╝██║░╚███║███████╗
 *   ╚═════╝░░╚════╝░╚═╝░░╚══╝╚══════╝
 */








/**
 * This function takes the start and end dates and appends a new row to the 
 * Bulletin_Data sheet for each weekday between those dates. The only data 
 * that the new row contains is the date the row is for. 
 * 
 * You do NOT need to run this one, its ran as part of the yearly setup script above
 */
function fill_bulletin_days_School_Year_(){
  var endOfBulletinsMS =   Date.parse(School_End_Date); //Convert the end date to value in milliseconds

  //opens the Bulletin_Data Spreadsheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var upcoming_sheet = ss.getSheetByName("Bulletin_Data");

  var currentDay =  new Date(Date.parse(School_Start_Date)); //Starts Making bulletins from the start of school

  while(currentDay.getTime() < endOfBulletinsMS){
    if(currentDay.getDay() >=1 && currentDay.getDay() <= 5){ //Doesn't Create bulletins for sunday (day 0) or Saturday (day 6)
      upcoming_sheet.appendRow([(currentDay.getMonth()+1)+"/"+currentDay.getDate()+"/"+currentDay.getFullYear()]);
    }
    currentDay.setDate(currentDay.getDate()+1);//increment the "current" date
    //Logger.log(currentDay);
  }
}







