function archive_bulletins() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var upcoming_sheet = ss.getSheetByName("Bulletin_Data");
  var archive_sheet = ss.getSheetByName("Archived_Bulletins");

  var today = new Date();
  today = today.setDate(today.getDate()-1);
  help_archiving_bulletins_(upcoming_sheet, archive_sheet, today);
}
function help_archiving_bulletins_(upcoming_sheet, archive_sheet, today){
  var range = upcoming_sheet.getRange("A3:D3");
  var date = range.getDisplayValue();
  if(Date.parse(date) < today){
    archive_sheet.insertRows(3);
    archive_sheet.getRange("A3:D3").setValues(range.getValues()); 
    //archive_sheet.appendRow(range.getValues()[0]);
    range.deleteCells(SpreadsheetApp.Dimension.ROWS);
    help_archiving_bulletins_(upcoming_sheet, archive_sheet, today);
    Utilities.sleep(500);
  }
}



