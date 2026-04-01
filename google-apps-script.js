/**
 * ====================================================
 * TrueLyfe Waitlist — Google Apps Script
 * ====================================================
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://sheets.google.com and create a new Google Sheet
 * 2. Name it "TrueLyfe Waitlist"
 * 3. In Row 1, add these headers:
 *    A1: Timestamp
 *    B1: Name
 *    C1: Email
 *    D1: Phone
 *    E1: Age Bracket
 * 
 * 4. Click Extensions → Apps Script
 * 5. Delete any existing code in Code.gs
 * 6. Paste ALL the code below (starting from the doPost function)
 * 7. Click Save (💾)
 * 8. Click Deploy → New Deployment
 * 9. Click the gear icon → Select "Web app"
 * 10. Set:
 *     - Description: "TrueLyfe Waitlist"
 *     - Execute as: "Me"
 *     - Who has access: "Anyone"
 * 11. Click Deploy
 * 12. Authorize the app when prompted (click through the warnings)
 * 13. Copy the Web app URL
 * 14. Paste it in index.js where it says YOUR_GOOGLE_APPS_SCRIPT_URL_HERE
 * 
 * ====================================================
 */

function doPost(e) {
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var data = JSON.parse(e.postData.contents);

        sheet.appendRow([
            new Date(),          // Timestamp
            data.name || '',     // Name
            data.email || '',    // Email
            data.phone || '',    // Phone
            data.age || ''       // Age Bracket
        ]);

        // Return the updated count after adding the new row
        var count = Math.max(0, sheet.getLastRow() - 1); // minus header row

        return ContentService
            .createTextOutput(JSON.stringify({ status: 'success', count: count }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * GET endpoint — returns the current waitlist signup count.
 * Called by the frontend on page load to show a live counter.
 * URL: your-deployment-url?action=count
 */
function doGet(e) {
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var count = Math.max(0, sheet.getLastRow() - 1); // minus header row

        return ContentService
            .createTextOutput(JSON.stringify({ status: 'success', count: count }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ status: 'error', count: 0, message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
