// Instructions:
// 1. Go to Google Sheets and create a new sheet.
// 2. Add headers to the first row (A1 to D1): Name, Email, Phone, Requirements, Timestamp
// 3. Click Extensions > Apps Script
// 4. Paste this code into the editor, replacing the existing code.
// 5. Click Deploy > New Deployment.
// 6. Select Type: Web App. Execute as: Me. Who has access: Anyone.
// 7. Click Deploy, copy the Web App URL, and paste it into the `scriptURL` variable in your code.html.

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = e.parameter;
    
    sheet.appendRow([
      data.name,
      data.email,
      data.phone,
      data.requirements,
      new Date().toLocaleString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': error }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
