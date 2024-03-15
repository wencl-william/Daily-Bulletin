/**
 * These functions run nightly from 3am-4am to remove the previous days bulletin.
 * It takes the old data from the bulletin_data sheet and copies it to the top of the 
 * archive sheet to store for future reference.
 */

function archive_bulletins() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var upcoming_sheet = ss.getSheetByName("Bulletin_Data");
  var archive_sheet = ss.getSheetByName("Archived_Bulletins");

  var today = new Date();
  today = today.setDate(today.getDate()-1);
  help_archiving_bulletins_(upcoming_sheet, archive_sheet, today);
}
function help_archiving_bulletins_(upcoming_sheet, archive_sheet, today){
  var range = upcoming_sheet.getRange("A3:G3"); //gets first row of the bulletin data
  var date = range.getDisplayValue();
  if(Date.parse(date) < today){ //if its from the past archive it
    archive_sheet.insertRows(3); //add row at the top of the archive sheet
    archive_sheet.getRange("A3:G3").setValues(range.getValues()); //copy values from the bulletin data sheet to the archive sheet
    //archive_sheet.appendRow(range.getValues()[0]);
    range.deleteCells(SpreadsheetApp.Dimension.ROWS); //remove top data row from the goole sheet
    Birthdays.addToArchivedDays(date);

    help_archiving_bulletins_(upcoming_sheet, archive_sheet, today); //recursive call to check the next row as well
    Utilities.sleep(500);
  }
}



