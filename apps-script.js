// Freedom Lab - Form to Google Sheets
// Paste this into Google Apps Script (Extensions > Apps Script) on the spreadsheet

const scriptProp = PropertiesService.getScriptProperties()

function initialSetup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  scriptProp.setProperty('key', activeSpreadsheet.getId())
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.tryLock(10000)

  try {
    const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'))
    
    // Determine which sheet to use based on the 'formType' parameter
    const sheetName = e.parameter['formType'] || 'Hackerspace Waitlist'
    const sheet = doc.getSheetByName(sheetName)
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 'result': 'error', 'error': 'Sheet not found: ' + sheetName }))
        .setMimeType(ContentService.MimeType.JSON)
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    const nextRow = sheet.getLastRow() + 1

    const newRow = headers.map(function(header) {
      if (header === 'Date') return new Date()
      return e.parameter[header] || ''
    })

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow])

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  finally {
    lock.releaseLock()
  }
}
